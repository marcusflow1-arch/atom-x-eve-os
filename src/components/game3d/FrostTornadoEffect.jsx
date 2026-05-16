import * as THREE from 'three';

/**
 * Creates a swirling frost/ice tornado at a target position.
 * Tall vertical funnel of icy particles + spinning frost shards + ground frost ring.
 * Lifetime ~2.2s — long enough to feel like an aerial AOE.
 *
 * Returns: { alive, update } interface matching the other ability effects.
 */
export function createFrostTornado(scene, targetX, targetZ, groundY = 0) {
  const group = new THREE.Group();
  scene.add(group);

  const LIFETIME = 2.2;
  const FUNNEL_HEIGHT = 8;
  const FUNNEL_TOP_R = 2.4;
  const FUNNEL_BOT_R = 0.9;
  const ICE_COLOR_A = 0xbfeeff;
  const ICE_COLOR_B = 0x66c6ff;
  const FROST_WHITE = 0xeaffff;

  // ─── Outer translucent funnel cone (the tornado body) ───
  const coneGeo = new THREE.CylinderGeometry(FUNNEL_TOP_R, FUNNEL_BOT_R, FUNNEL_HEIGHT, 24, 6, true);
  const coneMat = new THREE.MeshBasicMaterial({
    color: ICE_COLOR_A, transparent: true, opacity: 0.18,
    side: THREE.DoubleSide, depthWrite: false,
  });
  const cone = new THREE.Mesh(coneGeo, coneMat);
  cone.position.set(targetX, groundY + FUNNEL_HEIGHT / 2, targetZ);
  group.add(cone);

  // Inner brighter funnel for depth
  const coneInnerGeo = new THREE.CylinderGeometry(FUNNEL_TOP_R * 0.6, FUNNEL_BOT_R * 0.55, FUNNEL_HEIGHT * 0.95, 18, 4, true);
  const coneInnerMat = new THREE.MeshBasicMaterial({
    color: ICE_COLOR_B, transparent: true, opacity: 0.25,
    side: THREE.DoubleSide, depthWrite: false,
  });
  const coneInner = new THREE.Mesh(coneInnerGeo, coneInnerMat);
  coneInner.position.set(targetX, groundY + FUNNEL_HEIGHT / 2, targetZ);
  group.add(coneInner);

  // ─── Ground frost ring (expanding icy halo) ───
  const ringGeo = new THREE.RingGeometry(0.6, FUNNEL_TOP_R, 32);
  const ringMat = new THREE.MeshBasicMaterial({
    color: FROST_WHITE, transparent: true, opacity: 0.7,
    side: THREE.DoubleSide, depthWrite: false,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(targetX, groundY + 0.06, targetZ);
  group.add(ring);

  // ─── Orbiting frost shards (octahedrons spinning around the funnel) ───
  const SHARD_COUNT = 22;
  const shards = [];
  for (let i = 0; i < SHARD_COUNT; i++) {
    const size = 0.12 + Math.random() * 0.18;
    const geo = new THREE.OctahedronGeometry(size, 0);
    const mat = new THREE.MeshBasicMaterial({
      color: Math.random() < 0.5 ? ICE_COLOR_A : FROST_WHITE,
      transparent: true, opacity: 0.95, depthWrite: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    const baseAngle = Math.random() * Math.PI * 2;
    const heightT = Math.random(); // 0 = bottom, 1 = top
    shards.push({
      mesh, geo, mat,
      baseAngle,
      heightT,
      angularSpeed: 3 + Math.random() * 2.5, // rad/s
      verticalSpeed: 0.6 + Math.random() * 1.2,
      spinAxis: new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize(),
      spinSpeed: 2 + Math.random() * 3,
    });
    group.add(mesh);
  }

  // ─── Upward streaming frost particles (small spheres rising) ───
  const PARTICLE_COUNT = 30;
  const particles = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const geo = new THREE.SphereGeometry(0.05 + Math.random() * 0.06, 4, 4);
    const mat = new THREE.MeshBasicMaterial({
      color: FROST_WHITE, transparent: true, opacity: 0.9, depthWrite: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    const angle = Math.random() * Math.PI * 2;
    const radius = 0.4 + Math.random() * 1.5;
    particles.push({
      mesh, geo, mat,
      angle,
      radius,
      heightT: Math.random(),
      angularSpeed: 4 + Math.random() * 3,
      verticalSpeed: 1.2 + Math.random() * 1.4,
    });
    group.add(mesh);
  }

  // ─── Cyan-blue light from inside the tornado ───
  const light = new THREE.PointLight(0x88ddff, 8, 18);
  light.position.set(targetX, groundY + 2.5, targetZ);
  group.add(light);

  // Fire a 3-slash DOM effect at the tornado's world position (multi-hit AoE visual)
  window.dispatchEvent(new CustomEvent('spawnSlashWorld', {
    detail: { wx: targetX, wy: groundY + 1.0, wz: targetZ, angle: -35, count: 3 }
  }));

  let elapsed = 0;
  let alive = true;
  let funnelRot = 0;

  const update = (delta) => {
    elapsed += delta;
    const t = elapsed / LIFETIME;
    funnelRot += delta * 4.5;

    // Fade in for first 15%, hold, fade out last 25%
    let fade;
    if (t < 0.15) fade = t / 0.15;
    else if (t > 0.75) fade = Math.max(0, 1 - (t - 0.75) / 0.25);
    else fade = 1.0;

    coneMat.opacity = 0.18 * fade;
    coneInnerMat.opacity = 0.25 * fade;
    cone.rotation.y = funnelRot;
    coneInner.rotation.y = -funnelRot * 1.3;

    // Ring pulses & expands subtly
    const ringScale = 1 + Math.sin(elapsed * 6) * 0.08 + t * 0.4;
    ring.scale.set(ringScale, ringScale, 1);
    ringMat.opacity = 0.7 * fade;

    // Shards orbit + spin + rise (loop heightT around)
    shards.forEach((s) => {
      s.heightT += s.verticalSpeed * delta * 0.15;
      if (s.heightT > 1) s.heightT -= 1;
      // Radius narrows toward bottom (funnel shape)
      const radius = FUNNEL_BOT_R + (FUNNEL_TOP_R - FUNNEL_BOT_R) * s.heightT;
      const angle = s.baseAngle + funnelRot * s.angularSpeed * 0.25;
      s.mesh.position.set(
        targetX + Math.cos(angle) * radius,
        groundY + 0.2 + s.heightT * FUNNEL_HEIGHT,
        targetZ + Math.sin(angle) * radius,
      );
      s.mesh.rotateOnAxis(s.spinAxis, s.spinSpeed * delta);
      s.mat.opacity = 0.95 * fade;
    });

    // Particles stream upward then loop
    particles.forEach((p) => {
      p.heightT += p.verticalSpeed * delta * 0.2;
      if (p.heightT > 1) p.heightT -= 1;
      const radius = p.radius * (0.5 + p.heightT * 0.8);
      p.angle += p.angularSpeed * delta;
      p.mesh.position.set(
        targetX + Math.cos(p.angle) * radius,
        groundY + 0.1 + p.heightT * FUNNEL_HEIGHT,
        targetZ + Math.sin(p.angle) * radius,
      );
      p.mat.opacity = 0.9 * fade * (1 - p.heightT * 0.4);
    });

    light.intensity = 8 * fade;

    if (elapsed >= LIFETIME) {
      alive = false;
      // Dispose
      coneGeo.dispose(); coneMat.dispose();
      coneInnerGeo.dispose(); coneInnerMat.dispose();
      ringGeo.dispose(); ringMat.dispose();
      shards.forEach((s) => { s.geo.dispose(); s.mat.dispose(); group.remove(s.mesh); });
      particles.forEach((p) => { p.geo.dispose(); p.mat.dispose(); group.remove(p.mesh); });
      scene.remove(group);
    }
  };

  return { alive: () => alive, update };
}