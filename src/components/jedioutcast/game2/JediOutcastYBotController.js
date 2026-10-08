import * as THREE from 'three';
import {
  RAVEN_ALL_FORCE_POWERS,
  RAVEN_GAMEPLAY_FORCE_POWERS,
  RAVEN_PMOVE,
  RAVEN_SABER_ASSETS,
  ravenCmdScale,
  ravenMovementDir,
} from './jediSourceConstants';
import { JediForceVfx } from './JediForceVfx';
import { fetchCanonicalJediAsset, getCanonicalJediAssetUrl } from './JediRetailAssetBridge';
import { parseStaticMd3 } from './StaticMd3Loader';

const UP = new THREE.Vector3(0, 1, 0);
const TMP_FORWARD = new THREE.Vector3();
const TMP_RIGHT = new THREE.Vector3();
const TMP_WISH = new THREE.Vector3();
const TMP_DIR = new THREE.Vector3();
const TMP_WORLD = new THREE.Vector3();
const TMP_QUAT = new THREE.Quaternion();

const DIRECT_FORCE_KEYS = Object.freeze({
  F1: 'push',
  F2: 'pull',
  F3: 'speed',
  F4: 'telepathy',
  F5: 'heal',
  F6: 'grip',
  F7: 'lightning',
});

function findRightHand(root) {
  let match = null;
  root?.traverse?.((node) => {
    if (match || !node.isBone) return;
    const name = String(node.name || '');
    if (/mixamorig.*right.*hand|right.?hand|hand.?r|r.?hand/i.test(name)) match = node;
  });
  return match || root;
}

function disposeObject(root) {
  root?.traverse?.((node) => {
    node.geometry?.dispose?.();
    const materials = node.material ? (Array.isArray(node.material) ? node.material : [node.material]) : [];
    materials.forEach((material) => material?.dispose?.());
  });
}

function makeBlade(length = RAVEN_SABER_ASSETS.bladeLength) {
  const root = new THREE.Group();
  root.name = 'RavenSaberBladeEffectAdapter';
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0xb8f7ff,
    transparent: true,
    opacity: 0.96,
    toneMapped: false,
  });
  const blade = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, length, 12), glowMaterial);
  blade.position.y = length * 0.5 + 0.055;
  root.add(blade);
  const light = new THREE.PointLight(0x71dfff, 2.4, 3.2);
  light.position.y = length * 0.5;
  root.add(light);
  return root;
}

export class JediOutcastYBotController {
  constructor({
    scene,
    modelRef,
    animation,
    getViewYaw,
    enemies = [],
    onForceSelect,
    onStatus,
    onHealth,
  }) {
    this.scene = scene;
    this.modelRef = modelRef;
    this.animation = animation;
    this.getViewYaw = getViewYaw;
    this.enemies = enemies;
    this.onForceSelect = onForceSelect;
    this.onStatus = onStatus;
    this.onHealth = onHealth;

    this.sourceMovementPath = 'code/game/bg_pmove.cpp';
    this.sourceInputPath = 'code/client/cl_input.cpp';
    this.sourceForcePath = 'code/game/wp_saber.cpp';
    this.sourceSaberPath = 'code/game/wp_saber.cpp';

    this.keys = { w: false, a: false, s: false, d: false, shift: false, space: false };
    this.velocity = new THREE.Vector3();
    this.verticalVelocity = 0;
    this.grounded = true;
    this.jumpStartY = 0;
    this.movementDir = 0;
    this.attackIndex = 0;
    this.attackTimer = 0;
    this.saberStyle = 1;
    this.forcePower = 100;
    this.forcePowerMax = 100;
    this.forceRegenDelay = 0;
    this.forceSpeedTimer = 0;
    this.health = 100;
    this.maxHealth = 100;
    this.selectedForceIndex = 2; // PUSH, matching the seven-power Raven gameplay selector.
    this.forceLevels = new Map(RAVEN_ALL_FORCE_POWERS.map((entry) => [entry.id, entry.level]));
    this.vfx = new JediForceVfx(scene);
    this.saberRoot = null;
    this.saberBlade = null;
    this.saberAnchor = null;
    this.saberHum = null;
    this.saberThrow = null;
    this.assetState = { saber: 'loading', hum: 'loading' };

    this.onForceSelect?.(this.getSelectedForce(), true);
    this.onHealth?.({ health: this.health, maxHealth: this.maxHealth, force: this.forcePower });
  }

