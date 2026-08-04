// ─── Canonical Character Basis ─────────────────────────────────────────
// ONE rule for the whole game. Every imported model, every animation clip,
// every movement/aim/hit calculation resolves its direction through here —
// so a facing problem is fixed once at import instead of being compensated
// for in five different systems.
//
//   forward = (0, 0, -1)
//   up      = (0, 1,  0)
//   right   = (1, 0,  0)

import * as THREE from 'three';

export const CANONICAL_FORWARD = Object.freeze(new THREE.Vector3(0, 0, -1));
export const CANONICAL_UP = Object.freeze(new THREE.Vector3(0, 1, 0));
export const CANONICAL_RIGHT = Object.freeze(new THREE.Vector3(1, 0, 0));

// Standard actor height in world units — scale normalization targets this.
export const CANONICAL_ACTOR_HEIGHT = 1.8;

const _q = new THREE.Quaternion();

// Forward of an actor root, expressed in the canonical basis. Use this for
// movement, strafe, dodge and lunge — never the raw mesh direction, which
// may still carry an import correction.
export function getActorForward(actorRoot, out = new THREE.Vector3()) {
  if (!actorRoot) return out.copy(CANONICAL_FORWARD);
  actorRoot.getWorldQuaternion(_q);
  out.copy(CANONICAL_FORWARD).applyQuaternion(_q);
  out.y = 0;
  return out.lengthSq() < 1e-8 ? out.copy(CANONICAL_FORWARD) : out.normalize();
}

// Ground-plane right vector, always perpendicular to forward.
export function getActorRight(actorRoot, out = new THREE.Vector3()) {
  getActorForward(actorRoot, out);
  return out.set(-out.z, 0, out.x).normalize();
}

// Yaw the actor should hold to face a world direction.
export function yawForDirection(dir) {
  return Math.atan2(-dir.x, -dir.z);
}