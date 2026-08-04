// ─── Socket-Swept Hit Detection ────────────────────────────────────────
// A swing is an arc, so testing a single sphere at a single instant makes
// fast attacks whiff. Each frame of an active hit window we sweep the
// segment the weapon socket travelled (previous → current world position)
// and test that segment against every target, applying damage at most once
// per target per hit window.

import * as THREE from 'three';

const _curr = new THREE.Vector3();
const _prev = new THREE.Vector3();
const _seg = new THREE.Vector3();
const _toPoint = new THREE.Vector3();
const _target = new THREE.Vector3();

// Shortest distance from a point to the segment a→b.
export function distancePointToSegment(point, a, b) {
  _seg.subVectors(b, a);
  const lenSq = _seg.lengthSq();
  if (lenSq < 1e-8) return point.distanceTo(a);
  _toPoint.subVectors(point, a);
  const t = Math.min(1, Math.max(0, _toPoint.dot(_seg) / lenSq));
  return point.distanceTo(_toPoint.copy(a).addScaledVector(_seg, t));
}

// Resolve the attack socket, tolerating the usual rig naming variations.
// Falls back to the model root so a missing bone degrades instead of
// silently disabling all damage.
export function resolveSocket(model, socketName) {
  if (!model) return null;
  if (socketName) {
    const direct = model.getObjectByName(socketName);
    if (direct) return direct;
    const lower = socketName.toLowerCase();
    let fuzzy = null;
    model.traverse((o) => {
      if (!fuzzy && o.name && o.name.toLowerCase().includes(lower)) fuzzy = o;
    });
    if (fuzzy) return fuzzy;
  }
  return model;
}

// Clear cached socket traces so a fresh window starts a fresh sweep.
export function resetSocketTrace(model, socketName) {
  const socket = resolveSocket(model, socketName);
  if (socket?.userData) socket.userData.prevWorldPos = null;
}

/**
 * Run one frame of detection for an active hit window.
 *
 * ctx: {
 *   targets: iterable of { id, alive, group|object3D|position },
 *   applyHit(target, info) -> void
 * }
 * hitRegistry: Set of target ids already hit inside THIS window.
 */
export function runSocketTrace({ model, windowDef, hitRegistry, ctx, meta }) {
  const socket = resolveSocket(model, windowDef.socket);
  if (!socket || !ctx?.targets) return 0;

  socket.getWorldPosition(_curr);
  if (!socket.userData.prevWorldPos) socket.userData.prevWorldPos = _curr.clone();
  _prev.copy(socket.userData.prevWorldPos);

  let hits = 0;
  for (const target of ctx.targets) {
    if (!target || target.alive === false) continue;
    if (hitRegistry.has(target.id)) continue;
    const node = target.group || target.object3D || target.model || target;
    if (node.getWorldPosition) node.getWorldPosition(_target);
    else if (node.position) _target.copy(node.position);
    else continue;

    const reach = windowDef.radius + (target.hurtRadius || 0);
    if (distancePointToSegment(_target, _prev, _curr) <= reach) {
      hitRegistry.add(target.id);
      hits += 1;
      ctx.applyHit?.(target, {
        ...meta,
        damageScale: windowDef.damageScale ?? 1,
        hitStun: windowDef.hitStun ?? 0,
        knockback: windowDef.knockback ?? 0,
        socket: windowDef.socket,
        contactPoint: _curr.clone(),
      });
    }
  }

  socket.userData.prevWorldPos.copy(_curr);
  return hits;
}