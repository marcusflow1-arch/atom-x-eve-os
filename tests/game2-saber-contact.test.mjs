import test from 'node:test';
import assert from 'node:assert/strict';
import { sweptBladeContact, Combat } from '../src/components/game2/engine/combat.js';
import { Fighter } from '../src/components/game2/engine/fighter.js';
import { Blade } from '../src/components/game2/engine/fx.js';
import { SaberLogic } from '../src/components/game2/engine/saber.js';

const cap = (x, y = 0) => ({ a: [x, y + 0.15, 0], b: [x, y + 1.75, 0], r: 0.36 });
const blade = (x, y = 0.7) => [[x, y, 0], [x, y + 1.1, 0]];

test('a complete sideways saber sweep connects between animation frames', () => {
  const hit = sweptBladeContact(blade(-1), blade(1), cap(0), cap(0));
  assert.ok(hit, 'a blade should not tunnel through the target');
  const miss = sweptBladeContact(blade(-1), blade(1), cap(5), cap(5));
  assert.equal(miss, null, 'do not award hits to distant enemies');
});

test('moving and sidestepping targets are checked at interpolated past/current body positions', () => {
  const hit = sweptBladeContact(blade(0), blade(0), cap(-1.5), cap(1.5));
  assert.ok(hit);
});

test('sweeps hit low grounded targets only when blade is directed downward', () => {
  const grounded = { a: [0, 0.35, 0], b: [0, 0.35, 0], r: 0.65 };
  assert.equal(sweptBladeContact(blade(-1, 2.1), blade(1, 2.1), grounded, grounded), null);
  assert.ok(sweptBladeContact(blade(-1, 0.05), blade(1, 0.05), grounded, grounded));
});

test('sweeps follow jumping targets at their actual elevation', () => {
  assert.ok(sweptBladeContact(blade(-1, 3.3), blade(1, 3.3), cap(0, 3), cap(0, 3)));
  assert.equal(sweptBladeContact(blade(-1), blade(1), cap(0, 3), cap(0, 3)), null);
});

test('collision integrates swept swords against an opponent moving during a frame', () => {
  let hits = 0;
  const target = {
    name: 'enemy', team: 'enemy', status: 'normal', pos: [1.2, 0, 0], ducked: false,
    bladeSeg: () => null, swingActive: () => false, _prevCap: cap(-1.2),
  };
  const player = {
    name: 'player', team: 'player', status: 'normal', pos: [0, 0, 0], ducked: false,
    _prev: blade(0), hitSet: new Set(), hitMove: 0, saber: { moveStart: 0 },
    bladeSeg: () => blade(0), swingActive: () => true,
  };
  const engine = {
    g: { t: 4, player, npcs: [target] }, pair: new Map(), remote: null,
    capsule: Combat.prototype.capsule,
    bladeHit() { hits++; }, props() {}, updateBolts() {}, updateRemote() {},
  };
  Combat.prototype.step.call(engine, 1 / 60);
  assert.equal(hits, 1);
  assert.ok(target._prevCap);
  Combat.prototype.step.call(engine, 1 / 60);
  assert.equal(hits, 1, 'do not hit the same enemy multiple times during one swing');
});

test('held saber throw stays deployed in midair, tracks aim and recalls on release', () => {
  const world = { t: 0, look: [0, 0, 1], aimDir() { return this.look; },
    sfxAt() {}, sfx: { loop: () => null } };
  const fighter = {
    g: world, isPlayer: true, status: 'normal', hasSaber: true,
    onGround: false, pos: [0, 4, 0], thrown: null, hilt: 'hand',
    cmd: { alt: true }, actor: { bonePos: () => [0, 5, 0] },
    saber: { holstered: false, inFlight: false, I: { LS_READY: 1 }, setMove() {}, weaponTime: 0 },
    updateThrown: Fighter.prototype.updateThrown, catchSaber: Fighter.prototype.catchSaber,
    get now() { return this.g.t; },
  };
  assert.equal(Fighter.prototype.throwSaber.call(fighter, [0, 0, 1]), true);
  for (let n = 0; n < 180; n++) { world.t += 1 / 60; fighter.updateThrown(1 / 60); }
  assert.ok(fighter.thrown, 'holding right mouse must not initiate a return');
  assert.equal(fighter.thrown.phase, 'hover');
  assert.ok(fighter.thrown.pos[2] > 7);
  world.look = [1, 0, 0];
  for (let n = 0; n < 60; n++) { world.t += 1 / 60; fighter.updateThrown(1 / 60); }
  assert.ok(fighter.thrown.pos[0] > 5, 'the held throw should steer with the camera');
  fighter.cmd.alt = false;
  for (let n = 0; n < 90 && fighter.thrown; n++) { world.t += 1 / 60; fighter.updateThrown(1 / 60); }
  assert.equal(fighter.thrown, null, 'releasing returns the saber');
  assert.equal(fighter.saber.inFlight, false);
});

test('saber attack direction follows positive/negative camera pitch', () => {
  const moves = { LS_A_T2B: 8, LS_A_BL2TR: 12 };
  const s = { I: moves };
  assert.equal(SaberLogic.prototype.attackForMovement.call(s, 0, { aimPitch: 0.9, right: 1, fwd: 0 }), 8);
  assert.equal(SaberLogic.prototype.attackForMovement.call(s, 0, { aimPitch: -0.5, right: -1, fwd: 0 }), 12);
});

test('visual blade uses the current hand emitter when camera aim overrides direction', () => {
  const weapon = new Blade([0.2, 0.5, 1]);
  weapon.set(true);
  const hilt = Float32Array.from([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 3, 4, 5, 1]);
  weapon.update(1 / 30, hilt, 0.4, 1, 2, [0, -1, 0]);
  assert.deepEqual(weapon.base, [3, 3.8, 5]);
  assert.ok(weapon.tip[1] < 3.8);
});

test('running enemies have a reduced chance to parry, and side hits cannot be parried', () => {
  const defender = { pos: [0,0,0], yaw: 0, status: 'normal', hasSaber: true, thrown: null, blade: { len: 1 },
    saber: { holstered: false, level: 2, isActiveSwing: () => false, inParry: () => false, inReflect: () => false },
    isPlayer: false, blockSkill: 0.7, vel: [0,0,0] };
  const g = { blockProb: Combat.prototype.blockProb };
  const stopped = Combat.prototype.blockProb.call(g, defender);
  defender.vel = [3,0,0];
  const sprinting = Combat.prototype.blockProb.call(g, defender);
  assert.ok(sprinting < stopped);
  assert.equal(Combat.prototype.canBlock.call(g, defender, [2,0,0]), false);
  assert.equal(Combat.prototype.canBlock.call(g, defender, [0,0,2]), true);
});
