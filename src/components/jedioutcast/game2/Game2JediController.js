import * as THREE from 'three';

// Single-player Jedi Outcast force-power order from code/game/q_shared.h.
// This viewer applies those semantics to the existing Atom XE avatar/camera stack;
// it does not claim the current avatar animations are Raven GLA clips.
export const GAME2_FORCE_POWERS = Object.freeze([
  { id: 'heal', label: 'Heal', source: 'FP_HEAL', directKey: 'F5' },
  { id: 'jump', label: 'Force Jump', source: 'FP_LEVITATION', directKey: 'Space' },
  { id: 'speed', label: 'Force Speed', source: 'FP_SPEED', directKey: 'F3' },
  { id: 'push', label: 'Force Push', source: 'FP_PUSH', directKey: 'F1' },
  { id: 'pull', label: 'Force Pull', source: 'FP_PULL', directKey: 'F2' },
  { id: 'telepathy', label: 'Mind Trick', source: 'FP_TELEPATHY', directKey: 'F4' },
  { id: 'grip', label: 'Force Grip', source: 'FP_GRIP', directKey: 'F6' },
  { id: 'lightning', label: 'Force Lightning', source: 'FP_LIGHTNING', directKey: 'F7' },
  { id: 'saberThrow', label: 'Saber Throw', source: 'FP_SABERTHROW' },
  { id: 'saberDefense', label: 'Saber Defense', source: 'FP_SABER_DEFENSE' },
  { id: 'saberOffense', label: 'Saber Offense', source: 'FP_SABER_OFFENSE' },
]);

const DIRECT_KEYS = Object.freeze({
  F1: 'push',
  F2: 'pull',
  F3: 'speed',
  F4: 'telepathy',
  F5: 'heal',
  F6: 'grip',
  F7: 'lightning',
});

const COLORS = Object.freeze({
  heal: 0x63f59a,
  jump: 0x73d7ff,
  speed: 0x39bfff,
  push: 0x8be9ff,
  pull: 0x5ea6ff,
  telepathy: 0xb68cff,
  grip: 0xe06cff,
  lightning: 0x8fe8ff,
  saberThrow: 0x77eeff,
  saberDefense: 0x5ba8ff,
  saberOffense: 0xff766e,
});

const tmpA = new THREE.Vector3();
const tmpB = new THREE.Vector3();
const tmpForward = new THREE.Vector3();
const tmpWorld = new THREE.Vector3();

function findRightHand(root) {
  let exact = null;
  let fallback = null;
  root?.traverse?.((node) => {
    const name = String(node.name || '');
    if (!exact && /mixamorig.*right.*hand|right.?hand|hand.?r|r.?hand/i.test(name)) exact = node;
    if (!fallback && node.isBone && /hand/i.test(name)) fallback = node;
  });
  return exact || fallback || root;
}

function makeSaberVisual() {
  const root = new THREE.Group();
  root.name = 'Game2Lightsaber';

  const hilt = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.04, 0.28, 10),
    new THREE.MeshStandardMaterial({ color: 0x727b86, metalness: 0.9, roughness: 0.25 }),
  );
  hilt.position.y = 0.05;
  root.add(hilt);

  const bladeMat = new THREE.MeshBasicMaterial({
    color: 0xb8f7ff,
    transparent: true,
    opacity: 0.95,
    toneMapped: false,
  });
  const blade = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 1.15, 10), bladeMat);
  blade.position.y = 0.75;
  root.add(blade);

  const glow = new THREE.PointLight(0x65e8ff, 2.5, 3);
  glow.position.y = 0.65;
  root.add(glow);

  root.userData.bladeMaterial = bladeMat;
  root.userData.glow = glow;
  return root;
}

function disposeObject(root) {
  root?.traverse?.((node) => {
    node.geometry?.dispose?.();
    const mats = node.material ? (Array.isArray(node.material) ? node.material : [node.material]) : [];
    mats.forEach((m) => m?.dispose?.());
  });
}

