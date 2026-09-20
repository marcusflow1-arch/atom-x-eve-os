// AXE Prompt 023 — Aura persistence adapter.

import {
  canApplyAXEAura,
  collectAXEAuraStats,
  rollAXEAura,
  upgradeAXEAura,
} from './AXEEquipmentAuraSystem';

const STORAGE_KEY = 'axe_equipment_aura_v1';

const load = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
};

let state = load();
const listeners = new Set();

const emit = () => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  listeners.forEach((fn) => fn({ ...state }));
};

export function subscribeAXEAura(fn) {
  listeners.add(fn);
  fn({ ...state });
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
