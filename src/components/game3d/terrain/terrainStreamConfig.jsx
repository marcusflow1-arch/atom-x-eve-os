// ─── Terrain Stream Config ────────────────────────────────────────────────
// KOTOR-style continuous chunk streaming.
//   • World is gridded into CHUNK_SIZE × CHUNK_SIZE tiles.
//   • LOAD_RADIUS  chunks around the player are kept in memory.
//   • UNLOAD_RADIUS chunks past this distance get disposed.
//   • The gap between LOAD and UNLOAD is HYSTERESIS — prevents thrash when
//     the player walks back and forth across a tile boundary.

export const CHUNK_SIZE = 75;            // single boss-arena terrain size
export const LOAD_RADIUS = 0;            // only the arena chunk is loaded
export const UNLOAD_RADIUS = 1;          // dispose anything outside the arena
export const ORIGIN_RADIUS = 0;          // only spawn arena stays loaded

// How many chunks we're allowed to LOAD in parallel. Three keeps the main
// thread responsive on slow connections.
export const MAX_PARALLEL_LOADS = 3;

// Streamer runs at most this often (ms). Players don't move fast enough to
// need a per-frame poll — once every 250ms is plenty.
export const STREAM_TICK_MS = 250;

// Density of props per chunk. Real numbers are picked deterministically per
// chunk so the same coords always produce the same layout.
export const PROPS_PER_CHUNK = {
  GRASS:    0,
  ROCKS:    0,
  TREE_1:   0,
  TREE_2:   0,
};

// Special hand-placed asset positions (Metroid-style points of interest).
// These chunks load the altar/water scene IN ADDITION to the procedural props.
export const SPECIAL_CHUNKS = [];