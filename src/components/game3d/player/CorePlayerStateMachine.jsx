import { classifyAXEAirState } from '../axe/player/AXEPlayerTraversalConfig';

export const PLAYER_PRIORITIES = {
  none: 0,
  aim: 1,
  block: 2,
  dodge: 7,
  attack: 8,
  combo: 9,
  casting: 9,
  hit_react: 10,
  dead: 99,
};

export class CorePlayerStateMachine {
  constructor() {
    this.current = {
      locomotion: 'idle',
      combat: 'none',
      stance: 'normal',
      mounted: false,
      locked: false,
      grounded: true,
      verticalVelocity: 0,
      justLanded: false,
    };
    this.intent = {
      moveAmount: 0,
      runHeld: false,
      sprintHeld: false,
      aimHeld: false,
      blockHeld: false,
      direction: 'forward',
      grounded: true,
      verticalVelocity: 0,
      justLanded: false,
    };
    this.lockTimer = 0;
    this.cancelTimer = 0;
    this.comboBuffer = null;
  }

  setIntent(nextIntent) {
    this.intent = { ...this.intent, ...nextIntent };
  }

  setAirborneState({ grounded, verticalVelocity = 0, justLanded = false }) {
    this.intent.grounded = !!grounded;
    this.intent.verticalVelocity = Number(verticalVelocity) || 0;
    this.intent.justLanded = !!justLanded;
    this.current.grounded = !!grounded;
    this.current.verticalVelocity = this.intent.verticalVelocity;
    this.current.justLanded = !!justLanded;
  }

  setMounted(enabled) {
    this.current.mounted = !!enabled;
    if (enabled) {
      this.current.stance = 'mounted';
      this.current.combat = 'none';
    } else if (this.current.stance === 'mounted') {
      this.current.stance = 'normal';
    }
  }

  setStance(stance) {
    if (this.current.locked) return false;
    this.current.stance = stance;
    return true;
  }

  canStart(combatState) {
    if (this.current.combat === 'dead') return false;
    if (!this.current.locked) return true;
    return PLAYER_PRIORITIES[combatState] > PLAYER_PRIORITIES[this.current.combat];
  }

  startCombat(combatState, { lock = 0.45, cancel = 0.2 } = {}) {
    if (!this.canStart(combatState)) {
      if (combatState === 'attack' || combatState === 'combo') this.comboBuffer = combatState;
      return false;
    }
    this.current.combat = combatState;
    this.current.locked = lock > 0;
    this.lockTimer = lock;
    this.cancelTimer = cancel;
    return true;
  }

  endCombat() {
    this.current.combat = this.intent.aimHeld ? 'aim' : this.intent.blockHeld ? 'block' : 'none';
    this.current.locked = false;
    this.lockTimer = 0;
    this.cancelTimer = 0;
  }

  update(delta) {
    if (this.lockTimer > 0) {
      this.lockTimer = Math.max(0, this.lockTimer - delta);
      this.cancelTimer = Math.max(0, this.cancelTimer - delta);
      if (this.lockTimer === 0) this.endCombat();
    }

    if (!this.current.locked) {
      const airState = classifyAXEAirState({
        grounded: this.intent.grounded,
        verticalVelocity: this.intent.verticalVelocity,
        justLanded: this.intent.justLanded,
      });

      if (airState) {
        this.current.locomotion = airState;
      } else if (this.current.stance === 'crouch') {
        this.current.locomotion = this.intent.moveAmount > 0 ? 'crouch_walk' : 'crouch_idle';
      } else if (this.current.mounted) {
        this.current.locomotion = this.intent.moveAmount > 0 ? (this.intent.runHeld ? 'mounted_run' : 'mounted_walk') : 'mounted_idle';
      } else if (this.intent.moveAmount <= 0) {
        this.current.locomotion = 'idle';
      } else if (this.intent.sprintHeld) {
        this.current.locomotion = 'sprint';
      } else if (this.intent.runHeld) {
        this.current.locomotion = 'run';
      } else {
        this.current.locomotion = 'walk';
      }
      this.current.combat = this.intent.blockHeld ? 'block' : this.intent.aimHeld ? 'aim' : this.current.combat === 'none' ? 'none' : this.current.combat;
    }

    this.current.grounded = !!this.intent.grounded;
    this.current.verticalVelocity = Number(this.intent.verticalVelocity) || 0;
    this.current.justLanded = !!this.intent.justLanded;
    if (this.intent.justLanded) this.intent.justLanded = false;

    const buffered = this.comboBuffer;
    if (buffered && !this.current.locked) {
      this.comboBuffer = null;
      this.startCombat(buffered, { lock: 0.5, cancel: 0.18 });
      return buffered;
    }
    return null;
  }

  getSnapshot() {
    return { ...this.current };
  }
}