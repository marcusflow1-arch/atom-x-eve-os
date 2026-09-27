import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { webcrypto, createHmac } from 'node:crypto';
import { buildSync } from 'esbuild';
import { makeRewardFixture } from './helpers/reward-fixture.mjs';

const db=makeRewardFixture(), svc=db.entities(), handlers={};
const quiet={error(){},warn(){}};
function bundle(path, extra={}) {
  const module={exports:{}};
  const context={module,exports:module.exports,Response,Request,Date,TextEncoder,crypto:webcrypto,console:quiet,...extra};
  vm.runInNewContext(buildSync({entryPoints:[path],bundle:true,write:false,platform:'node',format:'cjs',external:['npm:*']}).outputFiles[0].text,context);
  return module.exports;
}
const engine=bundle('base44/shared/rewardEngine.ts');
const journal=bundle('base44/shared/rewardJournal.ts');
for(const name of ['gameEvent','achievementSystem','claimFreeGame'])bundle('base44/functions/'+name+'/entry.ts',{
  Deno:{serve:(handler)=>{handlers[name]=handler;},env:{get:(key)=>key==='GAME_SECRET_game'?'test-integration-secret':undefined}},
  require:(id)=>{
    assert.match(id,/^npm:@base44\/sdk@0\.8\.51$/);
    return {createClientFromRequest:(req)=>({
      auth:{me:async()=>req.headers.get('test-user')==='none'?null:{id:req.headers.get('test-user')||'a',role:req.headers.get('test-user')==='admin'?'admin':'user'}},
      asServiceRole:{entities:svc},
    })};
  },
});
function seed({quantity=2,points=100,threshold=3,stackable=true}={}) {
  db.rows('User').push({id:'a'},{id:'b'});
  db.rows('Game').push({id:'game',title:'Test Game',genre:'Action RPG',status:'available',price:0,starter_card_ids:['card']});
  db.rows('TradingCard').push({id:'card',name:'Test Reward',image_url:'https://test.local/card.png',rarity:'Rare',status:'live',card_type:'ability',game_id:'game',stackable,tradable:true});
  db.rows('Achievement').push({id:'earned',title:'Trusted Win',description:'Win games',category:'ability',game:'Test Game',game_id:'game',card_id:'card',rarity:'Rare',points,icon:'trophy',reward:{quantity},event_rule:{event_key:'win',threshold}});
}
const grant=()=>engine.grantAchievement(svc,'a','earned','game_event',{current:3,total:3});
const body=(patch={})=>({event_id:'event-1',user_id:'a',event_key:'win',value:1,occurred_at:new Date().toISOString(),...patch});
async function request(name,payload,expected=200,{actor='a',raw,signature,method='POST',game='game'}={}) {
  const text=raw??JSON.stringify(payload);
  const signed=signature??createHmac('sha256','test-integration-secret').update(text).digest('hex');
  const response=await handlers[name](new Request('https://test.local',{
    method,headers:{'X-Game-Id':game,'X-Signature':signed,'test-user':actor},...(method==='GET'?{}:{body:text}),
  }));
  const result=await response.json();
  assert.equal(response.status,expected,JSON.stringify({error:result.error}));
  return result;
}
const event=(payload,expected,options)=>request('gameEvent',payload,expected,options);
beforeEach(()=>db.reset());

test('a new achievement publishes only after card and XP delivery; sequential retries do not pay again',async()=>{
  seed();await grant();const repeat=await grant();
  assert.equal(db.rows('UserCard').length,1);assert.equal(db.rows('UserCard')[0].quantity,2);
  assert.equal(db.rows('AvatarProgression')[0].global_xp,135);
  assert.equal(db.rows('UserAchievement')[0].status,'unlocked');
  assert.equal(repeat.xp,0);assert.equal(repeat.alreadyUnlocked,true);
  const cardWrite=db.writes.findIndex((w)=>w.name==='UserCard');
  const xpWrite=db.writes.findIndex((w)=>w.name==='AvatarProgression'&&w.data.$inc);
  const unlockWrite=db.writes.findIndex((w)=>w.name==='UserAchievement'&&w.data.status==='unlocked');
  assert.ok(unlockWrite>cardWrite&&unlockWrite>xpWrite);
});

