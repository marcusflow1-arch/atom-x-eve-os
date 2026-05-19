// ─── TerrainArea ──────────────────────────────────────────────────────────
// Realistic forest biome built on top of the world's existing terrain.
//
// Design split:
//   • forestBiome.js     — defines biome zones (thicket / meadow / path /
//                          pond / rock outcrop) so the world feels varied
//                          and handcrafted, not procedurally uniform.
//   • forestPlacement.js — generates deterministic placement data
//                          (Poisson-disc trees, clustered grass, rocks
//                          embedded in the ground, ponds in clearings).
//   • TerrainArea.jsx    — this file. Loads the registered assets, places
//                          everything on the existing terrain via the
//                          world's raycaster, and registers rock colliders.
//
// Assets used (all from your existing terrainAssetRegistry):
//   • TREE_2       — realistic trees
//   • GRASS        — grass tufts
//   • ROCKS        — stylised rock collection
//   • WATER_SCENE  — water/pond
//
// The world's low-poly map already provides rolling elevation; we snap
// every prop to it via raycast (the same mechanism player feet use), so
// terrain "rolls" naturally under the forest.

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { instantiate, preload } from './assetLoaderCache';
import { generateForestPlacements } from './forestPlacement';

export default function TerrainArea() {
  const groupRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    let group = null;

    const start = async () => {
      const scene = window.__gw3dScene;
      if (!scene) { setTimeout(start, 250); return; }

      preload(['TREE_2', 'GRASS', 'ROCKS']);

      group = new THREE.Group();
      group.name = 'terrain_area';
      groupRef.current = group;

      // Sample ground Y at a point — skip our own children so trees never
      // try to stand on top of other trees.
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

      const place = async (assetKey, p) => {
        if (!mounted) return null;
        const obj = await instantiate(assetKey);
        const y = sampleY(p.x, p.z) + (p.yOffset || 0);
        obj.position.set(p.x, y, p.z);
        obj.rotation.y = p.rotY || 0;
        if (p.scaleMult) obj.scale.multiplyScalar(p.scaleMult);
        group.add(obj);
        return obj;
      };

      // ─── Generate placement data once (deterministic) ────────────────
      // Ponds intentionally not placed — see forestBiome.js note about
      // the WATER_SCENE GLTF bundle missing its sidecar .bin file.
      const { trees, grass, rocks } = generateForestPlacements();

      // ─── Trees ───────────────────────────────────────────────────────
      for (const p of trees) {
        if (!mounted) break;
        await place('TREE_2', p);
      }

      // ─── Rocks (collidable) ──────────────────────────────────────────
      const colliders = [];
      for (const p of rocks) {
        if (!mounted) break;
        await place('ROCKS', p);
        colliders.push({ x: p.x, z: p.z, r: 1.4 * (p.scaleMult || 1) });
      }

      // ─── Grass — ground detail, runs in parallel batches so we don't
      // block the main thread for too long.
      const BATCH = 30;
      for (let i = 0; i < grass.length; i += BATCH) {
        if (!mounted) break;
        const slice = grass.slice(i, i + BATCH);
        await Promise.all(slice.map((p) => place('GRASS', p)));
      }

      if (!mounted) {
        scene.remove(group);
        return;
      }

      scene.add(group);
      window.__terrainColliders = colliders;
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