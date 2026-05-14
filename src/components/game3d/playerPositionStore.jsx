// Lightweight pub/sub for the player's live world position + facing.
// GameWorld3D pushes updates each frame; the minimap HUD subscribes.
let state = { x: 0, z: 0, yaw: 0 };
const listeners = new Set();

export function setPlayerPosition(next) {
  state = { ...state, ...next };
  listeners.forEach((fn) => fn(state));
}

export function getPlayerPosition() {
  return state;
}

export function subscribePlayerPosition(fn) {
  listeners.add(fn);
  fn(state);
  return () => listeners.delete(fn);
}