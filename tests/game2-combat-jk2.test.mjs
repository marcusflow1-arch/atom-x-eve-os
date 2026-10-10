import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { Skeleton, Actor } from '../src/components/game2/engine/actor.js';
import { Combat } from '../src/components/game2/engine/combat.js';
import { Fighter } from '../src/components/game2/engine/fighter.js';
import { Game } from '../src/components/game2/engine/game.js';
import { SaberLogic } from '../src/components/game2/engine/saber.js';

// Behaviour checked against the original Jedi Outcast source (Raven, GPL): w_saber.c CheckSaberDamage,
// cg_players.c CG_G2PlayerAngles / CG_SwingAngles, bg_pmove.c PM_Footsteps, bg_weapons.c / g_weapon.c (Bryar).
const DEG = Math.PI / 180;
const root = new URL('../', import.meta.url);
const read = p => readFileSync(new URL(p, root));
function realSkeleton() {
  const rig = JSON.parse(read('public/game2/rig.json'));
  const gz = Buffer.concat([0, 1, 2, 3, 4].map(i => read(`public/game2/parts/bank_q.bin.gz.00${i}`)));
  const q = new Int16Array(new Uint8Array(gunzipSync(gz)).buffer), pel = new Float32Array(new Uint8Array(read('public/game2/bank_pel.bin')).buffer);
  return new Skeleton(rig, q, pel, null);
}

test('torso aim: the view turns and pitches the saber arm while the legs stay planted (cg_players.c)', () => {
  const skel = realSkeleton(), atk = skel.anims['BOTH_A2_T__B_'], mid = 0.5 * atk.n / Math.abs(atk.fps);
  const pose = (yaw, pitch) => { // fresh actor, mid-way through an overhead medium swing
    const a = new Actor(skel); a.now = 0; a.setBoth('BOTH_A2_T__B_', { blend: 0, restart: true, loop: false }); a.spineYaw = yaw; a.spinePitch = pitch; a.update(mid);
    return { hand: a.bonePos('rhand'), foot: a.bonePos('rtalus'), chest: a.bonePos('thoracic'), head: a.bonePos('cranium') };
  };
  const base = pose(0, 0), down = pose(0, 0.6), left = pose(0.8, 0);
  assert.ok(down.hand[1] < base.hand[1] - 0.12, `looking down drives the swing lower (${base.hand[1].toFixed(2)} -> ${down.hand[1].toFixed(2)})`);
  assert.ok(down.head[1] < base.head[1] && down.head[2] > base.head[2], 'the torso bends forward, not back');
  const ang = p => Math.atan2(p.hand[0] - p.chest[0], p.hand[2] - p.chest[2]);
  assert.ok(Math.abs(ang(left) - ang(base) - 0.8) < 0.25, 'turning the view swings the arm by the same yaw');
  for (const p of [down, left]) assert.ok(Math.hypot(p.foot[0] - base.foot[0], p.foot[1] - base.foot[1], p.foot[2] - base.foot[2]) < 1e-6, 'feet do not move');
  assert.deepEqual([...skel.spineW].filter(Boolean).map(w => +w.toFixed(2)), [0.3, 0.3, 0.4], 'lower_lumbar 30%, upper_lumbar 30%, thoracic 40%');
});

function fighterStub(o = {}) {
  const f = Object.create(Fighter.prototype);
  Object.assign(f, { yaw: 0, vel: [0, 0, 0], onGround: true, forceUntil: 0, g: { t: 0 }, legsYaw: 0, legsSwinging: false,
    saber: { holstered: false, move: 1, weaponTime: 0, I: { LS_READY: 1 } } }, o);
  return f;
}
const settle = (f, moving, an, secs = 1) => { for (let i = 0; i < secs * 60; i++) f.swingLegs(1 / 60, moving, an); return f.legsYaw / DEG; };

