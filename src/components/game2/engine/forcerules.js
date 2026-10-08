/* eslint-disable */
// Force Push / Pull / Grip / Lightning resolution rules.
// Ported from the retail game source (CODE-mp/game/w_force.c):
//   ForceThrow ........ L2531   (push + pull, power levels, counter, knockdown)
//   CanCounterThrow ... L2487   (when a defender is allowed to answer a push or pull)
//   WP_AbsorbConversion L654    (Force Absorb lowers the incoming power level)
//   ForceGrip ......... L1221   (when a grip can start)
//   DoGripAction ...... L3279   (grip damage, lift, "crack", release, absorb, break-free)
//   ForceLightningDamage L1497  (lightning vs Absorb)
// Everything here is pure (no engine objects) so it can be unit-tested. Distances are metres; the source uses
// Quake units at 40 units per metre in this model (72 units = 1.8 m).
//
// Where the retail game is fully deterministic we add one gameplay layer on top, clearly labelled: a *reaction roll*.
// Standing still on the ground with Force to spare, you only counter a push/pull if you also react in time.
// That is what makes "block it, sometimes" feel right instead of an automatic 100%.

export const UNITS_PER_M = 40;
export const GRIP_MAX_DIST = 256 / UNITS_PER_M;      // MAX_GRIP_DISTANCE (w_saber.h)
export const KNOCKDOWN_DIST = 128 / UNITS_PER_M;     // "can only do a knockdown if fairly close"
export const THROW_ARC_DOT = 0.6;                    // dot1 < 0.6 -> not in the push cone

// ---------------------------------------------------------------- state a rule needs to know about a fighter
// def = {
//   alive, level,          // level = the fighter's own Force Push/Pull level (0-3)
//   moving,                // holding a move key ("if you are moving, you get one less level of defense")
//   busy,                  // already in a Force animation / knocked down / gripped / choking (forceHandExtend != NONE)
//   swinging,              // saber is mid-swing (weaponTime > 0)
//   onGround, fp, cost,    // you cannot counter in the air; WP_ForcePowerUsable needs the power's Force cost
//   absorbActive, absorbLevel,
//   facing,                // attacker is in front of the defender (our addition: you can't counter what you can't see)
//   knockedDown,
//   reaction,              // 0..1 chance to react in time (our gameplay layer)
// }

// CanCounterThrow(): why a defender can NOT answer a push/pull, or null if they can.
export function counterBlocker(def) {
  if (!def.alive) return 'down';
  if (def.busy) return 'recovering';
  if (def.swinging) return 'mid-swing';
  if (!def.onGround) return 'airborne';
  if (!(def.level > 0)) return 'no Force';
  if (def.fp < def.cost) return 'low Force';
  return null;
}
export const canCounterThrow = def => counterBlocker(def) === null;

// WP_AbsorbConversion(): returns the attack's power level after absorb (or -1 when absorb is not active)
// plus the Force the absorber takes back ((spent / 3) * absorbLevel, at least 1).
export function absorbConversion(def, attackLevel, forceSpent) {
  if (!def.absorbActive || !(def.absorbLevel > 0)) return { level: -1, fpGain: 0 };
  const level = Math.max(0, attackLevel - def.absorbLevel);
  let fpGain = Math.floor(forceSpent / 3) * def.absorbLevel; if (fpGain < 1 && forceSpent >= 1) fpGain = 1;
  return { level, fpGain };
}

// Fraction of full push power that survives a partial counter (pushPowerMod -= x%): diff 1 -> 80% removed,
// diff 2 -> 40% removed, diff >= 3 -> 20% removed.
const PARTIAL = { 1: 0.2, 2: 0.6, 3: 0.8 };

