import { useSyncExternalStore } from 'react';

const listeners = new Set();
let snapshot = { visible: false, encounterId: null };

const publish = (next) => {
  snapshot = { ...snapshot, ...next };
  listeners.forEach((fn) => fn());
};

export const arenaPresentation = {
  getSnapshot: () => snapshot,
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  setVisible(next) {
    publish({ visible: Boolean(next), encounterId: next ? snapshot.encounterId : null });
  },
  setEncounter(encounterId) {
    publish({ visible: Boolean(encounterId), encounterId: encounterId || null });
  },
  clear() {
    publish({ visible: false, encounterId: null });
  },
};

export const useArenaPresentation = () => useSyncExternalStore(
  arenaPresentation.subscribe,
  arenaPresentation.getSnapshot
);

export const openAIBattle = (encounterId) => {
  if (encounterId) arenaPresentation.setEncounter(encounterId);
  window.dispatchEvent(new CustomEvent('openAIBattle', { detail: { encounterId } }));
};
