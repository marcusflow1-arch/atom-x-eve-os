// ─── Chunk Generator ──────────────────────────────────────────────────────
// Deterministic per-chunk content. Given a chunk coordinate (cx, cz), this
// returns a list of prop placements (asset key + local position + rotation +
// scale jitter). Same chunk coords → same layout, ALWAYS. That's what makes
// re-entering a previously unloaded chunk visually identical.

import { CHUNK_SIZE, PROPS_PER_CHUNK, SPECIAL_CHUNKS } from './terrainStreamConfig';

// Tiny seeded RNG — Mulberry32. Deterministic per (cx, cz) pair.
function makeRng(cx, cz) {
  let seed = ((cx | 0) * 374761393 + (cz | 0) * 668265263) >>> 0;
  return () => {
    seed = (seed + 0x6D2B79F5) >>> 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Returns:
 *  {
 *    props: [{ assetKey, x, z, rotY, scaleMult }, ...],
 *    special: 'ALTAR_SCENE' | 'WATER_SCENE' | null,
 *  }
 */
export function generateChunkLayout(cx, cz) {
  const rng = makeRng(cx, cz);
  const baseX = cx * CHUNK_SIZE;
  const baseZ = cz * CHUNK_SIZE;
  const half = CHUNK_SIZE / 2;
  const props = [];

  for (const [assetKey, count] of Object.entries(PROPS_PER_CHUNK)) {
    if (assetKey === 'GRASS') {
      const spacing = 4.4;
      for (let x = -half + 3; x <= half - 3; x += spacing) {
        for (let z = -half + 3; z <= half - 3; z += spacing) {
          const wx = baseX + x + (rng() - 0.5) * 1.4;
          const wz = baseZ + z + (rng() - 0.5) * 1.4;
          if (Math.abs(wx) < 3.2) continue;
          props.push({
            assetKey,
            x: wx,
            z: wz,
            rotY: rng() * Math.PI * 2,
            scaleMult: 0.75 + rng() * 0.25,
            variantIndex: 0,
            pieceCount: 1,
          });
        }
      }
      continue;
    }

    for (let i = 0; i < count; i++) {
      const x = baseX + (rng() * 2 - 1) * half * 0.9;
      const z = baseZ + (rng() * 2 - 1) * half * 0.9;
      if (Math.abs(x) < 4) continue;
      props.push({
        assetKey,
        x,
        z,
        rotY: rng() * Math.PI * 2,
        scaleMult: 0.85 + rng() * 0.4,
        variantIndex: assetKey === 'ROCKS' ? Math.floor(rng() * 12) : 0,
        pieceCount: assetKey === 'ROCKS' ? 1 + Math.floor(rng() * 2) : 1,
      });
    }
  }

  const special = SPECIAL_CHUNKS.find((s) => s.cx === cx && s.cz === cz)?.asset || null;

  return { props, special };
}

/** World coord → chunk coord. */
export function chunkOf(x, z) {
  return {
    cx: Math.floor(x / CHUNK_SIZE),
    cz: Math.floor(z / CHUNK_SIZE),
  };
}

/** "cx,cz" stable key. */
export function chunkKey(cx, cz) { return `${cx},${cz}`; }