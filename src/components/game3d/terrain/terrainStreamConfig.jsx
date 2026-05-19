// ─── Terrain Stream Config ────────────────────────────────────────────────
// KOTOR-style continuous chunk streaming.
//   • World is gridded into CHUNK_SIZE × CHUNK_SIZE tiles.
//   • LOAD_RADIUS  chunks around the player are kept in memory.
//   • UNLOAD_RADIUS chunks past this distance get disposed.
//   • The gap between LOAD and UNLOAD is HYSTERESIS — prevents thrash when
//     the player walks back and forth across a tile boundary.

export const CHUNK_SIZE = 60;            // world units per chunk side
export const LOAD_RADIUS = 2;            // load up to 2 chunks away (=5×5 grid)
export const UNLOAD_RADIUS = 4;          // dispose anything past 4 chunks
export const ORIGIN_RADIUS = 1;          // chunks within this distance from spawn always stay loaded

// How many chunks we're allowed to LOAD in parallel. Three keeps the main
// thread responsive on slow connections.
export const MAX_PARALLEL_LOADS = 3;

// Streamer runs at most this often (ms). Players don't move fast enough to
// need a per-frame poll — once every 250ms is plenty.
export const STREAM_TICK_MS = 250;

// Density of props per chunk. Real numbers are picked deterministically per
// chunk so the same coords always produce the same layout.
export const PROPS_PER_CHUNK = {
  GRASS:    8,
  ROCKS:    3,
  TREE_1:   2,
  TREE_2:   1,
};

// Special hand-placed asset positions (Metroid-style points of interest).
// These chunks load the altar/water scene IN ADDITION to the procedural props.
export const SPECIAL_CHUNKS = [
  { cx:  2, cz:  0, asset: 'ALTAR_SCENE' },    // altar east of spawn
  { cx: -2, cz:  1, asset: 'WATER_SCENE' },    // water/pond west of spawn
];