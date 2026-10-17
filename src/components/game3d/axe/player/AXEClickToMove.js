// AXE click-to-move: an option the player switches on in Settings (Esc). WASD stays the default
// and is never changed: with the option off, nothing here moves the hero.
//
// With it on, a left click on walkable ground sets a move target. GameWorld3D feeds the steering
// direction into the same movement vector WASD fills, so the hero walks there with the same
// speed (Shift runs, Ctrl sprints), animation and collision. The move ends when the hero:
//   • reaches the target ('arrived'),
//   • presses any WASD key ('wasd'),
//   • meets unwalkable ground ahead ('unwalkable'),
//   • makes no headway for a few steps, e.g. pushed back by a body ('blocked'),
//   • runs past the timeout ('timeout'),
//   • or the option is switched off ('disabled').
// There is no navmesh in Game 3D, so the hero goes straight and stops at a blocked step.
//
// Pure logic, no three.js: positions are plain { x, z } objects (a THREE.Vector3 also works).
// Whether a click on an enemy also locks on and attacks is open (owner decision D9,
// docs/game3d/WUXIA_BLUEPRINT_GAP_MAP.md); until then a click on an enemy keeps the existing
// click attack and only a click on walkable ground moves.

export const AXE_CLICK_TO_MOVE_CONFIG = Object.freeze({
  arriveRadiusMeters: 0.3,
  timeoutSeconds: 15,
  lookAheadMeters: 0.6,       // the ground this far ahead on the line must be walkable
  blockedProgressRatio: 0.3,  // a step that gains less than this share of its length counts as blocked
  blockedStepsToStop: 8,      // consecutive blocked steps before the move stops
  movementKeys: Object.freeze(['w', 'a', 's', 'd']),
});

const planarDistance = (a, b) => Math.hypot((b.x || 0) - (a.x || 0), (b.z || 0) - (a.z || 0));

/**
 * The walk animation direction for a move, relative to the way the hero faces. Used while
 * locked on, when the hero keeps facing the target and the move can be a strafe.
 * `forward` is the facing on the ground plane; right is (-forward.z, forward.x), the same basis
 * as player/characterDodgeVector.js.
 */
export function directionRelativeToFacing(move, forward) {
  const along = move.x * forward.x + move.z * forward.z;
  const side = move.x * -forward.z + move.z * forward.x;
  if (Math.abs(along) >= Math.abs(side)) return along >= 0 ? 'forward' : 'backward';
  return side >= 0 ? 'right' : 'left';
}

/**
 * Decides what a left click does. 'move' only when the option is on and the click lands on
 * walkable ground nearer than any enemy, NPC or player under the cursor; otherwise 'default',
 * the existing click attack.
 *   entityDistance: ray distance to the nearest entity hit, or null
 *   groundDistance: ray distance to the ground hit, or null
 */
export function classifyAXEClick({ enabled, entityDistance = null, groundDistance = null, walkable = false }) {
  if (!enabled || groundDistance == null || !walkable) return 'default';
  if (entityDistance != null && entityDistance <= groundDistance) return 'default';
  return 'move';
}

/**
 * isEnabled(): the player's option, read live each call.
 * isWalkable(x, z): ground exists there and the hero may stand on it.
 * onChange(target | null, reason): the target was set or cleared (drives the ground marker).
 */
export function createAXEClickToMove({
  isEnabled = () => false,
  isWalkable = () => true,
  onChange = () => {},
  config = AXE_CLICK_TO_MOVE_CONFIG,
} = {}) {
  let target = null;
  let elapsed = 0;
  let blockedSteps = 0;
  let lastStopReason = null;
  const movementKeys = new Set(config.movementKeys);

  const stop = (reason) => {
    if (!target) return false;
    target = null;
    lastStopReason = reason;
    onChange(null, reason);
    return true;
  };

  return {
    /** Sets the move target. False (and nothing changes) when the option is off or the ground is unwalkable. */
    setTarget(point) {
      if (!isEnabled() || !point) return false;
      const x = Number(point.x);
      const z = Number(point.z);
      if (!Number.isFinite(x) || !Number.isFinite(z) || !isWalkable(x, z)) return false;
      target = { x, y: Number(point.y) || 0, z };
      elapsed = 0;
      blockedSteps = 0;
      lastStopReason = null;
      onChange({ ...target }, 'set');
      return true;
    },

    cancel(reason = 'cancelled') { return stop(reason); },

    /** A key went down: any WASD key cancels the move. */
    noteKey(key) {
      return movementKeys.has(String(key || '').toLowerCase()) ? stop('wasd') : false;
    },

    /**
     * Called each frame before movement. Returns the unit direction { x, z } to move this frame,
     * or null when there is no move (none set, or it just stopped).
     *   keyMoving: a WASD key is moving the hero this frame (cancels the move)
     */
    steer({ position, delta = 0, keyMoving = false }) {
      if (!target) return null;
      if (!isEnabled()) { stop('disabled'); return null; }
      if (keyMoving) { stop('wasd'); return null; }
      elapsed += Math.max(0, Number(delta) || 0);
      if (elapsed > config.timeoutSeconds) { stop('timeout'); return null; }
      const dx = target.x - position.x;
      const dz = target.z - position.z;
      const distance = Math.hypot(dx, dz);
      if (distance <= config.arriveRadiusMeters) { stop('arrived'); return null; }
      const x = dx / distance;
      const z = dz / distance;
      const ahead = Math.min(distance, config.lookAheadMeters);
      if (!isWalkable(position.x + x * ahead, position.z + z * ahead)) { stop('unwalkable'); return null; }
      return { x, z, distance };
    },

    /**
     * Called after movement and collision with where the hero was and is now, and how far
     * the step should have gone (0 when movement was locked, e.g. during an attack or a dodge).
     */
    noteStep({ from, to, expectedMeters = 0 }) {
      if (!target || !(expectedMeters > 1e-6)) return;
      const before = planarDistance(from, target);
      const after = planarDistance(to, target);
      // Stepped past the target: it now lies on the other side of the hero than before the step.
      const passed = (target.x - to.x) * (target.x - from.x) + (target.z - to.z) * (target.z - from.z) < 0;
      if (passed || after <= config.arriveRadiusMeters) {
        stop('arrived');
        return;
      }
      if (before - after < expectedMeters * config.blockedProgressRatio) {
        blockedSteps += 1;
        if (blockedSteps >= config.blockedStepsToStop) stop('blocked');
      } else {
        blockedSteps = 0;
      }
    },

    getTarget() { return target ? { ...target } : null; },
    isActive() { return !!target; },
    getLastStopReason() { return lastStopReason; },
  };
}
