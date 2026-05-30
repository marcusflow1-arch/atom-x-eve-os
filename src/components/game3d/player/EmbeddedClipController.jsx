/**
 * EmbeddedClipController
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles FBX models that ship with ALL animations baked into a single file
 * (common with Sketchfab exports). Detects clip names, maps them to logical
 * states (idle / walk / run), ensures only ONE plays at a time, and provides
 * smooth crossfade transitions.
 *
 * Designed to be a drop-in used alongside (or instead of) the external
 * AnimationFBX library when no separate clip files are available.
 *
 * Usage:
 *   const ctrl = new EmbeddedClipController(mixer, fbx.animations);
 *   ctrl.play('idle');                  // on spawn
 *   ctrl.transitionTo('run', 0.25);     // on movement start
 *   ctrl.update(delta);                 // in animation loop
 * ─────────────────────────────────────────────────────────────────────────────
 */

import * as THREE from 'three';

// ── Name matching patterns ────────────────────────────────────────────────────
// Each entry: { state, patterns[] }  — first match wins.
// Patterns are tested against the lowercased clip name.
const STATE_PATTERNS = [
  {
    state: 'idle',
    patterns: [
      /\bidle\b/,
      /standing[\s_-]?idle/,
      /\bpose\b/,
      /t[\s_-]?pose/,
    ],
  },
  {
    state: 'walk',
    patterns: [
      /\bwalk\b/,
      /walking/,
      /slow[\s_-]?run/,
    ],
  },
  {
    state: 'run',
    patterns: [
      /\brun\b/,
      /running/,
      /jog/,
      /sprint/,
    ],
  },
  {
    state: 'attack',
    patterns: [
      /attack/,
      /punch/,
      /slash/,
      /strike/,
      /swing/,
      /combo/,
    ],
  },
  {
    state: 'death',
    patterns: [
      /death/,
      /dying/,
      /\bdie\b/,
      /fall[\s_-]?down/,
      /knockdown/,
    ],
  },
  {
    state: 'jump',
    patterns: [
      /jump/,
      /leap/,
    ],
  },
  {
    state: 'hit',
    patterns: [
      /hit[\s_-]?react/,
      /\bhurt\b/,
      /\bhit\b/,
      /damage/,
    ],
  },
];

// States that should loop continuously
const LOOPING_STATES = new Set(['idle', 'walk', 'run', 'aimWalk', 'block']);

// ── Helpers ───────────────────────────────────────────────────────────────────
const matchState = (clipName = '') => {
  const lower = clipName.toLowerCase().replace(/[_\-]+/g, ' ').trim();
  for (const { state, patterns } of STATE_PATTERNS) {
    if (patterns.some((p) => p.test(lower))) return state;
  }
  return null;
};

// ── Controller class ──────────────────────────────────────────────────────────
export class EmbeddedClipController {
  /**
   * @param {THREE.AnimationMixer} mixer
   * @param {THREE.AnimationClip[]} clips  — all clips from fbx.animations
   */
  constructor(mixer, clips = []) {
    this.mixer = mixer;
    this.actions = {};       // state → AnimationAction
    this.allActions = [];    // every action (for stop-all)
    this.currentState = null;
    this._mapClips(clips);
  }

  // ── Clip mapping ─────────────────────────────────────────────────────────
  _mapClips(clips) {
    const unmapped = [];

    clips.forEach((clip) => {
      const state = matchState(clip.name);
      const action = this.mixer.clipAction(clip);

      // Stop it immediately — do NOT let THREE auto-play
      action.stop();
      action.enabled = false;
      action.setEffectiveWeight(0);

      this.allActions.push(action);

      if (state && !this.actions[state]) {
        this.actions[state] = action;
      } else {
        unmapped.push({ name: clip.name, action });
      }
    });

    // Fallback: if no idle was matched but we have clips, use clip[0] as idle
    if (!this.actions['idle'] && unmapped.length > 0) {
      this.actions['idle'] = unmapped[0].action;
      console.warn('[EmbeddedClipController] No idle clip matched — using first clip as idle:', clips[0]?.name);
    }

    // Fallback: if no run but walk exists, alias run → walk
    if (!this.actions['run'] && this.actions['walk']) {
      this.actions['run'] = this.actions['walk'];
    }
    // Fallback: if no walk but run exists, alias walk → run
    if (!this.actions['walk'] && this.actions['run']) {
      this.actions['walk'] = this.actions['run'];
    }

    console.info('[EmbeddedClipController] Mapped states:', Object.keys(this.actions));
    if (unmapped.length) {
      console.info('[EmbeddedClipController] Unmapped clips:', unmapped.map((u) => u.name));
    }
  }

