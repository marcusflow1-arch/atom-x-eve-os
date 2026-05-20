// BossSkillController — owns the 5 boss abilities, their cooldowns, and the
// hybrid event-bus contract that GameWorld3D listens to for damage application.
//
// EVENT CONTRACT (window dispatched):
//   bossAction → { type, bossId, payload }
//     type='aoe_damage'     payload={ x,z,radius,damage,knockback,burnTicks? }
//     type='cone_damage'    payload={ x,z,yaw,angleDeg,range,damage,interrupt:true }
//     type='single_damage'  payload={ playerId|null, x,z, damage, stunMs? }
//     type='spawn_minion'   payload={ x,z,bossId,role:'melee'|'ranged'|'support' }
//     type='boss_telegraph' payload={ kind, x,z, radius?, range?, duration }
//
// GameWorld3D maps these to its existing setHP/spawn logic. The boss does
// NOT touch player state directly — that's the seam for future authoritative
// multiplayer.

export const BOSS_ABILITIES = Object.freeze({
  METEOR_RAIN: {
    id: 'meteor_rain', label: 'Meteor Rain',
    cooldown: 45, castTime: 2.0,
    radius: 4.5, damage: 32,
    minDistance: 0,  preferDistance: 6,
    state: 'AERIAL_CAST',
  },
  SHADOW_CHARGE: {
    id: 'shadow_charge', label: 'Shadow Charge',
    cooldown: 18, castTime: 0.4,
    range: 18, damage: 22, knockback: 4,
    minDistance: 7,
    state: 'ENGAGING',
  },
  SUMMON_LEGION: {
    id: 'summon_legion', label: 'Summon Legion',
    cooldown: 60, castTime: 2.4,
    count: 4, // 4 base; enraged adds more
    state: 'SUMMONING',
  },
  WORLD_BREAKER: {
    id: 'world_breaker', label: 'World Breaker',
    cooldown: 30, castTime: 1.8,
    angleDeg: 70, range: 9, damage: 45,
    minDistance: 0, preferDistance: 5,
    state: 'MELEE_COMBAT',
  },
  CHAOS_ORBS: {
    id: 'chaos_orbs', label: 'Chaos Orbs',
    cooldown: 20, castTime: 0.6,
    orbCount: 3, damage: 18,
    minDistance: 4,
    state: 'RANGED_COMBAT',
  },
});

