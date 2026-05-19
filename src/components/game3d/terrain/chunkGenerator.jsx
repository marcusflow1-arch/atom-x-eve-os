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
    for (let i = 0; i < count; i++) {
      props.push({
        assetKey,
        x: baseX + (rng() * 2 - 1) * half * 0.9,
        z: baseZ + (rng() * 2 - 1) * half * 0.9,
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