test('walking sideways turns the legs toward travel by at most 60 degrees; backpedalling faces away from it', () => {
  assert.ok(Math.abs(settle(fighterStub({ vel: [5.6, 0, 0] }), true, 'BOTH_RUN2') - 60) < 1, 'strafe left (+X) -> legs 60 deg left');
  assert.ok(Math.abs(settle(fighterStub({ vel: [-5.6, 0, 0] }), true, 'BOTH_RUN2') + 60) < 1, 'strafe right -> legs 60 deg right');
  assert.ok(Math.abs(settle(fighterStub({ vel: [4, 0, 4] }), true, 'BOTH_RUN2') - 45) < 1, 'forward-left diagonal -> 45 deg');
  assert.ok(Math.abs(settle(fighterStub({ vel: [3, 0, -3] }), true, 'BOTH_RUNBACK1') + 45) < 1, 'back-left diagonal -> legs face front-right');
  assert.ok(Math.abs(settle(fighterStub({ vel: [0, 0, -4] }), true, 'BOTH_RUNBACK1')) < 1, 'straight back -> legs with the view');
  const src = readFileSync(new URL('src/components/game2/engine/fighter.js', root), 'utf8');
  assert.doesNotMatch(src, /RUNSTRAFE/, 'no strafe cycles (bg_pmove.c PM_Footsteps uses run / walk / back only)');
});

test('turning in place: legs hold until the view is 40 degrees away, then catch up, never trailing over 90', () => {
  const f = fighterStub({ yaw: 30 * DEG });
  assert.equal(Math.round(settle(f, false, 'BOTH_STAND2', 0.5)), 0, '30 deg: legs stay planted');
  f.yaw = 50 * DEG; assert.ok(Math.abs(settle(f, false, 'BOTH_STAND2', 1) - 50) < 0.5, '50 deg: legs swing round');
  const g = fighterStub({ yaw: 170 * DEG }); g.swingLegs(1 / 60, false, 'BOTH_STAND2');
  assert.ok(Math.abs(((170 * DEG - g.legsYaw) / DEG)) <= 89.5, 'a fast 360 never leaves the legs more than 90 deg behind');
});

// ---------- saber damage: CheckSaberDamage
const cap = x => ({ a: [x, 0.15, 0], b: [x, 1.75, 0], r: 0.4 });
function duel(attacking, level = 2) {
  const hits = [];
  const target = { name: 'enemy', team: 'enemy', status: 'normal', pos: [0.3, 0, 0], ducked: false, hasSaber: false, isPlayer: false,
    bladeSeg: () => null, swingActive: () => false, _prevCap: cap(0.3), yaw: 0, saber: { holstered: true }, blade: { len: 0 },
    hurt(d) { hits.push(d); return false; }, push() {} };
  const player = { name: 'player', team: 'player', status: 'normal', pos: [0, 0, 0], ducked: false, isPlayer: true, damageMul: 1, hasSaber: true,
    _prev: [[0.3, 0.6, -0.5], [0.3, 0.6, 0.6]], hitSet: new Set(), hitMove: 0, saber: { moveStart: 0, level, move: 0, I: {}, inSpecial: () => false },
    bladeSeg: () => [[0.3, 0.6, -0.5], [0.3, 0.6, 0.6]], swingActive: () => attacking, attacking: () => attacking };
  const g = { t: 0, player, npcs: [target], fx: { sparks() {} }, sfxAt() {}, hud: { hit() {}, msg() {} }, shake() {}, force: { active: {} } };
  const c = Object.create(Combat.prototype); Object.assign(c, { g, pair: new Map(), remote: null, kills: 0, props() {}, updateBolts() {}, updateRemote() {} });
  const run = secs => { for (let i = 0; i < Math.round(secs * 60); i++) { g.t += 1 / 60; c.step(1 / 60); } };
  return { hits, run };
}

test('the lit blade always cuts: resting contact outside an attack deals touch damage every 200 ms', () => {
  const { hits, run } = duel(false);
  run(1.0);
  assert.ok(hits.length >= 4 && hits.length <= 6, `about 5 touches in a second (got ${hits.length})`);
  assert.ok(hits.every(d => d === 3), 'medium stance touch = 3');
  const fast = duel(false, 1), strong = duel(false, 3); fast.run(0.25); strong.run(0.25);
  assert.ok(fast.hits[0] < 3 && strong.hits[0] > 3, 'stance changes the damage');
});

