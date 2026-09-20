// Canonical AXE equipment inventory backend.
// This is the single runtime ownership/equip source used by Gear UI, Services,
// combat-stat recomputation, combine consumption and future loot/economy paths.
//
// inventoryData.jsx remains a template/seed catalog only. The player's actual
// owned item instances live here and are persisted per user + per character.

import { INVENTORY } from '../../equipment/inventoryData';
import { characterScopedStorage, subscribeCharacterChange } from '../../characterStorage';
import {
  AXE_EQUIPMENT_SLOT_DEFS,
  migrateLegacyEquipmentItem,
  validateAXEEquip,
} from './AXEEquipmentSystem';

const storage = characterScopedStorage('axe_equipment_inventory_v2');
const CURRENT_STARTER_CATALOG_VERSION = 1;

function seedItems() {
  return Object.entries(INVENTORY).flatMap(([category, items]) =>
    (items || []).map((raw) => {
      const item = migrateLegacyEquipmentItem(raw, category);
      return {
        ...raw,
        ...item,
        id: raw.id || item.templateId,
        instanceId: item.instanceId || raw.id,
        templateId: item.templateId || raw.id,
        category,
        equipped: !!raw.equipped,
        locked: !!raw.locked,
        acquiredAt: 0,
        source: 'starter',
      };
    }),
  );
}

function normalizeItem(raw = {}, fallbackCategory = null) {
  const category = raw.category || fallbackCategory || raw.slot || 'misc';
  const migrated = migrateLegacyEquipmentItem(raw, category);
  return {
    ...raw,
    ...migrated,
    id: raw.id || migrated.templateId,
    instanceId: raw.instanceId || migrated.instanceId || raw.id,
    templateId: raw.templateId || migrated.templateId || raw.id,
    category,
    equipped: !!raw.equipped,
    locked: !!raw.locked,
    acquiredAt: Number(raw.acquiredAt || Date.now()),
    source: raw.source || 'owned',
  };
}

function chooseActiveWeaponInstanceId(items = [], preferred = null) {
  const equippedWeapons = items.filter((item) => item.category === 'weapon' && item.equipped);
  if (preferred && equippedWeapons.some((item) => item.instanceId === preferred)) return preferred;
  return equippedWeapons[0]?.instanceId || null;
}

function buildDefault() {
  const items = seedItems();
  return {
    items,
    activeWeaponInstanceId: chooseActiveWeaponInstanceId(items),
    starterCatalogVersion: CURRENT_STARTER_CATALOG_VERSION,
  };
}

function load() {
  try {
    const raw = storage.get();
    if (!raw) return buildDefault();
    const parsed = JSON.parse(raw);
    const owned = Array.isArray(parsed.items)
      ? parsed.items.map((item) => normalizeItem(item, item.category)).filter((item) => item.instanceId)
      : [];

    // Starter content is migrated ONCE per catalog version. Previously a consumed
    // starter item was silently re-created on every reload, which made combine /
    // destruction non-persistent. Existing starter instances still receive safe
    // metadata updates, but missing/consumed instances stay missing after the
    // catalog migration has been recorded.
    const byId = new Map(owned.map((item) => [item.instanceId, item]));
    const starters = seedItems();
    const shouldAddNewStarters =
      Number(parsed.starterCatalogVersion || 0) < CURRENT_STARTER_CATALOG_VERSION;

    for (const starter of starters) {
      const existing = byId.get(starter.instanceId);
      if (!existing) {
        if (shouldAddNewStarters) byId.set(starter.instanceId, starter);
        continue;
      }

      byId.set(starter.instanceId, {
        ...starter,
        ...existing,
        masteryWeaponId: existing.masteryWeaponId || starter.masteryWeaponId || null,
        axeWeaponRole: existing.axeWeaponRole || starter.axeWeaponRole || null,
        templateId: existing.templateId || starter.templateId,
      });
    }

    const items = [...byId.values()];
    return {
      items,
      activeWeaponInstanceId: chooseActiveWeaponInstanceId(
        items,
        parsed.activeWeaponInstanceId || null,
      ),
      starterCatalogVersion: CURRENT_STARTER_CATALOG_VERSION,
    };
  } catch {
    return buildDefault();
  }
}

let state = load();
const listeners = new Set();

function snapshot() {
  return {
    items: state.items.map((item) => ({
      ...item,
      baseStats: { ...(item.baseStats || {}) },
      rolledStats: { ...(item.rolledStats || {}) },
      sockets: Array.isArray(item.sockets) ? item.sockets.map((s) => ({ ...s })) : [],
    })),
    activeWeaponInstanceId: state.activeWeaponInstanceId || null,
    starterCatalogVersion: Number(state.starterCatalogVersion || CURRENT_STARTER_CATALOG_VERSION),
  };
}

