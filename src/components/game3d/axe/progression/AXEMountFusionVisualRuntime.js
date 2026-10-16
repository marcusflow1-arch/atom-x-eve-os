import * as THREE from 'three';

// Wuxia blueprint §4.3 — the absorbed mount's energy on the hero: a glowing core
// at the chest (the "core awakening"), two energy rings crossing the body, a
// spiral of particles streaming up through the armor and a faint ring at the
// feet, all in the mount clan's colors (AXEMountFusionSystem palettes).
// Procedural like AXEHaloVisualRuntime, so it works before authored VFX exist;
// opened armor plates need the gear models' own visual layers later.
const PARTICLES = 90;

export function createAXEMountFusionVisualRuntime({ model, initialState = null } = {}) {
  if (!model) return { update() {}, dispose() {} };

  const group = new THREE.Group();
  group.name = 'AXE_MountFusion_Runtime';
  group.visible = false;
  model.add(group);

  const additive = (color, opacity) => new THREE.MeshBasicMaterial({
    color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending,
  });

  // the awakened core at the chest
  const coreGeo = new THREE.SphereGeometry(0.07, 16, 12);
  const coreMat = additive(0xffffff, 0.9);
  const core = new THREE.Mesh(coreGeo, coreMat);
  core.position.set(0, 1.28, 0.12);
  const haloGeo = new THREE.SphereGeometry(0.15, 16, 12);
  const haloMat = additive(0xffffff, 0.2);
  const coreHalo = new THREE.Mesh(haloGeo, haloMat);
  coreHalo.position.copy(core.position);
  group.add(core, coreHalo);

  // energy lines crossing the body
  const ringGeo = new THREE.TorusGeometry(0.46, 0.012, 6, 64);
  const ringMats = [additive(0xffffff, 0.55), additive(0xffffff, 0.4)];
  const rings = ringMats.map((mat, i) => {
    const ring = new THREE.Mesh(ringGeo, mat);
    ring.position.set(0, 1.05 + i * 0.35, 0);
    ring.rotation.set(Math.PI / 2 + (i ? -0.5 : 0.45), 0, 0);
    group.add(ring);
    return ring;
  });

  // ground ring
  const footGeo = new THREE.RingGeometry(0.55, 0.7, 48);
  const footMat = additive(0xffffff, 0.22);
  footMat.side = THREE.DoubleSide;
  const foot = new THREE.Mesh(footGeo, footMat);
  foot.rotation.x = -Math.PI / 2;
  foot.position.y = 0.1; // above road and path decals, which sit up to ~7 cm high
  group.add(foot);

  // particles spiralling up through the body
  const positions = new Float32Array(PARTICLES * 3);
  const colors = new Float32Array(PARTICLES * 3);
  const seeds = Array.from({ length: PARTICLES }, (_, i) => ({
    phase: (i / PARTICLES) * Math.PI * 2 * 3,
    radius: 0.22 + Math.random() * 0.32,
    speed: 0.45 + Math.random() * 0.6,
    t: Math.random(),
    mix: Math.random(),
  }));
  const pointsGeo = new THREE.BufferGeometry();
  pointsGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  pointsGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const pointsMat = new THREE.PointsMaterial({
    size: 0.07, vertexColors: true, transparent: true, opacity: 0.9,
    depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true,
  });
  const points = new THREE.Points(pointsGeo, pointsMat);
  group.add(points);

  const primary = new THREE.Color();
  const secondary = new THREE.Color();
  let lowEffects = false;
  let elapsed = 0;

  const applyState = (state = {}) => {
    const active = !!state.active && !!state.palette;
    group.visible = active;
    if (!active) return;
    lowEffects = !!state.lowEffects;
    primary.set(state.palette.primary);
    secondary.set(state.palette.secondary);
    coreMat.color.set(state.palette.core);
    haloMat.color.copy(primary);
    ringMats[0].color.copy(primary);
    ringMats[1].color.copy(secondary).lerp(primary, 0.35);
    footMat.color.copy(primary);
    for (let i = 0; i < PARTICLES; i++) {
      const c = primary.clone().lerp(secondary, seeds[i].mix * 0.8);
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
    }
    pointsGeo.attributes.color.needsUpdate = true;
    points.visible = !lowEffects;
    // a higher combination share burns brighter
    const k = Math.min(1, Number(state.share || 0) / 39);
    pointsMat.size = 0.055 + 0.03 * k;
    haloMat.opacity = 0.12 + 0.14 * k;
  };

  // soul skill echoes (skillExecutor, planAXEMountSoulEchoes): a spectral claw rake for the
  // spectral strike, a spray of sparks for elemental strikes, a ground shockwave for the AoE echo
  const effects = [];
  const clawGeo = new THREE.TorusGeometry(0.42, 0.022, 6, 24, Math.PI * 0.55);
  const sparkGeo = new THREE.SphereGeometry(0.05, 8, 6);
  const waveGeo = new THREE.RingGeometry(0.9, 1, 64);
  const spawnEcho = (kind, aoeRadius) => {
    const fx = new THREE.Group();
    const mats = [];
    const mat = (color, opacity) => { const m = additive(color, opacity); mats.push(m); return m; };
    if (kind === 'spectral') {
      for (let i = 0; i < 3; i++) {
        const claw = new THREE.Mesh(clawGeo, mat(i === 1 ? secondary : primary, 0.85));
        claw.position.set((i - 1) * 0.16, 1.15 + (i - 1) * 0.05, 0.9);
        claw.rotation.z = -0.6;
        fx.add(claw);
      }
    } else if (kind === 'elemental') {
      for (let i = 0; i < 8; i++) {
        const spark = new THREE.Mesh(sparkGeo, mat(i % 2 ? secondary : primary, 0.9));
        spark.position.set(0, 1.15, 0.8);
        spark.userData.v = new THREE.Vector3((Math.random() - 0.5) * 3, (Math.random() - 0.2) * 2.5, 1.5 + Math.random() * 2);
        fx.add(spark);
      }
    } else {
      const ring = new THREE.Mesh(waveGeo, mat(primary, 0.7));
      ring.material.side = THREE.DoubleSide;
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.11;
      ring.userData.max = Math.max(1.5, Number(aoeRadius) || 3);
      fx.add(ring);
    }
    fx.userData = { kind, life: kind === 'spectral_aoe' ? 0.6 : 0.4, t: 0, mats };
    group.add(fx);
    effects.push(fx);
  };
  const updateEffects = (dt) => {
    for (let i = effects.length - 1; i >= 0; i--) {
      const fx = effects[i], u = fx.userData;
      u.t += dt;
      const k = Math.min(1, u.t / u.life);
      if (u.kind === 'spectral') fx.scale.setScalar(0.7 + 0.6 * k);
      else if (u.kind === 'elemental') fx.children.forEach((s) => s.position.addScaledVector(s.userData.v, dt));
      else fx.children[0].scale.setScalar(0.3 + (fx.children[0].userData.max - 0.3) * k);
      u.mats.forEach((m) => { m.opacity = (1 - k) * 0.85; });
      if (k >= 1) {
        group.remove(fx);
        u.mats.forEach((m) => m.dispose());
        effects.splice(i, 1);
      }
    }
  };
  const onStrike = (event) => {
    const d = event?.detail;
    if (d?.soulEcho && group.visible) spawnEcho(d.soulEcho, d.aoeRadius);
  };

  applyState(initialState || {});
  const onChange = (event) => applyState(event?.detail || {});
  if (typeof window !== 'undefined') {
    window.addEventListener('axeMountFusionChanged', onChange);
    window.addEventListener('playerSkillStrike', onStrike);
  }

  return {
    update(delta = 0) {
      if (!group.visible) return;
      const dt = Math.max(0, Number(delta) || 0);
      elapsed += dt;
      const pulse = 1 + Math.sin(elapsed * 3.1) * 0.12;
      core.scale.setScalar(pulse);
      coreHalo.scale.setScalar(1 + Math.sin(elapsed * 3.1 + 0.6) * 0.18);
      rings[0].rotation.z += dt * 1.6;
      rings[1].rotation.z -= dt * 1.1;
      foot.material.opacity = 0.16 + Math.sin(elapsed * 2) * 0.06;
      updateEffects(Math.min(dt, 0.1)); // a frame hitch must not swallow an echo whole
      if (lowEffects) return;
      for (let i = 0; i < PARTICLES; i++) {
        const s = seeds[i];
        s.t = (s.t + dt * s.speed * 0.5) % 1;
        const a = s.phase + elapsed * 2.2 * s.speed;
        const r = s.radius * (1 - s.t * 0.55);
        positions[i * 3] = Math.cos(a) * r;
        positions[i * 3 + 1] = 0.15 + s.t * 1.95;
        positions[i * 3 + 2] = Math.sin(a) * r;
      }
      pointsGeo.attributes.position.needsUpdate = true;
    },
    dispose() {
      if (typeof window !== 'undefined') {
        window.removeEventListener('axeMountFusionChanged', onChange);
        window.removeEventListener('playerSkillStrike', onStrike);
      }
      effects.forEach((fx) => fx.userData.mats.forEach((m) => m.dispose()));
      if (group.parent) group.parent.remove(group);
      [coreGeo, haloGeo, ringGeo, footGeo, pointsGeo, clawGeo, sparkGeo, waveGeo].forEach((g) => g.dispose());
      [coreMat, haloMat, ...ringMats, footMat, pointsMat].forEach((m) => m.dispose());
    },
  };
}
