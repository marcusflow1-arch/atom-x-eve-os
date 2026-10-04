import assert from 'node:assert/strict';
import test from 'node:test';
import { IDLE_VARIANT_WEIGHTS, IdleVariantDirector, fadeOutFromCurrentWeight, findIdleVariantClips } from '../src/components/getsuga/idleVariants.js';

// Minimal stand-ins for THREE.AnimationMixer / AnimationAction: enough state to
// see which action is playing, fading and looping.
class FakeAction {
  constructor(mixer, clip) {
    this.mixer = mixer; this.clip = clip; this.enabled = true; this.running = false; this.scheduled = false;
    this.weight = 1; this.fade = null; this.loop = null; this.clampWhenFinished = false; this.time = 0;
  }
  getClip() { return this.clip; }
  setLoop(mode, reps) { this.loop = [mode, reps]; return this; }
  reset() { this.time = 0; this.enabled = true; this.fade = null; return this; }
  setEffectiveTimeScale() { return this; }
  setEffectiveWeight(w) { this.weight = w; return this; }
  getEffectiveWeight() { return this.weight; }
  play() { this.running = true; this.scheduled = true; return this; }
  stop() { this.running = false; this.scheduled = false; this.fade = null; return this; }
  stopFading() { this.fade = null; return this; }
  fadeIn(d) { this.fade = ['in', d]; return this; }
  fadeOut(d) { this.fade = ['out', d]; return this; }
  crossFadeTo(other, d) { this.fadeOut(d); other.fadeIn(d); return this; }
  isRunning() { return this.enabled && this.running; }
  isScheduled() { return this.scheduled; }
}
class FakeMixer {
  constructor() { this.actions = new Map(); this.listeners = new Set(); }
  clipAction(clip) { if (!this.actions.has(clip)) this.actions.set(clip, new FakeAction(this, clip)); return this.actions.get(clip); }
  addEventListener(type, fn) { if (type === 'finished') this.listeners.add(fn); }
  removeEventListener(type, fn) { if (type === 'finished') this.listeners.delete(fn); }
  finish(action) { for (const fn of [...this.listeners]) fn({ type: 'finished', action }); }
}
const clip = (name) => ({ name, tracks: [{}], duration: 5 });
const CLIPS = ['Idle', 'Combat_Idle', 'GetsugaTensho', 'Idle_Stretch', 'Idle_LookAround', 'Idle_NeckRoll', 'Idle_Yawn'].map(clip);

function setup(options = {}) {
  const mixer = new FakeMixer();
  const idle = mixer.clipAction(CLIPS[0]).play();
  let rolls = 0;
  const director = new IdleVariantDirector({
    mixer, clips: CLIPS, idleAction: idle, firstDelay: [5, 5], delay: [10, 10],
    random: () => ((rolls++ * 0.37) % 1), ...options,
  });
  return { mixer, idle, director };
}

test('only the authored idle variants are picked up, as one-shot clips', () => {
  assert.deepEqual(findIdleVariantClips(CLIPS).map((c) => c.name), Object.keys(IDLE_VARIANT_WEIGHTS));
  const { director, mixer } = setup();
  assert.equal(director.size, 4);
  for (const name of Object.keys(IDLE_VARIANT_WEIGHTS)) {
    const action = mixer.clipAction(CLIPS.find((c) => c.name === name));
    assert.deepEqual(action.loop, [2200, 1]);
    assert.equal(action.clampWhenFinished, true);
  }
  // Combat_Idle / GetsugaTensho / Idle itself are never variants.
  assert.equal(director.variants.has('Combat_Idle'), false);
  assert.equal(director.variants.has('Idle'), false);
});

test('a variant starts only after the quiet period, then hands back to the same idle', () => {
  const { director, idle, mixer } = setup();
  director.update(4.9);
  assert.equal(director.isActive(), false);
  director.update(0.2);
  assert.equal(director.isActive(), true);
  const variant = director.active;
  assert.equal(variant.running, true);
  assert.deepEqual(idle.fade[0], 'out');
  assert.deepEqual(variant.fade[0], 'in');

  idle.enabled = false; // faded out, as three.js does after a crossfade
  mixer.finish(variant);
  assert.equal(director.isActive(), false);
  assert.equal(idle.enabled, true);
  assert.deepEqual(idle.fade[0], 'in');
  assert.deepEqual(variant.fade[0], 'out');
  assert.equal(idle.time, 0, 'idle resumes, it is not restarted by reset()');
  assert.equal(director.timer, 10, 'next variant waits a full quiet period');
});

test('a busy body postpones the variant instead of interrupting', () => {
  let busy = true;
  const { director } = setup({ canPlay: () => !busy });
  director.update(6);
  assert.equal(director.isActive(), false);
  assert.equal(director.timer, 1.5);
  busy = false;
  director.update(1.6);
  assert.equal(director.isActive(), true);
});

test('never the same variant twice in a row, and the stretch is the favourite', () => {
  const counts = {};
  let last = '';
  let seed = 7;
  const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const { director, mixer } = setup({ random });
  for (let i = 0; i < 400; i += 1) {
    assert.equal(director.play(), true);
    const name = director.activeName();
    assert.notEqual(name, last);
    counts[name] = (counts[name] || 0) + 1;
    last = name;
    mixer.finish(director.active);
  }
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  assert.equal(top, 'Idle_Stretch');
  assert.equal(Object.keys(counts).length, 4);
});

test('interrupt() hands the running variant to the caller and restarts the wait', () => {
  const { director } = setup();
  director.update(5.1);
  const running = director.active;
  assert.equal(director.interrupt(), running);
  assert.equal(director.isActive(), false);
  assert.equal(director.timer, 10);
  assert.equal(director.interrupt(), null);
});

test('fadeOutFromCurrentWeight keeps the current blend weight', () => {
  const mixer = new FakeMixer();
  const action = mixer.clipAction(clip('X')).play();
  action.weight = 0.4;
  action.fade = ['in', 1];
  assert.equal(fadeOutFromCurrentWeight(action, 0.2), true);
  assert.equal(action.weight, 0.4);
  assert.deepEqual(action.fade, ['out', 0.2]);
  action.running = false;
  assert.equal(fadeOutFromCurrentWeight(action, 0.2), false);
});

test('dispose detaches from the mixer', () => {
  const { director, mixer } = setup();
  assert.equal(mixer.listeners.size, 1);
  director.dispose();
  assert.equal(mixer.listeners.size, 0);
  director.update(100);
  assert.equal(director.isActive(), false);
});
