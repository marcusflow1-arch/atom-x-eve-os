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

function roundedRectPath(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

/** Immediate local camera likeness while the high-quality generated head is processing. */
export async function attachInstantFaceCaptureToBody({ baseModel, imageUrl }) {
  if (!baseModel || !imageUrl) return { dispose() {} };
  const baseHead = findBaseHead(baseModel);
  if (!baseHead) throw new Error('The selected body does not expose a skinned Head bone.');

  const baseBox = baseHead.headGeometry.boundingBox.clone();
  const size = baseBox.getSize(new THREE.Vector3());
  const center = baseBox.getCenter(new THREE.Vector3());
  baseHead.headGeometry.dispose();

  const image = await new Promise((resolve, reject) => {
    const next = new Image();
    next.crossOrigin = 'anonymous';
    next.onload = () => resolve(next);
    next.onerror = () => reject(new Error('Captured face preview could not load.'));
    next.src = imageUrl;
  });

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 512, 512);
  ctx.save();
  roundedRectPath(ctx, 24, 14, 464, 484, 168);
  ctx.clip();
  ctx.drawImage(image, 0, 0, 512, 512);
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = false;
  texture.needsUpdate = true;

  const geometry = new THREE.SphereGeometry(1, 48, 32, Math.PI * .08, Math.PI * .84, Math.PI * .16, Math.PI * .68);
  geometry.scale(Math.max(size.x * .49, .001), Math.max(size.y * .55, .001), Math.max(size.z * .28, .001));
  const material = new THREE.MeshStandardMaterial({ map: texture, color: 0xffffff, roughness: .72, metalness: 0, transparent: true, alphaTest: .02, side: THREE.DoubleSide });
  const shell = new THREE.Mesh(geometry, material);
  shell.name = 'AtomXE_InstantFaceCapture';
  shell.castShadow = true;
  shell.renderOrder = 4;
  shell.position.set(center.x, center.y, baseBox.max.z + size.z * .015);
  shell.rotation.y = Math.PI;
  baseHead.headBone.add(shell);
  baseHead.headBone.updateMatrixWorld(true);

  return {
    dispose() {
      shell.removeFromParent();
      geometry.dispose();
      texture.dispose();
      material.dispose();
    },
  };
}

/**
 * Keeps the selected Atom × Eve body and replaces only its head region with
 * the head extracted from the generated, Mixamo-compatible likeness model.
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
          Object.values(material).forEach((value) => { if (value?.isTexture) value.dispose?.(); });
          material.dispose?.();
        });
      });
    },
  };
}
