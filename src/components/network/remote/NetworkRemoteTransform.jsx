// Slice C — interpolation + extrapolation utility for a single remote player.
// Wraps a THREE.Object3D and smoothly drives its position + yaw toward
// the latest network-provided target. Survives packet loss via short
// linear extrapolation (capped) and recovers cleanly when new data arrives.

import * as THREE from 'three';

const EXTRAPOLATION_MAX_MS = 250; // never extrapolate beyond this without a new sample
const POS_LERP = 0.5;             // matches the legacy RemotePlayersManager feel
const YAW_SLERP = 0.4;

const _q = new THREE.Quaternion();
const _yAxis = new THREE.Vector3(0, 1, 0);

export function createNetworkRemoteTransform(group) {
  const targetPos = new THREE.Vector3();
  const lastPos = new THREE.Vector3();
  const velocity = new THREE.Vector3();
  let targetYaw = 0;
  let lastUpdateMs = 0;
  let initialized = false;

  function setTarget(pos, yaw) {
    const now = performance.now();
    if (initialized) {
      const dt = (now - lastUpdateMs) / 1000;
      if (dt > 0.001) {
        velocity.set(
          (pos.x - targetPos.x) / dt,
          (pos.y - targetPos.y) / dt,
          (pos.z - targetPos.z) / dt
        );
      }
    } else {
      // First sample — teleport to avoid initial lerp from origin.
      group.position.set(pos.x, pos.y, pos.z);
      group.quaternion.setFromAxisAngle(_yAxis, yaw);
      velocity.set(0, 0, 0);
      initialized = true;
    }
    lastPos.copy(targetPos);
    targetPos.set(pos.x, pos.y, pos.z);
    targetYaw = yaw;
    lastUpdateMs = now;
  }

  function update(/* dt seconds */) {
    if (!initialized) return;
    const ageMs = performance.now() - lastUpdateMs;

    let aimX = targetPos.x;
    let aimY = targetPos.y;
    let aimZ = targetPos.z;

    // Extrapolate if we're hungry for fresh data, but cap the extrapolation
    // window so a long pause doesn't shoot the avatar off into the distance.
    if (ageMs > 0 && ageMs < EXTRAPOLATION_MAX_MS) {
      const extraS = ageMs / 1000;
      aimX += velocity.x * extraS * 0.5; // soften extrapolation (×0.5)
      aimY += velocity.y * extraS * 0.5;
      aimZ += velocity.z * extraS * 0.5;
    }

    group.position.lerp({ x: aimX, y: aimY, z: aimZ }, POS_LERP);
    _q.setFromAxisAngle(_yAxis, targetYaw);
    group.quaternion.slerp(_q, YAW_SLERP);
  }

  function getStatus() {
    return {
      ageMs: initialized ? performance.now() - lastUpdateMs : -1,
      targetPos: { x: targetPos.x, y: targetPos.y, z: targetPos.z },
      velocity: { x: velocity.x, y: velocity.y, z: velocity.z },
    };
  }

  return { setTarget, update, getStatus };
}