import * as THREE from 'three';

export const autoScaleCharacter = (model, targetHeight = 1.8) => {
  const bbox = new THREE.Box3().setFromObject(model);
  const size = bbox.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const scale = maxDim > 0 ? targetHeight / maxDim : 0.001;
  model.scale.setScalar(scale);
};