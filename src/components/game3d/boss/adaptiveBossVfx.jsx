import * as THREE from 'three';

export function createTrackingAOE(scene, { getTargetPosition, getGroundY, radius = 5, followTime = 2.5, explodeDelay = 1, onExplode }) {
  const ringGeo = new THREE.RingGeometry(radius * 0.78, radius, 64);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xff1744, side: THREE.DoubleSide, transparent: true, opacity: 0.62, depthWrite: false });
  const fillGeo = new THREE.CircleGeometry(radius * 0.74, 64);
  const fillMat = new THREE.MeshBasicMaterial({ color: 0xff1744, transparent: true, opacity: 0.12, depthWrite: false });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  const fill = new THREE.Mesh(fillGeo, fillMat);
  ring.rotation.x = -Math.PI / 2;
  fill.rotation.x = -Math.PI / 2;
  scene.add(ring);
  scene.add(fill);

  let elapsed = 0;
  let locked = false;
  let exploded = false;
  const lockPosition = new THREE.Vector3();

  return {
    update(delta) {
      elapsed += delta;
      const target = getTargetPosition?.();
      if (!locked && target) {
        lockPosition.copy(target);
      }
      if (!locked && elapsed >= followTime) locked = true;
      const y = getGroundY?.(lockPosition.x, lockPosition.z) ?? lockPosition.y ?? 0;
      ring.position.set(lockPosition.x, y + 0.08, lockPosition.z);
      fill.position.copy(ring.position);
      const pulse = locked ? 1 + Math.sin(elapsed * 18) * 0.035 : 1 + Math.sin(elapsed * 8) * 0.025;
      ring.scale.setScalar(pulse);
      fill.scale.setScalar(pulse);
      ringMat.opacity = locked ? 0.85 : 0.5;
      fillMat.opacity = locked ? 0.2 : 0.1;
      if (!exploded && elapsed >= followTime + explodeDelay) {
        exploded = true;
        onExplode?.(lockPosition.clone());
      }
    },
    alive() { return !exploded; },
    dispose() {
      scene.remove(ring);
      scene.remove(fill);
      ringGeo.dispose();
      ringMat.dispose();
      fillGeo.dispose();
      fillMat.dispose();
    },
  };
}

export function createDelayedTask(duration, onComplete) {
  let elapsed = 0;
  let done = false;
  return {
    update(delta) {
      elapsed += delta;
      if (!done && elapsed >= duration) {
        done = true;
        onComplete?.();
      }
    },
    alive() { return !done; },
    dispose() {},
  };
}

export function createShockwave(scene, x, z, y, radius = 8) {
  const geo = new THREE.RingGeometry(0.2, radius, 64);
  const mat = new THREE.MeshBasicMaterial({ color: 0xffaa33, side: THREE.DoubleSide, transparent: true, opacity: 0.9, depthWrite: false });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, y + 0.1, z);
  scene.add(mesh);
  let t = 0;
  return {
    update(delta) {
      t += delta;
      const f = Math.min(1, t / 0.65);
      mesh.scale.setScalar(0.2 + f * 1.3);
      mat.opacity = 0.9 * (1 - f);
    },
    alive() { return t < 0.65; },
    dispose() { scene.remove(mesh); geo.dispose(); mat.dispose(); },
  };
}