// Shared presentation-only network correction for Game 3D and Luna AI Battle.
// Matches Game 2's proven bounded smoothing; never changes authoritative game state.
export const NETWORK_POSITION_DEFAULTS = Object.freeze({
  teleportDistance: 10,
  followRate: 18,
  maxCorrectionSpeed: 35,
});

export function reconcileNetworkPosition(current, target, dt, options = {}) {
  const distance = Math.hypot(
    target[0] - current[0], target[1] - current[1], target[2] - current[2],
  );
  if (!Number.isFinite(distance)) return { pos: current.slice(), error: 0, hardSnap: false };
  const config = { ...NETWORK_POSITION_DEFAULTS, ...options };
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
