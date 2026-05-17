// RemoteCompanionManager — spawns and animates each remote player's
// companion (mount) in the shared 3D scene.
//
// One companion instance is created PER remote player_id, keyed by player id +
// companion id, so two players using the same companion type each get their
// own distinct instance with its own mixer/state.
//
// Driven by `remoteCompanionUpdate` events that MultiplayerSystem dispatches
// from the WebRTC movement payload. Each update carries:
//   { player_id, companion_id, mounted, x, y, z, yaw, anim, level }
//
// When `mounted` is true, the companion is positioned at the player's spot
// and the corresponding remote player's mesh is hidden (so it visually looks
// like that player is riding their companion).

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils';
import { getCompanionById, createCompanionLoadingManager } from './companionData';
import { loadCompanionFolderClips } from './companionAnimationLoader';

// Cache the loaded companion model + clips per-definition so we don't re-fetch
// from the network for every remote player. The GLTF scene is cloned (via
// SkeletonUtils) for each instance so each player gets a unique posable mesh.
const companionCache = new Map(); // companionId -> { root, clips }

const fbxLoader = new FBXLoader();

const loadCompanionAssets = async (companionDef) => {
  if (companionCache.has(companionDef.id)) return companionCache.get(companionDef.id);

  const manager = createCompanionLoadingManager(THREE, companionDef);
  const gltfLoader = manager ? new GLTFLoader(manager) : new GLTFLoader();

  const root = await new Promise((resolve, reject) => {
    gltfLoader.load(
      companionDef.modelUrl,
      (gltf) => resolve(gltf.scene || gltf.scenes?.[0]),
      undefined,
      reject,
    );
  });

  let clips = root?.animations || [];
  if (!clips || clips.length === 0) {
    // Mesh-only GLB → pull clips from the admin AnimationFBX library folder
    try { clips = await loadCompanionFolderClips(fbxLoader); } catch { clips = []; }
  }

  const entry = { root, clips };
  companionCache.set(companionDef.id, entry);
  return entry;
};

