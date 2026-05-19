// ─── Boss Arena Placement ─────────────────────────────────────────────────
// Deterministic placement for the compact 100×100 arena. Trees only ring
// the outer band; the central clearing and connecting path stay clear so
// combat / dodge / abilities have room.
//
// Returns pure data (no three.js). TerrainArea snaps each (x,z) to the
// ground heightmap and feeds it to the instanced batch builder.

import {
  FOREST_BOUNDS, BIOME_DENSITY, biomeAt,
  SPAWN_POINT, SPAWN_CLEAR_RADIUS,
} from './forestBiome';
import { sampleGroundY, sampleGroundSlope } from './forestGround';

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

function distSq(ax, az, bx, bz) {
  const dx = ax - bx, dz = az - bz;
  return dx * dx + dz * dz;
}

/**
 * Generate trees / rocks / grass for the boss arena.
 * Returns: { trees, grass, rocks }
 *   each entry: { x, z, scaleMult, rotY, yOffset? }
 */
export function generateForestPlacements(seed = 20260519) {
  const r = rng(seed);
  const { halfX, halfZ } = FOREST_BOUNDS;
  const spawnSq = SPAWN_CLEAR_RADIUS * SPAWN_CLEAR_RADIUS;

  // ─── TREES (outer ring only) ──────────────────────────────────────
  const trees = [];
  const TREE_ATTEMPTS = 320;
  for (let i = 0; i < TREE_ATTEMPTS; i++) {
    const x = (r() * 2 - 1) * halfX;
    const z = (r() * 2 - 1) * halfZ;

    if (distSq(x, z, SPAWN_POINT.x, SPAWN_POINT.z) < spawnSq) continue;

    const profile = BIOME_DENSITY[biomeAt(x, z)];
    if (!profile || profile.tree <= 0) continue;

    // Don't grow trees on steep slopes
    if (sampleGroundSlope(x, z) > 0.55) continue;

    if (r() > profile.tree * 0.85) continue;

    // Poisson-style spacing
    const minSq = profile.minTreeDist * profile.minTreeDist;
    let tooClose = false;
    for (let t = trees.length - 1; t >= 0; t--) {
      if (distSq(trees[t].x, trees[t].z, x, z) < minSq) { tooClose = true; break; }
    }
    if (tooClose) continue;

    trees.push({
      x, z,
      scaleMult: 0.8 + r() * 0.7,   // 0.8x .. 1.5x
      rotY: r() * Math.PI * 2,
    });
  }

  // ─── ROCKS (edge band + forest ring) ──────────────────────────────
  const rocks = [];
  const ROCK_ATTEMPTS = 140;
  for (let i = 0; i < ROCK_ATTEMPTS; i++) {
    const x = (r() * 2 - 1) * halfX;
    const z = (r() * 2 - 1) * halfZ;

    if (distSq(x, z, SPAWN_POINT.x, SPAWN_POINT.z) < spawnSq) continue;

    const profile = BIOME_DENSITY[biomeAt(x, z)];
    if (!profile || profile.rock <= 0) continue;

    if (r() > profile.rock * 0.35) continue;

    let tooClose = false;
    for (let t = rocks.length - 1; t >= 0; t--) {
      if (distSq(rocks[t].x, rocks[t].z, x, z) < 3.2 * 3.2) { tooClose = true; break; }
    }
    if (tooClose) continue;

    rocks.push({
      x, z,
      scaleMult: 0.55 + r() * 0.9,
      rotY: r() * Math.PI * 2,
      yOffset: -(0.2 + r() * 0.4),
    });
  }

  // ─── GRASS (sparse — even in arena/path for realism) ──────────────
  const grass = [];
  const GRASS_ATTEMPTS = 700;
  for (let i = 0; i < GRASS_ATTEMPTS; i++) {
    const x = (r() * 2 - 1) * halfX;
    const z = (r() * 2 - 1) * halfZ;

    const profile = BIOME_DENSITY[biomeAt(x, z)];
    if (!profile || profile.grass <= 0) continue;

    if (r() > profile.grass * 0.5) continue;

    grass.push({
      x, z,
      scaleMult: 0.5 + r() * 0.9,
      rotY: r() * Math.PI * 2,
    });
  }

  return { trees, grass, rocks };
}