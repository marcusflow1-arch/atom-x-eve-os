import { characterScopedStorage, subscribeCharacterChange } from '../characterStorage';

const storage = characterScopedStorage('twelvesky_contribution_v1');
const STARTING_CP = 10000;
const listeners = new Set();

function load() {
  try {
    const raw = storage.get();
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        cp: Math.max(0, Number(parsed.cp) || 0),
        lifetimeEarned: Math.max(0, Number(parsed.lifetimeEarned) || 0),
        lifetimeSpent: Math.max(0, Number(parsed.lifetimeSpent) || 0),
      };
    }
  } catch {}
  return { cp: STARTING_CP, lifetimeEarned: STARTING_CP, lifetimeSpent: 0 };
}

let state = load();
const save = () => storage.set(JSON.stringify(state));
const emit = () => {
  save();
  listeners.forEach((fn) => fn({ ...state }));
};

subscribeCharacterChange(() => {
  state = load();
  listeners.forEach((fn) => fn({ ...state }));
});

export function getContributionState() { return { ...state }; }
export function subscribeContribution(fn) {
  listeners.add(fn);
  fn({ ...state });
  return () => listeners.delete(fn);
}

export function addContribution(amount) {
  const value = Math.max(0, Math.floor(Number(amount) || 0));
  if (!value) return 0;
  state = { ...state, cp: state.cp + value, lifetimeEarned: state.lifetimeEarned + value };
  emit();
  return value;
}

export function spendContribution(amount) {
  const value = Math.max(0, Math.floor(Number(amount) || 0));
  if (!value) return { ok: true, spent: 0 };
  if (state.cp < value) return { ok: false, reason: 'Not enough Contribution Points' };
  state = { ...state, cp: state.cp - value, lifetimeSpent: state.lifetimeSpent + value };
  emit();
  return { ok: true, spent: value };
}

export function refundContribution(amount) {
  const value = Math.max(0, Math.floor(Number(amount) || 0));
  if (!value) return 0;
  state = { ...state, cp: state.cp + value, lifetimeSpent: Math.max(0, state.lifetimeSpent - value) };
  emit();
  return value;
}

export function setContribution(value) {
  state = { ...state, cp: Math.max(0, Math.floor(Number(value) || 0)) };
  emit();
}
