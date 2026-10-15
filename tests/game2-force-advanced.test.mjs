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

test('the Counter: a parry throws the attacker open; the critical vertical strike does twice the damage', () => {
  const g = makeGame(), P = g.player, foe = addFoe(g, [0, 0, 1.3], { hp: 400 }); P.igniteNow(); foe.igniteNow?.(); run(g, 40);
  g.combat.counterParry(foe, P, foe.chest());
  assert.equal(foe.status, 'open', 'parried open'); assert.ok(P.critUntil > g.t, 'a moment to strike');
  assert.equal(g.combat.canBlock(foe, P.pos), false, 'they cannot guard');
  const hp = foe.hp; assert.ok(P.startCritStrike()); assert.ok(P.critStrike);
  let n = 0; while (foe.hp === hp && n++ < 90) run(g, 1);
  assert.ok(hp - foe.hp >= 18 * 2 - 0.01, 'twice a medium hit (' + (hp - foe.hp).toFixed(1) + ')');
  run(g, 60); assert.equal(foe.status, 'normal', 'back on guard after it');
});

test('a killing critical strike splits them down the middle', () => {
  const g = makeGame(), P = g.player, foe = addFoe(g, [0, 0, 1.3], { hp: 20 }); P.igniteNow(); run(g, 40);
  g.combat.counterParry(foe, P, foe.chest()); assert.ok(P.startCritStrike());
  let n = 0; while (foe.status !== 'dead' && n++ < 90) run(g, 1);
  assert.equal(foe.status, 'dead'); assert.ok(foe.cut && foe.cut.vertical, 'cut vertically');
});

test('Force Lightning held 1.5 s becomes a storm: the hand raised, bolts striking every foe within 45 m from the sky', async () => {
  const { STORM_CHARGE, STORM_RADIUS } = await import('../src/components/game2/engine/force.js');
  const g = makeGame({ world: { collide() {}, floorAt: () => 0 } }), P = g.player, F = g.force; run(g, 20); // an open floor: nothing pulls them back into the arena
  const near = addFoe(g, [3, 0, -6]), far = addFoe(g, [-30, 0, 25]), out = addFoe(g, [STORM_RADIUS + 5, 0, 0]); // behind and far: the storm needs no aim
  out.pos = [STORM_RADIUS + 5, 0, 0];
  const hp = [near.hp, far.hp, out.hp]; ready(F);
  assert.ok(F.activate('lightning', 'Digit4'));
  run(g, Math.round(STORM_CHARGE * 60) + 5, () => ({ held: new Set(['Digit4']) }));
  assert.ok(F.storm, 'the storm'); assert.equal(P.actor.torso.name, 'BOTH_FORCEHEAL_QUICK', 'the hand raised');
  let bolts = 0; for (let i = 0; i < 60; i++) { run(g, 1, () => ({ held: new Set(['Digit4']) })); bolts = Math.max(bolts, F.stormBolts.length); }
  assert.ok(near.hp < hp[0] && far.hp < hp[1], 'everyone in reach is struck, wherever they stand');
  assert.equal(out.hp, hp[2], 'not beyond 45 m');
  assert.ok(bolts > 0, 'bolts in the sky'); const fp = F.fp;
  run(g, 30, () => ({ held: new Set(['Digit4']) })); assert.ok(fp - F.fp > 10, 'it drains fast (' + (fp - F.fp).toFixed(1) + ' in 0.5 s)');
  assert.equal(F.holding, 'lightning'); run(g, 2); assert.equal(F.holding, null, 'released with the key'); assert.equal(F.storm, null);
});

