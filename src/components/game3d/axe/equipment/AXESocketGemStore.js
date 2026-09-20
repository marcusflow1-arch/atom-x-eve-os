// AXE Prompt 022 — socket/gem persistence adapter.

import {
  resolveDrill,
  insertAXEGem,
  removeAXEGem,
  replaceAXEGem,
  collectAXEGemStats,
} from './AXESocketGemSystem';

const STORAGE_KEY = 'axe_socket_gems_v1';
const load = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
};

let state = load();
const listeners = new Set();

const save = () => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  listeners.forEach((fn) => fn({ ...state }));
};

export function subscribeAXESockets(fn) {
  listeners.add(fn);
  fn({ ...state });
  return () => listeners.delete(fn);
}

export function getAXESocketState(itemId) {
  return state[itemId] || { maxSockets: 4, sockets: [] };
}

export function drillAXESocket(itemId, item, options = {}) {
  const current = getAXESocketState(itemId);
  const result = resolveDrill({ ...item, ...current }, options);
  if (result.ok) {
    state = { ...state, [itemId]: { ...current, maxSockets: current.maxSockets || 4, sockets: result.sockets } };
    save();
  }
  return result;
}

export function insertGemIntoAXEItem(itemId, item, socketIndex, gemId) {
  const current = getAXESocketState(itemId);
  const result = insertAXEGem({ ...item, ...current }, socketIndex, gemId);
  if (result.ok) {
    state = { ...state, [itemId]: { ...current, sockets: result.sockets } };
    save();
  }
  return result;
}

export function removeGemFromAXEItem(itemId, item, socketIndex, options = {}) {
  const current = getAXESocketState(itemId);
  const result = removeAXEGem({ ...item, ...current }, socketIndex, options);
  if (result.ok) {
    state = { ...state, [itemId]: { ...current, sockets: result.sockets } };
    save();
  }
  return result;
}

export function replaceGemInAXEItem(itemId, item, socketIndex, gemId, options = {}) {
  const current = getAXESocketState(itemId);
  const result = replaceAXEGem({ ...item, ...current }, socketIndex, gemId, options);
  if (result.ok) {
    state = { ...state, [itemId]: { ...current, sockets: result.sockets } };
    save();
  }
  return result;
}

export function getAXEGemStats(itemId, item) {
  const current = getAXESocketState(itemId);
  return collectAXEGemStats({ ...item, ...current });
}
