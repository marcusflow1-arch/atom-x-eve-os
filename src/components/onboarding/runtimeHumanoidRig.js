import * as THREE from 'three';

/**
 * Lightweight runtime autorig for a single unskinned humanoid mesh.
 *
 * The Admin Artemis GLB is a single combined mesh with no skins/joints. This
 * helper preserves that exact geometry/material, creates a standard humanoid
 * bone hierarchy, estimates skin weights from normalized body regions, and
 * binds the mesh so existing humanoid FBX clips can be retargeted onto it.
 *
 * This is intentionally conservative and only runs when explicitly requested.
 */

const clamp01 = (value) => Math.max(0, Math.min(1, value));

function addBone(name, parent, x, y, z) {
  const bone = new THREE.Bone();
  bone.name = name;
  bone.position.set(x, y, z);
  parent?.add(bone);
  return bone;
}

function blendPair(a, b, t) {
  const q = clamp01(t);
  return [[a, 1 - q], [b, q]];
}

function normalizeWeights(entries) {
  const compact = entries.filter(([, weight]) => weight > 0.0001).slice(0, 4);
  const total = compact.reduce((sum, [, weight]) => sum + weight, 0) || 1;
  return compact.map(([index, weight]) => [index, weight / total]);
}

function regionWeights(x, y, z, center, height, boneIndex) {
  const nx = (x - center.x) / height;
  const ny = (y - center.y) / height;
  const ax = Math.abs(nx);
  const side = nx < 0 ? 'Left' : 'Right';

  // Arms. A small torso blend at the shoulder keeps the seam from tearing.
  if (ny > 0.53 && ax > 0.145) {
    const shoulder = boneIndex[side + 'Shoulder'];
    const arm = boneIndex[side + 'Arm'];
    const foreArm = boneIndex[side + 'ForeArm'];
    const hand = boneIndex[side + 'Hand'];

    if (ax < 0.22) {
      const torso = boneIndex.Spine2;
      const t = clamp01((ax - 0.145) / 0.075);
      return normalizeWeights([[torso, 1 - t], [shoulder, 0.55 * t], [arm, 0.45 * t]]);
    }
    if (ax < 0.34) return normalizeWeights(blendPair(shoulder, arm, (ax - 0.22) / 0.12));
    if (ax < 0.46) return normalizeWeights(blendPair(arm, foreArm, (ax - 0.34) / 0.12));
    return normalizeWeights(blendPair(foreArm, hand, (ax - 0.46) / 0.11));
  }

  // Head / neck / torso.
  if (ny >= 0.89) return normalizeWeights([[boneIndex.Head, 1]]);
  if (ny >= 0.83) return normalizeWeights(blendPair(boneIndex.Neck, boneIndex.Head, (ny - 0.83) / 0.06));
  if (ny >= 0.74) return normalizeWeights(blendPair(boneIndex.Spine2, boneIndex.Neck, (ny - 0.74) / 0.09));
  if (ny >= 0.65) return normalizeWeights(blendPair(boneIndex.Spine1, boneIndex.Spine2, (ny - 0.65) / 0.09));
  if (ny >= 0.56) return normalizeWeights(blendPair(boneIndex.Spine, boneIndex.Spine1, (ny - 0.56) / 0.09));

  // Pelvis and legs. Vertices close to center at the upper thigh retain a
  // pelvis contribution so skirts/hip armor do not split in the Idle pose.
  if (ny >= 0.47) {
    const leg = boneIndex[side + 'UpLeg'];
    const centerBlend = clamp01((ax - 0.015) / 0.09);
    return normalizeWeights([[boneIndex.Hips, 1 - centerBlend * 0.55], [leg, centerBlend * 0.55]]);
  }

  const upperLeg = boneIndex[side + 'UpLeg'];
  const lowerLeg = boneIndex[side + 'Leg'];
  const foot = boneIndex[side + 'Foot'];

  if (ny >= 0.24) return normalizeWeights(blendPair(upperLeg, lowerLeg, (0.47 - ny) / 0.23));
  if (ny >= 0.075) return normalizeWeights(blendPair(lowerLeg, foot, (0.24 - ny) / 0.165));
  return normalizeWeights([[foot, 1]]);
}