test('Mind Dominance (V) at 55% of the meter: the foe in front turns their own lightsaber through their centre and falls', () => {
  const g = makeGame(), P = g.player, F = g.force, foe = addFoe(g, [0, 0, 6], { hp: 300 }); foe.igniteNow(); run(g, 20); ready(F);
  F.pulse = 54; run(g, 1, () => ({ pressed: ['KeyV'] })); assert.equal(foe.status, 'normal', 'not at 54%');
  F.pulse = 60; run(g, 1, () => ({ pressed: ['KeyV'] }));
  assert.equal(foe.status, 'executed', 'dominated'); assert.equal(P.status, 'executing'); assert.ok(Math.abs(F.pulse - 5) < 1e-9, 'it costs 55');
  assert.equal(foe.blade.lit, false, 'the blade goes out while they turn it around');
  let through = false;
  for (let i = 0; i < 180 && foe.status !== 'dead'; i++) {
    run(g, 1);
    if (foe.hiltPose && foe.blade.len > 0.9) { // ignited: from their hands, through the spine, out of the back
      const sp = foe.actor.bonePos('upper_lumbar'), b = foe.blade.base, d = foe.blade.dir, rel = [sp[0] - b[0], sp[1] - b[1], sp[2] - b[2]], t = rel[0] * d[0] + rel[1] * d[1] + rel[2] * d[2];
      const miss = Math.hypot(rel[0] - d[0] * t, rel[1] - d[1] * t, rel[2] - d[2] * t), fw = [Math.sin(foe.yaw), Math.cos(foe.yaw)], back = (foe.blade.tip[0] - foe.pos[0]) * fw[0] + (foe.blade.tip[2] - foe.pos[2]) * fw[1];
      if (miss < 0.06 && t > 0 && back < -0.4) through = true;
    }
  }
  assert.ok(through, 'the blade runs through their centre and out of the back');
  assert.equal(foe.status, 'dead'); assert.equal(foe.killedBy, P, 'it is the caster\'s kill');
  run(g, 60); assert.equal(P.status, 'normal', 'the caster is free'); assert.equal(foe.hiltPose, null);
});

test('Force Absorb resists Mind Dominance (nothing spent); Force Repulse needs 80% of the meter', () => {
  const g = makeGame(), F = g.force, foe = addFoe(g, [0, 0, 5]); foe.igniteNow(); run(g, 20); ready(F);
  foe.force.cast('absorb'); run(g, 2); F.pulse = 70;
  assert.equal(F.startDominance(), false); assert.equal(foe.status, 'normal'); assert.equal(F.pulse, 70, 'nothing spent');
  F.pulse = 79; assert.equal(F.startPulse(), false, 'Repulse not at 79%');
  F.pulse = 80; assert.equal(F.startPulse(), true, 'Repulse at 80%'); assert.equal(F.pulse, 0);
});

test('Force Dodge: a strike past the guard may be flash-stepped aside for 15 Force, leaving afterimages', async () => {
  const { DODGE_COST, DODGE_DIST } = await import('../src/components/game2/engine/combat.js');
  const g = makeGame(), P = g.player, F = g.force, foe = addFoe(g, [0, 0, 1.5], { hp: 300 }); foe.igniteNow(); run(g, 20); ready(F);
  g.combat.dodgeChance = () => 1; g.combat.canBlock = () => false; // every strike gets past the guard; every dodge roll succeeds
  const hp = P.hp, from = P.pos.slice();
  assert.equal(g.combat.bladeHit(foe, P, P.chest()), 'dodged'); assert.equal(P.hp, hp, 'not hurt');
  assert.equal(F.fp, 100 - DODGE_COST); assert.ok(P.dodge, 'flash stepping');
  assert.ok(['BOTH_DODGE_L', 'BOTH_DODGE_R'].includes(P.actor.legs.name), 'the sidestep (' + P.actor.legs.name + ')');
  assert.equal(g.combat.bladeHit(foe, P, P.chest()), 'dodged', 'untouchable mid-step');
  run(g, 12);
  const moved = Math.hypot(P.pos[0] - from[0], P.pos[2] - from[2]), toFoe = [foe.pos[0] - from[0], foe.pos[2] - from[2]], side = Math.abs((P.pos[0] - from[0]) * toFoe[1] - (P.pos[2] - from[2]) * toFoe[0]) / Math.hypot(...toFoe);
  assert.ok(Math.abs(moved - DODGE_DIST) < 0.15, `${DODGE_DIST} m in a flash (${moved.toFixed(2)})`); assert.ok(side > 2, 'to the side');
  assert.equal(P.dodge, null); assert.equal(P.status, 'normal'); assert.ok(P.ghosts.length >= 3, 'afterimages left behind');
  assert.equal(g.combat.bladeHit(foe, P, P.chest()), 'hit', 'then a cooldown'); assert.ok(P.hp < hp);
  P.dodgeReadyAt = 0; F.fp = DODGE_COST - 1; assert.equal(g.combat.bladeHit(foe, P, P.chest()), 'hit', 'not without the Force for it');
  P.dodgeReadyAt = 0; F.fp = 100; foe.critStrike = { until: g.t + 1 }; assert.equal(g.combat.bladeHit(foe, P, P.chest()), 'hit', 'the Counter\'s critical strike cannot be dodged');
});
