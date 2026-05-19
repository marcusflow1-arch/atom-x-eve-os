// ─── TerrainArea ──────────────────────────────────────────────────────────
// Fresh start — a forest environment built from ONLY your registered assets:
//   • TREE_2  (realistic trees GLB)
//   • GRASS   (grass FBX)
//
// No rocks, no altar, no pond, no perimeter ring. Just a natural-looking
// forest with trees scattered across the playable area and grass tufts
// filling the ground.
//
// 100×100 unit area centered at origin. Spawn-clear zone keeps the player's
// start point open. Rocks / props will be added in a later pass.
//
// No colliders are registered yet — trees are treated as visual-only for
// this first pass so movement stays unrestricted while we tune the layout.

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { instantiate, preload } from './assetLoaderCache';

// Deterministic RNG so the forest layout is identical every load.
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const AREA_HALF = 50;           // 100×100 playable area
const SPAWN_CLEAR_RADIUS = 7;   // keep spawn point uncluttered
const TREE_COUNT = 70;          // dense but walkable
const GRASS_COUNT = 220;        // ground-level detail

export default function TerrainArea() {
  const groupRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    let group = null;

    const start = async () => {
      const scene = window.__gw3dScene;
      if (!scene) { setTimeout(start, 250); return; }

      preload(['TREE_2', 'GRASS']);

      group = new THREE.Group();
      group.name = 'terrain_area';
      groupRef.current = group;

      // Sample ground Y, skipping our own children so trees don't stack on trees.
      const raycaster = new THREE.Raycaster();
      const down = new THREE.Vector3(0, -1, 0);
      const sampleY = (x, z) => {
        raycaster.set(new THREE.Vector3(x, 100, z), down);
        const hits = raycaster.intersectObjects(scene.children, true);
        for (const h of hits) {
          let o = h.object, isSelf = false;
          while (o) { if (o === group) { isSelf = true; break; } o = o.parent; }
          if (!isSelf) return h.point.y;
        }
        return 0;
      };

      const r = rng(20260519);

      const place = async (assetKey, x, z, opts = {}) => {
        if (!mounted) return null;
        const obj = await instantiate(assetKey);
        const y = sampleY(x, z) + (opts.yOffset || 0);
        obj.position.set(x, y, z);
        obj.rotation.y = opts.rotY ?? r() * Math.PI * 2;
        if (opts.scaleMult) obj.scale.multiplyScalar(opts.scaleMult);
        group.add(obj);
        return obj;
      };

      // ─── TREES — scattered naturally across the area ──────────────────
      // Poisson-ish placement: keep a minimum spacing so trees don't overlap.
      const placedTrees = [];
      const MIN_TREE_DIST = 3.5;
      let attempts = 0;
      while (placedTrees.length < TREE_COUNT && attempts < TREE_COUNT * 12) {
        attempts++;
        const x = (r() * 2 - 1) * AREA_HALF;
        const z = (r() * 2 - 1) * AREA_HALF;
        // Skip spawn area
        if (x * x + z * z < SPAWN_CLEAR_RADIUS * SPAWN_CLEAR_RADIUS) continue;
        // Spacing check
        let tooClose = false;
        for (const p of placedTrees) {
          const dx = p[0] - x, dz = p[1] - z;
          if (dx * dx + dz * dz < MIN_TREE_DIST * MIN_TREE_DIST) { tooClose = true; break; }
        }
        if (tooClose) continue;
        placedTrees.push([x, z]);
        place('TREE_2', x, z, { scaleMult: 0.75 + r() * 0.6 });
      }

      // ─── GRASS — dense ground detail across the whole area ────────────
      for (let i = 0; i < GRASS_COUNT; i++) {
        const x = (r() * 2 - 1) * AREA_HALF;
        const z = (r() * 2 - 1) * AREA_HALF;
        place('GRASS', x, z, { scaleMult: 0.5 + r() * 0.9 });
      }

      if (!mounted) {
        scene.remove(group);
        return;
      }

      scene.add(group);
      // No colliders this pass — rocks & solid props come next.
      window.__terrainColliders = [];
    };

    start();

    return () => {
      mounted = false;
      const scene = window.__gw3dScene;
      if (scene && group) scene.remove(group);
      window.__terrainColliders = [];
    };
  }, []);

  return null;
}