const interruptionPoints=[
  ['journal creation acknowledgement','RewardGrant','upsert','after',()=>true],
  ['card before write','UserCard','create','before',()=>true],
  ['card acknowledgement','UserCard','create','after',()=>true],
  ['card receipt before write','RewardGrant','update','before',(d)=>d.status==='completed'],
  ['card receipt acknowledgement','RewardGrant','update','after',(d)=>d.status==='completed'],
  ['XP before write','AvatarProgression','updateMany','before',(d)=>Boolean(d.$inc)],
  ['XP acknowledgement','AvatarProgression','updateMany','after',(d)=>Boolean(d.$inc)],
  ['level acknowledgement','AvatarProgression','updateMany','after',(d)=>Boolean(d.$max)],
  ['unlock before write','UserAchievement','update','before',(d)=>d.status==='unlocked'],
  ['unlock acknowledgement','UserAchievement','update','after',(d)=>d.status==='unlocked'],
  ['final receipt acknowledgement','RewardGrant','updateMany','after',(d)=>d.$set?.status==='completed'],
];
for(const [label,name,operation,phase,check]of interruptionPoints)test('interrupted '+label+' resumes without duplicating card or XP',async()=>{
  seed();db.failOnce((op)=>op.name===name&&op.operation===operation&&op.phase===phase&&check(op.data));
  await assert.rejects(grant(),/Injected/);
  await grant();await grant();
  assert.equal(db.rows('UserCard').length,1);
  assert.equal(db.rows('UserCard')[0].quantity,2);
  assert.equal(db.rows('AvatarProgression')[0].global_xp,135);
  assert.equal(db.rows('UserAchievement')[0].status,'unlocked');
  assert.ok(db.rows('RewardGrant').every((row)=>row.status==='completed'));
});

test('stacked card increment and its receipt survive a lost response together',async()=>{
  seed();db.rows('UserCard').push({id:'owned',user_id:'a',trading_card_id:'card',card_type:'ability',card_name:'Test Reward',quantity:5,trade_status:'available'});
  db.failOnce((op)=>op.name==='UserCard'&&op.operation==='updateMany'&&op.phase==='after'&&Boolean(op.data.$inc));
  await assert.rejects(grant());await grant();
  assert.equal(db.rows('UserCard').length,1);assert.equal(db.rows('UserCard')[0].quantity,7);
  assert.equal(db.rows('AvatarProgression')[0].global_xp,135);
});

test('a transfer after card delivery cannot trigger a replacement during recovery',async()=>{
  seed();db.failOnce((op)=>op.name==='AvatarProgression'&&op.operation==='upsert'&&op.phase==='before');
  await assert.rejects(grant());
  db.rows('UserCard')[0].user_id='b';
  const result=await grant();
  assert.equal(result.userCard,null);assert.equal(db.rows('UserCard').length,1);
  assert.equal(db.rows('UserCard')[0].user_id,'b');assert.equal(db.rows('AvatarProgression')[0].global_xp,135);
});

test('completed receipts prevent reminting a consumed reward card',async()=>{
  seed();await grant();db.tables.set('UserCard',[]);
  const result=await grant();assert.equal(result.userCard,null);assert.equal(db.rows('UserCard').length,0);
  assert.equal(db.rows('AvatarProgression')[0].global_xp,135);
});

test('reward amounts freeze before delivery and do not change during a retry',async()=>{
  seed();db.failOnce((op)=>op.name==='UserCard'&&op.operation==='create'&&op.phase==='before');
  await assert.rejects(grant());db.rows('Achievement')[0].points=900;db.rows('Achievement')[0].reward.quantity=99;
  await grant();assert.equal(db.rows('UserCard')[0].quantity,2);assert.equal(db.rows('AvatarProgression')[0].global_xp,135);
});

test('old unlocked achievements without receipts are not guessed or reawarded',async()=>{
  seed();db.rows('UserAchievement').push({id:'legacy',user_id:'a',achievement_id:'earned',status:'unlocked',source:'game_event'});
  const result=await grant();assert.equal(result.legacyDelivery,true);assert.equal(db.writes.length,0);
});

