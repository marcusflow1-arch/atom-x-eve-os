// AXE Prompt 038 — service transaction gateway.
// All equipment services validate REAL owned item instances before mutating.
// The authoritative bridge still wins when mounted; this browser fallback now
// preserves the same inventory/resource semantics for local development.

import {
  canAffordMaterials,
  enchantSlot,
  getItemOverEnchant,
  getItemReinforcement,
  getOverEnchantCost,
  getReinforcementCost,
  overEnchantItem,
  reinforceItem,
  setServerUpgradeRecord,
} from '../../equipment/enchantmentStore';
import {
  applyAXECombine,
  applyAXERefine,
  applyAXEStage,
  applyAXEUltimate,
  getAXEAdvancementState,
  setAXEAdvancementRecord,
} from '../equipment/AXEItemAdvancementStore';
import { AXE_OVER_ENCHANT_CONFIG, AXE_REINFORCEMENT_CONFIG } from '../equipment/AXEItemEnhancementSystem';
import { SERVER_ROLLED_UPGRADES } from '../../../../../base44/shared/itemUpgradeLedger.ts';
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
  persistAXEEquipmentInventory,
} from '../equipment/AXEEquipmentInventoryStore';
import {
  consumeLootItemById,
  getLootItemCount,
} from '../../lootStore';
import { getAXEServiceInventoryCost } from './AXEServiceEconomy';
import { getNextStage, AXE_REFINE_CONFIG, AXE_ULTIMATE_CONFIG } from '../equipment/AXEItemAdvancementSystem';
import { getAXEServiceEligibility } from './AXEServiceEligibility';
import { appendAXEServiceAudit, createAXEServiceTransactionId } from './AXEServiceAuditStore';

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

const withOwnedItem = (payload, fn, serviceId = null) => {
  const check = requireOwned(payload.itemId || payload.item?.instanceId || payload.item?.id);
  if (!check.ok) return check;
  if (serviceId) {
    const eligible = getAXEServiceEligibility(serviceId, check.item);
    if (!eligible.eligible) return { ok: false, reason: eligible.reason };
  }
  return fn(check.item);
};

const localHandlers = {
  reinforcement: (payload) => withOwnedItem(payload, (item) =>
    reinforceItem(item.instanceId, payload.options || {})
  , 'reinforcement'),

  enchant: (payload) => withOwnedItem(payload, (item) =>
    enchantSlot(item.instanceId, payload.slotIndex ?? 0)
  , 'enchant'),

  over_enchant: (payload) => withOwnedItem(payload, (item) =>
    overEnchantItem(item.instanceId, payload.options || {})
  , 'over_enchant'),

  combine: (payload) => {
    const targetId = payload.itemId || payload.item?.instanceId || payload.item?.id;
    const donorId = payload.donorId || payload.donor?.instanceId || payload.donor?.id;
    const targetCheck = requireOwned(targetId);
    if (!targetCheck.ok) return targetCheck;
    const eligibility = getAXEServiceEligibility('combine', targetCheck.item);
    if (!eligibility.eligible) return { ok: false, reason: eligibility.reason };
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
    if (!getNextStage(advancement.stage)) return { ok: false, reason: 'MAX_STAGE' };
    const cost = getAXEServiceInventoryCost('stage', { advancement });
    const paid = consumeCost(cost);
    if (!paid.ok) return paid;

    const result = applyAXEStage(item.instanceId, payload.options || {});
    return { ...result, cost };
  }, 'stage'),

  refine: (payload) => withOwnedItem(payload, (item) => {
    const advancement = getAXEAdvancementState(item.instanceId);
    if (Number(advancement.refine?.level || 0) >= AXE_REFINE_CONFIG.maxLevel) {
      return { ok: false, reason: 'MAX_REFINE' };
    }
    const protectedAttempt = !!payload.options?.protectedAttempt;
    const cost = getAXEServiceInventoryCost('refine', { advancement, protectedAttempt });
    const paid = consumeCost(cost);
    if (!paid.ok) return paid;

    const result = applyAXERefine(item.instanceId, payload.options || {});
    if (result.destroyed) destroyAXEEquipmentItem(item.instanceId, 'refine_failure');
    return { ...result, cost };
  }, 'refine'),

  ultimate: (payload) => withOwnedItem(payload, (item) => {
    const advancement = getAXEAdvancementState(item.instanceId);
    if (Number(advancement.ultimate?.level || 0) >= AXE_ULTIMATE_CONFIG.maxLevel) {
      return { ok: false, reason: 'MAX_ULTIMATE' };
    }
    const protectedAttempt = !!payload.options?.protectedAttempt;
    const cost = getAXEServiceInventoryCost('ultimate', { advancement, protectedAttempt });
    const paid = consumeCost(cost);
    if (!paid.ok) return paid;

    const result = applyAXEUltimate(item, payload.options || {});
    return { ...result, cost };
  }, 'ultimate'),

  sockets: (payload) => withOwnedItem(payload, (item) => {
    const sockets = getAXESocketState(item.instanceId);
    if ((sockets.sockets?.length || 0) >= Number(sockets.maxSockets || 0)) {
      return { ok: false, reason: 'MAX_SOCKETS' };
    }
    const protectedAttempt = !!payload.options?.protectedAttempt;
    const cost = getAXEServiceInventoryCost('sockets', { sockets, protectedAttempt });
    const paid = consumeCost(cost);
    if (!paid.ok) return paid;

    const result = drillAXESocket(item.instanceId, item, payload.options || {});
    return { ...result, cost };
  }, 'sockets'),

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
  }, 'insert_gem'),

  equipment_aura: (payload) => withOwnedItem(payload, (item) => {
    const cost = getAXEServiceInventoryCost('equipment_aura');
    const paid = consumeCost(cost);
    if (!paid.ok) return paid;
    const result = applyAXEItemAura(item, payload.options || {});
    return { ...result, cost };
  }, 'equipment_aura'),
};