export class Game2JediController {
  constructor({ scene, modelRef, playerAnimRef, targets = [], onSelectedPower, onStatus }) {
    this.scene = scene;
    this.modelRef = modelRef;
    this.playerAnimRef = playerAnimRef;
    this.targets = targets;
    this.onSelectedPower = onSelectedPower;
    this.onStatus = onStatus;

    this.selectedIndex = GAME2_FORCE_POWERS.findIndex((power) => power.id === 'push');
    this.effects = [];
    this.saber = null;
    this.saberAnchor = null;
    this.saberBaseRotation = new THREE.Euler();
    this.saberSwingTime = 0;
    this.saberThrow = null;

    this.speedTimer = 0;
    this.defenseTimer = 0;
    this.offenseTimer = 0;
    this.forceJumpOffset = 0;
    this.forceJumpVelocity = 0;

    this.onSelectedPower?.(this.getSelectedPower());
  }

  getSelectedPower() {
    return GAME2_FORCE_POWERS[this.selectedIndex] || GAME2_FORCE_POWERS[0];
  }

  selectPower(idOrIndex) {
    let next = typeof idOrIndex === 'number'
      ? idOrIndex
      : GAME2_FORCE_POWERS.findIndex((power) => power.id === idOrIndex);
    if (!Number.isInteger(next) || next < 0) return this.getSelectedPower();
    this.selectedIndex = ((next % GAME2_FORCE_POWERS.length) + GAME2_FORCE_POWERS.length) % GAME2_FORCE_POWERS.length;
    const selected = this.getSelectedPower();
    this.onSelectedPower?.(selected);
    return selected;
  }

  cyclePower(direction = 1) {
    return this.selectPower(this.selectedIndex + Math.sign(direction || 1));
  }

  handleDirectKey(code) {
    const id = DIRECT_KEYS[code];
    if (!id) return false;
    this.selectPower(id);
    this.cast(id);
    return true;
  }

  attachModel(model) {
    if (!model) return;
    if (this.saber?.parent) this.saber.parent.remove(this.saber);
    this.saber = makeSaberVisual();
    this.saberAnchor = findRightHand(model);

    if (this.saberAnchor === model) {
      this.saber.position.set(0.34, 1.0, 0.08);
      this.saber.rotation.set(0, 0, -0.35);
    } else {
      this.saber.position.set(0.02, 0.05, 0);
      this.saber.rotation.set(0, 0, -Math.PI / 2);
    }
    this.saberBaseRotation.copy(this.saber.rotation);
    this.saberAnchor.add(this.saber);
  }

  getSpeedMultiplier() {
    return this.speedTimer > 0 ? 1.75 : 1;
  }

  _modelPosition(out = new THREE.Vector3()) {
    const model = this.modelRef.current;
    if (!model) return out.set(0, 0, 0);
    return model.getWorldPosition(out);
  }

  _forward(out = new THREE.Vector3()) {
    const model = this.modelRef.current;
    if (!model) return out.set(0, 0, 1);
    return out.set(0, 0, 1).applyQuaternion(model.quaternion).setY(0).normalize();
  }

  _nearestTarget() {
    const model = this.modelRef.current;
    if (!model || !this.targets.length) return null;
    let best = null;
    let bestDist = Infinity;
    for (const target of this.targets) {
      if (!target?.group) continue;
      const dist = target.group.position.distanceToSquared(model.position);
      if (dist < bestDist) {
        bestDist = dist;
        best = target;
      }
    }
    return best;
  }

