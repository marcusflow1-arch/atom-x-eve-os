import * as THREE from 'three';

/**
 * HealEffect — rising green sparkles + an expanding aura ring around the
 * caster. Self-cast (no target needed). Lifespan ~1.0s.
 */
export function createHealEffect(scene, getCasterPos) {
  const group = new THREE.Group();
  scene.add(group);

  const LIFETIME = 1.0;
  const SPARKLE_COUNT = 22;

  // Expanding aura ring around the player's feet
  const ringGeo = new THREE.RingGeometry(0.4, 0.7, 32);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x4ade80, transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  group.add(ring);

  // Inner glow disc
  const discGeo = new THREE.CircleGeometry(1.0, 24);
  const discMat = new THREE.MeshBasicMaterial({
    color: 0x86efac, transparent: true, opacity: 0.4, depthWrite: false, side: THREE.DoubleSide,
  });
  const disc = new THREE.Mesh(discGeo, discMat);
  disc.rotation.x = -Math.PI / 2;
  group.add(disc);

  // Rising sparkles
  const sparkles = [];
  for (let i = 0; i < SPARKLE_COUNT; i++) {
    const sGeo = new THREE.SphereGeometry(0.08 + Math.random() * 0.05, 5, 5);
    const sMat = new THREE.MeshBasicMaterial({
      color: 0xb5f5c2, transparent: true, opacity: 1, depthWrite: false,
    });
    const sMesh = new THREE.Mesh(sGeo, sMat);
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * 0.8;
    sparkles.push({
      mesh: sMesh, geo: sGeo, mat: sMat,
      angle,
      dist,
      yStart: Math.random() * 0.3,
      ySpeed: 1.5 + Math.random() * 1.2,
      lifeOffset: Math.random() * 0.3,
    });
    group.add(sMesh);
  }

  // Soft green light
  const light = new THREE.PointLight(0x4ade80, 5, 6);
  group.add(light);

  let elapsed = 0;
  let alive = true;

  const update = (delta) => {
    elapsed += delta;
    const t = elapsed / LIFETIME;
    const fade = Math.max(0, 1 - t);

    const pos = getCasterPos();
    group.position.set(pos.x, pos.y + 0.05, pos.z);

    // Ring expands and fades
    const rScale = 1 + t * 3;
    ring.scale.set(rScale, rScale, 1);
    ringMat.opacity = 0.85 * fade;

    discMat.opacity = 0.4 * fade;
    disc.scale.set(1 + t * 0.5, 1 + t * 0.5, 1);

    // Sparkles rise and fade
    sparkles.forEach((s) => {
      const localT = Math.max(0, t - s.lifeOffset);
      s.mesh.position.set(
        Math.cos(s.angle) * s.dist,
        s.yStart + localT * s.ySpeed * 2,
        Math.sin(s.angle) * s.dist,
      );
      s.mat.opacity = Math.max(0, fade * (1 - localT * 0.5));
    });

    light.position.set(0, 1, 0);
    light.intensity = 5 * fade;

    if (elapsed >= LIFETIME) {
      alive = false;
      sparkles.forEach((s) => { s.geo.dispose(); s.mat.dispose(); });
      ringGeo.dispose(); ringMat.dispose();
      discGeo.dispose(); discMat.dispose();
      scene.remove(group);
    }
  };

  return { alive: () => alive, update };
}