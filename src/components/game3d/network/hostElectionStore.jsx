// Host election — picks ONE authoritative player per channel to broadcast
// enemy/boss state. Deterministic: lowest player_id (alphabetical) among all
// players currently connected wins. Re-elects automatically when players
// join or leave.
//
// Subscribes to the existing `multiplayerPlayersUpdate` event that
// MultiplayerSystem already dispatches — no new presence layer needed.
//
// Usage:
//   import { subscribeHost, isHost } from './hostElectionStore';
//   subscribeHost((state) => { ... });
//   if (isHost()) { /* run authoritative work */ }

let state = {
  myId: null,         // this client's player_id (set via setMyId)
  hostId: null,       // the elected host's player_id (may be myId)
  isHost: false,      // convenience flag
  candidateIds: [],   // sorted list of all candidate ids (incl. me)
};

const listeners = new Set();
const emit = () => {
  for (const fn of listeners) {
    try { fn(state); } catch (e) { console.error('[host] listener', e); }
  }
};

// Identity is set once we know who the local user is. Until then,
// election can't happen because we can't tell whether we ARE the host.
export const setMyId = (id) => {
  if (!id || state.myId === id) return;
  state = { ...state, myId: id };
  reelect();
};

// Re-run the election from the current candidate list.
const reelect = () => {
  if (!state.myId) return;
  const candidates = Array.from(new Set([state.myId, ...state.candidateIds]))
    .filter(Boolean)
    .sort();
  const hostId = candidates[0] || state.myId;
  const isHost = hostId === state.myId;
  if (hostId !== state.hostId || isHost !== state.isHost) {
    state = { ...state, hostId, isHost, candidateIds: candidates };
    emit();
  } else {
    state = { ...state, candidateIds: candidates };
  }
};

// Drive the candidate list from the existing multiplayer presence event.
// players = [{ player_id, ... }, ...] — does NOT include myself.
if (typeof window !== 'undefined') {
  window.addEventListener('multiplayerPlayersUpdate', (e) => {
    const players = e.detail?.players || [];
    const ids = players.map((p) => p.player_id).filter(Boolean);
    state = { ...state, candidateIds: ids };
    reelect();
  });
}

export const isHost = () => state.isHost;
export const getHostState = () => state;
export const subscribeHost = (fn) => {
  listeners.add(fn);
  fn(state);
  return () => listeners.delete(fn);
};