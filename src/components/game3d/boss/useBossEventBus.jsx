// useBossEventBus — listens for `bossAction` events emitted by BossBrain and
// translates them into world mutations (damage, spawns, VFX) using callbacks
// supplied by GameWorld3D. This keeps boss AI fully decoupled from the
// renderer/world state (multiplayer-ready seam).
//
// Usage from inside GameWorld3D useEffect:
//
//   const detachBossBus = attachBossEventBus({
//     scene, model, getPlayerHUD, setHP, spawnDamageFloat, activeEffectsRef,
//     spawnBossMinion, getBossById, applyKnockback, getEnemyById,
//   });
//   // on cleanup:
//   detachBossBus();

import * as THREE from 'three';
import { createWarningCircle, createMeteorImpact, createShadowChargeTrail, createConeTelegraph, createChaosOrb } from './bossAbilityVfx';

export function attachBossEventBus(ctx) {
  const {
    scene, model, getPlayerHUD, setHP, spawnDamageFloat,
    activeEffectsRef, spawnBossMinion, getBossById,
    sampleGroundY,
  } = ctx;

  const handler = (e) => {
    const d = e.detail; if (!d) return;
    const { type, bossId, payload } = d;
    const boss = getBossById(bossId);
    if (!boss && type !== 'spawn_orb') return;

    if (type === 'boss_telegraph') {
      const y = sampleGroundY?.(payload.x, payload.z) ?? 0.3;
      if (payload.kind === 'circle') {
        const fx = createWarningCircle(scene, payload.x, payload.z, y, payload.radius, payload.duration);
        activeEffectsRef.current.push(fx);
      } else if (payload.kind === 'cone' && boss) {
        const fx = createConeTelegraph(
          scene, boss.group.position.x, boss.group.position.z, boss.group.position.y,
          payload.yaw, payload.angleDeg, payload.range, payload.duration,
        );
        activeEffectsRef.current.push(fx);
      }
      return;
    }

    if (type === 'aoe_damage') {
      const y = sampleGroundY?.(payload.x, payload.z) ?? 0.3;
      // Spawn meteor visual if this was from meteor_rain (burnTicks present)
      if (payload.burnTicks) {
        const fx = createMeteorImpact(scene, payload.x, payload.z, y, payload.radius);
        activeEffectsRef.current.push(fx);
      }
      // Damage local player if inside
      if (model) {
        const dx = model.position.x - payload.x;
        const dz = model.position.z - payload.z;
        if (dx * dx + dz * dz < payload.radius * payload.radius) {
          applyDamageToLocalPlayer(payload.damage);
        }
      }
      return;
    }

    if (type === 'cone_damage') {
      // World Breaker — cone in front of boss
      if (!model) return;
      const dx = model.position.x - payload.x;
      const dz = model.position.z - payload.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist > payload.range) return;
      // Angle between boss-forward and player-direction
      const playerAng = Math.atan2(dx, dz);
      const half = (payload.angleDeg * Math.PI / 180) / 2;
      const diff = Math.atan2(Math.sin(playerAng - payload.yaw), Math.cos(playerAng - payload.yaw));
      if (Math.abs(diff) <= half) {
        applyDamageToLocalPlayer(payload.damage);
      }
      return;
    }

    if (type === 'boss_dash') {
      const y = sampleGroundY?.(payload.fromX, payload.fromZ) ?? 0.3;
      // Snap boss to target position
      if (boss) {
        boss.group.position.x = payload.toX;
        boss.group.position.z = payload.toZ;
        const gy = sampleGroundY?.(payload.toX, payload.toZ);
        if (gy !== null && gy !== undefined) boss.group.position.y = gy;
      }
      const fx = createShadowChargeTrail(scene, payload.fromX, payload.fromZ, payload.toX, payload.toZ, y);
      activeEffectsRef.current.push(fx);
      return;
    }

    if (type === 'spawn_minion') {
      spawnBossMinion?.(bossId, payload);
      return;
    }

    if (type === 'spawn_orb') {
      // Spawn a tracking orb at boss position; target = local player only
      // for now (multiplayer pass replicates per-target).
      if (!model) return;
      const orb = createChaosOrb(
        scene, payload.x, payload.z, payload.y,
        () => ({ x: model.position.x, y: model.position.y, z: model.position.z }),
      );
      orb.setOnHit(() => {
        applyDamageToLocalPlayer(payload.damage);
      });
      activeEffectsRef.current.push(orb);
      return;
    }

    if (type === 'despawn_minion') {
      // Minion cleanup is handled in GameWorld3D enemy loop via expiration check
      return;
    }
  };

  function applyDamageToLocalPlayer(amount) {
    const hud = getPlayerHUD();
    const next = Math.max(0, (hud.hp || 0) - amount);
    setHP(next);
    spawnDamageFloat?.('player', amount);
  }

  window.addEventListener('bossAction', handler);
  return () => window.removeEventListener('bossAction', handler);
}