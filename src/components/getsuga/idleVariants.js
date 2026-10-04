// three.js LoopOnce. Kept as a literal so this module (and its unit test)
// needs no three.js import; the value has been stable for years.
const LOOP_ONCE = 2200;

// The male character GLB ships one looping 'Idle' (breathing, blinks, eye
// darts, weight shifts) plus short one-shot idle variants. The variants are
// separate clips so they can play on their own, at random moments, while the
// character is standing idle. Bigger weight = picked more often.
export const IDLE_VARIANT_WEIGHTS = Object.freeze({
  Idle_Stretch: 4,
  Idle_LookAround: 2,
  Idle_NeckRoll: 1.5,
  Idle_Yawn: 1,
});

// Seconds of plain Idle before the first variant, and between variants.
export const IDLE_VARIANT_FIRST_DELAY = Object.freeze([7, 13]);
export const IDLE_VARIANT_DELAY = Object.freeze([12, 24]);

const between = (range, random) => range[0] + (range[1] - range[0]) * random();

/**
 * Fade an action out from the weight it currently has. `fadeOut()` alone starts
 * from full weight, which pops the pose when the action was still fading in.
 */
export function fadeOutFromCurrentWeight(action, duration) {
  if (!action?.isRunning?.()) return false;
  const weight = action.getEffectiveWeight();
  action.stopFading();
  action.setEffectiveWeight(weight);
  action.fadeOut(duration);
  return true;
}

export function findIdleVariantClips(clips = [], weights = IDLE_VARIANT_WEIGHTS) {
  return (clips || []).filter((clip) => {
    const name = String(clip?.name || '');
    return Object.prototype.hasOwnProperty.call(weights, name) && clip.tracks?.length;
  });
}

/**
 * Plays the authored idle variants at random times on top of a looping idle.
 *
 * The owner keeps the looping idle action; this only takes over while a
 * variant runs and hands the pose back to the same idle afterwards. Call
 * `update(dt)` every frame and `interrupt()` before anything else (an ability,
 * locomotion, a hit reaction) takes the body.
 */
export class IdleVariantDirector {
  constructor({
    mixer,
    clips = [],
    idleAction,
    weights = IDLE_VARIANT_WEIGHTS,
    firstDelay = IDLE_VARIANT_FIRST_DELAY,
    delay = IDLE_VARIANT_DELAY,
    fadeIn = 0.55,
    fadeOut = 0.7,
    canPlay = () => true,
    random = Math.random,
  } = {}) {
    this.mixer = mixer;
    this.idleAction = idleAction;
    this.weights = weights;
    this.delay = delay;
    this.fadeInTime = fadeIn;
    this.fadeOutTime = fadeOut;
    this.canPlay = canPlay;
    this.random = random;
    this.enabled = true;
    this.active = null;
    this.lastName = '';
    this.variants = new Map();

    for (const clip of findIdleVariantClips(clips, weights)) {
      const action = mixer.clipAction(clip);
      action.setLoop(LOOP_ONCE, 1);
      action.clampWhenFinished = true;
      this.variants.set(clip.name, action);
    }

    this.timer = between(firstDelay, random);
    this.onFinished = (event) => {
      if (event.action === this.active) this.returnToIdle();
    };
    if (this.variants.size) mixer.addEventListener('finished', this.onFinished);
  }

  get size() {
    return this.variants.size;
  }

  isActive() {
    return Boolean(this.active);
  }

  activeName() {
    return this.active ? this.active.getClip().name : '';
  }

  setEnabled(value) {
    this.enabled = Boolean(value);
    if (!this.enabled && this.active) this.returnToIdle();
  }

  setIdleAction(action) {
    this.idleAction = action;
  }

  /** Restart the quiet period (e.g. after the character was busy). */
  rest(range = this.delay) {
    this.timer = between(range, this.random);
  }

  pick() {
    const names = [...this.variants.keys()];
    if (!names.length) return '';
    // Never the same variant twice in a row when there is a choice.
    const pool = names.length > 1 ? names.filter((name) => name !== this.lastName) : names;
    const total = pool.reduce((sum, name) => sum + Math.max(0, Number(this.weights[name]) || 0), 0);
    let roll = this.random() * total;
    for (const name of pool) {
      roll -= Math.max(0, Number(this.weights[name]) || 0);
      if (roll <= 0) return name;
    }
    return pool[pool.length - 1];
  }

  /** Start one variant now. Returns false when the body is busy or none exist. */
  play(name = this.pick()) {
    const action = this.variants.get(name);
    const idle = this.idleAction;
    if (!action || !idle || this.active || !this.enabled || !this.canPlay()) return false;
    action.enabled = true;
    action.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).play();
    if (idle.isRunning()) idle.crossFadeTo(action, this.fadeInTime, false);
    else action.fadeIn(this.fadeInTime);
    this.active = action;
    this.lastName = name;
    return true;
  }

  /** Blend from the running variant back into the looping idle. */
  returnToIdle(fade = this.fadeOutTime) {
    const action = this.active;
    this.active = null;
    this.rest();
    const idle = this.idleAction;
    if (!action) return;
    if (!idle) { action.stop(); return; }
    // The idle kept its place in the loop while it was faded out; resume it
    // from there rather than restarting the cycle.
    idle.enabled = true;
    idle.setEffectiveTimeScale(1).setEffectiveWeight(1);
    if (!idle.isScheduled()) idle.play();
    action.crossFadeTo(idle, fade, false);
  }

  /**
   * Something else is taking the body. Returns the variant that was running
   * (still at its current weight) so the caller can fade it out into the new
   * action, or null when no variant was playing.
   */
  interrupt() {
    const action = this.active;
    this.active = null;
    this.rest();
    return action?.isRunning?.() ? action : null;
  }

  update(dt) {
    if (!this.variants.size || !this.enabled || this.active) return;
    this.timer -= Math.max(0, Number(dt) || 0);
    if (this.timer > 0) return;
    // Busy (casting, moving, paused…): look again a little later.
    if (!this.play()) this.timer = 1.5;
  }

  dispose() {
    if (this.variants.size) this.mixer?.removeEventListener('finished', this.onFinished);
    this.variants.clear();
    this.active = null;
    this.idleAction = null;
  }
}

export default IdleVariantDirector;
