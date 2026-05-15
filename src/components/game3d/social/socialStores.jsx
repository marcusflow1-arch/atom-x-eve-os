// Lightweight in-memory + localStorage stores for the in-game social systems:
// - friendsStore : list of accepted friends
// - partyStore   : current party members (max 4)
// - tradeStore   : active trade session state
//
// Each store has the same shape: get(), subscribe(fn), and mutators that emit.

const makeStore = (storageKey, defaultState) => {
  let state = (() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) return { ...defaultState, ...JSON.parse(raw) };
    } catch {}
    return { ...defaultState };
  })();
  const listeners = new Set();
  const emit = () => {
    try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch {}
    listeners.forEach((fn) => fn(state));
  };
  return {
    get: () => state,
    set: (patch) => { state = { ...state, ...patch }; emit(); },
    subscribe: (fn) => { listeners.add(fn); fn(state); return () => listeners.delete(fn); },
  };
};

// ─── FRIENDS ─────────────────────────────────────────────
export const friendsStore = makeStore('game_friends_v1', { friends: [] });
export const addFriend = (friend) => {
  const { friends } = friendsStore.get();
  if (friends.some((f) => f.id === friend.id)) return;
  friendsStore.set({ friends: [...friends, friend] });
};
export const removeFriend = (id) => {
  const { friends } = friendsStore.get();
  friendsStore.set({ friends: friends.filter((f) => f.id !== id) });
};

// ─── PARTY ───────────────────────────────────────────────
export const partyStore = makeStore('game_party_v1', { members: [] });
export const PARTY_MAX = 4;
export const addPartyMember = (m) => {
  const { members } = partyStore.get();
  if (members.length >= PARTY_MAX || members.some((x) => x.id === m.id)) return;
  partyStore.set({ members: [...members, m] });
};
export const removePartyMember = (id) => {
  const { members } = partyStore.get();
  partyStore.set({ members: members.filter((m) => m.id !== id) });
};

// ─── TRADE ───────────────────────────────────────────────
// Trade session is volatile — never persisted. Resets on close.
let tradeState = {
  open: false,
  partner: null,      // { id, name }
  myOffer: [],        // array of inventory item ids
  theirOffer: [],     // simulated
  myConfirmed: false,
  theirConfirmed: false,
};
const tradeListeners = new Set();
const emitTrade = () => tradeListeners.forEach((fn) => fn(tradeState));
export const tradeStore = {
  get: () => tradeState,
  subscribe: (fn) => { tradeListeners.add(fn); fn(tradeState); return () => tradeListeners.delete(fn); },
};
export const openTrade = (partner) => {
  tradeState = { open: true, partner, myOffer: [], theirOffer: [], myConfirmed: false, theirConfirmed: false };
  emitTrade();
};
export const closeTrade = () => {
  tradeState = { open: false, partner: null, myOffer: [], theirOffer: [], myConfirmed: false, theirConfirmed: false };
  emitTrade();
};
export const addItemToTrade = (itemId) => {
  if (tradeState.myOffer.includes(itemId)) return;
  tradeState = { ...tradeState, myOffer: [...tradeState.myOffer, itemId], myConfirmed: false, theirConfirmed: false };
  emitTrade();
};
export const removeItemFromTrade = (itemId) => {
  tradeState = {
    ...tradeState,
    myOffer: tradeState.myOffer.filter((id) => id !== itemId),
    myConfirmed: false,
    theirConfirmed: false,
  };
  emitTrade();
};
export const setMyTradeConfirmed = (val) => {
  tradeState = { ...tradeState, myConfirmed: val };
  emitTrade();
};
export const setTheirTradeConfirmed = (val) => {
  tradeState = { ...tradeState, theirConfirmed: val };
  emitTrade();
};