  async attachCanonicalSaber() {
    const model = this.modelRef.current;
    if (!model) return;
    try {
      const { buffer } = await fetchCanonicalJediAsset(RAVEN_SABER_ASSETS.model, 'weapon_model');
      const hilt = parseStaticMd3(buffer);
      const blade = makeBlade();
      hilt.add(blade);
      this.saberRoot = hilt;
      this.saberBlade = blade;
      this.saberAnchor = findRightHand(model);

      if (this.saberAnchor === model) {
        hilt.scale.setScalar(1);
        hilt.position.set(0.28, 1.04, 0.04);
        hilt.rotation.set(0, 0, -Math.PI / 2);
      } else {
        hilt.scale.setScalar(1);
        hilt.position.set(0.015, 0.04, 0);
        hilt.rotation.set(0, Math.PI / 2, -Math.PI / 2);
      }
      this.saberAnchor.add(hilt);
      this.assetState.saber = 'ready';
      this.onStatus?.('Original saber MD3 loaded');
    } catch (error) {
      this.assetState.saber = 'missing';
      this.onStatus?.(`Original saber asset unavailable: ${error?.message || error}`);
    }

    try {
      const humUrl = await getCanonicalJediAssetUrl(RAVEN_SABER_ASSETS.hum, 'sound');
      const audio = new Audio(humUrl);
      audio.loop = true;
      audio.volume = 0.22;
      audio.preload = 'auto';
      this.saberHum = audio;
      this.assetState.hum = 'ready';
    } catch (error) {
      this.assetState.hum = 'missing';
    }
  }

  getSelectedForce() {
    return RAVEN_GAMEPLAY_FORCE_POWERS[this.selectedForceIndex] || RAVEN_GAMEPLAY_FORCE_POWERS[0];
  }

  selectForce(indexOrId, showHud = true) {
    let index = Number.isInteger(indexOrId)
      ? indexOrId
      : RAVEN_GAMEPLAY_FORCE_POWERS.findIndex((entry) => entry.id === indexOrId);
    if (index < 0) return this.getSelectedForce();
    index = (index + RAVEN_GAMEPLAY_FORCE_POWERS.length) % RAVEN_GAMEPLAY_FORCE_POWERS.length;
    this.selectedForceIndex = index;
    const selected = this.getSelectedForce();
    this.onForceSelect?.(selected, showHud);
    return selected;
  }

  cycleForce(direction) {
    return this.selectForce(this.selectedForceIndex + Math.sign(direction || 1), true);
  }

  handleKeyDown(event) {
    const key = event.key.toLowerCase();
    if (key in this.keys) this.keys[key] = true;
    if (event.code === 'Space') {
      if (this.grounded) this._beginJump();
      this.keys.space = true;
      return true;
    }
    if (DIRECT_FORCE_KEYS[event.code]) {
      const id = DIRECT_FORCE_KEYS[event.code];
      this.selectForce(id, true);
      this.castForce(id);
      return true;
    }
    if (key === 'z') {
      this.cycleForce(-1);
      return true;
    }
    if (key === 'x') {
      this.cycleForce(1);
      return true;
    }
    if (key === 'f') {
      this.castForce();
      return true;
    }
    if (key === 'l') {
      this.saberStyle = this.saberStyle % 3 + 1;
      this.onStatus?.(`Saber style ${this.saberStyle}`);
      return true;
    }
    return ['w', 'a', 's', 'd', 'shift'].includes(key);
  }

  handleKeyUp(event) {
    const key = event.key.toLowerCase();
    if (key in this.keys) this.keys[key] = false;
    if (event.code === 'Space') this.keys.space = false;
  }

  primaryAttack() {
    if (this.attackTimer > 0) return false;
    this.attackIndex = (this.attackIndex + 1) % 2;
    const state = this.attackIndex ? 'attack1' : 'attack2';
    this.animation?.play(state, { force: true, fade: 0.05, timeScale: 1 + (this.saberStyle - 2) * 0.12 });
    this.attackTimer = this.saberStyle === 3 ? 0.42 : this.saberStyle === 2 ? 0.34 : 0.28;
    this.saberHum?.play?.().catch?.(() => {});

    const model = this.modelRef.current;
    if (model) {
      const forward = this._forward();
      for (const enemy of this.enemies) {
        if (!enemy?.model || enemy.health <= 0) continue;
        const delta = TMP_DIR.subVectors(enemy.model.position, model.position);
        const distance = delta.length();
        if (distance > 2.1 || distance < 0.001) continue;
        delta.normalize();
        if (forward.dot(delta) < 0.1) continue;
        enemy.takeDamage?.(this.saberStyle === 3 ? 34 : this.saberStyle === 2 ? 28 : 22);
      }
    }
    this.onStatus?.('Saber attack');
    return true;
  }

