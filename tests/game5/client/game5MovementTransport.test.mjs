import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame5MovementTransport } from '../../../src/game5/client/game5MovementTransport.mjs';

test('client sends intent, never identity, position, time, inventory or reward',async()=>{
 const calls=[];
 const transport=createGame5MovementTransport({fetchImpl:async(path,options)=>{
  calls.push({path,options});
  const result=path.endsWith('/connect')?{sessionId:'server-session-opaque-token',position:{x:0,z:5},worldId:'game5-lost-card-world'}:
    {ackSeq:1,position:{x:0,z:4.5},observedAt:10,worldId:'game5-lost-card-world'};
  return {ok:true,json:async()=>({...result,isolatedTestOnly:true})};
 }});
 const con=await transport.connect();assert.equal(con.position.z,5);
 const ack=await transport.submit({moveX:0,moveZ:-1,sprint:true,position:{x:14,z:-8},playerId:'bob'});
 assert.equal(ack.position.z,4.5);
 const body=JSON.parse(calls[1].options.body);
 assert.deepEqual(body,{sessionId:'server-session-opaque-token',seq:1,moveX:0,moveZ:-1,sprint:true});
 assert.ok(calls.every(c=>c.options.credentials==='same-origin'));
});

test('failed responses disconnect instead of manufacturing an acknowledgment',async()=>{
 let fail=false;
 const transport=createGame5MovementTransport({fetchImpl:async(path)=>{
  if(fail)return {ok:false,status:503,json:async()=>({error:'MOVEMENT_BACKEND_UNAVAILABLE'})};
  return {ok:true,json:async()=>({sessionId:'session-opaque-secret-123456',position:{x:0,z:5},worldId:'game5-lost-card-world',isolatedTestOnly:true})};
 }});
 await transport.connect();fail=true;
 await assert.rejects(()=>transport.submit({moveX:0,moveZ:0,sprint:false}),/MOVEMENT_BACKEND_UNAVAILABLE/);
 assert.equal(transport.getState().connected,false);
});