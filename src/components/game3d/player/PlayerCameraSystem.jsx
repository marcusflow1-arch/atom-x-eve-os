import * as THREE from 'three';

const tmpCamera = new THREE.Vector3();
const tmpTarget = new THREE.Vector3();
const tmpToTarget = new THREE.Vector3();
const tmpFromPlayer = new THREE.Vector3();

export class PlayerCameraSystem {
  constructor({ camera, orbit, modelRef, lockOnTargetRef }) {
    this.camera = camera;
    this.orbit = orbit;
    this.modelRef = modelRef;
    this.lockOnTargetRef = lockOnTargetRef;
    this.combatDistance = 6.4;
    this.defaultDistance = 5.2;
    this.minPlayerDistance = 4.8;
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
      const dynamicDistance = THREE.MathUtils.clamp(pairDistance * 0.45 + this.combatDistance, 6.2, 12);
      tmpTarget.addVectors(model.position, targetPos).multiplyScalar(0.5);
      tmpTarget.y += 1.35;
      tmpCamera.set(
        model.position.x - tmpToTarget.x * dynamicDistance,
        model.position.y + 2.6,
        model.position.z - tmpToTarget.z * dynamicDistance,
      );
      this.camera.position.lerp(tmpCamera, Math.min(1, 10 * delta));
      tmpFromPlayer.subVectors(this.camera.position, model.position);
      if (tmpFromPlayer.lengthSq() < this.minPlayerDistance * this.minPlayerDistance || tmpFromPlayer.dot(tmpToTarget) > -0.35) {
        this.camera.position.copy(tmpCamera);
      }
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
    this.camera.position.lerp(tmpCamera, Math.min(1, 9 * delta));
    tmpFromPlayer.subVectors(this.camera.position, model.position);
    if (tmpFromPlayer.lengthSq() < this.minPlayerDistance * this.minPlayerDistance) {
      this.camera.position.copy(tmpCamera);
    }
    tmpTarget.set(model.position.x, model.position.y + 1, model.position.z);
    this.camera.lookAt(tmpTarget);
  }
}