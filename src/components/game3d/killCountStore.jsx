// ─── Kill Count Store ────────────────────────────────────────────────
// Tracks the player's total enemy-player (rogue AI) kills. Persists to
// localStorage so the count survives reloads. Used by the HUD portrait
// (shown above the player's name) and any future bounty/title logic.

const LS_KEY = 'game_player_kill_count_v1';

function loadInitial() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const n = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(n) ? n : 0;
  } catch { return 0; }
}

let _count = loadInitial();
const _listeners = new Set();

function persist() {
  try { localStorage.setItem(LS_KEY, String(_count)); } catch {}
}

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