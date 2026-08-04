// ─── Combat Action Runner ──────────────────────────────────────────────
// One deterministic pipeline shared by the player and every enemy: play an
// action, track its time frame-by-frame, open/close buffer + cancel + hit
// windows from the action data, chain into the queued combo step, and fall
// back to idle when the chain ends.
//
// No setTimeout anywhere — every window is derived from accumulated action
// time, so slowed clips, frame drops and differing clip lengths stay in sync.

import * as THREE from 'three';
import { ACTION_PRIORITY, inWindow } from './actionDefinitions';
import { runSocketTrace, resetSocketTrace } from './hitDetection';

const _forward = new THREE.Vector3();

export default class CombatActionRunner {
  /**
   * @param {object} cfg
   *  actions   action definition table (PLAYER_ACTIONS / ENEMY_ACTIONS)
   *  model     THREE.Object3D that owns the sockets and gets moved by lunges
   *  playClip  (clipName, { fade, duration }) => boolean — your animation layer
   *  getForward () => THREE.Vector3 facing used for lunge travel
   *  onActionStart / onActionEnd  optional hooks (VFX, SFX, netcode)
   */
  constructor({ actions, model, playClip, getForward, onActionStart, onActionEnd } = {}) {
    this.actions = actions || {};
    this.model = model || null;
    this.playClip = playClip || null;
    this.getForward = getForward || null;
    this.onActionStart = onActionStart || null;
    this.onActionEnd = onActionEnd || null;

    this.currentActionName = null;
    this.currentDef = null;
    this.currentTime = 0;
    this.queuedAction = null;
    this.activeHitWindow = -1;
    this.hitTargets = new Set();
  }

  setModel(model) { this.model = model; }

  // ── Queries ──────────────────────────────────────────────────────────
  isBusy() { return !!this.currentDef; }
  isMovementLocked() { return !!this.currentDef?.movementLock; }
  hasSuperArmor() { return !!this.currentDef?.superArmor; }
  getActionName() { return this.currentActionName; }
  getActionTime() { return this.currentTime; }
  getQueuedAction() { return this.queuedAction; }
  isHitWindowActive() { return this.activeHitWindow !== -1; }

  canBufferNext() {
    return !!this.currentDef && inWindow(this.currentTime, this.currentDef.bufferWindow);
  }

  // A cancel of `kind` (dodge/block/stagger/...) is allowed when the action
  // data opens a window for it. Higher-priority kinds always win, so death
  // and stagger can break a swing that lists no rule at all.
  canCancel(kind) {
    if (!this.currentDef) return true;
    const priority = ACTION_PRIORITY[kind] ?? 0;
    const current = ACTION_PRIORITY[this.currentDef.kind] ?? 0;
    if (kind === 'death') return true;
    if (this.currentDef.superArmor && kind === 'stagger') return false;
    const rule = this.currentDef.cancelRules?.[kind];
    if (rule === null) return false;                       // explicitly forbidden
    if (Array.isArray(rule)) return inWindow(this.currentTime, rule);
    if (inWindow(this.currentTime, this.currentDef.cancelWindow)) return true;
    return priority > current;
  }

  // ── Input ────────────────────────────────────────────────────────────
  // Start it now if idle; otherwise queue it if we're inside the buffer
  // window and the current action actually chains into it.
  request(actionName) {
    if (!this.actions[actionName]) return false;
    if (!this.currentDef) return this.startAction(actionName);
    if (this.canBufferNext() && (this.currentDef.next || []).includes(actionName)) {
      this.queuedAction = actionName;
      return true;
    }
    return false;
  }

  // What this action would chain into next (first listed follow-up).
  nextChainStep() {
    return (this.currentDef?.next || [])[0] || null;
  }

  startAction(actionName) {
    const def = this.actions[actionName];
    if (!def) return false;
    if (this.playClip && this.playClip(def.clip, { fade: 0.12, duration: def.duration }) === false) {
      return false;
    }
    this.currentActionName = actionName;
    this.currentDef = def;
    this.currentTime = 0;
    this.queuedAction = null;
    this.activeHitWindow = -1;
    this.hitTargets.clear();
    for (const w of def.hitWindows || []) resetSocketTrace(this.model, w.socket);
    this.onActionStart?.(actionName, def);
    return true;
  }

  // Interrupt the current action (dodge, stagger, death). Respects cancel
  // rules unless forced.
  cancel(kind = 'stagger', { force = false } = {}) {
    if (!this.currentDef) return true;
    if (!force && !this.canCancel(kind)) return false;
    this.clearAction();
    return true;
  }

  clearAction() {
    const ended = this.currentActionName;
    this.currentActionName = null;
    this.currentDef = null;
    this.currentTime = 0;
    this.queuedAction = null;
    this.activeHitWindow = -1;
    this.hitTargets.clear();
    if (ended) this.onActionEnd?.(ended);
  }

  // ── Per-frame ────────────────────────────────────────────────────────
  update(delta, ctx) {
    if (!this.currentDef) return;
    this.currentTime += delta;
    this.applyLunge(delta);
    this.updateHitWindows(ctx);

    if (this.currentTime >= this.currentDef.duration) {
      const next = this.queuedAction;
      if (next) this.startAction(next);
      else this.clearAction();
    }
  }

  // Code-driven forward travel — the feel of root motion, with exact travel
  // distance and none of the collider/terrain/netcode pain.
  applyLunge(delta) {
    const lunge = this.currentDef.lunge;
    if (!lunge || !this.model) return;
    if (this.currentTime < lunge.start || this.currentTime > lunge.end) return;
    const span = Math.max(1e-4, lunge.end - lunge.start);
    const speed = lunge.distance / span;
    if (this.getForward) _forward.copy(this.getForward());
    else this.model.getWorldDirection(_forward);
    _forward.y = 0;
    if (_forward.lengthSq() < 1e-6) return;
    this.model.position.addScaledVector(_forward.normalize(), speed * delta);
  }

  // Damage exists only inside a hit window — never on button press. Entering
  // a new window resets the per-window registry so each target can be hit
  // once per window, not once per frame of overlap.
  updateHitWindows(ctx) {
    const windows = this.currentDef.hitWindows || [];
    let activeIndex = -1;
    for (let i = 0; i < windows.length; i++) {
      const w = windows[i];
      if (this.currentTime >= w.start && this.currentTime <= w.end) { activeIndex = i; break; }
    }
    if (activeIndex !== this.activeHitWindow) {
      this.activeHitWindow = activeIndex;
      this.hitTargets.clear();
      if (activeIndex !== -1) resetSocketTrace(this.model, windows[activeIndex].socket);
    }
    if (activeIndex === -1 || !ctx) return;
    runSocketTrace({
      model: this.model,
      windowDef: windows[activeIndex],
      hitRegistry: this.hitTargets,
      ctx,
      meta: { action: this.currentActionName, windowIndex: activeIndex },
    });
  }
}