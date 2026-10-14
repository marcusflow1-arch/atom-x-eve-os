import test from 'node:test';
import assert from 'node:assert/strict';
import { makeGame, addFoe, run } from './support/game2Sim.mjs';
import { PUSH_CHARGE_MAX, PULSE_MAX, PULSE_PER_HP, PULSE_PER_KILL, PULSE_RADIUS, SABER_ARC_R, INTERCEPT_BONUS } from '../src/components/game2/engine/force.js';

// Force combos and the Force Pulse special (real engine, tests/support/game2Sim.mjs).
const keys = (...k) => new Set(k);
const chargedPush = (g) => run(g, Math.ceil(PUSH_CHARGE_MAX * 60) + 5, (i) => (i === 0 ? { pressed: keys('Digit1'), held: keys('Digit1') } : { held: keys('Digit1') }));

test('Push + Speed: Force Speed right after a push that sent them flying dashes you to where they land, facing them', () => {
  const g = makeGame(), P = g.player, f = addFoe(g, [0, 0, 4]);
  chargedPush(g); assert.equal(f.status, 'flung'); run(g, 18); assert.equal(f.status, 'flung', 'still in the air 0.3 s later (past the 0.25 s Force cooldown)');
  run(g, 1, () => ({ pressed: keys('Digit6'), held: keys('Digit6') })); run(g, 30);
  assert.ok(g.force.active.speed, 'Speed is on as well');
  assert.ok(P.pos[2] > f.pos[2] + 0.5, `ended beyond them (${P.pos[2].toFixed(1)} vs ${f.pos[2].toFixed(1)})`);
  assert.ok(Math.abs(Math.cos(P.yaw) + 1) < 0.2, 'facing back toward them');
  assert.equal(P.interceptBonus, INTERCEPT_BONUS); assert.ok(P.interceptBonusUntil > g.t, 'a stronger hit while they are down');
  // without a fresh push, Speed is just Speed
  const h = makeGame(), Q = h.player; run(h, 1, () => ({ pressed: keys('Digit6'), held: keys('Digit6') })); run(h, 30);
  assert.ok(Math.hypot(Q.pos[0], Q.pos[2]) < 0.2, 'no dash');
});

test('saber throw + Force Lightning: lightning aimed at the thrown saber charges it; arcs from the blade hurt foes near it', () => {
  const g = makeGame(), P = g.player, near = addFoe(g, [-4, 0, 8]), far = addFoe(g, [6, 0, 2], { name: 'far' });
  P.igniteNow(); run(g, 30); P.throwSaber([0, 0, 1]);
  for (let i = 0; i < 60; i++) { run(g, 1, () => ({ alt: true })); if (P.thrown.phase === 'hover') break; }
  P.thrown.prey = null; P.thrown.pos = [-3, 1.2, 8]; P.thrown.phase = 'hover'; // parked next to `near`, out of the way of a lodge
  g.cam.yaw = Math.atan2(-3, 8); const fp = g.force.fp, a = near.hp, b = far.hp;
  run(g, 1, () => ({ alt: true, pressed: keys('Digit4'), held: keys('Digit4') }));
  for (let i = 0; i < 60; i++) { P.thrown.pos = [-3, 1.2, 8]; run(g, 1, () => ({ alt: true, held: keys('Digit4') })); }
  assert.ok(P.thrown.chargedUntil > g.t, 'the saber is charged');
  assert.ok(a - near.hp > 15, `the foe beside the saber is zapped (${(a - near.hp).toFixed(1)})`);
  assert.equal(far.hp, b, `a foe ${SABER_ARC_R}+ m from the blade is not`);
  assert.ok(fp - g.force.fp > 20, `Force drains about twice as fast (${(fp - g.force.fp).toFixed(1)} in 1 s)`);
});

test('Force Pulse: the meter fills from damage and defeats; X vaporizes every foe within reach', () => {
  const g = makeGame(), P = g.player, F = g.force;
  const a = addFoe(g, [0, 0, 3], { name: 'a' }), b = addFoe(g, [4, 0, -3], { name: 'b' }), c = addFoe(g, [0, 0, PULSE_RADIUS + 2.5], { name: 'c' });
  a.hurt(40, P); assert.equal(F.pulse, 40 * PULSE_PER_HP, 'damage fills it');
  const d = addFoe(g, [9, 0, 9], { name: 'd', hp: 10 }); d.hurt(50, P); assert.equal(F.pulse, 40 * PULSE_PER_HP + 10 * PULSE_PER_HP + PULSE_PER_KILL, 'a defeat adds a chunk (damage counts up to their health)');
  run(g, 1, () => ({ pressed: keys('KeyX') })); assert.ok(!F.pulsing, 'not charged yet: nothing');
  F.pulse = PULSE_MAX; run(g, 1, () => ({ pressed: keys('KeyX') })); assert.ok(F.pulsing, 'charged: the build-up starts'); assert.equal(F.pulse, 0);
  run(g, 40);
  for (const f of [a, b]) { assert.equal(f.status, 'dead', f.name + ' vaporized'); assert.ok(f.vaporized); assert.equal(f.killedBy, P); }
  assert.notEqual(c.status, 'dead', 'out of reach');
  assert.equal(F.pulse, 2 * PULSE_PER_KILL, 'the two defeats start the next charge');
});
