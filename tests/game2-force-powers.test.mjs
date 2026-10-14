import test from 'node:test';
import assert from 'node:assert/strict';
import { makeGame, addFoe, run } from './support/game2Sim.mjs';
import { THROW_COST, THROW_RECOVERY, HEAL_FP_PER_HP, PUSH_CHARGE_MAX, LEVITATE_S, POWER_BY_ID } from '../src/components/game2/engine/force.js';
import { THROW_SPIN, LEVITATE_HEIGHT } from '../src/components/game2/engine/fighter.js';
import { RESPAWN_SHIELD } from '../src/components/game2/engine/game.js';

// Force corrections and the new powers, on the real Game / Fighter / Force code (tests/support/game2Sim.mjs).
const keys = (...k) => new Set(k);

test('Force Heal: 0 to 100 % costs more than a full tank (>= 130 Force), and Force does not refill while healing', () => {
  const g = makeGame(), P = g.player, F = g.force;
  assert.ok(POWER_BY_ID.heal.cost + 100 * HEAL_FP_PER_HP >= 130);
  P.hp = 1; F.fp = F.max = 1000; // a deep tank just to measure the full price
  run(g, 1, () => ({ pressed: keys('Digit5'), held: keys('Digit5') }));
  for (let i = 0; i < 400 && P.hp < P.maxHp; i++) run(g, 1); // measure the moment the bar is full (Force regenerates again after)
  assert.equal(P.hp, P.maxHp);
  const spent = 1000 - F.fp;
  assert.ok(spent >= 130, `full heal cost ${spent.toFixed(1)} Force`);
  // with the normal tank a heal from (nearly) zero stops when the Force runs out, well short of full health
  const g2 = makeGame(); g2.player.hp = 1; g2.force.fp = 100;
  run(g2, 1, () => ({ pressed: keys('Digit5'), held: keys('Digit5') }));
  for (let i = 0; i < 400 && g2.force.holding === 'heal'; i++) run(g2, 1);
  assert.ok(g2.player.hp < 80, `one tank heals ${g2.player.hp.toFixed(1)} HP, not the whole bar`);
  assert.ok(g2.force.fp < 1, 'the heal stopped because the tank ran dry');
});

test('Force Push / Pull cost 22 and share a short recovery, so they cannot be spammed back to back', () => {
  const g = makeGame(), F = g.force; addFoe(g, [0, 0, 5]);
  run(g, 1, () => ({ pressed: keys('Digit2'), held: keys('Digit2') }));
  assert.equal(F.fp, 100 - THROW_COST + 0.15, 'first pull spent its cost (one frame of regen back)');
  const before = F.fp; run(g, 20, (i) => (i === 0 ? { pressed: keys('Digit2') } : {})); // 0.33 s later
  assert.ok(F.fp >= before, 'a second pull inside the recovery is refused and costs nothing');
  run(g, Math.ceil(THROW_RECOVERY * 60)); const ready = F.fp;
  run(g, 1, () => ({ pressed: keys('Digit2'), held: keys('Digit2') }));
  assert.ok(F.fp < ready - THROW_COST + 1, 'after the recovery it works again');
});

test('a charged Force Push (hold 1, release) reaches further and knocks down what a tap only staggers', () => {
  const tap = makeGame(), a = addFoe(tap, [0, 0, 5.5]);
  run(tap, 1, () => ({ pressed: keys('Digit1'), held: keys('Digit1') })); run(tap, 1); run(tap, 30);
  assert.notEqual(a.status, 'flung', 'a tapped push at 5.5 m staggers (no knockdown that far)');
  assert.equal(tap.force.fp > 100 - THROW_COST - 1, true);
  const g = makeGame(), b = addFoe(g, [0, 0, 5.5]); const hp = b.hp;
  run(g, Math.ceil(PUSH_CHARGE_MAX * 60) + 5, (i) => (i === 0 ? { pressed: keys('Digit1'), held: keys('Digit1') } : { held: keys('Digit1') }));
  assert.equal(b.status, 'flung', 'a fully charged push knocks them down from 5.5 m');
  assert.ok(g.force.fp < 100 - THROW_COST - 10, 'charging costs extra Force');
  run(g, 20); assert.ok(b.pos[2] > 8, 'and throws them further'); assert.ok(b.hp < hp - 10, 'and hurts more');
});

test('Force Push into a wall: they slam into it, take impact damage and leave a crack', () => {
  const wall = { collide(p, r) { if (p[2] > 7 - r) p[2] = 7 - r; } };
  const g = makeGame({ world: wall }), b = addFoe(g, [0, 0, 4]); const hp = b.hp;
  run(g, Math.ceil(PUSH_CHARGE_MAX * 60) + 5, (i) => (i === 0 ? { pressed: keys('Digit1'), held: keys('Digit1') } : { held: keys('Digit1') }));
  run(g, 30);
  assert.equal((g.cracks || []).length, 1, 'the wall cracked');
  assert.ok(Math.abs(g.cracks[0].p[2] - 7) < 0.1, 'at the wall');
  assert.ok(hp - b.hp > 30, `push + wall slam damage ${(hp - b.hp).toFixed(1)}`);
});

