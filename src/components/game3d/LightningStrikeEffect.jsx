import * as THREE from 'three';

/**
 * Creates a detailed, lingering lightning bolt effect in a Three.js scene.
 * Multiple main bolts + sub-branches with rapid re-randomization for a
 * sustained "continuously struck" look. Effect lingers ~0.8s before fading.
 */
export function createLightningStrike(scene, targetX, targetZ, groundY = 0) {
  const group = new THREE.Group();
  scene.add(group);

  const BOLT_COLOR = new THREE.Color(0xddeeff);
  const CORE_COLOR = new THREE.Color(0xffffff);
  const GLOW_COLOR = new THREE.Color(0x6699ff);
  const START_Y = 40;
  const NUM_SEGMENTS = 18;
  const MAX_OFFSET = 2.0;
  const LIFETIME = 0.8;          // total effect duration
  const HOLD_TIME = 0.55;        // bolt stays at full brightness before fading
  const FLASH_DURATION = 0.18;
  const REBUILD_INTERVAL = 0.035; // re-randomize bolt paths every 35ms

  // ─── Sky flash sphere (large ambient light burst) ───
  const flashGeo = new THREE.SphereGeometry(12, 10, 10);
  const flashMat = new THREE.MeshBasicMaterial({
    color: 0xaaccff, transparent: true, opacity: 0.55, depthWrite: false, side: THREE.BackSide,
  });
  const flash = new THREE.Mesh(flashGeo, flashMat);
  flash.position.set(targetX, START_Y * 0.5, targetZ);
  group.add(flash);

  // ─── Impact flash (bright white sphere on ground) ───
  const impactGeo = new THREE.SphereGeometry(4, 10, 10);
  const impactMat = new THREE.MeshBasicMaterial({
    color: 0xffffff, transparent: true, opacity: 1.0, depthWrite: false,
  });
  const impact = new THREE.Mesh(impactGeo, impactMat);
  impact.position.set(targetX, groundY + 0.5, targetZ);
  group.add(impact);

  // ─── Ground glow ring (electric halo expanding outward) ───
  const ringGeo = new THREE.RingGeometry(0.3, 2.5, 32);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x88bbff, transparent: true, opacity: 0.7, depthWrite: false, side: THREE.DoubleSide,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(targetX, groundY + 0.06, targetZ);
  group.add(ring);

  // ─── Ground sparks (small bright spheres jittering around impact) ───
  const sparks = [];
  const SPARK_COUNT = 10;
  for (let i = 0; i < SPARK_COUNT; i++) {
    const sGeo = new THREE.SphereGeometry(0.08 + Math.random() * 0.06, 4, 4);
    const sMat = new THREE.MeshBasicMaterial({
      color: 0xeeffff, transparent: true, opacity: 1.0, depthWrite: false,
    });
    const sMesh = new THREE.Mesh(sGeo, sMat);
    const angle = Math.random() * Math.PI * 2;
    const dist = 0.4 + Math.random() * 2.2;
    sMesh.position.set(
      targetX + Math.cos(angle) * dist,
      groundY + 0.1 + Math.random() * 0.6,
      targetZ + Math.sin(angle) * dist,
    );
    group.add(sMesh);
    sparks.push({ mesh: sMesh, mat: sMat, geo: sGeo, angle, dist, speed: 1 + Math.random() * 3 });
  }

  // ─── Build bolt strands ───
  const strands = [];
  const buildStrand = (fromY, toY, spread = 1.0, thickness = 0.07) => {
    const points = [];
    const segH = (fromY - toY) / NUM_SEGMENTS;
    let cx = targetX, cz = targetZ;

    for (let i = 0; i <= NUM_SEGMENTS; i++) {
      if (i > 0 && i < NUM_SEGMENTS) {
        cx += (Math.random() - 0.5) * MAX_OFFSET * spread;
        cz += (Math.random() - 0.5) * MAX_OFFSET * spread * 0.5;
      } else {
        cx = targetX;
        cz = targetZ;
      }
      points.push(new THREE.Vector3(cx, fromY - i * segH, cz));
    }

    const curve = new THREE.CatmullRomCurve3(points);

    // Outer glow tube
    const glowGeo = new THREE.TubeGeometry(curve, NUM_SEGMENTS * 3, thickness * 2.5, 5, false);
    const glowMat = new THREE.MeshBasicMaterial({
      color: GLOW_COLOR, transparent: true, opacity: 0.25, depthWrite: false,
    });
    const glowMesh = new THREE.Mesh(glowGeo, glowMat);
    group.add(glowMesh);

    // Main bolt tube
    const tubeGeo = new THREE.TubeGeometry(curve, NUM_SEGMENTS * 3, thickness, 5, false);
    const mat = new THREE.MeshBasicMaterial({
      color: BOLT_COLOR, transparent: true, opacity: 1.0, depthWrite: false,
    });
    const mesh = new THREE.Mesh(tubeGeo, mat);
    group.add(mesh);

    // Bright inner core
    const coreTubeGeo = new THREE.TubeGeometry(curve, NUM_SEGMENTS * 2, thickness * 0.35, 4, false);
    const coreMat = new THREE.MeshBasicMaterial({
      color: CORE_COLOR, transparent: true, opacity: 1.0, depthWrite: false,
    });
    const core = new THREE.Mesh(coreTubeGeo, coreMat);
    group.add(core);

    strands.push({ mesh, core, glowMesh, mat, coreMat, glowMat, tubeGeo, coreTubeGeo, glowGeo });
  };

  const rebuildAllStrands = () => {
    strands.forEach(({ mesh, core, glowMesh, tubeGeo, coreTubeGeo, glowGeo }) => {
      tubeGeo.dispose();
      coreTubeGeo.dispose();
      glowGeo.dispose();
      group.remove(mesh);
      group.remove(core);
      group.remove(glowMesh);
    });
    strands.length = 0;

    // 3 main bolts
    buildStrand(START_Y, groundY, 1.0, 0.08);
    buildStrand(START_Y, groundY, 0.9, 0.06);
    buildStrand(START_Y, groundY, 1.1, 0.055);
    // 3 shorter sub-branches for detail
    buildStrand(START_Y * 0.55, groundY + 1.5, 1.5, 0.04);
    buildStrand(START_Y * 0.65, groundY + 2.5, 1.3, 0.035);
    buildStrand(START_Y * 0.45, groundY + 0.8, 1.6, 0.03);
  };

  // Initial build
  rebuildAllStrands();

  // Two point lights at different heights for richer illumination
  const light1 = new THREE.PointLight(0x88bbff, 18, 40);
  light1.position.set(targetX, groundY + 3, targetZ);
  group.add(light1);
  const light2 = new THREE.PointLight(0xaaddff, 10, 50);
  light2.position.set(targetX, START_Y * 0.4, targetZ);
  group.add(light2);

  let elapsed = 0;
  let alive = true;
  let lastRebuildTimer = 0;

  const update = (delta) => {
    elapsed += delta;
    lastRebuildTimer += delta;
    const t = elapsed / LIFETIME;

    // Opacity: hold at full until HOLD_TIME, then fade during the remaining time
    const fadeStart = HOLD_TIME / LIFETIME;
    let opacity;
    if (t < fadeStart) {
      opacity = 1.0;
    } else {
      opacity = 1.0 - ((t - fadeStart) / (1.0 - fadeStart));
    }
    // Add a rapid flicker to opacity during the hold phase for a "crackling" feel
    const flicker = t < fadeStart ? (0.85 + Math.random() * 0.15) : 1.0;
    opacity = Math.max(0, opacity * flicker);

    // Rebuild bolt geometry rapidly while still visible
    if (lastRebuildTimer >= REBUILD_INTERVAL && t < 0.92) {
      lastRebuildTimer = 0;
      rebuildAllStrands();
    }

    // Apply opacity to all strands
    strands.forEach(({ mat, coreMat, glowMat }) => {
      mat.opacity = Math.max(0, opacity);
      coreMat.opacity = Math.max(0, opacity);
      glowMat.opacity = Math.max(0, opacity * 0.25);
    });

    // Flash spheres fade
    flashMat.opacity = elapsed < FLASH_DURATION ? 0.55 * (1 - elapsed / FLASH_DURATION) : 0;
    impactMat.opacity = elapsed < FLASH_DURATION * 2 ? 1.0 * (1 - elapsed / (FLASH_DURATION * 2)) : 0;

    // Ground ring expands and fades
    const ringScale = 1 + t * 3;
    ring.scale.set(ringScale, ringScale, 1);
    ringMat.opacity = Math.max(0, 0.7 * (1 - t));

    // Sparks jitter and fade
    sparks.forEach((s) => {
      const jx = (Math.random() - 0.5) * 0.3;
      const jz = (Math.random() - 0.5) * 0.3;
      s.mesh.position.x += jx;
      s.mesh.position.z += jz;
      s.mesh.position.y = groundY + 0.1 + Math.random() * 0.5;
      s.mat.opacity = Math.max(0, opacity * (0.6 + Math.random() * 0.4));
    });

    // Lights
    light1.intensity = Math.max(0, 18 * opacity * flicker);
    light2.intensity = Math.max(0, 10 * opacity * flicker);

    // Cleanup when lifetime ends
    if (elapsed >= LIFETIME) {
      alive = false;
      strands.forEach(({ mesh, core, glowMesh, mat, coreMat, glowMat, tubeGeo, coreTubeGeo, glowGeo }) => {
        tubeGeo.dispose(); coreTubeGeo.dispose(); glowGeo.dispose();
        mat.dispose(); coreMat.dispose(); glowMat.dispose();
        group.remove(mesh); group.remove(core); group.remove(glowMesh);
      });
      sparks.forEach((s) => { s.geo.dispose(); s.mat.dispose(); group.remove(s.mesh); });
      flashGeo.dispose(); flashMat.dispose();
      impactGeo.dispose(); impactMat.dispose();
      ringGeo.dispose(); ringMat.dispose();
      scene.remove(group);
    }
  };

  return { alive: () => alive, update };
}