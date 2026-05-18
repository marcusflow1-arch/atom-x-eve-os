// ─── Rested XP Store ──────────────────────────────────────────────────────
// Tracks how long the player was logged off and converts that idle time into
// a pool of "rested XP". When the player earns XP while rested, they get a
// 2× bonus — the extra XP comes out of the rested pool and rolls over across
// level-ups (any pool left over stays available for the next level).
//
// Earn rate:  +0.1% of the player's current xpForNext per minute logged off.
//             Capped at 100% of xpForNext (one full level of rested).
// ─────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'wwm_rested_xp_v1';
const PCT_PER_MIN = 0.1;          // 0.1% of xpForNext per minute offline
const MAX_PCT = 100;              // capped at 100% of one level
const HEARTBEAT_MS = 30 * 1000;   // touch lastSeenAt every 30s while online

const load = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      return {
        restedPct: Math.max(0, Math.min(MAX_PCT, p.restedPct || 0)),
        lastSeenAt: p.lastSeenAt || Date.now(),
      };
    }
  } catch {}
  return { restedPct: 0, lastSeenAt: Date.now() };
};

let state = load();
const listeners = new Set();

const persist = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
};
const emit = () => {
  persist();
  listeners.forEach((fn) => fn(state));
};

// Convert offline time → rested pct. Call once on login.
export function accrueRestedFromOfflineTime() {
  const now = Date.now();
  const offlineMs = Math.max(0, now - (state.lastSeenAt || now));
  const offlineMin = offlineMs / 60000;
  const gained = offlineMin * PCT_PER_MIN;
  state = {
    restedPct: Math.min(MAX_PCT, state.restedPct + gained),
    lastSeenAt: now,
  };
  emit();
}

// Touch heartbeat — call periodically while online so logout time is fresh.
export function touchLastSeen() {
  state = { ...state, lastSeenAt: Date.now() };
  persist(); // don't emit — UI doesn't need to react to heartbeats
}

// Read pool (0..100).
export function getRestedPct() {
  return state.restedPct;
}

// Consume rested XP when player gains XP. Returns the bonus XP awarded.
// xpGained = base xp the player just earned
// xpForNext = current xpForNext (used to convert pct → absolute xp)
// Each unit of xpGained pulls an equal unit of bonus from the pool (2×).
export function consumeRestedForGain(xpGained, xpForNext) {
  if (xpGained <= 0 || xpForNext <= 0 || state.restedPct <= 0) return 0;
  // Available bonus XP in this level's units
  const availableXP = (state.restedPct / 100) * xpForNext;
  const bonus = Math.min(availableXP, xpGained);
  const consumedPct = (bonus / xpForNext) * 100;
  state = {
    ...state,
    restedPct: Math.max(0, state.restedPct - consumedPct),
  };
  emit();
  return bonus;
}

export function subscribeRestedXP(fn) {
  listeners.add(fn);
  fn(state);
  return () => listeners.delete(fn);
}

// Auto-heartbeat — keeps lastSeenAt fresh while the tab is open.
if (typeof window !== 'undefined') {
  setInterval(touchLastSeen, HEARTBEAT_MS);
  window.addEventListener('beforeunload', touchLastSeen);
}