  altAttack() {
    if (this.saberThrow || !this.saberRoot) return false;
    const model = this.modelRef.current;
    if (!model) return false;
    const start = model.getWorldPosition(new THREE.Vector3());
    start.y += 1.1;
    const target = this._nearestEnemy(8);
    const end = target
      ? target.model.position.clone().add(new THREE.Vector3(0, 0.9, 0))
      : start.clone().addScaledVector(this._forward(), 5.5);
    const visual = this.saberRoot.clone(true);
    this.scene.add(visual);
    this.saberRoot.visible = false;
    this.saberThrow = { visual, start, end, elapsed: 0, duration: 0.9, target };
    this.onStatus?.('Saber Throw · FP_SABERTHROW');
    return true;
  }

  takeDamage(amount) {
    const incoming = Math.max(0, Number(amount) || 0);
    if (!incoming) return;
    const reduced = this.forceLevels.get('saberDefense') >= 3 ? incoming * 0.75 : incoming;
    this.health = Math.max(0, this.health - reduced);
    this.animation?.play('hurt', { force: true, fade: 0.05 });
    this._emitVitals();
  }

  castForce(id = this.getSelectedForce().id) {
    const model = this.modelRef.current;
    if (!model) return false;
    const level = this.forceLevels.get(id === 'jump' ? 'levitation' : id) || 0;
    if (!level) return false;

    const costs = { heal: 20, speed: 30, push: 20, pull: 20, telepathy: 25, grip: 30, lightning: 25 };
    const cost = costs[id] || 0;
    if (this.forcePower < cost) {
      this.onStatus?.('Not enough Force');
      return false;
    }
    this.forcePower -= cost;
    this.forceRegenDelay = 1.25;

    const origin = model.position.clone();
    switch (id) {
      case 'heal':
        this.health = Math.min(this.maxHealth, this.health + 25);
        this.vfx.aura(origin, 0x63f59a, { duration: 0.8, size: 0.72 });
        break;
      case 'speed':
        this.forceSpeedTimer = 6;
        this.vfx.aura(origin, 0x65cfff, { duration: 0.55, size: 0.85 });
        break;
      case 'push':
        this._forceThrow(false, level);
        this.vfx.radial(origin, 0x8be9ff, { radius: 5.2, duration: 0.36 });
        break;
      case 'pull':
        this._forceThrow(true, level);
        this.vfx.radial(origin, 0x5ea6ff, { radius: 4.6, duration: 0.36 });
        break;
      case 'telepathy': {
        const target = this._nearestEnemy(8);
        target?.setConfused?.(5);
        this.vfx.aura(origin, 0xb58cff, { duration: 0.7, size: 0.8 });
        break;
      }
      case 'grip': {
        const target = this._nearestEnemy(8);
        if (target) {
          target.setGripped?.(2.2);
          target.takeDamage?.(12);
          this.vfx.lightning(
            () => model.position.clone().add(new THREE.Vector3(0, 1.3, 0)),
            () => target.model.position.clone().add(new THREE.Vector3(0, 1.05, 0)),
            { duration: 0.45, color: 0xcb74ff },
          );
        }
        break;
      }
      case 'lightning': {
        const target = this._nearestEnemy(7);
        if (target) {
          target.takeDamage?.(24);
          this.vfx.lightning(
            () => model.position.clone().add(new THREE.Vector3(0, 1.25, 0)),
            () => target.model.position.clone().add(new THREE.Vector3(0, 1.0, 0)),
            { duration: 0.72, color: 0x9fe8ff },
          );
        }
        break;
      }
      default:
        return false;
    }

    this.onStatus?.(`Force ${RAVEN_GAMEPLAY_FORCE_POWERS.find((power) => power.id === id)?.label || id}`);
    this._emitVitals();
    return true;
  }

