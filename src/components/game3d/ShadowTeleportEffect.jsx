import * as THREE from 'three';

/**
 * Shadow Teleport: fade the player's model out at the current location,
 * relocate them behind the target after a brief blackout, then fade back in.
 *
 * - playerModel: THREE.Group (the player's loaded FBX)
 * - getTargetPosition: () => { x, y, z, yaw } | null — called at teleport moment
 * - scene: THREE.Scene
 *
 * Returns { alive: () => boolean, update: (delta) => void }.
 */
export function createShadowTeleport(scene, playerModel, getTargetInfo) {
  const FADE_OUT = 0.25;   // seconds
  const HOLD     = 0.10;   // invisible time between fade-out and fade-in
  const FADE_IN  = 0.30;   // seconds
  const LIFETIME = FADE_OUT + HOLD + FADE_IN;
  const BEHIND_DISTANCE = 1.8; // how far behind the target to land

  // Cache player materials and their original opacity so we can restore them
  const matEntries = [];
  playerModel.traverse((node) => {
    if (node.isMesh && node.material) {
      const mats = Array.isArray(node.material) ? node.material : [node.material];
      mats.forEach((m) => {
        matEntries.push({ mat: m, originalOpacity: m.opacity ?? 1, originalTransparent: m.transparent });
        m.transparent = true;
      });
    }
  });

  // Shadow particle burst at start position
  const startPos = playerModel.position.clone();
  const particles = [];
  const PARTICLE_COUNT = 14;
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const geo = new THREE.SphereGeometry(0.12 + Math.random() * 0.08, 5, 5);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x6a2bb8, transparent: true, opacity: 0.9, depthWrite: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    const angle = Math.random() * Math.PI * 2;
    const radius = 0.2 + Math.random() * 0.4;
    mesh.position.set(
      startPos.x + Math.cos(angle) * radius,
      startPos.y + 0.3 + Math.random() * 1.4,
      startPos.z + Math.sin(angle) * radius,
    );
    scene.add(mesh);
    particles.push({
      mesh, mat, geo,
      vy: 1.2 + Math.random() * 1.8,
      vx: Math.cos(angle) * (0.4 + Math.random() * 0.6),
      vz: Math.sin(angle) * (0.4 + Math.random() * 0.6),
    });
  }

  // Ground ring at start
  const startRingGeo = new THREE.RingGeometry(0.4, 0.9, 24);
  const startRingMat = new THREE.MeshBasicMaterial({
    color: 0xa855f7, transparent: true, opacity: 0.8, depthWrite: false, side: THREE.DoubleSide,
  });
  const startRing = new THREE.Mesh(startRingGeo, startRingMat);
  startRing.rotation.x = -Math.PI / 2;
  startRing.position.set(startPos.x, startPos.y + 0.05, startPos.z);
  scene.add(startRing);

  // Arrival ring — created lazily once we know the landing spot
  let arriveRing = null;
  let arriveRingMat = null;
  let arriveRingGeo = null;
  let teleported = false;

  let elapsed = 0;
  let alive = true;

  const update = (delta) => {
    elapsed += delta;

    // ─── Phase 1: fade out ───
    if (elapsed < FADE_OUT) {
      const t = elapsed / FADE_OUT;
      const op = 1 - t;
      matEntries.forEach(({ mat, originalOpacity }) => {
        mat.opacity = originalOpacity * op;
      });
      startRingMat.opacity = 0.8 * (1 - t * 0.5);
    }
    // ─── Phase 2: teleport (instant) + hold invisible ───
    else if (elapsed < FADE_OUT + HOLD) {
      matEntries.forEach(({ mat }) => { mat.opacity = 0; });
      if (!teleported) {
        teleported = true;
        const target = getTargetInfo();
        if (target) {
          // Compute "behind" the target = opposite of target's facing direction.
          // We use the vector from target → player at the time of teleport to
          // approximate "behind" (i.e. the far side from where the player was).
          // For enemies that face the player, this lands you behind them.
          const dx = startPos.x - target.x;
          const dz = startPos.z - target.z;
          const len = Math.sqrt(dx * dx + dz * dz) || 1;
          // Behind = on the opposite side of the target from the player's start
          const behindX = target.x - (dx / len) * BEHIND_DISTANCE;
          const behindZ = target.z - (dz / len) * BEHIND_DISTANCE;
          playerModel.position.x = behindX;
          playerModel.position.z = behindZ;
          if (typeof target.y === 'number') playerModel.position.y = target.y;
          // Face the target after landing
          const faceAngle = Math.atan2(target.x - behindX, target.z - behindZ);
          playerModel.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), faceAngle);

          // Spawn arrival ring at landing spot
          arriveRingGeo = new THREE.RingGeometry(0.4, 0.9, 24);
          arriveRingMat = new THREE.MeshBasicMaterial({
            color: 0xa855f7, transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide,
          });
          arriveRing = new THREE.Mesh(arriveRingGeo, arriveRingMat);
          arriveRing.rotation.x = -Math.PI / 2;
          arriveRing.position.set(behindX, playerModel.position.y + 0.05, behindZ);
          scene.add(arriveRing);
        }
      }
    }
    // ─── Phase 3: fade in at new location ───
    else if (elapsed < LIFETIME) {
      const t = (elapsed - FADE_OUT - HOLD) / FADE_IN;
      matEntries.forEach(({ mat, originalOpacity }) => {
        mat.opacity = originalOpacity * t;
      });
      if (arriveRingMat) {
        const r = 1 + t * 1.5;
        arriveRing.scale.set(r, r, 1);
        arriveRingMat.opacity = 0.9 * (1 - t);
      }
    }
    // ─── Done ───
    else {
      // Restore original opacity + transparency on all materials
      matEntries.forEach(({ mat, originalOpacity, originalTransparent }) => {
        mat.opacity = originalOpacity;
        mat.transparent = originalTransparent;
      });
      alive = false;
      // Cleanup particles + rings
      particles.forEach(({ mesh, mat, geo }) => {
        scene.remove(mesh); mat.dispose(); geo.dispose();
      });
      scene.remove(startRing);
      startRingGeo.dispose(); startRingMat.dispose();
      if (arriveRing) {
        scene.remove(arriveRing);
        arriveRingGeo.dispose(); arriveRingMat.dispose();
      }
      return;
    }

    // Animate particles every frame while alive
    particles.forEach((p) => {
      p.mesh.position.x += p.vx * delta;
      p.mesh.position.y += p.vy * delta;
      p.mesh.position.z += p.vz * delta;
      p.vy -= 2.0 * delta; // gravity
      p.mat.opacity = Math.max(0, 1 - elapsed / LIFETIME);
    });

    // Start ring expands and fades
    const sr = 1 + (elapsed / LIFETIME) * 1.8;
    startRing.scale.set(sr, sr, 1);
    startRingMat.opacity = Math.max(0, 0.8 * (1 - elapsed / FADE_OUT));
  };

  return { alive: () => alive, update };
}