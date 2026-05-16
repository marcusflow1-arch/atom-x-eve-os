// ─── Halo Store ────────────────────────────────────────────────────────────
// Persistent, account-wide Halo progression driven by a PvP-kill
// ENHANCEMENT/GAMBLE system (like elixir enhancement):
//
//   1. Player earns PvP kills → banked as `kills` currency.
//   2. To level up, player spends HALO_ATTEMPT_COST (10) kills on an attempt.
//   3. The attempt rolls against `getSuccessChanceForLevel(currentLevel)`.
//      - Success → Halo Level +1.
//      - Failure → kills are consumed, level unchanged.
//
// API mirrors the existing weaponClassBuffStore pattern (no zustand dep).
//
//   recordPvPKill()         — bank kills earned in PvP combat
//   attemptEnhancement()    — spend kills, roll for level up
//   getHaloState()          — full snapshot for UI
//   getHaloBonuses()        — bonuses applied to stats pipeline
//   subscribeHalo(fn)       — reactive subscription
//   setHaloLevel(level)     — admin / debug
//   resetHalo()             — admin / debug

import {
  MAX_HALO_LEVEL,
  HALO_ATTEMPT_COST,
  getSuccessChanceForLevel,
  getTierForLevel,
  getHaloBonusesForLevel,
} from './haloData';

const STORAGE_KEY = 'halo_progression_v2';

const loadState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        level:           Math.max(0, Math.min(MAX_HALO_LEVEL, parsed.level || 0)),
        kills:           Math.max(0, parsed.kills || 0),
        totalKills:      Math.max(0, parsed.totalKills || 0),
        totalAttempts:   Math.max(0, parsed.totalAttempts || 0),
        totalSuccesses:  Math.max(0, parsed.totalSuccesses || 0),
      };
    }
  } catch {}
  return { level: 0, kills: 0, totalKills: 0, totalAttempts: 0, totalSuccesses: 0 };
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
  const successChance = getSuccessChanceForLevel(state.level);
  return {
    level:           state.level,
    kills:           state.kills,           // banked, ready-to-spend kill currency
    totalKills:      state.totalKills,      // lifetime kills (never decremented)
    totalAttempts:   state.totalAttempts,
    totalSuccesses:  state.totalSuccesses,
    attemptCost:     HALO_ATTEMPT_COST,
    canAttempt:      state.kills >= HALO_ATTEMPT_COST && state.level < MAX_HALO_LEVEL,
    successChance,                          // 0..1 for the NEXT attempt
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

// Bank a PvP kill. Returns the new kill currency total.
export function recordPvPKill(count = 1) {
  if (count <= 0) return state.kills;
  state = {
    ...state,
    kills:      state.kills + count,
    totalKills: state.totalKills + count,
  };
  save();
  emit();
  return state.kills;
}

// Attempt to enhance the Halo. Returns:
//   { ok: false, reason }                                — couldn't attempt
//   { ok: true, success: true,  level, chance }          — leveled up
//   { ok: true, success: false, level, chance }          — failed, kills lost
export function attemptEnhancement() {
  if (state.level >= MAX_HALO_LEVEL) {
    return { ok: false, reason: 'max_level' };
  }
  if (state.kills < HALO_ATTEMPT_COST) {
    return { ok: false, reason: 'insufficient_kills', need: HALO_ATTEMPT_COST, have: state.kills };
  }

  const chance = getSuccessChanceForLevel(state.level);
  const success = Math.random() < chance;

  let nextLevel = state.level;
  if (success) nextLevel += 1;

  state = {
    ...state,
    kills:          state.kills - HALO_ATTEMPT_COST,
    level:          nextLevel,
    totalAttempts:  state.totalAttempts + 1,
    totalSuccesses: state.totalSuccesses + (success ? 1 : 0),
  };
  save();
  emit();
  return { ok: true, success, level: nextLevel, chance };
}

export function setHaloLevel(level) {
  state = {
    ...state,
    level: Math.max(0, Math.min(MAX_HALO_LEVEL, Math.round(level))),
  };
  save();
  emit();
}

export function resetHalo() {
  state = { level: 0, kills: 0, totalKills: 0, totalAttempts: 0, totalSuccesses: 0 };
  save();
  emit();
}