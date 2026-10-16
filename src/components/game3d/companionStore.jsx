// One companion loadout shared by the world, Gear menu, and Companion menu.
import { COMPANION_GEAR, getCompanionById } from './companionData';
import { base44 } from '@/api/base44Client';
import { characterScopedStorage, getStorageUser, getActiveId, subscribeCharacterChange } from './characterStorage';
import { createCompanionCloud } from './companion/cloud';
import { createCompanionStore } from './companion/store';
const store = createCompanionStore({
  storage: characterScopedStorage('wwm_companion_state_v1'),
  legacyFusion: characterScopedStorage('wwm_companion_fusion_v1'),
  scope: () => ({ userId: getStorageUser(), characterId: getActiveId() }),
  onScopeChange: subscribeCharacterChange,
  cloud: createCompanionCloud(base44),
});
export const getCompanionState = store.getState;
export const subscribeCompanion = store.subscribe;
export const setActiveCompanion = store.setActive;
export const setMounted = store.setMounted;
export const equipCompanionGear = store.equip;
export const unequipCompanionGear = (companionId, slotId) => store.equip(companionId, slotId, null);
export const syncCompanion = store.sync;
// Avoid allocations in the world's per-frame speed getter.
let speedMultiplier = 1;
store.subscribe(state => {
  const companion = getCompanionById(state.activeCompanionId);
  speedMultiplier = companion?.speedMultiplier || 1;
  for (const [slot, itemId] of Object.entries(state.gear[companion?.id] || {})) {
    speedMultiplier += COMPANION_GEAR[slot]?.find(item => item.id === itemId)?.speedBonus || 0;
  }
});
export const getEffectiveSpeedMultiplier = () => speedMultiplier;
