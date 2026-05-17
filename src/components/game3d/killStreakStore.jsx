// ─── Kill Streak Multiplier Store ─────────────────────────────────────────
// Tracks the player's CURRENT consecutive kill streak (resets on death) and
// produces an XP multiplier per the design table:
//
//   Kill 1  → 1.0×   (base, first kill no bonus)
//   Kill 2  → 1.2×
//   Kill 3  → 1.4×
//   Kill 4  → 1.8×
//   Kill 5  → 2.0×
//   Kill 6  → 2.5×
//   Kill 7  → 3.5×
//   Kill 8  → 3.9×   (continues +0.4)
//   Kill 9  → 4.3×
//   Kill 10 → 4.7×
//   Kill 11+ → previous + 0.4 per kill (no cap)
//
// Streak resets to 0 on player death.

const TABLE = {
  1: 1.0,
  2: 1.2,
  3: 1.4,
  4: 1.8,
  5: 2.0,
  6: 2.5,
  7: 3.5,
};

const POST_TABLE_STEP = 0.4;
const POST_TABLE_START_KILL = 8;
const POST_TABLE_START_VALUE = TABLE[7] + POST_TABLE_STEP; // 3.9

let streak = 0;
const listeners = new Set();

// Reset the streak whenever the player dies (HP hits 0). Lazy-import to
// avoid any circular dependency with playerHUDStore.
let _deathHooked = false;
function hookDeathReset() {
  if (_deathHooked) return;
  _deathHooked = true;
  import('./playerHUDStore').then(({ subscribePlayerHUD }) => {
    let wasAlive = true;
    subscribePlayerHUD((hud) => {
      const aliveNow = (hud?.hp ?? 1) > 0;
      if (wasAlive && !aliveNow) resetStreak();
      wasAlive = aliveNow;
    });
  }).catch(() => {});
}
hookDeathReset();

function emit() {
  const snap = getKillStreakState();
  listeners.forEach((fn) => fn(snap));
}

export function getMultiplierForKill(kill) {
  if (kill <= 0) return 1.0;
  if (TABLE[kill] !== undefined) return TABLE[kill];
  // Kill 8+: 3.9 + (kill - 8) * 0.4
  return POST_TABLE_START_VALUE + (kill - POST_TABLE_START_KILL) * POST_TABLE_STEP;
}

export function getStreak() {
  return streak;
}

export function getCurrentMultiplier() {
  return getMultiplierForKill(streak);
}

// Returns the multiplier APPLIED to this kill (the new streak count).
export function registerKill() {
  streak += 1;
  emit();
  return getMultiplierForKill(streak);
}

export function resetStreak() {
  if (streak === 0) return;
  streak = 0;
  emit();
}

export function getKillStreakState() {
  return {
    streak,
    multiplier: getMultiplierForKill(streak),
    nextMultiplier: getMultiplierForKill(streak + 1),
  };
}

export function subscribeKillStreak(fn) {
  listeners.add(fn);
  fn(getKillStreakState());
  return () => listeners.delete(fn);
}