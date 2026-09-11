// ─── Shop Store ────────────────────────────────────────────────────────
// Persistent player gold + purchased consumables/items.
// The Spirit Market can buy, use and resell routine inventory without a
// merchant NPC trip.

const STORAGE_KEY = 'mmorpg_shop_store_v1';
const STARTING_GOLD = 5000;
export const DEFAULT_RESALE_RATE = 0.35;

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
  if (state.gold < item.price) return { ok: false, reason: 'Not enough gold' };
  const inv = { ...state.inventory };
  inv[item.id] = (inv[item.id] || 0) + 1;
  state = { ...state, gold: state.gold - item.price, inventory: inv };
  emit();
  return { ok: true };
}

export function getResaleValue(item, quantity = 1, resaleRate = DEFAULT_RESALE_RATE) {
  const qty = Math.max(1, Math.floor(Number(quantity) || 1));
  const rate = Math.max(0, Math.min(1, Number(resaleRate) || DEFAULT_RESALE_RATE));
  return Math.max(1, Math.floor((Number(item?.price) || 0) * rate)) * qty;
}

// Spirit resale for items bought from the remote market. Equipped cosmetics
// must be unequipped first so selling never silently changes a player's look.
export function sellPurchasedItem(item, quantity = 1, resaleRate = DEFAULT_RESALE_RATE) {
  if (!item?.id) return { ok: false, reason: 'Unknown item.' };
  if (Object.values(state.equippedCosmetics).includes(item.id)) {
    return { ok: false, reason: 'Unequip this cosmetic before selling it.' };
  }
  const have = state.inventory[item.id] || 0;
  const qty = Math.max(1, Math.min(have, Math.floor(Number(quantity) || 1)));
  if (have <= 0 || qty <= 0) return { ok: false, reason: 'None owned.' };

  const inv = { ...state.inventory, [item.id]: have - qty };
  if (inv[item.id] <= 0) delete inv[item.id];
  const value = getResaleValue(item, qty, resaleRate);
  state = { ...state, gold: state.gold + value, inventory: inv };
  emit();
  return { ok: true, quantity: qty, value, gold: state.gold };
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
