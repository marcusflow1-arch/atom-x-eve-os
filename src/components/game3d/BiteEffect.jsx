import * as THREE from 'three';

/**
 * BiteEffect — animated upper/lower fangs that snap shut on the target.
 * Lifespan ~0.6s. Fangs come in from above/below, slam together, then fade.
 */
export function createBiteEffect(scene, targetX, targetY, targetZ) {
  const group = new THREE.Group();
  group.position.set(targetX, targetY + 1.0, targetZ);
  scene.add(group);

  const LIFETIME = 0.6;
  const SNAP_TIME = 0.18; // when the jaws fully close

  // Build a single fang as a cone
  const buildFang = (xOff, flipY) => {
    const geo = new THREE.ConeGeometry(0.18, 0.7, 8);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xfff8e8, transparent: true, opacity: 1, depthWrite: false,
    });
    const m = new THREE.Mesh(geo, mat);
    m.position.x = xOff;
    if (flipY) m.rotation.z = Math.PI; // point down
    return { mesh: m, mat, geo };
  };

  // Upper jaw — 4 fangs pointing down
  const upper = new THREE.Group();
  const upperFangs = [-0.45, -0.15, 0.15, 0.45].map((x) => {
    const f = buildFang(x, true);
    upper.add(f.mesh);
    return f;
  });
  upper.position.y = 1.2; // starts above
  group.add(upper);

  // Lower jaw — 4 fangs pointing up
  const lower = new THREE.Group();
  const lowerFangs = [-0.45, -0.15, 0.15, 0.45].map((x) => {
    const f = buildFang(x, false);
    lower.add(f.mesh);
    return f;
  });
  lower.position.y = -1.2; // starts below
  group.add(lower);

  // Impact flash at bite moment
  const flashGeo = new THREE.SphereGeometry(0.6, 10, 10);
  const flashMat = new THREE.MeshBasicMaterial({
    color: 0xffeecc, transparent: true, opacity: 0, depthWrite: false,
  });
  const flash = new THREE.Mesh(flashGeo, flashMat);
  group.add(flash);

  // Subtle warm light
  const light = new THREE.PointLight(0xffcc66, 0, 5);
  group.add(light);

  let elapsed = 0;
  let alive = true;
  let flashed = false;

  const update = (delta) => {
    elapsed += delta;
    const t = elapsed / LIFETIME;

    if (elapsed < SNAP_TIME) {
      // Jaws closing — interpolate from open to closed
      const k = elapsed / SNAP_TIME;
      upper.position.y = 1.2 * (1 - k);
      lower.position.y = -1.2 * (1 - k);
    } else {
      // After snap → fade everything out
      const k = (elapsed - SNAP_TIME) / (LIFETIME - SNAP_TIME);
      upper.position.y = 0;
      lower.position.y = 0;
      const op = Math.max(0, 1 - k);
      upperFangs.forEach((f) => { f.mat.opacity = op; });
      lowerFangs.forEach((f) => { f.mat.opacity = op; });

      // Flash on first frame after snap
      if (!flashed) {
        flashed = true;
        flashMat.opacity = 0.9;
        light.intensity = 6;
      }
      flashMat.opacity = Math.max(0, 0.9 * (1 - k * 2));
      light.intensity = Math.max(0, 6 * (1 - k));
      const fScale = 1 + k * 2;
      flash.scale.set(fScale, fScale, fScale);
    }

    if (elapsed >= LIFETIME) {
      alive = false;
      upperFangs.forEach((f) => { f.geo.dispose(); f.mat.dispose(); });
      lowerFangs.forEach((f) => { f.geo.dispose(); f.mat.dispose(); });
      flashGeo.dispose(); flashMat.dispose();
      scene.remove(group);
    }
  };

  return { alive: () => alive, update };
}