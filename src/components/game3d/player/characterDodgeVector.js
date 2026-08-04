import * as THREE from 'three';

// Dodge direction is CHARACTER-relative, never camera-relative.
// Camera yaw/pitch have ZERO influence here: forward/back come from the body's
// own facing (flattened to the ground plane) and left/right come from the
// perpendicular of that facing. So "dodge left" always goes to the character's
// left side, whatever angle the camera happens to be looking from.
//
// Facing convention in this world: the player model is yawed with
// setFromAxisAngle(up, atan2(moveX, moveZ)), so the body's forward is
// (sin yaw, 0, cos yaw) — NOT three.js' default -Z. Right is derived to match
// the same basis the movement code uses for A/D, so dodge and strafe agree.

const _forward = new THREE.Vector3();
const _right = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _euler = new THREE.Euler();

export function getCharacterPlanarVectors(facingSource) {
  // Read the body's world yaw (works whether the root or the mesh is rotated,
  // as long as facingSource is the object that visually turns).
  facingSource.updateWorldMatrix?.(true, false);
  _euler.setFromQuaternion(
    facingSource.getWorldQuaternion
      ? facingSource.getWorldQuaternion(new THREE.Quaternion())
      : facingSource.quaternion,
    'YXZ',
  );
  const yaw = _euler.y;
  _forward.set(Math.sin(yaw), 0, Math.cos(yaw));
  _right.set(-Math.cos(yaw), 0, -Math.sin(yaw));
  return { forward: _forward, right: _right };
}

// input: { forward, backward, left, right } booleans (WASD).
// Returns { direction, vector } — vector is a fresh Vector3, safe to keep.
export function getCharacterDodge(facingSource, input) {
  const { forward, right } = getCharacterPlanarVectors(facingSource);

  _dir.set(0, 0, 0);
  if (input.forward) _dir.add(forward);
  if (input.backward) _dir.sub(forward);
  if (input.right) _dir.add(right);
  if (input.left) _dir.sub(right);

  _dir.y = 0;
  if (_dir.lengthSq() === 0) _dir.copy(forward);
  else _dir.normalize();

  const direction = input.left ? 'left'
    : input.right ? 'right'
    : input.backward ? 'backward'
    : 'forward';

  return { direction, vector: _dir.clone() };
}