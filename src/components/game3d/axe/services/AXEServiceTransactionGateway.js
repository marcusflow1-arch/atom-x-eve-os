// AXE Prompt 038 — service transaction gateway.
// All equipment services validate REAL owned item instances before mutating.
// The authoritative bridge still wins when mounted; this browser fallback now
// preserves the same inventory/resource semantics for local development.

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
  getAXEAdvancementState,
} from '../equipment/AXEItemAdvancementStore';
import {
  drillAXESocket,
  getAXESocketState,
  insertGemIntoAXEItem,
} from '../equipment/AXESocketGemStore';
import { applyAXEItemAura } from '../equipment/AXEEquipmentAuraStore';
import {
  canConsumeAXEEquipmentItem,
  consumeAXEEquipmentItem,
  destroyAXEEquipmentItem,
  getAXEEquipmentItem,
} from '../equipment/AXEEquipmentInventoryStore';
import {
  consumeLootItemById,
  getLootItemCount,
} from '../../lootStore';
import { getAXEServiceInventoryCost } from './AXEServiceEconomy';

const getOwned = (itemId) => getAXEEquipmentItem(itemId);

const requireOwned = (itemId) => {
  const item = getOwned(itemId);
  return item
    ? { ok: true, item }
    : { ok: false, reason: 'ITEM_NOT_OWNED', itemId };
};

const canAfford = (cost = {}) =>
  Object.entries(cost).every(([id, count]) =>
    getLootItemCount(id) >= Math.max(0, Number(count || 0))
  );

const consumeCost = (cost = {}) => {
  if (!canAfford(cost)) return { ok: false, reason: 'INSUFFICIENT_MATERIALS', cost };
  for (const [id, count] of Object.entries(cost)) {
    const result = consumeLootItemById(id, count);
    if (!result.ok) return result;
  }
  return { ok: true };
};

const withOwnedItem = (payload, fn) => {
  const check = requireOwned(payload.itemId || payload.item?.instanceId || payload.item?.id);
  if (!check.ok) return check;
  return fn(check.item);
};

const localHandlers = {
  reinforcement: (payload) => withOwnedItem(payload, (item) =>
    reinforceItem(item.instanceId, payload.options || {})
  ),

  enchant: (payload) => withOwnedItem(payload, (item) =>
    enchantSlot(item.instanceId, payload.slotIndex ?? 0)
  ),

  over_enchant: (payload) => withOwnedItem(payload, (item) =>
    overEnchantItem(item.instanceId, payload.options || {})
  ),

  combine: (payload) => {
    const targetId = payload.itemId || payload.item?.instanceId || payload.item?.id;
    const donorId = payload.donorId || payload.donor?.instanceId || payload.donor?.id;
    const targetCheck = requireOwned(targetId);
    if (!targetCheck.ok) return targetCheck;
    const donorCheck = canConsumeAXEEquipmentItem(donorId);
    if (!donorCheck.ok) return donorCheck;

    const result = applyAXECombine(targetCheck.item, donorCheck.item, payload.options || {});
    if (result.ok && result.donorConsumed) {
      const consumed = consumeAXEEquipmentItem(donorCheck.item.instanceId);
      if (!consumed.ok) {
        return { ok: false, reason: 'DONOR_CONSUME_FAILED', transactionResult: result };
      }
    }
    return result;
  },

  stage: (payload) => withOwnedItem(payload, (item) => {
    const advancement = getAXEAdvancementState(item.instanceId);
    const cost = getAXEServiceInventoryCost('stage', { advancement });
    if (!canAfford(cost)) return { ok: false, reason: 'INSUFFICIENT_MATERIALS', cost };

    const result = applyAXEStage(item.instanceId, payload.options || {});
    if (result.reason === 'MAX_STAGE') return { ...result, cost };
    const paid = consumeCost(cost);
    return paid.ok ? { ...result, cost } : paid;
  }),

  refine: (payload) => withOwnedItem(payload, (item) => {
    const advancement = getAXEAdvancementState(item.instanceId);
    const protectedAttempt = !!payload.options?.protectedAttempt;
    const cost = getAXEServiceInventoryCost('refine', { advancement, protectedAttempt });
    if (!canAfford(cost)) return { ok: false, reason: 'INSUFFICIENT_MATERIALS', cost };

    const result = applyAXERefine(item.instanceId, payload.options || {});
    if (result.reason === 'MAX_REFINE') return { ...result, cost };

    const paid = consumeCost(cost);
    if (!paid.ok) return paid;
    if (result.destroyed) destroyAXEEquipmentItem(item.instanceId, 'refine_failure');
    return { ...result, cost };
  }),

  ultimate: (payload) => withOwnedItem(payload, (item) => {
    const advancement = getAXEAdvancementState(item.instanceId);
    const protectedAttempt = !!payload.options?.protectedAttempt;
    const cost = getAXEServiceInventoryCost('ultimate', { advancement, protectedAttempt });
    if (!canAfford(cost)) return { ok: false, reason: 'INSUFFICIENT_MATERIALS', cost };

    const result = applyAXEUltimate(item, payload.options || {});
    if (['RARITY_NOT_ELIGIBLE', 'MAX_ULTIMATE'].includes(result.reason)) {
      return { ...result, cost };
    }
    const paid = consumeCost(cost);
    return paid.ok ? { ...result, cost } : paid;
  }),

  sockets: (payload) => withOwnedItem(payload, (item) => {
    const sockets = getAXESocketState(item.instanceId);
    const protectedAttempt = !!payload.options?.protectedAttempt;
    const cost = getAXEServiceInventoryCost('sockets', { sockets, protectedAttempt });
    if (!canAfford(cost)) return { ok: false, reason: 'INSUFFICIENT_MATERIALS', cost };

    const result = drillAXESocket(item.instanceId, item, payload.options || {});
    if (result.reason === 'MAX_SOCKETS') return { ...result, cost };
    const paid = consumeCost(cost);
    return paid.ok ? { ...result, cost } : paid;
  }),

  insert_gem: (payload) => withOwnedItem(payload, (item) => {
    if (!payload.gemId) return { ok: false, reason: 'GEM_MISSING' };
    if (getLootItemCount(payload.gemId, 'gem') < 1) {
      return { ok: false, reason: 'GEM_NOT_OWNED', gemId: payload.gemId };
    }

    const sockets = getAXESocketState(item.instanceId);
    const result = insertGemIntoAXEItem(
      item.instanceId,
      { ...item, ...sockets },
      payload.socketIndex,
      payload.gemId,
    );
    if (!result.ok) return result;

    const consumed = consumeLootItemById(payload.gemId, 1, 'gem');
    return consumed.ok ? result : consumed;
  }),

  equipment_aura: (payload) => withOwnedItem(payload, (item) => {
    const cost = getAXEServiceInventoryCost('equipment_aura');
    if (!canAfford(cost)) return { ok: false, reason: 'INSUFFICIENT_MATERIALS', cost };
    const result = applyAXEItemAura(item, payload.options || {});
    if (!result.ok) return result;
    const paid = consumeCost(cost);
    return paid.ok ? { ...result, cost } : paid;
  }),
};

export async function executeAXEServiceTransaction(serviceId, payload = {}) {
  if (
    typeof window !== 'undefined' &&
    typeof window.__axeAuthoritativeServiceRequest === 'function'
  ) {
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
