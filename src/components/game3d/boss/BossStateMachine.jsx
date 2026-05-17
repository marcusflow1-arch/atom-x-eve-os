// BossStateMachine — high-level boss states.
//
// States:
//   IDLE          — no players nearby; slow patrol/look-around
//   SEARCHING     — players detected, evaluating threat
//   ENGAGING      — closing distance to current target
//   MELEE_COMBAT  — close range, rotates melee/close abilities
//   RANGED_COMBAT — distant target, casts ranged/AOE abilities
//   SUMMONING     — channeling minion spawn (interruptible)
//   AERIAL_CAST   — channeling sky AOE (Meteor Rain)
//   ENRAGED       — HP < ENRAGE_THRESHOLD, hot path overlay
//   DEAD          — terminal
//
// The brain queries `evaluateState(ctx)` each think-tick and transitions
// when conditions warrant. Transitions are explicit + logged so we can
// trace boss behavior in dev tools.

export const BOSS_STATES = Object.freeze({
  IDLE: 'IDLE',
  SEARCHING: 'SEARCHING',
  ENGAGING: 'ENGAGING',
  MELEE_COMBAT: 'MELEE_COMBAT',
  RANGED_COMBAT: 'RANGED_COMBAT',
  SUMMONING: 'SUMMONING',
  AERIAL_CAST: 'AERIAL_CAST',
  ENRAGED: 'ENRAGED',
  DEAD: 'DEAD',
});

export const ENRAGE_HP_FRAC = 0.30;
export const DETECTION_RANGE = 22;
export const MELEE_RANGE = 4.5;
export const RANGED_THRESHOLD = 10;

export function createStateMachine(initialState = BOSS_STATES.IDLE) {
  let current = initialState;
  let timeInState = 0;
  let isEnraged = false; // sticky overlay — once enraged, always enraged

  const transitions = []; // ring buffer for debug

  function setState(next, reason = '') {
    if (next === current) return;
    transitions.push({ from: current, to: next, reason, t: performance.now() });
    if (transitions.length > 24) transitions.shift();
    current = next;
    timeInState = 0;
  }

  return {
    getState: () => current,
    getTimeInState: () => timeInState,
    isEnraged: () => isEnraged,
    transitions: () => transitions,
    setState,
    tick(dt) { timeInState += dt; },
    /**
     * Decide next state from world snapshot.
     * @param {{
     *   hpFrac:number,
     *   nearbyPlayers:number,
     *   targetDistance:number|null,
     *   castingAbility:string|null,
     *   readyAbility:string|null,
     *   summonCount:number,
     * }} ctx
     */
    evaluate(ctx) {
      // Hard overrides
      if (ctx.hpFrac <= 0) { setState(BOSS_STATES.DEAD, 'hp<=0'); return; }
      if (!isEnraged && ctx.hpFrac <= ENRAGE_HP_FRAC) {
        isEnraged = true;
        setState(BOSS_STATES.ENRAGED, 'hp<30%');
        return;
      }

      // Locked while channeling a cast
      if (ctx.castingAbility) {
        if (ctx.castingAbility === 'summon_legion') setState(BOSS_STATES.SUMMONING, 'casting summon');
        else if (ctx.castingAbility === 'meteor_rain') setState(BOSS_STATES.AERIAL_CAST, 'casting meteor');
        return;
      }

      // No target → idle / searching
      if (ctx.targetDistance === null) {
        if (ctx.nearbyPlayers === 0) setState(BOSS_STATES.IDLE, 'no players');
        else setState(BOSS_STATES.SEARCHING, 'players present, no target');
        return;
      }

      // ENRAGED is sticky — but still pick melee/ranged sub-behavior via the
      // brain. We keep the state label as ENRAGED for telemetry; the brain
      // reads `isEnraged()` to multiply attack speeds.
      if (isEnraged) {
        // Even when enraged, pick melee vs ranged for ability rotation context
        const closeEnough = ctx.targetDistance < MELEE_RANGE;
        setState(closeEnough ? BOSS_STATES.MELEE_COMBAT : BOSS_STATES.RANGED_COMBAT,
          closeEnough ? 'enraged melee' : 'enraged ranged');
        return;
      }

      // Normal: pick combat sub-state from distance
      if (ctx.targetDistance < MELEE_RANGE) {
        setState(BOSS_STATES.MELEE_COMBAT, 'in melee');
      } else if (ctx.targetDistance < DETECTION_RANGE) {
        setState(ctx.targetDistance > RANGED_THRESHOLD
          ? BOSS_STATES.RANGED_COMBAT : BOSS_STATES.ENGAGING,
          'closing/ranged');
      } else {
        setState(BOSS_STATES.SEARCHING, 'out of range');
      }
    },
  };
}