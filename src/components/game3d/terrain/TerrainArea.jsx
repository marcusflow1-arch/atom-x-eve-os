// ─── TerrainArea ──────────────────────────────────────────────────────────
// Cleared out. The old forest (trees, grass, rocks, ground plane) has been
// removed so we can build a new terrain from scratch.
//
// Enemies, bosses, companions, and the player are NOT touched here — they
// live in their own components and will be re-attached to the new terrain
// once it's ready.
//
// We keep the component mounted (returning null) and reset the global
// collider list so nothing stale lingers.

import { useEffect } from 'react';

export default function TerrainArea() {
  useEffect(() => {
    window.__terrainColliders = [];
    return () => {
      window.__terrainColliders = [];
    };
  }, []);

  return null;
}