// AXE Prompt 038 — authoritative service transaction gateway.
// If a server/host transaction bridge is mounted, it owns the operation.
// Otherwise the current browser prototype falls back to the already-existing
// local stores. Keeping one gateway prevents the global menu from inventing a
// second upgrade rule set.

import {
  enchantSlot,
  overEnchantItem,
  reinforceItem,
} from '../../equipment/enchantmentStore';
import {
  applyAXECombine,
  applyAXERefine,
  applyAXEStage,
  applyAXEUltimate,
} from '../equipment/AXEItemAdvancementStore';
import {
  drillAXESocket,
  insertGemIntoAXEItem,
} from '../equipment/AXESocketGemStore';
import { applyAXEItemAura } from '../equipment/AXEEquipmentAuraStore';

const localHandlers = {
  reinforcement: ({ itemId, options = {} }) => reinforceItem(itemId, options),
  enchant: ({ itemId, slotIndex = 0 }) => enchantSlot(itemId, slotIndex),
  over_enchant: ({ itemId, options = {} }) => overEnchantItem(itemId, options),
  combine: ({ item, donor, options = {} }) => applyAXECombine(item, donor, options),
  stage: ({ itemId, options = {} }) => applyAXEStage(itemId, options),
  refine: ({ itemId, options = {} }) => applyAXERefine(itemId, options),
  ultimate: ({ item, options = {} }) => applyAXEUltimate(item, options),
  sockets: ({ itemId, item, options = {} }) => drillAXESocket(itemId, item, options),
  insert_gem: ({ itemId, item, socketIndex, gemId }) =>
    insertGemIntoAXEItem(itemId, item, socketIndex, gemId),
  equipment_aura: ({ item, options = {} }) => applyAXEItemAura(item, options),
};

export async function executeAXEServiceTransaction(serviceId, payload = {}) {
  if (typeof window !== 'undefined' && typeof window.__axeAuthoritativeServiceRequest === 'function') {
    return window.__axeAuthoritativeServiceRequest({
      serviceId,
      payload,
      requestedAt: Date.now(),
    });
  }

  const handler = localHandlers[serviceId];
  if (!handler) return { ok: false, reason: 'SERVICE_TRANSACTION_NOT_AVAILABLE' };
  return handler(payload);
}
