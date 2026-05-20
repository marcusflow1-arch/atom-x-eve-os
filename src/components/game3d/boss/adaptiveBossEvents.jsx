export function dispatchAdaptiveBossAction(bossId, type, payload = {}) {
  window.dispatchEvent(new CustomEvent('bossAction', {
    detail: { type, bossId, payload },
  }));
}

export function emitAdaptiveAction(bossEntity, action, target, adaptive) {
  const bossId = bossEntity.id;
  const bossPos = bossEntity.group.position;
  const damage = adaptive.scaling.damage;
  const phase = adaptive.phase;

  if (action === 'tracking_aoe') {
    dispatchAdaptiveBossAction(bossId, 'tracking_aoe', {
      radius: 5,
      damage: damage * (phase >= 3 ? 2.4 : 2),
      followTime: phase >= 3 ? 2.0 : 2.5,
      explodeDelay: phase >= 4 ? 0.7 : 1.0,
    });
    return true;
  }

  if (action === 'teleport') {
    dispatchAdaptiveBossAction(bossId, 'teleport_behind_player', {
      damage: damage * (phase >= 4 ? 2.4 : 1.8),
      delay: 0.5,
      radius: 3.2,
    });
    return true;
  }

  if (action === 'sky_dive') {
    dispatchAdaptiveBossAction(bossId, 'sky_dive_attack', {
      damage: damage * 3,
      radius: 8,
      chargeTime: phase >= 4 ? 1.0 : 1.5,
    });
    return true;
  }

  if (action === 'slam' || action === 'combo') {
    const yaw = Math.atan2(target.x - bossPos.x, target.z - bossPos.z);
    dispatchAdaptiveBossAction(bossId, 'boss_telegraph', {
      kind: 'cone',
      x: bossPos.x,
      z: bossPos.z,
      yaw,
      angleDeg: action === 'combo' ? 90 : 70,
      range: action === 'combo' ? 7 : 6,
      duration: 0.75,
    });
    dispatchAdaptiveBossAction(bossId, 'delayed_cone_damage', {
      x: bossPos.x,
      z: bossPos.z,
      yaw,
      angleDeg: action === 'combo' ? 90 : 70,
      range: action === 'combo' ? 7 : 6,
      damage: damage * (action === 'combo' ? 1.6 : 1.25),
      delay: 0.75,
    });
    return true;
  }

  if (action === 'dash_attack') {
    dispatchAdaptiveBossAction(bossId, 'boss_dash', {
      fromX: bossPos.x,
      fromZ: bossPos.z,
      toX: target.x,
      toZ: target.z,
    });
    dispatchAdaptiveBossAction(bossId, 'aoe_damage', {
      x: target.x,
      z: target.z,
      radius: 2.5,
      damage: damage * 1.4,
      knockback: 4,
    });
    return true;
  }

  return false;
}