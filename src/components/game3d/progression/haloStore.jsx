// ─── Halo Store ────────────────────────────────────────────────────────────
// Persistent, account-wide store for the player's Halo progression.
// Driven by PvP kills — every player kill grants 1 Halo XP. When accumulated
// kills meet `killsRequiredForNextLevel(currentLevel)`, the Halo levels up.
//
// API mirrors the existing weaponClassBuffStore pattern (no zustand dep).
//
//   recordPvPKill()         — call when player kills another player
//   getHaloState()          — { level, killsThisLevel, totalKills, tier, bonuses }
//   getHaloBonuses()        — current applied bonuses (for stats pipeline)
//   subscribeHalo(fn)       — reactive subscription
//   setHaloLevel(level)     — admin / debug
//   resetHalo()             — admin / debug

import {
  MAX_HALO_LEVEL,
  killsRequiredForNextLevel,
  getTierForLevel,
  getHaloBonusesForLevel,
} from './haloData';

const STORAGE_KEY = 'halo_progression_v1';

const loadState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        level:           Math.max(0, Math.min(MAX_HALO_LEVEL, parsed.level || 0)),
        killsThisLevel:  Math.max(0, parsed.killsThisLevel || 0),
        totalKills:      Math.max(0, parsed.totalKills || 0),
      };
    }
  } catch {}
  return { level: 0, killsThisLevel: 0, totalKills: 0 };
};

let state = loadState();
const listeners = new Set();

const save = () => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
};

const emit = () => {
  const snapshot = getHaloState();
  listeners.forEach((fn) => fn(snapshot));
};

// ── Public API ────────────────────────────────────────────────────────────

export function getHaloState() {
  const bonuses = getHaloBonusesForLevel(state.level);
  return {
    level:           state.level,
    killsThisLevel:  state.killsThisLevel,
    killsRequired:   killsRequiredForNextLevel(state.level),
    totalKills:      state.totalKills,
    tier:            getTierForLevel(state.level),
    bonuses,
    isMaxLevel:      state.level >= MAX_HALO_LEVEL,
  };
}

export function getHaloBonuses() {
  return getHaloBonusesForLevel(state.level);
}

export function subscribeHalo(fn) {
  listeners.add(fn);
  fn(getHaloState());
  return () => listeners.delete(fn);
}

// Award PvP kill(s). Returns the number of times the halo leveled up
// during this call so callers can show "Halo Level Up!" toasts.
export function recordPvPKill(count = 1) {
  if (count <= 0) return 0;
  let levelUps = 0;
  let { level, killsThisLevel, totalKills } = state;
  totalKills += count;
  killsThisLevel += count;

  while (level < MAX_HALO_LEVEL) {
    const need = killsRequiredForNextLevel(level);
    if (killsThisLevel < need) break;
    killsThisLevel -= need;
    level += 1;
    levelUps += 1;
  }
  if (level >= MAX_HALO_LEVEL) killsThisLevel = 0;

  state = { level, killsThisLevel, totalKills };
  save();
  emit();
  return levelUps;
}

export function setHaloLevel(level) {
  state = {
    level: Math.max(0, Math.min(MAX_HALO_LEVEL, Math.round(level))),
    killsThisLevel: 0,
    totalKills: state.totalKills,
  };
  save();
  emit();
}

export function resetHalo() {
  state = { level: 0, killsThisLevel: 0, totalKills: 0 };
  save();
  emit();
}