// SPDX-License-Identifier: GPL-2.0
// Behavioral web reconstruction of Raven's code/cgame/cg_camera.cpp + cg_camera.h.
// The original source owns the concepts and state flow: move, pan, zoom, follow,
// track, distance, shake, smoothing, fades and ROFF playback. This module adapts
// those behaviors to Three.js without inventing substitute game assets.

import * as THREE from 'three';
import { JEDI_CAMERA_CONTRACT } from '../cameraContract';

export const JEDI_CAMERA_STATE = Object.freeze({
  MOVING: 0x00000001,
  PANNING: 0x00000002,
  ZOOMING: 0x00000004,
  BAR_FADING: 0x00000008,
  FADING: 0x00000010,
  FOLLOWING: 0x00000020,
  TRACKING: 0x00000040,
  ROFFING: 0x00000080,
  SMOOTHING: 0x00000100,
});

export const RAVEN_CAMERA_DEFAULTS = Object.freeze({
  cinematicFov: 90,
  gameplayFov: 80,
  thirdPersonRange: 80,
  thirdPersonMaxRange: 150,
  thirdPersonVertOffset: 16,
  thirdPersonAngle: 0,
  thirdPersonPitchOffset: 0,
  thirdPersonHorzOffset: 0,
  thirdPersonCameraDamp: 0.3,
  thirdPersonTargetDamp: 0.5,
  maxShakeIntensity: 16,
  barDurationMs: 1000,
  barHeight: 48,
});

const EPSILON = 1e-6;

