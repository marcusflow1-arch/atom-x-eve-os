// ─── TerrainArea ──────────────────────────────────────────────────────────
// The procedural forest world has been removed. Instead this component:
//   1. Renders a flat ground plane as the default world surface.
//   2. Loads the currently active SandboxScene (if any) and instantiates
//      its placements with GPU instancing for repeated assets.
//   3. Registers collider data for placements flagged as solid, so the
//      existing applyTerrainCollision push-out keeps the player from
//      walking through trees / rocks / structures.
//
// All gameplay systems (player controller, AI, combat, abilities, camera,
// inventory, HUD) are untouched — they continue to consume the same global
// hooks (`window.__terrainSampleY`, `window.__terrainColliders`).

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { base44 } from '@/api/base44Client';
import { getSource } from './assetLoaderCache';
import { buildFlatGround, sampleGroundY } from './forestGround';
import { buildInstancedProps } from './instancedProps';

export default function TerrainArea() {
  const groupRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    let group = null;

    const start = async () => {
      const scene = window.__gw3dScene;
      if (!scene) { setTimeout(start, 250); return; }

      group = new THREE.Group();
      group.name = 'terrain_area';
      groupRef.current = group;

      // ─── Flat ground ─────────────────────────────────────────────
      group.add(buildFlatGround({ size: 200 }));

      // Heightmap API — flat world → always 0
      window.__terrainSampleY = sampleGroundY;

      // ─── Load active sandbox scene (if any) ──────────────────────
      let activeScene = null;
      try {
        const scenes = await base44.entities.SandboxScene.filter({ is_active: true }, '-updated_date', 1);
        activeScene = scenes?.[0] || null;
      } catch (e) {
        // No SandboxScene entity yet, or filter error — just render flat ground.
      }

      const placements = Array.isArray(activeScene?.placements) ? activeScene.placements : [];

      // Group placements by assetKey so each asset becomes one InstancedMesh batch.
      const byAsset = new Map();
      for (const p of placements) {
        if (!p.assetKey) continue;
        if (!byAsset.has(p.assetKey)) byAsset.set(p.assetKey, []);
        byAsset.get(p.assetKey).push(p);
      }

      const colliders = [];

      // Render each asset group as an instanced batch.
      for (const [assetKey, list] of byAsset) {
        let src;
        try {
          src = await getSource(assetKey);
        } catch (err) {
          console.warn('TerrainArea: missing sandbox asset', assetKey, err);
          continue;
        }
        if (!mounted) return;

        // Map our placement shape → builder shape
        const batch = list.map((p) => ({
          x: p.x || 0,
          y: p.y || 0,
          z: p.z || 0,
          rotY: p.rotY || 0,
          // The instancer uses a uniform scale — we use scaleY as the
          // representative multiplier (sandbox usually keeps them uniform).
          scaleMult: p.scaleY || p.scaleX || 1,
        }));

        const meshGroup = buildInstancedProps(src, batch, {
          name: `sandbox_${assetKey}`,
          receiveShadow: true,
          boundsRadius: 200,
        });
        group.add(meshGroup);

        // Collect colliders for solid placements
        for (const p of list) {
          if (p.collides && (p.colliderRadius || 0) > 0) {
            colliders.push({
              x: p.x || 0,
              z: p.z || 0,
              r: (p.colliderRadius || 0.5) * (p.scaleX || 1),
            });
          }
        }
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
        group.traverse((n) => {
          if (n.isInstancedMesh) n.dispose?.();
        });
        scene.remove(group);
      }
      window.__terrainColliders = [];
      window.__terrainSampleY = null;
    };
  }, []);

  return null;
}