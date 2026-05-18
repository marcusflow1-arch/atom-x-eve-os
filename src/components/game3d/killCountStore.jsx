// ─── Kill Count Store ────────────────────────────────────────────────
// Tracks the player's total enemy-player (rogue AI) kills. Persists to
// localStorage so the count survives reloads. Used by the HUD portrait
// (shown above the player's name) and any future bounty/title logic.

import { characterScopedStorage, subscribeCharacterChange } from './characterStorage';

const storage = characterScopedStorage('game_player_kill_count_v1');

function loadInitial() {
  try {
    const raw = storage.get();
    const n = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(n) ? n : 0;
  } catch { return 0; }
}

let _count = loadInitial();
const _listeners = new Set();

function persist() { storage.set(String(_count)); }

// Reload this character's kill count when the active character switches.
subscribeCharacterChange(() => {
  _count = loadInitial();
  _listeners.forEach((fn) => fn(_count));
});

export function getKillCount() { return _count; }

export function incrementKillCount(n = 1) {
  _count = Math.max(0, _count + n);
  persist();
  _listeners.forEach((fn) => fn(_count));
}

export function resetKillCount() {
  _count = 0;
  persist();
  _listeners.forEach((fn) => fn(_count));
}

export function subscribeKillCount(fn) {
  _listeners.add(fn);
  fn(_count);
  return () => _listeners.delete(fn);
}