function clamp01(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

function vector3(value, out) {
  if (value?.isVector3) return out.copy(value);
  if (Array.isArray(value)) return out.set(Number(value[0]) || 0, Number(value[1]) || 0, Number(value[2]) || 0);
  return out.set(Number(value?.x) || 0, Number(value?.y) || 0, Number(value?.z) || 0);
}

function vector4(value, out) {
  if (value?.isVector4) return out.copy(value);
  if (Array.isArray(value)) return out.set(Number(value[0]) || 0, Number(value[1]) || 0, Number(value[2]) || 0, Number(value[3]) || 0);
  return out.set(Number(value?.x) || 0, Number(value?.y) || 0, Number(value?.z) || 0, Number(value?.w) || 0);
}

function normalize360(value) {
  const n = Number(value) || 0;
  return ((n % 360) + 360) % 360;
}

function shortestAngleDelta(dest, current) {
  let delta = normalize360(dest) - normalize360(current);
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  return delta;
}

function directedAngleDelta(dest, current, direction) {
  const target = normalize360(dest);
  const start = normalize360(current);
  let delta1 = target - start;
  let delta2 = delta1 < 0 ? delta1 + 360 : delta1 - 360;
  if (!direction) return Math.abs(delta1) < Math.abs(delta2) ? delta1 : delta2;
  if (direction < 0) return delta1 < 0 ? delta1 : delta1 > 0 ? delta2 : 0;
  return delta1 > 0 ? delta1 : delta1 < 0 ? delta2 : 0;
}

function dampingAlpha(damping, deltaSeconds) {
  const d = THREE.MathUtils.clamp(Number(damping) || 0, 0.001, 0.999);
  return 1 - Math.pow(d, Math.max(0, Number(deltaSeconds) || 0) * 60);
}

function ravenAnglesToBasis(anglesDeg, forward, up, right) {
  const pitch = THREE.MathUtils.degToRad(anglesDeg.x);
  const yaw = THREE.MathUtils.degToRad(anglesDeg.y);
  const roll = THREE.MathUtils.degToRad(anglesDeg.z);
  const sp = Math.sin(pitch), cp = Math.cos(pitch);
  const sy = Math.sin(yaw), cy = Math.cos(yaw);
  const sr = Math.sin(roll), cr = Math.cos(roll);

  // id Tech AngleVectors in Raven XYZ (Z-up).
  const fx = cp * cy;
  const fy = cp * sy;
  const fz = -sp;
  const rx = (-sr * sp * cy) + (cr * sy);
  const ry = (-sr * sp * sy) - (cr * cy);
  const rz = -sr * cp;
  const ux = (cr * sp * cy) + (sr * sy);
  const uy = (cr * sp * sy) - (sr * cy);
  const uz = cr * cp;

  // Reconstruction world conversion is X,Z,-Y.
  forward.set(fx, fz, -fy).normalize();
  right.set(rx, rz, -ry).normalize();
  up.set(ux, uz, -uy).normalize();
}

export class JediCameraSystem {
  constructor({
    camera,
    collisionGeometry = null,
    contract = JEDI_CAMERA_CONTRACT,
    now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now()),
    random = Math.random,
  } = {}) {
    if (!camera) throw new Error('JediCameraSystem requires a Three.js camera.');
    this.camera = camera;
    this.collisionGeometry = collisionGeometry;
    this.contract = contract;
    this.now = now;
    this.random = random;

    this.mode = 'gameplay';
    this.infoState = 0;
    this.gameplayReady = false;

    this.origin = new THREE.Vector3();
    this.origin2 = new THREE.Vector3();
    this.angles = new THREE.Vector3();
    this.angles2 = new THREE.Vector3();

    this.moveDuration = 0;
    this.moveTime = 0;
    this.panDuration = 0;
    this.panTime = 0;

    this.fov = Number(contract.cinematicFov || RAVEN_CAMERA_DEFAULTS.cinematicFov);
    this.fov2 = this.fov;
    this.fovFrom = this.fov;
    this.fovDuration = 0;
    this.fovTime = 0;

    this.followResolver = null;
    this.followSpeed = 100;
    this.followInitLerp = false;
    this.subjectPos = new THREE.Vector3();
    this.previousSubjectPos = new THREE.Vector3();
    this.subjectSpeed = 0;
    this.followDistance = Number(contract.distance || 100);

    this.trackResolver = null;
    this.trackSpeed = 100;
    this.trackInitLerp = false;
    this.trackTarget = new THREE.Vector3();

    this.fadeColor = new THREE.Vector4();
    this.fadeSource = new THREE.Vector4();
    this.fadeDest = new THREE.Vector4();
    this.fadeTime = 0;
    this.fadeDuration = 0;

    this.barAlpha = 0;
    this.barAlphaSource = 0;
    this.barAlphaDest = 0;
    this.barHeight = 0;
    this.barHeightSource = 0;
    this.barHeightDest = 0;
    this.barTime = 0;

    this.shakeIntensity = 0;
    this.shakeDuration = 0;
    this.shakeStart = 0;

    this.smoothIntensity = 0;
    this.smoothDuration = 0;
    this.smoothStart = 0;
    this.smoothOrigin = new THREE.Vector3();
    this.smoothActive = false;

    this.roffFrames = [];
    this.roffFrame = 0;
    this.roffActive = null;

    this._up = new THREE.Vector3(0, 1, 0);
    this._forward = new THREE.Vector3();
    this._right = new THREE.Vector3();
    this._target = new THREE.Vector3();
    this._smoothedTarget = new THREE.Vector3();
    this._desired = new THREE.Vector3();
    this._direction = new THREE.Vector3();
    this._renderOrigin = new THREE.Vector3();
    this._renderAngles = new THREE.Vector3();
    this._shakePosition = new THREE.Vector3();
    this._shakeAngles = new THREE.Vector3();
    this._basisForward = new THREE.Vector3();
    this._basisUp = new THREE.Vector3();
    this._basisRight = new THREE.Vector3();
    this._ray = new THREE.Ray();

    this.configureProjection();
  }

  configureProjection() {
    this.camera.near = Number(this.contract.near || 1);
    this.camera.far = Number(this.contract.far || 65536);
    this.camera.fov = Number(this.contract.fov || RAVEN_CAMERA_DEFAULTS.gameplayFov);
    this.camera.aspect = Number(this.contract.aspect || (4 / 3));
    this.camera.updateProjectionMatrix();
  }

  setCollisionGeometry(geometry) {
    this.collisionGeometry = geometry || null;
  }

  snapGameplay({ playerPosition, yaw = 0, pitch = 0, distance } = {}) {
    this.mode = 'gameplay';
    this.gameplayReady = false;
    this.updateGameplay({ playerPosition, yaw, pitch, delta: 0, distance, snap: true });
  }

  updateGameplay({
    playerPosition,
    yaw = 0,
    pitch = 0,
    delta = 1 / 60,
    distance = this.contract.distance,
    snap = false,
  } = {}) {
    if (!playerPosition) return;
    this.mode = 'gameplay';
    this.configureProjection();

    const player = vector3(playerPosition, this._renderOrigin);
    const requestedDistance = THREE.MathUtils.clamp(
      Number(distance || this.contract.distance || 100),
      Number(this.contract.minimumDistance || 1),
      Number(this.contract.maxDistance || RAVEN_CAMERA_DEFAULTS.thirdPersonMaxRange),
    );

    this._forward.set(0, 0, -1).applyAxisAngle(this._up, yaw);
    this._right.set(1, 0, 0).applyAxisAngle(this._up, yaw);

    this._target.set(
      player.x,
      player.y + Number(this.contract.targetHeight || 30),
      player.z,
    );

    const horizontalDistance = requestedDistance * Math.cos(pitch);
    const verticalOrbit = requestedDistance * Math.sin(pitch);

    this._desired.copy(this._target)
      .addScaledVector(this._forward, -horizontalDistance)
      .addScaledVector(this._right, Number(this.contract.shoulderOffset || 0));
    this._desired.y += Number(this.contract.verticalOffset || RAVEN_CAMERA_DEFAULTS.thirdPersonVertOffset) + verticalOrbit;

    this._resolveCollision(this._target, this._desired);

    if (!this.gameplayReady || snap) {
      this.camera.position.copy(this._desired);
      this._smoothedTarget.copy(this._target);
      this.gameplayReady = true;
    } else {
      this.camera.position.lerp(
        this._desired,
        dampingAlpha(this.contract.cameraDamp || RAVEN_CAMERA_DEFAULTS.thirdPersonCameraDamp, delta),
      );
      this._smoothedTarget.lerp(
        this._target,
        dampingAlpha(this.contract.targetDamp || RAVEN_CAMERA_DEFAULTS.thirdPersonTargetDamp, delta),
      );
    }

    this._applyShake(this.camera.position, this._smoothedTarget, this.now());
    this.camera.up.set(0, 1, 0);
    this.camera.lookAt(this._smoothedTarget);
  }

  _resolveCollision(target, desired) {
    const tree = this.collisionGeometry?.boundsTree;
    if (!tree?.raycastFirst) return;

    this._direction.subVectors(desired, target);
    const fullDistance = this._direction.length();
    if (fullDistance <= EPSILON) return;

    this._direction.multiplyScalar(1 / fullDistance);
    this._ray.set(target, this._direction);
    const hit = tree.raycastFirst(this._ray, THREE.DoubleSide);
    if (!hit || !(hit.distance >= 0) || hit.distance >= fullDistance) return;

    const safeDistance = Math.max(6, hit.distance - Number(this.contract.collisionPadding || 8));
    desired.copy(target).addScaledVector(this._direction, safeDistance);
  }

  enable(nowMs = this.now()) {
    this.mode = 'cinematic';
    this.barAlpha = 0;
    this.barTime = nowMs;
    this.barAlphaSource = 0;
    this.barAlphaDest = 1;
    this.barHeightSource = 0;
    this.barHeightDest = Number(this.contract.barHeight || RAVEN_CAMERA_DEFAULTS.barHeight);
    this.barHeight = 0;
    this.infoState |= JEDI_CAMERA_STATE.BAR_FADING;
    this.fov = Number(this.contract.cinematicFov || RAVEN_CAMERA_DEFAULTS.cinematicFov);
    this.fov2 = this.fov;
    this.roffFrame = 0;
    this.roffActive = null;
  }

  disable(nowMs = this.now()) {
    this.mode = 'gameplay';
    this.barAlpha = 1;
    this.barTime = nowMs;
    this.barAlphaSource = 1;
    this.barAlphaDest = 0;
    this.barHeightSource = Number(this.contract.barHeight || RAVEN_CAMERA_DEFAULTS.barHeight);
    this.barHeightDest = 0;
    this.infoState |= JEDI_CAMERA_STATE.BAR_FADING;
    this.stopRoff();
    this.followDisable();
    this.trackDisable();
  }

  setPosition(value) {
    vector3(value, this.origin);
    if (this.mode === 'cinematic') this.camera.position.copy(this.origin);
  }

  move(value, durationMs = 0, nowMs = this.now()) {
    this.infoState &= ~JEDI_CAMERA_STATE.ROFFING;
    this.trackDisable();
    this.distanceDisable();

    if (!(durationMs > 0)) {
      this.infoState &= ~JEDI_CAMERA_STATE.MOVING;
      this.setPosition(value);
      return;
    }

    vector3(value, this.origin2);
    this.moveDuration = durationMs;
    this.moveTime = nowMs;
    this.infoState |= JEDI_CAMERA_STATE.MOVING;
  }

  setAngles(value) {
    vector3(value, this.angles);
    if (this.mode === 'cinematic') this._applyCinematicOrientation(this.angles);
  }

  pan(value, direction = [0, 0, 0], durationMs = 0, nowMs = this.now()) {
    this.followDisable();
    this.distanceDisable();

    const dest = vector3(value, this._renderAngles);
    const dir = vector3(direction, this._direction);

    if (!(durationMs > 0)) {
      this.infoState &= ~JEDI_CAMERA_STATE.PANNING;
      this.setAngles(dest);
      return;
    }

    this.angles2.set(
      directedAngleDelta(dest.x, this.angles.x, dir.x),
      directedAngleDelta(dest.y, this.angles.y, dir.y),
      directedAngleDelta(dest.z, this.angles.z, dir.z),
    );
    this.panDuration = durationMs;
    this.panTime = nowMs;
    this.infoState |= JEDI_CAMERA_STATE.PANNING;
  }

  setRoll(roll) {
    this.angles.z = Number(roll) || 0;
  }

  roll(roll, durationMs = 0, nowMs = this.now()) {
    if (!(durationMs > 0)) {
      this.setRoll(roll);
      return;
    }
    this.angles2.set(0, 0, shortestAngleDelta(roll, this.angles.z));
    this.panDuration = durationMs;
    this.panTime = nowMs;
    this.infoState |= JEDI_CAMERA_STATE.PANNING;
  }

  setFov(fov) {
    this.fov = Number(fov) || this.fov;
    this.fov2 = this.fov;
    this.camera.fov = this.fov;
    this.camera.updateProjectionMatrix();
  }

  zoom(fov, durationMs = 0, nowMs = this.now()) {
    if (!(durationMs > 0)) {
      this.setFov(fov);
      return;
    }
    this.fovFrom = this.fov;
    this.fov2 = Number(fov) || this.fov;
    this.fovDuration = durationMs;
    this.fovTime = nowMs;
    this.infoState |= JEDI_CAMERA_STATE.ZOOMING;
  }

  setFade(value) {
    this.infoState &= ~JEDI_CAMERA_STATE.FADING;
    this.fadeDuration = 0;
    vector4(value, this.fadeSource);
    this.fadeColor.copy(this.fadeSource);
  }

  fade(source, dest, durationMs = 0, nowMs = this.now()) {
    if (!(durationMs > 0)) {
      this.setFade(dest);
      return;
    }
    vector4(source, this.fadeSource);
    vector4(dest, this.fadeDest);
    this.fadeDuration = durationMs;
    this.fadeTime = nowMs;
    this.infoState |= JEDI_CAMERA_STATE.FADING;
  }

  follow(resolver, speed = 100, initLerp = false) {
    this.followDisable();
    if (typeof resolver !== 'function') return;
    this.followResolver = resolver;
    this.followSpeed = Number(speed) || 100;
    this.followInitLerp = Boolean(initLerp);
    this.infoState |= JEDI_CAMERA_STATE.FOLLOWING;
  }

  followDisable() {
    this.infoState &= ~JEDI_CAMERA_STATE.FOLLOWING;
    this.followResolver = null;
  }

  track(resolver, speed = 100, initLerp = false) {
    this.trackDisable();
    if (typeof resolver !== 'function') return;
    this.trackResolver = resolver;
    this.trackSpeed = Number(speed) || 100;
    this.trackInitLerp = Boolean(initLerp);
    this.infoState |= JEDI_CAMERA_STATE.TRACKING;
  }

  trackDisable() {
    this.infoState &= ~JEDI_CAMERA_STATE.TRACKING;
    this.trackResolver = null;
  }

  distance(value, initLerp = false) {
    this.followDistance = Math.max(0, Number(value) || 0);
    this.followInitLerp = Boolean(initLerp);
  }

  distanceDisable() {
    this.followDistance = 0;
  }

  shake(intensity, durationMs, nowMs = this.now()) {
    this.shakeIntensity = Math.min(
      Number(this.contract.maxShakeIntensity || RAVEN_CAMERA_DEFAULTS.maxShakeIntensity),
      Math.max(0, Number(intensity) || 0),
    );
    this.shakeDuration = Math.max(0, Number(durationMs) || 0);
    this.shakeStart = nowMs;
  }

  smooth(intensity, durationMs, nowMs = this.now()) {
    this.smoothActive = false;
    const amount = Number(intensity) || 0;
    const duration = Number(durationMs) || 0;
    if (amount <= 0 || amount > 1 || duration < 1) {
      this.infoState &= ~JEDI_CAMERA_STATE.SMOOTHING;
      return;
    }
    this.smoothIntensity = amount;
    this.smoothDuration = duration;
    this.smoothStart = nowMs;
    this.infoState |= JEDI_CAMERA_STATE.SMOOTHING;
  }

  startRoff(frames, nowMs = this.now()) {
    this.followDisable();
    this.trackDisable();
    if (!Array.isArray(frames) || !frames.length) {
      this.stopRoff();
      return;
    }
    this.roffFrames = frames.map(frame => ({
      originDelta: Array.isArray(frame.originDelta) ? frame.originDelta.slice(0, 3) : [0, 0, 0],
      angleDelta: Array.isArray(frame.angleDelta) ? frame.angleDelta.slice(0, 3) : [0, 0, 0],
      duration: Math.max(1, Number(frame.duration || frame.frameTime || 100)),
    }));
    this.roffFrame = 0;
    this.roffActive = null;
    this.roffNextTime = nowMs;
    this.infoState |= JEDI_CAMERA_STATE.ROFFING;
  }

  stopRoff() {
    this.infoState &= ~JEDI_CAMERA_STATE.ROFFING;
    this.roffFrames = [];
    this.roffFrame = 0;
    this.roffActive = null;
  }

  update(nowMs = this.now(), delta = 1 / 60) {
    if (this.mode !== 'cinematic') return;

    this._renderOrigin.copy(this.origin);
    this._renderAngles.copy(this.angles);

    this._updateRoff(nowMs, this._renderOrigin, this._renderAngles);
    this._updateZoom(nowMs);
    this._updatePan(nowMs, this._renderAngles);
    this._updateMove(nowMs, this._renderOrigin);

    if (this.infoState & JEDI_CAMERA_STATE.FOLLOWING) this._updateFollow(delta);
    if (this.infoState & JEDI_CAMERA_STATE.TRACKING) this._updateTrack();

    if (this.infoState & JEDI_CAMERA_STATE.FOLLOWING) this._renderOrigin.copy(this.origin);
    if (this.infoState & JEDI_CAMERA_STATE.SMOOTHING) this._updateSmooth(nowMs, this._renderOrigin);

    this.camera.position.copy(this._renderOrigin);

    if (this.infoState & JEDI_CAMERA_STATE.TRACKING && this.trackResolver) {
      const value = this.trackResolver();
      if (value) {
        vector3(value, this.trackTarget);
        this.camera.up.set(0, 1, 0);
        this.camera.lookAt(this.trackTarget);
      } else {
        this._applyCinematicOrientation(this._renderAngles);
      }
    } else {
      this._applyCinematicOrientation(this._renderAngles);
    }

    this._applyShake(this.camera.position, null, nowMs);
    this._updateFade(nowMs);
    this._updateBars(nowMs);
  }

  _updateMove(nowMs, renderOrigin) {
    if (!(this.infoState & JEDI_CAMERA_STATE.MOVING)) return;
    const t = clamp01((nowMs - this.moveTime) / Math.max(1, this.moveDuration));
    renderOrigin.lerpVectors(this.origin, this.origin2, t);
    if (t >= 1) {
      this.origin.copy(this.origin2);
      this.infoState &= ~JEDI_CAMERA_STATE.MOVING;
    }
  }

  _updatePan(nowMs, renderAngles) {
    if (!(this.infoState & JEDI_CAMERA_STATE.PANNING)) return;
    const t = clamp01((nowMs - this.panTime) / Math.max(1, this.panDuration));
    renderAngles.set(
      this.angles.x + this.angles2.x * t,
      this.angles.y + this.angles2.y * t,
      this.angles.z + this.angles2.z * t,
    );
    if (t >= 1) {
      this.angles.set(
        normalize360(this.angles.x + this.angles2.x),
        normalize360(this.angles.y + this.angles2.y),
        normalize360(this.angles.z + this.angles2.z),
      );
      this.infoState &= ~JEDI_CAMERA_STATE.PANNING;
    }
  }

  _updateZoom(nowMs) {
    if (!(this.infoState & JEDI_CAMERA_STATE.ZOOMING)) {
      this.camera.fov = this.fov;
      this.camera.updateProjectionMatrix();
      return;
    }
    const t = clamp01((nowMs - this.fovTime) / Math.max(1, this.fovDuration));
    const actual = THREE.MathUtils.lerp(this.fovFrom, this.fov2, t);
    this.camera.fov = actual;
    this.camera.updateProjectionMatrix();
    if (t >= 1) {
      this.fov = this.fov2;
      this.infoState &= ~JEDI_CAMERA_STATE.ZOOMING;
    }
  }

  _updateFollow(delta) {
    const values = this.followResolver?.();
    const subjects = Array.isArray(values) ? values : values ? [values] : [];
    if (!subjects.length) return;

    this.previousSubjectPos.copy(this.subjectPos);
    this.subjectPos.set(0, 0, 0);
    let count = 0;
    for (const value of subjects.slice(0, 16)) {
      vector3(value?.position ?? value, this._desired);
      this.subjectPos.add(this._desired);
      count += 1;
    }
    if (!count) return;
    this.subjectPos.multiplyScalar(1 / count);
    this.subjectSpeed = this.subjectPos.distanceTo(this.previousSubjectPos) / Math.max(delta, 1 / 240);

    if (this.followDistance > 0) {
      this._direction.subVectors(this.origin, this.subjectPos);
      if (this._direction.lengthSq() <= EPSILON) {
        ravenAnglesToBasis(this.angles, this._basisForward, this._basisUp, this._basisRight);
        this._direction.copy(this._basisForward).multiplyScalar(-1);
      } else {
        this._direction.normalize();
      }
      this._desired.copy(this.subjectPos).addScaledVector(this._direction, this.followDistance);
      const alpha = this.followInitLerp
        ? dampingAlpha(0.5, delta)
        : Math.min(1, (this.followSpeed * Math.max(delta, 0)) / Math.max(1, this.origin.distanceTo(this._desired)));
      this.origin.lerp(this._desired, alpha);
    }
  }

  _updateTrack() {
    const value = this.trackResolver?.();
    if (value) vector3(value?.position ?? value, this.trackTarget);
  }

  _updateFade(nowMs) {
    if (!(this.infoState & JEDI_CAMERA_STATE.FADING)) return;
    const t = clamp01((nowMs - this.fadeTime) / Math.max(1, this.fadeDuration));
    this.fadeColor.lerpVectors(this.fadeSource, this.fadeDest, t);
    if (t >= 1) this.infoState &= ~JEDI_CAMERA_STATE.FADING;
  }

  _updateBars(nowMs) {
    if (!(this.infoState & JEDI_CAMERA_STATE.BAR_FADING)) return;
    const duration = Number(this.contract.barDurationMs || RAVEN_CAMERA_DEFAULTS.barDurationMs);
    const t = clamp01((nowMs - this.barTime) / Math.max(1, duration));
    this.barAlpha = THREE.MathUtils.lerp(this.barAlphaSource, this.barAlphaDest, t);
    this.barHeight = THREE.MathUtils.lerp(this.barHeightSource, this.barHeightDest, t);
    if (t >= 1) this.infoState &= ~JEDI_CAMERA_STATE.BAR_FADING;
  }

  _updateSmooth(nowMs, renderOrigin) {
    if (nowMs > this.smoothStart + this.smoothDuration) {
      this.infoState &= ~JEDI_CAMERA_STATE.SMOOTHING;
      this.smoothActive = false;
      return;
    }
    if (!this.smoothActive) {
      this.smoothActive = true;
      this.smoothOrigin.copy(renderOrigin);
      return;
    }
    let factor = this.smoothIntensity;
    if (this.smoothDuration > 200 && nowMs > this.smoothStart + this.smoothDuration - 100) {
      factor += (1 - this.smoothIntensity)
        * (100 - (this.smoothStart + this.smoothDuration - nowMs)) / 100;
    }
    this.smoothOrigin.lerp(renderOrigin, clamp01(factor));
    renderOrigin.copy(this.smoothOrigin);
  }

  _applyShake(position, lookTarget, nowMs) {
    if (!(this.shakeDuration > 0)) return;
    if (nowMs > this.shakeStart + this.shakeDuration) {
      this.shakeIntensity = 0;
      this.shakeDuration = 0;
      return;
    }

    const averageFov = (this.fov + this.fov2) * 0.5;
    const elapsed = (nowMs - this.shakeStart) / Math.max(1, this.shakeDuration);
    const scale = Math.max(0, 1 - elapsed * (averageFov / 90));
    const intensity = this.shakeIntensity * scale;

    this._shakePosition.set(
      (this.random() * 2 - 1) * intensity,
      (this.random() * 2 - 1) * intensity,
      (this.random() * 2 - 1) * intensity,
    );
    position.add(this._shakePosition);

    if (lookTarget) {
      this._shakeAngles.set(
        (this.random() * 2 - 1) * intensity,
        (this.random() * 2 - 1) * intensity,
        0,
      );
      lookTarget.add(this._shakeAngles);
    }
  }

  _applyCinematicOrientation(anglesDeg) {
    ravenAnglesToBasis(anglesDeg, this._basisForward, this._basisUp, this._basisRight);
    this.camera.up.copy(this._basisUp);
    this._target.copy(this.camera.position).add(this._basisForward);
    this.camera.lookAt(this._target);
  }

  _updateRoff(nowMs, renderOrigin, renderAngles) {
    if (!(this.infoState & JEDI_CAMERA_STATE.ROFFING)) return;
    if (!this.roffActive) {
      if (this.roffFrame >= this.roffFrames.length) {
        this.stopRoff();
        return;
      }
      const frame = this.roffFrames[this.roffFrame];
      this.roffActive = {
        frame,
        start: nowMs,
        origin: this.origin.clone(),
        angles: this.angles.clone(),
      };
    }

    const active = this.roffActive;
    const t = clamp01((nowMs - active.start) / active.frame.duration);
    vector3(active.frame.originDelta, this._desired);
    renderOrigin.copy(active.origin).addScaledVector(this._desired, t);
    vector3(active.frame.angleDelta, this._direction);
    renderAngles.copy(active.angles).addScaledVector(this._direction, t);

    if (t >= 1) {
      this.origin.copy(renderOrigin);
      this.angles.copy(renderAngles);
      this.roffFrame += 1;
      this.roffActive = null;
      if (this.roffFrame >= this.roffFrames.length) this.stopRoff();
    }
  }

  getOverlayState() {
    return {
      barAlpha: this.barAlpha,
      barHeight: this.barHeight,
      fadeColor: this.fadeColor.clone(),
      inCamera: this.mode === 'cinematic',
    };
  }
}

export default JediCameraSystem;
