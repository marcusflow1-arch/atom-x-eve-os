import * as THREE from 'three';

const upAxis = new THREE.Vector3(0, 1, 0);

export class RemotePlayer {
  constructor(group, { lerpSpeed = 10 } = {}) {
    this.group = group;
    this.lerpSpeed = lerpSpeed;
    this.targetPosition = new THREE.Vector3();
    this.targetQuaternion = new THREE.Quaternion();
  }

  networkUpdate(data = {}) {
    this.targetPosition.set(data.x ?? 0, data.y ?? 0, data.z ?? 0);
    this.targetQuaternion.setFromAxisAngle(upAxis, data.yaw ?? 0);
  }

  update(delta) {
    if (!this.group) return;
    const t = Math.min(1, this.lerpSpeed * delta);
    this.group.position.lerp(this.targetPosition, t);
    this.group.quaternion.slerp(this.targetQuaternion, t);
  }
}