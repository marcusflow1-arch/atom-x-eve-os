// ─── Forest Placement ─────────────────────────────────────────────────────
// Generates a list of placements (asset key + world transform) for every
// prop in the forest, using biome-aware Poisson-disc-style sampling so
// trees never line up in grids and density varies naturally per biome.
//
// Output is deterministic given the same seed — re-renders never reshuffle.
//
// IMPORTANT: this file does NOT touch three.js. It returns plain data so
// it's cheap to call, easy to test, and trivially serializable later if we
// move placement to a backend bake step.

import {
  FOREST_BOUNDS, BIOME_DENSITY, BIOME_ZONES,
  biomeAt, SPAWN_POINT, SPAWN_CLEAR_RADIUS,
} from './forestBiome';

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

// Find the nearest pond zone — used to skip placements inside water.
function inPond(x, z) {
  for (const zone of BIOME_ZONES) {
    if (zone.kind !== 'pond') continue;
    const dx = x - zone.cx, dz = z - zone.cz;
    if (dx * dx + dz * dz <= zone.r * zone.r) return zone;
  }
  return null;
}

// Distance from (x,z) to the nearest pond edge — negative if inside.
function distToPondEdge(x, z) {
  let best = Infinity;
  for (const zone of BIOME_ZONES) {
    if (zone.kind !== 'pond') continue;
    const dx = x - zone.cx, dz = z - zone.cz;
    const d = Math.sqrt(dx * dx + dz * dz) - zone.r;
    if (d < best) best = d;
  }
  return best;
}

/**
 * Generate all placements for the forest in one pass.
 * Returns: { trees, grass, rocks, ponds }
 *   each entry: { x, z, scaleMult, rotY }
 */
export function generateForestPlacements(seed = 20260519) {
  const r = rng(seed);
  const { halfX, halfZ } = FOREST_BOUNDS;

  // ─── Ponds — direct from biome zones ──────────────────────────────
  const ponds = BIOME_ZONES
    .filter((z) => z.kind === 'pond')
    .map((z) => ({
      x: z.cx, z: z.cz,
      scaleMult: Math.max(1.0, z.r / 4.5), // scale water asset to fit
      rotY: r() * Math.PI * 2,
    }));

  // ─── Trees — Poisson-disc with biome-aware min distance ───────────
  const trees = [];
  const treeAttempts = 2500;
  for (let i = 0; i < treeAttempts; i++) {
    const x = (r() * 2 - 1) * halfX;
    const z = (r() * 2 - 1) * halfZ;

    // Spawn area is always clear
    const dxS = x - SPAWN_POINT.x, dzS = z - SPAWN_POINT.z;
    if (dxS * dxS + dzS * dzS < SPAWN_CLEAR_RADIUS * SPAWN_CLEAR_RADIUS) continue;

    // No trees in water
    if (inPond(x, z)) continue;

    // Keep trees a small buffer back from pond edges
    if (distToPondEdge(x, z) < 1.5) continue;

    const biome = biomeAt(x, z);
    const profile = BIOME_DENSITY[biome];
    if (!profile || profile.tree <= 0) continue;

    // Probability gate so density varies per biome
    if (r() > profile.tree * 0.55) continue;

    // Minimum spacing check against already-placed trees
    let tooClose = false;
    const minDist = profile.minTreeDist;
    const minDistSq = minDist * minDist;
    for (let t = trees.length - 1; t >= 0; t--) {
      const p = trees[t];
      const ddx = p.x - x, ddz = p.z - z;
      if (ddx * ddx + ddz * ddz < minDistSq) { tooClose = true; break; }
    }
    if (tooClose) continue;

    trees.push({
      x, z,
      scaleMult: 0.7 + r() * 0.7,
      rotY: r() * Math.PI * 2,
    });
  }

  // ─── Rocks — clustered in rock_outcrop zones, sparse elsewhere ────
  const rocks = [];
  const rockAttempts = 600;
  for (let i = 0; i < rockAttempts; i++) {
    const x = (r() * 2 - 1) * halfX;
    const z = (r() * 2 - 1) * halfZ;

    const dxS = x - SPAWN_POINT.x, dzS = z - SPAWN_POINT.z;
    if (dxS * dxS + dzS * dzS < SPAWN_CLEAR_RADIUS * SPAWN_CLEAR_RADIUS) continue;
    if (inPond(x, z)) continue;

    const biome = biomeAt(x, z);
    const profile = BIOME_DENSITY[biome];
    if (!profile || profile.rock <= 0) continue;
    if (r() > profile.rock * 0.18) continue;

    // Spacing — rocks need breathing room from each other
    let tooClose = false;
    for (let t = rocks.length - 1; t >= 0; t--) {
      const p = rocks[t];
      const ddx = p.x - x, ddz = p.z - z;
      if (ddx * ddx + ddz * ddz < 3.5 * 3.5) { tooClose = true; break; }
    }
    if (tooClose) continue;

    rocks.push({
      x, z,
      scaleMult: 0.6 + r() * 1.0,
      rotY: r() * Math.PI * 2,
      // Partial ground embedding — varies per rock so they look natural
      yOffset: -(0.15 + r() * 0.35),
    });
  }

  // ─── Grass — dense, clustered around trees / rocks / pond edges ───
  const grass = [];
  const grassAttempts = 1400;
  for (let i = 0; i < grassAttempts; i++) {
    const x = (r() * 2 - 1) * halfX;
    const z = (r() * 2 - 1) * halfZ;

    if (inPond(x, z)) continue;

    const biome = biomeAt(x, z);
    const profile = BIOME_DENSITY[biome];
    if (!profile || profile.grass <= 0) continue;

    // Cluster around nearby trees / rocks / pond edges
    let clusterBoost = 0;
    for (let t = trees.length - 1; t >= 0 && clusterBoost < 0.5; t--) {
      const p = trees[t];
      const ddx = p.x - x, ddz = p.z - z;
      if (ddx * ddx + ddz * ddz < 9) clusterBoost += 0.2;
    }
    const pondEdge = distToPondEdge(x, z);
    if (pondEdge > 0 && pondEdge < 3) clusterBoost += 0.3;

    const baseProb = profile.grass * 0.6 + clusterBoost;
    if (r() > Math.min(0.95, baseProb)) continue;

    grass.push({
      x, z,
      scaleMult: 0.5 + r() * 0.9,
      rotY: r() * Math.PI * 2,
    });
  }

  return { trees, grass, rocks, ponds };
}