test('Force Pull brings them to the space in front of you; jump and pull, and they come up into the air', () => {
  const g = makeGame(), b = addFoe(g, [0, 0, 7]);
  run(g, 1, () => ({ pressed: keys('Digit2'), held: keys('Digit2') })); run(g, 60);
  assert.ok(Math.hypot(b.pos[0], b.pos[2] - 1.5) < 1.6, `grounded pull lands in front of the caster (${b.pos.map(v => v.toFixed(2))})`);
  const air = makeGame(), c = addFoe(air, [0, 0, 7]); const P = air.player;
  P.pos = [0, 4, 0]; P.vel = [0, 0, 0]; P.onGround = false; // high in the air (a Force Jump)
  let top = 0; run(air, 1, () => ({ pressed: keys('Digit2'), held: keys('Digit2') }));
  for (let i = 0; i < 40; i++) { P.pos[1] = 4; P.vel[1] = 0; run(air, 1); top = Math.max(top, c.pos[1]); }
  assert.ok(top > 3, `pulled up into the air (peak ${top.toFixed(2)} m)`);
});

test('Force Levitate (G): the target floats helpless; any hit, the caster attacking, or Absorb drops them; a push launches them', () => {
  const g = makeGame(), b = addFoe(g, [0, 0, 5]);
  run(g, 1, () => ({ pressed: keys('KeyG'), held: keys('KeyG') })); run(g, 90);
  assert.equal(b.status, 'levitated'); assert.ok(b.pos[1] > LEVITATE_HEIGHT - 0.3, `floats at ${b.pos[1].toFixed(2)} m`);
  assert.equal(g.force.levTarget, b);
  b.cmd.fwd = 1; b.cmd.attack = true; const at = b.pos.slice(); run(g, 20); assert.ok(Math.hypot(b.pos[0] - at[0], b.pos[2] - at[2]) < 0.05, 'cannot move or act');
  b.hurt(5, g.player); run(g, 1); assert.equal(b.status, 'flung', 'a hit drops them');
  run(g, 120); assert.notEqual(b.status, 'levitated');
  // time limit
  const t = makeGame(), c = addFoe(t, [0, 0, 5]); run(t, 1, () => ({ pressed: keys('KeyG'), held: keys('KeyG') })); run(t, Math.ceil(LEVITATE_S * 60) + 30);
  assert.notEqual(c.status, 'levitated', 'it wears off');
  // the caster attacking drops them
  const s = makeGame(), d = addFoe(s, [0, 0, 5]); s.player.igniteNow(); run(s, 1, () => ({ pressed: keys('KeyG'), held: keys('KeyG') })); run(s, 30);
  assert.equal(d.status, 'levitated'); run(s, 30, () => ({ attack: true })); assert.notEqual(d.status, 'levitated', 'swinging the saber ends it');
  // Absorb breaks it
  const ab = makeGame(), e = addFoe(ab, [0, 0, 5]); run(ab, 1, () => ({ pressed: keys('KeyG'), held: keys('KeyG') })); run(ab, 30);
  e.force.cast('absorb'); run(ab, 2); assert.notEqual(e.status, 'levitated', 'Absorb breaks free');
  // Levitate + Push = launch
  const lp = makeGame(), f = addFoe(lp, [0, 0, 5]); run(lp, 1, () => ({ pressed: keys('KeyG'), held: keys('KeyG') })); run(lp, 60);
  run(lp, 1, () => ({ pressed: keys('Digit1'), held: keys('Digit1') })); run(lp, 1); run(lp, 40);
  assert.ok(f.pos[2] > 10, `launched to ${f.pos[2].toFixed(1)} m`);
});

test('saber throw: spins three times faster, homes in on the nearest foe, lodges and keeps cutting until a push knocks it loose', () => {
  const g = makeGame(), P = g.player, b = addFoe(g, [2.5, 0, 6]); P.igniteNow(); run(g, 30);
  assert.equal(THROW_SPIN, 72);
  assert.ok(P.throwSaber([0, 0, 1])); // thrown straight ahead: the foe is off to the side
  const hp = b.hp; let lodged = false;
  for (let i = 0; i < 120 && !lodged; i++) { run(g, 1, () => ({ alt: true })); lodged = P.thrown?.phase === 'lodged'; }
  assert.ok(lodged, 'the blade curved onto the foe and lodged in them');
  const a0 = P.thrown.ang; run(g, 60, () => ({ alt: true }));
  assert.ok(P.thrown.ang - a0 > 70, 'spinning at 72 rad/s inside them');
  assert.ok(hp - b.hp > 30, `kept cutting while lodged (${(hp - b.hp).toFixed(1)} damage)`);
  b.force.cast('push'); run(g, 2, () => ({ alt: true }));
  assert.notEqual(P.thrown?.phase, 'lodged', 'their push knocks it loose');
});

test('respawn immunity lasts 3 s; falling out of the map is fatal and credits whoever pushed you', () => {
  const g = makeGame(), P = g.player; P.hp = 0; P.status = 'dead'; g.respawnPlayer();
  assert.equal(RESPAWN_SHIELD, 3); assert.ok(P.spawnShield > g.t);
  P.hurt(50, null); assert.equal(P.hp, P.maxHp, 'immune');
  run(g, 3 * 60 + 2); assert.equal(P.spawnShield, 0); P.hurt(10, null); assert.equal(P.hp, P.maxHp - 10);
  const chasm = { floorAt: (x, z) => (z > 6 ? null : 0) }; // nothing beyond z = 6
  const h = makeGame({ world: chasm }), b = addFoe(h, [0, 0, 4]);
  run(h, Math.ceil(PUSH_CHARGE_MAX * 60) + 5, (i) => (i === 0 ? { pressed: keys('Digit1'), held: keys('Digit1') } : { held: keys('Digit1') }));
  run(h, 180);
  assert.equal(b.status, 'dead'); assert.ok(b.fellOut, 'fell to their death'); assert.equal(b.killedBy, h.player, 'credited to the pusher');
});
