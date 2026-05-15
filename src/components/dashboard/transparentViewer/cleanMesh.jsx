// Shared mesh setup helper extracted from TransparentModel3DViewer.
// Applied via THREE.Object3D.traverse() to every loaded model.
export const cleanMesh = (c) => {
  if (!c.isMesh) return;
  c.receiveShadow = true;
  // Disable castShadow for SkinnedMesh to prevent WebGL bone limit crashes on some devices
  c.castShadow = !c.isSkinnedMesh;
};