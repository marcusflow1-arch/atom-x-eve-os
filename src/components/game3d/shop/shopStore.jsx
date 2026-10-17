// Persistent Silver + purchased consumables/items.
// Existing UI may still label this value "gold"; gameplay services treat it as
// the shared Silver balance during the TwelveSky migration.
//
// Each character has its own Silver, shop items and cosmetics (docs/game3d/CHARACTER_VAULT.md).
// They used to live under one browser-wide key, shared by every character and every
// account on the computer. That old balance goes, once, to the first signed-in character
// that loads; everyone else starts with STARTING_GOLD.
import { characterScopedStorage, getActiveId, getStorageUser, subscribeCharacterChange } from '../characterStorage';

const LEGACY_KEY = 'mmorpg_shop_store_v1';
const LEGACY_CLAIM_KEY = 'mmorpg_shop_store_v1_claimed_by';
const storage = characterScopedStorage('axe_shop_state_v1');
const STARTING_GOLD = 5000;

// the browser-wide balance from before Silver was per character, if no one has taken it yet
const claimLegacy = () => {
  try {
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (!legacy || localStorage.getItem(LEGACY_CLAIM_KEY)) return null;
    const user = getStorageUser(), character = getActiveId();
    if (user === '__anon__' || character === '__default__') return null;
    localStorage.setItem(LEGACY_CLAIM_KEY, `${user}::${character}`);
    return legacy;
  } catch {
    return null;
  }
};

const load = () => {
  try {
    let raw = storage.get();
    if (raw == null) {
      raw = claimLegacy();
      if (raw != null) storage.set(raw);
    }
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
const save = () => storage.set(JSON.stringify(state));
const emit = () => { save(); listeners.forEach((fn) => fn(state)); };

// another character or account: its own Silver and items
subscribeCharacterChange(() => {
  state = load();
  listeners.forEach((fn) => fn(state));
});

export function getShopState() { return state; }
export function subscribeShop(fn) { listeners.add(fn); fn(state); return () => listeners.delete(fn); }

export function addGold(amount) {
  state = { ...state, gold: Math.max(0, state.gold + amount) };
  emit();
}

export function spendGold(amount) {
  const value = Math.max(0, Math.floor(Number(amount) || 0));
  if (!value) return { ok: true, spent: 0 };
  if (state.gold < value) return { ok: false, reason: 'Not enough Silver' };
  state = { ...state, gold: state.gold - value };
  emit();
  return { ok: true, spent: value };
}

export function purchaseItem(item) {
  if (!item) return { ok: false, reason: 'Unknown item' };
  if (state.gold < item.price) return { ok: false, reason: 'Not enough Silver' };
  const inv = { ...state.inventory };
  inv[item.id] = (inv[item.id] || 0) + 1;
  state = { ...state, gold: state.gold - item.price, inventory: inv };
  emit();
  return { ok: true };
}

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
