import { useSyncExternalStore } from 'react';

const EMPTY = { mode: null };
let state = EMPTY;
const listeners = new Set();

const emit = () => listeners.forEach((listener) => listener());

export const aiBoxSocialModeStore = {
  getSnapshot: () => state,
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export function setAIBoxSocialMode(mode = null) {
  const nextMode = mode === 'online' || mode === 'friends' ? mode : null;
  if (state.mode === nextMode) return;
  state = { mode: nextMode };
  emit();
}

export function toggleAIBoxSocialMode(mode) {
  const nextMode = state.mode === mode ? null : mode;
  setAIBoxSocialMode(nextMode);
}

export function useAIBoxSocialMode() {
  return useSyncExternalStore(
    aiBoxSocialModeStore.subscribe,
    aiBoxSocialModeStore.getSnapshot,
    () => EMPTY,
  );
}
