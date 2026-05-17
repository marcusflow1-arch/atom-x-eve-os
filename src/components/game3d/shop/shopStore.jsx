// ─── Shop Store ────────────────────────────────────────────────────────
// Persistent player gold + purchased consumables/items.
// Gold is earned passively (titleStore kills += gold) and spent in StoreMenuOverlay.
// Consumables go into the inventory; using one fires `useShopItem` which the
// shopEffectsBridge consumes to apply real combat buffs.

const STORAGE_KEY = 'mmorpg_shop_store_v1';
const STARTING_GOLD = 5000;

const load = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      return {
        gold: typeof p.gold === 'number' ? p.gold : STARTING_GOLD,
        inventory: p.inventory || {}, // { [itemId]: count }
        equippedCosmetics: p.equippedCosmetics || {}, // { slot: itemId }
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

// Cosmetics are equipped, not consumed. Once owned, toggling on/off costs nothing.
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

// Consume one of a stackable consumable from inventory + fire the use-event.
export function consumeItem(item) {
  const have = state.inventory[item.id] || 0;
  if (have <= 0) return { ok: false, reason: 'None left' };
  const inv = { ...state.inventory, [item.id]: have - 1 };
  if (inv[item.id] <= 0) delete inv[item.id];
  state = { ...state, inventory: inv };
  emit();
  // Effects bridge listens for this and applies real buffs/heals.
  window.dispatchEvent(new CustomEvent('useShopItem', { detail: { item } }));
  return { ok: true };
}