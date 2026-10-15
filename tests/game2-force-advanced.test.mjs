// The charged two-handed Force Push, Force clashes, the Counter, the lightning storm, Mind Dominance and Force Dodge
// (real engine, tests/support/game2Sim.mjs).
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeGame, addFoe, run } from './support/game2Sim.mjs';
import { PUSH_CHARGE_MAX } from '../src/components/game2/engine/force.js';
import { CLASH_S } from '../src/components/game2/engine/clash.js';

// the player and a foe 5 m apart, facing each other, the foe having just pushed (or answered a push of) the player
function clashScene() {
  const g = makeGame(), P = g.player, F = g.force, foe = addFoe(g, [0, 0, 5], { hp: 300 }); run(g, 20); ready(F); ready(foe.force);
  foe.yaw = foe.targetYaw = Math.PI; foe.force.lastPush = { t: g.t, targets: [P] }; return { g, P, F, foe };
}
const clickFor = (g, s, perSec) => { const steps = Math.round(s * 60), every = perSec ? Math.max(1, Math.round(60 / perSec)) : 0; for (let i = 0; i < steps; i++) { if (every && i % every === 0 && g.clash) g.clash.click(g.player); run(g, 1); } };

const flat = (a, b) => Math.hypot(a[0] - b[0], a[2] - b[2]);
const ready = F => { F.fp = 100; F.cool.throw = 0; F.gcd = 0; };

test('a Force Push held for the full 3 s is pushed with both hands and throws them about twice as far', () => {
  const flight = charge => {
    const g = makeGame(), F = g.force, foe = addFoe(g, [0, 0, 3], { hp: 900 }); run(g, 20); ready(F);
    assert.ok(F.activate('push', 'key', { charge })); const anim = g.player.actor.torso.name || g.player.actor.legs.name; const from = foe.pos.slice();
    run(g, 150); return { d: flat(foe.pos, from), anim };
  };
  assert.equal(PUSH_CHARGE_MAX, 3);
  const tap = flight(0), full = flight(1);
  assert.equal(full.anim, 'G2_FORCEPUSH_2H', 'both hands'); assert.equal(tap.anim, 'BOTH_FORCEPUSH', 'a tap is the usual one-handed push');
  assert.ok(full.d > tap.d * 1.6, `twice as far: ${tap.d.toFixed(1)} m -> ${full.d.toFixed(1)} m`);
});

test('the two-handed push is the one-handed one with the right arm mirrored from the left', () => {
  const g = makeGame(), S = g.player.actor.skel, A = S.anims.G2_FORCEPUSH_2H, B = S.anims.BOTH_FORCEPUSH, R = S.rigJson.rig, NB = R.nBones;
  assert.ok(A && A.n === B.n && A.first >= R.nFrames - A.n, 'derived and appended after the bank');
  const i = n => R.g2Bones.indexOf(n), q = S.qBank, at = (f, b) => [...q.subarray((f * NB + b) * 4, (f * NB + b) * 4 + 4)];
  const L = at(B.first + 3, i('lhumerus')), Rr = at(A.first + 3, i('rhumerus'));
  assert.deepEqual(Rr, [L[0], L[1], -L[2], -L[3]]);
  assert.deepEqual(at(A.first + 3, i('lhumerus')), L, 'the left arm is untouched');
  assert.deepEqual(at(A.first + 3, i('thoracic')), at(B.first + 3, i('thoracic')), 'and so is the body');
});

test('two pushes meeting are a Force clash: whoever clicks more in 3 s wins and blasts the other away', () => {
  const { g, P, F, foe } = clashScene();
  assert.ok(F.activate('push', 'key')); run(g, 1);
  assert.ok(g.clash, 'a clash'); assert.equal(P.status, 'clash'); assert.equal(foe.status, 'clash');
  const hp = foe.hp; clickFor(g, CLASH_S + 0.2, 12); // the player mashes 12 clicks a second; the foe clicks about 6
  assert.equal(g.clash, null, 'over after 3 s');
  assert.equal(foe.status, 'flung', 'the loser is blasted away'); assert.ok(foe.hp < hp); assert.equal(P.status, 'normal');
  const s2 = clashScene(); assert.ok(s2.F.activate('push', 'key')); run(s2.g, 1); assert.ok(s2.g.clash);
  clickFor(s2.g, CLASH_S + 0.2, 0); assert.equal(s2.P.status, 'flung', 'no clicks: the player loses'); assert.equal(s2.foe.status, 'normal');
});

test('two lightning streams meeting are a lightning clash; the loser is electrocuted and thrown down', () => {
  const { g, P, F, foe } = clashScene(); foe.force.lastPush = null;
  foe.force.want = { lightning: true }; assert.ok(foe.force.cast('lightning'), 'the foe pours lightning at the player');
  assert.ok(F.activate('lightning', 'Digit4')); for (let i = 0; i < 20 && !g.clash; i++) run(g, 1, () => ({ held: new Set(['Digit4']) }));
  assert.ok(g.clash && g.clash.kind === 'lightning', 'a lightning clash');
  clickFor(g, CLASH_S + 0.2, 12);
  assert.ok(foe.hp < 300 - 25, 'electrocuted'); assert.ok(['flung', 'down', 'getup', 'dead'].includes(foe.status), 'and thrown down (' + foe.status + ')');
});

test('a push from anyone else breaks a clash', () => {
  const { g, F, foe } = clashScene(); assert.ok(F.activate('push', 'key')); run(g, 1); assert.ok(g.clash);
  foe.push([1, 0, 0], 6, 3); run(g, 2);
  assert.equal(g.clash, null); assert.equal(g.player.status, 'normal', 'the other side is free again');
});
