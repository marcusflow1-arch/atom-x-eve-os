// AXE Vanity Store — four custom overlay pieces + Silver/Gold Card activation.

import { characterScopedStorage, subscribeCharacterChange } from '../../characterStorage';
import {
  AXE_VANITY_ACTIVATION_PERCENT,
  AXE_VANITY_CARD_TYPES,
  AXE_VANITY_PIECES,
  AXE_VANITY_SLOTS,
  collectAXEVanityActivationProfile,
  collectAXEVanityBaseBonuses,
  getAXEVanityAppearanceLayers,
  getAXEVanityCard,
  getAXEVanityPiece,
} from './AXEVanitySystem';

const storage = characterScopedStorage('axe_vanity_custom_pieces_v1');

const starter = () => ({
  ownedPieceIds: [
    'axe_vanity_wanderer_head',
    'axe_vanity_wanderer_torso',
    'axe_vanity_wanderer_pelvis',
    'axe_vanity_wanderer_leggings',
  ],
  equippedBySlot: {
    head: 'axe_vanity_wanderer_head',
    torso: 'axe_vanity_wanderer_torso',
    pelvis: 'axe_vanity_wanderer_pelvis',
    leggings: 'axe_vanity_wanderer_leggings',
  },
  activationByPieceId: {},
  cards: {
    silver: 4,
    gold: 2,
  },
  hidden: false,
});

const load = () => {
  try {
    const raw = storage.get();
    if (!raw) return starter();
    const parsed = JSON.parse(raw);
    const ownedPieceIds = Array.isArray(parsed.ownedPieceIds)
      ? [...new Set(parsed.ownedPieceIds.filter((id) => !!AXE_VANITY_PIECES[id]))]
      : starter().ownedPieceIds;
    // An explicitly empty slot map means the player unequipped every piece.
    // Only old saves with no slot map inherit the starter equipment.
    const equippedBySlot = Object.fromEntries(Object.entries(parsed.equippedBySlot ?? starter().equippedBySlot)
      .filter(([slot, id]) => ownedPieceIds.includes(id) && getAXEVanityPiece(id)?.slot === slot));
    const activationByPieceId = Object.fromEntries(Object.entries(parsed.activationByPieceId || {})
      .filter(([id, activation]) => ownedPieceIds.includes(id) && activation?.active && getAXEVanityCard(activation.cardType))
      .map(([id, activation]) => [id, { ...activation, percent: AXE_VANITY_ACTIVATION_PERCENT }]));
    return {
      ...starter(),
      ...parsed,
      ownedPieceIds,
      equippedBySlot,
      activationByPieceId,
      cards: { ...starter().cards, ...(parsed.cards || {}) },
      hidden: !!parsed.hidden,
    };
  } catch {
    return starter();
  }
};

let state = load();
let committedState = structuredClone(state);
const saveFailure = () => ({ ok: false, reason: 'SAVE_FAILED',
  message: 'Could not save your changes. Nothing was spent. Check browser storage and try again.' });
const listeners = new Set();

const emit = () => {
  let saved = false;
  try { saved = storage.setChecked(JSON.stringify(state)); } catch { /* retain the last committed state */ }
  if (!saved) {
    state = structuredClone(committedState);
    return false;
  }
  committedState = structuredClone(state);
  const snapshot = getAXEVanityState();
  listeners.forEach((fn) => fn(snapshot));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('axeVanityChanged', {
      detail: {
        hidden: state.hidden,
        appearanceLayers: state.hidden ? [] : getAXEVanityAppearanceLayers(state.equippedBySlot),
        activationProfile: collectAXEVanityActivationProfile(
          state.equippedBySlot,
          state.activationByPieceId,
        ),
      },
    }));
  }
  return true;
};

subscribeCharacterChange(() => {
  state = load();
  committedState = structuredClone(state);
  listeners.forEach((fn) => fn(getAXEVanityState()));
});

export function getAXEVanityState() {
  const baseBonuses = collectAXEVanityBaseBonuses(state.equippedBySlot);
  const activationProfile = collectAXEVanityActivationProfile(
    state.equippedBySlot,
    state.activationByPieceId,
  );
  return {
    ...state,
    ownedPieceIds: [...state.ownedPieceIds],
    equippedBySlot: { ...state.equippedBySlot },
    activationByPieceId: structuredClone(state.activationByPieceId),
    cards: { ...state.cards },
    baseBonuses,
    activationProfile,
    appearanceLayers: state.hidden ? [] : getAXEVanityAppearanceLayers(state.equippedBySlot),
  };
}

