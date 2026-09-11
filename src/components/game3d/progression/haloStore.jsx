import {
  MAX_HALO_LEVEL,
  HALO_CP_COST,
  HALO_SILVER_COST,
  getSuccessChanceForLevel,
  getDelevelChanceOnFailure,
  getTierForLevel,
  getHaloBonusesForLevel,
} from './haloData';
import {
  getContributionState,
  spendContribution,
  addContribution,
  subscribeContribution,
} from './contributionStore';
import { getShopState, spendGold, addGold, subscribeShop } from '../shop/shopStore';
import { characterScopedStorage, subscribeCharacterChange } from '../characterStorage';

const storage = characterScopedStorage('halo_progression_v4');
const LEGACY_STORAGE = characterScopedStorage('halo_progression_v3');
const listeners = new Set();

function defaultState() {
  return {
    level: 0,
    totalAttempts: 0,
    totalSuccesses: 0,
    totalFailures: 0,
    totalDelevels: 0,
    lastOutcome: null,
  };
}

function normalize(parsed) {
  if (!parsed || typeof parsed !== 'object') return defaultState();
  return {
    ...defaultState(),
    level: Math.max(0, Math.min(MAX_HALO_LEVEL, Math.floor(Number(parsed.level) || 0))),
    totalAttempts: Math.max(0, Math.floor(Number(parsed.totalAttempts) || 0)),
    totalSuccesses: Math.max(0, Math.floor(Number(parsed.totalSuccesses) || 0)),
    totalFailures: Math.max(0, Math.floor(Number(parsed.totalFailures) || 0)),
    totalDelevels: Math.max(0, Math.floor(Number(parsed.totalDelevels) || 0)),
    lastOutcome: parsed.lastOutcome || null,
  };
}

function loadState() {
  try {
    const current = storage.get();
    if (current) return normalize(JSON.parse(current));
    const legacy = LEGACY_STORAGE.get();
    if (legacy) return normalize(JSON.parse(legacy));
  } catch {}
  return defaultState();
}

let state = loadState();
const save = () => storage.set(JSON.stringify(state));

function snapshot() {
  const cp = getContributionState().cp;
  const silver = getShopState().gold;
  const successChance = getSuccessChanceForLevel(state.level);
  const delevelChance = getDelevelChanceOnFailure(state.level);
  return {
    level: state.level,
    totalAttempts: state.totalAttempts,
    totalSuccesses: state.totalSuccesses,
    totalFailures: state.totalFailures,
    totalDelevels: state.totalDelevels,
    lastOutcome: state.lastOutcome,
    cp,
    silver,
    cpCost: HALO_CP_COST,
    silverCost: HALO_SILVER_COST,
    canAttempt: state.level < MAX_HALO_LEVEL && cp >= HALO_CP_COST && silver >= HALO_SILVER_COST,
    successChance,
    delevelChance,
    tier: getTierForLevel(state.level),
    bonuses: getHaloBonusesForLevel(state.level),
    isMaxLevel: state.level >= MAX_HALO_LEVEL,
  };
}

const emit = () => {
  save();
  const value = snapshot();
  listeners.forEach((fn) => fn(value));
};

subscribeCharacterChange(() => {
  state = loadState();
  emit();
});
subscribeContribution(() => emit());
subscribeShop(() => emit());

export function getHaloState() { return snapshot(); }
export function getHaloBonuses() { return getHaloBonusesForLevel(state.level); }
export function subscribeHalo(fn) {
  listeners.add(fn);
  fn(snapshot());
  return () => listeners.delete(fn);
}

export function attemptEnhancement() {
  if (state.level >= MAX_HALO_LEVEL) return { ok: false, reason: 'max_level' };

  const contribution = getContributionState();
  const shop = getShopState();
  if (contribution.cp < HALO_CP_COST) {
    return { ok: false, reason: 'insufficient_cp', need: HALO_CP_COST, have: contribution.cp };
  }
  if (shop.gold < HALO_SILVER_COST) {
    return { ok: false, reason: 'insufficient_silver', need: HALO_SILVER_COST, have: shop.gold };
  }

  const cpSpend = spendContribution(HALO_CP_COST);
  if (!cpSpend.ok) return cpSpend;
  const silverSpend = spendGold(HALO_SILVER_COST);
  if (!silverSpend.ok) {
    addContribution(HALO_CP_COST);
    return silverSpend;
  }

  const previousLevel = state.level;
  const successChance = getSuccessChanceForLevel(previousLevel);
  const delevelChance = getDelevelChanceOnFailure(previousLevel);
  const success = Math.random() < successChance;

  let outcome = 'failure';
  let nextLevel = previousLevel;
  if (success) {
    outcome = 'success';
    nextLevel = Math.min(MAX_HALO_LEVEL, previousLevel + 1);
  } else if (previousLevel > 0 && Math.random() < delevelChance) {
    outcome = 'delevel';
    nextLevel = Math.max(0, previousLevel - 1);
  }

  state = {
    ...state,
    level: nextLevel,
    totalAttempts: state.totalAttempts + 1,
    totalSuccesses: state.totalSuccesses + (outcome === 'success' ? 1 : 0),
    totalFailures: state.totalFailures + (outcome === 'failure' ? 1 : 0),
    totalDelevels: state.totalDelevels + (outcome === 'delevel' ? 1 : 0),
    lastOutcome: {
      outcome,
      previousLevel,
      level: nextLevel,
      successChance,
      delevelChance,
      spentCP: HALO_CP_COST,
      spentSilver: HALO_SILVER_COST,
      at: Date.now(),
    },
  };
  emit();
  return { ok: true, outcome, success: outcome === 'success', level: nextLevel, previousLevel, successChance, delevelChance };
}

export function attemptEnhancementBatch(count) {
  const requested = Math.max(1, Math.floor(Number(count) || 1));
  let attempts = 0;
  let successes = 0;
  let failures = 0;
  let delevels = 0;
  for (let i = 0; i < requested; i += 1) {
    const result = attemptEnhancement();
    if (!result.ok) break;
    attempts += 1;
    if (result.outcome === 'success') successes += 1;
    else if (result.outcome === 'delevel') delevels += 1;
    else failures += 1;
    if (state.level >= MAX_HALO_LEVEL) break;
  }
  return { attempts, successes, failures, delevels, finalLevel: state.level };
}

export function setHaloLevel(level) {
  state = {
    ...state,
    level: Math.max(0, Math.min(MAX_HALO_LEVEL, Math.round(Number(level) || 0))),
    lastOutcome: null,
  };
  emit();
}

export function resetHalo({ refund = false } = {}) {
  if (refund && state.totalAttempts > 0) {
    addContribution(state.totalAttempts * HALO_CP_COST);
    addGold(state.totalAttempts * HALO_SILVER_COST);
  }
  state = defaultState();
  emit();
}
