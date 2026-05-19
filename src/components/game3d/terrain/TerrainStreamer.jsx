// ─── TerrainStreamer ──────────────────────────────────────────────────────
// KOTOR-style continuous terrain streaming. Watches the local player's
// position (via window.__localPlayerPos, updated each frame by GameWorld3D)
// and loads/unloads chunks of props as the player moves.
//
// Mounted as a sibling to GameWorld3D — does not modify GameWorld3D itself.
//
// Lifecycle:
//   1. Wait for window.__gw3dScene to be ready.
//   2. Every STREAM_TICK_MS:
//        - figure out current chunk
//        - any chunk within LOAD_RADIUS that isn't loaded → queue load
//        - any chunk past UNLOAD_RADIUS → dispose
//   3. On unmount → dispose all chunks + clear handlers.

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import {
  CHUNK_SIZE, LOAD_RADIUS, UNLOAD_RADIUS, ORIGIN_RADIUS,
  MAX_PARALLEL_LOADS, STREAM_TICK_MS,
} from './terrainStreamConfig';
import { generateChunkLayout, chunkOf, chunkKey } from './chunkGenerator';
import { instantiate, preload } from './assetLoaderCache';

export default function TerrainStreamer() {
  const loadedChunks = useRef(new Map()); // key → THREE.Group
  const loadingKeys = useRef(new Set());
  const intervalRef = useRef(null);
  const sceneRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    // Wait for the scene to exist (GameWorld3D mounts asynchronously).
    const tryStart = () => {
      const scene = window.__gw3dScene;
      if (!scene) {
        if (mounted) setTimeout(tryStart, 250);
        return;
      }
      sceneRef.current = scene;

      // Eagerly preload the most common assets so the first chunk pop-in is
      // instant. The bigger tree GLBs load lazily as needed.
      preload(['GRASS', 'ROCKS', 'TREE_2']);

      // Main streaming tick — runs every STREAM_TICK_MS.
      intervalRef.current = setInterval(streamTick, STREAM_TICK_MS);
      // Run once immediately so chunks appear at spawn before the first tick.
      streamTick();
    };

    const streamTick = () => {
      if (!mounted) return;
      const scene = sceneRef.current;
      const pos = window.__localPlayerPos;
      if (!scene || !pos) return;

      const { cx: pcx, cz: pcz } = chunkOf(pos.x || 0, pos.z || 0);

      // ── PHASE 1: figure out which chunks SHOULD be loaded ──────────────
      const want = new Set();
      for (let dx = -LOAD_RADIUS; dx <= LOAD_RADIUS; dx++) {
        for (let dz = -LOAD_RADIUS; dz <= LOAD_RADIUS; dz++) {
          want.add(chunkKey(pcx + dx, pcz + dz));
        }
      }
      // Origin chunks always stay loaded (spawn area never pops).
      for (let dx = -ORIGIN_RADIUS; dx <= ORIGIN_RADIUS; dx++) {
        for (let dz = -ORIGIN_RADIUS; dz <= ORIGIN_RADIUS; dz++) {
          want.add(chunkKey(dx, dz));
        }
      }

      // ── PHASE 2: queue loads for missing chunks (rate-limited) ─────────
      let slots = MAX_PARALLEL_LOADS - loadingKeys.current.size;
      for (const key of want) {
        if (slots <= 0) break;
        if (loadedChunks.current.has(key)) continue;
        if (loadingKeys.current.has(key)) continue;
        slots--;
        loadChunk(key);
      }

      // ── PHASE 3: unload chunks past UNLOAD_RADIUS ──────────────────────
      // Hysteresis: we only dispose at UNLOAD_RADIUS even though we LOAD at
      // LOAD_RADIUS — that's the KOTOR trick that prevents thrashing.
      for (const [key, group] of loadedChunks.current.entries()) {
        const [cxStr, czStr] = key.split(',');
        const cx = parseInt(cxStr, 10);
        const cz = parseInt(czStr, 10);
        // Never unload origin chunks
        if (Math.abs(cx) <= ORIGIN_RADIUS && Math.abs(cz) <= ORIGIN_RADIUS) continue;
        const distChunks = Math.max(Math.abs(cx - pcx), Math.abs(cz - pcz));
        if (distChunks > UNLOAD_RADIUS) {
          disposeChunk(key, group);
        }
      }
    };

    const loadChunk = async (key) => {
      loadingKeys.current.add(key);
      const [cxStr, czStr] = key.split(',');
      const cx = parseInt(cxStr, 10);
      const cz = parseInt(czStr, 10);

      const layout = generateChunkLayout(cx, cz);
      const group = new THREE.Group();
      const rockColliders = [];
      group.name = `chunk_${key}`;
      // Tag so we can identify these objects in dev tools / cleanup loops.
      group.userData.__terrainChunk = key;
      group.userData.__rockColliders = rockColliders;

      // Sample ground Y at each prop's footprint so trees stand on the
      // existing low-poly terrain. Falls back to y=0 if no terrain mesh hit.
      const raycaster = new THREE.Raycaster();
      const down = new THREE.Vector3(0, -1, 0);
      const sceneForY = sceneRef.current;
      const sampleY = (x, z) => {
        if (!sceneForY) return 0;
        raycaster.set(new THREE.Vector3(x, 100, z), down);
        const hits = raycaster.intersectObjects(sceneForY.children, true);
        // Pick the first hit that isn't part of any terrain chunk (to avoid
        // self-intersection on subsequent samples).
        for (const h of hits) {
          let o = h.object;
          let isChunk = false;
          while (o) { if (o.userData?.__terrainChunk) { isChunk = true; break; } o = o.parent; }
          if (!isChunk) return h.point.y;
        }
        return 0;
      };

      const normalizeRockToPlayer = (obj, scaleMult) => {
        const playerHeight = window.__gw3dPlayerHeight || 1.7;
        const targetRockHeight = playerHeight * 0.04;
        const box = new THREE.Box3().setFromObject(obj);
        const size = box.getSize(new THREE.Vector3());
        if (size.y > 0) obj.scale.multiplyScalar(targetRockHeight / size.y);
        obj.scale.multiplyScalar(scaleMult);
      };
      try {
        // Place all procedural props in parallel.
        await Promise.all(layout.props.map(async (p) => {
          const obj = await instantiate(p.assetKey);
          obj.position.set(p.x, sampleY(p.x, p.z), p.z);
          obj.rotation.y = p.rotY;
          if (p.assetKey === 'ROCKS') {
            normalizeRockToPlayer(obj, p.scaleMult);
            rockColliders.push({ x: p.x, z: p.z, radius: Math.max(0.18, (window.__gw3dPlayerHeight || 1.7) * 0.08 * p.scaleMult) });
          } else {
            obj.scale.multiplyScalar(p.scaleMult);
          }
          group.add(obj);
        }));

        // Hand-placed special scene if this chunk has one (Metroid Prime style).
        if (layout.special) {
          const special = await instantiate(layout.special);
          const sx = cx * CHUNK_SIZE + CHUNK_SIZE / 2;
          const sz = cz * CHUNK_SIZE + CHUNK_SIZE / 2;
          special.position.set(sx, sampleY(sx, sz), sz);
          group.add(special);
        }
      } catch (err) {
        console.warn(`[TerrainStreamer] chunk ${key} load failed:`, err);
      }

      // If the streamer was unmounted while we were loading, dispose right away.
      if (!mounted) {
        disposeGroup(group);
        loadingKeys.current.delete(key);
        return;
      }

      sceneRef.current?.add(group);
      loadedChunks.current.set(key, group);
      window.__gw3dRockColliders = Array.from(loadedChunks.current.values()).flatMap((g) => g.userData.__rockColliders || []);
      loadingKeys.current.delete(key);
    };

    const disposeChunk = (key, group) => {
      sceneRef.current?.remove(group);
      disposeGroup(group);
      loadedChunks.current.delete(key);
      window.__gw3dRockColliders = Array.from(loadedChunks.current.values()).flatMap((g) => g.userData.__rockColliders || []);
    };

    const disposeGroup = (group) => {
      // Only dispose geometries; materials/textures are shared from the cache
      // so they stay in memory for fast re-loads of returning chunks.
      group.traverse((n) => {
        if (n.isMesh && n.geometry && n.geometry.userData.__cloned !== false) {
          // Geometry IS shared via .clone(true) — Object3D.clone shares it by
          // reference. Disposing it would break other chunks using the same
          // source asset. Skip geo.dispose() — let the cache own it.
        }
      });
    };

    tryStart();

    return () => {
      mounted = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
      // Tear down every loaded chunk.
      const scene = sceneRef.current;
      loadedChunks.current.forEach((group) => {
        scene?.remove(group);
      });
      loadedChunks.current.clear();
      loadingKeys.current.clear();
      window.__gw3dRockColliders = [];
    };
  }, []);

  return null;
}