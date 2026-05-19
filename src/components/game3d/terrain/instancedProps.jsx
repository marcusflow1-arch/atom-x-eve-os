// ─── instancedProps ───────────────────────────────────────────────────────
// Turn a loaded asset (tree / rock / grass) into a set of THREE.InstancedMesh
// objects — one per unique sub-mesh — so thousands of copies render in a
// handful of draw calls instead of thousands.
//
// Why this matters for the forest:
//   • 1100 trees × ~3 sub-meshes = ~3300 individual draw calls without
//     instancing, on top of grass & rocks. With instancing we get ~10-20
//     draw calls total for the entire forest.
//   • Frustum culling still works per InstancedMesh (the whole batch),
//     which is fine for grass tufts/rocks; for trees we set the bounding
//     sphere conservatively so distant trees still pop out of view when
//     off-camera.
//
// Inputs:
//   sourceObject — the cloned root returned by assetLoaderCache.instantiate
//   placements   — [{ x, z, y, rotY, scaleMult }, ...]   (world-space, y = ground)
//
// Returns: THREE.Group containing one InstancedMesh per source sub-mesh.

import * as THREE from 'three';

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();
const _t = new THREE.Vector3();
const _euler = new THREE.Euler();

export function buildInstancedProps(sourceObject, placements, opts = {}) {
  const group = new THREE.Group();
  group.name = opts.name || 'instanced_props';

  if (!sourceObject || !placements || placements.length === 0) return group;

  // Bake the source object's transform into world space so each sub-mesh's
  // local geometry can be reused directly by InstancedMesh.
  sourceObject.updateMatrixWorld(true);

  // Collect every mesh in the source asset along with its world matrix
  // relative to the asset root (so per-instance transforms compose cleanly).
  const subMeshes = [];
  sourceObject.traverse((node) => {
    if (node.isMesh && node.geometry) {
      // World matrix of this sub-mesh relative to the asset root.
      const local = node.matrixWorld.clone();
      // Strip the asset root's own transform so `local` is purely the
      // sub-mesh's offset within the asset.
      const rootInv = new THREE.Matrix4().copy(sourceObject.matrixWorld).invert();
      local.premultiply(rootInv);
      subMeshes.push({
        geometry: node.geometry,
        material: node.material,
        localMatrix: local,
      });
    }
  });

  if (subMeshes.length === 0) return group;

  const count = placements.length;

  for (const sm of subMeshes) {
    const inst = new THREE.InstancedMesh(sm.geometry, sm.material, count);
    inst.castShadow = false;
    inst.receiveShadow = !!opts.receiveShadow;
    inst.frustumCulled = true;

    for (let i = 0; i < count; i++) {
      const p = placements[i];
      const scale = p.scaleMult || 1;

      // Per-instance world matrix: T * R * S * localMatrix
      _euler.set(0, p.rotY || 0, 0);
      _q.setFromEuler(_euler);
      _t.set(p.x, p.y, p.z);
      _s.set(scale, scale, scale);
      _m.compose(_t, _q, _s);
      _m.multiply(sm.localMatrix);

      inst.setMatrixAt(i, _m);
    }
    inst.instanceMatrix.needsUpdate = true;

    // Generous bounding sphere so frustum culling doesn't pop instances
    // at the camera edges. Center on world origin, radius = map diagonal.
    inst.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), opts.boundsRadius || 200);

    group.add(inst);
  }

  return group;
}