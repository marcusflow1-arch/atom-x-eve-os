// Lightweight in-memory + localStorage stores for the in-game social systems.
// Friends and party are now SYNCED FROM THE DATABASE in real-time via
// IncomingRequestToast (which calls hydrateFriendsFromDB / hydratePartyFromDB
// when records change). Trade is volatile and lives only in memory.

import { base44 } from '@/api/base44Client';

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

// Send a friend REQUEST (creates a pending SocialRequest record).
// Receiver gets a popup via IncomingRequestToast to accept/decline.
export const sendFriendRequest = async (sender, receiver) => {
  return base44.entities.SocialRequest.create({
    kind: 'friend',
    sender_id: sender.id,
    sender_name: sender.name,
    receiver_id: receiver.id,
    receiver_name: receiver.name,
    status: 'pending',
  });
};

// Replace the local friends list with a fresh DB snapshot.
export const setFriendsList = (friends) => {
  friendsStore.set({ friends });
};

export const removeFriend = (id) => {
  const { friends } = friendsStore.get();
  friendsStore.set({ friends: friends.filter((f) => f.id !== id) });
};

// ─── PARTY ───────────────────────────────────────────────
export const partyStore = makeStore('game_party_v1', { members: [], partyId: null, leaderId: null });
export const PARTY_MAX = 4;

// Send a party INVITE (creates a pending SocialRequest record).
export const sendPartyRequest = async (sender, receiver, partyId) => {
  return base44.entities.SocialRequest.create({
    kind: 'party',
    sender_id: sender.id,
    sender_name: sender.name,
    receiver_id: receiver.id,
    receiver_name: receiver.name,
    party_id: partyId || null,
    status: 'pending',
  });
};

// Replace party state with a fresh DB snapshot.
export const setPartyState = ({ members, partyId, leaderId }) => {
  partyStore.set({ members: members || [], partyId: partyId || null, leaderId: leaderId || null });
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

// Send a trade REQUEST — receiver gets accept/decline popup.
// Returns the created request so caller can hold its id.
export const sendTradeRequest = async (sender, receiver) => {
  return base44.entities.SocialRequest.create({
    kind: 'trade',
    sender_id: sender.id,
    sender_name: sender.name,
    receiver_id: receiver.id,
    receiver_name: receiver.name,
    status: 'pending',
  });
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

// ─── DEPRECATED (kept for back-compat with existing callers) ──────
// addFriend / addPartyMember used to mutate locally; now they noop because
// state comes from DB. Use sendFriendRequest / sendPartyRequest instead.
export const addFriend = () => {};
export const addPartyMember = () => {};