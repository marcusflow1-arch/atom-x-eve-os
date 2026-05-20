import * as THREE from 'three';

const faceQuat = new THREE.Quaternion();
const upAxis = new THREE.Vector3(0, 1, 0);

export class EnemyAISystem {
  constructor({ enemies, playerRef, sampleGroundY, playEnemyAnimation }) {
    this.enemies = enemies;
    this.playerRef = playerRef;
    this.sampleGroundY = sampleGroundY;
    this.playEnemyAnimation = playEnemyAnimation;
  }

  setState(enemy, state) {
    if (!enemy || enemy.aiState === state) return;
    enemy.aiState = state;
  }

  faceTarget(enemy, targetPosition, delta, turnSpeed = 7) {
    const dx = targetPosition.x - enemy.group.position.x;
    const dz = targetPosition.z - enemy.group.position.z;
    if (dx * dx + dz * dz < 0.001) return;
    faceQuat.setFromAxisAngle(upAxis, Math.atan2(dx, dz));
    enemy.group.quaternion.slerp(faceQuat, Math.min(1, turnSpeed * delta));
  }

  ground(enemy) {
    const gy = this.sampleGroundY?.(enemy.group.position.x, enemy.group.position.z);
    if (gy !== null && gy !== undefined) enemy.group.position.y = gy;
  }

  play(enemy, anim) {
    this.playEnemyAnimation?.(enemy, anim);
  }
}