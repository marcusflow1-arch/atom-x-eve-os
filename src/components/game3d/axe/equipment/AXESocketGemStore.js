// AXE Prompt 022 — socket/gem persistence adapter.
// Character-scoped and reactive so sockets are real per-character item state.

import { characterScopedStorage, subscribeCharacterChange } from '../../characterStorage';
import {
  resolveDrill,
  insertAXEGem,
  removeAXEGem,
  replaceAXEGem,
  collectAXEGemStats,
} from './AXESocketGemSystem';

const storage = characterScopedStorage('axe_socket_gems_v2');

const load = () => {
  try {
    const raw = storage.get();
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
};

let state = load();
const listeners = new Set();

const snapshot = () => ({ ...state });

const emit = () => {
  storage.set(JSON.stringify(state));
  const snap = snapshot();
  listeners.forEach((fn) => fn(snap));
};

subscribeCharacterChange(() => {
  state = load();
  const snap = snapshot();
  listeners.forEach((fn) => fn(snap));
});

export function subscribeAXESockets(fn) {
  listeners.add(fn);
  fn(snapshot());
  return () => listeners.delete(fn);
}

export function getAXESocketState(itemId) {
  return state[itemId] || { maxSockets: 4, sockets: [] };
}

export function drillAXESocket(itemId, item, options = {}) {
  const current = getAXESocketState(itemId);
  const result = resolveDrill({ ...item, ...current }, options);
  if (result.ok) {
    state = {
      ...state,
      [itemId]: {
        ...current,
        maxSockets: current.maxSockets || item?.maxSockets || 4,
        sockets: result.sockets,
      },
    };
    emit();
  }
  return result;
}

export function insertGemIntoAXEItem(itemId, item, socketIndex, gemId) {
  const current = getAXESocketState(itemId);
  const result = insertAXEGem({ ...item, ...current }, socketIndex, gemId);
  if (result.ok) {
    state = { ...state, [itemId]: { ...current, sockets: result.sockets } };
    emit();
  }
  return result;
}

export function removeGemFromAXEItem(itemId, item, socketIndex, options = {}) {
  const current = getAXESocketState(itemId);
  const result = removeAXEGem({ ...item, ...current }, socketIndex, options);
  if (result.ok) {
    state = { ...state, [itemId]: { ...current, sockets: result.sockets } };
    emit();
  }
  return result;
}

export function replaceGemInAXEItem(itemId, item, socketIndex, gemId, options = {}) {
  const current = getAXESocketState(itemId);
  const result = replaceAXEGem({ ...item, ...current }, socketIndex, gemId, options);
  if (result.ok) {
    state = { ...state, [itemId]: { ...current, sockets: result.sockets } };
    emit();
  }
  return result;
}

export function getAXEGemStats(itemId, item) {
  const current = getAXESocketState(itemId);
  return collectAXEGemStats({ ...item, ...current });
}


export function purgeAXESocketState(itemId) {
  if (!itemId || !state[itemId]) return false;
  const next = { ...state };
  delete next[itemId];
  state = next;
  emit();
  return true;
}

if (typeof window !== 'undefined' && !window.__axeSocketLifecycleHook) {
  window.__axeSocketLifecycleHook = true;
  window.addEventListener('axeEquipmentItemRemoved', (event) => {
    purgeAXESocketState(event?.detail?.instanceId);
  });
}