  // ── Public API ───────────────────────────────────────────────────────────

  /** Returns true if the state has a bound clip */
  has(state) {
    return !!this.actions[state];
  }

  /** Hard-play a state (no crossfade) */
  play(state, timeScale = 1) {
    const action = this.actions[state];
    if (!action) return false;
    if (this.currentState === state) return true;

    // Stop all other actions
    this.allActions.forEach((a) => {
      if (a !== action) {
        a.fadeOut(0);
        a.stop();
        a.enabled = false;
        a.setEffectiveWeight(0);
      }
    });

    action.enabled = true;
    action.setEffectiveWeight(1);
    action.setEffectiveTimeScale(timeScale);

    if (LOOPING_STATES.has(state)) {
      action.setLoop(THREE.LoopRepeat, Infinity);
      action.clampWhenFinished = false;
    } else {
      action.setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = true;
    }

    action.reset().play();
    this.currentState = state;
    return true;
  }

  /**
   * Smooth crossfade to a new state.
   * @param {string} state
   * @param {number} fadeDuration  seconds (default 0.25)
   * @param {number} timeScale
   */
  transitionTo(state, fadeDuration = 0.25, timeScale = 1) {
    const next = this.actions[state];
    if (!next) return false;
    if (this.currentState === state) return true;

    const prev = this.currentState ? this.actions[this.currentState] : null;

    next.enabled = true;
    next.setEffectiveWeight(1);
    next.setEffectiveTimeScale(timeScale);

    if (LOOPING_STATES.has(state)) {
      next.setLoop(THREE.LoopRepeat, Infinity);
      next.clampWhenFinished = false;
    } else {
      next.setLoop(THREE.LoopOnce, 1);
      next.clampWhenFinished = true;
    }

    if (prev && prev !== next) {
      prev.fadeOut(fadeDuration);
    }

    next.reset().fadeIn(fadeDuration).play();
    this.currentState = state;
    return true;
  }

  /** Stop all actions immediately */
  stopAll() {
    this.allActions.forEach((a) => {
      a.stop();
      a.enabled = false;
      a.setEffectiveWeight(0);
    });
    this.currentState = null;
  }

  /** Get the current state name */
  getCurrent() {
    return this.currentState;
  }

  /**
   * Movement-driven state update — call this every frame.
   * @param {{ moving: boolean, running?: boolean }} opts
   * @param {number} fadeDuration
   */
  updateFromMovement({ moving, running = false }, fadeDuration = 0.25) {
    let targetState;
    if (!moving) {
      targetState = 'idle';
    } else if (running && this.has('run')) {
      targetState = 'run';
    } else if (this.has('walk')) {
      targetState = 'walk';
    } else {
      targetState = 'run'; // fallback if no walk clip
    }

    this.transitionTo(targetState, fadeDuration);
  }

  /**
   * Call once to start the default idle state on spawn.
   */
  init() {
    this.play('idle');
  }

  /**
   * Returns a debug summary of all detected clips.
   */
  getDebugInfo() {
    return {
      currentState: this.currentState,
      mappedStates: Object.keys(this.actions),
      totalActions: this.allActions.length,
    };
  }
}

/**
 * Convenience factory: given a loaded FBX object, create and init a controller.
 * @param {THREE.AnimationMixer} mixer
 * @param {object} fbx  — the FBX object returned by FBXLoader
 * @returns {EmbeddedClipController}
 */
export function createEmbeddedClipController(mixer, fbx) {
  const ctrl = new EmbeddedClipController(mixer, fbx.animations || []);
  ctrl.init();
  return ctrl;
}