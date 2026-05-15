import * as THREE from 'three';

/**
 * LifeDrainEffect — a red/crimson energy stream that pulls from the target
 * back to the caster (player). Visible particles travel along the tether.
 * Lifespan ~1.2s.
 */
export function createLifeDrainEffect(scene, getSourcePos, getTargetPos) {
  const group = new THREE.Group();
  scene.add(group);

  const LIFETIME = 1.2;
  const PARTICLE_COUNT = 14;

  // Glowing target sphere (where life is being drained from)
  const sphereGeo = new THREE.SphereGeometry(0.5, 12, 12);
  const sphereMat = new THREE.MeshBasicMaterial({
    color: 0xff2a2a, transparent: true, opacity: 0.7, depthWrite: false,
  });
  const sphere = new THREE.Mesh(sphereGeo, sphereMat);
  group.add(sphere);

  // Caster receiving glow
  const recvGeo = new THREE.SphereGeometry(0.4, 10, 10);
  const recvMat = new THREE.MeshBasicMaterial({
    color: 0xff6688, transparent: true, opacity: 0.5, depthWrite: false,
  });
  const recv = new THREE.Mesh(recvGeo, recvMat);
  group.add(recv);

  // Tether line
  const lineGeo = new THREE.BufferGeometry();
  const linePositions = new Float32Array(6);
  lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
  const lineMat = new THREE.LineBasicMaterial({
    color: 0xff3344, transparent: true, opacity: 0.8,
  });
  const line = new THREE.Line(lineGeo, lineMat);
  group.add(line);

  // Particles flying back along the tether (target → player)
  const particles = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const pGeo = new THREE.SphereGeometry(0.08 + Math.random() * 0.06, 5, 5);
    const pMat = new THREE.MeshBasicMaterial({
      color: 0xff4466, transparent: true, opacity: 1, depthWrite: false,
    });
    const pMesh = new THREE.Mesh(pGeo, pMat);
    group.add(pMesh);
    particles.push({
      mesh: pMesh, geo: pGeo, mat: pMat,
      t: Math.random(), // progress along tether 0..1 (0 = target, 1 = caster)
      speed: 0.7 + Math.random() * 0.8,
      offset: new THREE.Vector3(
        (Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.3,
      ),
    });
  }

  // Crimson point light at the target
  const light = new THREE.PointLight(0xff2244, 4, 8);
  group.add(light);

  let elapsed = 0;
  let alive = true;

  const update = (delta) => {
    elapsed += delta;
    const t = elapsed / LIFETIME;
    const fade = t < 0.75 ? 1 : Math.max(0, 1 - (t - 0.75) / 0.25);

    const src = getSourcePos();   // caster (player)
    const tgt = getTargetPos();   // enemy

    // Place spheres
    sphere.position.set(tgt.x, tgt.y + 1.0, tgt.z);
    recv.position.set(src.x, src.y + 1.2, src.z);
    light.position.copy(sphere.position);

    // Update tether endpoints
    linePositions[0] = tgt.x; linePositions[1] = tgt.y + 1.0; linePositions[2] = tgt.z;
    linePositions[3] = src.x; linePositions[4] = src.y + 1.2; linePositions[5] = src.z;
    lineGeo.attributes.position.needsUpdate = true;

    // Animate particles flowing target → caster
    particles.forEach((p) => {
      p.t += p.speed * delta;
      if (p.t > 1) p.t -= 1;
      // Interpolate from target to caster
      const k = p.t;
      p.mesh.position.set(
        tgt.x + (src.x - tgt.x) * k + p.offset.x,
        (tgt.y + 1.0) + ((src.y + 1.2) - (tgt.y + 1.0)) * k + p.offset.y,
        tgt.z + (src.z - tgt.z) * k + p.offset.z,
      );
      p.mat.opacity = fade;
    });

    // Sphere pulse
    const pulse = 1 + Math.sin(elapsed * 14) * 0.15;
    sphere.scale.set(pulse, pulse, pulse);

    // Fade
    sphereMat.opacity = 0.7 * fade;
    recvMat.opacity = 0.5 * fade;
    lineMat.opacity = 0.8 * fade;
    light.intensity = 4 * fade;

    if (elapsed >= LIFETIME) {
      alive = false;
      particles.forEach((p) => { p.geo.dispose(); p.mat.dispose(); });
      sphereGeo.dispose(); sphereMat.dispose();
      recvGeo.dispose(); recvMat.dispose();
      lineGeo.dispose(); lineMat.dispose();
      scene.remove(group);
    }
  };

  return { alive: () => alive, update };
}