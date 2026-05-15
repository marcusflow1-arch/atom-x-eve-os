// Tiny store for the equipment menu's "fusion mode" toggle.
// Decides whether the gear tab shows the PLAYER's gear or the COMPANION's gear.
// Also tracks which companion gear slot is currently selected when in companion mode.

import { COMPANION_DEFINITIONS, COMPANION_GEAR } from '../companionData';

const STORAGE_KEY = 'wwm_companion_fusion_v1';

const buildDefault = () => ({
  // 'player' = normal equipment view, 'companion' = companion view
  mode: 'player',
  // Currently selected companion (we only have one for now)
  activeCompanionId: COMPANION_DEFINITIONS[0]?.id || null,
  // Equipped companion gear, keyed by slot id (saddle/armor/charm)
  equippedGear: {},
  // Currently selected companion gear slot (for the inspector panel)
  selectedSlot: 'saddle',
});

let state = (() => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...buildDefault(), ...JSON.parse(saved) };
  } catch {}
  return buildDefault();
})();

const listeners = new Set();
const persist = () => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
};
const emit = () => {
  persist();
  listeners.forEach((fn) => fn(state));
};

export const getFusionState = () => state;
export const subscribeFusion = (fn) => {
  listeners.add(fn);
  fn(state);
  return () => listeners.delete(fn);
};

export const setFusionMode = (mode) => {
  if (mode !== 'player' && mode !== 'companion') return;
  state = { ...state, mode };
  emit();
};

export const toggleFusionMode = () => {
  setFusionMode(state.mode === 'player' ? 'companion' : 'player');
};

export const setSelectedCompanionSlot = (slotId) => {
  state = { ...state, selectedSlot: slotId };
  emit();
};

export const equipCompanionGear = (slotId, itemId) => {
  const next = { ...state, equippedGear: { ...state.equippedGear } };
  // Toggle: clicking the same equipped item unequips it
  if (next.equippedGear[slotId] === itemId) {
    delete next.equippedGear[slotId];
  } else {
    next.equippedGear[slotId] = itemId;
  }
  state = next;
  emit();
};

export const getActiveCompanion = () =>
  COMPANION_DEFINITIONS.find((c) => c.id === state.activeCompanionId) || COMPANION_DEFINITIONS[0] || null;

export const getCompanionItem = (slotId, itemId) =>
  (COMPANION_GEAR[slotId] || []).find((it) => it.id === itemId) || null;