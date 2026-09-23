import * as THREE from 'three';

// Timing authored with the user-supplied Getsuga_Tensho_Character.glb.
// These markers let combat logic react to the embedded animation without
// separating the visual effect from the character that actually performs it.
export const GETSUGA_EVENTS = {
  summon: 0.07,
  ignite: 0.262,
  auraFlare: 0.325,
  lift: 0.489,
  overhead: 0.82,
  strike: 1.096,
  release: 1.16,
  impact: 1.612,
  swordVanish: 3.044,
  end: 3.444,
};

function findClip(clips = [], name, fallbackIndex = 0) {
  const wanted = String(name || '').trim().toLowerCase();
  return clips.find((clip) => String(clip?.name || '').trim().toLowerCase() === wanted)
    || clips.find((clip) => String(clip?.name || '').trim().toLowerCase().includes(wanted))
    || clips[fallbackIndex]
    || null;
}

export function createGetsugaIdleClip(attackClip) {
  if (!attackClip?.tracks?.length) return null;
  const duration = 2.8;
  const times = [0, duration * 0.5, duration];

  const tracks = attackClip.tracks.map((source) => {
    const interpolant = source.createInterpolant();
    const base = Array.from(interpolant.evaluate(0));
    const middle = [...base];
    const name = String(source.name || '').toLowerCase();

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
 * Card-effect runtime for the Admin "male" GLB.
 *
 * The character and the visual effect are intentionally the same loaded GLB:
 * - Idle loops while no card is being cast.
 * - A card proc plays the embedded GetsugaTensho clip once.
 * - The clip owns the sword summon, attack animation and visual effect package.
 * - When it finishes, the same player character blends back to Idle.
 */
export class GetsugaDashboardRuntime {
  constructor({ scene, camera = null, impactDistance = 7.2, onEvent = null } = {}) {
    this.scene = scene;
    this.camera = camera;
    this.impactDistance = impactDistance;
    this.onEvent = onEvent || (() => {});
    this.root = null;
    this.group = null;
    this.mixer = null;
    this.idleAction = null;
    this.attackAction = null;
    this.attackClip = null;
    this.ready = false;
    this.playing = false;
    this.paused = false;
    this.disposed = false;
    this.fired = new Set();
    this.finishedHandler = null;
  }

  attach(gltf) {
    if (this.disposed || !gltf?.scene) return false;

    const clips = gltf.animations || [];
    const embeddedIdle = findClip(clips, 'Idle', 0);
    const attackClip = findClip(clips, 'GetsugaTensho', 1);
    if (!attackClip) throw new Error('GetsugaTensho animation is missing from Getsuga_Tensho_Character.glb.');

    this.root = gltf.scene;
    this.attackClip = attackClip;
    this.group = new THREE.Group();
    this.group.name = 'LunaCardEffectPlayer';
    this.group.add(this.root);
    this.scene?.add(this.group);

    this.mixer = new THREE.AnimationMixer(this.root);
    const idleClip = embeddedIdle || createGetsugaIdleClip(attackClip);
    if (idleClip) {
      this.idleAction = this.mixer.clipAction(idleClip);
      this.idleAction.setLoop(THREE.LoopRepeat, Infinity);
    }

    this.attackAction = this.mixer.clipAction(attackClip);
    this.attackAction.setLoop(THREE.LoopOnce, 1);
    this.attackAction.clampWhenFinished = true;

    this.finishedHandler = (event) => {
      if (event.action !== this.attackAction) return;
      this.playing = false;
      this.onEvent('end', { time: this.attackAction?.time || attackClip.duration, frame: 1 });
      this.playIdle({ emit: true, blend: true });
    };
    this.mixer.addEventListener('finished', this.finishedHandler);

    this.ready = true;
    this.playIdle({ emit: true, blend: false });
    return true;
  }

  play() {
    if (!this.ready || this.disposed || this.paused || !this.attackAction || this.playing) return false;
    this.playing = true;
    this.fired.clear();

    this.attackAction.enabled = true;
    this.attackAction.reset();
    this.attackAction.setEffectiveTimeScale(1);
    this.attackAction.setEffectiveWeight(1);
    this.attackAction.play();

    if (this.idleAction?.isRunning()) this.idleAction.crossFadeTo(this.attackAction, 0.2, false);
    else this.idleAction?.stop();

    this.onEvent('castStart', { time: 0, frame: 1 });
    return true;
  }

  playIdle({ emit = true, blend = true } = {}) {
    if (!this.ready || this.disposed || !this.idleAction) return false;
    this.playing = false;

    this.idleAction.enabled = true;
    this.idleAction.reset();
    this.idleAction.setEffectiveTimeScale(1);
    this.idleAction.setEffectiveWeight(1);
    this.idleAction.play();

    if (blend && this.attackAction) this.attackAction.crossFadeTo(this.idleAction, 0.35, false);
    else this.attackAction?.stop();

    if (emit) this.onEvent('idle', { time: 0, frame: 1 });
    return true;
  }

  update(dt) {
    if (!this.ready || this.disposed || this.paused || !this.mixer) return;
    const step = Math.min(0.05, Math.max(0, Number(dt) || 0));
    this.mixer.update(step);

    if (!this.playing || !this.attackAction) return;
    const time = this.attackAction.time;
    for (const [name, marker] of Object.entries(GETSUGA_EVENTS)) {
      if (name === 'end' || this.fired.has(name) || time < marker) continue;
      this.fired.add(name);
      this.onEvent(name, { time, frame: 1 });
    }
  }

  isPlaying() {
    return Boolean(this.playing);
  }

  setPaused(value) {
    this.paused = Boolean(value);
    if (this.mixer) this.mixer.timeScale = this.paused ? 0 : 1;
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;

    if (this.finishedHandler && this.mixer) this.mixer.removeEventListener('finished', this.finishedHandler);
    this.mixer?.stopAllAction();
    if (this.group?.parent) this.group.parent.remove(this.group);

    this.root?.traverse((node) => {
      if (!node?.isMesh) return;
      node.geometry?.dispose?.();
      const materials = Array.isArray(node.material) ? node.material : [node.material];
      materials.filter(Boolean).forEach((material) => {
        Object.values(material).forEach((value) => value?.isTexture && value.dispose?.());
        material.dispose?.();
      });
    });

    this.root = null;
    this.group = null;
    this.mixer = null;
    this.idleAction = null;
    this.attackAction = null;
    this.attackClip = null;
    this.ready = false;
    this.playing = false;
    this.finishedHandler = null;
  }
}

export default GetsugaDashboardRuntime;
