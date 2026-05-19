// ─── TerrainArea ──────────────────────────────────────────────────────────
// Renders the active SandboxScene into the live game world AND watches the
// SandboxScene entity for real-time updates. Whenever the active scene's
// placements / ground color / ground size change (e.g. the admin hits Save
// in the sandbox editor), this component rebuilds the in-game terrain
// without requiring a reload.
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

const POLL_INTERVAL_MS = 5000; // SandboxScene poll cadence (no built-in subscribe yet)

function hexToInt(hex, fallback = 0x4a6a3e) {
  if (typeof hex !== 'string') return fallback;
  const s = hex.replace('#', '');
  const n = parseInt(s, 16);
  return Number.isFinite(n) ? n : fallback;
}

function sceneSignature(scene) {
  if (!scene) return 'none';
  // Cheap fingerprint — id + updated_date is enough to detect any save.
  return `${scene.id}::${scene.updated_date || ''}`;
}

export default function TerrainArea() {
  const lastSigRef = useRef('init');

  useEffect(() => {
    let mounted = true;
    let currentGroup = null;
    let pollTimer = null;

    const disposeGroup = (g) => {
      const scene = window.__gw3dScene;
      if (!g) return;
      g.traverse((n) => {
        if (n.isInstancedMesh) n.dispose?.();
        if (n.geometry?.dispose) n.geometry.dispose();
        if (n.material?.dispose) n.material.dispose();
      });
      if (scene) scene.remove(g);
    };

    const rebuild = async (activeScene) => {
      const scene = window.__gw3dScene;
      if (!scene) return;

      const newGroup = new THREE.Group();
      newGroup.name = 'terrain_area';

      // ─── Ground ─────────────────────────────────────────────────
      const groundSize = activeScene?.ground_size || 200;
      const groundColor = hexToInt(activeScene?.ground_color, 0x4a6a3e);
      newGroup.add(buildFlatGround({ size: groundSize, color: groundColor }));

      // Heightmap API — flat world → always 0
      window.__terrainSampleY = sampleGroundY;

      // ─── Placements ─────────────────────────────────────────────
      const placements = Array.isArray(activeScene?.placements) ? activeScene.placements : [];
      const byAsset = new Map();
      for (const p of placements) {
        if (!p.assetKey) continue;
        if (!byAsset.has(p.assetKey)) byAsset.set(p.assetKey, []);
        byAsset.get(p.assetKey).push(p);
      }

      const colliders = [];

      for (const [assetKey, list] of byAsset) {
        let src;
        try {
          src = await getSource(assetKey);
        } catch (err) {
          console.warn('TerrainArea: missing sandbox asset', assetKey, err);
          continue;
        }
        if (!mounted) return;

        const batch = list.map((p) => ({
          x: p.x || 0,
          y: p.y || 0,
          z: p.z || 0,
          rotY: p.rotY || 0,
          scaleMult: p.scaleY || p.scaleX || 1,
        }));

        const meshGroup = buildInstancedProps(src, batch, {
          name: `sandbox_${assetKey}`,
          receiveShadow: true,
          boundsRadius: Math.max(200, groundSize),
        });
        newGroup.add(meshGroup);

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

      if (!mounted) return;

      // Swap in the new group, dispose the previous one.
      scene.add(newGroup);
      if (currentGroup) disposeGroup(currentGroup);
      currentGroup = newGroup;
    };

    const checkForUpdates = async () => {
      try {
        const scenes = await base44.entities.SandboxScene.filter({ is_active: true }, '-updated_date', 1);
        const active = scenes?.[0] || null;
        const sig = sceneSignature(active);
        if (sig !== lastSigRef.current) {
          lastSigRef.current = sig;
          await rebuild(active);
        }
      } catch (e) {
        // No SandboxScene entity yet or filter failed — render flat ground once.
        if (lastSigRef.current === 'init') {
          lastSigRef.current = 'none';
          await rebuild(null);
        }
      }
    };

    const start = async () => {
      if (!window.__gw3dScene) { setTimeout(start, 250); return; }
      await checkForUpdates();
      pollTimer = setInterval(() => { if (mounted) checkForUpdates(); }, POLL_INTERVAL_MS);
    };

    start();

    return () => {
      mounted = false;
      if (pollTimer) clearInterval(pollTimer);
      disposeGroup(currentGroup);
      currentGroup = null;
      window.__terrainColliders = [];
      window.__terrainSampleY = null;
    };
  }, []);

  return null;
}