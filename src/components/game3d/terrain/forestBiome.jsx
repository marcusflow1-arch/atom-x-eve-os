// ─── Forest Biome Zones ───────────────────────────────────────────────────
// Hand-tuned circular zones that define the character of each region of
// the forest. Later entries override earlier ones, so a path can cut
// through a thicket and a clearing can carve out of forest.
//
// Zones used here:
//   • forest         — base layer, medium tree density
//   • dense_thicket  — deep woods, very high tree density
//   • meadow         — sunlit clearing, no trees, dense flowering grass
//   • path           — walkable corridor, no trees, light gravel/grass
//   • rock_outcrop   — rocky cluster, sparse trees, lots of rocks

export const FOREST_BOUNDS = { halfX: 100, halfZ: 100 };
export const SPAWN_POINT = { x: 0, z: 0 };
export const SPAWN_CLEAR_RADIUS = 9;

export const BIOME_ZONES = [
  // Base layer — entire map is forest by default
  { kind: 'forest', cx: 0, cz: 0, r: 9999 },

  // ─── Deep thickets (dark, dense, exploration-rewarding) ─────────────
  { kind: 'dense_thicket', cx: -60, cz: -55, r: 30 },
  { kind: 'dense_thicket', cx:  65, cz:  50, r: 34 },
  { kind: 'dense_thicket', cx: -35, cz:  70, r: 24 },
  { kind: 'dense_thicket', cx:  80, cz: -65, r: 22 },
  { kind: 'dense_thicket', cx:  -8, cz: -80, r: 20 },

  // ─── Sunlit meadows / clearings ─────────────────────────────────────
  { kind: 'meadow', cx:  32, cz: -22, r: 16 },
  { kind: 'meadow', cx: -68, cz:  18, r: 15 },
  { kind: 'meadow', cx:  12, cz:  52, r: 13 },
  { kind: 'meadow', cx:  55, cz: -45, r: 11 },

  // ─── Rocky outcrops ─────────────────────────────────────────────────
  { kind: 'rock_outcrop', cx:  48, cz:  12, r: 13 },
  { kind: 'rock_outcrop', cx: -28, cz: -68, r: 15 },
  { kind: 'rock_outcrop', cx:  22, cz:  32, r: 10 },
  { kind: 'rock_outcrop', cx: -50, cz:  55, r: 11 },

  // ─── Winding path through the woods (gentle S-curve) ────────────────
  // Many small overlapping circles so the path bends naturally.
  { kind: 'path', cx:   0, cz: -10, r: 4 },
  { kind: 'path', cx:   6, cz: -20, r: 4 },
  { kind: 'path', cx:  14, cz: -28, r: 4 },
  { kind: 'path', cx:  22, cz: -32, r: 4 },
  { kind: 'path', cx:  30, cz: -28, r: 4 },
  { kind: 'path', cx:  -4, cz:   2, r: 4 },
  { kind: 'path', cx:  -8, cz:  14, r: 4 },
  { kind: 'path', cx: -14, cz:  26, r: 4 },
  { kind: 'path', cx: -22, cz:  36, r: 4 },
  { kind: 'path', cx: -32, cz:  42, r: 4 },

  // Spawn clearing — always open and walkable
  { kind: 'meadow', cx: SPAWN_POINT.x, cz: SPAWN_POINT.z, r: SPAWN_CLEAR_RADIUS },
];

/** Resolve which biome a world-space point belongs to. */
export function biomeAt(x, z) {
  let best = 'forest';
  for (const zone of BIOME_ZONES) {
    const dx = x - zone.cx;
    const dz = z - zone.cz;
    if (dx * dx + dz * dz <= zone.r * zone.r) best = zone.kind;
  }
  return best;
}

/**
 * Per-biome density profile. Weights are relative — the placement system
 * uses them as probability multipliers and minimum-spacing constraints.
 */
export const BIOME_DENSITY = {
  dense_thicket: { tree: 1.6, grass: 1.3, rock: 0.4, minTreeDist: 2.3 },
  forest:        { tree: 1.0, grass: 1.0, rock: 0.3, minTreeDist: 3.0 },
  rock_outcrop:  { tree: 0.4, grass: 0.7, rock: 1.8, minTreeDist: 4.0 },
  meadow:        { tree: 0.0, grass: 1.7, rock: 0.0, minTreeDist: 0   },
  path:          { tree: 0.0, grass: 0.25, rock: 0.0, minTreeDist: 0   },
};