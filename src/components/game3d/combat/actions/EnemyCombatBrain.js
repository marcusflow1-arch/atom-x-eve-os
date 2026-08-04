// ─── Enemy Combat Brain ────────────────────────────────────────────────
// Same runner, same window rules as the player — only the decisions differ:
// when to open a combo, whether to continue it, and when to recover.

import CombatActionRunner from './CombatActionRunner';
import { ENEMY_ACTIONS, ENEMY_COMBO_OPENER } from './actionDefinitions';

export default class EnemyCombatBrain {
  constructor({
    model, playClip, getForward, onActionStart, onActionEnd,
    attackRange = 2.2, recovery = 0.9, continueChance = 0.75,
  } = {}) {
    this.runner = new CombatActionRunner({
      actions: ENEMY_ACTIONS, model, playClip, getForward, onActionStart, onActionEnd,
    });
    this.attackRange = attackRange;
    this.recovery = recovery;
    this.recoveryTimer = 0;
    this.continueChance = continueChance;
  }

  setModel(model) { this.runner.setModel(model); }
  isBusy() { return this.runner.isBusy(); }
  isMovementLocked() { return this.runner.isMovementLocked(); }

  takeStagger() { return this.runner.cancel('stagger'); }
  die() { return this.runner.cancel('death', { force: true }); }

  /**
   * @param delta      frame time
   * @param ctx        { targets, applyHit } passed straight to the runner
   * @param distance   current distance to the intended target
   */
  update(delta, ctx, distance = Infinity) {
    const inRange = distance <= this.attackRange;

    if (this.runner.isBusy()) {
      // Continue the chain by buffering inside the buffer window — but only
      // while the target is still reachable, so enemies don't flail at air.
      if (inRange && this.runner.canBufferNext() && !this.runner.getQueuedAction()) {
        if (Math.random() < this.continueChance) {
          const next = this.runner.nextChainStep();
          if (next) this.runner.request(next);
        }
      }
      this.runner.update(delta, ctx);
      if (!this.runner.isBusy()) this.recoveryTimer = this.recovery;
      return;
    }

    if (this.recoveryTimer > 0) { this.recoveryTimer -= delta; return; }
    if (inRange) this.runner.startAction(ENEMY_COMBO_OPENER);
  }
}