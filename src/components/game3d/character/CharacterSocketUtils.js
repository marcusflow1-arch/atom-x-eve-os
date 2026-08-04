// ─── Character Socket Utils ────────────────────────────────────────────
// Sockets are the contract between animation and gameplay: the weapon hangs
// off the hand socket, bullets leave the muzzle socket, melee traces sweep
// the weapon tip. Rig naming varies wildly (Mixamo prefixes, DCC exports),
// so every lookup goes through here with aliases + a cache, and a missing
// socket degrades loudly instead of silently disabling a gameplay system.

import * as THREE from 'three';

const SOCKET_ALIASES = {
  RightHand: ['RightHandSocket', 'mixamorigRightHand', 'RightHand', 'hand_r', 'Bip01_R_Hand'],
  LeftHand: ['LeftHandSocket', 'mixamorigLeftHand', 'LeftHand', 'hand_l', 'Bip01_L_Hand'],
  Head: ['HeadSocket', 'mixamorigHead', 'Head', 'head'],
  Hips: ['mixamorigHips', 'Hips', 'pelvis', 'root'],
  WeaponGrip: ['WeaponGrip', 'GripSocket', 'weapon_grip'],
  WeaponTip: ['WeaponTip', 'TipSocket', 'weapon_tip', 'blade_tip'],
  Muzzle: ['Muzzle', 'MuzzleSocket', 'muzzle', 'barrel_end', 'MuzzleFlash'],
  CameraAnchor: ['CameraAnchor', 'camera_anchor', 'HeadSocket'],
  FootLeft: ['mixamorigLeftFoot', 'LeftFoot', 'foot_l'],
  FootRight: ['mixamorigRightFoot', 'RightFoot', 'foot_r'],
};

const _v = new THREE.Vector3();
const _q = new THREE.Quaternion();

function cacheOf(root) {
  if (!root.userData.__socketCache) root.userData.__socketCache = new Map();
  return root.userData.__socketCache;
}

/** Resolve a logical socket name to a node on the rig, or null. */
export function getSocket(root, logicalName) {
  if (!root || !logicalName) return null;
  const cache = cacheOf(root);
  if (cache.has(logicalName)) {
    const cached = cache.get(logicalName);
    if (cached && cached.parent !== null) return cached;
  }
  const candidates = [logicalName, ...(SOCKET_ALIASES[logicalName] || [])];
  for (const name of candidates) {
    const hit = root.getObjectByName(name);
    if (hit) { cache.set(logicalName, hit); return hit; }
  }
  // Last resort: case-insensitive contains match.
  const needle = logicalName.toLowerCase();
  let fuzzy = null;
  root.traverse((o) => { if (!fuzzy && o.name && o.name.toLowerCase().includes(needle)) fuzzy = o; });
  cache.set(logicalName, fuzzy);
  if (!fuzzy) console.warn(`[Sockets] "${logicalName}" not found on ${root.name || 'rig'}`);
  return fuzzy;
}

export function getSocketWorldPosition(root, logicalName, out = new THREE.Vector3()) {
  const socket = getSocket(root, logicalName);
  if (!socket) return out.set(0, 0, 0);
  return socket.getWorldPosition(out);
}

export function getSocketWorldQuaternion(root, logicalName, out = new THREE.Quaternion()) {
  const socket = getSocket(root, logicalName);
  if (!socket) return out.identity();
  return socket.getWorldQuaternion(out);
}

/** Attach a weapon to a hand socket, keeping the weapon's own local offset. */
export function attachToSocket(root, logicalName, object, { position, rotation, scale } = {}) {
  const socket = getSocket(root, logicalName);
  if (!socket) return false;
  socket.add(object);
  if (position) object.position.set(position.x, position.y, position.z);
  if (rotation) object.rotation.set(rotation.x, rotation.y, rotation.z);
  if (scale != null) object.scale.setScalar(scale);
  return true;
}

/**
 * Shot origin + direction for a firearm: the bullet LEAVES THE MUZZLE but
 * still travels toward what the player is aiming at — the fix for "the gun
 * points one way and the hit logic fires another".
 */
export function getMuzzleRay(root, aimTarget, socketName = 'Muzzle') {
  const origin = getSocketWorldPosition(root, socketName, new THREE.Vector3());
  const direction = new THREE.Vector3();
  if (aimTarget) direction.subVectors(aimTarget, origin);
  if (direction.lengthSq() < 1e-8) {
    getSocketWorldQuaternion(root, socketName, _q);
    direction.set(0, 0, -1).applyQuaternion(_q);
  }
  return { origin, direction: direction.normalize() };
}

/** Report which expected sockets exist — run this once after import. */
export function verifySockets(root, required = ['RightHand', 'WeaponTip', 'Head']) {
  const report = { ok: true, found: [], missing: [] };
  for (const name of required) {
    if (getSocket(root, name)) report.found.push(name);
    else { report.missing.push(name); report.ok = false; }
  }
  return report;
}

/** Small spheres at socket positions, for the debug overlay. */
export function createSocketMarkers(root, names, { size = 0.045, color = 0x00ffcc } = {}) {
  const group = new THREE.Group();
  group.name = 'SocketMarkers';
  const geo = new THREE.SphereGeometry(size, 8, 6);
  const mat = new THREE.MeshBasicMaterial({ color, depthTest: false });
  const entries = [];
  for (const name of names) {
    const socket = getSocket(root, name);
    if (!socket) continue;
    const mesh = new THREE.Mesh(geo, mat);
    mesh.renderOrder = 999;
    group.add(mesh);
    entries.push({ name, socket, mesh });
  }
  const update = () => {
    for (const e of entries) e.mesh.position.copy(e.socket.getWorldPosition(_v));
  };
  const dispose = () => { geo.dispose(); mat.dispose(); group.removeFromParent(); };
  return { group, entries, update, dispose };
}