function emit() {
  storage.set(JSON.stringify(state));
  const snap = snapshot();
  listeners.forEach((fn) => fn(snap));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('axeEquipmentInventoryChanged', { detail: snap }));
  }
}

function emitItemRemoved(item, reason) {
  if (typeof window === 'undefined' || !item?.instanceId) return;
  window.dispatchEvent(new CustomEvent('axeEquipmentItemRemoved', {
    detail: {
      instanceId: item.instanceId,
      templateId: item.templateId || item.id || null,
      reason: reason || 'removed',
    },
  }));
}

subscribeCharacterChange(() => {
  state = load();
  const snap = snapshot();
  listeners.forEach((fn) => fn(snap));
});

export function getAXEEquipmentInventoryState() {
  return snapshot();
}

export function subscribeAXEEquipmentInventory(fn) {
  listeners.add(fn);
  fn(snapshot());
  return () => listeners.delete(fn);
}

export function getAllAXEEquipmentItems() {
  return state.items.map((item) => ({ ...item }));
}

export function getAXEEquipmentItem(instanceId) {
  const item = state.items.find((entry) => entry.instanceId === instanceId || entry.id === instanceId);
  return item ? { ...item } : null;
}

export function getAXEInventoryItemsByCategory(categoryId) {
  return state.items
    .filter((item) => item.category === categoryId)
    .map((item) => ({ ...item }));
}

export function getEquippedAXEItems() {
  return state.items.filter((item) => item.equipped).map((item) => ({ ...item }));
}

export function getEquippedAXEItemsByCategory(categoryId) {
  return state.items
    .filter((item) => item.category === categoryId && item.equipped)
    .map((item) => ({ ...item }));
}

export function getEquippedAXEItemInCategory(categoryId) {
  return getEquippedAXEItemsByCategory(categoryId)[0] || null;
}

export function getActiveEquippedAXEWeapon() {
  const activeId = state.activeWeaponInstanceId;
  const active = state.items.find(
    (item) =>
      item.instanceId === activeId &&
      item.category === 'weapon' &&
      item.equipped,
  );
  if (active) return { ...active };

  const fallback = state.items.find((item) => item.category === 'weapon' && item.equipped) || null;
  return fallback ? { ...fallback } : null;
}

export function setActiveAXEWeapon(instanceId) {
  const target = state.items.find(
    (item) =>
      (item.instanceId === instanceId || item.id === instanceId) &&
      item.category === 'weapon',
  );
  if (!target) return { ok: false, reason: 'WEAPON_NOT_OWNED' };
  if (!target.equipped) return { ok: false, reason: 'WEAPON_NOT_EQUIPPED' };

  if (state.activeWeaponInstanceId === target.instanceId) {
    return { ok: true, reason: 'ALREADY_ACTIVE', item: { ...target } };
  }

  state = { ...state, activeWeaponInstanceId: target.instanceId };
  emit();
  return { ok: true, item: getActiveEquippedAXEWeapon() };
}

export function equipAXEInventoryItem(instanceId, context = {}) {
  const index = state.items.findIndex((item) => item.instanceId === instanceId || item.id === instanceId);
  if (index < 0) return { ok: false, reason: 'ITEM_MISSING' };

  const target = state.items[index];
  const validation = validateAXEEquip(target, context);
  if (!validation.ok) return validation;
  if (target.equipped) {
    if (target.category === 'weapon' && state.activeWeaponInstanceId !== target.instanceId) {
      state = { ...state, activeWeaponInstanceId: target.instanceId };
      emit();
      return { ok: true, reason: 'ALREADY_EQUIPPED_NOW_ACTIVE', item: getActiveEquippedAXEWeapon() };
    }
    return { ok: true, reason: 'ALREADY_EQUIPPED', item: { ...target } };
  }

  const slotDef = AXE_EQUIPMENT_SLOT_DEFS[target.slot];
  if (!slotDef) return { ok: false, reason: 'INVALID_SLOT' };

  const sameSlotEquipped = state.items.filter(
    (item) => item.equipped && item.slot === target.slot && item.instanceId !== target.instanceId,
  );

  const removeIds = new Set(
    sameSlotEquipped
      .slice(0, Math.max(0, sameSlotEquipped.length - slotDef.maxEquipped + 1))
      .map((item) => item.instanceId),
  );

  const nextItems = state.items.map((item) => {
    if (removeIds.has(item.instanceId)) return { ...item, equipped: false };
    if (item.instanceId === target.instanceId) return { ...item, equipped: true };
    return item;
  });
  state = {
    ...state,
    items: nextItems,
    activeWeaponInstanceId: target.category === 'weapon'
      ? target.instanceId
      : chooseActiveWeaponInstanceId(nextItems, state.activeWeaponInstanceId),
  };
  emit();
  return { ok: true, item: getAXEEquipmentItem(target.instanceId), autoUnequippedIds: [...removeIds] };
}

