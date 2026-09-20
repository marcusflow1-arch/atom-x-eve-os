// AXE Prompt 028 — character-scoped Cape ownership/progression.

import { characterScopedStorage, subscribeCharacterChange } from '../../characterStorage';
import {
  AXE_CAPE_DEFINITIONS,
  getAXECapeBonuses,
  getAXECapeDefinition,
  getAXECapeModifiers,
  getAXECapeUpgradeRecipe,
  previewAXECapeUpgrade,
} from './AXECapeSystem';

const storage = characterScopedStorage('axe_cape_progression_v1');

const starter = () => ({
  owned: ['axe_cape_trainee'],
  equippedCapeId: 'axe_cape_trainee',
  hidden: false,
  materials: {
    cape_thread: 20,
    war_crest: 8,
    divine_fragment: 2,
    seasonal_token: 0,
    gold: 15000,
  },
  itemState: {
    axe_cape_trainee: {
      reinforcement: 0,
      sockets: [],
      gems: [],
      refine: 0,
    },
  },
});

const load = () => {
  try {
    const raw = storage.get();
    if (!raw) return starter();
    const parsed = JSON.parse(raw);
    return {
      ...starter(),
      ...parsed,
      owned: Array.isArray(parsed.owned)
        ? parsed.owned.filter((id) => AXE_CAPE_DEFINITIONS[id])
        : starter().owned,
      materials: { ...starter().materials, ...(parsed.materials || {}) },
      itemState: { ...starter().itemState, ...(parsed.itemState || {}) },
    };
  } catch {
    return starter();
  }
};

let state = load();
const listeners = new Set();

const emit = () => {
  storage.set(JSON.stringify(state));
  const snapshot = getAXECapeState();
  listeners.forEach((fn) => fn(snapshot));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('axeCapeChanged', {
      detail: getAXECapeAppearanceState(),
    }));
  }
};

subscribeCharacterChange(() => {
  state = load();
  listeners.forEach((fn) => fn(getAXECapeState()));
});

export function getAXECapeState() {
  return {
    ...state,
    owned: [...state.owned],
    materials: { ...state.materials },
    itemState: { ...state.itemState },
  };
}

export function subscribeAXECapes(fn) {
  listeners.add(fn);
  fn(getAXECapeState());
  return () => listeners.delete(fn);
}

export function getEquippedAXECapeBonuses() {
  return state.equippedCapeId ? getAXECapeBonuses(state.equippedCapeId) : {};
}

export function getEquippedAXECapeModifiers() {
  return state.equippedCapeId ? getAXECapeModifiers(state.equippedCapeId) : {};
}

export function getAXECapeAppearanceState() {
  const def = getAXECapeDefinition(state.equippedCapeId);
  return {
    capeId: def?.id || null,
    hidden: !!state.hidden,
    appearanceAssetId: state.hidden ? null : def?.appearanceAssetId || null,
  };
}

export function equipAXECape(capeId) {
  if (!state.owned.includes(capeId)) return { ok: false, reason: 'NOT_OWNED' };
  if (!getAXECapeDefinition(capeId)) return { ok: false, reason: 'CAPE_MISSING' };
  state = { ...state, equippedCapeId: capeId };
  emit();
  return { ok: true };
}

export function unequipAXECape() {
  state = { ...state, equippedCapeId: null };
  emit();
  return { ok: true };
}

export function setAXECapeHidden(hidden) {
  state = { ...state, hidden: !!hidden };
  emit();
}

export function grantAXECape(capeId) {
  if (!getAXECapeDefinition(capeId)) return { ok: false, reason: 'CAPE_MISSING' };
  if (!state.owned.includes(capeId)) state = { ...state, owned: [...state.owned, capeId] };
  state = {
    ...state,
    itemState: {
      ...state.itemState,
      [capeId]: state.itemState[capeId] || { reinforcement: 0, sockets: [], gems: [], refine: 0 },
    },
  };
  emit();
  return { ok: true };
}

const canAfford = (cost = {}) =>
  Object.entries(cost).every(([id, amount]) => Number(state.materials[id] || 0) >= Number(amount || 0));

const consume = (cost = {}) => {
  const next = { ...state.materials };
  for (const [id, amount] of Object.entries(cost)) next[id] = Math.max(0, Number(next[id] || 0) - Number(amount || 0));
  state = { ...state, materials: next };
};

export function upgradeAXECape(capeId, { roll = Math.random() } = {}) {
  const preview = previewAXECapeUpgrade(capeId);
  if (!preview.ok) return preview;
  if (!state.owned.includes(capeId)) return { ok: false, reason: 'NOT_OWNED' };
  if (!canAfford(preview.cost)) return { ok: false, reason: 'INSUFFICIENT_MATERIALS', cost: preview.cost };

  consume(preview.cost);
  const success = roll <= preview.successChance;
  if (!success) {
    emit();
    return { ok: false, outcome: 'failure', chance: preview.successChance, cost: preview.cost };
  }

  const sourceState = state.itemState[capeId] || {};
  const targetState = {};
  for (const key of preview.preserve) targetState[key] = sourceState[key];

  state = {
    ...state,
    owned: [...new Set([...state.owned, preview.target.id])],
    equippedCapeId: state.equippedCapeId === capeId ? preview.target.id : state.equippedCapeId,
    itemState: {
      ...state.itemState,
      [preview.target.id]: {
        reinforcement: 0,
        sockets: [],
        gems: [],
        refine: 0,
        ...targetState,
      },
    },
  };
  emit();
  return {
    ok: true,
    outcome: 'success',
    targetId: preview.target.id,
    preserved: preview.preserve,
    cost: preview.cost,
  };
}

export function grantAXECapeMaterials(delta = {}) {
  state = {
    ...state,
    materials: {
      ...state.materials,
      ...Object.fromEntries(
        Object.keys(state.materials).map((key) => [
          key,
          Number(state.materials[key] || 0) + Math.max(0, Number(delta[key] || 0)),
        ]),
      ),
    },
  };
  emit();
  return { ...state.materials };
}
