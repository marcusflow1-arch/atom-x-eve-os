// ─── Wings Store ───────────────────────────────────────────────────────────
// Persistent, character-scoped Angel Wings progression.
//
// Each Wing path (type) tracks its OWN level, raised via the same attempt/RNG
// spend of HUD kills as Halo (HALO_ATTEMPT_COST, Halo success bands). You can
// level each wing type SEPARATELY. Only ONE wing is equipped at a time — that
// one contributes its multiplier + specialization to derived stats.
//
// API:
//   attemptWingEnhancement(pathId)       — spend kills, roll level up on a path
//   attemptWingEnhancementBatch(pathId) — run N attempts in sequence
//   equipWings(pathId) / unequipWings()  — set the active wing
//   getWingsState()                     — full snapshot for UI
//   getEquippedWingsMultiplierBonuses()  — virtual attribute points for statsSystem
//   getEquippedWingsFlatBonuses()        — flat final stats for statsSystem
//   subscribeWings(fn)                  — reactive subscription (re-emits on kills)
//   setWingLevel(pathId, level)          — admin / debug
//   resetWings()                        — admin / debug

import {
  MAX_WING_LEVEL,
  WING_ATTEMPT_COST,
  getWingSuccessChance,
  getWingMultiplierForLevel,
  getWingFlatBonusesForLevel,
  getWingPathById,
  WING_PATHS,
} from './wingsData';
import {
  getKillCount,
  incrementKillCount,
  subscribeKillCount,
} from '../killCountStore';
import { characterScopedStorage, subscribeCharacterChange } from '../characterStorage';

const storage = characterScopedStorage('wings_progression_v1');

const initialPaths = () => {
  const p = {};
  WING_PATHS.forEach((w) => { p[w.id] = { level: 0, totalAttempts: 0, totalSuccesses: 0 }; });
  return p;
};

const loadState = () => {
  try {
    const raw = storage.get();
    if (raw) {
      const parsed = JSON.parse(raw);
      const paths = initialPaths();
      Object.keys(parsed.paths || {}).forEach((id) => {
        if (paths[id]) {
          const p = parsed.paths[id];
          paths[id] = {
            level:          Math.max(0, Math.min(MAX_WING_LEVEL, p.level || 0)),
            totalAttempts:  Math.max(0, p.totalAttempts || 0),
            totalSuccesses: Math.max(0, p.totalSuccesses || 0),
          };
        }
      });
      return { paths, equippedPathId: parsed.equippedPathId || null };
    }
  } catch {}
  return { paths: initialPaths(), equippedPathId: null };
};

let state = loadState();
const listeners = new Set();
const save = () => { storage.set(JSON.stringify(state)); };
const emit = () => { listeners.forEach((fn) => fn(getWingsState())); };

subscribeCharacterChange(() => { state = loadState(); emit(); });
subscribeKillCount(() => emit());

// ── Public API ────────────────────────────────────────────────────────────

export function getWingsState() {
  const kills = getKillCount();
  const paths = {};
  WING_PATHS.forEach((def) => {
    const p = state.paths[def.id];
    paths[def.id] = {
      ...def,
      level:           p.level,
      totalAttempts:   p.totalAttempts,
      totalSuccesses:  p.totalSuccesses,
      isMaxLevel:      p.level >= MAX_WING_LEVEL,
      successChance:   getWingSuccessChance(p.level),
      multiplierBonuses: getWingMultiplierForLevel(p.level),
      flatBonuses:     getWingFlatBonusesForLevel(def.id, p.level),
      nextFlatBonuses: p.level < MAX_WING_LEVEL
        ? getWingFlatBonusesForLevel(def.id, p.level + 1)
        : null,
    };
  });
  return {
    paths,
    equippedPathId: state.equippedPathId,
    equippedWing: state.equippedPathId ? paths[state.equippedPathId] : null,
    attemptCost: WING_ATTEMPT_COST,
    kills,
  };
}

export function subscribeWings(fn) {
  listeners.add(fn);
  fn(getWingsState());
  return () => listeners.delete(fn);
}

export function equipWings(pathId) {
  if (!getWingPathById(pathId)) return;
  state.equippedPathId = pathId;
  save();
  emit();
}

export function unequipWings() {
  state.equippedPathId = null;
  save();
  emit();
}

// Attempt to enhance a specific wing path. Spends WING_ATTEMPT_COST kills.
export function attemptWingEnhancement(pathId) {
  const p = state.paths[pathId];
  if (!p) return { ok: false, reason: 'no_path' };
  if (p.level >= MAX_WING_LEVEL) return { ok: false, reason: 'max_level' };
  const banked = getKillCount();
  if (banked < WING_ATTEMPT_COST) {
    return { ok: false, reason: 'insufficient_kills', need: WING_ATTEMPT_COST, have: banked };
  }
  const chance = getWingSuccessChance(p.level);
  const success = Math.random() < chance;
  let nextLevel = p.level;
  if (success) nextLevel += 1;
  state.paths[pathId] = {
    ...p,
    level:          nextLevel,
    totalAttempts:  p.totalAttempts + 1,
    totalSuccesses: p.totalSuccesses + (success ? 1 : 0),
  };
  save();
  incrementKillCount(-WING_ATTEMPT_COST);
  return { ok: true, success, level: nextLevel, chance, pathId };
}

export function attemptWingEnhancementBatch(pathId, count) {
  const n = Math.max(1, Math.floor(count || 0));
  let attempts = 0;
  let successes = 0;
  for (let i = 0; i < n; i++) {
    const r = attemptWingEnhancement(pathId);
    if (!r.ok) break;
    attempts += 1;
    if (r.success) successes += 1;
    if ((state.paths[pathId]?.level || 0) >= MAX_WING_LEVEL) break;
  }
  return { attempts, successes, finalLevel: state.paths[pathId]?.level || 0 };
}

// ── Stats pipeline hooks ──────────────────────────────────────────────────
// Only the EQUIPPED wing contributes bonuses. Multiplier = virtual attribute
// points (same shape as Halo); flat = final stats (same shape as Title).
export function getEquippedWingsMultiplierBonuses() {
  if (!state.equippedPathId) return null;
  const p = state.paths[state.equippedPathId];
  return getWingMultiplierForLevel(p.level);
}

export function getEquippedWingsFlatBonuses() {
  if (!state.equippedPathId) {
    return { hp: 0, damage: 0, defense: 0, critChance: 0, critDamage: 0, criticalDefense: 0 };
  }
  const p = state.paths[state.equippedPathId];
  return getWingFlatBonusesForLevel(state.equippedPathId, p.level);
}

export function setWingLevel(pathId, level) {
  const p = state.paths[pathId];
  if (!p) return;
  state.paths[pathId] = { ...p, level: Math.max(0, Math.min(MAX_WING_LEVEL, Math.round(level))) };
  save();
  emit();
}

export function resetWings() {
  state = { paths: initialPaths(), equippedPathId: null };
  save();
  emit();
}