// AXE Prompt 026 — character-scoped wardrobe ownership/equip state.

import { characterScopedStorage, subscribeCharacterChange } from '../../characterStorage';
import {
  AXE_COSTUME_DEFINITIONS,
  getAXECostumeBonuses,
  getAXECostumeDefinition,
  normalizeAXECostumeAppearance,
} from './AXECostumeSystem';

const storage = characterScopedStorage('axe_costume_wardrobe_v1');

const starter = () => ({
  owned: ['axe_costume_wanderer'],
  equippedCostumeId: 'axe_costume_wanderer',
  hidden: false,
  favorites: [],
  dyes: {},
  loadouts: {},
});

const load = () => {
  try {
    const raw = storage.get();
    if (!raw) return starter();
    const parsed = JSON.parse(raw);
    return {
      ...starter(),
      ...parsed,
      owned: Array.isArray(parsed.owned) ? parsed.owned.filter((id) => AXE_COSTUME_DEFINITIONS[id]) : starter().owned,
      favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
      dyes: parsed.dyes || {},
      loadouts: parsed.loadouts || {},
    };
  } catch {
    return starter();
  }
};

let state = load();
const listeners = new Set();

const emit = () => {
  storage.set(JSON.stringify(state));
  const snapshot = getAXECostumeState();
  listeners.forEach((fn) => fn(snapshot));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('axeCostumeChanged', {
      detail: getAXECostumeAppearanceState(),
    }));
  }
};

subscribeCharacterChange(() => {
  state = load();
  const snapshot = getAXECostumeState();
  listeners.forEach((fn) => fn(snapshot));
});

export function getAXECostumeState() {
  return {
    ...state,
    owned: [...state.owned],
    favorites: [...state.favorites],
    dyes: { ...state.dyes },
    loadouts: { ...state.loadouts },
  };
}

export function subscribeAXECostumes(fn) {
  listeners.add(fn);
  fn(getAXECostumeState());
  return () => listeners.delete(fn);
}

export function getEquippedAXECostumeBonuses() {
  if (!state.equippedCostumeId) return {};
  return getAXECostumeBonuses(state.equippedCostumeId);
}

export function getAXECostumeAppearanceState() {
  return normalizeAXECostumeAppearance(state);
}

export function grantAXECostume(costumeId) {
  if (!getAXECostumeDefinition(costumeId)) return { ok: false, reason: 'COSTUME_MISSING' };
  if (!state.owned.includes(costumeId)) state = { ...state, owned: [...state.owned, costumeId] };
  emit();
  return { ok: true };
}

export function equipAXECostume(costumeId) {
  if (!state.owned.includes(costumeId)) return { ok: false, reason: 'NOT_OWNED' };
  if (!getAXECostumeDefinition(costumeId)) return { ok: false, reason: 'COSTUME_MISSING' };
  state = { ...state, equippedCostumeId: costumeId };
  emit();
  return { ok: true };
}

export function unequipAXECostume() {
  state = { ...state, equippedCostumeId: null };
  emit();
  return { ok: true };
}

export function setAXECostumeHidden(hidden) {
  state = { ...state, hidden: !!hidden };
  emit();
}

export function setAXECostumeDye(costumeId, channel, value) {
  const def = getAXECostumeDefinition(costumeId);
  if (!def || !def.dyeChannels.includes(channel)) return { ok: false, reason: 'INVALID_DYE_CHANNEL' };
  state = {
    ...state,
    dyes: {
      ...state.dyes,
      [costumeId]: {
        ...(state.dyes[costumeId] || {}),
        [channel]: value,
      },
    },
  };
  emit();
  return { ok: true };
}

export function toggleAXECostumeFavorite(costumeId) {
  if (!state.owned.includes(costumeId)) return { ok: false, reason: 'NOT_OWNED' };
  const favorites = state.favorites.includes(costumeId)
    ? state.favorites.filter((id) => id !== costumeId)
    : [...state.favorites, costumeId];
  state = { ...state, favorites };
  emit();
  return { ok: true };
}

export function saveAXECostumeLoadout(name) {
  if (!name) return { ok: false, reason: 'NAME_REQUIRED' };
  state = {
    ...state,
    loadouts: {
      ...state.loadouts,
      [name]: {
        equippedCostumeId: state.equippedCostumeId,
        hidden: state.hidden,
        dyes: { ...state.dyes },
      },
    },
  };
  emit();
  return { ok: true };
}
