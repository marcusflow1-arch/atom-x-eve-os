import { COMPANION_DEFINITIONS, COMPANION_GEAR, getCompanionById } from '../companionData';
export function validItem(companionId, slot, item) {
  return !!getCompanionById(companionId)?.gearSlots?.includes(slot) &&
    (item === null || !!COMPANION_GEAR[slot]?.some(g => g.id === item));
}
export function normalizeLoadout(input) {
  const activeCompanionId = getCompanionById(input?.activeCompanionId)?.id || COMPANION_DEFINITIONS[0]?.id || null;
  const gear = {};
  for (const companion of COMPANION_DEFINITIONS) {
    const slots = input?.gear?.[companion.id];
    for (const slot of companion.gearSlots || []) {
      if (Object.hasOwn(slots || {}, slot) && validItem(companion.id, slot, slots[slot])) {
        (gear[companion.id] ||= {})[slot] = slots[slot];
      }
    }
  }
  return { activeCompanionId, gear };
}
export const sameLoadout = (a, b) => JSON.stringify(normalizeLoadout(a)) === JSON.stringify(normalizeLoadout(b));
