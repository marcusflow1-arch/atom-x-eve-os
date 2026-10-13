import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame5MovementAuthority } from '../../../src/game5/gameplay/authoritativeMovement.mjs';
import { createGame5MovementApi } from '../../../src/game5/gameplay/movementApi.mjs';
import { DEV_WORLD } from '../../../src/game5/gameplay/world.mjs';

const root='https://game5.example';
const auth=async req=>({authenticated:true,playerId:'base44:'+req.headers.get('x-test-user')});
function rig(){let now=10000;const authority=createGame5MovementAuthority({now:()=>now});
const api=createGame5MovementApi({authority,authenticate:auth,allowedOrigins:[root]});
const send=async(action,body={},user='alice',extras={})=>{
 const request=new Request(root+'/api/game5/movement/'+action,{
  method:extras.method||'POST',headers:{origin:extras.origin??root,'content-type':'application/json','x-test-user':user},
  body:(extras.method||'POST')==='POST'?(extras.raw??JSON.stringify(body)):undefined,
 });
 const response=await api.handleMovementRequest(request);return {status:response.status,...await response.json()};
};return {authority,api,send,advance:ms=>now+=ms,clock:()=>now};}

test('HTTP movement endpoints derive player from authenticated server callback, never from body',async()=>{
 const {send}=rig();
 const a=await send('connect',{}),b=await send('connect',{},'bob');
 assert.equal(a.status,200);assert.equal(b.status,200);assert.notEqual(a.sessionId,b.sessionId);
 assert.equal((await send('connect',{playerId:'base44:bob'})).status,400);
 assert.equal((await send('input',{sessionId:a.sessionId,seq:1,moveX:0,moveZ:0,sprint:false},'bob')).status,401);
 assert.equal((await send('input',{sessionId:a.sessionId,seq:1,moveX:0,moveZ:0,sprint:false,position:{x:14,z:-8}})).status,400);
 const answer=await send('input',{sessionId:a.sessionId,seq:1,moveX:0,moveZ:0,sprint:false});
 assert.equal(answer.status,200);
 assert.equal(answer.observedAt,10000);
 assert.equal(answer.isolatedTestOnly,true);
});

test('strict Origin, server auth and bad messages fail closed',async()=>{
 const x=rig();const a=await x.send('connect');
 assert.equal((await x.send('connect',{},'alice',{origin:'https://evil.example'})).error,'ORIGIN_FORBIDDEN');
 assert.equal((await x.send('input',{sessionId:a.sessionId,seq:1,moveX:1,moveZ:0,sprint:true,deltaMs:1000})).error,'FORBIDDEN_OR_INVALID_FIELDS');
 assert.equal((await x.send('connect',{},'alice',{raw:'{broken'})).error,'INVALID_JSON');
 assert.equal((await x.send('connect',{},'alice',{raw:JSON.stringify({padding:'x'.repeat(2000)})})).status,413);
 assert.equal((await x.send('connect',{},'alice',{method:'GET'})).status,405);
 const unauth=createGame5MovementApi({authority:x.authority,authenticate:async()=>null,allowedOrigins:[root]});
 const response=await unauth.handleMovementRequest(new Request(root+'/api/game5/movement/connect',{method:'POST',headers:{origin:root,'content-type':'application/json'},body:'{}'}));
 assert.equal(response.status,401);
});

test('two players, out-of-order, reconnects and delayed input cannot borrow position',async()=>{
 const x=rig();let a=await x.send('connect',{}),b=await x.send('connect',{},'bob');
 await x.send('input',{sessionId:a.sessionId,seq:1,moveX:1,moveZ:0,sprint:true});
 await x.send('input',{sessionId:b.sessionId,seq:1,moveX:-1,moveZ:0,sprint:false},'bob');
 x.advance(100);
 await x.send('input',{sessionId:a.sessionId,seq:2,moveX:1,moveZ:0,sprint:true});
 await x.send('input',{sessionId:b.sessionId,seq:2,moveX:-1,moveZ:0,sprint:false},'bob');
 assert.ok(x.api.getAuthoritativePosition({playerId:'base44:alice'}).position.x>0);
 assert.ok(x.api.getAuthoritativePosition({playerId:'base44:bob'}).position.x<0);
 assert.equal((await x.send('input',{sessionId:a.sessionId,seq:1,moveX:1,moveZ:0,sprint:true})).error,'OUT_OF_ORDER_MOVEMENT');
 a=await x.send('connect');
 assert.equal((await x.send('input',{sessionId:b.sessionId,seq:3,moveX:0,moveZ:0,sprint:false})).status,401);
 assert.equal(x.api.getAuthoritativePosition({playerId:'base44:alice'}),null,'reconnect requires fresh intent');
 await x.send('input',{sessionId:a.sessionId,seq:1,moveX:0,moveZ:0,sprint:false});
 assert.ok(x.api.getAuthoritativePosition({playerId:'base44:alice'}));
 x.advance(2501);
 assert.equal(x.api.getAuthoritativePosition({playerId:'base44:alice'}),null);
});

test('simultaneous interaction reads remain isolated by player id and freshness',async()=>{
 const x=rig();let a=await x.send('connect'),b=await x.send('connect',{},'bob');
 await x.send('input',{sessionId:a.sessionId,seq:1,moveX:0,moveZ:0,sprint:false});
 await x.send('input',{sessionId:b.sessionId,seq:1,moveX:0,moveZ:0,sprint:false},'bob');
 // Both players' positions are server-owned and independent, so sharing a
 // request or session cannot authorize a second player's card interaction.
 const positions=await Promise.all(['base44:alice','base44:bob'].map(playerId=>Promise.resolve(x.api.getAuthoritativePosition({playerId}))));
 assert.deepEqual(positions[0].position,DEV_WORLD.spawn);
 assert.deepEqual(positions[1].position,DEV_WORLD.spawn);
 assert.ok(positions.every(p=>Math.hypot(p.position.x-DEV_WORLD.card.x,p.position.z-DEV_WORLD.card.z)>DEV_WORLD.interactionRadius));
 assert.equal((await x.send('input',{sessionId:a.sessionId,seq:2,moveX:0,moveZ:0,sprint:false},'bob')).status,401);
});