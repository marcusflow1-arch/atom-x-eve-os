import * as THREE from 'three';
import { GetsugaTensho } from './getsuga-tensho';

const normalize = (value = '') => String(value).toLowerCase();

export function createGetsugaIdleClip(attackClip) {
  if (!attackClip?.tracks?.length) return null;
  const duration = 2.8;
  const times = [0, duration * 0.5, duration];

  const tracks = attackClip.tracks.map((source) => {
    const interpolant = source.createInterpolant();
    const base = Array.from(interpolant.evaluate(0));
    const middle = [...base];
    const name = normalize(source.name);

    if (source instanceof THREE.VectorKeyframeTrack && /pelvis.*position|hips.*position/.test(name) && middle.length >= 3) {
      middle[1] += 0.008;
    }

    if (source instanceof THREE.QuaternionKeyframeTrack && /(spine_01|spine_02|spine1|spine2|neck_01|neck).*quaternion/.test(name) && middle.length >= 4) {
      const q = new THREE.Quaternion(...middle);
      const amount = /neck/.test(name) ? 0.006 : 0.012;
      q.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(amount, 0, 0)));
      middle.splice(0, 4, q.x, q.y, q.z, q.w);
    }

    return new source.constructor(source.name, times, [...base, ...middle, ...base]);
  });

  return new THREE.AnimationClip('GetsugaIdle', duration, tracks);
}

/**
 * Dashboard adapter around the exact Getsuga Tensho package supplied by the user.
 * The package owns the attack animation and all synchronized VFX. This adapter only
 * adds a lightweight looping idle between casts and exposes a small game-friendly API.
 */
export class GetsugaDashboardRuntime {
  constructor({ scene, camera = null, impactDistance = 7.2, onEvent = null } = {}) {
    this.scene = scene;
    this.camera = camera;
    this.impactDistance = impactDistance;
    this.onEvent = onEvent || (() => {});
    this.runtime = null;
    this.root = null;
    this.group = null;
    this.idleMixer = null;
    this.idleAction = null;
    this.ready = false;
    this.disposed = false;
  }

  attach(gltf) {
    if (this.disposed || !gltf?.scene) return false;
    const attackClip = (gltf.animations || []).find((clip) => clip?.name === 'GetsugaTensho')
      || (gltf.animations || []).find((clip) => /getsuga.*tensho/i.test(clip?.name || ''))
      || gltf.animations?.[0];
    if (!attackClip) throw new Error('GetsugaTensho animation is missing from Getsuga_Character.glb.');

    this.root = gltf.scene;
    this.runtime = new GetsugaTensho({
      scene: this.scene,
      camera: this.camera,
      palette: 'crimson',
      impactDistance: this.impactDistance,
      cinematicCamera: false,
      floatingRocks: true,
      tempo: 'anime',
      speed: 1,
      onEvent: (name) => {
        if (name === 'end') this.playIdle();
        this.onEvent(name, {
          time: this.runtime?.time || 0,
          frame: this.runtime?.frame || 1,
        });
      },
    });
    this.runtime.attach(gltf);
    this.group = this.runtime.group;

    const idleClip = createGetsugaIdleClip(attackClip);
    if (idleClip) {
      this.idleMixer = new THREE.AnimationMixer(this.root);
      this.idleAction = this.idleMixer.clipAction(idleClip);
      this.idleAction.setLoop(THREE.LoopRepeat, Infinity);
    }

    this.runtime.seek(0);
    this.ready = true;
    this.playIdle();
    return true;
  }

  play() {
    if (!this.ready || this.disposed || !this.runtime || this.runtime.playing) return false;
    this.idleAction?.stop();
    this.runtime.play({ restart: true });
    this.onEvent('castStart', { time: 0, frame: 1 });
    return true;
  }

  playIdle() {
    if (!this.ready || this.disposed) return false;
    this.runtime?.pause();
    this.runtime?.seek(0);
    if (this.idleAction) {
      this.idleAction.enabled = true;
      this.idleAction.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).play();
    }
    this.onEvent('idle', { time: 0, frame: 1 });
    return true;
  }

  update(dt) {
    if (!this.ready || this.disposed) return;
    const step = Math.min(0.05, Math.max(0, dt || 0));
    if (this.runtime?.playing) this.runtime.update(step);
    else this.idleMixer?.update(step);
  }

  isPlaying() {
    return Boolean(this.runtime?.playing);
  }

  setPaused(value) {
    if (!this.ready) return;
    if (value) {
      this.runtime?.pause();
      if (this.idleMixer) this.idleMixer.timeScale = 0;
    } else if (this.idleMixer) {
      this.idleMixer.timeScale = 1;
    }
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.idleMixer?.stopAllAction();
    this.runtime?.dispose();
    this.idleMixer = null;
    this.idleAction = null;
    this.runtime = null;
    this.root = null;
    this.group = null;
    this.ready = false;
  }
}

export default GetsugaDashboardRuntime;
