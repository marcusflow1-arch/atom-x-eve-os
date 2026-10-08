// Shared camera / viewport contract for the editable Jedi Outcast reconstruction.
// Gameplay values stay grounded in Raven's original SP camera cvars, while the
// Retribution follow distance is pulled back modestly so the controllable Kyle
// model remains readable in the browser viewport.

const THREE_PI = Math.PI;

export const JEDI_CAMERA_CONTRACT = Object.freeze({
  renderWidth: 1024,
  renderHeight: 768,
  aspect: 1024 / 768,
  fov: 80,
  cinematicFov: 90,
  near: 1,
  far: 65536,

  ravenDefaultDistance: 80,
  distance: 100,
  minimumDistance: 48,
  maxDistance: 150,
  targetHeight: 30,
  verticalOffset: 16,
  shoulderOffset: 0,
  cameraDamp: 0.3,
  targetDamp: 0.5,
  collisionPadding: 8,

  minPitch: -THREE_PI * 0.36,
  maxPitch: THREE_PI * 0.30,
  mouseSensitivity: 0.0022,

  maxShakeIntensity: 16,
  barDurationMs: 1000,
  barHeight: 48,
});

export function jediViewportStyle() {
  return {
    width: 'min(100vw, calc(100vh * 4 / 3))',
    height: 'min(100vh, calc(100vw * 3 / 4))',
    aspectRatio: '4 / 3',
    maxWidth: '100%',
    maxHeight: '100%',
  };
}
