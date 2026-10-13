import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame5QuestHttpTransport } from '../../../src/game5/client/game5QuestHttpTransport.mjs';
import { createConnectedQuestSession } from '../../../src/game5/client/connectedQuestSession.mjs';
const snapshot = (status='active',current=0) => ({
  quest: { questId: 'G5-0001', status, objective: { current, required: 1 } },
  cardCollected: current===1, testWallet: 0, isolatedTestOnly: true,
});
test('G5-0003-A transport uses same-origin credentials and forbids spoofed identity, position or receipts',async()=>{
 const calls=[];
 const transport=createGame5QuestHttpTransport({fetchImpl:async(url,options)=>{
  calls.push({url,options});
  return {ok:true,json:async()=>({snapshot:snapshot()})};
 }});
 await transport.load();
 await transport.accept({npcId:'lost-card-elder',position:{x:999,z:999},userId:'spoofed',reward:100});
 await transport.pickup({pickupId:'lost-card-ground-01',position:{x:14,z:-8},event:{forged:true}});
 await transport.complete({npcId:'lost-card-elder',position:{x:0,z:-5}});
 assert.equal(calls.length,4);
 assert.deepEqual(calls.map(x=>x.url),['/api/game5/quest/state','/api/game5/quest/accept','/api/game5/quest/pickup','/api/game5/quest/complete']);
 assert.ok(calls.every(x=>x.options.credentials==='same-origin'));
 assert.equal(calls[0].options.method,'GET');
 assert.equal(calls[0].options.body,undefined);
 assert.deepEqual(JSON.parse(calls[1].options.body),{npcId:'lost-card-elder'});
 assert.deepEqual(JSON.parse(calls[2].options.body),{pickupId:'lost-card-ground-01'});
 assert.deepEqual(JSON.parse(calls[3].options.body),{npcId:'lost-card-elder'});
 assert.ok(calls.every(x=>!JSON.stringify(x.options).includes('spoofed')));
});
test('backend refusal is surfaced and never converted to simulated success',async()=>{
 const transport=createGame5QuestHttpTransport({fetchImpl:async()=>({ok:false,status:503,json:async()=>({error:'MOVEMENT_AUTHORITY_NOT_CONFIGURED'})})});
 const session=createConnectedQuestSession({transport});
 assert.equal((await session.refresh()).ok,false);
 assert.equal(session.getState().phase,'backend_failure');
 assert.equal(session.getState().snapshot,null);
});
test('server 403 NOT_NEAR_TARGET is rejected pickup, not fake unauthorized identity',async()=>{
 let response={ok:true,json:async()=>({snapshot:snapshot()})};
 const transport=createGame5QuestHttpTransport({fetchImpl:async()=>response});
 const session=createConnectedQuestSession({transport});
 await session.refresh();
 response={ok:false,status:403,json:async()=>({error:'NOT_NEAR_TARGET'})};
 const result=await session.dispatch('pickup',{pickupId:'lost-card-ground-01'});
 assert.equal(result.ok,false);
 assert.equal(session.getState().phase,'rejected');
 assert.equal(session.getState().snapshot.quest.objective.current,0);
 assert.match(session.getState().error,/NOT_NEAR_TARGET/);
});
test('invalid target and malformed endpoint responses fail closed',async()=>{
 const transport=createGame5QuestHttpTransport({fetchImpl:async()=>({ok:true,json:async()=>({})})});
 await assert.rejects(()=>transport.pickup({pickupId:'foreign'}),/Invalid Lost Card target/);
 const session=createConnectedQuestSession({transport});
 assert.equal((await session.refresh()).ok,false);
 assert.equal(session.getState().phase,'backend_failure');
 assert.equal(session.getState().snapshot,null);
});