// ---- server-rolled upgrades (docs/game3d/SERVER_UPGRADES.md) ----
// Reinforcement, over-enchant, refine and ultimate are rolled by the server when the
// Character Vault registers its dice here (character/CharacterVaultSync). The server's
// record for the item is the one rolled on, the game's own handler then applies the
// server's roll (costs, messages, destruction as before), and the server's result is kept.
let diceSource = null;

export function setAXEServiceDiceSource(fn) {
  diceSource = typeof fn === 'function' ? fn : null;
  return () => { if (diceSource === fn) diceSource = null; };
}

const setUpgradeRecord = (serviceId, itemId, record) => (
  serviceId === 'reinforcement' || serviceId === 'over_enchant'
    ? setServerUpgradeRecord(serviceId, itemId, record)
    : setAXEAdvancementRecord(itemId, serviceId, record)
);

// what the game refuses anyway, checked before a roll is spent on it
function checkBeforeServerRoll(serviceId, payload) {
  const check = requireOwned(payload.itemId || payload.item?.instanceId || payload.item?.id);
  if (!check.ok) return check;
  const eligible = getAXEServiceEligibility(serviceId, check.item);
  if (!eligible.eligible) return { ok: false, reason: eligible.reason };
  const id = check.item.instanceId;
  const protectedAttempt = !!payload.options?.protectedAttempt;
  const advancement = getAXEAdvancementState(id);
  let cost = null;
  let affordable = true;
  if (serviceId === 'reinforcement') {
    if (Number(getItemReinforcement(id).percent || 0) >= AXE_REINFORCEMENT_CONFIG.maxPercent) return { ok: false, reason: 'max_reinforcement' };
    cost = getReinforcementCost(id, { protectedAttempt });
    affordable = canAffordMaterials(cost);
  } else if (serviceId === 'over_enchant') {
    if (Number(getItemOverEnchant(id).level || 0) >= AXE_OVER_ENCHANT_CONFIG.maxLevel) return { ok: false, reason: 'max_over_enchant' };
    cost = getOverEnchantCost(id, { protectedAttempt });
    affordable = canAffordMaterials(cost);
  } else if (serviceId === 'refine') {
    if (Number(advancement.refine?.level || 0) >= AXE_REFINE_CONFIG.maxLevel) return { ok: false, reason: 'MAX_REFINE' };
    cost = getAXEServiceInventoryCost('refine', { advancement, protectedAttempt });
    affordable = canAfford(cost);
  } else if (serviceId === 'ultimate') {
    if (Number(advancement.ultimate?.level || 0) >= AXE_ULTIMATE_CONFIG.maxLevel) return { ok: false, reason: 'MAX_ULTIMATE' };
    if (!AXE_ULTIMATE_CONFIG.eligibleRarities.includes(String(check.item.rarity || '').toLowerCase())) return { ok: false, reason: 'RARITY_NOT_ELIGIBLE' };
    cost = getAXEServiceInventoryCost('ultimate', { advancement, protectedAttempt });
    affordable = canAfford(cost);
  }
  if (!affordable) return { ok: false, reason: 'insufficient_materials', cost };
  return { ok: true, item: check.item };
}

