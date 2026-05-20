import * as THREE from 'three';

export class CoreAnimationController {
  constructor({ legacyController }) {
    this.legacy = legacyController;
    this.currentBase = null;
    this.currentMontage = null;
    this.queueList = [];
    this.locked = false;
  }

  play(name, options = {}) {
    if (!name || this.currentBase === name) return true;
    const played = this.legacy?.ChangeState?.(name, { fade: options.fade ?? 0.12, force: options.force });
    if (played) this.currentBase = name;
    return !!played;
  }

  transitionTo(name, options = {}) {
    return this.play(name, options);
  }

  queue(name, options = {}) {
    this.queueList.push({ name, options });
  }

  lock() { this.locked = true; }
  unlock() { this.locked = false; }

  playMontage(name, options = {}) {
    if (this.locked && !options.force) return false;
    const played = this.legacy?.PlayAnimation?.(name, { fade: options.fade ?? 0.05, force: true, timeScale: options.timeScale ?? 1 });
    if (played) this.currentMontage = name;
    return !!played;
  }

  blendUpperBody(name, options = {}) {
    return this.playMontage(name, options);
  }

  update(stateSnapshot, movementIntent) {
    if (!this.legacy) return;
    const combat = stateSnapshot.combat;
    if (combat === 'attack' || combat === 'combo' || combat === 'casting' || combat === 'hit_react' || combat === 'dodge') return;

    this.legacy.HandleMovement?.({
      moving: movementIntent.moveAmount > 0,
      running: stateSnapshot.locomotion === 'run' || stateSnapshot.locomotion === 'sprint' || stateSnapshot.locomotion === 'mounted_run',
      direction: movementIntent.direction,
      aiming: combat === 'aim' || combat === 'block',
    });
  }

  updateMixer(mixer, delta) {
    mixer?.update(delta);
  }
}