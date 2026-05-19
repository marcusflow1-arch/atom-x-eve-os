// ─── TerrainTriggerZone ───────────────────────────────────────────────────
// Metroid Prime-style pre-loader. Mark a circular zone in the world (cx, cz,
// radius); when the local player crosses into it, the listed asset keys are
// preloaded into the cache so the next chunk pop-in (e.g. a biome boundary)
// happens without a hitch.
//
// Pure preload — does NOT instantiate anything in the scene. The Streamer's
// normal chunk logic still owns placement.

import { useEffect } from 'react';
import { preload } from './assetLoaderCache';

export default function TerrainTriggerZone({ x = 0, z = 0, radius = 20, assets = [] }) {
  useEffect(() => {
    let triggered = false;
    const tick = () => {
      if (triggered) return;
      const p = window.__localPlayerPos;
      if (!p) return;
      const dx = (p.x || 0) - x;
      const dz = (p.z || 0) - z;
      if (dx * dx + dz * dz < radius * radius) {
        triggered = true;
        preload(assets);
      }
    };
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [x, z, radius, assets]);

  return null;
}