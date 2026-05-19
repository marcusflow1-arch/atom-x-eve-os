// ─── Forest Placement ─────────────────────────────────────────────────────
// Deterministic, biome-aware placement of trees / grass / rocks across the
// forest. Pure data — no three.js. Returns world-space transforms that
// TerrainArea.jsx then snaps to the procedural ground heightmap.
//
// Key rules:
//   • Poisson-style minimum spacing so trees never line up
//   • Slope-aware (no trees on cliff faces — slope from forestGround)
//   • Random scale + rotation for organic variation
//   • Grass clusters near trees, rocks, and along path edges
//   • Rocks bias toward steeper terrain and rock_outcrop zones

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

function distToSpawnSq(x, z) {
  const dx = x - SPAWN_POINT.x;
  const dz = z - SPAWN_POINT.z;
  return dx * dx + dz * dz;
}

/**
 * Generate all forest placements in one deterministic pass.
 * Returns: { trees, grass, rocks }
 *   each entry: { x, z, scaleMult, rotY, yOffset? }
 */
export function generateForestPlacements(seed = 20260519) {
  const r = rng(seed);
  const { halfX, halfZ } = FOREST_BOUNDS;
  const spawnSq = SPAWN_CLEAR_RADIUS * SPAWN_CLEAR_RADIUS;

  // ─── TREES ────────────────────────────────────────────────────────
  const trees = [];
  const TREE_ATTEMPTS = 1100;
  for (let i = 0; i < TREE_ATTEMPTS; i++) {
    const x = (r() * 2 - 1) * halfX;
    const z = (r() * 2 - 1) * halfZ;

    if (distToSpawnSq(x, z) < spawnSq) continue;

    const biome = biomeAt(x, z);
    const profile = BIOME_DENSITY[biome];
    if (!profile || profile.tree <= 0) continue;

    // Trees don't grow on steep rock faces
    const slope = sampleGroundSlope(x, z);
    if (slope > 0.55) continue;
    // Slight bias against very low marshy areas
    if (sampleGroundY(x, z) < -1.8 && r() < 0.7) continue;

    // Density gate
    if (r() > profile.tree * 0.6) continue;

    // Minimum spacing against existing trees
    const minDist = profile.minTreeDist;
    const minDistSq = minDist * minDist;
    let tooClose = false;
    for (let t = trees.length - 1; t >= 0; t--) {
      const p = trees[t];
      const ddx = p.x - x, ddz = p.z - z;
      if (ddx * ddx + ddz * ddz < minDistSq) { tooClose = true; break; }
    }
    if (tooClose) continue;

    trees.push({
      x, z,
      scaleMult: 0.75 + r() * 0.85, // 0.75x .. 1.6x for size variation
      rotY: r() * Math.PI * 2,
    });
  }

  // ─── ROCKS ────────────────────────────────────────────────────────
  const rocks = [];
  const ROCK_ATTEMPTS = 700;
  for (let i = 0; i < ROCK_ATTEMPTS; i++) {
    const x = (r() * 2 - 1) * halfX;
    const z = (r() * 2 - 1) * halfZ;

    if (distToSpawnSq(x, z) < spawnSq) continue;

    const biome = biomeAt(x, z);
    const profile = BIOME_DENSITY[biome];
    if (!profile || profile.rock <= 0) continue;

    // Rocks like steeper ground a bit more
    const slope = sampleGroundSlope(x, z);
    const slopeBoost = Math.min(0.5, slope * 0.6);

    if (r() > profile.rock * 0.2 + slopeBoost) continue;

    let tooClose = false;
    for (let t = rocks.length - 1; t >= 0; t--) {
      const p = rocks[t];
      const ddx = p.x - x, ddz = p.z - z;
      if (ddx * ddx + ddz * ddz < 3.2 * 3.2) { tooClose = true; break; }
    }
    if (tooClose) continue;

    rocks.push({
      x, z,
      scaleMult: 0.55 + r() * 1.1,
      rotY: r() * Math.PI * 2,
      // Partial embedding — varies so they look natural
      yOffset: -(0.18 + r() * 0.45),
    });
  }

  // ─── GRASS ────────────────────────────────────────────────────────
  const grass = [];
  const GRASS_ATTEMPTS = 2200;
  for (let i = 0; i < GRASS_ATTEMPTS; i++) {
    const x = (r() * 2 - 1) * halfX;
    const z = (r() * 2 - 1) * halfZ;

    const biome = biomeAt(x, z);
    const profile = BIOME_DENSITY[biome];
    if (!profile || profile.grass <= 0) continue;

    // Cluster near trees (up to +0.4) and rocks (+0.2)
    let clusterBoost = 0;
    for (let t = trees.length - 1; t >= 0 && clusterBoost < 0.4; t--) {
      const p = trees[t];
      const ddx = p.x - x, ddz = p.z - z;
      if (ddx * ddx + ddz * ddz < 9) clusterBoost += 0.15;
    }
    for (let t = rocks.length - 1; t >= 0 && clusterBoost < 0.6; t--) {
      const p = rocks[t];
      const ddx = p.x - x, ddz = p.z - z;
      if (ddx * ddx + ddz * ddz < 6) clusterBoost += 0.12;
    }

    const baseProb = profile.grass * 0.55 + clusterBoost;
    if (r() > Math.min(0.95, baseProb)) continue;

    grass.push({
      x, z,
      scaleMult: 0.5 + r() * 1.0,
      rotY: r() * Math.PI * 2,
    });
  }

  return { trees, grass, rocks };
}