// ─── Forest Biome Zones ───────────────────────────────────────────────────
// Defines named biome zones inside the forest so density / asset choice
// varies naturally instead of looking procedurally uniform.
//
// Each zone is a circular region (cx, cz, radius) with a "kind" that tells
// the placement system what to do:
//   • dense_thicket  → very high tree density, lots of underbrush
//   • forest         → standard forest, medium tree density
//   • meadow         → open clearing, no trees, dense grass
//   • path           → walkable corridor, no trees, sparse grass
//   • pond           → water feature, grass ring around it, no trees inside
//   • rock_outcrop   → rocky cluster, sparse trees, dense rocks
//
// All distances are in world units. Zones can overlap — later zones in the
// array take priority over earlier ones (used for paths cutting through
// forest, ponds carving out clearings, etc.).

export const FOREST_BOUNDS = { halfX: 100, halfZ: 100 }; // 200×200 area
export const SPAWN_POINT = { x: 0, z: 0 };
export const SPAWN_CLEAR_RADIUS = 8;

// Hand-placed biome zones — feels handcrafted, not procedural.
// Ordered from background → foreground (later overrides earlier).
export const BIOME_ZONES = [
  // Base forest fills everything
  { kind: 'forest', cx: 0, cz: 0, r: 9999 },

  // ─── Dense thickets ─────────────────────────────────────────────────
  { kind: 'dense_thicket', cx: -55, cz: -45, r: 28 },
  { kind: 'dense_thicket', cx:  60, cz:  40, r: 32 },
  { kind: 'dense_thicket', cx: -30, cz:  65, r: 22 },
  { kind: 'dense_thicket', cx:  75, cz: -60, r: 20 },

  // ─── Open meadows / clearings ───────────────────────────────────────
  { kind: 'meadow', cx:  30, cz: -25, r: 18 },
  { kind: 'meadow', cx: -65, cz:  20, r: 16 },
  { kind: 'meadow', cx:  10, cz:  55, r: 14 },

  // ─── Rock outcrops ──────────────────────────────────────────────────
  { kind: 'rock_outcrop', cx:  45, cz:  10, r: 12 },
  { kind: 'rock_outcrop', cx: -25, cz: -65, r: 14 },
  { kind: 'rock_outcrop', cx:  20, cz:  30, r: 10 },

  // ─── Pond disabled — WATER_SCENE GLTF is a multi-file bundle and its
  // sidecar scene.bin isn't reachable through the current asset URL, which
  // throws "Failed to load buffer scene.bin" in GLTFLoader. Re-enable once
  // the water asset is re-uploaded as a self-contained GLB.

  // ─── Pathways (cut through forest to encourage exploration) ─────────
  // Paths are short overlapping segments so they bend naturally.
  { kind: 'path', cx:   0, cz: -15, r: 4 },
  { kind: 'path', cx:  10, cz: -25, r: 4 },
  { kind: 'path', cx:  20, cz: -30, r: 4 },
  { kind: 'path', cx:   5, cz:  10, r: 4 },
  { kind: 'path', cx: -10, cz:  20, r: 4 },
  { kind: 'path', cx: -20, cz:  35, r: 4 },
  { kind: 'path', cx: -15, cz:   0, r: 4 },
  { kind: 'path', cx: -25, cz:  -5, r: 4 },

  // Spawn clearing — always open
  { kind: 'meadow', cx: SPAWN_POINT.x, cz: SPAWN_POINT.z, r: SPAWN_CLEAR_RADIUS },
];

/**
 * Resolve which biome a point belongs to. Later zones override earlier ones
 * when they contain the point, so paths cut through forests etc.
 */
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
 * Density profile per biome. Used by the placement system to know how
 * many trees / grass / rocks belong in each cell of the world grid.
 *
 * Values are "weights" — relative to each other, not absolute counts.
 */
export const BIOME_DENSITY = {
  dense_thicket: { tree: 1.4, grass: 1.2, rock: 0.4, minTreeDist: 2.2 },
  forest:        { tree: 1.0, grass: 1.0, rock: 0.3, minTreeDist: 3.0 },
  rock_outcrop:  { tree: 0.4, grass: 0.6, rock: 1.6, minTreeDist: 4.0 },
  meadow:        { tree: 0.0, grass: 1.6, rock: 0.0, minTreeDist: 0   },
  path:          { tree: 0.0, grass: 0.3, rock: 0.0, minTreeDist: 0   },
  pond:          { tree: 0.0, grass: 0.0, rock: 0.0, minTreeDist: 0   },
};