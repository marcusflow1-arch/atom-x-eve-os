// AXE Prompt 023 — Equipment Aura persistence adapter.
// Aura is character-scoped and reactive so changing an equipped item's aura
// immediately updates the character's real combat stats.

import { characterScopedStorage, subscribeCharacterChange } from '../../characterStorage';
import {
  canApplyAXEAura,
  collectAXEAuraStats,
  rollAXEAura,
  upgradeAXEAura,
} from './AXEEquipmentAuraSystem';

const storage = characterScopedStorage('axe_equipment_aura_v2');

const load = () => {
  try {
    const raw = storage.get();
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
};

let state = load();
const listeners = new Set();

const snapshot = () => ({ ...state });

const emit = () => {
  storage.set(JSON.stringify(state));
  const snap = snapshot();
  listeners.forEach((fn) => fn(snap));
};

subscribeCharacterChange(() => {
  state = load();
  const snap = snapshot();
  listeners.forEach((fn) => fn(snap));
});

export function subscribeAXEAura(fn) {
  listeners.add(fn);
  fn(snapshot());
  return () => listeners.delete(fn);
}

export function getAXEItemAura(itemId) {
  return state[itemId] || null;
}

export function applyAXEItemAura(item, { tierRank = 1, rng = Math.random } = {}) {
  const itemId = item?.instanceId || item?.id;
  if (!itemId) return { ok: false, reason: 'ITEM_MISSING' };
  if (!canApplyAXEAura(item)) return { ok: false, reason: 'ITEM_NOT_ELIGIBLE' };

  const aura = rollAXEAura({ tierRank, rng });
  state = { ...state, [itemId]: aura };
  emit();
  return { ok: true, aura };
}

export function rerollAXEItemAura(item, {
  lockedEffectIds = [],
  rng = Math.random,
} = {}) {
  const itemId = item?.instanceId || item?.id;
  const current = getAXEItemAura(itemId);
  if (!current) return { ok: false, reason: 'AURA_MISSING' };

  const aura = rollAXEAura({
    tierRank: current.tierRank,
    existingEffects: current.effects,
    lockedEffects: lockedEffectIds,
    rng,
  });

  state = { ...state, [itemId]: aura };
  emit();
  return { ok: true, aura };
}

export function upgradeAXEItemAura(itemId) {
  const current = getAXEItemAura(itemId);
  if (!current) return { ok: false, reason: 'AURA_MISSING' };
  const result = upgradeAXEAura(current);
  if (!result.ok) return result;

  state = { ...state, [itemId]: result.aura };
  emit();
  return result;
}

export function getAXEItemAuraStats(itemId) {
  return collectAXEAuraStats(getAXEItemAura(itemId));
}


export function purgeAXEItemAura(itemId) {
  if (!itemId || !state[itemId]) return false;
  const next = { ...state };
  delete next[itemId];
  state = next;
  emit();
  return true;
}

if (typeof window !== 'undefined' && !window.__axeAuraLifecycleHook) {
  window.__axeAuraLifecycleHook = true;
  window.addEventListener('axeEquipmentItemRemoved', (event) => {
    purgeAXEItemAura(event?.detail?.instanceId);
  });
}