  update(delta) {
    const model = this.modelRef.current;
    if (!model) return { moveAmount: 0, direction: 'forward', runHeld: false, sprintHeld: false };

    this.attackTimer = Math.max(0, this.attackTimer - delta);
    this.forceSpeedTimer = Math.max(0, this.forceSpeedTimer - delta);
    this.forceRegenDelay = Math.max(0, this.forceRegenDelay - delta);
    if (this.forceRegenDelay <= 0 && this.forcePower < this.forcePowerMax) {
      this.forcePower = Math.min(this.forcePowerMax, this.forcePower + 10 * delta);
    }

    const commandMagnitude = this.keys.shift ? RAVEN_PMOVE.walkCommand : RAVEN_PMOVE.runCommand;
    const forwardMove = (this.keys.w ? commandMagnitude : 0) - (this.keys.s ? commandMagnitude : 0);
    const rightMove = (this.keys.d ? commandMagnitude : 0) - (this.keys.a ? commandMagnitude : 0);
    this.movementDir = ravenMovementDir(forwardMove, rightMove, this.movementDir);

    const yaw = Number(this.getViewYaw?.()) || 0;
    TMP_FORWARD.set(-Math.sin(yaw), 0, -Math.cos(yaw));
    TMP_RIGHT.set(Math.cos(yaw), 0, Math.sin(yaw));
    TMP_WISH.set(0, 0, 0)
      .addScaledVector(TMP_FORWARD, forwardMove)
      .addScaledVector(TMP_RIGHT, rightMove);

    const moving = TMP_WISH.lengthSq() > 0;
    const speedScale = this.forceSpeedTimer > 0 ? 1 / RAVEN_PMOVE.forceSpeedTimeScale[3] : 1;
    const wishSpeed = moving ? ravenCmdScale(forwardMove, rightMove, RAVEN_PMOVE.speed) * TMP_WISH.length() * speedScale : 0;
    if (moving) TMP_WISH.normalize();

    this._applyFriction(delta);
    this._accelerate(TMP_WISH, wishSpeed, this.grounded ? RAVEN_PMOVE.acceleration : RAVEN_PMOVE.airAcceleration, delta);

    model.position.x += this.velocity.x * delta;
    model.position.z += this.velocity.z * delta;

    if (moving) {
      const targetYaw = Math.atan2(TMP_WISH.x, TMP_WISH.z);
      TMP_QUAT.setFromAxisAngle(UP, targetYaw);
      model.quaternion.slerp(TMP_QUAT, 1 - Math.exp(-14 * delta));
    }

    this._updateJump(delta);
    this._updateAnimation(forwardMove, rightMove);
    this._updateSaberThrow(delta);
    this.vfx.update(delta);
    this._emitVitals();

    return {
      moveAmount: moving ? 1 : 0,
      direction: this._movementLabel(),
      runHeld: moving && !this.keys.shift,
      sprintHeld: false,
    };
  }

  _applyFriction(delta) {
    if (!this.grounded) return;
    const speed = Math.hypot(this.velocity.x, this.velocity.z);
    if (speed < 0.015) {
      this.velocity.x = 0;
      this.velocity.z = 0;
      return;
    }
    const control = Math.max(speed, RAVEN_PMOVE.stopSpeed);
    const drop = control * RAVEN_PMOVE.friction * delta;
    const next = Math.max(0, speed - drop);
    const scale = next / speed;
    this.velocity.x *= scale;
    this.velocity.z *= scale;
  }

  _accelerate(wishDir, wishSpeed, accel, delta) {
    if (!(wishSpeed > 0)) return;
    const currentSpeed = this.velocity.x * wishDir.x + this.velocity.z * wishDir.z;
    const addSpeed = wishSpeed - currentSpeed;
    if (addSpeed <= 0) return;
    const accelSpeed = Math.min(addSpeed, accel * delta * wishSpeed);
    this.velocity.x += accelSpeed * wishDir.x;
    this.velocity.z += accelSpeed * wishDir.z;
  }

  _beginJump() {
    const model = this.modelRef.current;
    if (!model || !this.grounded) return;
    this.grounded = false;
    this.jumpStartY = model.position.y;
    this.verticalVelocity = RAVEN_PMOVE.jumpVelocity;
    this.animation?.play('jump', { force: true, fade: 0.07 });
    this.onStatus?.('Jump');
  }

