import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame5MovementAuthority, MovementAuthorityError, GAME5_WORLD_ID } from '../../../src/game5/gameplay/authoritativeMovement.mjs';
import { DEV_WORLD } from '../../../src/game5/gameplay/world.mjs';

function rig() {
  let now = 100000;
  const authority = createGame5MovementAuthority({now:()=>now});
  return {authority,advance:(ms)=>{now+=ms;},clock:()=>now,
    connect:(id='base44:alice')=>authority.connect({playerId:id}),
    send:(id, sessionId, seq, moveX=0, moveZ=0, sprint=false)=>
      authority.input({playerId:id,intent:{sessionId,seq,moveX,moveZ,sprint}}),
  };
}

test('server owns spawn, time, direction and speed; no client-side coordinates are accepted',()=>{
 const r=rig();const s=r.connect();
 assert.deepEqual(s.position,DEV_WORLD.spawn);
 assert.equal(r.authority.getAuthoritativePosition({playerId:'base44:alice'}),null);
 assert.throws(()=>r.authority.input({playerId:'base44:alice',intent:{sessionId:s.sessionId,seq:1,moveX:0,moveZ:-1,sprint:true,position:{x:14,z:-8}}}),/INVALID_MOVEMENT_INTENT/);
 r.send('base44:alice',s.sessionId,1,0,-1);
 r.advance(100);const moved=r.send('base44:alice',s.sessionId,2,0,-1);
 assert.ok(Math.abs(moved.position.z-4.5)<1e-6);
 assert.equal(r.authority.getAuthoritativePosition({playerId:'base44:alice'}).worldId,GAME5_WORLD_ID);
 r.advance(100);r.send('base44:alice',s.sessionId,3,0,-1,true);
 r.advance(100);const sprint=r.send('base44:alice',s.sessionId,4,0,-1,true);
 assert.ok(Math.abs(sprint.position.z-3.2)<1e-6,'sprint 8m/s in 100ms');
});

test('rapid spam, duplicate and out-of-order packets cannot multiply travel distance',()=>{
 const r=rig();const {sessionId}=r.connect();r.send('base44:alice',sessionId,1,1,0,true);
 for(let i=2;i<=200;i++)r.send('base44:alice',sessionId,i,1,0,true);
 assert.deepEqual(r.authority.getAuthoritativePosition({playerId:'base44:alice'}).position,DEV_WORLD.spawn);
 assert.throws(()=>r.send('base44:alice',sessionId,190,1,0,true),e=>e.code==='OUT_OF_ORDER_MOVEMENT');
 r.advance(100);const p=r.send('base44:alice',sessionId,201,1,0,true).position;
 assert.ok(p.x<=0.800001);
 assert.throws(()=>r.send('base44:alice',sessionId,201,1,0,true),/OUT_OF_ORDER_MOVEMENT/);
});

test('delayed packets and long pauses cannot teleport; intervals are capped at server time',()=>{
 const r=rig();const {sessionId}=r.connect();r.send('base44:alice',sessionId,1,0,-1,true);
 r.advance(100);let x=r.send('base44:alice',sessionId,2,0,-1,true).position;
 assert.ok(Math.abs(x.z-(5-.8))<1e-6);
 r.advance(1000);x=r.send('base44:alice',sessionId,3,0,-1,true).position;
 assert.ok(Math.abs(x.z-(5-.8))<1e-6,'old held intent expires instead of moving 8m');
 r.advance(250);x=r.send('base44:alice',sessionId,4,0,-1,true).position;
 assert.ok(x.z>=5-.8-1.2-1e-6,'step capped to 150ms despite 250ms gap');
});

test('boundary, temple, tree and NPC collisions disallow tunneling even while sprinting',()=>{
 const r=rig();let {sessionId}=r.connect();r.send('base44:alice',sessionId,1,0,-1,true);
 for(let i=2;i<70;i++){r.advance(100);r.send('base44:alice',sessionId,i,0,-1,true);}
 const p=r.authority.getAuthoritativePosition({playerId:'base44:alice'}).position;
 assert.ok(p.z >= DEV_WORLD.npc.z+0.88-0.1,'NPC has solid collider');
 let q=r.connect('base44:bob');r.send('base44:bob',q.sessionId,1,1,0,true);
 for(let i=2;i<90;i++){r.advance(100);r.send('base44:bob',q.sessionId,i,1,0,true);}
 const bob=r.authority.getAuthoritativePosition({playerId:'base44:bob'}).position;
 assert.ok(bob.x<=DEV_WORLD.bounds-.4+1e-5);
});

test('two players use independent positions; one player cannot use the other session',()=>{
 const r=rig();const a=r.connect('base44:alice'),b=r.connect('base44:bob');
 r.send('base44:alice',a.sessionId,1,1,0,true);
 r.send('base44:bob',b.sessionId,1,-1,0,false);
 r.advance(100);r.send('base44:alice',a.sessionId,2,1,0,true);
 r.send('base44:bob',b.sessionId,2,-1,0,false);
 assert.ok(r.authority.getAuthoritativePosition({playerId:'base44:alice'}).position.x>0);
 assert.ok(r.authority.getAuthoritativePosition({playerId:'base44:bob'}).position.x<0);
 assert.throws(()=>r.send('base44:bob',a.sessionId,3,0,0),/MOVEMENT_SESSION_EXPIRED/);
 assert.throws(()=>r.authority.input({playerId:'base44:charlie',intent:{sessionId:a.sessionId,seq:2,moveX:1,moveZ:0,sprint:true}}),/MOVEMENT_SESSION_EXPIRED/);
});

test('reconnect replaces old session, reuses recent position but never stamps a stale position fresh',()=>{
 const r=rig();const first=r.connect();r.send('base44:alice',first.sessionId,1,0,-1,true);
 r.advance(100);const before=r.send('base44:alice',first.sessionId,2,0,-1).position;
 r.advance(3000);assert.equal(r.authority.getAuthoritativePosition({playerId:'base44:alice'}),null);
 const next=r.connect();assert.deepEqual(next.position,before);
 assert.equal(r.authority.getAuthoritativePosition({playerId:'base44:alice'}),null);
 assert.throws(()=>r.send('base44:alice',first.sessionId,3,0,-1),/MOVEMENT_SESSION_EXPIRED/);
 r.send('base44:alice',next.sessionId,1,0,0);
 assert.deepEqual(r.authority.getAuthoritativePosition({playerId:'base44:alice'}).position,before);
 r.advance(31000);const after=r.connect();assert.deepEqual(after.position,DEV_WORLD.spawn,'expired reconnect starts at trusted spawn');
});

test('disconnect disables quest proximity; bad, stale and forged intents fail closed',()=>{
 const r=rig();const c=r.connect();
 assert.throws(()=>r.send('base44:alice',c.sessionId,1,4,0),/INVALID_MOVEMENT_INTENT/);
 assert.throws(()=>r.send('base44:alice',c.sessionId,1,NaN,0),/INVALID_MOVEMENT_INTENT/);
 assert.throws(()=>r.send('base44:alice',c.sessionId,0,1,0),/INVALID_MOVEMENT_INTENT/);
 r.send('base44:alice',c.sessionId,1,0,0);
 assert.equal(r.authority.getAuthoritativePosition({playerId:'base44:alice'}).authoritative,true);
 r.authority.disconnect({playerId:'base44:alice',sessionId:c.sessionId});
 assert.equal(r.authority.getAuthoritativePosition({playerId:'base44:alice'}),null);
 assert.throws(()=>r.send('base44:alice',c.sessionId,2,1,0),/MOVEMENT_SESSION_EXPIRED/);
});