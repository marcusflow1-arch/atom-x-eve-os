import { useSyncExternalStore } from 'react';

let state = { dashboardMode: false, matchId: '' };
const listeners = new Set();

const emit = () => listeners.forEach((listener) => listener());

export const aiBattleSurfaceState = {
  getSnapshot: () => state,
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export function setAIBattleDashboardMode(active, matchId = '') {
  const next = { dashboardMode: Boolean(active), matchId: String(matchId || '') };
  if (next.dashboardMode === state.dashboardMode && next.matchId === state.matchId) return;
  state = next;
  emit();
}

export function useAIBattleSurfaceState() {
  return useSyncExternalStore(
    aiBattleSurfaceState.subscribe,
    aiBattleSurfaceState.getSnapshot,
    () => ({ dashboardMode: false, matchId: '' }),
  );
}

export function showAIBattleOnDashboard(matchId = '') {
  setAIBattleDashboardMode(true, matchId);
}

export function rejoinAIBattleArena(matchId = '') {
  setAIBattleDashboardMode(false, matchId);
}
