// ─── Aura Store ────────────────────────────────────────────────────────────
// Persistent, character-scoped Aura progression. Mirrors haloStore exactly
// (spend HUD kills → roll enhancement → level up), but keeps an independent
// Aura level so Aura and Halo can be leveled in parallel.
//
// API:
//   attemptAuraEnhancement()      — spend kills, roll for Aura level up
//   attemptAuraEnhancementBatch() — run N attempts in sequence
//   getAuraState()                — full snapshot for UI
//   getAuraBonuses()              — virtual attribute points for statsSystem
//   subscribeAura(fn)             — reactive subscription (re-emits on kills)
//   setAuraLevel(level)            — admin / debug
//   resetAura()                    — admin / debug

import {
  MAX_AURA_LEVEL,
  AURA_ATTEMPT_COST,
  getAuraSuccessChance,
  getAuraBonusesForLevel,
  getAuraTierForLevel,
} from './auraData';
import {
  getKillCount,
  incrementKillCount,
  subscribeKillCount,
} from '../killCountStore';
import { characterScopedStorage, subscribeCharacterChange } from '../characterStorage';

const storage = characterScopedStorage('aura_progression_v1');

const loadState = () => {
  try {
    const raw = storage.get();
    if (raw) {
      const p = JSON.parse(raw);
      return {
        level:          Math.max(0, Math.min(MAX_AURA_LEVEL, p.level || 0)),
        totalAttempts:  Math.max(0, p.totalAttempts || 0),
        totalSuccesses: Math.max(0, p.totalSuccesses || 0),
      };
    }
  } catch {}
  return { level: 0, totalAttempts: 0, totalSuccesses: 0 };
};

let state = loadState();
const listeners = new Set();
const save = () => { storage.set(JSON.stringify(state)); };
const emit = () => { listeners.forEach((fn) => fn(getAuraState())); };

subscribeCharacterChange(() => { state = loadState(); emit(); });
subscribeKillCount(() => emit());

// ── Public API ────────────────────────────────────────────────────────────

export function getAuraState() {
  const bonuses = getAuraBonusesForLevel(state.level);
  const successChance = getAuraSuccessChance(state.level);
  const kills = getKillCount();
  return {
    level:          state.level,
    kills,
    totalAttempts:  state.totalAttempts,
    totalSuccesses: state.totalSuccesses,
    attemptCost:    AURA_ATTEMPT_COST,
    canAttempt:     kills >= AURA_ATTEMPT_COST && state.level < MAX_AURA_LEVEL,
    successChance,
    tier:           getAuraTierForLevel(state.level),
    bonuses,
    isMaxLevel:     state.level >= MAX_AURA_LEVEL,
  };
}

export function getAuraBonuses() {
  return getAuraBonusesForLevel(state.level);
}

export function subscribeAura(fn) {
  listeners.add(fn);
  fn(getAuraState());
  return () => listeners.delete(fn);
}

export function attemptAuraEnhancement() {
  if (state.level >= MAX_AURA_LEVEL) return { ok: false, reason: 'max_level' };
  const banked = getKillCount();
  if (banked < AURA_ATTEMPT_COST) {
    return { ok: false, reason: 'insufficient_kills', need: AURA_ATTEMPT_COST, have: banked };
  }
  const chance = getAuraSuccessChance(state.level);
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
  incrementKillCount(-AURA_ATTEMPT_COST);
  return { ok: true, success, level: nextLevel, chance };
}

export function attemptAuraEnhancementBatch(count) {
  const n = Math.max(1, Math.floor(count || 0));
  let attempts = 0;
  let successes = 0;
  for (let i = 0; i < n; i++) {
    const r = attemptAuraEnhancement();
    if (!r.ok) break;
    attempts += 1;
    if (r.success) successes += 1;
    if (state.level >= MAX_AURA_LEVEL) break;
  }
  return { attempts, successes, finalLevel: state.level };
}

export function setAuraLevel(level) {
  state = { ...state, level: Math.max(0, Math.min(MAX_AURA_LEVEL, Math.round(level))) };
  save();
  emit();
}

export function resetAura() {
  state = { level: 0, totalAttempts: 0, totalSuccesses: 0 };
  save();
  emit();
}