function makeSkeleton(bounds) {
  const height = Math.max(bounds.max.y - bounds.min.y, 0.0001);
  const width = Math.max(bounds.max.x - bounds.min.x, 0.0001);
  const centerX = (bounds.min.x + bounds.max.x) * 0.5;
  const centerZ = (bounds.min.z + bounds.max.z) * 0.5;
  const y = (ratio) => bounds.min.y + height * ratio;

  // Bone placements are in mesh-local coordinates. Their exact locations are
  // less important than a stable bind pose because Skeleton.bind() captures
  // inverse bind matrices before the retargeted animation is applied.
  const hips = addBone('Hips', null, centerX, y(0.50), centerZ);
  const spine = addBone('Spine', hips, 0, height * 0.085, 0);
  const spine1 = addBone('Spine1', spine, 0, height * 0.085, 0);
  const spine2 = addBone('Spine2', spine1, 0, height * 0.085, 0);
  const neck = addBone('Neck', spine2, 0, height * 0.095, 0);
  const head = addBone('Head', neck, 0, height * 0.075, 0);

  const shoulderOffset = Math.min(width * 0.17, height * 0.13);
  const upperArm = Math.min(width * 0.19, height * 0.14);
  const foreArm = Math.min(width * 0.18, height * 0.13);
  const handLength = Math.min(width * 0.10, height * 0.075);

  const leftShoulder = addBone('LeftShoulder', spine2, shoulderOffset, height * 0.015, 0);
  const leftArm = addBone('LeftArm', leftShoulder, upperArm, -height * 0.025, 0);
  const leftForeArm = addBone('LeftForeArm', leftArm, foreArm, -height * 0.045, 0);
  const leftHand = addBone('LeftHand', leftForeArm, handLength, -height * 0.02, 0);

  const rightShoulder = addBone('RightShoulder', spine2, -shoulderOffset, height * 0.015, 0);
  const rightArm = addBone('RightArm', rightShoulder, -upperArm, -height * 0.025, 0);
  const rightForeArm = addBone('RightForeArm', rightArm, -foreArm, -height * 0.045, 0);
  const rightHand = addBone('RightHand', rightForeArm, -handLength, -height * 0.02, 0);

  const hipOffset = Math.min(width * 0.09, height * 0.065);
  const thigh = height * 0.255;
  const shin = height * 0.235;
  const footDrop = height * 0.055;

  const leftUpLeg = addBone('LeftUpLeg', hips, hipOffset, -height * 0.025, 0);
  const leftLeg = addBone('LeftLeg', leftUpLeg, 0, -thigh, 0);
  const leftFoot = addBone('LeftFoot', leftLeg, 0, -shin, height * 0.015);
  addBone('LeftToeBase', leftFoot, 0, -footDrop, height * 0.07);

  const rightUpLeg = addBone('RightUpLeg', hips, -hipOffset, -height * 0.025, 0);
  const rightLeg = addBone('RightLeg', rightUpLeg, 0, -thigh, 0);
  const rightFoot = addBone('RightFoot', rightLeg, 0, -shin, height * 0.015);
  addBone('RightToeBase', rightFoot, 0, -footDrop, height * 0.07);

  const bones = [];
  hips.traverse((node) => { if (node.isBone) bones.push(node); });
  return { hips, bones, height, center: new THREE.Vector3(centerX, bounds.min.y, centerZ) };
}

