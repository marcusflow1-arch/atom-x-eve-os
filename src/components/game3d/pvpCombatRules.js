// PvP targeting rules — single-target only.
// World units are treated as meters by the GameWorld3D character scale.

export const PVP_MELEE_RANGE = 3;
export const PVP_RANGED_RANGE = 7;

export function isRangedWeaponPath(path) {
  return String(path || '').toLowerCase() === 'ranged';
}

export function getPvpAttackRange(path) {
  return isRangedWeaponPath(path) ? PVP_RANGED_RANGE : PVP_MELEE_RANGE;
}

export function planarDistance(a, b) {
  if (!a || !b) return Infinity;
  const dx = Number(b.x || 0) - Number(a.x || 0);
  const dz = Number(b.z || 0) - Number(a.z || 0);
  return Math.sqrt((dx * dx) + (dz * dz));
}

export function validateLockedPvpTarget({
  attackerPosition,
  lockedTarget,
  activeDuel,
  weaponPath,
}) {
  if (!activeDuel?.opponentId) {
    return { ok: false, reason: 'not_in_pvp', range: getPvpAttackRange(weaponPath), distance: Infinity };
  }

  if (!lockedTarget || lockedTarget.kind !== 'player') {
    return { ok: false, reason: 'target_required', range: getPvpAttackRange(weaponPath), distance: Infinity };
  }

  if (lockedTarget.id !== activeDuel.opponentId) {
    return { ok: false, reason: 'wrong_target', range: getPvpAttackRange(weaponPath), distance: Infinity };
  }

  if (lockedTarget.aliveRef && !lockedTarget.aliveRef()) {
    return { ok: false, reason: 'target_unavailable', range: getPvpAttackRange(weaponPath), distance: Infinity };
  }

  const targetPosition = lockedTarget.group?.position || lockedTarget.position || null;
  const range = getPvpAttackRange(weaponPath);
  const distance = planarDistance(attackerPosition, targetPosition);

  if (!Number.isFinite(distance) || distance > range) {
    return { ok: false, reason: 'out_of_range', range, distance };
  }

  return {
    ok: true,
    reason: null,
    range,
    distance,
    targetId: lockedTarget.id,
    targetPosition,
  };
}

export function pvpFailureMessage(result, weaponPath) {
  if (!result || result.ok) return '';
  const range = result.range ?? getPvpAttackRange(weaponPath);

  switch (result.reason) {
    case 'target_required':
      return 'Lock onto your PvP target first.';
    case 'wrong_target':
      return 'You can only attack the player you are locked onto.';
    case 'target_unavailable':
      return 'That PvP target is no longer available.';
    case 'out_of_range':
      return isRangedWeaponPath(weaponPath)
        ? `Target is out of range. Ranged attacks require 7m or less.`
        : `Target is out of range. Melee attacks require 3m or less.`;
    default:
      return '';
  }
}
