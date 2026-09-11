// BossSkillController — world-boss ability cooldown/cast controller.
// Every dispatch is gated by the real live boss. Pending casts are cancelled
// as soon as that boss dies, and summon-legion is disabled for the current
// one-on-one Ironmaw encounter.

export const BOSS_ABILITIES = Object.freeze({
  METEOR_RAIN: {
    id: 'meteor_rain', label: 'Meteor Rain', cooldown: 45, castTime: 2.0,
    radius: 4.5, damage: 32, minDistance: 0, preferDistance: 6, state: 'AERIAL_CAST',
  },
  SHADOW_CHARGE: {
    id: 'shadow_charge', label: 'Shadow Charge', cooldown: 18, castTime: 0.4,
    range: 18, damage: 22, knockback: 4, minDistance: 7, state: 'ENGAGING',
  },
  SUMMON_LEGION: {
    id: 'summon_legion', label: 'Summon Legion', cooldown: 60, castTime: 2.4,
    count: 4, state: 'SUMMONING', disabledForDuel: true,
  },
  WORLD_BREAKER: {
    id: 'world_breaker', label: 'World Breaker', cooldown: 30, castTime: 1.8,
    angleDeg: 70, range: 9, damage: 45, minDistance: 0, preferDistance: 5, state: 'MELEE_COMBAT',
  },
  CHAOS_ORBS: {
    id: 'chaos_orbs', label: 'Chaos Orbs', cooldown: 20, castTime: 0.6,
    orbCount: 3, damage: 18, minDistance: 4, state: 'RANGED_COMBAT',
  },
});

function getLiveBossById(bossId) {
  if (typeof window === 'undefined' || !Array.isArray(window.__gw3dBosses)) return null;
  return window.__gw3dBosses.find((boss) =>
    boss?.id === bossId &&
    boss?.group &&
    boss.alive !== false &&
    !boss.dying &&
    !boss.defeated &&
    Number(boss.hp) > 0 &&
    boss.group.visible !== false
  ) || null;
}

export function createSkillController(bossId) {
  const cooldowns = {};
  Object.values(BOSS_ABILITIES).forEach((a) => { cooldowns[a.id] = a.cooldown * 0.3; });
  let casting = null;
  let lastUsedId = null;

  function bossAlive() {
    return !!getLiveBossById(bossId);
  }

  function cancelCast() {
    casting = null;
  }

  function dispatch(type, payload) {
    if (!bossAlive()) return false;
    window.dispatchEvent(new CustomEvent('bossAction', {
      detail: { type, bossId, payload },
    }));
    return true;
  }

  function startCast(ability, payload) {
    if (!bossAlive() || ability?.disabledForDuel) return false;
    casting = { ability, t: 0, payload };
    if (ability.id === 'meteor_rain' && payload.impacts) {
      payload.impacts.forEach((pt) => dispatch('boss_telegraph', {
        kind: 'circle', x: pt.x, z: pt.z, radius: ability.radius, duration: ability.castTime,
      }));
    } else if (ability.id === 'world_breaker') {
      dispatch('boss_telegraph', {
        kind: 'cone', x: payload.x, z: payload.z, yaw: payload.yaw,
        angleDeg: ability.angleDeg, range: ability.range, duration: ability.castTime,
      });
    }
    return true;
  }

  function resolveCast() {
    if (!casting || !bossAlive()) {
      cancelCast();
      return;
    }
    const { ability, payload } = casting;
    casting = null;
    cooldowns[ability.id] = ability.cooldown * (payload.cdMult || 1);
    lastUsedId = ability.id;

    if (ability.id === 'meteor_rain') {
      payload.impacts.forEach((pt) => dispatch('raid_aerial_strike', {
        x: pt.x, z: pt.z, radius: ability.radius + 0.7,
        tickDamage: Math.max(3, Math.round(ability.damage * 0.16)),
        duration: 4.5, knockback: 1,
      }));
    } else if (ability.id === 'shadow_charge') {
      dispatch('aoe_damage', {
        x: payload.targetX, z: payload.targetZ, radius: 2.5,
        damage: ability.damage, knockback: ability.knockback,
      });
      dispatch('boss_dash', {
        fromX: payload.fromX, fromZ: payload.fromZ,
        toX: payload.targetX, toZ: payload.targetZ,
      });
    } else if (ability.id === 'world_breaker') {
      dispatch('cone_damage', {
        x: payload.x, z: payload.z, yaw: payload.yaw,
        angleDeg: ability.angleDeg, range: ability.range,
        damage: ability.damage, interrupt: true,
      });
    } else if (ability.id === 'chaos_orbs') {
      payload.orbs.forEach((targetId) => dispatch('spawn_orb', {
        x: payload.x, z: payload.z, y: payload.y,
        targetPlayerId: targetId, damage: ability.damage, bossId,
      }));
    }
  }

  return {
    tick(dt) {
      if (!bossAlive()) {
        cancelCast();
        return;
      }
      for (const id in cooldowns) {
        if (cooldowns[id] > 0) cooldowns[id] = Math.max(0, cooldowns[id] - dt);
      }
      if (casting) {
        casting.t += dt;
        if (casting.t >= casting.ability.castTime) resolveCast();
      }
    },
    cancel: cancelCast,
    isCasting() { return !!casting; },
    currentCastId() { return casting?.ability?.id || null; },
    cooldownLeft(id) { return cooldowns[id] || 0; },
    tryCast(id, payload) {
      if (!bossAlive()) return false;
      const ab = Object.values(BOSS_ABILITIES).find((a) => a.id === id);
      if (!ab || ab.disabledForDuel || casting || cooldowns[id] > 0) return false;
      return startCast(ab, payload);
    },
    chooseAbility(ctx) {
      if (!bossAlive()) return null;
      const cdReady = (id) => cooldowns[id] <= 0;
      const notRepeat = (id) => id !== lastUsedId;

      // Current fight is strictly player vs Ironmaw: no summoned combatants.
      if (cdReady('meteor_rain') && ctx.targetDistance !== null && notRepeat('meteor_rain')) return 'meteor_rain';
      if (cdReady('world_breaker') && ctx.targetDistance !== null && ctx.targetDistance < 6 && notRepeat('world_breaker')) return 'world_breaker';
      if (cdReady('shadow_charge') && ctx.targetDistance !== null && ctx.targetDistance > 7) return 'shadow_charge';
      if (cdReady('chaos_orbs') && ctx.targetDistance !== null && ctx.targetDistance > 4) return 'chaos_orbs';
      return null;
    },
  };
}