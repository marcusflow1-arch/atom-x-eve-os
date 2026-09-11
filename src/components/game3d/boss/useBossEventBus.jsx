// useBossEventBus — translates world-boss AI events into world mutations.
// All actions and effects are hard-bound to the originating live world boss.
// Once that boss dies/dies/vanishes, pending callbacks stop, active VFX are
// disposed immediately, and no new boss event executes.

import * as THREE from 'three';
import { createWarningCircle, createMeteorImpact, createShadowChargeTrail, createConeTelegraph, createChaosOrb } from './bossAbilityVfx';
import { createTrackingAOE, createDelayedTask, createShockwave } from './adaptiveBossVfx';
import { createRaidAerialStrike } from './raidAerialStrikeVfx';

export function attachBossEventBus(ctx) {
  const {
    scene, getPlayerHUD, setHP, spawnDamageFloat,
    activeEffectsRef, spawnBossMinion, getBossById,
    sampleGroundY, modelRef, gltfLoader, applyLocalBossDamage,
  } = ctx;

  const ARENA_RADIUS = 36.5;
  const clampToArena = (position) => {
    const dist = Math.sqrt(position.x * position.x + position.z * position.z);
    if (dist > ARENA_RADIUS) {
      const scale = ARENA_RADIUS / dist;
      position.x *= scale;
      position.z *= scale;
    }
    return position;
  };

  const getModel = () => modelRef?.current || null;

  const getLiveBoss = (bossId) => {
    const boss = getBossById?.(bossId);
    if (!boss?.group) return null;
    if (boss.alive === false || boss.dying || boss.defeated || Number(boss.hp) <= 0 || boss.group.visible === false) return null;
    return boss;
  };

  const bossCanAct = (bossId) => !!getLiveBoss(bossId);

  const bindEffectToBoss = (effect, bossId) => {
    if (!effect) return null;
    return {
      __bossId: bossId,
      __cancelled: false,
      update(delta) {
        if (this.__cancelled || !bossCanAct(bossId)) return;
        effect.update?.(delta);
      },
      alive() {
        if (this.__cancelled || !bossCanAct(bossId)) return false;
        return effect.alive ? effect.alive() : true;
      },
      dispose() {
        if (this.__cancelled) return;
        this.__cancelled = true;
        effect.dispose?.();
      },
    };
  };

  const pushBossEffect = (effect, bossId) => {
    const bound = bindEffectToBoss(effect, bossId);
    if (bound) activeEffectsRef.current.push(bound);
    return bound;
  };

  const purgeBossEffects = (bossId) => {
    const next = [];
    activeEffectsRef.current.forEach((fx) => {
      if (fx?.__bossId === bossId) {
        try { fx.dispose?.(); } catch { /* non-fatal */ }
      } else {
        next.push(fx);
      }
    });
    activeEffectsRef.current = next;
  };

  const haltHandler = (event) => {
    const bossId = event?.detail?.bossId;
    if (!bossId) return;
    purgeBossEffects(bossId);
  };

  const handler = (e) => {
    const d = e.detail;
    if (!d) return;
    const { type, bossId, payload } = d;
    const boss = getLiveBoss(bossId);

    // No bossAction may execute for a dead, dying, hidden, placeholder, quest,
    // or legacy arena entity. This is the central one-on-one encounter gate.
    if (!boss) return;

    if (type === 'boss_telegraph') {
      const y = sampleGroundY?.(payload.x, payload.z) ?? 0.3;
      if (payload.kind === 'circle') {
        pushBossEffect(createWarningCircle(scene, payload.x, payload.z, y, payload.radius, payload.duration), bossId);
      } else if (payload.kind === 'cone') {
        pushBossEffect(createConeTelegraph(
          scene, boss.group.position.x, boss.group.position.z, boss.group.position.y,
          payload.yaw, payload.angleDeg, payload.range, payload.duration,
        ), bossId);
      }
      return;
    }

    if (type === 'tracking_aoe') {
      const m = getModel();
      if (!m) return;
      const fx = createTrackingAOE(scene, {
        getTargetPosition: () => bossCanAct(bossId) ? getModel()?.position : null,
        getGroundY: (x, z) => sampleGroundY?.(x, z) ?? 0.3,
        radius: payload.radius,
        followTime: payload.followTime,
        explodeDelay: payload.explodeDelay,
        onExplode: (pos) => {
          if (!bossCanAct(bossId)) return;
          pushBossEffect(createShockwave(scene, pos.x, pos.z, sampleGroundY?.(pos.x, pos.z) ?? 0.3, payload.radius), bossId);
          const cur = getModel();
          if (cur) {
            const dx = cur.position.x - pos.x;
            const dz = cur.position.z - pos.z;
            if (dx * dx + dz * dz < payload.radius * payload.radius) applyDamageToLocalPlayer(payload.damage, bossId);
          }
        },
      });
      pushBossEffect(fx, bossId);
      return;
    }

    if (type === 'teleport_behind_player') {
      const m = getModel();
      if (!m) return;
      const behindOffset = new THREE.Vector3(0, 0, -3).applyQuaternion(m.quaternion);
      boss.group.position.copy(clampToArena(m.position.clone().add(behindOffset)));
      const gy = sampleGroundY?.(boss.group.position.x, boss.group.position.z);
      if (gy !== null && gy !== undefined) boss.group.position.y = gy;
      boss.group.lookAt(m.position);
      pushBossEffect(createDelayedTask(payload.delay ?? 0.5, () => {
        if (!bossCanAct(bossId)) return;
        const cur = getModel();
        const liveBoss = getLiveBoss(bossId);
        if (!cur || !liveBoss) return;
        const dx = cur.position.x - liveBoss.group.position.x;
        const dz = cur.position.z - liveBoss.group.position.z;
        if (dx * dx + dz * dz < (payload.radius ?? 3) ** 2) applyDamageToLocalPlayer(payload.damage, bossId);
      }), bossId);
      return;
    }

    if (type === 'sky_dive_attack') {
      const m = getModel();
      if (!m) return;
      boss.group.position.y += 25;
      pushBossEffect(createDelayedTask(payload.chargeTime ?? 1.5, () => {
        if (!bossCanAct(bossId)) return;
        const cur = getModel();
        const liveBoss = getLiveBoss(bossId);
        if (!cur || !liveBoss) return;
        liveBoss.group.position.copy(clampToArena(cur.position.clone()));
        const gy = sampleGroundY?.(liveBoss.group.position.x, liveBoss.group.position.z) ?? cur.position.y;
        liveBoss.group.position.y = gy;
        pushBossEffect(createShockwave(scene, cur.position.x, cur.position.z, gy, payload.radius ?? 8), bossId);
        const dx = cur.position.x - liveBoss.group.position.x;
        const dz = cur.position.z - liveBoss.group.position.z;
        if (dx * dx + dz * dz < (payload.radius ?? 8) ** 2) applyDamageToLocalPlayer(payload.damage, bossId);
      }), bossId);
      return;
    }

    if (type === 'delayed_cone_damage') {
      pushBossEffect(createDelayedTask(payload.delay ?? 0.75, () => {
        if (!bossCanAct(bossId)) return;
        const m = getModel();
        if (!m) return;
        const dx = m.position.x - payload.x;
        const dz = m.position.z - payload.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist > payload.range) return;
        const playerAng = Math.atan2(dx, dz);
        const half = (payload.angleDeg * Math.PI / 180) / 2;
        const diff = Math.atan2(Math.sin(playerAng - payload.yaw), Math.cos(playerAng - payload.yaw));
        if (Math.abs(diff) <= half) applyDamageToLocalPlayer(payload.damage, bossId);
      }), bossId);
      return;
    }

    if (type === 'phase_shift') {
      const m = getModel();
      const x = boss.group?.position?.x ?? m?.position?.x ?? 0;
      const z = boss.group?.position?.z ?? m?.position?.z ?? 0;
      const y = sampleGroundY?.(x, z) ?? 0.3;
      pushBossEffect(createShockwave(scene, x, z, y, 5 + (payload.phase || 1)), bossId);
      return;
    }

    if (type === 'aoe_damage') {
      const y = sampleGroundY?.(payload.x, payload.z) ?? 0.3;
      if (payload.burnTicks) {
        pushBossEffect(createMeteorImpact(scene, payload.x, payload.z, y, payload.radius), bossId);
      }
      const m = getModel();
      if (m) {
        const dx = m.position.x - payload.x;
        const dz = m.position.z - payload.z;
        if (dx * dx + dz * dz < payload.radius * payload.radius) applyDamageToLocalPlayer(payload.damage, bossId);
      }
      return;
    }

    if (type === 'raid_aerial_strike') {
      const fx = createRaidAerialStrike({
        scene,
        loader: gltfLoader,
        getTargetPosition: () => bossCanAct(bossId) ? getModel()?.position : null,
        getGroundY: (x, z) => sampleGroundY?.(x, z) ?? 0.3,
        getLocalPlayerPosition: () => {
          if (!bossCanAct(bossId)) return null;
          const m = getModel();
          return m ? m.position : null;
        },
        applyLocalDamage: (amount) => {
          if (!bossCanAct(bossId)) return;
          if (applyLocalBossDamage) applyLocalBossDamage(amount);
          else applyDamageToLocalPlayer(amount, bossId);
        },
        radius: payload.radius,
        damage: payload.tickDamage,
        duration: payload.duration,
      });
      pushBossEffect(fx, bossId);
      return;
    }

    if (type === 'cone_damage') {
      const m = getModel();
      if (!m) return;
      const dx = m.position.x - payload.x;
      const dz = m.position.z - payload.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist > payload.range) return;
      const playerAng = Math.atan2(dx, dz);
      const half = (payload.angleDeg * Math.PI / 180) / 2;
      const diff = Math.atan2(Math.sin(playerAng - payload.yaw), Math.cos(playerAng - payload.yaw));
      if (Math.abs(diff) <= half) applyDamageToLocalPlayer(payload.damage, bossId);
      return;
    }

    if (type === 'boss_dash') {
      const y = sampleGroundY?.(payload.fromX, payload.fromZ) ?? 0.3;
      const dashPos = clampToArena({ x: payload.toX, z: payload.toZ });
      boss.group.position.x = dashPos.x;
      boss.group.position.z = dashPos.z;
      const gy = sampleGroundY?.(dashPos.x, dashPos.z);
      if (gy !== null && gy !== undefined) boss.group.position.y = gy;
      pushBossEffect(createShadowChargeTrail(scene, payload.fromX, payload.fromZ, payload.toX, payload.toZ, y), bossId);
      return;
    }

    if (type === 'spawn_minion') {
      // Disabled for the current world-boss match: Ironmaw is the only hostile
      // combatant the main player should be fighting right now.
      return;
    }

    if (type === 'spawn_orb') {
      const m = getModel();
      if (!m) return;
      const orb = createChaosOrb(
        scene, payload.x, payload.z, payload.y,
        () => {
          if (!bossCanAct(bossId)) return { x: payload.x, y: payload.y, z: payload.z };
          const cur = getModel();
          return cur ? { x: cur.position.x, y: cur.position.y, z: cur.position.z } : { x: 0, y: 0, z: 0 };
        },
      );
      orb.setOnHit(() => {
        if (bossCanAct(bossId)) applyDamageToLocalPlayer(payload.damage, bossId);
      });
      pushBossEffect(orb, bossId);
      return;
    }

    if (type === 'despawn_minion') return;
  };

  function applyDamageToLocalPlayer(amount, bossId) {
    if (!bossCanAct(bossId)) return;
    const hud = getPlayerHUD();
    const next = Math.max(0, (hud.hp || 0) - amount);
    setHP(next);
    spawnDamageFloat?.('player', amount);
  }

  window.addEventListener('bossAction', handler);
  window.addEventListener('bossCombatHalt', haltHandler);
  return () => {
    window.removeEventListener('bossAction', handler);
    window.removeEventListener('bossCombatHalt', haltHandler);
  };
}