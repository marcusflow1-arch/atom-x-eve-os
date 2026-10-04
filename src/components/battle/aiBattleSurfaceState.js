import { useSyncExternalStore } from 'react';

const EMPTY_STATE = { dashboardMode: false, matchId: '', participantIds: [] };
let state = EMPTY_STATE;
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
  const next = { ...state, dashboardMode: Boolean(active), matchId: String(matchId || '') };
  if (next.dashboardMode === state.dashboardMode && next.matchId === state.matchId) return;
  state = next;
  emit();
}

export function setAIBattleParticipants(ids = []) {
  const participantIds = [...new Set((ids || []).map(String).filter(Boolean))];
  if (participantIds.length === state.participantIds.length && participantIds.every((id, index) => id === state.participantIds[index])) return;
  state = { ...state, participantIds };
  emit();
}

export function useAIBattleSurfaceState() {
  return useSyncExternalStore(
    aiBattleSurfaceState.subscribe,
    aiBattleSurfaceState.getSnapshot,
    () => EMPTY_STATE,
  );
}

export function showAIBattleOnDashboard(matchId = '') {
  setAIBattleDashboardMode(true, matchId);
}

export function rejoinAIBattleArena(matchId = '') {
  setAIBattleDashboardMode(false, matchId);
}
