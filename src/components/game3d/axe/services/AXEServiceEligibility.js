// Central eligibility contract for the unified Services UI and transaction gateway.
// A service can only mutate a REAL owned equipment instance that it is allowed to
// operate on. The UI reads this same contract so disabled/hidden states cannot
// disagree with backend validation.

import { AXE_ULTIMATE_CONFIG } from '../equipment/AXEItemAdvancementSystem';
import { canApplyAXEAura } from '../equipment/AXEEquipmentAuraSystem';

const SLOT_GROUPS = Object.freeze({
  combat: new Set(['weapon', 'helm', 'chest', 'gloves', 'legs', 'boots']),
  jewelry: new Set(['ring', 'necklace', 'accessory', 'trinket']),
  prestige: new Set(['cape', 'wings']),
  auxiliary: new Set(['auxiliary']),
});

const ENHANCEABLE = new Set([
  ...SLOT_GROUPS.combat,
  ...SLOT_GROUPS.jewelry,
  ...SLOT_GROUPS.prestige,
  ...SLOT_GROUPS.auxiliary,
]);

const SOCKETABLE = new Set([
  'weapon', 'helm', 'chest', 'gloves', 'legs', 'boots',
  'ring', 'necklace', 'cape', 'wings',
]);

const slotOf = (item) => item?.slot || item?.category || null;

export function getAXEServiceEligibility(serviceId, item) {
  if (!item) return { eligible: false, reason: 'ITEM_MISSING' };

  const slot = slotOf(item);
  if (!slot) return { eligible: false, reason: 'INVALID_SLOT' };

  if ([
    'reinforcement',
    'enchant',
    'over_enchant',
    'combine',
    'stage',
    'refine',
  ].includes(serviceId)) {
    return ENHANCEABLE.has(slot)
      ? { eligible: true }
      : { eligible: false, reason: 'SERVICE_SLOT_NOT_ELIGIBLE' };
  }

  if (serviceId === 'ultimate') {
    if (!ENHANCEABLE.has(slot)) return { eligible: false, reason: 'SERVICE_SLOT_NOT_ELIGIBLE' };
    const rarity = String(item.rarity || '').toLowerCase();
    return AXE_ULTIMATE_CONFIG.eligibleRarities.includes(rarity)
      ? { eligible: true }
      : { eligible: false, reason: 'RARITY_NOT_ELIGIBLE' };
  }

  if (serviceId === 'sockets' || serviceId === 'insert_gem') {
    return SOCKETABLE.has(slot)
      ? { eligible: true }
      : { eligible: false, reason: 'ITEM_NOT_SOCKETABLE' };
  }

  if (serviceId === 'equipment_aura') {
    return canApplyAXEAura(item)
      ? { eligible: true }
      : { eligible: false, reason: 'ITEM_NOT_AURA_ELIGIBLE' };
  }

  // Non-equipment progression panels do not operate on an equipment target.
  return { eligible: true };
}

export function filterAXEItemsForService(serviceId, items = []) {
  return items.filter((item) => getAXEServiceEligibility(serviceId, item).eligible);
}

export function describeAXEServiceEligibility(result) {
  if (!result || result.eligible) return null;
  switch (result.reason) {
    case 'RARITY_NOT_ELIGIBLE':
      return 'Ultimate reinforcement requires Legendary or Heroic equipment.';
    case 'ITEM_NOT_SOCKETABLE':
      return 'This equipment type cannot be socketed.';
    case 'ITEM_NOT_AURA_ELIGIBLE':
      return 'This item cannot receive Equipment Aura.';
    case 'SERVICE_SLOT_NOT_ELIGIBLE':
      return 'This item type is not eligible for this service.';
    case 'ITEM_MISSING':
      return 'Choose an owned equipment item first.';
    default:
      return String(result.reason || 'Item is not eligible.').replaceAll('_', ' ');
  }
}
