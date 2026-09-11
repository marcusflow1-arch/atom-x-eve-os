import { characterScopedStorage, subscribeCharacterChange } from '../characterStorage';

const storage = characterScopedStorage('twelvesky_contribution_v1');
const listeners = new Set();

const defaultState = () => ({
  cp: 0,
  lifetimeEarned: 0,
  lifetimeSpent: 0,
  lastReason: null,
});

function loadState() {
  try {
    const raw = storage.get();
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return {
      cp: Math.max(0, Number(parsed.cp) || 0),
      lifetimeEarned: Math.max(0, Number(parsed.lifetimeEarned) || 0),
      lifetimeSpent: Math.max(0, Number(parsed.lifetimeSpent) || 0),
      lastReason: parsed.lastReason || null,
    };
  } catch { return defaultState(); }
}

let state = loadState();

function save() { storage.set(JSON.stringify(state)); }
function emit() { const s = getContributionState(); listeners.forEach((fn) => fn(s)); }

subscribeCharacterChange(() => { state = loadState(); emit(); });

export function getContributionState() { return { ...state }; }
export function getContributionPoints() { return state.cp; }

export function subscribeContribution(fn) {
  listeners.add(fn);
  fn(getContributionState());
  return () => listeners.delete(fn);
}

export function grantContributionPoints(amount, reason = 'reward') {
  const n = Math.max(0, Math.floor(Number(amount) || 0));
  if (!n) return 0;
  state = {
    ...state,
    cp: state.cp + n,
    lifetimeEarned: state.lifetimeEarned + n,
    lastReason: reason,
  };
  save(); emit();
  return n;
}

export function spendContributionPoints(amount, reason = 'purchase') {
  const n = Math.max(0, Math.floor(Number(amount) || 0));
  if (!n) return { ok: false, reason: 'Invalid CP cost.' };
  if (state.cp < n) return { ok: false, reason: `Need ${n - state.cp} more CP.` };
  state = {
    ...state,
    cp: state.cp - n,
    lifetimeSpent: state.lifetimeSpent + n,
    lastReason: reason,
  };
  save(); emit();
  return { ok: true, spent: n, remaining: state.cp };
}

// Simplified field rewards. War/event systems can grant their own exact CP
// values directly; this only gives the open-world loop a small contribution
// feed so the remote title/CP systems are testable and useful.
export const FIELD_CP_REWARDS = Object.freeze({
  normal: 0,
  elite: 1,
  boss: 5,
  pvp: 1,
  raid: 3,
});

export function awardFieldContribution(kind = 'normal', count = 1) {
  const per = FIELD_CP_REWARDS[kind] ?? 0;
  const total = Math.max(0, Math.floor(count)) * per;
  return total > 0 ? grantContributionPoints(total, `${kind}_combat`) : 0;
}

export function setContributionPoints(amount) {
  state = { ...state, cp: Math.max(0, Math.floor(Number(amount) || 0)) };
  save(); emit();
}
