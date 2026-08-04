import * as THREE from 'three';

/**
 * hailLayer — falling hail stones: small, hard, bright, and much faster than
 * snow, with a slight sideways slant from the gust. Kept in its own module so
 * WorldEnvironmentSystem only has to switch it on and off.
 *
 * createHailLayer({ scene }) → { update(dt, { camera, intensity }), dispose }
 */
export function createHailLayer({ scene }) {
  const COUNT = 1100;
  const AREA = 110;
  const pos = new Float32Array(COUNT * 3);
  const vel = new Float32Array(COUNT);
  const slant = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    pos[i * 3] = (Math.random() - 0.5) * AREA;
    pos[i * 3 + 1] = Math.random() * 70;
    pos[i * 3 + 2] = (Math.random() - 0.5) * AREA;
    vel[i] = 26 + Math.random() * 18;
    slant[i] = 2 + Math.random() * 3;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    color: 0xe8f1ff, size: 0.34, sizeAttenuation: true,
    transparent: true, opacity: 0, depthWrite: false, fog: false,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  points.visible = false;
  scene.add(points);

  const update = (dt, { camera, intensity = 0 } = {}) => {
    mat.opacity = intensity * 0.9;
    if (intensity <= 0.02 || !camera) { points.visible = false; return; }
    points.visible = true;
    points.position.set(camera.position.x, 0, camera.position.z);
    for (let i = 0; i < COUNT; i++) {
      let y = pos[i * 3 + 1] - vel[i] * dt;
      pos[i * 3] += slant[i] * dt;
      if (y < -2) {
        y = 55 + Math.random() * 14;
        pos[i * 3] = (Math.random() - 0.5) * AREA;
        pos[i * 3 + 2] = (Math.random() - 0.5) * AREA;
      }
      pos[i * 3 + 1] = y;
    }
    geo.attributes.position.needsUpdate = true;
  };

  const dispose = () => { scene.remove(points); geo.dispose(); mat.dispose(); };

  return { update, dispose };
}