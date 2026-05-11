// Tiny pub/sub store so GameWorld3D can publish player XP/level
// and SkillSlotHUD can render it without prop drilling.
let state = { level: 1, xp: 0, xpForNext: 5 };
const listeners = new Set();

export function setPlayerHUD(next) {
  state = { ...state, ...next };
  listeners.forEach((fn) => fn(state));
}

export function getPlayerHUD() {
  return state;
}

export function subscribePlayerHUD(fn) {
  listeners.add(fn);
  fn(state);
  return () => listeners.delete(fn);
}