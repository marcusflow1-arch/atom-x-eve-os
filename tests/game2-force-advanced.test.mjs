// The charged two-handed Force Push, Force clashes, the Counter, the lightning storm, Mind Dominance and Force Dodge
// (real engine, tests/support/game2Sim.mjs).
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeGame, addFoe, run } from './support/game2Sim.mjs';
import { PUSH_CHARGE_MAX } from '../src/components/game2/engine/force.js';

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
