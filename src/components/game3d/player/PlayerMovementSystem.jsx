import * as THREE from 'three';

const tmpMove = new THREE.Vector3();
const tmpDesired = new THREE.Vector3();
const tmpQuat = new THREE.Quaternion();
const upAxis = new THREE.Vector3(0, 1, 0);

export class PlayerMovementSystem {
  constructor({ keys, orbit, modelRef, stateMachine, sampleGroundY, playerAnim, getSpeed, arenaRadius = 36.5 }) {
    this.keys = keys;
    this.orbit = orbit;
    this.modelRef = modelRef;
    this.stateMachine = stateMachine;
    this.sampleGroundY = sampleGroundY;
    this.playerAnim = playerAnim;
    this.getSpeed = getSpeed;
    this.arenaRadius = arenaRadius;
    this.velocity = new THREE.Vector3();

    // Modern TwelveSky profile: immediate response, very little skating.
    this.walkSpeed = 4.8;
    this.runSpeed = 8.0;
    this.sprintSpeed = 10.8;
    this.backpedalMultiplier = 0.72;
    this.strafeMultiplier = 0.86;
    this.acceleration = 34;
    this.deceleration = 30;
    this.stopThreshold = 0.08;
    this.intent = { moveAmount: 0, direction: 'forward', runHeld: false, sprintHeld: false };
  }

  update(delta) {
    const model = this.modelRef.current;
    if (!model) return this.intent;

    const yaw = this.orbit.current.yaw;
    const fx = -Math.sin(yaw), fz = -Math.cos(yaw);
    const rx = Math.cos(yaw), rz = Math.sin(yaw);
    tmpMove.set(0, 0, 0);
    if (this.keys.current.w) { tmpMove.x += fx; tmpMove.z += fz; }
    if (this.keys.current.s) { tmpMove.x -= fx; tmpMove.z -= fz; }
    if (this.keys.current.a) { tmpMove.x -= rx; tmpMove.z -= rz; }
    if (this.keys.current.d) { tmpMove.x += rx; tmpMove.z += rz; }

    const moveAmount = Math.min(1, tmpMove.length());
    const direction = this.keys.current.s
      ? 'backward'
      : this.keys.current.a ? 'left'
        : this.keys.current.d ? 'right' : 'forward';
    const runHeld = !!this.keys.current.shift && moveAmount > 0;
    const sprintHeld = !!this.keys.current.control && moveAmount > 0;
    this.intent = { moveAmount, direction, runHeld, sprintHeld };
    this.stateMachine.setIntent?.(this.intent);

    const movementOverridden = this.playerAnim.current?.isMovementOverridden?.();
    if (movementOverridden) {
      // Attacks/dodges own their movement. Do not let old input velocity keep
      // sliding the character underneath an action animation.
      this.velocity.set(0, 0, 0);
    } else if (moveAmount > 0) {
      tmpMove.normalize();
      let targetSpeed = this.getSpeed?.(this.stateMachine.getSnapshot?.()) ?? this.walkSpeed;
      if (sprintHeld) targetSpeed = Math.max(targetSpeed, this.sprintSpeed);
      else if (runHeld) targetSpeed = Math.max(targetSpeed, this.runSpeed);
      else targetSpeed = Math.max(targetSpeed, this.walkSpeed);

      if (direction === 'backward') targetSpeed *= this.backpedalMultiplier;
      else if (direction === 'left' || direction === 'right') targetSpeed *= this.strafeMultiplier;

      tmpDesired.copy(tmpMove).multiplyScalar(targetSpeed);
      const alpha = 1 - Math.exp(-this.acceleration * Math.max(0, delta));
      this.velocity.lerp(tmpDesired, alpha);
      model.position.addScaledVector(this.velocity, delta);

      const dist = Math.hypot(model.position.x, model.position.z);
      if (dist > this.arenaRadius) {
        const edgeScale = this.arenaRadius / dist;
        model.position.x *= edgeScale;
        model.position.z *= edgeScale;
      }
    } else {
      const alpha = 1 - Math.exp(-this.deceleration * Math.max(0, delta));
      this.velocity.lerp(tmpDesired.set(0, 0, 0), alpha);
      if (this.velocity.lengthSq() < this.stopThreshold * this.stopThreshold) this.velocity.set(0, 0, 0);
      // Preserve a tiny deceleration travel instead of snapping visually.
      model.position.addScaledVector(this.velocity, delta);
    }

    const groundY = this.sampleGroundY(model.position.x, model.position.z);
    if (groundY !== null) model.position.y = groundY;
    this.playerAnim.current?.updateMotion?.(model, delta, groundY ?? model.position.y);
    return this.intent;
  }
}

export class PlayerRotationSystem {
  constructor({ modelRef, keys, stateMachine, lockOnTargetRef, rotationSmooth = 14 }) {
    this.modelRef = modelRef;
    this.keys = keys;
    this.stateMachine = stateMachine;
    this.lockOnTargetRef = lockOnTargetRef;
    this.rotationSmooth = rotationSmooth;
  }

  update(delta, movementIntent, orbit) {
    const model = this.modelRef.current;
    if (!model || this.stateMachine.getSnapshot?.().locked) return;

    const lockedTarget = this.lockOnTargetRef.current;
    if (lockedTarget?.group && (!lockedTarget.aliveRef || lockedTarget.aliveRef())) {
      const dx = lockedTarget.group.position.x - model.position.x;
      const dz = lockedTarget.group.position.z - model.position.z;
      if (dx * dx + dz * dz > 0.001) {
        tmpQuat.setFromAxisAngle(upAxis, Math.atan2(dx, dz));
        const alpha = 1 - Math.exp(-18 * Math.max(0, delta));
        model.quaternion.slerp(tmpQuat, alpha);
      }
      return;
    }

    if (movementIntent.moveAmount <= 0) return;
    const yaw = orbit.current.yaw;
    const fx = -Math.sin(yaw), fz = -Math.cos(yaw);
    const rx = Math.cos(yaw), rz = Math.sin(yaw);
    let x = 0, z = 0;
    if (this.keys.current.w) { x += fx; z += fz; }
    if (this.keys.current.s) { x -= fx; z -= fz; }
    if (this.keys.current.a) { x -= rx; z -= rz; }
    if (this.keys.current.d) { x += rx; z += rz; }
    if (x * x + z * z > 0.001) {
      tmpQuat.setFromAxisAngle(upAxis, Math.atan2(x, z));
      const alpha = 1 - Math.exp(-this.rotationSmooth * Math.max(0, delta));
      model.quaternion.slerp(tmpQuat, alpha);
    }
  }
}
