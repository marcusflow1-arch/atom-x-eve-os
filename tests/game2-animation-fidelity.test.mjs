import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SaberLogic } from '../src/components/game2/engine/saber.js';
import { Fighter } from '../src/components/game2/engine/fighter.js';
import { Blade } from '../src/components/game2/engine/fx.js';

const read = path => JSON.parse(readFileSync(path, 'utf8'));
const rig = read('public/game2/rig.json');
const saberData = read('public/game2/sabermoves.json');
const clips = Object.fromEntries(rig.anims.map(a => [a.name, a]));

test('all 118 Raven saber-move animations resolve to clips in the real 989-animation bank', () => {
  assert.equal(saberData.moves.length, 118);
  assert.equal(rig.anims.length, 989);
  for (const move of saberData.moves) assert.ok(clips[move.anim], move.ls + ': missing ' + move.anim);
  for (const level of [1, 2, 3]) for (const anim of
    ['BOTH_A1_TL_BR', 'BOTH_A1_TR_BL', 'BOTH_A1_T__B_']) {
    assert.ok(clips[anim.replace('A1_', 'A' + level + '_')]);
  }
});

function saberHarness(level = 3) {
  const plays = [], sounds = [];
  const host = {
    hasAnim: name => !!clips[name],
    animInfo: name => clips[name],
    torsoIdleAnim: name => name,
    playTorso: (name, options) => plays.push({ name, options }),
    event: (name, value) => sounds.push({ name, value }),
    requestDraw: () => {},
  };
  const logic = new SaberLogic(saberData, host);
  logic.holstered = false;
  logic.level = level;
  const input = { attack: true, fwd: 1, right: 0, up: 0, aimPitch: 0.15,
    busy: false, ducked: false, enemyFront: false, enemyBehind: false, velZ: 0, groundDist: 0 };
  const tick = (ms, now) => logic.update(ms, input, now);
  return { logic, input, tick, plays, sounds };
}

test('Strong saber follows original START → ATTACK → RETURN sequence, not repeated READY windups', () => {
  const {logic: s, input, tick, plays} = saberHarness(3);
  tick(16, 0);
  assert.equal(s.move, s.I.LS_S_T2B, 'initial windup starts in source move table');
  assert.ok(plays.at(-1).name.startsWith('BOTH_S3_'), 'strong windup plays source strong clip');
  let now = 0;
  while (s.inStart(s.move) && now < 2000) { now += 25; tick(25, now / 1000); }
  assert.equal(s.move, s.I.LS_A_T2B, 'START transitions to actual attack after the full clip');
  assert.ok(plays.at(-1).name.startsWith('BOTH_A3_'), 'strong swing uses the strong animation');
  input.attack = false;
  while (s.inAttack(s.move) && now < 5000) { now += 25; tick(25, now / 1000); }
  assert.equal(s.move, s.I.LS_R_T2B, 'release runs the source return animation rather than snapping to idle');
  assert.ok(plays.at(-1).name.startsWith('BOTH_R3_'));
  while (s.move !== s.I.LS_READY && now < 10000) { now += 25; tick(25, now / 1000); }
  assert.equal(s.move, s.I.LS_READY);
});

test('continued attack uses original saber quadrants for follow-ups', () => {
  const {logic:s, tick, plays} = saberHarness(2);
  let now=0;
  tick(16,now);
  for (let i=0;i<300;i++) {now+=30;tick(30,now/1000);}
  assert.ok(plays.some(p=>p.name.startsWith('BOTH_A2_')),'medium attack clip ran');
  assert.ok(plays.filter(p=>p.name.startsWith('BOTH_A2_')).length >= 2,'holding attack supports follow-up animation chain');
});

