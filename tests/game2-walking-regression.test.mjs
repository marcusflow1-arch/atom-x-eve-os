import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Game } from '../src/components/game2/engine/game.js';
import { Fighter, emptyCmd } from '../src/components/game2/engine/fighter.js';
import { Input } from '../src/components/game2/engine/input.js';
import { parseRBSP, BSPCollision } from '../src/components/game2/engine/rbsp.js';

// Real in-game input events + Game commands + Fighter movement + imported
// Lightsaber Training BSP, not a source-text-only or fake empty-map test.
function createTestScene() {
  const previousWindow=globalThis.window,previousDocument=globalThis.document;
  const win=new EventTarget(),document=new EventTarget(),canvas=new EventTarget();
  document.pointerLockElement=null;
  document.exitPointerLock=()=>{};
  canvas.requestPointerLock=()=>Promise.resolve();
  globalThis.window=win;globalThis.document=document;
  const input=new Input(canvas);
  const map=parseRBSP(readFileSync('public/game2/maps/duel_training.bsp'));
  const world=new BSPCollision(map);
  const spawn=world.chooseSpawns().player;
  const game=Object.create(Game.prototype);
  game.t=0;game.duel=true;game.round={state:'fight',t:1};
  game.input=input;
  game.world=world;
  game.separate=()=>{};
  game.cam={yaw:0,pitch:0.2,dist:3.7};
  game.hud={help:false,debug:false,msg:()=>{}};
  game.force={select:()=>{}};
  game.sfx={muted:false};
  game.firstSub=true;
  const player=Object.create(Fighter.prototype);
  player.g=game;
  player.pos=spawn.slice();
  player.vel=[0,0,0];player.yaw=0;player.targetYaw=0;
  player.cmd=emptyCmd();
  player.onGround=true;player.ducked=false;
  player.speedMul=1;player.status='normal';
  player.forceUntil=0;player.shoveV=[0,0,0];player.elecUntil=0;
  player.saber={move:1,I:{LS_PUTAWAY:3},holstered:true,weaponTime:0,isActiveSwing:()=>false};
  player.trySpecialJumpAttack=()=>false;
  player.selectLegs=()=>{};
  player.updateSaber=()=>{};
  game.player=player;
  const key=(code,down=true)=>{
    const evt=new Event(down?'keydown':'keyup',{cancelable:true});
    Object.defineProperty(evt,'code',{value:code});
    Object.defineProperty(evt,'repeat',{value:false});
    win.dispatchEvent(evt);
  };
  const tick=(frames=1)=>{
    for(let n=0;n<frames;n++){
      game.t+=1/60;
      game.frameInput(1/60);
      game.buildPlayerCmd();
      player.normalUpdate(1/60);
      input.endFrame();
    }
  };
  const close=()=>{
    input.dispose();
    globalThis.window=previousWindow;
    globalThis.document=previousDocument;
  };
  return {game,player,input,canvas,win,spawn,key,tick,close};
}

test('Game 2 WASD keys dismiss the old blocking help sheet and move on that very frame',()=>{
  const s=createTestScene();
  try {
    s.game.hud.help=true;
    s.key('KeyW');
    s.tick(12);
    assert.equal(s.game.hud.help,false,'movement should dismiss blocking tutorial');
    assert.equal(s.game.player.cmd.fwd,1,'W reaches player command');
    assert.ok(s.player.pos[2]>s.spawn[2]+0.1,'W moves actual character through real BSP world');
  }finally{s.close();}
});

test('Game 2 movement responds to W, S, A, D and W+A / W+D in the imported level',()=>{
  for (const [code,axis,sign] of [
    ['KeyW',2,1],['KeyS',2,-1],['KeyA',0,1],['KeyD',0,-1],
  ]) {
    const s=createTestScene();
    try{
      s.key(code);
      s.tick(12);
      const delta=s.player.pos[axis]-s.spawn[axis];
      assert.ok(sign*delta>0.08,`${code} should move along the expected original Game 2 direction (delta ${delta})`);
      s.key(code,false);
      s.tick(4);
      assert.equal(s.player.cmd.fwd,0);
      assert.equal(s.player.cmd.right,0);
    }finally{s.close();}
  }
  for(const other of ['KeyA','KeyD']) {
    const s=createTestScene();
    try{
      s.key('KeyW');s.key(other);s.tick(12);
      assert.ok(Math.abs(s.player.pos[0]-s.spawn[0])>0.08,`W+${other} strafes`);
      assert.ok(s.player.pos[2]>s.spawn[2]+0.08,`W+${other} walks forward`);
    }finally{s.close();}
  }
});

test('movement remains responsive after opening the controls menu via F1',()=>{
  const s=createTestScene();
  try{
    s.key('F1');s.tick();
    assert.equal(s.game.hud.help,true);
    s.key('F1',false);s.tick();
    s.key('KeyD');s.tick(6);
    assert.equal(s.game.hud.help,false);
    assert.equal(s.player.cmd.right,1);
    assert.ok(s.player.pos[0]<s.spawn[0]-0.02);
  }finally{s.close();}
});

test('window focus loss clears stuck movement keys and normal keyboard controls resume',()=>{
  const s=createTestScene();
  try {
    s.key('KeyW');s.tick(6);
    s.win.dispatchEvent(new Event('blur'));
    s.tick(1);
    assert.equal(s.player.cmd.fwd,0);
    s.key('KeyW');s.tick(6);
    assert.equal(s.player.cmd.fwd,1);
  } finally {s.close();}
});
