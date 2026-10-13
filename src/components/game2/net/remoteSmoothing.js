// Opt-in remote fighter position reconciliation for Game 2.
// Pure math, independent of rendering, saber hits, Force rules, and the relay.
export const REMOTE_SMOOTHING_DEFAULTS = Object.freeze({
  teleportDistance: 10, // preserve obvious respawns and genuine long-distance teleports
  followRate: 18,       // exponential catch-up per second
  maxCorrectionSpeed: 35, // prevent abrupt >1.5-unit jumps from a late snapshot
});

export function reconcileRemotePosition(current, target, dt, options = {}) {
  const distance = Math.hypot(
    target[0] - current[0], target[1] - current[1], target[2] - current[2],
  );
  if (!Number.isFinite(distance)) return { pos: current.slice(), error: 0, hardSnap: false };
  const config = { ...REMOTE_SMOOTHING_DEFAULTS, ...options };
  if (config.forceSnap || distance >= config.teleportDistance) {
    return { pos: target.slice(), error: distance, hardSnap: true };
  }
  const seconds = Math.max(0, Math.min(0.1, Number.isFinite(dt) ? dt : 0));
  const follow = 1 - Math.exp(-config.followRate * seconds);
  const step = Math.min(distance, distance * follow, config.maxCorrectionSpeed * seconds);
  const fraction = distance ? step / distance : 0;
  return {
    pos: current.map((value, i) => value + (target[i] - value) * fraction),
    error: distance,
    hardSnap: false,
  };
}
