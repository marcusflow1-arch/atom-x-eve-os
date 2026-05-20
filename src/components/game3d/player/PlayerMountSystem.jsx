import * as THREE from 'three';

const tmpQuat = new THREE.Quaternion();
const upAxis = new THREE.Vector3(0, 1, 0);

export class PlayerMountSystem {
  constructor({ playerRef, companionRef, stateMachine, setMountedUI, setMountedStore, sampleGroundY }) {
    this.playerRef = playerRef;
    this.companionRef = companionRef;
    this.stateMachine = stateMachine;
    this.setMountedUI = setMountedUI;
    this.setMountedStore = setMountedStore;
    this.sampleGroundY = sampleGroundY;
    this.mountVelocity = new THREE.Vector3();
    this.riderOffset = new THREE.Vector3(0, 1.15, -0.1);
  }

  toggleIfNear() {
    const player = this.playerRef.current;
    const mount = this.companionRef.current;
    if (!player || !mount) return;
    if (this.stateMachine.getSnapshot().mounted) {
      player.position.set(mount.position.x + 1.2, mount.position.y, mount.position.z);
      mount.remove(player);
      player.visible = true;
      this.setMounted(false);
      return;
    }
    const dist = Math.hypot(mount.position.x - player.position.x, mount.position.z - player.position.z);
    if (dist < 3.5) {
      mount.add(player);
      player.position.copy(this.riderOffset);
      player.rotation.set(0, 0, 0);
      player.visible = true;
      this.setMounted(true);
    }
  }

  setMounted(enabled) {
    this.stateMachine.setMounted(enabled);
    this.setMountedUI(enabled);
    this.setMountedStore(enabled);
  }

  update(delta, movementIntent, orbit) {
    const mount = this.companionRef.current;
    if (!mount || !this.stateMachine.getSnapshot().mounted) return;

    const yaw = orbit.current.yaw;
    const fx = -Math.sin(yaw), fz = -Math.cos(yaw);
    const rx = -Math.cos(yaw), rz = Math.sin(yaw);
    let x = 0, z = 0;
    if (movementIntent.moveAmount > 0) {
      if (movementIntent.direction === 'forward') { x += fx; z += fz; }
      if (movementIntent.direction === 'backward') { x -= fx; z -= fz; }
      if (movementIntent.direction === 'left') { x += rx; z += rz; }
      if (movementIntent.direction === 'right') { x -= rx; z -= rz; }
      const speed = movementIntent.runHeld ? 7.2 : 4.2;
      this.mountVelocity.x += (x * speed - this.mountVelocity.x) * Math.min(1, 7 * delta);
      this.mountVelocity.z += (z * speed - this.mountVelocity.z) * Math.min(1, 7 * delta);
      if (x * x + z * z > 0.001) {
        tmpQuat.setFromAxisAngle(upAxis, Math.atan2(x, z));
        mount.quaternion.slerp(tmpQuat, Math.min(1, 5 * delta));
      }
    } else {
      this.mountVelocity.x += (0 - this.mountVelocity.x) * Math.min(1, 8 * delta);
      this.mountVelocity.z += (0 - this.mountVelocity.z) * Math.min(1, 8 * delta);
    }

    mount.position.x += this.mountVelocity.x * delta;
    mount.position.z += this.mountVelocity.z * delta;
    const gy = this.sampleGroundY(mount.position.x, mount.position.z);
    if (gy !== null) mount.position.y = gy;
  }
}