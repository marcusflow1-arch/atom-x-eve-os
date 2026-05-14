// Lightweight pub/sub for live world-boss state.
// GameWorld3D pushes per-boss updates (pos, hp, alive) and the OnlinePlayersPanel
// + BossWaypoint subscribe to render data.
let bosses = []; // [{ id, name, title, x, z, hp, maxHp, alive }]
const listeners = new Set();

export function setBosses(next) {
  bosses = next;
  listeners.forEach((fn) => fn(bosses));
}

export function updateBoss(id, patch) {
  bosses = bosses.map((b) => (b.id === id ? { ...b, ...patch } : b));
  listeners.forEach((fn) => fn(bosses));
}

export function getBosses() {
  return bosses;
}

export function subscribeBosses(fn) {
  listeners.add(fn);
  fn(bosses);
  return () => listeners.delete(fn);
}