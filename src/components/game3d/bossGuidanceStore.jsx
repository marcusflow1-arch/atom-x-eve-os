// Tracks which boss the player has "pinned" for guidance.
// When set, the HUD shows a directional waypoint pointing toward the boss.
let trackedBossId = null;
const listeners = new Set();

export function setTrackedBoss(id) {
  trackedBossId = id;
  listeners.forEach((fn) => fn(trackedBossId));
}

export function getTrackedBoss() {
  return trackedBossId;
}

export function subscribeTrackedBoss(fn) {
  listeners.add(fn);
  fn(trackedBossId);
  return () => listeners.delete(fn);
}