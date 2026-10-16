// UI selection is transient; equipment lives in the canonical character store.
import { COMPANION_GEAR, getCompanionById } from '../companionData';
import { getCompanionState, subscribeCompanion, equipCompanionGear as equip, unequipCompanionGear as unequip } from '../companionStore';
import { subscribeCharacterChange } from '../characterStorage';
let mode = 'player', selectedSlot = 'saddle';
const listeners = new Set();
export function getFusionState() {
  const state = getCompanionState();
  return { mode, selectedSlot, activeCompanionId: state.activeCompanionId,
    equippedGear: { ...state.gear[state.activeCompanionId] }, sync: state.sync };
}
const emit = () => listeners.forEach(fn => fn(getFusionState()));
subscribeCompanion(emit);
subscribeCharacterChange(() => { mode = 'player'; selectedSlot = 'saddle'; emit(); });
export const subscribeFusion = fn => { listeners.add(fn); fn(getFusionState()); return () => listeners.delete(fn); };
export const setFusionMode = next => { if (['player', 'companion'].includes(next)) { mode = next; emit(); } };
export const toggleFusionMode = () => setFusionMode(mode === 'player' ? 'companion' : 'player');
export const setSelectedCompanionSlot = slot => { if (getActiveCompanion()?.gearSlots.includes(slot)) { selectedSlot = slot; emit(); } };
export function equipCompanionGear(slot, item) {
  const state = getFusionState();
  return state.equippedGear[slot] === item ? unequip(state.activeCompanionId, slot) : equip(state.activeCompanionId, slot, item);
}
export const getActiveCompanion = () => getCompanionById(getCompanionState().activeCompanionId);
export const getCompanionItem = (slot, item) => COMPANION_GEAR[slot]?.find(it => it.id === item) || null;
