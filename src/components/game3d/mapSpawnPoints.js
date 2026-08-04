// ─── World Spawn Points & Respawn Resolution ─────────────────────────────
// Valid spawn / checkpoint locations for the 3D world. This is WORLD data
// (per map), not save data. The player's *chosen* checkpoint lives in their
// own per-user, per-character save slot (see checkpointSave below).

import { characterScopedStorage } from '@/components/game3d/characterStorage';

export const MAP_ID = 'world_3d';

export const MAP_SPAWN_POINTS = [
  { id: 'spawn_main',    label: 'Arena Camp',   x: 0,   z: 0,   default: true },
  { id: 'spawn_north',   label: 'North Ridge',  x: 6,   z: -22 },
  { id: 'spawn_forest',  label: 'Forest Edge',  x: 24,  z: -13 },
  { id: 'spawn_ruins',   label: 'Old Ruins',    x: -26, z: 18 },
];

const store = characterScopedStorage('wwm_checkpoint_v1');

/** The checkpoint this character last activated (per user + character). */
export function getSavedCheckpointId() {
  try { return store.get() || null; } catch { return null; }
}

export function saveCheckpointId(id) {
  if (!id) return;
  store.set(id);
}

export function getSpawnPointById(id) {
  return MAP_SPAWN_POINTS.find((p) => p.id === id) || null;
}

/** Default map spawn — used only when the save has no valid checkpoint. */
export function getDefaultSpawnPoint() {
  return MAP_SPAWN_POINTS.find((p) => p.default) || MAP_SPAWN_POINTS[0];
}

/**
 * Resolve where this character respawns: their saved checkpoint if it is
 * still a valid point on this map, else the map's default spawn.
 */
export function getRespawnPoint(checkpointId = getSavedCheckpointId()) {
  return getSpawnPointById(checkpointId) || getDefaultSpawnPoint();
}