import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DevQuestRepository } from '../../../src/game5/gameplay/devQuestRepository.mjs';
import { createLostCardGameplayController } from '../../../src/game5/gameplay/lostCardGameplayController.mjs';
import { DEV_WORLD } from '../../../src/game5/gameplay/world.mjs';
const npc = { npcId: DEV_WORLD.npc.id, position: { x: DEV_WORLD.npc.x, z: DEV_WORLD.npc.z } };
const card = { pickupId: DEV_WORLD.card.id, position: { x: DEV_WORLD.card.x, z: DEV_WORLD.card.z } };
async function setup(t) {
  const dir = await mkdtemp(join(tmpdir(), 'g5-play-test-'));t.after(() => rm(dir,{recursive:true,force:true}));
  const file=join(dir,'state.json');const repository=new DevQuestRepository({file});
  return {file,repository,controller:createLostCardGameplayController({repository})};
}
test('NPC is actionable within distance; remote and malformed positions rejected',async(t)=>{
  const {controller}=await setup(t);
  await assert.rejects(()=>controller.accept({...npc,position:{x:21,z:21}}),/Move closer/);
  await assert.rejects(()=>controller.accept({...npc,position:{x:NaN,z:1}}),/Invalid development player position/);
  await assert.rejects(()=>controller.accept({...npc,npcId:'forged'}),/Unknown quest NPC/);
  const r=await controller.accept(npc);assert.equal(r.snapshot.quest.status,'active');
});
test('accept twice, reject premature completion, reject invalid pickup, show 0 to 1 progress',async(t)=>{
 const {controller}=await setup(t);await assert.rejects(()=>controller.complete(npc),/Collect the Lost Card/);
 const a=await controller.accept(npc);assert.equal(a.snapshot.quest.objective.current,0);
 const b=await controller.accept(npc);assert.match(b.notice,/already accepted/);assert.equal(b.snapshot.quest.objective.current,0);
 await assert.rejects(()=>controller.pickup({...card,pickupId:'wrong'}),/Unknown collectible/);
 await assert.rejects(()=>controller.pickup({...card,position:{x:0,z:5}}),/Move closer/);
 const collected=await controller.pickup(card);assert.equal(collected.snapshot.quest.objective.current,1);assert.equal(collected.snapshot.quest.status,'ready_to_complete');
 const duplicate=await controller.pickup(card);assert.match(duplicate.notice,/already collected/);assert.equal(duplicate.snapshot.quest.objective.current,1);
});
test('pickup before accepting rejected; no test reward',async(t)=>{
 const {controller}=await setup(t);await assert.rejects(()=>controller.pickup(card),/Accept the quest/);
 const state=await controller.snapshot();assert.equal(state.quest.status,'not_started');assert.equal(state.testWallet,0);
});
test('only one reward under concurrent completion; duplicate pickup cannot grant more',async(t)=>{
 const {controller,repository}=await setup(t);await controller.accept(npc);
 const claimed=await Promise.all(Array.from({length:10},()=>controller.pickup(card)));
 assert.equal(claimed.filter(x=>/recovered/.test(x.notice)).length,1);
 assert.equal((await controller.snapshot()).quest.objective.current,1);
 const finished=await Promise.all(Array.from({length:20},()=>controller.complete(npc)));
 assert.equal(finished.filter(x=>/Quest Complete!/.test(x.notice)).length,1);
 const state=await controller.snapshot();assert.equal(state.quest.status,'completed');assert.equal(state.testWallet,1);
 assert.equal(Object.keys((await repository.read('game5-dev-player')).rewardLedger).length,1);
 await controller.pickup(card);await controller.complete(npc);
 assert.equal((await controller.snapshot()).testWallet,1);
});
test('disk-backed dev quest restores after controller and repository recreation',async(t)=>{
 const {controller,file}=await setup(t);await controller.accept(npc);await controller.pickup(card);
 const recreated=createLostCardGameplayController({repository:new DevQuestRepository({file})});
 assert.equal((await recreated.snapshot()).quest.status,'ready_to_complete');
 await recreated.complete(npc);
 const second=createLostCardGameplayController({repository:new DevQuestRepository({file})});
 assert.equal((await second.snapshot()).quest.status,'completed');assert.equal((await second.snapshot()).testWallet,1);
});
test('repository errors propagate and never create false success',async()=>{
 const failing={read:async()=>{throw Error('storage unavailable');},transact:async()=>{throw Error('storage unavailable');}};
 const controller=createLostCardGameplayController({repository:failing});
 await assert.rejects(()=>controller.snapshot(),/storage unavailable/);
 await assert.rejects(()=>controller.accept(npc),/storage unavailable/);
});

test('restart repairs crash between committed card receipt and quest progression', async(t)=>{
 const {file,repository}=await setup(t);
 let faultOnce=true;
 const crashAfterReceipt={
   read:(...args)=>repository.read(...args),
   transact:async(...args)=>{
     const committed=await repository.transact(...args);
     if(faultOnce && committed?.type==='game5.inventory.card_collected.v1'){
       faultOnce=false;
       throw new Error('SIMULATED CRASH: receipt committed before quest event');
     }
     return committed;
   },
 };
 const beforeCrash=createLostCardGameplayController({repository:crashAfterReceipt});
 await beforeCrash.accept(npc);
 await assert.rejects(()=>beforeCrash.pickup(card),/SIMULATED CRASH/);
 const onDisk=await repository.read('game5-dev-player');
 assert.equal(onDisk.quests['G5-0001'].status,'active');
 assert.equal(onDisk.quests['G5-0001'].objective.current,0);
 assert.ok(onDisk.devClaims[DEV_WORLD.card.id], 'card receipt survived simulated crash');
 const recovered=createLostCardGameplayController({repository:new DevQuestRepository({file})});
 const state=await recovered.snapshot(); // GET /state after refresh repairs pending receipt
 assert.equal(state.quest.status,'ready_to_complete');
 assert.equal(state.quest.objective.current,1);
 assert.equal(state.cardCollected,true);
 const replay=await recovered.pickup(card);
 assert.match(replay.notice,/already collected/);
 const result=await Promise.all(Array.from({length:20},()=>recovered.complete(npc)));
 assert.equal(result.filter(x=>/Quest Complete!/.test(x.notice)).length,1);
 const last=await recovered.snapshot();
 assert.equal(last.quest.status,'completed');
 assert.equal(last.testWallet,1);
 assert.equal(Object.keys((await repository.read('game5-dev-player')).rewardLedger).length,1);
});

test('crash-recovery failure never returns a false collected snapshot',async(t)=>{
 const {repository}=await setup(t);
 const original=createLostCardGameplayController({repository});
 await original.accept(npc);
 await repository.transact('game5-dev-player',record=>{
   record.devClaims[DEV_WORLD.card.id]={
     type:'game5.inventory.card_collected.v1',
     eventId:'crash-pending-receipt',
     cardId:'game5:lost-card',
     cardInstanceId:DEV_WORLD.card.cardInstanceId,
     playerId:'game5-dev-player'
   };
 });
 const offline={
   read:(...args)=>repository.read(...args),
   transact:()=>Promise.reject(new Error('storage offline during recovery')),
 };
 await assert.rejects(()=>createLostCardGameplayController({repository:offline}).snapshot(),/storage offline/);
 const record=await repository.read('game5-dev-player');
 assert.equal(record.quests['G5-0001'].objective.current,0);
 // Once storage is restored a fresh snapshot reconciles the receipt.
 const recovered=await original.snapshot();
 assert.equal(recovered.quest.objective.current,1);
 assert.equal(recovered.cardCollected,true);
});
