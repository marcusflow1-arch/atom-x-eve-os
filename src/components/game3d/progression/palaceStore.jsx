import {
  MAX_PALACE_RANK,
  PALACE_CP_COST,
  PALACE_SILVER_COST,
  getPalaceBonuses,
  getPalaceCriticalDefense,
  getPalaceSuccessChance,
  getPalaceTier,
} from './palaceData';
import { getContributionState, spendContribution, addContribution, subscribeContribution } from './contributionStore';
import { getShopState, spendGold, addGold, subscribeShop } from '../shop/shopStore';
import { characterScopedStorage, subscribeCharacterChange } from '../characterStorage';

const storage = characterScopedStorage('twelvesky_palace_rank_v1');
const listeners = new Set();

const makeDefault = () => ({
  rank: 0,
  imperialPardons: 0,
  attempts: 0,
  successes: 0,
  failures: 0,
  protectedFailures: 0,
  lastOutcome: null,
});

function load() {
  try {
    const raw = storage.get();
    if (!raw) return makeDefault();
    const parsed = JSON.parse(raw);
    return {
      ...makeDefault(),
      ...parsed,
      rank: Math.max(0, Math.min(MAX_PALACE_RANK, Math.floor(Number(parsed.rank) || 0))),
      imperialPardons: Math.max(0, Math.floor(Number(parsed.imperialPardons) || 0)),
    };
  } catch { return makeDefault(); }
}

let state = load();
const save = () => storage.set(JSON.stringify(state));

function snapshot() {
  const cp = getContributionState().cp;
  const silver = getShopState().gold;
  return {
    ...state,
    cp,
    silver,
    cpCost: PALACE_CP_COST,
    silverCost: PALACE_SILVER_COST,
    successChance: getPalaceSuccessChance(state.rank),
    tier: getPalaceTier(state.rank),
    criticalDefense: getPalaceCriticalDefense(state.rank),
    bonuses: getPalaceBonuses(state.rank),
    isMaxRank: state.rank >= MAX_PALACE_RANK,
    canAttempt: state.rank < MAX_PALACE_RANK && cp >= PALACE_CP_COST && silver >= PALACE_SILVER_COST,
  };
}

const emit = () => {
  save();
  const value = snapshot();
  listeners.forEach((fn) => fn(value));
};

subscribeCharacterChange(() => { state = load(); emit(); });
subscribeContribution(() => emit());
subscribeShop(() => emit());

export function getPalaceState() { return snapshot(); }
export function getPalaceBonusesForPlayer() { return getPalaceBonuses(state.rank); }
export function subscribePalace(fn) { listeners.add(fn); fn(snapshot()); return () => listeners.delete(fn); }

export function grantImperialPardon(count = 1) {
  const amount = Math.max(0, Math.floor(Number(count) || 0));
  if (!amount) return 0;
  state = { ...state, imperialPardons: state.imperialPardons + amount };
  emit();
  return amount;
}

export function attemptPalaceRank({ usePardon = true } = {}) {
  if (state.rank >= MAX_PALACE_RANK) return { ok: false, reason: 'max_rank' };
  const contribution = getContributionState();
  const shop = getShopState();
  if (contribution.cp < PALACE_CP_COST) return { ok: false, reason: 'insufficient_cp', need: PALACE_CP_COST, have: contribution.cp };
  if (shop.gold < PALACE_SILVER_COST) return { ok: false, reason: 'insufficient_silver', need: PALACE_SILVER_COST, have: shop.gold };

  const cpSpend = spendContribution(PALACE_CP_COST);
  if (!cpSpend.ok) return cpSpend;
  const silverSpend = spendGold(PALACE_SILVER_COST);
  if (!silverSpend.ok) {
    addContribution(PALACE_CP_COST);
    return silverSpend;
  }

  const previousRank = state.rank;
  const chance = getPalaceSuccessChance(previousRank);
  const success = Math.random() < chance;
  let outcome = 'success';
  let rank = previousRank;
  let pardons = state.imperialPardons;

  if (success) {
    rank = Math.min(MAX_PALACE_RANK, previousRank + 1);
  } else if (usePardon && pardons > 0) {
    outcome = 'protected_failure';
    pardons -= 1;
  } else {
    outcome = 'delevel';
    rank = Math.max(0, previousRank - 1);
  }

  state = {
    ...state,
    rank,
    imperialPardons: pardons,
    attempts: state.attempts + 1,
    successes: state.successes + (success ? 1 : 0),
    failures: state.failures + (success ? 0 : 1),
    protectedFailures: state.protectedFailures + (outcome === 'protected_failure' ? 1 : 0),
    lastOutcome: { outcome, previousRank, rank, chance, at: Date.now() },
  };
  emit();
  return { ok: true, success, outcome, previousRank, rank, chance };
}

export function setPalaceRank(rank) {
  state = { ...state, rank: Math.max(0, Math.min(MAX_PALACE_RANK, Math.floor(Number(rank) || 0))) };
  emit();
}

export function resetPalace({ refund = false } = {}) {
  if (refund && state.attempts > 0) {
    addContribution(state.attempts * PALACE_CP_COST);
    addGold(state.attempts * PALACE_SILVER_COST);
  }
  state = makeDefault();
  emit();
}
