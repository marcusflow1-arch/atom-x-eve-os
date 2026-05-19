// ─── TerrainArea ──────────────────────────────────────────────────────────
// Realistic forest biome — optimized build.
//
// Performance strategy:
//   • One procedural ground mesh (vertex-color blended, fits in VRAM easily)
//   • Trees / rocks / grass rendered with THREE.InstancedMesh → tens of
//     draw calls total instead of thousands
//   • Frustum culling on each InstancedMesh (with a generous bounds sphere
//     so we don't pop instances at the edges)
//
// Collision strategy:
//   • Heightmap is the source of truth for the ground.  We expose
//     `window.__terrainSampleY(x, z)` so player / AI controllers can ask
//     the exact ground Y at any world position (no raycasts, O(1)).
//   • Tree trunks register as solid cylinder colliders in
//     `window.__terrainColliders` (same shape as rocks) — the existing
//     `applyTerrainCollision()` push-out already handles them, so the
//     player can't walk through or stand on top of trees.
//   • Rocks also register as colliders.  Grass does NOT collide.

import { useEffect, useRef } from 'react';
import { getSource, preload } from './assetLoaderCache';
import { generateForestPlacements } from './forestPlacement';
import { buildForestGround, sampleGroundY } from './forestGround';
import { buildInstancedProps } from './instancedProps';

export default function TerrainArea() {
  const groupRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    let group = null;

    const start = async () => {
      const scene = window.__gw3dScene;
      if (!scene) { setTimeout(start, 250); return; }

      preload(['TREE_2', 'GRASS', 'ROCKS']);

      const THREE = await import('three');
      group = new THREE.Group();
      group.name = 'terrain_area';
      groupRef.current = group;

      // ─── Ground ────────────────────────────────────────────────────
      const ground = buildForestGround({ size: 220, segments: 160 });
      group.add(ground);

      // Heightmap API — player/AI controllers can snap feet to ground in O(1)
      window.__terrainSampleY = sampleGroundY;

      // ─── Generate placement data once (deterministic) ──────────────
      const { trees, grass, rocks } = generateForestPlacements();

      // Honor live perf settings — thin foliage/trees per the active preset.
      const perf = (typeof window !== 'undefined' && window.__perfSettings) || {};
      const treeDensity    = typeof perf.treeDensity    === 'number' ? perf.treeDensity    : 1;
      const foliageDensity = typeof perf.foliageDensity === 'number' ? perf.foliageDensity : 1;
      const renderDistance = typeof perf.renderDistance === 'number' ? perf.renderDistance : 220;

      const keepRatio = (arr, ratio) => {
        if (ratio >= 1) return arr;
        if (ratio <= 0) return [];
        return arr.filter((_, i) => ((i * 9301 + 49297) % 233280) / 233280 < ratio);
      };
      const inRange = (p) => (p.x * p.x + p.z * p.z) <= renderDistance * renderDistance;

      const trimmedTrees = keepRatio(trees.filter(inRange), treeDensity);
      const trimmedGrass = keepRatio(grass.filter(inRange), foliageDensity);
      const trimmedRocks = rocks.filter(inRange);

      // Snap every placement to the ground heightmap up-front so the
      // instanced batch builder gets final world Y values.
      const withY = (p, extraY = 0) => ({
        ...p,
        y: sampleGroundY(p.x, p.z) + (p.yOffset || 0) + extraY,
      });
      const treePlacements = trimmedTrees.map((p) => withY(p));
      const rockPlacements = trimmedRocks.map((p) => withY(p));
      const grassPlacements = trimmedGrass.map((p) => withY(p));

      // ─── Load sources in parallel ──────────────────────────────────
      const [treeSrc, rockSrc, grassSrc] = await Promise.all([
        getSource('TREE_2'),
        getSource('ROCKS'),
        getSource('GRASS'),
      ]);
      if (!mounted) return;

      // ─── Build instanced batches ───────────────────────────────────
      const treeBatch = buildInstancedProps(treeSrc, treePlacements, {
        name: 'forest_trees',
        receiveShadow: true,
        boundsRadius: 220,
      });
      const rockBatch = buildInstancedProps(rockSrc, rockPlacements, {
        name: 'forest_rocks',
        receiveShadow: true,
        boundsRadius: 220,
      });
      const grassBatch = buildInstancedProps(grassSrc, grassPlacements, {
        name: 'forest_grass',
        receiveShadow: false,
        boundsRadius: 220,
      });

      group.add(treeBatch);
      group.add(rockBatch);
      group.add(grassBatch);

      // ─── Colliders ─────────────────────────────────────────────────
      // Trees: tight cylinder at the trunk (so the player slides around it).
      // Rocks: a touch wider than the visible base.
      const colliders = [];
      for (const p of treePlacements) {
        colliders.push({ x: p.x, z: p.z, r: 0.55 * (p.scaleMult || 1) });
      }
      for (const p of rockPlacements) {
        colliders.push({ x: p.x, z: p.z, r: 1.3 * (p.scaleMult || 1) });
      }
      window.__terrainColliders = colliders;

      if (!mounted) {
        scene.remove(group);
        return;
      }

      scene.add(group);
    };

    start();

    return () => {
      mounted = false;
      const scene = window.__gw3dScene;
      if (scene && group) {
        // Dispose instanced meshes so we don't leak GPU memory on unmount.
        group.traverse((n) => {
          if (n.isInstancedMesh) {
            n.dispose?.();
          }
        });
        scene.remove(group);
      }
      window.__terrainColliders = [];
      window.__terrainSampleY = null;
    };
  }, []);

  return null;
}