  _updateJump(delta) {
    const model = this.modelRef.current;
    if (!model) return;
    if (this.grounded) {
      model.position.y = 0;
      return;
    }

    const level = this.forceLevels.get('levitation') || 0;
    const currentHeight = Math.max(0, model.position.y - this.jumpStartY);
    if (
      this.keys.space &&
      level > 0 &&
      this.verticalVelocity > 0 &&
      currentHeight < RAVEN_PMOVE.forceJumpHeight[level] &&
      this.forcePower > 0
    ) {
      const remaining = 1 - currentHeight / Math.max(0.001, RAVEN_PMOVE.forceJumpHeight[level]);
      const sourceLikeVelocity = RAVEN_PMOVE.jumpVelocity + (RAVEN_PMOVE.forceJumpStrength[level] * remaining) / 10;
      this.verticalVelocity = Math.max(this.verticalVelocity, sourceLikeVelocity);
      this.forcePower = Math.max(0, this.forcePower - 10 * delta);
      this.forceRegenDelay = 0.75;
      this.onStatus?.('Force Jump · FP_LEVITATION');
    }

    this.verticalVelocity -= RAVEN_PMOVE.gravity * delta;
    model.position.y += this.verticalVelocity * delta;
    if (model.position.y <= 0) {
      model.position.y = 0;
      this.verticalVelocity = 0;
      this.grounded = true;
      this.animation?.play('land', { force: true, fade: 0.1 });
    } else if (this.verticalVelocity < -0.2) {
      this.animation?.play('fall');
    }
  }

  _updateAnimation(forwardMove, rightMove) {
    if (!this.grounded || this.attackTimer > 0) return;
    const moving = forwardMove !== 0 || rightMove !== 0;
    if (!moving) {
      this.animation?.play('idle');
      return;
    }
    const prefix = this.keys.shift ? 'walk' : 'run';
    const dir = this.movementDir;
    const state = dir === 4 || dir === 3 || dir === 5
      ? `${prefix}Back`
      : dir === 1 || dir === 2
        ? `${prefix}Left`
        : dir === 6 || dir === 7
          ? `${prefix}Right`
          : `${prefix}Forward`;
    this.animation?.play(state);
  }

  _movementLabel() {
    if ([3, 4, 5].includes(this.movementDir)) return 'backward';
    if ([1, 2].includes(this.movementDir)) return 'left';
    if ([6, 7].includes(this.movementDir)) return 'right';
    return 'forward';
  }

  _forward() {
    const model = this.modelRef.current;
    return TMP_WORLD.set(0, 0, 1).applyQuaternion(model?.quaternion || new THREE.Quaternion()).setY(0).normalize().clone();
  }

  _nearestEnemy(maxDistance = Infinity) {
    const model = this.modelRef.current;
    if (!model) return null;
    let best = null;
    let bestDistance = maxDistance;
    for (const enemy of this.enemies) {
      if (!enemy?.model || enemy.health <= 0) continue;
      const distance = enemy.model.position.distanceTo(model.position);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = enemy;
      }
    }
    return best;
  }

  _forceThrow(pull, level) {
    const model = this.modelRef.current;
    if (!model) return;
    const radius = RAVEN_PMOVE.forcePushPullRadius[level];
    const cone = pull ? RAVEN_PMOVE.forcePullCone[level] : RAVEN_PMOVE.forcePushCone[level];
    const forward = this._forward();
    for (const enemy of this.enemies) {
      if (!enemy?.model || enemy.health <= 0) continue;
      const delta = new THREE.Vector3().subVectors(enemy.model.position, model.position);
      const distance = delta.length();
      if (!(distance > 0) || distance > radius) continue;
      const direction = delta.clone().normalize();
      if (forward.dot(direction) < cone) continue;
      const strength = THREE.MathUtils.lerp(3.8, 7.2, level / 3);
      enemy.addImpulse?.(direction.multiplyScalar(pull ? -strength : strength));
    }
  }

  _updateSaberThrow(delta) {
    if (!this.saberThrow) return;
    const state = this.saberThrow;
    state.elapsed += delta;
    const t = Math.min(1, state.elapsed / state.duration);
    const phase = t < 0.5 ? t * 2 : (1 - t) * 2;
    state.visual.position.lerpVectors(state.start, state.end, phase);
    state.visual.rotation.z += delta * 22;
    if (state.target && t > 0.35 && t < 0.65 && !state.hit) {
      state.hit = true;
      state.target.takeDamage?.(26);
    }
    if (t >= 1) {
      this.scene.remove(state.visual);
      state.visual = null;
      this.saberThrow = null;
      if (this.saberRoot) this.saberRoot.visible = true;
    }
  }

  _emitVitals() {
    this.onHealth?.({ health: this.health, maxHealth: this.maxHealth, force: this.forcePower });
  }

  dispose() {
    this.vfx.dispose();
    this.saberHum?.pause?.();
    this.saberHum = null;
    if (this.saberThrow?.visual) this.scene.remove(this.saberThrow.visual);
    this.saberThrow = null;
    if (this.saberRoot?.parent) this.saberRoot.parent.remove(this.saberRoot);
    disposeObject(this.saberRoot);
    this.saberRoot = null;
  }
}

export { RAVEN_GAMEPLAY_FORCE_POWERS };
