// Companion store — tracks the active companion, mount state, and equipped gear.
// Persists to BOTH localStorage (fast) and the server (User entity) so the
// player's companion + gear survives logout across devices.

import { COMPANION_DEFINITIONS, COMPANION_GEAR, getCompanionById } from './companionData';
import { base44 } from '@/api/base44Client';

const STORAGE_KEY = 'wwm_companion_state_v1';
const SERVER_FIELD = 'companion_state'; // stored under user.data.companion_state

const buildDefault = () => ({
  activeCompanionId: COMPANION_DEFINITIONS[0]?.id || null,
  isMounted: false,
  // { companionId: { saddle: itemId|null, armor: itemId|null, charm: itemId|null } }
  gear: {},
});

let state = (() => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const merged = { ...buildDefault(), ...JSON.parse(saved), isMounted: false };
      // If the saved active companion ID no longer exists (e.g. after a model
      // swap), fall back to the first defined companion.
      if (!getCompanionById(merged.activeCompanionId)) {
        merged.activeCompanionId = COMPANION_DEFINITIONS[0]?.id || null;
      }
      return merged;
    }
  } catch {}
  return buildDefault();
})();

const listeners = new Set();

// Debounced server save — coalesces rapid equip/unequip clicks into a single PATCH.
let saveTimer = null;
const persistToServer = () => {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    try {
      const { isMounted, ...toSave } = state;
      await base44.auth.updateMe({ [SERVER_FIELD]: toSave });
    } catch (err) {
      // Offline / not logged in → localStorage still has it; nothing to do.
    }
  }, 600);
};

const persist = () => {
  try {
    // Don't persist transient `isMounted` flag
    const { isMounted, ...toSave } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch {}
  persistToServer();
};
const emit = () => {
  persist();
  listeners.forEach((fn) => fn(state));
};

// Hydrate from server on first load — server is the source of truth across devices.
// If the server has a saved state, merge it in and notify subscribers.
(async () => {
  try {
    const me = await base44.auth.me();
    const serverState = me?.[SERVER_FIELD];
    if (serverState && typeof serverState === 'object') {
      state = { ...state, ...serverState, isMounted: false };
      if (!getCompanionById(state.activeCompanionId)) {
        state.activeCompanionId = COMPANION_DEFINITIONS[0]?.id || null;
      }
      try {
        const { isMounted, ...toSave } = state;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
      } catch {}
      listeners.forEach((fn) => fn(state));
    }
  } catch {
    // Not logged in or offline — localStorage state stands.
  }
})();

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