export function unequipAXEInventoryItem(instanceId) {
  const index = state.items.findIndex((item) => item.instanceId === instanceId || item.id === instanceId);
  if (index < 0) return { ok: false, reason: 'ITEM_MISSING' };
  if (!state.items[index].equipped) return { ok: true, reason: 'ALREADY_UNEQUIPPED' };

  const nextItems = state.items.map((item, i) => i === index ? { ...item, equipped: false } : item);
  state = {
    ...state,
    items: nextItems,
    activeWeaponInstanceId: chooseActiveWeaponInstanceId(nextItems, state.activeWeaponInstanceId),
  };
  emit();
  return { ok: true };
}

export function setAXEInventoryItemLocked(instanceId, locked) {
  const index = state.items.findIndex((item) => item.instanceId === instanceId || item.id === instanceId);
  if (index < 0) return { ok: false, reason: 'ITEM_MISSING' };
  state = {
    ...state,
    items: state.items.map((item, i) => i === index ? { ...item, locked: !!locked } : item),
  };
  emit();
  return { ok: true };
}

export function addAXEEquipmentItem(rawItem, {
  source = 'loot',
  equipped = false,
} = {}) {
  if (!rawItem) return { ok: false, reason: 'ITEM_MISSING' };
  const category = rawItem.category || rawItem.slot;
  const uniqueInstanceId =
    rawItem.instanceId ||
    rawItem.instance_id ||
    `${rawItem.id || rawItem.templateId || 'axe_item'}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;

  if (state.items.some((item) => item.instanceId === uniqueInstanceId)) {
    return { ok: false, reason: 'DUPLICATE_INSTANCE' };
  }

  const item = normalizeItem({
    ...rawItem,
    instanceId: uniqueInstanceId,
    category,
    source,
    equipped: false,
    acquiredAt: Date.now(),
  }, category);

  state = { ...state, items: [...state.items, item] };
  emit();

  if (equipped) return equipAXEInventoryItem(item.instanceId);
  return { ok: true, item: getAXEEquipmentItem(item.instanceId) };
}

export function canConsumeAXEEquipmentItem(instanceId, {
  allowEquipped = false,
  allowLocked = false,
} = {}) {
  const item = state.items.find((entry) => entry.instanceId === instanceId || entry.id === instanceId);
  if (!item) return { ok: false, reason: 'ITEM_MISSING' };
  if (item.equipped && !allowEquipped) return { ok: false, reason: 'ITEM_EQUIPPED', item: { ...item } };
  if (item.locked && !allowLocked) return { ok: false, reason: 'ITEM_LOCKED', item: { ...item } };
  return { ok: true, item: { ...item } };
}

export function consumeAXEEquipmentItem(instanceId, options = {}) {
  const check = canConsumeAXEEquipmentItem(instanceId, options);
  if (!check.ok) return check;
  const nextItems = state.items.filter((item) => item.instanceId !== check.item.instanceId);
  state = {
    ...state,
    items: nextItems,
    activeWeaponInstanceId: chooseActiveWeaponInstanceId(nextItems, state.activeWeaponInstanceId),
  };
  emit();
  emitItemRemoved(check.item, 'consumed');
  return { ok: true, consumed: check.item };
}

export function destroyAXEEquipmentItem(instanceId, reason = 'destroyed') {
  const item = state.items.find((entry) => entry.instanceId === instanceId || entry.id === instanceId);
  if (!item) return { ok: false, reason: 'ITEM_MISSING' };
  const nextItems = state.items.filter((entry) => entry.instanceId !== item.instanceId);
  state = {
    ...state,
    items: nextItems,
    activeWeaponInstanceId: chooseActiveWeaponInstanceId(nextItems, state.activeWeaponInstanceId),
  };
  emit();
  emitItemRemoved(item, reason || 'destroyed');
  return { ok: true, destroyed: { ...item }, destroyReason: reason };
}

export function resetAXEEquipmentInventoryToStarter() {
  state = buildDefault();
  emit();
}
