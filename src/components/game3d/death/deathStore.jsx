// ─── Death State Store ─────────────────────────────────────────────────
// Tracks the player's death flow: animation → tips overlay → respawn map.
// Other components subscribe to react (e.g. disable input, freeze camera).
//
// Phases:
//   'alive'   — normal gameplay
//   'dying'   — death animation playing (camera/input frozen)
//   'tips'    — blank tips overlay shown (5 s)
//   'respawn' — respawn map overlay open, player picks a location

const PHASES = ['alive', 'dying', 'tips', 'respawn'];

let state = {
  phase: 'alive',
  deathPosition: null, // { x, z } where the player died — used to anchor respawn map
};
const listeners = new Set();

const emit = () => listeners.forEach((fn) => fn(state));

export function getDeathState() { return state; }

export function subscribeDeath(fn) {
  listeners.add(fn);
  fn(state);
  return () => listeners.delete(fn);
}

export function setDeathPhase(phase, extra = {}) {
  if (!PHASES.includes(phase)) return;
  state = { ...state, ...extra, phase };
  emit();
}

export function isDead() {
  return state.phase !== 'alive';
}