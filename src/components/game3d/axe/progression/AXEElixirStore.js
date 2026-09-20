// AXE Prompt 031 — character-scoped permanent Elixir progression.

import { characterScopedStorage, subscribeCharacterChange } from '../../characterStorage';
import { getHaloElixirCapacityBonus, subscribeHalo } from '../../progression/haloStore';
import {
  AXE_ELIXIR_CONFIG,
  AXE_ELIXIR_TYPES,
  getAXEElixirAttributeBonusesFromAllocations,
  getAXEElixirCapacityBreakdown,
} from './AXEElixirSystem';

const storage = characterScopedStorage('axe_elixir_progression_v1');

const starter = () => ({
  allocations: { strength: 0, dexterity: 0, vitality: 0, spirit: 0 },
  inventory: { strength: 5, dexterity: 5, vitality: 5, spirit: 5 },
  bonusCapacity: { title: 0, event: 0 },
  resetTokens: 1,
});

const load = () => {
  try {
    const raw = storage.get();
    if (!raw) return starter();
    const parsed = JSON.parse(raw);
    return {
      ...starter(),
      ...parsed,
      allocations: { ...starter().allocations, ...(parsed.allocations || {}) },
      inventory: { ...starter().inventory, ...(parsed.inventory || {}) },
      bonusCapacity: { ...starter().bonusCapacity, ...(parsed.bonusCapacity || {}) },
      resetTokens: Math.max(0, Number(parsed.resetTokens ?? 1)),
    };
  } catch {
    return starter();
  }
};

let state = load();
const listeners = new Set();

const persist = () => storage.set(JSON.stringify(state));
const snapshot = () => getAXEElixirState();
const emit = () => {
  persist();
  const s = snapshot();
  listeners.forEach((fn) => fn(s));
};

subscribeCharacterChange(() => {
  state = load();
  listeners.forEach((fn) => fn(snapshot()));
});

subscribeHalo(() => {
  listeners.forEach((fn) => fn(snapshot()));
});

export function getAXEElixirState() {
  const used = Object.values(state.allocations).reduce((sum, value) => sum + Math.max(0, Number(value) || 0), 0);
  const capacity = getAXEElixirCapacityBreakdown({
    haloBonus: getHaloElixirCapacityBonus(),
    titleBonus: state.bonusCapacity.title,
    eventBonus: state.bonusCapacity.event,
  });

  return {
    allocations: { ...state.allocations },
    inventory: { ...state.inventory },
    bonusCapacity: { ...state.bonusCapacity },
    resetTokens: state.resetTokens,
    usedCapacity: used,
    remainingCapacity: Math.max(0, capacity.total - used),
    capacity,
    attributeBonuses: getAXEElixirAttributeBonusesFromAllocations(state.allocations),
  };
}

export function subscribeAXEElixirs(fn) {
  listeners.add(fn);
  fn(snapshot());
  return () => listeners.delete(fn);
}

export function getAXEElixirAttributeBonuses() {
  return getAXEElixirAttributeBonusesFromAllocations(state.allocations);
}

export function useAXEElixir(typeId, count = 1) {
  const type = AXE_ELIXIR_TYPES[typeId];
  if (!type) return { ok: false, reason: 'ELIXIR_TYPE_MISSING' };

  const n = Math.max(1, Math.floor(Number(count) || 1));
  const current = getAXEElixirState();
  if ((state.inventory[typeId] || 0) < n) {
    return { ok: false, reason: 'INSUFFICIENT_ELIXIRS', have: state.inventory[typeId] || 0, need: n };
  }
  if (current.remainingCapacity < n * AXE_ELIXIR_CONFIG.perUseCost) {
    return { ok: false, reason: 'CAPACITY_REACHED', remaining: current.remainingCapacity };
  }

  state = {
    ...state,
    allocations: { ...state.allocations, [typeId]: (state.allocations[typeId] || 0) + n },
    inventory: { ...state.inventory, [typeId]: (state.inventory[typeId] || 0) - n },
  };
  emit();
  return { ok: true, typeId, count: n };
}

export function grantAXEElixirs(typeId, count = 1) {
  if (!AXE_ELIXIR_TYPES[typeId]) return { ok: false, reason: 'ELIXIR_TYPE_MISSING' };
  const n = Math.max(0, Math.floor(Number(count) || 0));
  state = { ...state, inventory: { ...state.inventory, [typeId]: (state.inventory[typeId] || 0) + n } };
  emit();
  return { ok: true };
}

export function setAXEElixirBonusCapacity(source, amount) {
  if (!['title', 'event'].includes(source)) return { ok: false, reason: 'INVALID_SOURCE' };
  state = {
    ...state,
    bonusCapacity: { ...state.bonusCapacity, [source]: Math.max(0, Number(amount) || 0) },
  };
  emit();
  return { ok: true };
}

export function resetAXEElixirs({ refundInventory = AXE_ELIXIR_CONFIG.resetRefundsItems } = {}) {
  if (state.resetTokens <= 0) return { ok: false, reason: 'RESET_TOKEN_REQUIRED' };
  const allocations = { ...state.allocations };
  const inventory = { ...state.inventory };
  if (refundInventory) {
    for (const [typeId, count] of Object.entries(allocations)) {
      inventory[typeId] = (inventory[typeId] || 0) + Number(count || 0);
    }
  }
  state = {
    ...state,
    allocations: { strength: 0, dexterity: 0, vitality: 0, spirit: 0 },
    inventory,
    resetTokens: state.resetTokens - 1,
  };
  emit();
  return { ok: true, refunded: !!refundInventory };
}

export function grantAXEElixirResetToken(count = 1) {
  state = { ...state, resetTokens: state.resetTokens + Math.max(0, Math.floor(Number(count) || 0)) };
  emit();
}