export function subscribeAXEVanity(fn) {
  listeners.add(fn);
  fn(getAXEVanityState());
  return () => listeners.delete(fn);
}

export function getEquippedAXEVanityBaseBonuses() {
  return collectAXEVanityBaseBonuses(state.equippedBySlot);
}

export function getEquippedAXEVanityActivationProfile() {
  return collectAXEVanityActivationProfile(
    state.equippedBySlot,
    state.activationByPieceId,
  );
}

export function equipAXEVanityPiece(pieceId) {
  const piece = getAXEVanityPiece(pieceId);
  if (!piece) return { ok: false, reason: 'VANITY_PIECE_MISSING' };
  if (!state.ownedPieceIds.includes(pieceId)) return { ok: false, reason: 'NOT_OWNED' };
  if (!AXE_VANITY_SLOTS[piece.slot]) return { ok: false, reason: 'INVALID_VANITY_SLOT' };

  state = {
    ...state,
    equippedBySlot: {
      ...state.equippedBySlot,
      [piece.slot]: pieceId,
    },
  };
  if (!emit()) return saveFailure();
  return { ok: true, pieceId, slotId: piece.slot, message: `${piece.name} equipped.` };
}

export function unequipAXEVanitySlot(slotId) {
  if (!AXE_VANITY_SLOTS[slotId]) return { ok: false, reason: 'INVALID_VANITY_SLOT' };
  const next = { ...state.equippedBySlot };
  delete next[slotId];
  state = { ...state, equippedBySlot: next };
  if (!emit()) return saveFailure();
  return { ok: true, message: `${AXE_VANITY_SLOTS[slotId].label} removed.` };
}

export function activateAXEVanityPiece(pieceId, cardType = 'silver') {
  const piece = getAXEVanityPiece(pieceId);
  if (!piece) return { ok: false, reason: 'VANITY_PIECE_MISSING' };
  if (!state.ownedPieceIds.includes(pieceId)) return { ok: false, reason: 'NOT_OWNED' };
  if (state.activationByPieceId[pieceId]?.active) {
    return { ok: false, reason: 'ALREADY_ACTIVATED' };
  }

  const card = getAXEVanityCard(cardType);
  if (!card) return { ok: false, reason: 'VANITY_CARD_INVALID' };
  if (Number(state.cards[cardType] || 0) < 1) {
    return { ok: false, reason: 'VANITY_CARD_REQUIRED', cardType };
  }

  state = {
    ...state,
    cards: {
      ...state.cards,
      [cardType]: Number(state.cards[cardType] || 0) - 1,
    },
    activationByPieceId: {
      ...state.activationByPieceId,
      [pieceId]: {
        active: true,
        percent: AXE_VANITY_ACTIVATION_PERCENT,
        cardType,
        activatedAt: Date.now(),
      },
    },
  };
  if (!emit()) return saveFailure();
  return {
    ok: true,
    pieceId,
    slotId: piece.slot,
    cardType,
    percent: AXE_VANITY_ACTIVATION_PERCENT,
  };
}

export function grantAXEVanityCard(cardType, count = 1) {
  if (!AXE_VANITY_CARD_TYPES[cardType]) return { ok: false, reason: 'VANITY_CARD_INVALID' };
  const n = Math.max(1, Math.floor(Number(count) || 1));
  state = {
    ...state,
    cards: {
      ...state.cards,
      [cardType]: Number(state.cards[cardType] || 0) + n,
    },
  };
  if (!emit()) return saveFailure();
  return { ok: true, cardType, count: n };
}

export function grantAXEVanityPiece(pieceId) {
  if (!getAXEVanityPiece(pieceId)) return { ok: false, reason: 'VANITY_PIECE_MISSING' };
  state = {
    ...state,
    ownedPieceIds: [...new Set([...state.ownedPieceIds, pieceId])],
  };
  if (!emit()) return saveFailure();
  return { ok: true };
}

export function setAXEVanityHidden(hidden) {
  state = { ...state, hidden: !!hidden };
  if (!emit()) return saveFailure();
  return { ok: true, message: hidden ? 'Vanity hidden.' : 'Vanity shown.' };
}
