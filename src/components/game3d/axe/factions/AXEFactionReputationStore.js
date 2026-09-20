// AXE Prompt 036 — character-scoped faction reputation.
// Quest rewards and future faction activities feed this store. Rank thresholds
// are deliberately data-driven so Prompt 039 war rewards can reuse them.

import { characterScopedStorage, subscribeCharacterChange } from '../../characterStorage';
import { AXE_FACTIONS, getAXEFaction } from './AXEFactionWeaponConfig';

const storage = characterScopedStorage('axe_faction_reputation_v1');

export const AXE_REPUTATION_RANKS = Object.freeze([
  Object.freeze({ id: 'outsider', label: 'Outsider', min: 0 }),
  Object.freeze({ id: 'known', label: 'Known', min: 100 }),
  Object.freeze({ id: 'trusted', label: 'Trusted', min: 500 }),
  Object.freeze({ id: 'honored', label: 'Honored', min: 1500 }),
  Object.freeze({ id: 'exalted', label: 'Exalted', min: 4000 }),
]);

const initialMap = () => Object.fromEntries(
  AXE_FACTIONS.map((faction) => [faction.id, 0]),
);

const load = () => {
  try {
    const raw = storage.get();
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        reputation: { ...initialMap(), ...(parsed.reputation || {}) },
        lifetimeEarned: { ...initialMap(), ...(parsed.lifetimeEarned || {}) },
      };
    }
  } catch {}
  return { reputation: initialMap(), lifetimeEarned: initialMap() };
};

let state = load();
const listeners = new Set();

const emit = () => {
  storage.set(JSON.stringify(state));
  const snapshot = getAXEFactionReputationState();
  listeners.forEach((fn) => fn(snapshot));
};

subscribeCharacterChange(() => {
  state = load();
  listeners.forEach((fn) => fn(getAXEFactionReputationState()));
});

export function getAXEReputationRank(value = 0) {
  const points = Math.max(0, Number(value) || 0);
  let rank = AXE_REPUTATION_RANKS[0];
  for (const candidate of AXE_REPUTATION_RANKS) {
    if (points >= candidate.min) rank = candidate;
  }
  return rank;
}

export function getAXEFactionReputationState() {
  const entries = Object.fromEntries(
    Object.entries(state.reputation).map(([factionId, value]) => [
      factionId,
      {
        factionId,
        faction: getAXEFaction(factionId),
        value,
        lifetimeEarned: Number(state.lifetimeEarned[factionId] || 0),
        rank: getAXEReputationRank(value),
      },
    ]),
  );
  return {
    reputation: { ...state.reputation },
    lifetimeEarned: { ...state.lifetimeEarned },
    entries,
  };
}

export function subscribeAXEFactionReputation(fn) {
  listeners.add(fn);
  fn(getAXEFactionReputationState());
  return () => listeners.delete(fn);
}

export function addAXEFactionReputation(factionId, amount) {
  if (!getAXEFaction(factionId)) return { ok: false, reason: 'FACTION_MISSING' };
  const gain = Math.max(0, Math.floor(Number(amount) || 0));
  if (!gain) return { ok: true, gained: 0, value: Number(state.reputation[factionId] || 0) };

  const value = Number(state.reputation[factionId] || 0) + gain;
  state = {
    reputation: { ...state.reputation, [factionId]: value },
    lifetimeEarned: {
      ...state.lifetimeEarned,
      [factionId]: Number(state.lifetimeEarned[factionId] || 0) + gain,
    },
  };
  emit();
  return { ok: true, gained: gain, value, rank: getAXEReputationRank(value) };
}

export function setAXEFactionReputation(factionId, value) {
  if (!getAXEFaction(factionId)) return { ok: false, reason: 'FACTION_MISSING' };
  const next = Math.max(0, Math.floor(Number(value) || 0));
  state = {
    ...state,
    reputation: { ...state.reputation, [factionId]: next },
  };
  emit();
  return { ok: true, value: next, rank: getAXEReputationRank(next) };
}
