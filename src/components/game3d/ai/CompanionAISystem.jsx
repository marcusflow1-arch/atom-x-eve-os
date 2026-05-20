import * as THREE from 'three';

const desired = new THREE.Vector3();
const toTarget = new THREE.Vector3();
const faceQuat = new THREE.Quaternion();
const upAxis = new THREE.Vector3(0, 1, 0);

export class CompanionAISystem {
  constructor({ companionRef, ownerRef, sampleGroundY, playAnimation, getMounted }) {
    this.companionRef = companionRef;
    this.ownerRef = ownerRef;
    this.sampleGroundY = sampleGroundY;
    this.playAnimation = playAnimation;
    this.getMounted = getMounted;
    this.state = 'idle';
    this.velocity = new THREE.Vector3();
    this.followDistance = 2.15;
    this.deadZone = 0.42;
    this.catchUpDistance = 5.5;
    this.teleportDistance = 28;
  }

  setState(nextState) {
    if (this.state === nextState) return;
    this.state = nextState;
  }

  update(delta, { ownerMoving = false, ownerRunning = false, ownerYaw = 0 } = {}) {
    const companion = this.companionRef.current;
    const owner = this.ownerRef.current;
    if (!companion || !owner) return;

    if (this.getMounted?.()) {
      this.setState('mounted');
      this.velocity.set(0, 0, 0);
      this.playAnimation?.(ownerMoving ? (ownerRunning ? 'run' : 'walk') : 'idle');
      return;
    }

    desired.set(
      owner.position.x + Math.sin(ownerYaw) * this.followDistance,
      companion.position.y,
      owner.position.z + Math.cos(ownerYaw) * this.followDistance,
    );

    toTarget.subVectors(desired, companion.position);
    toTarget.y = 0;
    const distance = toTarget.length();

    if (distance > this.teleportDistance) {
      companion.position.copy(desired);
      const gy = this.sampleGroundY?.(companion.position.x, companion.position.z);
      if (gy !== null && gy !== undefined) companion.position.y = gy;
      this.velocity.set(0, 0, 0);
      this.setState('teleport');
      this.playAnimation?.('idle');
      return;
    }

    if (distance <= this.deadZone) {
      this.velocity.multiplyScalar(Math.max(0, 1 - 10 * delta));
      this.setState('idle');
      this.playAnimation?.('idle');
    } else {
      toTarget.normalize();
      const speed = distance > this.catchUpDistance || ownerRunning ? 6.4 : 3.15;
      const accel = distance > this.catchUpDistance ? 12 : 7;
      this.velocity.x += (toTarget.x * speed - this.velocity.x) * Math.min(1, accel * delta);
      this.velocity.z += (toTarget.z * speed - this.velocity.z) * Math.min(1, accel * delta);
      companion.position.x += this.velocity.x * delta;
      companion.position.z += this.velocity.z * delta;
      faceQuat.setFromAxisAngle(upAxis, Math.atan2(this.velocity.x, this.velocity.z));
      companion.quaternion.slerp(faceQuat, Math.min(1, 8 * delta));
      this.setState(distance > this.catchUpDistance ? 'return_to_player' : 'follow');
      this.playAnimation?.(speed > 4.5 ? 'run' : 'walk');
    }

    const gy = this.sampleGroundY?.(companion.position.x, companion.position.z);
    if (gy !== null && gy !== undefined) companion.position.y = gy;
  }
}