import test from 'node:test';
import assert from 'node:assert/strict';
import { makeGame, addFoe, run } from './support/game2Sim.mjs';
import { executionFor, findExecutable, EXECUTE_HP, CRUSH_RANGE, EXECUTE_RANGE } from '../src/components/game2/engine/executions.js';

// Executions (R): Grip crush up close, Pull · Lightning · Speed cut at range, on a foe at or under 25 % health.
const keys = (...k) => new Set(k);
const low = (f) => { f.hp = f.maxHp * EXECUTE_HP; return f; };

test('a foe can be executed only at or under 25 % health, in front, in reach; up close it is the grip crush, further out the cut', () => {
  const g = makeGame(), P = g.player, f = addFoe(g, [0, 0, 2.5]);
  f.hp = f.maxHp * 0.3; assert.equal(executionFor(g, P, f), null, '30 % is too healthy');
  low(f); assert.equal(executionFor(g, P, f), 'crush');
  f.pos = [0, 0, CRUSH_RANGE + 2]; assert.equal(executionFor(g, P, f), 'bisect');
  f.pos = [0, 0, EXECUTE_RANGE + 1]; assert.equal(executionFor(g, P, f), null, 'out of reach');
  f.pos = [0, 0, -4]; assert.equal(executionFor(g, P, f), null, 'behind you');
  f.pos = [0, 0, 4]; f.spawnShield = g.t + 1; assert.equal(executionFor(g, P, f), null, 'not during respawn immunity');
  f.spawnShield = 0; run(g, 1); assert.equal(g.execCandidate?.victim, f, 'the HUD prompt has a target');
});

test('R: Grip crush lifts them by the throat and kills them; the executor is free again after', () => {
  const g = makeGame(), P = g.player, f = low(addFoe(g, [0, 0, 2.6]));
  run(g, 1); g.input.pressedSet.add('KeyR'); g.frameInput(1 / 60); g.input.endFrame();
  assert.equal(P.status, 'executing'); assert.equal(f.status, 'executed');
  let top = 0; for (let i = 0; i < 70; i++) { run(g, 1); top = Math.max(top, f.pos[1]); }
  assert.ok(top > 0.7, `lifted off the ground (${top.toFixed(2)} m)`);
  f.hurt(500, null); assert.notEqual(f.status, 'dead', 'nobody else can hurt them meanwhile');
  run(g, 60);
  assert.equal(f.status, 'dead'); assert.equal(f.killedBy, P);
  assert.equal(P.status, 'normal'); assert.ok(f.pos[1] < 0.05, 'the body drops to the floor');
});

test('R at range: Pull, Lightning, then a Force Speed dash through them cuts them in half', () => {
  const g = makeGame(), P = g.player, f = low(addFoe(g, [0, 0, 6]));
  run(g, 1); const ex = findExecutable(g, P); assert.equal(ex.kind, 'bisect');
  g.startExecution(P, f, 'bisect');
  run(g, 50); assert.ok(f.pos[2] < 3.2 && f.pos[1] > 0.8, `pulled in and held in the air (${f.pos.map(v => v.toFixed(2))})`);
  assert.ok(f.elecUntil > g.t, 'lightning on them');
  run(g, 60);
  assert.ok(f.cut, 'cut in half'); assert.equal(f.status, 'dead'); assert.equal(f.killedBy, P); assert.equal(f.actor.frozen, true);
  assert.ok(P.pos[2] > f.pos[2] + 1, 'the dash went straight through them');
  run(g, 60); assert.equal(P.status, 'normal');
  f.revive([0, 0, 6]); assert.equal(f.cut, null); assert.equal(f.actor.frozen, false, 'whole again after a respawn');
});

test('if the executor is killed mid-execution it is cancelled and the victim drops, alive', () => {
  const g = makeGame(), P = g.player, f = low(addFoe(g, [0, 0, 2.6]));
  g.startExecution(P, f, 'crush'); run(g, 30);
  P.hurt(1000, null); run(g, 90);
  assert.notEqual(f.status, 'dead'); assert.notEqual(f.status, 'executed'); assert.ok(f.hp > 0);
});

test('the Dark Jedi AI executes the player too when the player is low', () => {
  const g = makeGame(), P = g.player, f = addFoe(g, [0, 0, 2.4], { brain: true }); g.round = { state: 'fight', t: 0 };
  f.yaw = f.targetYaw = Math.PI; low(P); P.yaw = 0; P.takeMul = 0; let seen = false; // only an execution can end the player here
  for (let i = 0; i < 900 && !seen; i++) { run(g, 1); seen = P.status === 'executed'; }
  assert.ok(seen, 'executed by the AI');
  run(g, 150); assert.equal(P.status, 'dead'); assert.equal(P.killedBy, f);
});
