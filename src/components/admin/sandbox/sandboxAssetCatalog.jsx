// ─── Sandbox Asset Catalog ────────────────────────────────────────────────
// The set of assets the sandbox editor can place. Each asset reuses the
// TERRAIN_ASSETS registry so we share the same loader cache and instancing
// pipeline with the in-game environment.

import { TERRAIN_ASSETS } from '../../game3d/terrain/terrainAssetRegistry';

// Authoring metadata for each asset key. Keep this list small and curated —
// expand by adding more entries here, not by inventing keys in the UI.
export const SANDBOX_ASSETS = [
  {
    key: 'TREE_2',
    name: 'Realistic Tree',
    category: 'nature',
    icon: '🌳',
    defaultColliderRadius: 0.55,
    collides: true,
  },
  {
    key: 'ROCKS',
    name: 'Rock Cluster',
    category: 'nature',
    icon: '🪨',
    defaultColliderRadius: 1.3,
    collides: true,
  },
  {
    key: 'GRASS',
    name: 'Grass Tuft',
    category: 'nature',
    icon: '🌿',
    defaultColliderRadius: 0,
    collides: false,
  },
  {
    key: 'ALTAR_SCENE',
    name: 'Altar',
    category: 'structures',
    icon: '🏛️',
    defaultColliderRadius: 1.8,
    collides: true,
  },
  {
    key: 'WATER_SCENE',
    name: 'Water Feature',
    category: 'props',
    icon: '💧',
    defaultColliderRadius: 0,
    collides: false,
  },
];

export const SANDBOX_CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'nature', label: 'Nature' },
  { id: 'structures', label: 'Structures' },
  { id: 'props', label: 'Props' },
];

export function getAssetMeta(key) {
  return SANDBOX_ASSETS.find((a) => a.key === key) || null;
}

export function isAssetAvailable(key) {
  return !!TERRAIN_ASSETS[key];
}