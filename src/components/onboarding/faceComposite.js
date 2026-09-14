import * as THREE from 'three';

function normalizedBoneName(value = '') {
  return String(value).replace(/^mixamorig\d*:/i, '').replace(/^mixamorig:/i, '').toLowerCase();
}

function findHeadBone(mesh) {
  if (!mesh?.isSkinnedMesh || !mesh.skeleton?.bones?.length) return null;
  return mesh.skeleton.bones.find((bone) => normalizedBoneName(bone.name) === 'head')
    || mesh.skeleton.bones.find((bone) => /(^|[:_])head$/i.test(bone.name || ''))
    || null;
}

function skinInfluence(mesh, vertexIndex, boneIndex) {
  const indices = mesh.geometry?.getAttribute?.('skinIndex');
  const weights = mesh.geometry?.getAttribute?.('skinWeight');
  if (!indices || !weights || boneIndex < 0) return 0;
  let amount = 0;
  if (indices.getX(vertexIndex) === boneIndex) amount += weights.getX(vertexIndex);
  if (indices.getY(vertexIndex) === boneIndex) amount += weights.getY(vertexIndex);
  if (indices.getZ(vertexIndex) === boneIndex) amount += weights.getZ(vertexIndex);
  if (indices.getW(vertexIndex) === boneIndex) amount += weights.getW(vertexIndex);
  return amount;
}

function triangleIndices(geometry) {
  if (geometry.index) return Array.from(geometry.index.array);
  const count = geometry.getAttribute('position')?.count || 0;
  return Array.from({ length: count }, (_, index) => index);
}

function headTriangle(mesh, a, b, c, headIndex, threshold = .34) {
  const ia = skinInfluence(mesh, a, headIndex);
  const ib = skinInfluence(mesh, b, headIndex);
  const ic = skinInfluence(mesh, c, headIndex);
  return ((ia + ib + ic) / 3) >= threshold || [ia, ib, ic].filter((value) => value >= .45).length >= 2;
}

function skinnedVertexInHeadSpace(mesh, headBone, vertexIndex, target) {
  const position = mesh.geometry.getAttribute('position');
  target.fromBufferAttribute(position, vertexIndex);
  if (typeof mesh.applyBoneTransform === 'function') mesh.applyBoneTransform(vertexIndex, target);
  else if (typeof mesh.boneTransform === 'function') mesh.boneTransform(vertexIndex, target);
  mesh.localToWorld(target);
  headBone.worldToLocal(target);
  return target;
}

function extractHeadGeometry(mesh, headBone) {
  const geometry = mesh?.geometry;
  if (!mesh?.isSkinnedMesh || !geometry?.getAttribute?.('position')) return null;
  const headIndex = mesh.skeleton.bones.indexOf(headBone);
  if (headIndex < 0 || !geometry.getAttribute('skinIndex') || !geometry.getAttribute('skinWeight')) return null;

  const uv = geometry.getAttribute('uv');
  const color = geometry.getAttribute('color');
  const indices = triangleIndices(geometry);
  const positions = [];
  const uvs = [];
  const colors = [];
  const point = new THREE.Vector3();

  mesh.updateMatrixWorld(true);
  mesh.skeleton?.update?.();
  headBone.updateMatrixWorld(true);

  for (let offset = 0; offset + 2 < indices.length; offset += 3) {
    const a = indices[offset], b = indices[offset + 1], c = indices[offset + 2];
    if (!headTriangle(mesh, a, b, c, headIndex)) continue;
    for (const vertexIndex of [a, b, c]) {
      skinnedVertexInHeadSpace(mesh, headBone, vertexIndex, point);
      positions.push(point.x, point.y, point.z);
      if (uv) uvs.push(uv.getX(vertexIndex), uv.getY(vertexIndex));
      if (color) colors.push(color.getX(vertexIndex), color.getY(vertexIndex), color.getZ(vertexIndex));
    }
  }

  if (!positions.length) return null;
  const result = new THREE.BufferGeometry();
  result.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  if (uvs.length) result.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  if (colors.length) result.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  result.computeVertexNormals();
  result.computeBoundingBox();
  result.computeBoundingSphere();
  return result;
}

function cutHeadFromBase(mesh, headBone) {
  const geometry = mesh?.geometry;
  if (!mesh?.isSkinnedMesh || !geometry?.getAttribute?.('position')) return null;
  const headIndex = mesh.skeleton.bones.indexOf(headBone);
  if (headIndex < 0 || !geometry.getAttribute('skinIndex') || !geometry.getAttribute('skinWeight')) return null;
  const indices = triangleIndices(geometry);
  const kept = [];
  for (let offset = 0; offset + 2 < indices.length; offset += 3) {
    const a = indices[offset], b = indices[offset + 1], c = indices[offset + 2];
    if (!headTriangle(mesh, a, b, c, headIndex, .42)) kept.push(a, b, c);
  }
  if (!kept.length || kept.length === indices.length) return null;
  const original = geometry;
  const clipped = geometry.clone();
  clipped.setIndex(kept);
  clipped.computeBoundingBox();
  clipped.computeBoundingSphere();
  mesh.geometry = clipped;
  return () => {
    if (mesh.geometry === clipped) mesh.geometry = original;
    clipped.dispose();
  };
}

