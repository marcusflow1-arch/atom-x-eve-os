import * as THREE from 'three';

/**
 * CharacterReadabilityLights
 *
 * A character-visibility layer kept SEPARATE from the world day/night
 * lighting. The environment can go genuinely dark at night — these lights
 * keep the player model readable:
 *   • fill — soft point light hovering above the player, offset toward the
 *     camera so the facing side of the model is always gently lit.
 *   • rim — subtle cool directional light behind the player (opposite the
 *     camera) for silhouette separation against dark backgrounds.
 * Both get STRONGER at night and fade to near-nothing in daylight, so
 * daytime looks are untouched.
 */
const lerp = (a, b, t) => a + (b - a) * t;

export function createCharacterReadabilityLights({ scene }) {
  const fill = new THREE.PointLight(0xbfd4ff, 0.3, 14, 1.2);
  fill.castShadow = false;
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0x7aa2ff, 0.15);
  rim.castShadow = false;
  scene.add(rim);
  scene.add(rim.target);

  const camOffset = new THREE.Vector3();
  const rimOffset = new THREE.Vector3();

  // Intensities are re-derived from the env state on a slow tick (the day
  // factor barely changes frame-to-frame); positions track every frame.
  let intensityTimer = 0;

  const applyIntensities = (envState) => {
    // Day factor 0 (night) → 1 (midday), matching the env system's softened
    // elevation curve so the crossfade lines up with the world lighting.
    let dayFactor = 0;
    if (envState && envState.sunset > envState.sunrise) {
      const { time, sunrise, sunset } = envState;
      if (time >= sunrise && time <= sunset) {
        const prog = (time - sunrise) / (sunset - sunrise);
        dayFactor = Math.pow(Math.max(0, Math.sin(prog * Math.PI)), 0.45);
      }
    }
    fill.intensity = lerp(2.6, 0.25, dayFactor);
    rim.intensity = lerp(0.9, 0.1, dayFactor);
  };

  const update = (dt, getEnvState, player, camera) => {
    if (!player || !camera) return;
    intensityTimer -= dt;
    if (intensityTimer <= 0) {
      intensityTimer = 1.0;
      applyIntensities(typeof getEnvState === 'function' ? getEnvState() : getEnvState);
    }
    // Fill: above the player, pulled toward the camera → front fill.
    camOffset.subVectors(camera.position, player.position).normalize();
    fill.position.copy(player.position);
    fill.position.y += 2.2;
    fill.position.addScaledVector(camOffset, 1.5);
    // Rim: behind the player relative to the camera, slightly above.
    rimOffset.subVectors(player.position, camera.position).normalize().multiplyScalar(4);
    rim.position.copy(player.position).add(rimOffset);
    rim.position.y += 3.0;
    rim.target.position.copy(player.position);
  };

  const dispose = () => {
    scene.remove(fill, rim, rim.target);
    fill.dispose?.();
    rim.dispose?.();
  };

  return { update, dispose };
}