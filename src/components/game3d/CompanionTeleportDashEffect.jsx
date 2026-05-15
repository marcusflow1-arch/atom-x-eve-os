import * as THREE from 'three';

/**
 * CompanionTeleportDashEffect — visual streak that shows the companion
 * blinking through the target. Renders a cyan slash trail from in-front
 * to behind the enemy, plus a flash at impact.
 * Lifespan ~0.7s.
 */
export function createCompanionTeleportDash(scene, getCasterPos, getTargetPos) {
  const group = new THREE.Group();
  scene.add(group);

  const LIFETIME = 0.7;

  const src = getCasterPos();
  const tgt = getTargetPos();

  // Compute direction caster → target, extend past target so the streak shoots through
  const dirX = tgt.x - src.x;
  const dirZ = tgt.z - src.z;
  const len = Math.hypot(dirX, dirZ) || 1;
  const nx = dirX / len, nz = dirZ / len;
  const PAST = 2.5;
  const endX = tgt.x + nx * PAST;
  const endZ = tgt.z + nz * PAST;

  // Streak as a thin elongated box rotated to face the direction
  const streakLen = Math.hypot(endX - src.x, endZ - src.z);
  const streakGeo = new THREE.BoxGeometry(streakLen, 0.25, 0.25);
  const streakMat = new THREE.MeshBasicMaterial({
    color: 0x88f0ff, transparent: true, opacity: 0.9, depthWrite: false,
  });
  const streak = new THREE.Mesh(streakGeo, streakMat);
  streak.position.set((src.x + endX) / 2, src.y + 1.0, (src.z + endZ) / 2);
  streak.rotation.y = -Math.atan2(endZ - src.z, endX - src.x);
  group.add(streak);

  // Outer glow streak
  const glowGeo = new THREE.BoxGeometry(streakLen, 0.6, 0.6);
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0x22aaff, transparent: true, opacity: 0.3, depthWrite: false,
  });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  glow.position.copy(streak.position);
  glow.rotation.y = streak.rotation.y;
  group.add(glow);

  // Impact flash at target
  const flashGeo = new THREE.SphereGeometry(0.8, 12, 12);
  const flashMat = new THREE.MeshBasicMaterial({
    color: 0xddffff, transparent: true, opacity: 1.0, depthWrite: false,
  });
  const flash = new THREE.Mesh(flashGeo, flashMat);
  flash.position.set(tgt.x, tgt.y + 1.0, tgt.z);
  group.add(flash);

  // Ground ring at target
  const ringGeo = new THREE.RingGeometry(0.3, 1.8, 24);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x66ddff, transparent: true, opacity: 0.7, depthWrite: false, side: THREE.DoubleSide,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(tgt.x, tgt.y + 0.05, tgt.z);
  group.add(ring);

  const light = new THREE.PointLight(0x66ddff, 6, 10);
  light.position.set(tgt.x, tgt.y + 1.5, tgt.z);
  group.add(light);

  let elapsed = 0;
  let alive = true;

  const update = (delta) => {
    elapsed += delta;
    const t = elapsed / LIFETIME;
    const fade = Math.max(0, 1 - t);

    streakMat.opacity = 0.9 * fade;
    glowMat.opacity = 0.3 * fade;
    flashMat.opacity = Math.max(0, 1 - t * 1.6);
    const fScale = 1 + t * 2;
    flash.scale.set(fScale, fScale, fScale);

    ringMat.opacity = Math.max(0, 0.7 * (1 - t));
    const rScale = 1 + t * 2.5;
    ring.scale.set(rScale, rScale, 1);

    light.intensity = 6 * fade;

    if (elapsed >= LIFETIME) {
      alive = false;
      streakGeo.dispose(); streakMat.dispose();
      glowGeo.dispose(); glowMat.dispose();
      flashGeo.dispose(); flashMat.dispose();
      ringGeo.dispose(); ringMat.dispose();
      scene.remove(group);
    }
  };

  return { alive: () => alive, update };
}