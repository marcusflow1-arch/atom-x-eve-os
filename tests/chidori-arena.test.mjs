import assert from 'node:assert/strict';
import test from 'node:test';
import { HumanoidRig } from '../src/components/battle/ultimate/thunderRush/humanoidRig.js';
import { ARENA_CHIDORI, ARENA_CHIDORI_END, ArenaChidori, attackerOpacity, attackerPush, victimKnock } from '../src/components/battle/ultimate/thunderRush/arenaChidori.js';
import { m4, q, rng, v3 } from '../src/components/battle/ultimate/thunderRush/math.js';

// One humanoid built two ways: UE-style names with identity bone frames (the
// male body) and Mixamo names with arbitrary bone frames under a centimetre
// armature (like many female rigs). Posing must not depend on either.
const SKELETON = [
  ['hips', -1, [0, 0.93, 0]], ['spine', 0, [0, 1.08, 0]], ['chest', 1, [0, 1.25, 0]], ['neck', 2, [0, 1.46, -0.02]], ['head', 3, [0, 1.58, 0]],
  ['clavL', 2, [0.04, 1.43, -0.02]], ['upperL', 5, [0.18, 1.42, -0.04]], ['foreL', 6, [0.27, 1.16, -0.07]], ['handL', 7, [0.3, 0.96, 0.01]], ['fingerL', 8, [0.3, 0.87, 0.03]],
  ['clavR', 2, [-0.04, 1.43, -0.02]], ['upperR', 10, [-0.18, 1.42, -0.04]], ['foreR', 11, [-0.27, 1.16, -0.07]], ['handR', 12, [-0.3, 0.96, 0.01]], ['fingerR', 13, [-0.3, 0.87, 0.03]],
  ['thighL', 0, [0.1, 0.92, 0]], ['shinL', 15, [0.15, 0.52, 0.01]], ['footL', 16, [0.18, 0.1, -0.04]], ['toeL', 17, [0.19, 0.03, 0.08]],
  ['thighR', 0, [-0.1, 0.92, 0]], ['shinR', 19, [-0.15, 0.52, 0.01]], ['footR', 20, [-0.18, 0.1, -0.04]], ['toeR', 21, [-0.19, 0.03, 0.08]],
];
const UE = { hips: 'pelvis', spine: 'spine_01', chest: 'spine_02', neck: 'neck_01', head: 'head', clavL: 'clavicle_l', upperL: 'upperarm_l', foreL: 'lowerarm_l', handL: 'hand_l', fingerL: 'fingers_l', clavR: 'clavicle_r', upperR: 'upperarm_r', foreR: 'lowerarm_r', handR: 'hand_r', fingerR: 'fingers_r', thighL: 'thigh_l', shinL: 'calf_l', footL: 'foot_l', toeL: 'ball_l', thighR: 'thigh_r', shinR: 'calf_r', footR: 'foot_r', toeR: 'ball_r' };
const MIXAMO = { hips: 'Hips', spine: 'Spine', chest: 'Spine1', neck: 'Neck', head: 'Head', clavL: 'LeftShoulder', upperL: 'LeftArm', foreL: 'LeftForeArm', handL: 'LeftHand', fingerL: 'LeftHandIndex1', clavR: 'RightShoulder', upperR: 'RightArm', foreR: 'RightForeArm', handR: 'RightHand', fingerR: 'RightHandIndex1', thighL: 'LeftUpLeg', shinL: 'LeftLeg', footL: 'LeftFoot', toeL: 'LeftToeBase', thighR: 'RightUpLeg', shinR: 'RightLeg', footR: 'RightFoot', toeR: 'RightToeBase' };

function build(names, { randomFrames = false, armatureScale = 1, prefix = '' } = {}) {
  const rand = rng(99);
  const frames = SKELETON.map(() => (randomFrames ? q.norm([rand() - 0.5, rand() - 0.5, rand() - 0.5, rand() - 0.5]) : [0, 0, 0, 1]));
  const armature = m4.compose([0, 0, 0], [0, 0, 0, 1], 1 / armatureScale);
  const joints = SKELETON.map(([key, parent, world], i) => {
    const parentFrame = parent >= 0 ? frames[parent] : [0, 0, 0, 1];
    const parentPos = parent >= 0 ? v3.scale(SKELETON[parent][2], armatureScale) : [0, 0, 0];
    return {
      name: prefix + names[key], parent,
      position: q.rotate(q.conj(parentFrame), v3.sub(v3.scale(world, armatureScale), parentPos)),
      quaternion: q.norm(q.mul(q.conj(parentFrame), frames[i])), scale: 1,
    };
  });
  return new HumanoidRig(joints, new Map([[0, armature]]));
}
const male = () => build(UE);
const female = () => build(MIXAMO, { randomFrames: true, armatureScale: 100, prefix: 'mixamorig:' });

const toWorld = (place, p) => {
  const c = Math.cos(place.yaw), s = Math.sin(place.yaw);
  return [place.x + p[0] * c + p[2] * s, p[1], place.z - p[0] * s + p[2] * c];
};

