import test from 'node:test';
import assert from 'node:assert/strict';
import {buildAssignment,runWorker,qaReview} from './worker.mjs';
const task={schema_version:'game5.task.v1',task_id:'G5-0001',title:'Lost Card',agent_role:'quest_npc',status:'planned',depends_on:[],allowed_paths:['src/game5/quests/**'],acceptance_tests:['progress once']};
test('scope',()=>assert.equal(buildAssignment(task).agent_role,'quest_npc'));
test('mocked provider response',async()=>{
 const fake=async(url,options)=>{assert.match(url,/api.openai.com/);assert.equal(JSON.parse(options.body).store,false);
 return {ok:true,json:async()=>({id:'test',output:[{content:[{type:'output_text',text:'{"plan":["Create quest event"]}'}]}]})};};
 const report=await runWorker({task,apiKey:'fake',fetchImpl:fake});
 assert.equal(report.code_written,false);assert.equal(qaReview({task,report}).passed,true);
});
test('QA rejects task mismatch',()=>assert.equal(qaReview({task,report:{task_id:'G5-9999',agent_role:'quest_npc',artifact:'x',code_written:false,tests_executed:false,qa_passed:false}}).passed,false));
test('missing credentials fail closed',async()=>assert.rejects(()=>runWorker({task}),/Missing OPENAI_API_KEY/));
