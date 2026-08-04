// ─── Player Combat Brain ───────────────────────────────────────────────
// Translates intent ("attack", "dodge", "block") into runner requests. It
// owns no timing of its own — every window question is answered by the
// runner from the action data, so input handlers stay dumb.

import CombatActionRunner from './CombatActionRunner';
import { PLAYER_ACTIONS, PLAYER_COMBO_OPENER } from './actionDefinitions';

export default class PlayerCombatBrain {
  constructor({ model, playClip, getForward, onActionStart, onActionEnd } = {}) {
    this.runner = new CombatActionRunner({
      actions: PLAYER_ACTIONS, model, playClip, getForward, onActionStart, onActionEnd,
    });
  }

  setModel(model) { this.runner.setModel(model); }
  isBusy() { return this.runner.isBusy(); }
  isMovementLocked() { return this.runner.isMovementLocked(); }

  // One attack button drives the whole chain: idle → opener, mid-swing →
  // buffer the next step if the buffer window is open.
  pressAttack() {
    if (!this.runner.isBusy()) return this.runner.request(PLAYER_COMBO_OPENER);
    const next = this.runner.nextChainStep();
    return next ? this.runner.request(next) : false;
  }

  // Dodge cancels a swing only inside that action's dodge window.
  pressDodge() {
    if (!this.runner.isBusy()) return true;
    return this.runner.cancel('dodge');
  }

  pressBlock() {
    if (!this.runner.isBusy()) return true;
    return this.runner.cancel('block');
  }

  // Incoming damage: super-armored actions shrug it off.
  takeStagger() { return this.runner.cancel('stagger'); }
  die() { return this.runner.cancel('death', { force: true }); }

  update(delta, ctx) { this.runner.update(delta, ctx); }
}