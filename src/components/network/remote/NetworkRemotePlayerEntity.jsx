// Slice C — single remote player entity. Owns the THREE group, mixer,
// transform interpolator, and animator. Drives itself from a network
// state object `{ pos, rot, anim }` produced by realtimeNetwork.getRemoteState(id).

import * as THREE from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils';
import { createNetworkRemoteTransform } from './NetworkRemoteTransform';
import { createNetworkRemoteAnimator } from './NetworkRemoteAnimator';

export function createNetworkRemotePlayerEntity({ id, scene, cachedFBX, clipMap, initialState }) {
  // Deep-clone the cached SkinnedMesh model with SkeletonUtils so bones come along.
  const model = SkeletonUtils.clone(cachedFBX);
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  const scale = 1.7 / maxDim;
  model.scale.setScalar(scale);

  // Spawn at the first known position so we don't lerp in from the origin.
  const p = initialState?.pos || { x: 0, y: 0.3, z: 0 };
  const r = initialState?.rot || { y: 0 };
  model.position.set(p.x, p.y, p.z);
  model.rotation.y = r.y || 0;

  model.traverse((node) => {
    if (node.isMesh) {
      node.castShadow = !node.isSkinnedMesh;
      node.receiveShadow = true;
      node.userData.remotePlayerId = id;
      node.userData.networkRemote = true;
    }
  });

  // Green ring to distinguish authoritative remotes from legacy WebRTC remotes (blue).
  const ringGeo = new THREE.RingGeometry(0.7 / scale, 0.9 / scale, 24);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x22c55e,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.55,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.02 / scale;
  model.add(ring);

  scene.add(model);

  const mixer = new THREE.AnimationMixer(model);
  const animator = createNetworkRemoteAnimator(mixer, clipMap);
  animator.play('idle');

  const xform = createNetworkRemoteTransform(model);
  if (initialState?.pos) {
    xform.setTarget(initialState.pos, initialState.rot?.y || 0);
  }

  function applyState(state) {
    if (!state) return;
    if (state.pos) xform.setTarget(state.pos, state.rot?.y || 0);
    if (state.anim) animator.play(state.anim);
  }

  function update(dt) {
    xform.update(dt);
    animator.update(dt);
  }

  function dispose() {
    try { animator.dispose(); } catch {}
    try { scene.remove(model); } catch {}
    // Free GPU memory — only dispose geometries/materials that we own.
    try { ringGeo.dispose(); } catch {}
    try { ringMat.dispose(); } catch {}
    // Note: cloned skinned-mesh geometry/material is shared with the cache by SkeletonUtils.clone.
  }

  function getGroup() { return model; }
  function getStatus() { return { id, transform: xform.getStatus(), anim: animator.getCurrent() }; }

  return { id, applyState, update, dispose, getGroup, getStatus };
}