// Resolve one Force Push (pull = false) or Force Pull (pull = true) against one defender.
// Returns { outcome, scale, knockdown, fpGain, reason, countered }
//   outcome: 'absorbed' | 'countered' | 'staggered' | 'hit' | 'knockdown'
//   scale  : 0..1 share of full power that reaches the defender (multiply the engine's push/pull speed by this)
export function resolveThrow({ attackerLevel, pull = false, def, dist = 0, forceSpent = 20, rng = Math.random }) {
  const res = { outcome: 'hit', scale: 1, knockdown: false, fpGain: 0, reason: '', countered: false, modLevel: attackerLevel, otherLevel: 0 };
  const ab = absorbConversion(def, attackerLevel, forceSpent);
  let mod = attackerLevel;
  if (ab.level !== -1) { mod = ab.level; res.fpGain = ab.fpGain; }
  res.modLevel = mod;
  if (mod <= 0) { res.outcome = 'absorbed'; res.scale = 0; res.reason = 'Force Absorb'; return res; }

  let other = def.level || 0; if (def.moving) other = Math.max(0, other - 1); // moving: one level less defence
  res.otherLevel = other;
  let scale = 1;
  if (other <= 0) res.reason = def.level > 0 ? 'moving' : 'no Force';
  else {
    const blocker = counterBlocker(def);
    if (blocker) res.reason = blocker;
    else {
      const chance = (def.reaction ?? 1) * (def.facing === false ? 0.35 : 1);
      if (rng() < chance) {
        res.countered = true;
        scale = other >= mod ? 0 : PARTIAL[Math.min(3, mod - other)]; // 0 = completely answered, else part is stopped
      } else res.reason = 'caught off guard';
    }
  }
  // knockdown: only a level-3 throw that out-ranks the defender (after the moving penalty), and only close up
  res.knockdown = mod > other && mod === 3 && dist <= KNOCKDOWN_DIST && !def.knockedDown;
  res.scale = scale;
  if (scale === 0) res.outcome = 'countered';
  else if (res.knockdown) res.outcome = 'knockdown';
  else if (scale < 0.5) res.outcome = 'staggered';
  else res.outcome = 'hit';
  if (res.outcome === 'hit' && res.countered) res.outcome = 'staggered';
  return res;
}

// ---------------------------------------------------------------- Force Grip
// ForceGrip(): can `att` start gripping `tgt`?  Returns null when allowed, otherwise the reason.
export function gripBlocker({ att, tgt, dist, inFront }) {
  if (!att.alive) return 'down';
  if (att.busy) return 'busy';
  if (att.swinging) return 'mid-swing';
  if (att.fp < att.cost) return 'low Force';
  if (!tgt.alive) return 'no target';
  if (tgt.gripped) return 'already gripped';
  if (tgt.crippled) return 'recovering';          // forceGripCripple: just choked, can't be gripped again right away
  if (dist > GRIP_MAX_DIST) return 'out of range';
  if (!inFront) return 'no target';
  return null;
}

// DoGripAction(): per-level behaviour. `elapsed` = seconds since the grip took hold.
//  level 1: holds up to 5 s, no lift;  level 2: lifts, 20-damage crack after 3 s, ends after 4 s;
//  level 3: carries the victim in front of the gripper, 40-damage crack after 3 s, ends after 4 s.
//  2 damage per second while choking at every level.
export const GRIP_DPS = 2;
export function gripPhase(level, elapsed) {
  if (level <= 0) return { end: true, lift: false, carry: false, crack: 0, crackAt: 0, dps: 0 };
  if (level === 1) return { end: elapsed > 5, lift: false, carry: false, crack: 0, crackAt: Infinity, dps: GRIP_DPS };
  if (level === 2) return { end: elapsed > 4, lift: true, carry: false, crack: 20, crackAt: 3, dps: GRIP_DPS };
  return { end: elapsed > 4, lift: true, carry: true, crack: 40, crackAt: 3, dps: GRIP_DPS };
}
// Level the grip actually has against this victim once Absorb is applied (0 = grip fizzles).
export function gripEffectiveLevel(def, gripLevel, forceSpent = 12) {
  const ab = absorbConversion(def, gripLevel, forceSpent);
  return ab.level === -1 ? { level: gripLevel, fpGain: 0 } : { level: ab.level, fpGain: ab.fpGain };
}
// In ForceThrow: a gripped fighter who lands a push/pull with level >= the grip level breaks the grip
// (the gripper is busy, so he cannot counter it).
export const gripBroken = (pushLevel, gripLevel) => pushLevel >= gripLevel;

// ---------------------------------------------------------------- Force Lightning
// ForceLightningDamage(): damage is zero if Absorb cancels the level, small if it only lowers it.
// Returns the damage multiplier (1 = full) and the Force gained by an absorber.
export function lightningMul(def, attackLevel, forceSpent = 1) {
  const ab = absorbConversion(def, attackLevel, forceSpent);
  if (ab.level === -1) return { mul: 1, fpGain: 0 };
  if (ab.level === 0) return { mul: 0, fpGain: ab.fpGain };
  return { mul: 0.5, fpGain: ab.fpGain };
}
