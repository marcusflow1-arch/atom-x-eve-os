// ─── Halo Store ────────────────────────────────────────────────────────────
// Persistent, account-wide Halo progression driven by an ENHANCEMENT/GAMBLE
// system that spends the player's REAL kill count (the same counter shown
// above the player's name in the HUD) as currency.
//
//   1. Every rogue kill banks +1 into killCountStore (the HUD kill count).
//   2. To level up the Halo, the player spends HALO_ATTEMPT_COST (10) of
//      those kills on an attempt.
//   3. The attempt rolls against `getSuccessChanceForLevel(currentLevel)`.
//      - Success → Halo Level +1.
//      - Failure → kills are consumed, level unchanged.
//
// This means the kill count in your HUD pill is literally the currency for
// the Halo system — kill 50 rogues, get 5 attempts.
//
// API:
//   attemptEnhancement()    — spend kills, roll for level up
//   getHaloState()          — full snapshot for UI
//   getHaloBonuses()        — bonuses applied to stats pipeline
//   subscribeHalo(fn)       — reactive subscription (re-emits on kill change)
//   setHaloLevel(level)     — admin / debug
//   resetHalo()             — admin / debug

import {
  MAX_HALO_LEVEL,
  HALO_ATTEMPT_COST,
  getSuccessChanceForLevel,
  getTierForLevel,
  getHaloBonusesForLevel,
} from './haloData';
import {
  getKillCount,
  incrementKillCount,
  subscribeKillCount,
} from '../killCountStore';

const STORAGE_KEY = 'halo_progression_v3';

const loadState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        level:           Math.max(0, Math.min(MAX_HALO_LEVEL, parsed.level || 0)),
        totalAttempts:   Math.max(0, parsed.totalAttempts || 0),
        totalSuccesses:  Math.max(0, parsed.totalSuccesses || 0),
      };
    }
  } catch {}
  return { level: 0, totalAttempts: 0, totalSuccesses: 0 };
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

// Re-emit whenever the player's kill count changes so the UI (banked-kills
// + can-attempt button) updates live every time you defeat a rogue.
subscribeKillCount(() => emit());

// ── Public API ────────────────────────────────────────────────────────────

export function getHaloState() {
  const bonuses = getHaloBonusesForLevel(state.level);
  const successChance = getSuccessChanceForLevel(state.level);
  const kills = getKillCount();
  return {
    level:           state.level,
    kills,                                  // mirrors the HUD kill count — the spendable currency
    totalAttempts:   state.totalAttempts,
    totalSuccesses:  state.totalSuccesses,
    attemptCost:     HALO_ATTEMPT_COST,
    canAttempt:      kills >= HALO_ATTEMPT_COST && state.level < MAX_HALO_LEVEL,
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

// Attempt to enhance the Halo. Spends HALO_ATTEMPT_COST kills from the
// player's HUD kill counter (killCountStore). Returns:
//   { ok: false, reason }                                — couldn't attempt
//   { ok: true, success: true,  level, chance }          — leveled up
//   { ok: true, success: false, level, chance }          — failed, kills lost
export function attemptEnhancement() {
  if (state.level >= MAX_HALO_LEVEL) {
    return { ok: false, reason: 'max_level' };
  }
  const banked = getKillCount();
  if (banked < HALO_ATTEMPT_COST) {
    return { ok: false, reason: 'insufficient_kills', need: HALO_ATTEMPT_COST, have: banked };
  }

  const chance = getSuccessChanceForLevel(state.level);
  const success = Math.random() < chance;

  let nextLevel = state.level;
  if (success) nextLevel += 1;

  state = {
    ...state,
    level:          nextLevel,
    totalAttempts:  state.totalAttempts + 1,
    totalSuccesses: state.totalSuccesses + (success ? 1 : 0),
  };
  save();

  // Spend the kills from the real HUD counter — this will trigger the
  // killCountStore subscription above and re-emit the halo state.
  incrementKillCount(-HALO_ATTEMPT_COST);

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
  state = { level: 0, totalAttempts: 0, totalSuccesses: 0 };
  save();
  emit();
}