function skinGeometry(geometry, skeletonInfo) {
  const position = geometry.getAttribute('position');
  if (!position) return false;

  geometry.computeBoundingBox();
  const bounds = geometry.boundingBox;
  if (!bounds) return false;

  const boneIndex = Object.fromEntries(skeletonInfo.bones.map((bone, index) => [bone.name, index]));
  const skinIndices = new Uint16Array(position.count * 4);
  const skinWeights = new Float32Array(position.count * 4);
  const center = new THREE.Vector3(
    (bounds.min.x + bounds.max.x) * 0.5,
    bounds.min.y,
    (bounds.min.z + bounds.max.z) * 0.5,
  );
  const height = Math.max(bounds.max.y - bounds.min.y, 0.0001);

  for (let i = 0; i < position.count; i += 1) {
    const weights = regionWeights(position.getX(i), position.getY(i), position.getZ(i), center, height, boneIndex);
    for (let slot = 0; slot < 4; slot += 1) {
      const pair = weights[slot];
      skinIndices[i * 4 + slot] = pair ? pair[0] : 0;
      skinWeights[i * 4 + slot] = pair ? pair[1] : 0;
    }
  }

  geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndices, 4));
  geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4));
  return true;
}

export function ensureRuntimeHumanoidRig(root) {
  if (!root) return { rigged: false, boneCount: 0 };

  let existingBones = 0;
  let existingSkinned = false;
  root.traverse((node) => {
    if (node.isBone) existingBones += 1;
    if (node.isSkinnedMesh) existingSkinned = true;
  });
  if (existingBones > 0 || existingSkinned) {
    return { rigged: true, generated: false, boneCount: existingBones };
  }

  const candidates = [];
  root.traverse((node) => {
    if (node.isMesh && node.geometry?.getAttribute?.('position')) candidates.push(node);
  });
  if (candidates.length !== 1) {
    return { rigged: false, generated: false, boneCount: 0, reason: 'requires-single-mesh' };
  }

  const source = candidates[0];
  source.geometry.computeBoundingBox();
  const bounds = source.geometry.boundingBox?.clone();
  if (!bounds || bounds.isEmpty()) return { rigged: false, generated: false, boneCount: 0, reason: 'missing-bounds' };

  const skeletonInfo = makeSkeleton(bounds);
  const geometry = source.geometry.clone();
  if (!skinGeometry(geometry, skeletonInfo)) {
    geometry.dispose();
    return { rigged: false, generated: false, boneCount: 0, reason: 'missing-position-data' };
  }

  const skinned = new THREE.SkinnedMesh(geometry, source.material);
  skinned.name = source.name || 'ArtemisRuntimeSkinnedMesh';
  skinned.position.copy(source.position);
  skinned.quaternion.copy(source.quaternion);
  skinned.scale.copy(source.scale);
  skinned.matrixAutoUpdate = source.matrixAutoUpdate;
  skinned.castShadow = source.castShadow;
  skinned.receiveShadow = source.receiveShadow;
  skinned.renderOrder = source.renderOrder;
  skinned.frustumCulled = false;
  skinned.userData = { ...source.userData, avatarRig: 'atomxe-runtime-autorig-v1' };

  const parent = source.parent;
  if (!parent) {
    geometry.dispose();
    return { rigged: false, generated: false, boneCount: 0, reason: 'missing-parent' };
  }

  const sourceIndex = parent.children.indexOf(source);
  parent.remove(source);
  parent.add(skinned);
  if (sourceIndex >= 0) {
    parent.children.splice(parent.children.indexOf(skinned), 1);
    parent.children.splice(sourceIndex, 0, skinned);
  }

  skinned.add(skeletonInfo.hips);
  skinned.updateMatrixWorld(true);
  const skeleton = new THREE.Skeleton(skeletonInfo.bones);
  skinned.bind(skeleton);
  skinned.normalizeSkinWeights();
  skinned.skeleton.pose();
  skinned.updateMatrixWorld(true);

  root.userData ||= {};
  root.userData.avatarRig = 'atomxe-runtime-autorig-v1';
  root.userData.runtimeRigGenerated = true;

  return {
    rigged: true,
    generated: true,
    boneCount: skeletonInfo.bones.length,
    mesh: skinned,
    skeleton,
  };
}
