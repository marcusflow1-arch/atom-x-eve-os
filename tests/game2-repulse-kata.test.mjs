// Force Repulse (the special on X), Pull from above + Push, and the saber kata on both mouse buttons
// (real engine, tests/support/game2Sim.mjs).
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeGame, addFoe, run } from './support/game2Sim.mjs';
import { PULSE_MAX, PULSE_RADIUS, REPULSE_RISE } from '../src/components/game2/engine/force.js';
import { KATA_COST, KATA_STEPS, PULL_HANG } from '../src/components/game2/engine/fighter.js';
import { KATA_CHORD } from '../src/components/game2/engine/game.js';

const flat = (a, b) => Math.hypot(a[0] - b[0], a[2] - b[2]);
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const pose = f => { const A = f.actor; return { tuck: dist(A.bonePos('cranium'), A.bonePos('ltibia')), arms: dist(A.bonePos('lhand'), A.bonePos('rhand')) }; };
const ready = F => { F.fp = 100; F.cool.throw = 0; F.gcd = 0; };

test('Force Pull from above lifts the foe to you and holds them there; a Push then blows them away with the Push knockdown', () => {
  const g = makeGame(), P = g.player, F = g.force, foe = addFoe(g, [0, 0, 6], { hp: 400 });
  run(g, 30); P.vel[1] = 9; P.onGround = false; P.pos[1] = 0.6; run(g, 12); // jump: above them
  ready(F); assert.ok(F.activate('pull', 'key'));
  run(g, 26); // the pull lands on its frame, the flight takes ~0.33 s, then they hang for PULL_HANG s
  assert.equal(foe.status, 'flung');
  assert.ok(foe.pos[1] > 1.5, 'up in the air (' + foe.pos[1].toFixed(2) + ' m)');
  assert.ok(flat(foe.pos, P.pos) < 2.6, 'in front of the caster, not flying past (' + flat(foe.pos, P.pos).toFixed(2) + ' m)');
  const held = foe.pos.slice(); run(g, Math.floor(PULL_HANG * 60 * 0.3)); assert.ok(dist(foe.pos, held) < 0.05, 'hanging there');
  ready(F); assert.ok(F.activate('push', 'key')); run(g, 2);
  assert.equal(foe.statusAnim, 'BOTH_KNOCKDOWN1', 'the Force Push knockdown, blown backward');
  const from = foe.pos.slice(); run(g, 70);
  assert.ok(flat(foe.pos, from) > 6, 'blown well away (' + flat(foe.pos, from).toFixed(1) + ' m), not stopped where the pull would have landed them');
});

test('Force Repulse: rise, curl into a ball, burst open with the arms wide; foes blasted outward then disintegrate; come back down', () => {
  const g = makeGame(), P = g.player, F = g.force;
  const a = addFoe(g, [0, 0, 3], { name: 'a' }), b = addFoe(g, [4, 0, -3], { name: 'b' }), far = addFoe(g, [0, 0, PULSE_RADIUS + 3], { name: 'far' });
  run(g, 5); const stand = pose(P);
  F.pulse = PULSE_MAX; run(g, 1, () => ({ pressed: ['KeyX'] })); assert.equal(P.status, 'executing', 'locked into the move');
  run(g, 40);
  assert.ok(Math.abs(P.pos[1] - REPULSE_RISE) < 0.05, 'risen ' + REPULSE_RISE + ' m');
  assert.ok(pose(P).tuck < stand.tuck * 0.45, 'curled into a ball (head ' + pose(P).tuck.toFixed(2) + ' m from the knee)');
  assert.equal(a.status, 'normal', 'nothing yet: the Force is gathering');
  run(g, 20);
  assert.ok(pose(P).arms > 1.1, 'burst open, arms flung wide (' + pose(P).arms.toFixed(2) + ' m)');
  assert.equal(a.status, 'flung', 'blasted'); assert.equal(a.statusAnim, 'BOTH_KNOCKDOWN1');
  run(g, 6); assert.ok(flat(a.pos, P.pos) > 4, 'thrown outward first');
  run(g, 20);
  for (const f of [a, b]) { assert.equal(f.status, 'dead'); assert.ok(f.vaporized, f.name + ' disintegrated'); assert.equal(f.killedBy, P); }
  assert.notEqual(far.status, 'dead', 'out of reach');
  run(g, 60);
  assert.equal(P.status, 'normal', 'back in control'); assert.ok(P.pos[1] < 0.05, 'back on the floor');
});

test('saber kata: both mouse buttons spend 50 Force on the stance chain; a lone right click still throws the saber', () => {
  const g = makeGame(), P = g.player, F = g.force, I = g.input, foe = addFoe(g, [0, 0, 1.6], { hp: 2000 });
  P.igniteNow(); run(g, 60); F.fp = 100;
  const click = (l, r, pl, pr) => { I.btn = [l, false, r]; I.btnPressed = [pl, false, pr]; g.frameInput(1 / 60); I.btnPressed = [false, false, false]; };
  click(true, true, false, true);
  assert.ok(P.kata, 'both buttons: a kata'); assert.equal(F.fp, 100 - KATA_COST);
  assert.equal(P.thrown, null, 'and no throw');
  const steps = KATA_STEPS[P.saber.level].length, p0 = P.pos.slice(); let t = 0, maxHits = 0;
  while (P.kata && t < 600) { run(g, 1, () => ({ held: new Set(['KeyS']) })); maxHits = Math.max(maxHits, P.kata?.hits || 0); t++; }
  assert.equal(maxHits, steps, 'every move of the chain');
  assert.ok(foe.hp < 2000, 'it hurts'); assert.equal(P.saber.move, P.saber.I.LS_READY, 'back to the stance');
  assert.ok(flat(P.pos, p0) > 0.8 && P.pos[2] > p0[2], 'pressing forward, whatever the keys said');
  assert.equal(P.saber.rageMul, 1);
  F.fp = 30; click(true, true, true, true); assert.equal(P.kata, null, 'not enough Force: nothing');
  F.fp = 100; click(false, true, false, true); assert.equal(P.thrown, null, 'a right click waits a moment for the left one');
  run(g, Math.ceil(KATA_CHORD * 60) + 1); click(false, true, false, false); assert.ok(P.thrown, 'then the saber is thrown');
});

test('every kit and stance has a kata chain made of real saber moves', () => {
  const g = makeGame(), I = g.player.saber.I;
  for (const [k, steps] of Object.entries(KATA_STEPS)) { assert.ok(steps.length >= 4, k); for (const m of steps) assert.ok(I[m] != null, k + ': ' + m); }
});
