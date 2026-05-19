// ─── TerrainArea ──────────────────────────────────────────────────────────
// Single isolated fantasy-forest clearing — replaces the chunk streamer.
// Hand-composed for a Google-image "fantasy forest" aesthetic:
//   • 80×80 unit playable area centered at origin
//   • Dense tree ring around the perimeter (visual wall + boundary)
//   • Inner tree clusters with breathing room between
//   • Rock formations as natural barriers (also collidable)
//   • Grass tufts scattered for ground detail
//   • Altar centerpiece offset to the north-east
//   • Water/pond off to the north-west
//
// Collision: rocks register their (x, z, radius) on window.__terrainColliders
// so GameWorld3D's per-frame push-out loop can keep the player from walking
// through them. No edits to GameWorld3D needed for placement — only collision.

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { instantiate, preload } from './assetLoaderCache';

// Deterministic RNG so the layout is identical every load.
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

// Spawn-clear ring — nothing spawns within this radius of the origin so the
// player isn't suffocated at spawn.
const SPAWN_CLEAR_RADIUS = 6;

export default function TerrainArea() {
  const groupRef = useRef(null);
  const collidersRef = useRef([]);

  useEffect(() => {
    let mounted = true;
    let group = null;

    const start = async () => {
      const scene = window.__gw3dScene;
      if (!scene) { setTimeout(start, 250); return; }

      preload(['GRASS', 'ROCKS', 'TREE_2', 'ALTAR_SCENE', 'WATER_SCENE']);

      group = new THREE.Group();
      group.name = 'terrain_area';
      groupRef.current = group;

      // Sample ground Y at a point — skip the streamer's own children.
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

      const r = rng(20260519); // deterministic seed
      const colliders = [];

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

      // ─── PERIMETER TREE RING (visual boundary) ────────────────────────
      // 28 trees in a slightly irregular ring around the 80×80 area.
      for (let i = 0; i < 28; i++) {
        const angle = (i / 28) * Math.PI * 2 + r() * 0.2;
        const radius = 36 + r() * 4;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        place('TREE_2', x, z, { scaleMult: 0.85 + r() * 0.4 });
      }

      // ─── INNER TREE CLUSTERS (breathing room) ─────────────────────────
      // 12 inner trees grouped loosely, avoiding the spawn-clear zone.
      let placed = 0, attempts = 0;
      while (placed < 12 && attempts < 60) {
        attempts++;
        const x = (r() * 2 - 1) * 26;
        const z = (r() * 2 - 1) * 26;
        if (x * x + z * z < SPAWN_CLEAR_RADIUS * SPAWN_CLEAR_RADIUS + 9) continue;
        place('TREE_2', x, z, { scaleMult: 0.7 + r() * 0.5 });
        placed++;
      }

      // ─── ROCK FORMATIONS (collidable barriers) ────────────────────────
      // 8 rocks placed as natural cover. Each registers a collider.
      const rockSpots = [
        [12, 8], [-14, 10], [16, -12], [-10, -16],
        [22, 2], [-22, -4], [4, 22], [-6, -22],
      ];
      for (const [x, z] of rockSpots) {
        if (!mounted) break;
        const scaleMult = 0.8 + r() * 0.6;
        const obj = await place('ROCKS', x, z, { scaleMult });
        if (obj) {
          // Collision radius scales with the rock — small enough that the
          // player can squeeze past but big enough to feel solid.
          colliders.push({ x, z, r: 1.4 * scaleMult });
        }
      }

      // ─── GRASS TUFTS (ground detail) ──────────────────────────────────
      for (let i = 0; i < 40; i++) {
        const x = (r() * 2 - 1) * 32;
        const z = (r() * 2 - 1) * 32;
        place('GRASS', x, z, { scaleMult: 0.6 + r() * 0.8 });
      }

      // ─── ALTAR (focal point, north-east) ──────────────────────────────
      place('ALTAR_SCENE', 14, -14, { rotY: -Math.PI / 4 });

      // ─── WATER POND (off-center, north-west) ──────────────────────────
      place('WATER_SCENE', -18, -18, { rotY: Math.PI / 6 });

      if (!mounted) {
        scene.remove(group);
        return;
      }

      scene.add(group);
      collidersRef.current = colliders;
      window.__terrainColliders = colliders;
    };

    start();

    return () => {
      mounted = false;
      const scene = window.__gw3dScene;
      if (scene && group) scene.remove(group);
      if (window.__terrainColliders === collidersRef.current) {
        window.__terrainColliders = null;
      }
      collidersRef.current = [];
    };
  }, []);

  return null;
}