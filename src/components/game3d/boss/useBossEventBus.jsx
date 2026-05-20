// useBossEventBus — listens for `bossAction` events emitted by BossBrain and
// translates them into world mutations (damage, spawns, VFX) using callbacks
// supplied by GameWorld3D. This keeps boss AI fully decoupled from the
// renderer/world state (multiplayer-ready seam).
//
// Usage from inside GameWorld3D useEffect:
//
//   const modelRef = { current: null };
//   const detachBossBus = attachBossEventBus({
//     scene, modelRef, getPlayerHUD, setHP, spawnDamageFloat,
//     activeEffectsRef, spawnBossMinion, getBossById, sampleGroundY,
//   });
//   // GameWorld3D sets modelRef.current = fbx when the player FBX loads.
//   // on cleanup:
//   detachBossBus();

import * as THREE from 'three';
import { createWarningCircle, createMeteorImpact, createShadowChargeTrail, createConeTelegraph, createChaosOrb } from './bossAbilityVfx';
import { createTrackingAOE, createDelayedTask, createShockwave } from './adaptiveBossVfx';

export function attachBossEventBus(ctx) {
  const {
    scene, getPlayerHUD, setHP, spawnDamageFloat,
    activeEffectsRef, spawnBossMinion, getBossById,
    sampleGroundY, modelRef,
  } = ctx;
  // Read player model lazily via a mutable ref — never evaluated at attach time
  // so there's no TDZ risk against `let model` in GameWorld3D.
  const getModel = () => modelRef?.current || null;

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

    if (type === 'tracking_aoe') {
      const m = getModel();
      if (!m) return;
      const fx = createTrackingAOE(scene, {
        getTargetPosition: () => getModel()?.position,
        getGroundY: (x, z) => sampleGroundY?.(x, z) ?? 0.3,
        radius: payload.radius,
        followTime: payload.followTime,
        explodeDelay: payload.explodeDelay,
        onExplode: (pos) => {
          activeEffectsRef.current.push(createShockwave(scene, pos.x, pos.z, sampleGroundY?.(pos.x, pos.z) ?? 0.3, payload.radius));
          const cur = getModel();
          if (cur) {
            const dx = cur.position.x - pos.x;
            const dz = cur.position.z - pos.z;
            if (dx * dx + dz * dz < payload.radius * payload.radius) applyDamageToLocalPlayer(payload.damage);
          }
        },
      });
      activeEffectsRef.current.push(fx);
      return;
    }

    if (type === 'teleport_behind_player') {
      const m = getModel();
      if (!m || !boss) return;
      const behindOffset = new THREE.Vector3(0, 0, -3).applyQuaternion(m.quaternion);
      boss.group.position.copy(m.position.clone().add(behindOffset));
      const gy = sampleGroundY?.(boss.group.position.x, boss.group.position.z);
      if (gy !== null && gy !== undefined) boss.group.position.y = gy;
      boss.group.lookAt(m.position);
      activeEffectsRef.current.push(createDelayedTask(payload.delay ?? 0.5, () => {
        const cur = getModel();
        if (!cur) return;
        const dx = cur.position.x - boss.group.position.x;
        const dz = cur.position.z - boss.group.position.z;
        if (dx * dx + dz * dz < (payload.radius ?? 3) * (payload.radius ?? 3)) applyDamageToLocalPlayer(payload.damage);
      }));
      return;
    }

    if (type === 'sky_dive_attack') {
      const m = getModel();
      if (!m || !boss) return;
      boss.group.position.y += 25;
      activeEffectsRef.current.push(createDelayedTask(payload.chargeTime ?? 1.5, () => {
        const cur = getModel();
        if (!cur) return;
        boss.group.position.copy(cur.position);
        const gy = sampleGroundY?.(cur.position.x, cur.position.z) ?? cur.position.y;
        boss.group.position.y = gy;
        activeEffectsRef.current.push(createShockwave(scene, cur.position.x, cur.position.z, gy, payload.radius ?? 8));
        const dx = cur.position.x - boss.group.position.x;
        const dz = cur.position.z - boss.group.position.z;
        if (dx * dx + dz * dz < (payload.radius ?? 8) * (payload.radius ?? 8)) applyDamageToLocalPlayer(payload.damage);
      }));
      return;
    }

    if (type === 'delayed_cone_damage') {
      activeEffectsRef.current.push(createDelayedTask(payload.delay ?? 0.75, () => {
        const m = getModel();
        if (!m) return;
        const dx = m.position.x - payload.x;
        const dz = m.position.z - payload.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist > payload.range) return;
        const playerAng = Math.atan2(dx, dz);
        const half = (payload.angleDeg * Math.PI / 180) / 2;
        const diff = Math.atan2(Math.sin(playerAng - payload.yaw), Math.cos(playerAng - payload.yaw));
        if (Math.abs(diff) <= half) applyDamageToLocalPlayer(payload.damage);
      }));
      return;
    }

    if (type === 'phase_shift') {
      const m = getModel();
      const x = boss?.group?.position?.x ?? m?.position?.x ?? 0;
      const z = boss?.group?.position?.z ?? m?.position?.z ?? 0;
      const y = sampleGroundY?.(x, z) ?? 0.3;
      activeEffectsRef.current.push(createShockwave(scene, x, z, y, 5 + (payload.phase || 1)));
      return;
    }

    if (type === 'aoe_damage') {
      const y = sampleGroundY?.(payload.x, payload.z) ?? 0.3;
      if (payload.burnTicks) {
        const fx = createMeteorImpact(scene, payload.x, payload.z, y, payload.radius);
        activeEffectsRef.current.push(fx);
      }
      const m = getModel();
      if (m) {
        const dx = m.position.x - payload.x;
        const dz = m.position.z - payload.z;
        if (dx * dx + dz * dz < payload.radius * payload.radius) {
          applyDamageToLocalPlayer(payload.damage);
        }
      }
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
      if (Math.abs(diff) <= half) {
        applyDamageToLocalPlayer(payload.damage);
      }
      return;
    }

    if (type === 'boss_dash') {
      const y = sampleGroundY?.(payload.fromX, payload.fromZ) ?? 0.3;
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
      const m = getModel();
      if (!m) return;
      const orb = createChaosOrb(
        scene, payload.x, payload.z, payload.y,
        () => {
          const cur = getModel();
          return cur ? { x: cur.position.x, y: cur.position.y, z: cur.position.z } : { x: 0, y: 0, z: 0 };
        },
      );
      orb.setOnHit(() => {
        applyDamageToLocalPlayer(payload.damage);
      });
      activeEffectsRef.current.push(orb);
      return;
    }

    if (type === 'despawn_minion') {
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