import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { Skeleton, Actor } from '../src/components/game2/engine/actor.js';
import { Fighter } from '../src/components/game2/engine/fighter.js';
import { Game } from '../src/components/game2/engine/game.js';
import { SaberLogic, GESTURE_MIN } from '../src/components/game2/engine/saber.js';

// Swing direction rules: a mouse flick re-aims the wind-up, the strike itself is locked, vertical slashes travel where
// they are aimed (standing: whole body; over running / jumping legs: the torso keeps its authored hip turn) and a slash
// from the air follows through into the ground. bg_pmove.c PM_CheckJump / PM_CrashLand for the leap slash.
const root = new URL('../', import.meta.url);
const read = p => readFileSync(new URL(p, root));
const saberData = JSON.parse(read('public/game2/sabermoves.json'));
let skelCache = null;
function realSkeleton() {
  if (skelCache) return skelCache;
  const rig = JSON.parse(read('public/game2/rig.json'));
  const gz = Buffer.concat([0, 1, 2, 3, 4].map(i => read(`public/game2/parts/bank_q.bin.gz.00${i}`)));
  const q = new Int16Array(new Uint8Array(gunzipSync(gz)).buffer), pel = new Float32Array(new Uint8Array(read('public/game2/bank_pel.bin')).buffer);
  return (skelCache = new Skeleton(rig, q, pel, null));
}
function saber(o = {}) { // SaberLogic with a recording host
  const calls = [], skel = realSkeleton();
  const host = { hasAnim: n => !!skel.anims[n], animInfo: n => skel.anims[n], torsoIdleAnim: st => st, playTorso: (a, opt) => calls.push([a, opt]), event() {}, requestDraw() {}, standingStill: () => !!o.still };
  const s = new SaberLogic(saberData, host); s.holstered = false; s.level = o.level ?? 2; return { s, calls };
}
const name = (s) => saberData.moves[s.move].ls;
const tick = (s, ms, c, now) => s.update(ms, { attack: false, alt: false, aimPitch: 0, fwd: 0, right: 0, up: 0, busy: false, ...c }, now);

test('mouse flick during the wind-up re-aims the slash; small aim corrections do not', () => {
  const { s } = saber(); const I = s.I;
  assert.equal(GESTURE_MIN, 60);
  assert.equal(s.attackForGesture({ dx: 0, dy: 90 }), I.LS_A_T2B, 'down = vertical');
  assert.equal(s.attackForGesture({ dx: 70, dy: 70 }), I.LS_A_TL2BR, 'down-right = top-left to bottom-right (going right)');
  assert.equal(s.attackForGesture({ dx: -70, dy: 70 }), I.LS_A_TR2BL, 'down-left = going left');
  assert.equal(s.attackForGesture({ dx: 100, dy: 0 }), I.LS_A_L2R);
  assert.equal(s.attackForGesture({ dx: 25, dy: 15 }), null, 'aim tracking is not a flick');
  // start a vertical: wind-up, then a flick down-right at 40% keeps the timing
  s.setMove(I.LS_S_T2B, 0); s.weaponTime = s.torsoTimer; const len = s.moveLen;
  tick(s, 0.4 * len, { gesture: { dx: 80, dy: 80 } }, 0.4 * len / 1000);
  assert.equal(name(s), 'LS_S_TL2BR');
  assert.ok(Math.abs(s.weaponTime - 0.6 * s.moveLen) < 1, 'the new wind-up continues from the same progress');
});

test('the strike is committed: no re-aim once the attack itself is playing, and the body keeps its facing', () => {
  const { s } = saber(); const I = s.I;
  s.setMove(I.LS_A_T2B, 0); s.weaponTime = s.torsoTimer;
  tick(s, 16, { gesture: { dx: 200, dy: 0 } }, 0.016); assert.equal(name(s), 'LS_A_T2B');
  const f = Object.create(Fighter.prototype); f.saber = s; assert.equal(f.swingLocked(), true);
  const g = Object.create(Game.prototype); const i = { held: () => false, btn: [false, false, false] };
  Object.assign(g, { input: i, hud: { help: false }, cam: { yaw: 1.2, pitch: 0.2 }, player: Object.assign(f, { cmd: {}, status: 'normal', targetYaw: 0 }), firstSub: true, stepPresses: new Set() });
  g.buildPlayerCmd(); assert.equal(f.targetYaw, 0, 'a turned camera does not turn a committed strike');
  s.move = I.LS_READY; s.weaponTime = 0; g.buildPlayerCmd(); assert.equal(f.targetYaw, 1.2, 'after the strike the body follows the view again');
});

test('standing still a swing plays on the whole body; moving it stays on the torso', () => {
  const still = saber({ still: true }); still.s.setMove(still.s.I.LS_S_T2B, 0); assert.equal(still.calls.at(-1)[1].parts, 'whole');
  still.s.setMove(still.s.I.LS_A_T2B, 0); assert.equal(still.calls.at(-1)[1].parts, 'whole');
  const moving = saber({ still: false }); moving.s.setMove(moving.s.I.LS_A_T2B, 0); assert.equal(moving.calls.at(-1)[1].parts, 'torso');
  still.s.setMove(still.s.I.LS_PARRY_UP, 0); assert.equal(still.calls.at(-1)[1].parts, 'torso', 'parries stay torso reactions');
});

