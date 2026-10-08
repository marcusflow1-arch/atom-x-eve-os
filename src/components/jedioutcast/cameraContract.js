// Shared camera / viewport contract for the editable Jedi Outcast reconstruction
// and traversal runtimes. The original browser engine also renders at 1024x768 /
// 4:3, so keeping the editable viewers on the same projection contract prevents
// camera framing from drifting just because the Base44 preview is widescreen.

export const JEDI_CAMERA_CONTRACT = Object.freeze({
  renderWidth: 1024,
  renderHeight: 768,
  aspect: 1024 / 768,
  fov: 80,
  near: 1,
  far: 65536,

  // Third-person follow framing for the editable traversal runtime.
  distance: 150,
  shoulderOffset: 22,
  targetHeight: 30,
  verticalOffset: 18,
  minPitch: -THREE_PI * 0.36,
  maxPitch: THREE_PI * 0.30,
  mouseSensitivity: 0.0022,
});

const THREE_PI = Math.PI;

export function jediViewportStyle() {
  return {
    width: 'min(100vw, calc(100vh * 4 / 3))',
    height: 'min(100vh, calc(100vw * 3 / 4))',
    aspectRatio: '4 / 3',
    maxWidth: '100%',
    maxHeight: '100%',
  };
}
