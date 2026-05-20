import * as THREE from 'three';

export class CameraSystem {
  constructor(camera, player, { distance = 6, height = 2, positionLerp = 4, lookLerp = 6 } = {}) {
    this.camera = camera;
    this.player = player;
    this.distance = distance;
    this.height = height;
    this.positionLerp = positionLerp;
    this.lookLerp = lookLerp;
    this.currentLook = new THREE.Vector3();
    this.currentPos = new THREE.Vector3();
  }

  update(delta) {
    const playerModel = this.player?.model || this.player?.current;
    if (!playerModel || !this.camera) return;

    const playerPos = playerModel.position;
    const idealPos = new THREE.Vector3(playerPos.x, playerPos.y + this.height, playerPos.z + this.distance);
    this.currentPos.lerp(idealPos, Math.min(1, this.positionLerp * delta));
    this.camera.position.copy(this.currentPos);
    this.currentLook.lerp(playerPos, Math.min(1, this.lookLerp * delta));
    this.camera.lookAt(this.currentLook);
  }
}