import test from 'node:test';
import assert from 'node:assert/strict';
import { initialUiState, presentation, reduceQuestUi } from '../../../src/game5/client/questUi.mjs';
const snapshot=(status,n)=>({quest:{questId:'G5-0001',status,objective:{current:n,required:1}},testWallet:status==='completed'?1:0,cardCollected:n===1});
test('UI displays snapshots only, never optimistic quest success',()=>{
 let ui=initialUiState();ui=reduceQuestUi(ui,{type:'response',payload:{snapshot:snapshot('active',0)}});
 assert.equal(presentation(ui.snapshot).objective,'Recover Lost Card · 0/1');
 ui=reduceQuestUi(ui,{type:'loading'});assert.equal(presentation(ui.snapshot).objective,'Recover Lost Card · 0/1');
 ui=reduceQuestUi(ui,{type:'error',message:'request failed'});
 assert.equal(ui.error,'request failed');assert.equal(presentation(ui.snapshot).objective,'Recover Lost Card · 0/1');
 ui=reduceQuestUi(ui,{type:'response',payload:{snapshot:snapshot('ready_to_complete',1),notice:'Recovered'}});
 assert.equal(presentation(ui.snapshot).objective,'Return to Elder Shen · 1/1');assert.equal(ui.error,'');
 ui=reduceQuestUi(ui,{type:'response',payload:{snapshot:snapshot('completed',1)}});
 assert.equal(presentation(ui.snapshot).testWallet,1);assert.equal(presentation(ui.snapshot).marker,'✓');
});
test('malformed success payload cannot replace prior authoritative state',()=>{
 let ui=reduceQuestUi(initialUiState(),{type:'response',payload:{snapshot:snapshot('active',0)}});
 ui=reduceQuestUi(ui,{type:'response',payload:{notice:'Quest Complete!'}});
 assert.match(ui.error,/Invalid server/);assert.equal(ui.snapshot.quest.status,'active');
});