test('during an attack every contact deals stance damage, again after 100 ms (x1.5 against non-Jedi)', () => {
  const { hits, run } = duel(true);
  run(0.05); assert.equal(hits.length, 1, 'one hit on contact'); assert.equal(hits[0], 18 * 1.5);
  run(0.12); assert.ok(hits.length >= 2, 'blade still inside 100 ms later hits again');
  const strong = duel(true, 3); strong.run(0.02); assert.equal(strong.hits[0], 28 * 1.5);
});

// ---------- Bryar pistol
function pistolGame() {
  const shots = [], msgs = [];
  const p = Object.create(Fighter.prototype);
  Object.assign(p, { status: 'normal', thrown: null, gun: true, weaponPose: 'TORSO_WEAPONREADY2', hasSaber: true, yaw: 0, targetYaw: 0,
    saber: { holstered: true }, timers: [], g: { t: 0 }, playForce() {}, toggleSaber() { this.saber.holstered = !this.saber.holstered; } });
  const g = Object.create(Game.prototype);
  Object.assign(g, { player: p, playerWeapon: 'bryar', pistol: { cool: 0, charge: 0 }, hud: { help: false, msg: m => msgs.push(m) },
    input: { btn: [false, false, false] }, cam: { yaw: 0, pitch: 0, eye: [0, 1.6, -3] }, world: {}, combat: { shoot: (f, at, o) => shots.push(o.dmg) } });
  return { g, p, shots, msgs };
}

test('story mode Bryar pistol: 10 damage per shot, one shot per 400 ms, charged alt-fire up to 85', () => {
  const { g, shots } = pistolGame();
  g.input.btn[0] = true; for (let i = 0; i < 60; i++) g.updatePistol(1 / 60); g.input.btn[0] = false;
  assert.equal(shots.length, 3, 'held trigger for 1 s fires at 0, 0.4, 0.8 s'); assert.ok(shots.every(d => d === 10));
  g.input.btn[2] = true; for (let i = 0; i < 90; i++) g.updatePistol(1 / 60); g.input.btn[2] = false; g.updatePistol(1 / 60);
  assert.equal(shots.at(-1), 85, 'full charge = 10 x 5 x 1.7');
});

