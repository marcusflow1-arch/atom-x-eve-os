// updateBossMovement — per-frame locomotion for world boss entities.
// Each boss chases the player when far, wanders at mid range, and idles when
// close, swapping between its walk and idle clips. Extracted from GameWorld3D's
// animation loop to keep that file under the line cap.
import * as THREE from 'three';

export function updateBossMovement(delta, bossEntities, model, mapReady, sampleGroundY) {
  bossEntities.forEach((b) => {
    if (b.mixer) b.mixer.update(delta);
    if (!b.group || !model) return;
    const spd = b.speed || 1.6;
    const dx = model.position.x - b.group.position.x;
    const dz = model.position.z - b.group.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    let moving = false;
    if (dist > 14) {
      // Chase the player
      moving = true;
      b.target = null;
      const nx = dx / dist, nz = dz / dist;
      b.group.position.x += nx * spd * delta;
      b.group.position.z += nz * spd * delta;
      b.group.rotation.y = Math.atan2(nx, nz);
    } else if (dist > 10) {
      // Wander toward a random nearby point
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
      // Close — face the player
      b.target = null;
      b.group.rotation.y = Math.atan2(dx, dz);
    }
    // Glue boss feet to the terrain
    if (mapReady) {
      const gy = sampleGroundY(b.group.position.x, b.group.position.z);
      if (gy !== null) b.group.position.y = gy;
    }
    // Walk/idle animation swap
    if (b.walkAction && b.idleAction) {
      if (moving && !b.walkAction.isRunning()) {
        b.idleAction.fadeOut(0.2); b.walkAction.reset().fadeIn(0.2).play();
      } else if (!moving && !b.idleAction.isRunning()) {
        b.walkAction.fadeOut(0.2); b.idleAction.reset().fadeIn(0.2).play();
      }
    }
  });
}

// projectBossHead — projects a point above the boss's head to screen space and
// returns the UI payload for the floating BossHeadHPTank, or null when off-screen.
export function projectBossHead(boss, camera, w, h) {
  if (!boss || !boss.alive || boss.dying || !boss.group?.visible) return null;
  // Boss model is ~12 units tall; place the bar above its head.
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