test('ambiguous duplicate journal records fail closed before an economic write',async()=>{
  seed();const key=journal.rewardKey('achievement','a','earned');
  db.rows('RewardGrant').push({id:'g1',user_id:'a',grant_key:key},{id:'g2',user_id:'a',grant_key:key});
  await assert.rejects(grant(),/Duplicate reward records/);assert.equal(db.writes.length,0);
});

test('presentation failures do not report a completed economic reward as failed',async()=>{
  seed();db.failOnce((op)=>op.name==='SocialNotification'&&op.phase==='before');
  await grant();await grant();assert.equal(db.rows('AvatarProgression')[0].global_xp,135);
});

test('duplicate completed signed events acknowledge without writes or added progress',async()=>{
  seed();const payload=body();await event(payload);const before=db.writes.length;
  const repeat=await event(payload);assert.equal(repeat.duplicate,true);assert.equal(db.writes.length,before);
  assert.equal(db.rows('UserAchievement')[0].verified_event_value,1);
  assert.equal(db.rows('UserAchievement')[0].status,'in_progress');
});

test('same event ID with a changed player, amount or key is rejected',async()=>{
  seed();const payload=body();await event(payload);
  for(const patch of [{user_id:'b'},{value:3},{event_key:'other'}])await event({...payload,...patch},409);
  assert.equal(db.rows('UserAchievement')[0].verified_event_value,1);
});

test('event retry after progress acknowledgement does not add the count again',async()=>{
  seed();const payload=body();
  db.failOnce((op)=>op.name==='UserAchievement'&&op.operation==='updateMany'&&op.phase==='after'&&Boolean(op.data.$inc));
  await event(payload,503);await event(payload);
  assert.equal(db.rows('UserAchievement')[0].verified_event_value,1);
});

test('event retry after reward failure resumes the card and XP steps',async()=>{
  seed({threshold:1});const payload=body();
  db.failOnce((op)=>op.name==='AvatarProgression'&&op.operation==='updateMany'&&op.phase==='after'&&Boolean(op.data.$inc));
  await event(payload,503);await event(payload);await event(payload);
  assert.equal(db.rows('UserAchievement')[0].verified_event_value,1);
  assert.equal(db.rows('UserCard')[0].quantity,2);
  assert.equal(db.rows('AvatarProgression')[0].global_xp,135);
});

test('proof metadata cannot inflate verified event progress',async()=>{
  seed({threshold:3});db.rows('UserAchievement').push({id:'proof',user_id:'a',achievement_id:'earned',status:'pending_review',source:'proof',progress:{event_value:1000000}});
  await event(body());assert.equal(db.rows('UserAchievement')[0].verified_event_value,1);
  assert.equal(db.rows('UserCard').length,0);
});

test('distinct signed events accumulate and unlock the configured achievement',async()=>{
  seed();for(let i=0;i<3;i++)await event(body({event_id:'event-'+i}));
  assert.equal(db.rows('UserAchievement')[0].verified_event_value,3);
  assert.equal(db.rows('UserAchievement')[0].status,'unlocked');
  assert.equal(db.rows('AvatarProgression')[0].global_xp,135);
});

test('an empty event match is receipted; later catalog edits do not reinterpret a replay',async()=>{
  seed();const payload=body({event_key:'future'});await event(payload);
  db.rows('Achievement')[0].event_rule.event_key='future';
  const result=await event(payload);assert.equal(result.matched,0);assert.equal(db.rows('UserAchievement').length,0);
});

test('event matching is scoped and paginated beyond 200 definitions',async()=>{
  seed({threshold:999});
  for(let i=0;i<205;i++)db.rows('Achievement').push({...db.rows('Achievement')[0],id:'extra-'+i,card_id:'',points:0});
  const result=await event(body());assert.equal(result.matched,206);assert.equal(db.rows('UserAchievement').length,206);
});

