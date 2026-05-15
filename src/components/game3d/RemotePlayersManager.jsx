import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils';

/**
 * RemotePlayersManager — renders other players in the shared game world.
 *
 * Listens to `multiplayerPlayersUpdate` (broadcast by MultiplayerSystem) and
 * `webrtcMovementUpdate` (real-time positions), and renders a simple
 * archer-model avatar for each remote player in the scene.
 *
 * Exposes refs via the `register` prop so GameWorld3D's raycaster can detect
 * clicks on remote-player meshes for the interaction menu.
 */

const REMOTE_ARCHER_URL =
  'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/3f915913a_ErikaArcher.fbx';
const IDLE_URL =
  'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/9922e6dd0_Idle.fbx';
const RUN_URL =
  'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/4edd51169_Running.fbx';

// Cache shared assets across all remote-player instances
let cachedArcherFBX = null;
let cachedIdleClip = null;
let cachedRunClip = null;
const loader = new FBXLoader();

const loadOnce = (url, isAnim = false) =>
  new Promise((resolve, reject) => {
    loader.load(url, (fbx) => resolve(isAnim ? fbx.animations?.[0] : fbx), undefined, reject);
  });

export function createRemotePlayersManager(scene) {
  const remotes = new Map(); // playerId -> { group, mixer, idleAction, runAction, current, targetPos, targetYaw, lastUpdate, name }
  const clock = new THREE.Clock();

  let assetsReady = false;
  const pending = [];

  Promise.all([
    cachedArcherFBX ? Promise.resolve(cachedArcherFBX) : loadOnce(REMOTE_ARCHER_URL).then((f) => (cachedArcherFBX = f)),
    cachedIdleClip ? Promise.resolve(cachedIdleClip) : loadOnce(IDLE_URL, true).then((c) => (cachedIdleClip = c)),
    cachedRunClip ? Promise.resolve(cachedRunClip) : loadOnce(RUN_URL, true).then((c) => (cachedRunClip = c)),
  ])
    .then(() => {
      assetsReady = true;
      pending.forEach((fn) => fn());
      pending.length = 0;
    })
    .catch((e) => console.error('Remote-player asset load error:', e));

  const spawnRemote = (player) => {
    if (!assetsReady) {
      pending.push(() => spawnRemote(player));
      return;
    }
    if (remotes.has(player.player_id)) return;

    // Deep-clone the cached FBX using SkeletonUtils — required for SkinnedMesh
    // models so the skeleton/bones are also cloned (plain .clone(true) leaves
    // skinned meshes invisible because they still reference the original bones).
    const fbx = SkeletonUtils.clone(cachedArcherFBX);
    const box = new THREE.Box3().setFromObject(fbx);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 1.7 / maxDim;
    fbx.scale.setScalar(scale);
    fbx.position.set(player.x || 0, player.y || 0.3, player.z || 0);
    fbx.rotation.y = player.yaw || 0;

    // Render remote players in their natural colors; only the ring below
    // their feet identifies them as remote players.
    fbx.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = !node.isSkinnedMesh;
        node.receiveShadow = true;
        node.userData.remotePlayerId = player.player_id;
        node.userData.remotePlayerName = player.display_name || 'Player';
      }
    });

    // Friendly blue ring under remote players
    const ringGeo = new THREE.RingGeometry(0.7 / scale, 0.9 / scale, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x3b82f6,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.55,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02 / scale;
    fbx.add(ring);

    scene.add(fbx);

    const mixer = new THREE.AnimationMixer(fbx);
    const idleAction = mixer.clipAction(cachedIdleClip);
    const runAction = mixer.clipAction(cachedRunClip);
    idleAction.play();

    remotes.set(player.player_id, {
      group: fbx,
      mixer,
      idleAction,
      runAction,
      current: 'idle',
      targetPos: new THREE.Vector3(player.x || 0, player.y || 0.3, player.z || 0),
      targetYaw: player.yaw || 0,
      lastUpdate: Date.now(),
      name: player.display_name || 'Player',
    });
  };

  const removeRemote = (playerId) => {
    const r = remotes.get(playerId);
    if (!r) return;
    scene.remove(r.group);
    r.mixer.stopAllAction();
    remotes.delete(playerId);
  };

  const updateRemote = (player) => {
    const r = remotes.get(player.player_id);
    if (!r) {
      spawnRemote(player);
      return;
    }
    if (typeof player.x === 'number') r.targetPos.x = player.x;
    if (typeof player.y === 'number') r.targetPos.y = player.y;
    if (typeof player.z === 'number') r.targetPos.z = player.z;
    if (typeof player.yaw === 'number') r.targetYaw = player.yaw;
    r.lastUpdate = Date.now();
    if (player.display_name) r.name = player.display_name;

    // Switch idle/run based on `anim` field
    const wantRun = player.anim === 'run' || player.anim === 'walk';
    const target = wantRun ? 'run' : 'idle';
    if (r.current !== target) {
      const next = target === 'run' ? r.runAction : r.idleAction;
      const prev = target === 'run' ? r.idleAction : r.runAction;
      next.reset().fadeIn(0.2).play();
      prev.fadeOut(0.2);
      r.current = target;
    }
  };

  // Update positions/animations every frame; called from GameWorld3D animate loop
  const update = (delta) => {
    remotes.forEach((r) => {
      r.mixer.update(delta);
      // Smoothly lerp toward target position
      r.group.position.lerp(r.targetPos, 0.25);
      // Smooth yaw rotation
      const targetQ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), r.targetYaw);
      r.group.quaternion.slerp(targetQ, 0.18);
    });
  };

  // Returns all meshes that belong to remote players (for raycasting)
  const getMeshes = () => {
    const out = [];
    remotes.forEach((r) => r.group.traverse((n) => { if (n.isMesh) out.push(n); }));
    return out;
  };

  const getRemotes = () => remotes;

  // Event listeners
  const onPlayersUpdate = (e) => {
    const players = e.detail?.players || [];
    const seen = new Set();
    players.forEach((p) => {
      seen.add(p.player_id);
      updateRemote(p);
    });
    // Despawn anyone not in the latest update
    remotes.forEach((_, id) => { if (!seen.has(id)) removeRemote(id); });
  };
  const onMovement = (e) => { if (e.detail) updateRemote(e.detail); };

  window.addEventListener('multiplayerPlayersUpdate', onPlayersUpdate);
  window.addEventListener('webrtcMovementUpdate', onMovement);

  const dispose = () => {
    window.removeEventListener('multiplayerPlayersUpdate', onPlayersUpdate);
    window.removeEventListener('webrtcMovementUpdate', onMovement);
    remotes.forEach((_, id) => removeRemote(id));
  };

  return { update, getMeshes, getRemotes, dispose };
}