test('right strafe and right roll actually move right at yaw zero', () => {
  const f = Object.create(Fighter.prototype);
  f.g = {t:0,world:{floorAt:()=>0,collide(){}},separate(){},sfxAt(){}};
  f.pos=[0,0,0]; f.vel=[0,0,0]; f.yaw=0; f.targetYaw=0;
  f.onGround=true; f.ducked=false; f.status='normal'; f.speedMul=1;
  f.forceUntil=0; f.shoveV=[0,0,0]; f.elecUntil=0;
  f.saber={move:0,I:{LS_PUTAWAY:7},holstered:true,isActiveSwing:()=>false};
  f.cmd={fwd:0,right:1,walk:false,crouch:false,crouchPressed:false,
    jump:false,jumpPressed:false,attack:false,alt:false};
  f.trySpecialJumpAttack=()=>false; f.selectLegs=()=>{};f.updateSaber=()=>{};
  f.normalUpdate(0.05);
  assert.ok(f.pos[0]>0,'D key should move the world-space player to +X when facing +Z');
  f.actor={skel:{anims:clips},setBoth(name){this.last=name;}};
  f.saber={weaponTime:0,torsoTimer:0,I:{LS_READY:1},move:1};
  f.cmd.right=1; f.cmd.fwd=0; f.startRoll();
  assert.equal(f.actor.last,'BOTH_ROLL_R');
  assert.ok(f.rollDir[0]>0,'right roll velocity must agree with right strafe');
});

test('after takeoff the Ghoul2 JUMP clip blends into its direction-matched INAIR pose',()=>{
  const f=Object.create(Fighter.prototype),plays=[];
  f.g={t:0.8};f.vel=[0,1,0];f.onGround=false;f.jumpAt=0;f.airAnim='BOTH_JUMPRIGHT1';
  f.saber={holstered:true,move:0,inSpecial:()=>false};f.legsLockUntil=0;
  f.actor={skel:{anims:clips},legs:{cur:{speed:1}},setLegs:(name,opts)=>plays.push(name)};
  f.selectLegs(0.016,0,0);
  assert.equal(f.airAnim,'BOTH_INAIRRIGHT1');
  assert.deepEqual(plays,['BOTH_INAIRRIGHT1']);
});

test('special airborne saber animations retain full-body priority over jump pose transitions',()=>{
  const f=Object.create(Fighter.prototype),plays=[];
  f.g={t:0.8};f.vel=[0,1,0];f.onGround=false;f.jumpAt=0;f.airAnim='BOTH_JUMP1';
  f.saber={holstered:false,move:99,inSpecial:()=>true};f.legsLockUntil=1.6;
  f.actor={skel:{anims:clips},legs:{cur:{speed:1}},setLegs:name=>plays.push(name)};
  f.selectLegs(0.016,0,0);
  assert.equal(plays.length,0,'do not cut aerial slash/flip animation short');
});

test('Space while knocked down starts the real Force Getup clip without waiting for the timeout',()=>{
  const f=Object.create(Fighter.prototype),played=[];
  f.g={t:1};f.status='down';f.statusT=0.01;f.cmd={jumpPressed:true};f.onGround=true;
  f.actor={skel:{anims:clips}};
  f.frictionMove=()=>{};f.playWhole=(name,opts)=>{played.push(name);return clips[name].n/clips[name].fps;};
  f.finish=()=>{};
  f.update(0.016);
  assert.equal(f.status,'getup');
  assert.deepEqual(played,['BOTH_FORCE_GETUP_B1']);
  assert.equal(f.cmd.jumpPressed,false);
});

test('saber trail only tracks moving combat blade, and is cleared on holster',()=>{
  const b=new Blade([0.3,0.6,1]),mat=new Float32Array(16);
  mat[0]=mat[5]=mat[10]=mat[15]=1;
  b.set(true);b.update(0.1,mat,0.3,1,0);
  assert.equal(b.trail.length,0,'no idle glow quads before a swing');
  b.trailOn=1;mat[12]=0.2;
  b.update(0.03,mat,0.3,1,0.03);
  mat[12]=0.5;b.update(0.03,mat,0.3,1,0.06);
  assert.ok(b.trail.length>=2,'arc follows moving blade samples');
  b.set(false);
  assert.equal(b.trail.length,0,'holstering cannot leave stale swing rectangles');
});
