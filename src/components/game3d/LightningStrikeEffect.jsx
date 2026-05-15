import * as THREE from 'three';

/**
 * Creates a procedural lightning bolt effect in a Three.js scene.
 * The bolt zigzags downward from the sky to a target point, with multiple
 * sub-branches and a bright flash, then fades out.
 *
 * Usage:
 *   const strike = createLightningStrike(scene, targetX, targetZ, groundY);
 *   // Each frame: if (strike.alive) strike.update(delta);
 */
export function createLightningStrike(scene, targetX, targetZ, groundY = 0) {
  const group = new THREE.Group();
  scene.add(group);

  const BOLT_COLOR = new THREE.Color(0xeef4ff);
  const CORE_COLOR = new THREE.Color(0xffffff);
  const START_Y = 35; // height from which bolt descends
  const NUM_SEGMENTS = 14;
  const MAX_OFFSET = 1.6; // max lateral zigzag per segment
  const LIFETIME = 0.45; // seconds total
  const FLASH_DURATION = 0.12;

  // Sky flash sphere (ambient flash)
  const flashGeo = new THREE.SphereGeometry(8, 8, 8);
  const flashMat = new THREE.MeshBasicMaterial({
    color: 0xcce8ff,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
  });
  const flash = new THREE.Mesh(flashGeo, flashMat);
  flash.position.set(targetX, START_Y * 0.6, targetZ);
  group.add(flash);

  // Impact flash sphere (on ground)
  const impactGeo = new THREE.SphereGeometry(3, 8, 8);
  const impactMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
  });
  const impact = new THREE.Mesh(impactGeo, impactMat);
  impact.position.set(targetX, groundY + 0.5, targetZ);
  group.add(impact);

  // Build multiple bolt strands (main + 2 branches)
  const strands = [];
  const buildStrand = (fromY, toY, spread = 1.0, thickness = 0.06) => {
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
    const tubeGeo = new THREE.TubeGeometry(curve, NUM_SEGMENTS * 3, thickness, 4, false);
    const mat = new THREE.MeshBasicMaterial({
      color: BOLT_COLOR,
      transparent: true,
      opacity: 1.0,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(tubeGeo, mat);
    group.add(mesh);

    // Bright core
    const coreTubeGeo = new THREE.TubeGeometry(curve, NUM_SEGMENTS * 2, thickness * 0.4, 4, false);
    const coreMat = new THREE.MeshBasicMaterial({
      color: CORE_COLOR,
      transparent: true,
      opacity: 1.0,
      depthWrite: false,
    });
    const core = new THREE.Mesh(coreTubeGeo, coreMat);
    group.add(core);

    strands.push({ mesh, core, mat, coreMat, tubeGeo, coreTubeGeo });
  };

  // Main bolt
  buildStrand(START_Y, groundY, 1.0, 0.07);
  // Branch bolts (shorter, thinner, slightly offset)
  buildStrand(START_Y * 0.55, groundY + 1.5, 1.4, 0.04);
  buildStrand(START_Y * 0.7, groundY + 2.0, 1.2, 0.035);

  // Point light at impact
  const light = new THREE.PointLight(0x99ccff, 12, 30);
  light.position.set(targetX, groundY + 2, targetZ);
  group.add(light);

  let elapsed = 0;
  let alive = true;
  let lastRebuildTimer = 0;
  const REBUILD_INTERVAL = 0.04; // re-randomize bolt path every 40ms for flicker

  const update = (delta) => {
    elapsed += delta;
    lastRebuildTimer += delta;

    const t = elapsed / LIFETIME;
    const opacity = t < 0.3 ? 1.0 : 1.0 - ((t - 0.3) / 0.7); // hold then fade

    // Flicker: rebuild geometry rapidly
    if (lastRebuildTimer >= REBUILD_INTERVAL && t < 0.85) {
      lastRebuildTimer = 0;
      // Dispose old and rebuild
      strands.forEach(({ mesh, core, mat, coreMat, tubeGeo, coreTubeGeo }) => {
        tubeGeo.dispose();
        coreTubeGeo.dispose();
        group.remove(mesh);
        group.remove(core);
      });
      strands.length = 0;
      buildStrand(START_Y, groundY, 1.0, 0.07);
      buildStrand(START_Y * 0.55, groundY + 1.5, 1.4, 0.04);
      buildStrand(START_Y * 0.7, groundY + 2.0, 1.2, 0.035);
    }

    strands.forEach(({ mat, coreMat }) => {
      mat.opacity = Math.max(0, opacity);
      coreMat.opacity = Math.max(0, opacity);
    });

    flashMat.opacity = elapsed < FLASH_DURATION ? 0.45 * (1 - elapsed / FLASH_DURATION) : 0;
    impactMat.opacity = elapsed < FLASH_DURATION * 1.5 ? 0.9 * (1 - elapsed / (FLASH_DURATION * 1.5)) : 0;
    light.intensity = Math.max(0, 12 * (1 - t * 1.2));

    if (elapsed >= LIFETIME) {
      alive = false;
      // Cleanup
      strands.forEach(({ mesh, core, mat, coreMat, tubeGeo, coreTubeGeo }) => {
        tubeGeo.dispose();
        coreTubeGeo.dispose();
        mat.dispose();
        coreMat.dispose();
        group.remove(mesh);
        group.remove(core);
      });
      flashGeo.dispose();
      flashMat.dispose();
      impactGeo.dispose();
      impactMat.dispose();
      scene.remove(group);
    }
  };

  return { alive: () => alive, update };
}