test('over other legs the swing keeps its authored hip turn, so a vertical chop ends in front, not off to the side', () => {
  const skel = realSkeleton(), A2 = skel.anims['BOTH_A2_T__B_'], end = A2.n / Math.abs(A2.fps) - 0.01;
  const bladeEnd = (match) => {
    const a = new Actor(skel); a.now = 0; a.setLegs('BOTH_STAND2', { blend: 0, loop: true }); a.setTorso('BOTH_A2_T__B_', { blend: 0, restart: true, loop: false });
    a.matchPelvis = match; a.update(end); const i = skel.idx.rhand, R = a.Rw.slice(i * 9, i * 9 + 9); return [R[2], R[5], R[8]]; // hilt axis = rhand +Z (glTF X left, Y up, Z front)
  };
  const off = bladeEnd(false), on = bladeEnd(true);
  assert.ok(Math.abs(off[0]) > 0.6, 'plain torso layering throws the chop sideways (' + off.map(v => v.toFixed(2)) + ')');
  assert.ok(on[2] > 0.85 && Math.abs(on[0]) < 0.35, 'with the hip turn kept the blade ends pointing forward (' + on.map(v => v.toFixed(2)) + ')');
});

test('a slash begun in the air holds its strike until 100 ms after landing, then returns', () => {
  const { s } = saber(); const I = s.I;
  tick(s, 16, { airborne: true }, 0); s.setMove(I.LS_A_T2B, 0); s.weaponTime = s.torsoTimer; s.state = 'firing'; assert.equal(s.airStrike, true); // as when chosen by update()
  let t = 0; for (let k = 0; k < 40; k++) { t += 0.016; tick(s, 16, { airborne: true }, t); }
  assert.equal(name(s), 'LS_A_T2B', 'still striking while falling'); assert.equal(s.airHold, true);
  t += 0.016; tick(s, 16, { airborne: false }, t); assert.equal(name(s), 'LS_A_T2B', 'lands into the ground');
  for (let k = 0; k < 8; k++) { t += 0.016; tick(s, 16, { airborne: false }, t); }
  assert.equal(name(s), 'LS_R_T2B', 'then the return');
  const ground = saber().s; tick(ground, 16, { airborne: false }, 0); ground.setMove(I.LS_A_T2B, 0); assert.equal(ground.airStrike, false);
});

test('leap slash (bg_pmove.c): jump held in the first 500 ms of a strong attack with feet within 0.8 m; no land anim, no air control, no steering', () => {
  const { s } = saber({ level: 3 }); const I = s.I; s.setMove(I.LS_A_T2B, 0); s.weaponTime = s.torsoTimer;
  const f = Object.create(Fighter.prototype);
  Object.assign(f, { saber: s, cmd: { jump: true, fwd: 1, attack: true }, status: 'normal', onGround: true, pos: [0, 0, 0], g: { t: 0.2, world: { floorAt: () => 0 } } });
  f.ctxInfo = () => ({ front: false, behind: false });
  assert.equal(f.trySpecialJumpAttack(), true); assert.equal(name(s), 'LS_A_JUMP_T__B_');
  assert.equal(f.specialLocked(), true); assert.equal(f.swingLocked(), true);
  const legs = []; Object.assign(f, { legsLockUntil: 0, airAnim: 'BOTH_JUMP1', actor: { setLegs: a => legs.push(a) } }); f.g.onLand = () => {};
  f.land(10); assert.deepEqual(legs, [], 'PM_CrashLand plays no landing anim during a special saber move');
  const late = saber({ level: 3 }).s; late.setMove(late.I.LS_A_T2B, 0); late.weaponTime = late.torsoTimer; f.saber = late; f.g.t = 0.6;
  assert.equal(f.trySpecialJumpAttack(), false, 'too late into the attack');
  f.g.t = 0.2; f.onGround = false; f.pos = [0, 1.2, 0]; assert.equal(f.trySpecialJumpAttack(), false, 'too high off the floor');
});

test('a push knockdown on the player applies its damage (regression: code hidden behind a comment)', () => {
  const g = Object.create(Game.prototype); let hurt = 0, pushed = null;
  const victim = { isPlayer: true, team: 'player', status: 'normal', hp: 100, pos: [0, 0, 1], yaw: Math.PI, cmd: {}, saber: { weaponTime: 0 }, onGround: true, forceUntil: 0, counterUntil: 0, reaction: 0, chest: () => [0, 1, 1], push: (...a) => { pushed = a; }, hurt: (d) => { hurt += d; } };
  const att = { isPlayer: false, team: 'enemy', pos: [0, 0, 0] };
  Object.assign(g, { t: 5, force: { lv: { push: 0, pull: 0, absorb: 0 }, fp: 0, active: {}, interrupt() {} }, sfxAt() {}, fx: { sparks() {}, ring() {} }, banner() {}, shake() {}, hud: { hit() {} } });
  g.forceOf = f => f.isPlayer ? g.force : null;
  const res = g.applyThrow({ p: att, lv: { push: 3 }, dmgScale: 1 }, victim, false, { dir: [0, 0, 1], dist: 1 });
  assert.equal(res.outcome, 'knockdown'); assert.ok(pushed && pushed[3].quicker, 'pushed down with the quicker getup'); assert.equal(hurt, 6);
});