// Plays the whole move the way the arena does: host at z = 5, guest at z = -5.
function play(attacker, victim) {
  const presenter = new ArenaChidori({ attacker, victim });
  const home = { a: [0, 5], v: [0, -5] };
  const gap = 10;
  const samples = [];
  for (let f = 0; f <= Math.round(ARENA_CHIDORI_END * 30) + 3; f += 1) {
    const ta = f / 30;
    const tv = ta - ARENA_CHIDORI.impact;
    if (ta >= ARENA_CHIDORI.impact) presenter.setStruck(true);
    const push = attackerPush(ta, gap);
    const knock = tv >= 0 ? victimKnock(tv) : 0;
    const attackerPlace = { x: 0, z: home.a[1] - push, yaw: Math.PI };
    const victimPlace = { x: 0, z: home.v[1] - knock, yaw: 0 };
    const state = presenter.update(ta, { camera: { position: [2, 2.4, 11], target: [0, 1, 0], fov: 50 }, attackerPlace, victimPlace, victimTorso: [0, 1.25, victimPlace.z] });
    samples.push({
      ta, tv, state, attackerPlace, victimPlace,
      // The effect buffers are reused every frame; keep this frame's size.
      fxCount: state.fx.additive.count,
      palm: toWorld(attackerPlace, attacker.point('handR')),
      victimHips: state.victim.weight > 0 ? toWorld(victimPlace, victim.point('hips')) : null,
      joints: ['head', 'handL', 'handR', 'footL', 'footR', 'hips'].map((key) => toWorld(attackerPlace, attacker.point(key))),
    });
  }
  return samples;
}
const at = (samples, ta) => samples.reduce((best, s) => (Math.abs(s.ta - ta) < Math.abs(best.ta - ta) ? s : best));

test('the attacker crosses the net, strikes the torso, then flash-steps home', () => {
  const samples = play(male(), female());
  // Charging on their own side.
  assert.equal(at(samples, 1.0).attackerPlace.z, 5);
  // Across the net (z = 0) during the dash.
  assert.ok(at(samples, 1.8).attackerPlace.z < 0, 'crosses the centre line');
  // The palm lands on the target's torso at impact.
  const impact = at(samples, ARENA_CHIDORI.impact);
  assert.ok(v3.dist(impact.palm, [0, 1.25, -5]) < 0.35, `palm ${impact.palm} reaches the torso`);
  // Fades out at the strike, is invisible while moving home, fades in at home.
  assert.equal(attackerOpacity(2.3), 1);
  assert.equal(attackerOpacity(2.7), 0);
  assert.equal(attackerOpacity(3.1), 1);
  assert.equal(at(samples, 3.0).attackerPlace.z, 5, 'back on their own side');
  // The arena's own idle takes over at the end.
  assert.equal(samples.at(-1).state.attacker.weight, 0);
  assert.equal(samples.at(-1).state.done, true);
});

test('the struck target falls, lies stunned for the stun window, then gets up', () => {
  const samples = play(male(), female());
  const stand = at(samples, ARENA_CHIDORI.impact + 0.05).victimHips[1];
  const down = at(samples, ARENA_CHIDORI.impact + 2.0).victimHips[1];
  const up = at(samples, ARENA_CHIDORI.impact + ARENA_CHIDORI.victimEnd - 0.15).victimHips[1];
  assert.ok(stand > 0.7, `standing when hit (${stand})`);
  assert.ok(down < 0.35, `lying down during the stun (${down})`);
  assert.ok(up > 0.75, `back on their feet (${up})`);
  assert.ok(victimKnock(0.9) > 0.5, 'thrown back');
  assert.equal(victimKnock(ARENA_CHIDORI.victimEnd), 0, 'back on their spot');
  // Lightning keeps running through the body while down.
  const lying = at(samples, ARENA_CHIDORI.impact + 1.9);
  assert.ok(lying.fxCount > 600, `lightning on the body (${lying.fxCount} vertices)`);
});

test('male and female skeletons perform the move identically', () => {
  const a = play(male(), female());
  const b = play(female(), male());
  for (const ta of [0.3, 0.48, 1.0, 1.7, 2.0, 2.3, 3.2, 3.7]) {
    const sa = at(a, ta), sb = at(b, ta);
    sa.joints.forEach((p, i) => assert.ok(v3.dist(p, sb.joints[i]) < 1e-4, `t=${ta} joint ${i}`));
  }
});

test('a dodged Chidori leaves the target alone', () => {
  const presenter = new ArenaChidori({ attacker: male(), victim: female() });
  presenter.setStruck(false);
  for (let f = 0; f <= 150; f += 1) {
    const ta = f / 30;
    const state = presenter.update(ta, { camera: { position: [2, 2.4, 11], target: [0, 1, 0], fov: 50 }, attackerPlace: { x: 0, z: 5 - attackerPush(ta, 10), yaw: Math.PI }, victimPlace: { x: 0, z: -5, yaw: 0 } });
    assert.equal(state.victim.weight, 0);
    assert.equal(state.hints.invert, 0);
  }
});
