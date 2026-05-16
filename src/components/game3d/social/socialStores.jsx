// Lightweight in-memory + localStorage stores for the in-game social systems.
// Friends and party are now SYNCED FROM THE DATABASE in real-time via
// IncomingRequestToast (which calls hydrateFriendsFromDB / hydratePartyFromDB
// when records change). Trade is volatile and lives only in memory.

import { base44 } from '@/api/base44Client';
// Each social action lives in its own focused module. socialStores only
// re-exports the send helpers so existing callers keep working.
import { sendFriendRequest as _sendFriendRequest } from './friendRequest';
import { sendPartyInvite as _sendPartyInvite, PARTY_MAX as _PARTY_MAX } from './partyInvite';
import { sendTradeRequest as _sendTradeRequest } from './tradeRequest';
import { sendDuelChallenge as _sendDuelChallenge } from './duelChallenge';

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

// Friend request — delegates to friendRequest.js
export const sendFriendRequest = _sendFriendRequest;

// Replace the local friends list with a fresh DB snapshot.
export const setFriendsList = (friends) => {
  friendsStore.set({ friends });
};

// Remove friend — deletes the SocialFriendship row from the DB so the change
// persists across sessions. Local store is updated optimistically; the DB
// subscription in IncomingRequestToast will then refresh both sides.
export const removeFriend = async (id) => {
  const { friends } = friendsStore.get();
  friendsStore.set({ friends: friends.filter((f) => f.id !== id) });
  try {
    const me = await base44.auth.me();
    if (!me) return;
    const [asA, asB] = await Promise.all([
      base44.entities.SocialFriendship.filter({ user_a_id: me.id, user_b_id: id }),
      base44.entities.SocialFriendship.filter({ user_a_id: id, user_b_id: me.id }),
    ]);
    const rows = [...(asA || []), ...(asB || [])];
    await Promise.all(rows.map((r) => base44.entities.SocialFriendship.delete(r.id)));
  } catch (e) { console.warn('[Social] removeFriend DB cleanup failed', e); }
};

// ─── PARTY ───────────────────────────────────────────────
export const partyStore = makeStore('game_party_v1', { members: [], partyId: null, leaderId: null });
export const PARTY_MAX = _PARTY_MAX;

// Party invite — delegates to partyInvite.js
export const sendPartyRequest = _sendPartyInvite;

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

// Trade request — delegates to tradeRequest.js
export const sendTradeRequest = _sendTradeRequest;

// Duel challenge — delegates to duelChallenge.js
export const sendDuelRequest = _sendDuelChallenge;

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