test('Q swaps pistol and lightsaber; R lights the saber straight from the pistol', () => {
  const { g, p, msgs } = pistolGame();
  g.switchWeapon(); assert.equal(g.playerWeapon, 'saber'); assert.equal(p.saber.holstered, false); assert.equal(p.gun, false);
  g.switchWeapon(); assert.equal(g.playerWeapon, 'bryar'); assert.equal(p.saber.holstered, true);
  assert.deepEqual(msgs, ['Lightsaber', 'Bryar pistol']);
  const src = readFileSync(new URL('src/components/game2/engine/game.js', root), 'utf8');
  assert.match(src, /if \(i\.pressed\('KeyR'\)\) \{ if \(this\.playerWeapon === 'bryar'\) this\.switchWeapon\('saber'\)/);
  assert.match(src, /if \(this\.playerWeapon === 'bryar'\) \{ c\.attack = false; c\.alt = false; \}/, 'mouse fires the pistol instead of drawing the saber');
});

// ---------- controls, knockdown, landing, saber throw, Force timing

test('key presses are kept until a 60 Hz simulation step reads them (no dropped jumps / Force keys on fast displays)', () => {
  const seen = [];
  const g = Object.create(Game.prototype);
  Object.assign(g, { fps: 60, frameNo: 0, acc: 0, duel: false, hud: { help: false }, stepPresses: new Set(),
    input: { pressedSet: new Set(), btnPressed: [false, false, false], endFrame() { this.pressedSet.clear(); this.btnPressed.fill(false); } },
    frameInput() {}, updateCamera() {},
    step() { seen.push(this.stepPressed('Space'), this.stepPressed('Mouse0')); this.firstSub = false; this.stepPresses.clear(); } });
  g.input.pressedSet.add('Space'); g.input.btnPressed[0] = true;
  g.update(1 / 144); assert.equal(seen.length, 0, 'a 144 Hz frame may run no simulation step');
  g.update(1 / 144); g.update(1 / 144);
  assert.deepEqual(seen.slice(0, 2), [true, true], 'the press and the click reach the next step');
  g.update(1 / 60); assert.deepEqual(seen.slice(2), [false, false], 'and are consumed only once');
});

function knockStub(o = {}) {
  const played = [];
  const f = Object.create(Fighter.prototype);
  Object.assign(f, { isPlayer: true, cmd: { jump: false }, jumpLevel: 3, quickerGetup: false, g: { t: 5, sfxAt() {} }, playWhole: a => { played.push(a); return 1.5; } }, o);
  f.startGetup(); return { anim: played[0], len: f.getupLen, status: f.status };
}

test('knockdown get-up follows w_force.c: jump held = Force getup, pushed = quicker getup, otherwise normal', () => {
  assert.deepEqual(knockStub({ cmd: { jump: true } }), { anim: 'BOTH_FORCE_GETUP_B1', len: 0.8, status: 'getup' });
  assert.deepEqual(knockStub({ quickerGetup: true }), { anim: 'BOTH_FORCE_GETUP_B3', len: 0.6, status: 'getup' });
  assert.deepEqual(knockStub({}), { anim: 'BOTH_GETUP1', len: 1.0, status: 'getup' });
  assert.equal(knockStub({ cmd: { jump: true }, jumpLevel: 1 }).anim, 'BOTH_GETUP1', 'needs Force Jump above level 1');
  const src = readFileSync(new URL('src/components/game2/engine/fighter.js', root), 'utf8');
  assert.match(src, /this\.downTime = Math\.max\(0\.3, 1\.1 - \(this\.now - \(this\.knockAt \?\? this\.now\)\)\)/, 'down for 1.1 s from the knockdown; jump does not skip it');
});

test('landing plays a short LAND1 (TIMER_LAND 130 ms) with no camera shake, also after a Force Jump', () => {
  const legs = [];
  const f = Object.create(Fighter.prototype);
  Object.assign(f, { g: { t: 2, onLand() {} }, airAnim: 'BOTH_FORCEINAIR1', fjUsed: true, actor: { setLegs: a => legs.push(a) } });
  f.land(20); assert.deepEqual(legs, ['BOTH_LAND1']); assert.ok(Math.abs(f.landUntil - 2.13) < 1e-9);
  f.airAnim = 'BOTH_FORCEJUMPBACK1'; f.land(20); assert.equal(legs[1], 'BOTH_LANDBACK1');
  const game = readFileSync(new URL('src/components/game2/engine/game.js', root), 'utf8');
  assert.doesNotMatch(game.match(/onLand\(f, impact\) \{[^\n]*/)[0], /this\.shake\(/);
});

test('saber throw: the throw animation plays once and holds with the arm out (not restarted every frame)', () => {
  const calls = [];
  const s = Object.create(SaberLogic.prototype);
  Object.assign(s, { holstered: false, inFlight: true, moveAnim: null, I: {}, host: { playTorso: (a, o) => calls.push([a, o.speed]) } });
  for (let i = 0; i < 30; i++) s.update(16, { busy: false }, i * 0.016);
  assert.deepEqual(calls, [['BOTH_SABERTHROW1START', 3]]);
});

test('Force Push / Pull land on the cast frame and Heal can be used on the move', () => {
  const src = readFileSync(new URL('src/components/game2/engine/force.js', root), 'utf8');
  for (const pw of ['push', 'pull', 'mind']) {
    const body = src.slice(src.indexOf(`do_${pw}() {`)), delay = /this\.later\(([\d.]+),/.exec(body)[1];
    assert.equal(Number(delay), 0, `${pw} takes effect immediately`);
  }
  assert.doesNotMatch(src.match(/do_heal\(\) \{[^\n]*/)[0], /freeze|whole: true/);
});
