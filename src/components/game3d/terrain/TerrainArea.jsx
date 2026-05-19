// ─── TerrainArea ──────────────────────────────────────────────────────────
// Realistic forest biome built from scratch.
//
//   • forestGround.js     — procedural rolling-hill ground mesh with
//                           vertex-color blending (grass / dirt / rock)
//                           and a sampleGroundY(x,z) API.
//   • forestBiome.js      — hand-tuned biome zones (thickets, meadows,
//                           paths, rocky outcrops).
//   • forestPlacement.js  — deterministic biome-aware placement of
//                           trees / grass / rocks with slope awareness
//                           and natural clustering.
//   • TerrainArea.jsx     — this file. Mounts ground + props into the
//                           live scene, snaps each prop to the
//                           heightmap, registers rock colliders.
//
// Enemies, bosses, player, and companions are untouched — they live in
// other components and freely use this terrain.

import { useEffect, useRef } from 'react';
import { instantiate, preload } from './assetLoaderCache';
import { generateForestPlacements } from './forestPlacement';
import { buildForestGround, sampleGroundY } from './forestGround';

export default function TerrainArea() {
  const groupRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    let group = null;

    const start = async () => {
      const scene = window.__gw3dScene;
      if (!scene) { setTimeout(start, 250); return; }

      preload(['TREE_2', 'GRASS', 'ROCKS']);

      // Root group lets us cleanly remove the whole forest on unmount.
      const THREE = await import('three');
      group = new THREE.Group();
      group.name = 'terrain_area';
      groupRef.current = group;

      // ─── Ground ────────────────────────────────────────────────────
      const ground = buildForestGround({ size: 220, segments: 160 });
      group.add(ground);

      // ─── Generate placement data once (deterministic) ──────────────
      const { trees, grass, rocks } = generateForestPlacements();

      // Helper: place an asset at (x,z), snapped to the ground heightmap.
      const place = async (assetKey, p) => {
        if (!mounted) return null;
        const obj = await instantiate(assetKey);
        const y = sampleGroundY(p.x, p.z) + (p.yOffset || 0);
        obj.position.set(p.x, y, p.z);
        obj.rotation.y = p.rotY || 0;
        if (p.scaleMult) obj.scale.multiplyScalar(p.scaleMult);
        group.add(obj);
        return obj;
      };

      // ─── Trees ─────────────────────────────────────────────────────
      const TREE_BATCH = 12;
      for (let i = 0; i < trees.length; i += TREE_BATCH) {
        if (!mounted) break;
        const slice = trees.slice(i, i + TREE_BATCH);
        await Promise.all(slice.map((p) => place('TREE_2', p)));
      }

      // ─── Rocks (collidable) ────────────────────────────────────────
      const colliders = [];
      for (const p of rocks) {
        if (!mounted) break;
        await place('ROCKS', p);
        colliders.push({ x: p.x, z: p.z, r: 1.4 * (p.scaleMult || 1) });
      }

      // ─── Grass — ground cover, batched so we don't block the main thread
      const GRASS_BATCH = 40;
      for (let i = 0; i < grass.length; i += GRASS_BATCH) {
        if (!mounted) break;
        const slice = grass.slice(i, i + GRASS_BATCH);
        await Promise.all(slice.map((p) => place('GRASS', p)));
      }

      if (!mounted) {
        scene.remove(group);
        return;
      }

      scene.add(group);
      window.__terrainColliders = colliders;
      window.__terrainSampleY = sampleGroundY; // expose for foot-snap systems
    };

    start();

    return () => {
      mounted = false;
      const scene = window.__gw3dScene;
      if (scene && group) scene.remove(group);
      window.__terrainColliders = [];
      window.__terrainSampleY = null;
    };
  }, []);

  return null;
}