for(const [label,patch]of[
  ['missing event ID',{event_id:undefined}],['string count',{value:'2'}],['fraction',{value:0.5}],['zero',{value:0}],
  ['unsafe count',{value:Number.MAX_SAFE_INTEGER+1}],['expired',{occurred_at:new Date(Date.now()-86401000).toISOString()}],
  ['future',{occurred_at:new Date(Date.now()+600000).toISOString()}],
])test('invalid event '+label+' is rejected without writes',async()=>{
  seed();await event(body(patch),400);assert.equal(db.writes.length,0);
});

test('bad signatures, wrong methods, malformed JSON and missing players do not create reward records',async()=>{
  seed();await event(body(),401,{signature:'invalid'});await event(body(),405,{method:'GET'});
  await event({},400,{raw:'{bad json'});await event(body({user_id:'missing'}),404);
  assert.equal(db.writes.length,0);
});

test('ordinary players cannot write delivery journals or read signed integration receipts',async()=>{
  const client=db.entities({id:'a',role:'user'});
  await assert.rejects(client.RewardGrant.create({user_id:'a',grant_key:'forged'}),/Forbidden/);
  await assert.rejects(client.GameEventReceipt.create({game_id:'game',event_id:'forged'}),/Forbidden/);
  db.rows('GameEventReceipt').push({id:'private',game_id:'game',event_id:'event'});
  assert.equal((await client.GameEventReceipt.filter({})).length,0);
});

test('admin proof approval can retry a partial reward; normal users cannot approve it',async()=>{
  seed();db.rows('UserAchievement').push({id:'proof',user_id:'a',achievement_id:'earned',status:'pending_review',source:'proof'});
  const payload={action:'review_proof',user_achievement_id:'proof',approve:true};
  await request('achievementSystem',payload,403);
  db.failOnce((op)=>op.name==='AvatarProgression'&&op.operation==='updateMany'&&op.phase==='after'&&Boolean(op.data.$inc));
  await request('achievementSystem',payload,503,{actor:'admin'});
  await request('achievementSystem',payload,200,{actor:'admin'});
  await request('achievementSystem',payload,200,{actor:'admin'});
  assert.equal(db.rows('UserCard')[0].quantity,2);assert.equal(db.rows('AvatarProgression')[0].global_xp,135);
});

for(const price of [undefined,null,'', '0','bad',-1,NaN,Infinity])test('free claim rejects invalid price '+String(price),async()=>{
  seed();db.rows('Game')[0].price=price;
  await request('claimFreeGame',{game_id:'game'},409);
  assert.equal(db.writes.length,0);
});

test('paid or unavailable games cannot be claimed for free',async()=>{
  seed();db.rows('Game')[0].price=5;await request('claimFreeGame',{game_id:'game'},402);
  db.rows('Game')[0].status='draft';await request('claimFreeGame',{game_id:'game'},404);
  assert.equal(db.writes.length,0);
});

test('new free claims resume interrupted starter grants after entitlement creation',async()=>{
  seed();db.failOnce((op)=>op.name==='UserCard'&&op.operation==='create'&&op.phase==='after');
  const partial=await request('claimFreeGame',{game_id:'game'},202);
  assert.equal(partial.rewards_pending,true);assert.equal(db.rows('Entitlement').length,1);
  const completed=await request('claimFreeGame',{game_id:'game'});
  assert.equal(completed.rewards_pending,false);assert.equal(completed.already_owned,true);
  await request('claimFreeGame',{game_id:'game'});
  assert.equal(db.rows('UserCard').length,1);assert.equal(db.rows('UserCard')[0].quantity,1);
});

test('old game entitlements without delivery evidence do not grant starter cards again',async()=>{
  seed();db.rows('Entitlement').push({id:'legacy',user_id:'a',item_id:'game',item_type:'game',source:'free',revoked:false});
  const result=await request('claimFreeGame',{game_id:'game'});
  assert.equal(result.legacy_rewards_unverified,true);assert.equal(db.writes.length,0);
});

test('a free-claim retry keeps the original starter list after catalog changes',async()=>{
  seed();db.failOnce((op)=>op.name==='UserCard'&&op.operation==='create'&&op.phase==='before');
  await request('claimFreeGame',{game_id:'game'},202);
  db.rows('Game')[0].starter_card_ids=[];
  await request('claimFreeGame',{game_id:'game'});
  assert.equal(db.rows('UserCard').length,1);
});
