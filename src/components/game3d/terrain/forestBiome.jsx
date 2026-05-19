// ─── Boss Arena Layout ────────────────────────────────────────────────────
// Compact 100×100 boss-fight arena. NOT an open world.
//
// Layout:
//   • Spawn at the south edge of the map (z = +38)
//   • A narrow forest path runs north from spawn toward the center
//   • A wide CIRCULAR CLEARING in the middle is the boss arena
//   • Trees ONLY in the outer ring (between the clearing and the map edge)
//   • Path + clearing are completely tree-free for clean combat
//
// The TerrainArea + placement code reads these constants to decide where
// objects can spawn. Keep this file small and declarative.

// Full playable square is 100 × 100. halfX/halfZ define the half-extents.
export const FOREST_BOUNDS = { halfX: 50, halfZ: 50 };

// Spawn at south end, facing into the path/clearing.
export const SPAWN_POINT = { x: 0, z: 38 };
export const SPAWN_CLEAR_RADIUS = 5;

// Boss arena (central clearing).
export const ARENA_CENTER = { x: 0, z: 0 };
export const ARENA_RADIUS = 16;          // fully open combat circle
export const ARENA_EDGE_BAND = 2;        // soft band — light grass, no trees

// Path connecting spawn → arena (a straight south→center corridor).
export const PATH_HALF_WIDTH = 2.5;
export const PATH_START_Z = ARENA_RADIUS; // arena perimeter
export const PATH_END_Z   = SPAWN_POINT.z;

// Outer tree ring — the only place trees grow.
export const TREE_RING_INNER = ARENA_RADIUS + ARENA_EDGE_BAND; // 18
export const TREE_RING_OUTER = 48;                              // just inside map edge

/** Square distance to the arena center. */
function distToArenaSq(x, z) {
  const dx = x - ARENA_CENTER.x;
  const dz = z - ARENA_CENTER.z;
  return dx * dx + dz * dz;
}

/** True if (x,z) lies on the narrow spawn→arena path corridor. */
function onPath(x, z) {
  if (Math.abs(x) > PATH_HALF_WIDTH) return false;
  return z >= PATH_START_Z && z <= PATH_END_Z;
}

/**
 * Resolve which "zone" a point belongs to. Used by placement rules.
 * Returns: 'arena' | 'path' | 'edge_band' | 'forest_ring' | 'outside'
 */
export function biomeAt(x, z) {
  // Outside the playable square — nothing spawns.
  if (Math.abs(x) > FOREST_BOUNDS.halfX || Math.abs(z) > FOREST_BOUNDS.halfZ) {
    return 'outside';
  }

  const dSq = distToArenaSq(x, z);

  if (dSq <= ARENA_RADIUS * ARENA_RADIUS) return 'arena';
  if (onPath(x, z)) return 'path';
  if (dSq <= (ARENA_RADIUS + ARENA_EDGE_BAND) ** 2) return 'edge_band';
  return 'forest_ring';
}

/**
 * Density rules per zone. The placement system uses these to filter
 * candidate points. `tree: 0` means no trees in that zone at all.
 */
export const BIOME_DENSITY = {
  outside:     { tree: 0,   grass: 0,    rock: 0,   minTreeDist: 0 },
  arena:       { tree: 0,   grass: 0.25, rock: 0,   minTreeDist: 0 },
  path:        { tree: 0,   grass: 0.15, rock: 0,   minTreeDist: 0 },
  edge_band:   { tree: 0,   grass: 0.8,  rock: 0.3, minTreeDist: 0 },
  forest_ring: { tree: 1.0, grass: 1.0,  rock: 0.4, minTreeDist: 3.2 },
};