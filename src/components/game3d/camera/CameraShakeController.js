// CameraShakeController — short, damped oscillations applied to the camera.
// Used for meteor impacts (medium shake) and crit-hit jolts (small shake).
//
// When created WITHOUT an `orbit` ref, shake offsets are added directly to
// camera.position each frame. Because the camera system recomputes position
// from scratch every tick, the offset never accumulates — no drift, no orbit
// corruption. (This mirrors how the tornado turbulence already shakes the
// camera in GameWorld3D.)

import * as THREE from 'three';

export function createCameraShakeController({ camera, orbit } = {}) {
  const shakeOffset = new THREE.Vector3();
  const shakes = [];

  const shake = ({ amplitude = 0.08, duration = 0.22, frequency = 28 } = {}) => {
    shakes.push({ amplitude, duration, frequency, timer: 0 });
  };

  const update = (delta) => {
    shakeOffset.set(0, 0, 0);
    for (let i = shakes.length - 1; i >= 0; i--) {
      const s = shakes[i];
      s.timer += delta;
      const p = s.timer / s.duration;
      if (p >= 1) {
        shakes.splice(i, 1);
        continue;
      }
      const damper = 1 - p;
      const wave = Math.sin(s.timer * s.frequency) * s.amplitude * damper;
      shakeOffset.x += (Math.random() * 2 - 1) * wave;
      shakeOffset.y += (Math.random() * 2 - 1) * wave * 0.6;
      shakeOffset.z += (Math.random() * 2 - 1) * wave * 0.4;
    }
    if (orbit?.current) {
      orbit.current.shakeX = shakeOffset.x;
      orbit.current.shakeY = shakeOffset.y;
      orbit.current.shakeZ = shakeOffset.z;
    } else {
      camera.position.add(shakeOffset);
    }
  };

  const getOffset = () => shakeOffset.clone();

  return { shake, update, getOffset };
}