// Persistent player gold + purchased consumables/items.
// The modern Spirit Service can buy and sell in the field while preserving the
// same inventory/economy store used by the existing merchant UI.

const STORAGE_KEY = 'mmorpg_shop_store_v1';
const STARTING_GOLD = 5000;

const load = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      return {
        gold: typeof p.gold === 'number' ? p.gold : STARTING_GOLD,
        inventory: p.inventory || {},
        equippedCosmetics: p.equippedCosmetics || {},
      };
    }
  } catch {}
  return { gold: STARTING_GOLD, inventory: {}, equippedCosmetics: {} };
};

let state = load();
const listeners = new Set();
const save = () => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {} };
const emit = () => { save(); listeners.forEach((fn) => fn(state)); };

export function getShopState() { return state; }
export function subscribeShop(fn) { listeners.add(fn); fn(state); return () => listeners.delete(fn); }

export function addGold(amount) {
  state = { ...state, gold: Math.max(0, state.gold + amount) };
  emit();
}

export function purchaseItem(item) {
  if (!item) return { ok: false, reason: 'Unknown item' };
  if (state.gold < item.price) return { ok: false, reason: 'Not enough gold' };
  const inv = { ...state.inventory };
  inv[item.id] = (inv[item.id] || 0) + 1;
  state = { ...state, gold: state.gold - item.price, inventory: inv };
  emit();
  return { ok: true };
}

// Spirit resale: remove an owned item without returning to an NPC. The 50%
// return keeps the original buy/sell friction while removing travel downtime.
export function sellItem(item, quantity = 1) {
  if (!item) return { ok: false, reason: 'Unknown item' };
  const qty = Math.max(1, Math.floor(Number(quantity) || 1));
  const have = state.inventory[item.id] || 0;
  if (have < qty) return { ok: false, reason: 'Not enough items to sell' };
  const inventory = { ...state.inventory, [item.id]: have - qty };
  if (inventory[item.id] <= 0) delete inventory[item.id];
  const unitValue = Math.max(1, Math.floor((item.price || 0) * 0.5));
  const goldReceived = unitValue * qty;
  state = { ...state, inventory, gold: state.gold + goldReceived };
  emit();
  return { ok: true, goldReceived };
}

export function equipCosmetic(slot, itemId) {
  state = { ...state, equippedCosmetics: { ...state.equippedCosmetics, [slot]: itemId } };
  emit();
}

export function unequipCosmetic(slot) {
  const next = { ...state.equippedCosmetics };
  delete next[slot];
  state = { ...state, equippedCosmetics: next };
  emit();
}

export function consumeItem(item) {
  const have = state.inventory[item.id] || 0;
  if (have <= 0) return { ok: false, reason: 'None left' };
  const inv = { ...state.inventory, [item.id]: have - 1 };
  if (inv[item.id] <= 0) delete inv[item.id];
  state = { ...state, inventory: inv };
  emit();
  window.dispatchEvent(new CustomEvent('useShopItem', { detail: { item } }));
  return { ok: true };
}
