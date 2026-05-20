import * as THREE from 'three';

const faceQuat = new THREE.Quaternion();
const upAxis = new THREE.Vector3(0, 1, 0);
const dir = new THREE.Vector3();

export class EnemyAISystem {
  constructor({ enemies, playerRef, sampleGroundY, playEnemyAnimation, onAttackPlayer }) {
    this.enemies = enemies;
    this.playerRef = playerRef;
    this.sampleGroundY = sampleGroundY;
    this.playEnemyAnimation = playEnemyAnimation;
    this.onAttackPlayer = onAttackPlayer;
    this.aggroDistance = 8;
    this.attackDistance = 2.2;
    this.moveSpeed = 2.5;
  }

  setState(enemy, state) {
    if (!enemy || enemy.aiState === state) return;
    enemy.aiState = state;
  }

  faceTarget(enemy, targetPosition, delta, turnSpeed = 6) {
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

  update(delta) {
    const player = this.playerRef.current;
    if (!player) return;

    for (const enemy of this.enemies) {
      if (!enemy.alive || enemy.dying || enemy.isBoss || !enemy.group) continue;
      if (enemy.attackCooldown > 0) enemy.attackCooldown -= delta;
      if (!enemy.aiState) enemy.aiState = 'idle';

      const enemyPos = enemy.group.position;
      const playerPos = player.position;
      const dx = playerPos.x - enemyPos.x;
      const dz = playerPos.z - enemyPos.z;
      const distance = Math.sqrt(dx * dx + dz * dz);

      if (distance < this.aggroDistance && enemy.aiState === 'idle') this.setState(enemy, 'chase');
      if (distance <= this.attackDistance && enemy.aiState === 'chase') this.setState(enemy, 'attack');
      if (distance > this.attackDistance + 1 && enemy.aiState === 'attack') this.setState(enemy, 'chase');

      if (enemy.aiState === 'idle') {
        this.play(enemy, 'idle');
      } else if (enemy.aiState === 'chase') {
        dir.set(dx, 0, dz).normalize();
        enemyPos.addScaledVector(dir, this.moveSpeed * delta);
        this.faceTarget(enemy, playerPos, delta);
        this.play(enemy, 'walk');
      } else if (enemy.aiState === 'attack') {
        this.faceTarget(enemy, playerPos, delta);
        this.play(enemy, 'attack');
        if (enemy.attackCooldown <= 0) {
          enemy.attackCooldown = 1.5;
          this.onAttackPlayer?.(enemy);
        }
      }

      this.ground(enemy);
    }
  }
}