function cloneFaceMaterial(material) {
  const source = Array.isArray(material) ? material[0] : material;
  if (!source) return new THREE.MeshStandardMaterial({ color: 0xc98e74, roughness: .65 });
  const clone = source.clone();
  clone.side = THREE.DoubleSide;
  clone.transparent = source.transparent;
  clone.alphaTest = source.alphaTest || 0;
  clone.needsUpdate = true;
  return clone;
}

function findBaseHead(baseModel) {
  let result = null;
  baseModel.updateMatrixWorld(true);
  baseModel.traverse((node) => {
    if (result || !node.isSkinnedMesh) return;
    const headBone = findHeadBone(node);
    if (!headBone) return;
    const headGeometry = extractHeadGeometry(node, headBone);
    if (!headGeometry) return;
    result = { mesh: node, headBone, headGeometry };
  });
  return result;
}

async function loadModel(url, gltfLoader, fbxLoader) {
  if (/\.fbx(?:\?|$)/i.test(url)) return fbxLoader.loadAsync(url);
  return gltfLoader.loadAsync(url);
}

/**
 * Keeps the selected Atom × Eve body and replaces only its head region with
 * the head extracted from the generated, Mixamo-compatible likeness model.
 * The extracted head is parented to the base Head bone, so body animations
 * continue to drive it without swapping the entire avatar body.
 */
export async function attachGeneratedFaceToBody({ baseModel, faceUrl, gltfLoader, fbxLoader }) {
  if (!baseModel || !faceUrl) return { dispose() {} };
  const baseHead = findBaseHead(baseModel);
  if (!baseHead) throw new Error('The selected body does not expose a skinned Head bone.');

  const asset = await loadModel(faceUrl, gltfLoader, fbxLoader);
  const sourceRoot = asset.scene || asset;
  sourceRoot.updateMatrixWorld(true);

  const faceGroup = new THREE.Group();
  faceGroup.name = 'AtomXE_GeneratedFace';
  const sourceGeometries = [];
  const faceMaterials = [];
  const sourceBox = new THREE.Box3();
  let extracted = 0;

  sourceRoot.traverse((node) => {
    if (!node.isSkinnedMesh) return;
    const sourceHeadBone = findHeadBone(node);
    if (!sourceHeadBone) return;
    const geometry = extractHeadGeometry(node, sourceHeadBone);
    if (!geometry) return;
    sourceGeometries.push(geometry);
    geometry.computeBoundingBox();
    sourceBox.union(geometry.boundingBox);
    const material = cloneFaceMaterial(node.material);
    faceMaterials.push(material);
    const faceMesh = new THREE.Mesh(geometry, material);
    faceMesh.name = `GeneratedFace_${node.name || extracted}`;
    faceMesh.castShadow = true;
    faceMesh.receiveShadow = true;
    faceGroup.add(faceMesh);
    extracted += 1;
  });

  if (!extracted || sourceBox.isEmpty()) {
    sourceGeometries.forEach((geometry) => geometry.dispose());
    faceMaterials.forEach((material) => material.dispose());
    throw new Error('The generated likeness did not contain a usable rigged head.');
  }

  const baseBox = baseHead.headGeometry.boundingBox.clone();
  const sourceSize = sourceBox.getSize(new THREE.Vector3());
  const baseSize = baseBox.getSize(new THREE.Vector3());
  const sourceCenter = sourceBox.getCenter(new THREE.Vector3());
  const baseCenter = baseBox.getCenter(new THREE.Vector3());
  const scale = THREE.MathUtils.clamp((baseSize.y || 1) / (sourceSize.y || 1), .55, 1.8);

  faceGroup.scale.setScalar(scale);
  faceGroup.position.copy(baseCenter).addScaledVector(sourceCenter, -scale);
  baseHead.headBone.add(faceGroup);
  baseHead.headBone.updateMatrixWorld(true);

  const restoreBase = [];
  baseModel.traverse((node) => {
    if (!node.isSkinnedMesh) return;
    const headBone = findHeadBone(node);
    if (!headBone) return;
    const restore = cutHeadFromBase(node, headBone);
    if (restore) restoreBase.push(restore);
  });

  baseHead.headGeometry.dispose();

  return {
    dispose() {
      restoreBase.forEach((restore) => restore());
      faceGroup.removeFromParent();
      sourceGeometries.forEach((geometry) => geometry.dispose());
      faceMaterials.forEach((material) => material.dispose());
      sourceRoot.traverse?.((node) => {
        if (!node.isMesh) return;
        node.geometry?.dispose?.();
        (Array.isArray(node.material) ? node.material : [node.material]).filter(Boolean).forEach((material) => {
          // The overlay materials clone the material object but share texture maps,
          // so textures remain alive until this composite is removed.
          Object.values(material).forEach((value) => { if (value?.isTexture) value.dispose?.(); });
          material.dispose?.();
        });
      });
    },
  };
}
