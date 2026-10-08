import * as THREE from 'three';

// Browser reconstruction of the high-level behavior flow in code/game/AI_Jedi.cpp.
// The visual rig can be Y Bot, but patrol/acquire/aggression/chase/strafe/attack,
// pain recovery and opportunistic Force Push are based on Raven's Jedi AI states.
export class JediEnemyAI {
  constructor({ model, animation, playerRef, onAttack, onForcePush, difficulty = 1 }) {
    this.model = model;
    this.animation = animation;
    this.playerRef = playerRef;
    this.onAttack = onAttack;
    this.onForcePush = onForcePush;
    this.sourcePath = 'code/game/AI_Jedi.cpp';

    this.health = 100;
    this.maxHealth = 100;
    this.aggression = THREE.MathUtils.clamp(5 + difficulty, 3, 10);
    this.detectRange = 11;
    this.saberRange = 1.85;
    this.preferredRange = 2.4;
    this.attackCooldown = 0;
    this.recheckTimer = 0;
    this.strafeTimer = 0;
    this.strafeDirection = Math.random() > 0.5 ? 1 : -1;
    this.painTimer = 0;
    this.confusionTimer = 0;
    this.gripTimer = 0;
    this.velocity = new THREE.Vector3();
    this.baseY = model.position.y;
    this.state = 'patrol';
    this.targetAcquired = false;
    this.time = 0;
  }

  setConfused(seconds) {
    this.confusionTimer = Math.max(this.confusionTimer, seconds);
    this.targetAcquired = false;
  }

  setGripped(seconds) {
    this.gripTimer = Math.max(this.gripTimer, seconds);
    this.velocity.set(0, 0, 0);
  }

  addImpulse(vector) {
    this.velocity.add(vector);
  }

  takeDamage(amount) {
    this.health = Math.max(0, this.health - Math.max(0, Number(amount) || 0));
    if (this.health <= 0) {
      this.state = 'dead';
      this.animation?.play('death', { force: true, fade: 0.06 });
      return;
    }
    this.painTimer = Math.max(this.painTimer, 0.38);
    this.state = 'pain';
    this.animation?.play('hurt', { force: true, fade: 0.05 });
    this.aggression = THREE.MathUtils.clamp(this.aggression + 1, 3, 10);
  }

  update(delta, worldTimeScale = 1) {
    if (this.state === 'dead') return;
    const dt = delta * worldTimeScale;
    this.time += dt;
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    this.recheckTimer = Math.max(0, this.recheckTimer - dt);
    this.strafeTimer = Math.max(0, this.strafeTimer - dt);
    this.painTimer = Math.max(0, this.painTimer - dt);
    this.confusionTimer = Math.max(0, this.confusionTimer - dt);
    this.gripTimer = Math.max(0, this.gripTimer - dt);

    this.model.position.addScaledVector(this.velocity, dt);
    this.velocity.multiplyScalar(Math.pow(0.12, dt));

    if (this.gripTimer > 0) {
      this.state = 'gripped';
      this.model.position.y = THREE.MathUtils.lerp(this.model.position.y, this.baseY + 1.65, Math.min(1, 5 * dt));
      this.animation?.play('hurt');
      return;
    }
    this.model.position.y = THREE.MathUtils.lerp(this.model.position.y, this.baseY, Math.min(1, 8 * dt));

    if (this.painTimer > 0) return;

    const player = this.playerRef.current;
    if (!player || this.confusionTimer > 0) {
      this._patrol(dt);
      return;
    }

    const toPlayer = new THREE.Vector3().subVectors(player.position, this.model.position);
    toPlayer.y = 0;
    const distance = toPlayer.length();

    if (!this.targetAcquired) {
      if (distance <= this.detectRange) this.targetAcquired = true;
      else {
        this._patrol(dt);
        return;
      }
    }
    if (distance > this.detectRange * 1.45) {
      this.targetAcquired = false;
      this._patrol(dt);
      return;
    }

    if (distance > 0.001) {
      toPlayer.normalize();
      const targetYaw = Math.atan2(toPlayer.x, toPlayer.z);
      const targetQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), targetYaw);
      this.model.quaternion.slerp(targetQuat, 1 - Math.exp(-10 * dt));
    }

    if (distance > this.preferredRange + 0.6) {
      this.state = 'chase';
      this.model.position.addScaledVector(toPlayer, (2.3 + this.aggression * 0.12) * dt);
      this.animation?.play('runForward');
      if (distance < 6 && this.aggression >= 7 && this.attackCooldown <= 0 && Math.random() < 0.005 * this.aggression) {
        this.attackCooldown = 2.8;
        this.onForcePush?.(this);
      }
      return;
    }

    if (distance < this.saberRange * 0.7) {
      this.state = 'retreat';
      this.model.position.addScaledVector(toPlayer, -1.6 * dt);
      this.animation?.play('runBack');
      return;
    }

    if (this.strafeTimer <= 0) {
      this.strafeTimer = 0.7 + Math.random() * 1.2;
      if (Math.random() < 0.45) this.strafeDirection *= -1;
    }
    const side = new THREE.Vector3(toPlayer.z, 0, -toPlayer.x).multiplyScalar(this.strafeDirection);
    this.model.position.addScaledVector(side, 0.75 * dt);
    this.animation?.play(this.strafeDirection > 0 ? 'runRight' : 'runLeft');

    if (distance <= this.saberRange && this.attackCooldown <= 0) {
      this.state = 'attack';
      this.attackCooldown = THREE.MathUtils.lerp(1.05, 0.5, (this.aggression - 3) / 7);
      this.animation?.play(Math.random() > 0.5 ? 'attack1' : 'attack2', { force: true, fade: 0.05 });
      this.onAttack?.(this);
    }
  }

  _patrol(delta) {
    this.state = 'patrol';
    const radius = 1.3;
    const target = new THREE.Vector3(Math.sin(this.time * 0.42) * radius, this.baseY, 6 + Math.cos(this.time * 0.42) * radius);
    const direction = target.sub(this.model.position);
    direction.y = 0;
    if (direction.lengthSq() > 0.05) {
      direction.normalize();
      this.model.position.addScaledVector(direction, 0.75 * delta);
      const yaw = Math.atan2(direction.x, direction.z);
      const quat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
      this.model.quaternion.slerp(quat, 1 - Math.exp(-5 * delta));
      this.animation?.play('walkForward');
    } else {
      this.animation?.play('idle');
    }
  }
}
