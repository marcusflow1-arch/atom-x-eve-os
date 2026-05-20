import * as THREE from 'three';

const tmpCamera = new THREE.Vector3();
const tmpTarget = new THREE.Vector3();
const tmpToTarget = new THREE.Vector3();

export class PlayerCameraSystem {
  constructor({ camera, orbit, modelRef, lockOnTargetRef }) {
    this.camera = camera;
    this.orbit = orbit;
    this.modelRef = modelRef;
    this.lockOnTargetRef = lockOnTargetRef;
    this.combatDistance = 5.2;
    this.defaultDistance = 4.5;
  }

  update(delta, movementIntent) {
    const model = this.modelRef.current;
    if (!model) return;

    const o = this.orbit.current;
    const lockedTarget = this.lockOnTargetRef.current;
    if (lockedTarget?.group && (!lockedTarget.aliveRef || lockedTarget.aliveRef())) {
      const targetPos = lockedTarget.group.position;
      tmpToTarget.set(targetPos.x - model.position.x, 0, targetPos.z - model.position.z);
      const pairDistance = tmpToTarget.length();
      if (pairDistance > 0.001) {
        tmpToTarget.normalize();
        const lockYaw = Math.atan2(-tmpToTarget.x, -tmpToTarget.z);
        const yawDelta = Math.atan2(Math.sin(lockYaw - o.yaw), Math.cos(lockYaw - o.yaw));
        o.yaw += yawDelta * Math.min(1, 6 * delta);
      }
      const dynamicDistance = THREE.MathUtils.clamp(pairDistance * 0.55 + this.combatDistance, 5.5, 10.5);
      tmpTarget.addVectors(model.position, targetPos).multiplyScalar(0.5);
      tmpTarget.y += 1.35;
      tmpCamera.set(
        tmpTarget.x - tmpToTarget.x * dynamicDistance,
        tmpTarget.y + 1.6,
        tmpTarget.z - tmpToTarget.z * dynamicDistance,
      );
      this.camera.position.lerp(tmpCamera, Math.min(1, 6 * delta));
      this.camera.lookAt(tmpTarget);
      return;
    }

    if (lockedTarget) this.lockOnTargetRef.current = null;
    const sprintPullback = movementIntent.sprintHeld ? 0.75 : 0;
    const distance = o.distance + sprintPullback;
    tmpCamera.set(
      model.position.x + distance * Math.sin(o.yaw) * Math.cos(o.pitch),
      model.position.y + 1 + distance * Math.sin(o.pitch),
      model.position.z + distance * Math.cos(o.yaw) * Math.cos(o.pitch),
    );
    this.camera.position.lerp(tmpCamera, Math.min(1, 7 * delta));
    tmpTarget.set(model.position.x, model.position.y + 1, model.position.z);
    this.camera.lookAt(tmpTarget);
  }
}