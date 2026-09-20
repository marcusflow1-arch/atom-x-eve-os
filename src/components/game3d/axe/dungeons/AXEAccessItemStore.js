// AXE Prompt 037 — special access items (including SOS Access).
// Not all caves/dungeons use these items. Access requirements live on each
// dungeon/route definition so normal exploration remains open.

import { characterScopedStorage, subscribeCharacterChange } from '../../characterStorage';

export const AXE_SPECIAL_ACCESS_ITEMS = Object.freeze({
  AXE_Item_SOS_Access: Object.freeze({
    id: 'AXE_Item_SOS_Access',
    name: 'SOS Access',
    consumableOnUse: false,
    category: 'special_access',
    description: 'Grants entry to selected special locations and dungeon wings.',
  }),
});

const storage = characterScopedStorage('axe_special_access_items_v1');

const starter = () => ({
  items: {
    // Prototype grant so the gated branch can be tested immediately.
    // Production acquisition can later come from store, quests, events, or trade.
    AXE_Item_SOS_Access: 1,
  },
  lifetimeGranted: {
    AXE_Item_SOS_Access: 1,
  },
});

const load = () => {
  try {
    const raw = storage.get();
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        items: { ...starter().items, ...(parsed.items || {}) },
        lifetimeGranted: { ...starter().lifetimeGranted, ...(parsed.lifetimeGranted || {}) },
      };
    }
  } catch {}
  return starter();
};

let state = load();
const listeners = new Set();

const emit = () => {
  storage.set(JSON.stringify(state));
  const snapshot = getAXEAccessItemState();
  listeners.forEach((fn) => fn(snapshot));
};

subscribeCharacterChange(() => {
  state = load();
  listeners.forEach((fn) => fn(getAXEAccessItemState()));
});

export function getAXEAccessItemState() {
  return {
    items: { ...state.items },
    lifetimeGranted: { ...state.lifetimeGranted },
  };
}

export function subscribeAXEAccessItems(fn) {
  listeners.add(fn);
  fn(getAXEAccessItemState());
  return () => listeners.delete(fn);
}

export function getAXEAccessItemCount(itemId) {
  return Math.max(0, Number(state.items[itemId] || 0));
}

export function hasAXEAccessItem(itemId, count = 1) {
  return getAXEAccessItemCount(itemId) >= Math.max(1, Number(count) || 1);
}

export function grantAXEAccessItem(itemId, count = 1) {
  if (!AXE_SPECIAL_ACCESS_ITEMS[itemId]) return { ok: false, reason: 'ACCESS_ITEM_MISSING' };
  const n = Math.max(1, Math.floor(Number(count) || 1));
  state = {
    items: { ...state.items, [itemId]: getAXEAccessItemCount(itemId) + n },
    lifetimeGranted: {
      ...state.lifetimeGranted,
      [itemId]: Number(state.lifetimeGranted[itemId] || 0) + n,
    },
  };
  emit();
  return { ok: true, itemId, count: n, total: getAXEAccessItemCount(itemId) };
}

export function consumeAXEAccessItem(itemId, count = 1) {
  const def = AXE_SPECIAL_ACCESS_ITEMS[itemId];
  if (!def) return { ok: false, reason: 'ACCESS_ITEM_MISSING' };
  const n = Math.max(1, Math.floor(Number(count) || 1));
  if (!hasAXEAccessItem(itemId, n)) return { ok: false, reason: 'ACCESS_ITEM_REQUIRED', itemId, need: n };

  if (!def.consumableOnUse) {
    return { ok: true, itemId, consumed: 0, total: getAXEAccessItemCount(itemId) };
  }

  state = {
    ...state,
    items: { ...state.items, [itemId]: getAXEAccessItemCount(itemId) - n },
  };
  emit();
  return { ok: true, itemId, consumed: n, total: getAXEAccessItemCount(itemId) };
}
