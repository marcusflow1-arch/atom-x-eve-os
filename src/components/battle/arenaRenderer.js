import * as THREE from 'three';

export default function arenaRenderer() {
  // Try a normal context, then a lower-cost context on a fresh canvas.
  for (const antialias of [true, false]) {
    const canvas = document.createElement('canvas');
    let context;
    try {
      const options = { alpha: true, antialias, powerPreference: 'default' };
      context = canvas.getContext('webgl2', options);
      if (!context || context.isContextLost()) continue;
      return new THREE.WebGLRenderer({ ...options, canvas, context });
    } catch (error) {
      console.warn('[PvP] Graphics initialization unavailable:', error?.message);
      context?.getExtension('WEBGL_lose_context')?.loseContext();
    }
  }
  return null;
}

export function disposeArenaObjects(root) {
  const resources = new Set();
  root.traverse((object) => {
    if (object.geometry) resources.add(object.geometry);
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.filter(Boolean).forEach((material) => {
      resources.add(material);
      Object.values(material).forEach((value) => { if (value?.isTexture) resources.add(value); });
    });
    if (object.skeleton) resources.add(object.skeleton);
    object.shadow?.dispose?.();
  });
  resources.forEach((resource) => resource.dispose());
}