export function createSkillController(bossId) {
  const cooldowns = {};   // ability id → seconds remaining
  Object.values(BOSS_ABILITIES).forEach((a) => { cooldowns[a.id] = a.cooldown * 0.3; });
  let casting = null;      // { ability, t, payload }
  let lastUsedId = null;   // to avoid immediate repeats

  function dispatch(type, payload) {
    window.dispatchEvent(new CustomEvent('bossAction', {
      detail: { type, bossId, payload },
    }));
  }

  function startCast(ability, payload) {
    casting = { ability, t: 0, payload };
    // Pre-cast telegraph (warning indicator)
    if (ability.id === 'meteor_rain' && payload.impacts) {
      payload.impacts.forEach((pt) => dispatch('boss_telegraph', {
        kind: 'circle', x: pt.x, z: pt.z, radius: ability.radius,
        duration: ability.castTime,
      }));
    } else if (ability.id === 'world_breaker') {
      dispatch('boss_telegraph', {
        kind: 'cone', x: payload.x, z: payload.z, yaw: payload.yaw,
        angleDeg: ability.angleDeg, range: ability.range, duration: ability.castTime,
      });
    }
  }

  function resolveCast() {
    const { ability, payload } = casting;
    casting = null;
    cooldowns[ability.id] = ability.cooldown * (payload.cdMult || 1);
    lastUsedId = ability.id;
    if (ability.id === 'meteor_rain') {
      payload.impacts.forEach((pt) => dispatch('raid_aerial_strike', {
        x: pt.x, z: pt.z, radius: ability.radius + 0.7,
        tickDamage: Math.max(3, Math.round(ability.damage * 0.16)),
        duration: 4.5,
        knockback: 1,
      }));
    } else if (ability.id === 'shadow_charge') {
      dispatch('aoe_damage', {
        x: payload.targetX, z: payload.targetZ, radius: 2.5,
        damage: ability.damage, knockback: ability.knockback,
      });
      // Movement (handled by brain): dash to target — emit position update event
      dispatch('boss_dash', {
        fromX: payload.fromX, fromZ: payload.fromZ,
        toX: payload.targetX, toZ: payload.targetZ,
      });
    } else if (ability.id === 'summon_legion') {
      const roles = ['melee', 'ranged', 'melee', 'support'];
      const total = payload.count;
      for (let i = 0; i < total; i++) {
        const angle = (i / total) * Math.PI * 2;
        const r = 3;
        dispatch('spawn_minion', {
          x: payload.x + Math.cos(angle) * r,
          z: payload.z + Math.sin(angle) * r,
          role: roles[i % roles.length],
        });
      }
    } else if (ability.id === 'world_breaker') {
      dispatch('cone_damage', {
        x: payload.x, z: payload.z, yaw: payload.yaw,
        angleDeg: ability.angleDeg, range: ability.range,
        damage: ability.damage, interrupt: true,
      });
    } else if (ability.id === 'chaos_orbs') {
      // Each orb spawns immediately and tracks an assigned playerId
      payload.orbs.forEach((targetId) => dispatch('spawn_orb', {
        x: payload.x, z: payload.z, y: payload.y,
        targetPlayerId: targetId, damage: ability.damage, bossId,
      }));
    }
  }

  return {
    tick(dt) {
      for (const id in cooldowns) {
        if (cooldowns[id] > 0) cooldowns[id] = Math.max(0, cooldowns[id] - dt);
      }
      if (casting) {
        casting.t += dt;
        if (casting.t >= casting.ability.castTime) resolveCast();
      }
    },
    isCasting() { return !!casting; },
    currentCastId() { return casting?.ability?.id || null; },
    cooldownLeft(id) { return cooldowns[id] || 0; },
    /**
     * Try to use an ability. Returns true if cast was started.
     * @param {string} id
     * @param {object} payload - ability-specific context
     */
    tryCast(id, payload) {
      const ab = Object.values(BOSS_ABILITIES).find((a) => a.id === id);
      if (!ab) return false;
      if (casting) return false;
      if (cooldowns[id] > 0) return false;
      startCast(ab, payload);
      return true;
    },
    /** Pick the most appropriate ability given current context. */
    chooseAbility(ctx) {
      // ctx: { targetDistance, nearbyPlayerCount, hpFrac, summonCount, enraged, ready: {id} }
      const cdReady = (id) => cooldowns[id] <= 0;
      const notRepeat = (id) => id !== lastUsedId;

      // SUMMON LEGION — when overwhelmed (low HP or grouped attackers and few summons)
      if (cdReady('summon_legion') && ctx.summonCount < 2 &&
          (ctx.hpFrac < 0.65 || ctx.nearbyPlayerCount >= 2)) {
        return 'summon_legion';
      }
      // METEOR RAIN — cinematic area denial, even against one locked-on player
      if (cdReady('meteor_rain') && ctx.targetDistance !== null && notRepeat('meteor_rain')) {
        return 'meteor_rain';
      }
      // WORLD BREAKER — close range
      if (cdReady('world_breaker') && ctx.targetDistance !== null
          && ctx.targetDistance < 6 && notRepeat('world_breaker')) {
        return 'world_breaker';
      }
      // SHADOW CHARGE — distant target, gap-closer
      if (cdReady('shadow_charge') && ctx.targetDistance !== null
          && ctx.targetDistance > 7) {
        return 'shadow_charge';
      }
      // CHAOS ORBS — mid-range / ranged combat
      if (cdReady('chaos_orbs') && ctx.targetDistance !== null
          && ctx.targetDistance > 4) {
        return 'chaos_orbs';
      }
      return null;
    },
  };
}