// null: this character rolls on this device (anonymous play, the pre-character slot)
async function runServerRolledUpgrade(serviceId, payload) {
  const ready = checkBeforeServerRoll(serviceId, payload);
  if (!ready.ok) return ready;
  const itemId = ready.item.instanceId;
  // the server rolls on its copy of the save, which must hold this item (starter items may
  // still be only in memory)
  persistAXEEquipmentInventory();
  const dice = await diceSource({
    serviceId,
    itemId,
    protectedAttempt: !!payload.options?.protectedAttempt,
    transactionId: payload.transactionId,
  });
  if (dice?.local) return null;
  if (!dice?.ok || !dice.result) return { ok: false, reason: dice?.reason || 'upgrades_need_a_server_connection' };
  const rolled = dice.result;
  if (rolled.reason) return { ok: false, reason: rolled.reason }; // the server rolled nothing

  setUpgradeRecord(serviceId, itemId, rolled.before);
  const local = await localHandlers[serviceId]({
    ...payload,
    options: { ...(payload.options || {}), roll: rolled.roll },
  });
  // the server's result is the item's, whatever happened here
  if (rolled.destroyed) {
    if (getOwned(itemId)) destroyAXEEquipmentItem(itemId, 'refine_failure');
  } else {
    setUpgradeRecord(serviceId, itemId, rolled.after);
  }
  return {
    ...(local || {}),
    ok: !!rolled.ok,
    outcome: rolled.outcome || local?.outcome || null,
    ...(rolled.destroyed ? { destroyed: true } : {}),
    serverRolled: true,
  };
}

const inFlight = new Set();

export async function executeAXEServiceTransaction(serviceId, payload = {}) {
  const itemId = payload.itemId || payload.item?.instanceId || payload.item?.id || null;
  const lockKey = `${serviceId}::${itemId || 'global'}`;
  if (inFlight.has(lockKey)) {
    return { ok: false, reason: 'TRANSACTION_IN_PROGRESS' };
  }

  const requestedAt = Date.now();
  const transactionId = payload.transactionId
    || createAXEServiceTransactionId(serviceId, itemId);

  inFlight.add(lockKey);
  try {
    let result;
    let authoritative = false;

    if (
      typeof window !== 'undefined' &&
      typeof window.__axeAuthoritativeServiceRequest === 'function'
    ) {
      authoritative = true;
      result = await window.__axeAuthoritativeServiceRequest({
        transactionId,
        serviceId,
        payload: { ...payload, transactionId },
        requestedAt,
      });
    } else {
      if (diceSource && SERVER_ROLLED_UPGRADES.includes(serviceId)) {
        result = await runServerRolledUpgrade(serviceId, { ...payload, transactionId });
        authoritative = !!result?.serverRolled;
      }
      if (result === undefined || result === null) {
        const handler = localHandlers[serviceId];
        result = handler
          ? await handler({ ...payload, transactionId })
          : { ok: false, reason: 'SERVICE_TRANSACTION_NOT_AVAILABLE' };
      }
    }

    const normalized = result || { ok: false, reason: 'EMPTY_TRANSACTION_RESULT' };
    appendAXEServiceAudit({
      transactionId,
      serviceId,
      itemId,
      requestedAt,
      completedAt: Date.now(),
      authoritative,
      ok: !!normalized.ok,
      outcome: normalized.outcome || null,
      reason: normalized.reason || null,
      cost: normalized.cost || null,
    });

    return { ...normalized, transactionId };
  } catch (error) {
    appendAXEServiceAudit({
      transactionId,
      serviceId,
      itemId,
      requestedAt,
      completedAt: Date.now(),
      authoritative: false,
      ok: false,
      reason: error?.message || 'TRANSACTION_EXCEPTION',
    });
    return {
      ok: false,
      reason: 'TRANSACTION_EXCEPTION',
      message: error?.message || String(error),
      transactionId,
    };
  } finally {
    inFlight.delete(lockKey);
  }
}
