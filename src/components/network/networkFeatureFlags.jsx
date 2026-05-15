// Slice B — feature flags for the realtime network migration.
// All flags default OFF so existing systems remain authoritative until explicitly enabled.
// Persisted to localStorage so refreshes preserve the testing state.

const STORAGE_KEY = 'atomxe_network_flags_v1';

const DEFAULTS = {
  // Slice B
  enableNetworkBridge: false,       // master switch: connect realtimeNetwork in GameWorld3D
  bridgeSendsInputs: true,          // when bridge is on, forward local movement deltas to server
  bridgeOverridesLocalPos: false,   // when bridge is on, drive playerPositionStore from predicted state
  bridgeLogging: false,             // verbose console logs from the bridge

  // Slice C — remote player pipeline
  enableNetworkRemotes: false,      // master switch: render remote players from realtimeNetwork
  disableLegacyRemotes: false,      // DANGER: hides the existing WebRTC RemotePlayersManager visuals
  networkRemoteDebug: false,        // overlays IDs, snapshot age, RTT on each remote

  // Reserved for future slices
  enableServerCombat: false,
  enableServerNPCs: false,
};

function loadFlags() {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULTS, ...parsed };
  } catch {
    return { ...DEFAULTS };
  }
}

let flags = loadFlags();
const listeners = new Set();

function persist() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(flags)); } catch {}
}

export function getNetworkFlags() {
  return flags;
}

export function getNetworkFlag(key) {
  return flags[key];
}

export function setNetworkFlag(key, value) {
  if (!(key in DEFAULTS)) {
    console.warn('[networkFlags] unknown flag:', key);
    return;
  }
  flags = { ...flags, [key]: value };
  persist();
  listeners.forEach((fn) => { try { fn(flags); } catch (e) { console.error(e); } });
}

export function resetNetworkFlags() {
  flags = { ...DEFAULTS };
  persist();
  listeners.forEach((fn) => { try { fn(flags); } catch {} });
}

export function subscribeNetworkFlags(fn) {
  listeners.add(fn);
  fn(flags);
  return () => listeners.delete(fn);
}

export const NETWORK_FLAG_KEYS = Object.keys(DEFAULTS);