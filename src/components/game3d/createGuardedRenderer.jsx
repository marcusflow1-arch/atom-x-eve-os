// Create a THREE.WebGLRenderer with graceful failure handling.
// Returns the renderer on success, or null if the WebGL context could not be created
// (e.g. browser context limit reached, GPU acceleration disabled). On failure, calls
// onError(message) so the caller can show a fallback UI instead of crashing.
import * as THREE from 'three';

export function createGuardedRenderer(container, onError) {
  try {
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    return renderer;
  } catch (err) {
    console.error('GameWorld3D: WebGL context unavailable', err?.message || err);
    onError?.('Too many 3D contexts are open. Close other tabs and reload.');
    return null;
  }
}