  _pulse(color, duration = 0.55, maxScale = 3.2, y = 0.9) {
    const model = this.modelRef.current;
    if (!model) return;
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.55, 18, 12),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.34, wireframe: true, depthWrite: false }),
    );
    mesh.position.copy(model.position);
    mesh.position.y += y;
    this.scene.add(mesh);
    this.effects.push({
      time: duration,
      total: duration,
      update: (dt, left) => {
        const t = 1 - left / duration;
        mesh.scale.setScalar(1 + t * maxScale);
        mesh.material.opacity = 0.34 * (1 - t);
        mesh.position.x = model.position.x;
        mesh.position.z = model.position.z;
      },
      dispose: () => {
        this.scene.remove(mesh);
        disposeObject(mesh);
      },
    });
  }

  _beam(target, color, duration = 0.32) {
    const model = this.modelRef.current;
    if (!model || !target?.group) return;
    const geometry = new THREE.BufferGeometry();
    const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.95, toneMapped: false });
    const line = new THREE.Line(geometry, material);
    this.scene.add(line);
    this.effects.push({
      time: duration,
      total: duration,
      update: () => {
        const from = this._modelPosition(tmpA);
        from.y += 1.25;
        const to = target.group.getWorldPosition(tmpB);
        to.y += 0.8;
        const points = [from.clone()];
        for (let i = 1; i < 6; i++) {
          const t = i / 6;
          points.push(new THREE.Vector3().lerpVectors(from, to, t).add(new THREE.Vector3(
            (Math.random() - 0.5) * 0.18,
            (Math.random() - 0.5) * 0.18,
            (Math.random() - 0.5) * 0.18,
          )));
        }
        points.push(to.clone());
        geometry.setFromPoints(points);
      },
      dispose: () => {
        this.scene.remove(line);
        geometry.dispose();
        material.dispose();
      },
    });
  }

  _impulseTarget(target, strength, toward = false) {
    const model = this.modelRef.current;
    if (!model || !target?.group) return;
    const dir = tmpA.subVectors(target.group.position, model.position).setY(0);
    if (dir.lengthSq() < 0.001) dir.copy(this._forward(tmpForward));
    dir.normalize();
    if (toward) dir.multiplyScalar(-1);
    target.velocity.addScaledVector(dir, strength);
  }

  _status(text) {
    this.onStatus?.(text);
  }

  attack() {
    const anim = this.playerAnimRef.current;
    anim?.requestAttack?.('attack');
    this.saberSwingTime = 0.34;
    this._status('Lightsaber attack');
    return true;
  }

  block() {
    const anim = this.playerAnimRef.current;
    anim?.setBlocking?.(true);
    this.defenseTimer = Math.max(this.defenseTimer, 0.55);
    this._pulse(COLORS.saberDefense, 0.38, 1.25, 1.0);
    setTimeout(() => anim?.setBlocking?.(false), 220);
    this._status('Saber block');
    return true;
  }

  forceJump() {
    this.playerAnimRef.current?.requestJump?.();
    this.forceJumpVelocity = 7.5;
    this.forceJumpOffset = Math.max(0, this.forceJumpOffset);
    this._pulse(COLORS.jump, 0.52, 2.5, 0.2);
    this._status('Force Jump');
    return true;
  }

  cast(id = this.getSelectedPower().id) {
    const power = GAME2_FORCE_POWERS.find((entry) => entry.id === id);
    if (!power) return false;
    this.selectPower(power.id);

    const model = this.modelRef.current;
    const target = this._nearestTarget();
    if (!model) return false;

    switch (power.id) {
      case 'heal':
        this._pulse(COLORS.heal, 0.8, 2.6, 0.9);
        break;
      case 'jump':
        return this.forceJump();
      case 'speed':
        this.speedTimer = 5;
        this._pulse(COLORS.speed, 0.55, 2.2, 0.5);
        break;
      case 'push':
        this._pulse(COLORS.push, 0.42, 4.1, 0.85);
        if (target) this._impulseTarget(target, 8, false);
        break;
      case 'pull':
        this._pulse(COLORS.pull, 0.42, 3.4, 0.85);
        if (target) this._impulseTarget(target, 7, true);
        break;
      case 'telepathy':
        if (target) {
          target.mindTimer = 4;
          target.body.material.transparent = true;
          target.body.material.opacity = 0.28;
          target.core.material.color.setHex(COLORS.telepathy);
        }
        this._pulse(COLORS.telepathy, 0.7, 2.6, 1.1);
        break;
      case 'grip':
        if (target) {
          target.gripTimer = 2.2;
          target.velocity.set(0, 0, 0);
        }
        this._beam(target, COLORS.grip, 0.5);
        break;
      case 'lightning':
        this._beam(target, COLORS.lightning, 0.7);
        if (target) target.flashTimer = 0.7;
        break;
      case 'saberThrow':
        this._startSaberThrow(target);
        break;
      case 'saberDefense':
        this.defenseTimer = 5;
        this._pulse(COLORS.saberDefense, 0.85, 2.0, 1.0);
        break;
      case 'saberOffense':
        this.offenseTimer = 5;
        this._pulse(COLORS.saberOffense, 0.65, 1.8, 0.9);
        break;
      default:
        return false;
    }

    this._status(power.label);
    return true;
  }

  _startSaberThrow(target) {
    const model = this.modelRef.current;
    if (!model || this.saberThrow) return;
    const visual = makeSaberVisual();
    this.scene.add(visual);
    this.saber.visible = false;
    const start = model.getWorldPosition(new THREE.Vector3());
    start.y += 1.15;
    const forward = this._forward(new THREE.Vector3());
    const end = target?.group
      ? target.group.position.clone().add(new THREE.Vector3(0, 0.8, 0))
      : start.clone().addScaledVector(forward, 5.5);
    this.saberThrow = { visual, start, end, time: 0, duration: 0.9 };
  }

  update(delta) {
    const model = this.modelRef.current;
    if (!model) return;

    this.speedTimer = Math.max(0, this.speedTimer - delta);
    this.defenseTimer = Math.max(0, this.defenseTimer - delta);
    this.offenseTimer = Math.max(0, this.offenseTimer - delta);

    if (this.saber?.userData?.bladeMaterial) {
      this.saber.userData.bladeMaterial.color.setHex(this.offenseTimer > 0 ? 0xff8a80 : 0xb8f7ff);
      this.saber.userData.glow.color.setHex(this.offenseTimer > 0 ? 0xff5147 : 0x65e8ff);
      this.saber.userData.glow.intensity = this.offenseTimer > 0 ? 4 : 2.5;
    }

    if (this.saberSwingTime > 0 && this.saber) {
      this.saberSwingTime = Math.max(0, this.saberSwingTime - delta);
      const t = 1 - this.saberSwingTime / 0.34;
      this.saber.rotation.z = this.saberBaseRotation.z + Math.sin(t * Math.PI) * (this.offenseTimer > 0 ? 2.25 : 1.65);
      if (this.saberSwingTime === 0) this.saber.rotation.copy(this.saberBaseRotation);
    }

    if (this.forceJumpVelocity !== 0 || this.forceJumpOffset > 0) {
      this.forceJumpVelocity -= 14.5 * delta;
      this.forceJumpOffset += this.forceJumpVelocity * delta;
      if (this.forceJumpOffset <= 0) {
        this.forceJumpOffset = 0;
        this.forceJumpVelocity = 0;
      }
      model.position.y += this.forceJumpOffset;
    }

    for (const target of this.targets) {
      target.group.position.addScaledVector(target.velocity, delta);
      target.velocity.multiplyScalar(Math.pow(0.08, delta));
      const dist = Math.hypot(target.group.position.x, target.group.position.z);
      if (dist > 11) {
        target.group.position.x *= 11 / dist;
        target.group.position.z *= 11 / dist;
      }

      if (target.gripTimer > 0) {
        target.gripTimer = Math.max(0, target.gripTimer - delta);
        const t = 1 - target.gripTimer / 2.2;
        target.group.position.y = target.baseY + Math.sin(Math.min(1, t) * Math.PI) * 2.1;
      } else {
        target.group.position.y = THREE.MathUtils.lerp(target.group.position.y, target.baseY, Math.min(1, 8 * delta));
      }

      if (target.mindTimer > 0) {
        target.mindTimer = Math.max(0, target.mindTimer - delta);
        if (target.mindTimer === 0) {
          target.body.material.opacity = 1;
          target.body.material.transparent = false;
          target.core.material.color.setHex(target.baseCoreColor);
        }
      }

      if (target.flashTimer > 0) {
        target.flashTimer = Math.max(0, target.flashTimer - delta);
        target.core.material.emissiveIntensity = 2.6;
      } else {
        target.core.material.emissiveIntensity = 0.8;
      }
    }

    if (this.saberThrow) {
      const state = this.saberThrow;
      state.time += delta;
      const t = Math.min(1, state.time / state.duration);
      const phase = t < 0.5 ? t * 2 : (1 - t) * 2;
      state.visual.position.lerpVectors(state.start, state.end, phase);
      state.visual.rotation.z += delta * 18;
      if (t >= 1) {
        this.scene.remove(state.visual);
        disposeObject(state.visual);
        this.saberThrow = null;
        if (this.saber) this.saber.visible = true;
      }
    }

    const nextEffects = [];
    for (const effect of this.effects) {
      effect.time -= delta;
      effect.update?.(delta, Math.max(0, effect.time));
      if (effect.time > 0) nextEffects.push(effect);
      else effect.dispose?.();
    }
    this.effects = nextEffects;
  }

  dispose() {
    for (const effect of this.effects) effect.dispose?.();
    this.effects = [];
    if (this.saberThrow) {
      this.scene.remove(this.saberThrow.visual);
      disposeObject(this.saberThrow.visual);
      this.saberThrow = null;
    }
    if (this.saber?.parent) this.saber.parent.remove(this.saber);
    disposeObject(this.saber);
    this.saber = null;
  }
}
