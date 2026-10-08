import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveThrow, counterBlocker, absorbConversion, gripBlocker, gripPhase, gripEffectiveLevel, gripBroken, lightningMul, GRIP_MAX_DIST, KNOCKDOWN_DIST } from '../src/components/game2/engine/forcerules.js';

// a defender who is standing still, on the ground, with Force to spare and who always reacts
const still = (o = {}) => ({ alive: true, level: 3, moving: false, busy: false, swinging: false, onGround: true, fp: 100, cost: 20, absorbActive: false, absorbLevel: 0, facing: true, knockedDown: false, reaction: 1, ...o });
const r = (def, o = {}) => resolveThrow({ attackerLevel: 3, def, dist: 2, rng: () => 0, ...o });

test('level 3 push vs a level 3 defender standing still is fully countered (w_force.c ForceThrow: otherPushPower >= modPowerLevel)', () => {
  const x = r(still()); assert.equal(x.outcome, 'countered'); assert.equal(x.scale, 0); assert.equal(x.knockdown, false); assert.equal(x.countered, true);
});
test('moving costs one level of defence: only 80% of the push is stopped and a close push still knocks you down', () => {
  const x = r(still({ moving: true })); assert.equal(x.otherLevel, 2); assert.equal(x.outcome, 'knockdown'); assert.ok(Math.abs(x.scale - 0.2) < 1e-9);
  const far = r(still({ moving: true }), { dist: KNOCKDOWN_DIST + 0.5 }); assert.equal(far.outcome, 'staggered'); assert.equal(far.knockdown, false);
});
test('level-1 defender who is moving has no defence at all', () => {
  const x = r(still({ level: 1, moving: true })); assert.equal(x.countered, false); assert.equal(x.scale, 1); assert.equal(x.outcome, 'knockdown');
});
test('you cannot counter mid-swing, in the air, while recovering, or without enough Force', () => {
  for (const [o, why] of [[{ swinging: true }, 'mid-swing'], [{ onGround: false }, 'airborne'], [{ busy: true }, 'recovering'], [{ fp: 5 }, 'low Force']]) {
    const x = r(still(o)); assert.equal(x.countered, false, why); assert.equal(x.reason, why); assert.equal(x.scale, 1);
  }
});
test('equal level that cannot counter is not a knockdown but takes the full shove', () => {
  const x = r(still({ swinging: true })); assert.equal(x.knockdown, false); assert.equal(x.outcome, 'hit'); assert.equal(x.scale, 1);
});
test('reaction roll: sometimes you are caught off guard even standing still', () => {
  const hit = r(still({ reaction: 0.7 }), { rng: () => 0.9 }); assert.equal(hit.countered, false); assert.equal(hit.reason, 'caught off guard');
  const block = r(still({ reaction: 0.7 }), { rng: () => 0.5 }); assert.equal(block.countered, true);
});
test('a push from behind is much harder to react to', () => {
  const x = r(still({ reaction: 1, facing: false }), { rng: () => 0.5 }); assert.equal(x.countered, false);
  const y = r(still({ reaction: 1, facing: false }), { rng: () => 0.2 }); assert.equal(y.countered, true);
});
test('partial counter tables follow the level difference (diff 1: 80% removed, 2: 40%, 3+: 20%)', () => {
  const lvl = l => r(still({ level: l }), { attackerLevel: 3 }).scale;
  assert.ok(Math.abs(lvl(2) - 0.2) < 1e-9); assert.ok(Math.abs(lvl(1) - 0.6) < 1e-9);
});
test('Force Absorb lowers the attack level by the absorb level and refunds Force', () => {
  const x = r(still({ absorbActive: true, absorbLevel: 3 })); assert.equal(x.outcome, 'absorbed'); assert.equal(x.scale, 0); assert.equal(x.fpGain, 18); // (20 / 3 = 6) * absorb level 3, as in WP_AbsorbConversion
  const part = r(still({ absorbActive: true, absorbLevel: 1, level: 0 })); assert.equal(part.modLevel, 2);
  assert.equal(absorbConversion(still(), 3, 20).level, -1);
});
test('a defender with no Force just takes it', () => { const x = r(still({ level: 0 })); assert.equal(x.reason, 'no Force'); assert.equal(x.outcome, 'knockdown'); });
test('counterBlocker order', () => { assert.equal(counterBlocker(still({ alive: false })), 'down'); assert.equal(counterBlocker(still()), null); });

test('grip needs a live, ungripped, uncrippled target in front and within 6.4 m', () => {
  const att = { alive: true, busy: false, swinging: false, fp: 50, cost: 12 }, tgt = { alive: true, gripped: false, crippled: false };
  assert.equal(gripBlocker({ att, tgt, dist: 3, inFront: true }), null);
  assert.equal(gripBlocker({ att, tgt, dist: GRIP_MAX_DIST + 0.1, inFront: true }), 'out of range');
  assert.equal(gripBlocker({ att, tgt, dist: 3, inFront: false }), 'no target');
  assert.equal(gripBlocker({ att: { ...att, swinging: true }, tgt, dist: 3, inFront: true }), 'mid-swing');
  assert.equal(gripBlocker({ att, tgt: { ...tgt, gripped: true }, dist: 3, inFront: true }), 'already gripped');
  assert.equal(gripBlocker({ att, tgt: { ...tgt, crippled: true }, dist: 3, inFront: true }), 'recovering');
  assert.equal(gripBlocker({ att: { ...att, fp: 3 }, tgt, dist: 3, inFront: true }), 'low Force');
});
test('grip phases: level 3 carries and cracks for 40 at 3 s, ends after 4 s; level 2 cracks for 20; level 1 never cracks', () => {
  const p3 = gripPhase(3, 3.1); assert.equal(p3.carry, true); assert.equal(p3.crack, 40); assert.ok(3.1 >= p3.crackAt); assert.equal(gripPhase(3, 4.1).end, true); assert.equal(gripPhase(3, 3.9).end, false);
  assert.equal(gripPhase(2, 1).lift, true); assert.equal(gripPhase(2, 3).crack, 20); assert.equal(gripPhase(1, 4.5).end, false); assert.equal(gripPhase(1, 5.1).end, true); assert.equal(gripPhase(1, 1).crackAt, Infinity);
});
test('Absorb 3 against grip 3 makes the grip fizzle; a level-3 push breaks a level-3 grip', () => {
  assert.equal(gripEffectiveLevel(still({ absorbActive: true, absorbLevel: 3 }), 3).level, 0);
  assert.equal(gripEffectiveLevel(still(), 3).level, 3);
  assert.equal(gripBroken(3, 3), true); assert.equal(gripBroken(2, 3), false);
});
test('lightning: absorb cancels it, lower absorb halves it', () => {
  assert.equal(lightningMul(still(), 3).mul, 1);
  assert.equal(lightningMul(still({ absorbActive: true, absorbLevel: 3 }), 3).mul, 0);
  assert.equal(lightningMul(still({ absorbActive: true, absorbLevel: 1 }), 3).mul, 0.5);
});
