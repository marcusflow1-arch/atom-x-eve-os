// Slice C — manages the lifecycle of network-authoritative remote players.
// Pure JS class-style factory; no React. Mounted by NetworkRemotesMount.jsx.
//
// Reads remote IDs from realtimeNetwork on every tick, spawns/despawns entities
// to match, and forwards each entity's latest state. The local player's own id
// is filtered out automatically.

import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { realtimeNetwork } from '@/components/network/realtimeNetworkManager';
import { createNetworkRemotePlayerEntity } from './NetworkRemotePlayerEntity';

// Reuse the same archer + animation URLs as the legacy system so visual parity
// is guaranteed. Cached at module scope across mounts.
const ARCHER_URL =
  'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/3f915913a_ErikaArcher.fbx';
const ANIM_URLS = {
  idle:  'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/9922e6dd0_Idle.fbx',
  run:   'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/4edd51169_Running.fbx',
  jump:  'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/b1e388a25_Jumping.fbx',
};

let cachedFBX = null;
const cachedClips = {}; // name -> AnimationClip
let assetsPromise = null;

function loadAssetsOnce() {
  if (assetsPromise) return assetsPromise;
  const loader = new FBXLoader();
  const loadModel = () => new Promise((res, rej) => loader.load(ARCHER_URL, res, undefined, rej));
  const loadClip = (url) => new Promise((res) => loader.load(url, (fbx) => res(fbx.animations?.[0] || null), undefined, () => res(null)));
  assetsPromise = Promise.all([
    loadModel(),
    loadClip(ANIM_URLS.idle),
    loadClip(ANIM_URLS.run),
    loadClip(ANIM_URLS.jump),
  ]).then(([fbx, idle, run, jump]) => {
    cachedFBX = fbx;
    if (idle) cachedClips.idle = idle;
    if (run)  { cachedClips.run = run; cachedClips.walk = run; } // share clip — server's 'walk' uses same anim
    if (jump) { cachedClips.jump = jump; cachedClips.fall = jump; }
  }).catch((e) => {
    console.error('[NetworkRemotes] asset load failed:', e);
  });
  return assetsPromise;
}

export function createNetworkRemotesManager(scene) {
  const entities = new Map(); // id -> entity
  let assetsReady = false;
  let disposed = false;
  const pendingSpawns = []; // ids waiting for assets

  loadAssetsOnce().then(() => {
    if (disposed) return;
    assetsReady = !!cachedFBX;
    if (assetsReady) {
      pendingSpawns.splice(0).forEach((id) => spawnEntity(id));
    }
  });

  function spawnEntity(id) {
    if (disposed) return;
    if (entities.has(id)) return; // duplicate prevention
    if (!assetsReady || !cachedFBX) {
      if (!pendingSpawns.includes(id)) pendingSpawns.push(id);
      return;
    }
    const initialState = realtimeNetwork.getRemoteState(id);
    const entity = createNetworkRemotePlayerEntity({
      id, scene, cachedFBX, clipMap: cachedClips, initialState,
    });
    entities.set(id, entity);
  }

  function despawnEntity(id) {
    const e = entities.get(id);
    if (!e) return;
    try { e.dispose(); } catch (err) { console.warn('[NetworkRemotes] dispose failed:', err); }
    entities.delete(id);
  }

  // Called every frame from a single RAF loop owned by NetworkRemotesMount.
  function update(dt) {
    if (disposed) return;

    const myId = realtimeNetwork.status().id;
    const ids = realtimeNetwork.getRemoteIds(); // already excludes local player
    const seen = new Set();

    for (const id of ids) {
      if (id === myId) continue; // belt + suspenders
      seen.add(id);
      if (!entities.has(id)) {
        spawnEntity(id);
      } else {
        const state = realtimeNetwork.getRemoteState(id);
        if (state) entities.get(id).applyState(state);
      }
    }

    // Despawn entities not in the current id set.
    for (const id of Array.from(entities.keys())) {
      if (!seen.has(id)) despawnEntity(id);
    }

    // Tick remaining entities (transform + animation).
    entities.forEach((e) => e.update(dt));
  }

  function getEntities() { return entities; }

  function getDebugSnapshot() {
    const out = [];
    entities.forEach((e) => {
      const group = e.getGroup();
      const status = e.getStatus();
      out.push({
        id: e.id,
        x: group.position.x, y: group.position.y, z: group.position.z,
        snapshotAgeMs: status.transform.ageMs,
        anim: status.anim,
      });
    });
    return out;
  }

  function dispose() {
    disposed = true;
    entities.forEach((_, id) => despawnEntity(id));
    pendingSpawns.length = 0;
  }

  return { update, getEntities, getDebugSnapshot, dispose };
}