export function createRemoteCompanionManager(scene) {
  // playerId -> { group, mixer, idleAction, walkAction, runAction, current,
  //               targetPos, targetYaw, mounted, companionId, level }
  const instances = new Map();

  const buildInstance = async (playerId, companionId) => {
    const def = getCompanionById(companionId);
    if (!def) return null;
    let assets;
    try { assets = await loadCompanionAssets(def); }
    catch (e) { console.error('[RemoteCompanion] load error', e); return null; }
    if (!assets?.root) return null;

    // Per-player clone — SkeletonUtils handles SkinnedMesh skeleton cloning
    const group = SkeletonUtils.clone(assets.root);
    const box = new THREE.Box3().setFromObject(group);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const compScale = (1.7 / maxDim) * (def.scale || 1.0);
    group.scale.setScalar(compScale);

    group.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = !node.isSkinnedMesh;
        node.receiveShadow = true;
      }
    });

    // Soft amber ring under remote companions
    const ringGeo = new THREE.RingGeometry(0.8 / compScale, 1.05 / compScale, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24, side: THREE.DoubleSide, transparent: true, opacity: 0.45,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02 / compScale;
    group.add(ring);

    scene.add(group);

    // Bind clips
    const mixer = new THREE.AnimationMixer(group);
    const findClip = (substr) => {
      if (!substr) return null;
      const lc = substr.toLowerCase();
      return assets.clips.find((c) => (c.name || '').toLowerCase().includes(lc)) || null;
    };
    const idleClip = findClip(def.idleClipName) || assets.clips[0];
    const walkClip = findClip(def.walkClipName) || assets.clips[1] || assets.clips[0];
    const runClip  = findClip(def.runClipName)  || assets.clips[2] || null;
    const idleAction = idleClip ? mixer.clipAction(idleClip) : null;
    const walkAction = (walkClip && walkClip !== idleClip) ? mixer.clipAction(walkClip) : null;
    const runAction  = (runClip && runClip !== idleClip && runClip !== walkClip) ? mixer.clipAction(runClip) : null;
    if (idleAction) idleAction.reset().fadeIn(0.2).play();

    return {
      group, mixer, idleAction, walkAction, runAction,
      current: 'idle',
      targetPos: new THREE.Vector3(),
      targetYaw: 0,
      mounted: false,
      companionId,
      level: 1,
    };
  };

  const ensureInstance = (playerId, companionId) => {
    const existing = instances.get(playerId);
    if (existing && existing.companionId === companionId) {
      // Skip duplicate builds while the original is still loading
      if (existing.loading) return Promise.resolve(null);
      return Promise.resolve(existing);
    }
    // If companion changed, remove the old instance first
    if (existing) removeInstance(playerId);
    // Reserve the slot so multiple updates don't trigger duplicate loads
    instances.set(playerId, { loading: true, companionId });
    return buildInstance(playerId, companionId).then((inst) => {
      if (!inst) { instances.delete(playerId); return null; }
      // It's possible the player was removed while we were loading — drop in that case
      const slot = instances.get(playerId);
      if (!slot || slot.companionId !== companionId) {
        scene.remove(inst.group); inst.mixer.stopAllAction();
        return null;
      }
      instances.set(playerId, inst);
      return inst;
    });
  };

  const removeInstance = (playerId) => {
    const inst = instances.get(playerId);
    if (!inst) return;
    if (inst.group) scene.remove(inst.group);
    if (inst.mixer) inst.mixer.stopAllAction();
    instances.delete(playerId);
  };

  const setAnim = (inst, target) => {
    if (inst.current === target) return;
    const next = target === 'run' ? inst.runAction : target === 'walk' ? inst.walkAction : inst.idleAction;
    if (!next) return;
    const prev = inst.current === 'run' ? inst.runAction : inst.current === 'walk' ? inst.walkAction : inst.idleAction;
    next.reset().fadeIn(0.2).play();
    if (prev && prev !== next) prev.fadeOut(0.2);
    inst.current = target;
  };

  // Apply an update from the network
  const onUpdate = (e) => {
    const d = e.detail; if (!d || !d.player_id || !d.companion_id) return;
    ensureInstance(d.player_id, d.companion_id).then((inst) => {
      if (!inst || inst.loading || !inst.targetPos) return;
      if (typeof d.x === 'number') inst.targetPos.x = d.x;
      if (typeof d.y === 'number') inst.targetPos.y = d.y;
      if (typeof d.z === 'number') inst.targetPos.z = d.z;
      if (typeof d.yaw === 'number') inst.targetYaw = d.yaw;
      inst.mounted = !!d.mounted;
      if (typeof d.level === 'number') inst.level = d.level;
      const target = d.anim === 'run' ? 'run' : d.anim === 'walk' ? 'walk' : 'idle';
      setAnim(inst, target);
    });
  };

  // When a remote player disappears, despawn their companion too.
  // We piggyback on the same multiplayerPlayersUpdate event for cleanup.
  const onPlayersUpdate = (e) => {
    const players = e.detail?.players || [];
    const alive = new Set(players.map((p) => p.player_id));
    instances.forEach((_, pid) => { if (!alive.has(pid)) removeInstance(pid); });
  };

  window.addEventListener('remoteCompanionUpdate', onUpdate);
  window.addEventListener('multiplayerPlayersUpdate', onPlayersUpdate);

  // Called every frame from GameWorld3D's animate loop
  const update = (delta) => {
    instances.forEach((inst) => {
      if (!inst || inst.loading || !inst.group) return;
      inst.mixer.update(delta);
      inst.group.position.lerp(inst.targetPos, 0.5);
      const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), inst.targetYaw);
      inst.group.quaternion.slerp(q, 0.4);
    });
  };

  // Returns the set of remote player IDs whose companions are currently
  // mounted. GameWorld3D uses this to hide the rider's mesh.
  const getMountedPlayerIds = () => {
    const out = new Set();
    instances.forEach((inst, pid) => { if (inst && inst.mounted) out.add(pid); });
    return out;
  };

  const dispose = () => {
    window.removeEventListener('remoteCompanionUpdate', onUpdate);
    window.removeEventListener('multiplayerPlayersUpdate', onPlayersUpdate);
    instances.forEach((_, pid) => removeInstance(pid));
  };

  return { update, dispose, getMountedPlayerIds };
}