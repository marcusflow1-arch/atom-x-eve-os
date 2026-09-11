// updateBossMovement — per-frame locomotion + defeat lifecycle for world bosses.
// Each living boss chases the player when far, wanders at mid range, and idles
// when close. At 0 HP the boss stops combat, plays its real death clip, then
// fades out and vanishes from the world.
import * as THREE from 'three';
import { updateBoss } from '../bossStore';

function beginBossDeath(boss) {
  if (!boss || boss.defeated || boss.deathStarted) return;

  boss.hp = 0;
  boss.alive = false;
  boss.dying = true;
  boss.deathStarted = true;
  boss.deathTimer = 0;
  boss.state = 'death';
  boss.target = null;
  boss.aiTarget = null;
  boss.speed = 0;
  boss.aiSpeed = 0;

  // Combat ends the instant death begins, not after the death animation.
  if (typeof window !== 'undefined') {
    try { window.__gw3dBossTornadoLiftBeam?.cancel?.(); } catch { /* non-fatal */ }
    try { window.__gw3dBossTelegraphs?.clear?.(); } catch { /* non-fatal */ }
    window.dispatchEvent(new CustomEvent('bossCombatHalt', {
      detail: { bossId: boss.id, bossName: boss.name },
    }));
  }

  boss.walkAction?.fadeOut?.(0.12);
  boss.idleAction?.fadeOut?.(0.12);

  if (boss.deathAction) {
    boss.deathAction.enabled = true;
    boss.deathAction.setEffectiveTimeScale(1);
    boss.deathAction.reset().fadeIn(0.08).play();
  }

  try {
    updateBoss(boss.id, { hp: 0, alive: false, dying: true, defeated: false });
  } catch { /* store sync is non-fatal */ }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('bossDeathStarted', {
      detail: { bossId: boss.id, bossName: boss.name, maxHp: boss.maxHp },
    }));
  }
}

function updateBossDeath(delta, boss) {
  if (!boss?.group) return;
  if (!boss.deathStarted) beginBossDeath(boss);
  boss.deathTimer = (boss.deathTimer || 0) + delta;

  const deathDuration = Math.max(0.8, Number(boss.deathDuration) || 2.4);
  const fadeDuration = 0.9;

  if (!boss.deathAction && boss.deathTimer <= deathDuration) {
    const t = Math.min(1, boss.deathTimer / deathDuration);
    boss.group.rotation.z = THREE.MathUtils.lerp(0, -Math.PI * 0.46, t);
  }

  if (boss.deathTimer > deathDuration) {
    const fadeT = Math.min(1, (boss.deathTimer - deathDuration) / fadeDuration);
    const opacity = 1 - fadeT;
    const materials = Array.isArray(boss.fadeMaterials) ? boss.fadeMaterials : boss.tintMaterials;
    materials?.forEach?.((material) => {
      if (!material) return;
      material.transparent = true;
      material.opacity = Math.max(0, opacity);
      material.needsUpdate = true;
    });
  }

  if (boss.deathTimer >= deathDuration + fadeDuration) {
    boss.group.visible = false;
    boss.dying = false;
    boss.defeated = true;
    boss.deathFinishedAt = typeof performance !== 'undefined' ? performance.now() : Date.now();
    boss.mixer?.stopAllAction?.();

    try {
      updateBoss(boss.id, { hp: 0, alive: false, dying: false, defeated: true, visible: false });
    } catch { /* store sync is non-fatal */ }

    if (typeof window !== 'undefined' && !boss.removedEventSent) {
      boss.removedEventSent = true;
      window.dispatchEvent(new CustomEvent('bossRemoved', {
        detail: { bossId: boss.id, bossName: boss.name },
      }));
    }
  }
}

export function updateBossMovement(delta, bossEntities, model, mapReady, sampleGroundY) {
  bossEntities.forEach((b) => {
    if (b.mixer) b.mixer.update(delta);

    if (!b.defeated && !b.dying && (Number(b.hp) <= 0 || b.alive === false)) beginBossDeath(b);

    if (b.dying) {
      updateBossDeath(delta, b);
      return;
    }

    if (b.defeated || b.alive === false || !b.group?.visible || !model) return;

    const spd = b.speed || 1.6;
    const dx = model.position.x - b.group.position.x;
    const dz = model.position.z - b.group.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    let moving = false;

    if (dist > 14) {
      moving = true;
      b.target = null;
      const nx = dx / dist, nz = dz / dist;
      b.group.position.x += nx * spd * delta;
      b.group.position.z += nz * spd * delta;
      b.group.rotation.y = Math.atan2(nx, nz);
    } else if (dist > 10) {
      if (!b.target) {
        const a = Math.random() * Math.PI * 2;
        b.target = { x: b.group.position.x + Math.cos(a) * 4, z: b.group.position.z + Math.sin(a) * 4 };
      }
      const wdx = b.target.x - b.group.position.x;
      const wdz = b.target.z - b.group.position.z;
      const wd = Math.sqrt(wdx * wdx + wdz * wdz);
      if (wd > 0.2) {
        moving = true;
        const nx = wdx / wd, nz = wdz / wd;
        b.group.position.x += nx * spd * 0.6 * delta;
        b.group.position.z += nz * spd * 0.6 * delta;
        b.group.rotation.y = Math.atan2(nx, nz);
      } else {
        b.target = null;
      }
    } else {
      b.target = null;
      b.group.rotation.y = Math.atan2(dx, dz);
    }

    if (mapReady) {
      const gy = sampleGroundY(b.group.position.x, b.group.position.z);
      if (gy !== null) b.group.position.y = gy;
    }

    if (b.walkAction && b.idleAction) {
      if (moving && !b.walkAction.isRunning()) {
        b.idleAction.fadeOut(0.2);
        b.walkAction.reset().fadeIn(0.2).play();
      } else if (!moving && !b.idleAction.isRunning()) {
        b.walkAction.fadeOut(0.2);
        b.idleAction.reset().fadeIn(0.2).play();
      }
    }
  });
}

export function projectBossHead(boss, camera, w, h) {
  if (!boss || !boss.alive || boss.dying || boss.defeated || !boss.group?.visible) return null;
  const v = new THREE.Vector3(boss.group.position.x, boss.group.position.y + 14, boss.group.position.z);
  v.project(camera);
  if (!(v.z > -1 && v.z < 1 && Math.abs(v.x) < 1.3 && Math.abs(v.y) < 1.3)) return null;
  return {
    x: (v.x * 0.5 + 0.5) * w,
    y: (-v.y * 0.5 + 0.5) * h,
    hp: Math.max(0, boss.hp),
    maxHp: boss.maxHp,
    hpTanks: boss.hpTanks || 10,
    hpTankSize: boss.hpTankSize || Math.round(boss.maxHp / 10),
    name: boss.name || 'World Boss',
    level: boss.level || 1,
  };
}