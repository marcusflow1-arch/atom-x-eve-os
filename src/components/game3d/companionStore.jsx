// Companion store — tracks the active companion, mount state, and equipped gear.
// Persists to localStorage so the player's companion choice survives reloads.

import { COMPANION_DEFINITIONS, COMPANION_GEAR, getCompanionById } from './companionData';

const STORAGE_KEY = 'wwm_companion_state_v1';

const buildDefault = () => ({
  activeCompanionId: COMPANION_DEFINITIONS[0]?.id || null,
  isMounted: false,
  // { companionId: { saddle: itemId|null, armor: itemId|null, charm: itemId|null } }
  gear: {},
});

let state = (() => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...buildDefault(), ...JSON.parse(saved), isMounted: false };
  } catch {}
  return buildDefault();
})();

const listeners = new Set();
const persist = () => {
  try {
    // Don't persist transient `isMounted` flag
    const { isMounted, ...toSave } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch {}
};
const emit = () => {
  persist();
  listeners.forEach((fn) => fn(state));
};

export const getCompanionState = () => state;
export const subscribeCompanion = (fn) => {
  listeners.add(fn);
  fn(state);
  return () => listeners.delete(fn);
};

export const setActiveCompanion = (companionId) => {
  state = { ...state, activeCompanionId: companionId };
  emit();
};

export const setMounted = (mounted) => {
  state = { ...state, isMounted: !!mounted };
  emit();
};

export const equipCompanionGear = (companionId, slotId, itemId) => {
  const next = { ...state, gear: { ...state.gear } };
  next.gear[companionId] = { ...(next.gear[companionId] || {}), [slotId]: itemId };
  state = next;
  emit();
};

export const unequipCompanionGear = (companionId, slotId) => {
  const next = { ...state, gear: { ...state.gear } };
  if (next.gear[companionId]) {
    next.gear[companionId] = { ...next.gear[companionId], [slotId]: null };
  }
  state = next;
  emit();
};

// Compute the final speed multiplier given equipped gear bonuses.
export const getEffectiveSpeedMultiplier = () => {
  const companion = getCompanionById(state.activeCompanionId);
  if (!companion) return 1.0;
  let mult = companion.speedMultiplier || 1.0;
  const equipped = state.gear[companion.id] || {};
  Object.entries(equipped).forEach(([slotId, itemId]) => {
    if (!itemId) return;
    const item = (COMPANION_GEAR[slotId] || []).find((g) => g.id === itemId);
    if (item?.speedBonus) mult += item.speedBonus;
  });
  return mult;
};