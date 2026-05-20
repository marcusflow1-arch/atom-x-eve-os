export const PlayerStates = {
  IDLE: 'idle',
  WALK: 'walk',
  RUN: 'run',
  SPRINT: 'sprint',
  ATTACK: 'attack',
  DODGE: 'dodge',
  HIT: 'hit',
  CAST: 'cast',
  MOUNTED: 'mounted',
  DEAD: 'dead',
};

const LOCKED_STATES = new Set([
  PlayerStates.ATTACK,
  PlayerStates.DODGE,
  PlayerStates.HIT,
  PlayerStates.CAST,
  PlayerStates.DEAD,
]);

export class PlayerStateMachine {
  constructor(initial = PlayerStates.IDLE) {
    this.current = initial;
    this.previous = null;
    this.locked = false;
    this.lockTimer = 0;
  }

  canTransition(next) {
    if (!next || this.current === PlayerStates.DEAD) return false;
    if (this.locked && next !== PlayerStates.DEAD) return false;
    return true;
  }

  set(next, { lock = 0 } = {}) {
    if (!this.canTransition(next)) return false;
    this.previous = this.current;
    this.current = next;
    this.locked = lock > 0 || LOCKED_STATES.has(next);
    this.lockTimer = lock;
    return true;
  }

  lock(duration = 0) {
    this.locked = true;
    this.lockTimer = duration;
  }

  unlock() {
    this.locked = false;
    this.lockTimer = 0;
  }

  update(delta) {
    if (this.lockTimer > 0) {
      this.lockTimer = Math.max(0, this.lockTimer - delta);
      if (this.lockTimer === 0 && this.current !== PlayerStates.DEAD) this.unlock();
    }
  }
}