import test,{beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {webcrypto} from 'node:crypto';
import {buildSync} from 'esbuild';
import {makeRewardFixture} from './helpers/reward-fixture.mjs';

const db=makeRewardFixture(),svc=db.entities(),handlers={};
let offset=0,serial=0;
class Clock extends Date { constructor(...args){super(...(args.length?args:[Clock.now()]));}static now(){return Date.now()+offset;} }
const math=Object.create(Math);math.random=()=>0.99;
function bundle(path,extra={}){
 const module={exports:{}};
 vm.runInNewContext(buildSync({entryPoints:[path],bundle:true,write:false,platform:'node',format:'cjs',external:['npm:*']}).outputFiles[0].text,{
  module,exports:module.exports,Response,Request,Date:Clock,crypto:webcrypto,Math:math,console:{error(...args){if(process.env.AVATAR_TEST_DEBUG)console.error(...args);},warn(){}},...extra,
 });
 return module.exports;
}
const rules=bundle('base44/shared/combatStats.ts'),cards=bundle('base44/shared/cardStats.ts');
const profile=bundle('base44/shared/combatProfile.ts'),skills=bundle('base44/shared/combatSkills.ts');
const rewards=bundle('base44/shared/rewardEngine.ts');
for(const name of ['avatarStats','combatDamage','equipmentLoadout','skillBookLoadout','cardCollection','cardProgression','aiBattleMatchmaker']){
 bundle('base44/functions/'+name+'/entry.ts',{
  Deno:{serve:handler=>{handlers[name]=handler;}},
  require:id=>{assert.match(id,/^npm:@base44\/sdk/);return {createClientFromRequest:req=>({
   auth:{me:async()=>req.headers.get('actor')==='none'?null:{id:req.headers.get('actor')||'a',role:'user',level:50}},
   asServiceRole:{entities:svc},
  })};},
 });
}
const plain=v=>JSON.parse(JSON.stringify(v));
async function call(name,action,data={},status=200,actor='a',extra={}){
 const response=await handlers[name](new Request('https://test.local',{method:'POST',headers:{actor},body:JSON.stringify({action,data,...extra})}));
 const body=await response.json();assert.equal(response.status,status,JSON.stringify(body));return body;
}
const change=(state,stat='strength',points=1,extra={})=>({stat,points,expected_revision:state.revision,request_id:'allocate-'+(++serial),...extra});
async function avatar(level=1,patch={}){return svc.AvatarProgression.create({user_id:'a',global_level:level,global_xp:(level-1)*1000,...patch});}
function seedCard(id,type='ability',owner='a',patch={}){
 db.rows('TradingCard').push({id:'def-'+id,name:id,card_type:type,rarity:'Rare',status:'live',equip_slot:type==='equipment'?'weapon_main':'',stats:{attack:20,defense:8,magic:10,vitality:40,speed:10},animation_effect:{id:'getsuga_tensho'},...patch});
 const owned={id,user_id:owner,trading_card_id:'def-'+id,card_type:type,card_name:id,card_rarity:'Rare',quantity:1,trade_status:'available',acquisition_method:'unlocked',animation_effect:{id:'getsuga_tensho'}};
 db.rows('UserCard').push(owned);return owned;
}
function equipped(id,slot='weapon-1'){db.rows('Loadout').push({id:'gear',user_id:'a',name:'Equipment',loadout_type:'equipment',is_active:true,equipped_items:{[slot]:{user_card_id:id,stats:{attack:999999}}}});}
function hotbar(id){db.rows('Loadout').push({id:'book',user_id:'a',name:'Skills',loadout_type:'skills',is_active:true,skill_set_id:'skill-set-1',skill_set_order:0,skill_slots:{0:id}});}
const iso=(delta=0)=>new Clock(Clock.now()+delta).toISOString();
beforeEach(()=>{db.reset();offset=0;serial=0;db.rows('Avatar').push({id:'av-a',user_id:'a',gender:'male'},{id:'av-b',user_id:'b',gender:'male'});});

test('driver level never determines avatar level; new avatar has no fabricated allocations',async()=>{
 const s=await call('avatarStats','getState');
 assert.equal(s.combat.level,1);assert.equal(s.combat.max_hp,1000);assert.equal(s.available,0);assert.equal(s.combat.attack,100);
});
for(const level of [1,2,10,49]){
 test('exact automatic gains from level '+level+' to '+(level+1),()=>{
  const a=rules.deriveCombatStats({global_level:level}),b=rules.deriveCombatStats({global_level:level+1});
  assert.equal(b.max_hp-a.max_hp,100);assert.equal(b.defense-a.defense,20);assert.equal(b.dodge_rating-a.dodge_rating,1);
  assert.ok(Math.abs(b.attack_speed-a.attack_speed-.003)<1e-9);
 });
}
test('five points per avatar level are derived once; opening/reloading does not mint points',async()=>{
 await avatar(10);const a=await call('avatarStats','getState'),b=await call('avatarStats','getState');
 assert.equal(a.available,45);assert.equal(b.available,45);assert.equal(db.rows('AvatarProgression').length,1);
});
test('legacy investments and extra earned points migrate once without deleting the original stats',async()=>{
 const row=await avatar(2,{stats:{hp:120,strength:13,intelligence:12,will:14,tenacity:15},available_stat_points:7});
 const s=await call('avatarStats','getState'),again=await call('avatarStats','getState');
 assert.deepEqual(s.allocations,{strength:3,defense:5,vitality:2,agility:0,intelligence:2,wisdom:4});
 assert.equal(s.available,7);assert.equal(again.available,7);assert.equal((await svc.AvatarProgression.get(row.id)).stats.hp,120);
});
test('allocating points saves the server calculation and rejects request-ID reuse for a different change',async()=>{
 await avatar(2);const a=await call('avatarStats','getState'),request=change(a);
 const b=await call('avatarStats','allocate',request);
 assert.equal(b.combat.attack-a.combat.attack,7);assert.equal(b.available,4);
 const replay=await call('avatarStats','allocate',request);assert.equal(replay.available,4);
 await call('avatarStats','allocate',{...request,stat:'defense'},409);
});
test('parallel requests cannot spend the same five points twice',async()=>{
 await avatar(2);const s=await call('avatarStats','getState');
 const requests=[change(s,'strength',5),change(s,'defense',5)];
 const responses=await Promise.all(requests.map(data=>handlers.avatarStats(new Request('https://test.local',{method:'POST',body:JSON.stringify({action:'allocate',data})}))));
 assert.deepEqual(responses.map(r=>r.status).sort(),[200,409]);
 const after=await call('avatarStats','getState');assert.equal(after.spent,5);assert.equal(after.available,0);
});
test('lost acknowledgement can be retried without spending twice',async()=>{
 await avatar(2);const s=await call('avatarStats','getState'),request=change(s);
 db.failOnce(e=>e.name==='AvatarProgression'&&e.operation==='updateMany'&&e.phase==='after');
 await call('avatarStats','allocate',request,503);
 const recovered=await call('avatarStats','allocate',request);assert.equal(recovered.spent,1);assert.equal(recovered.available,4);
});
for(const points of [-1,0,0.5,'1',1e9]){
 test('invalid or unaffordable allocation '+points+' is rejected',async()=>{
  await avatar(2);const s=await call('avatarStats','getState');await call('avatarStats','allocate',change(s,'strength',points),400);
  assert.equal((await call('avatarStats','getState')).available,5);
 });
}
test('unknown stat and foreign user payload cannot edit another avatar',async()=>{
 await avatar(2);await svc.AvatarProgression.create({user_id:'b',global_level:50,global_xp:49000});
 const s=await call('avatarStats','getState');await call('avatarStats','allocate',change(s,'chi'),400);
 await call('avatarStats','allocate',change(s,'strength',1,{user_id:'b',stats:{hp:99999},global_level:50}));
 assert.equal((await profile.readAvatarProgression(svc,'b')).stat_schema_version,0);
 assert.equal((await call('avatarStats','getState')).combat.level,2);
});
test('non-admin clients cannot edit progression, combat encounters or another player state',async()=>{
 const row=await avatar(2),client=db.entities({id:'a',role:'user'});
 await assert.rejects(client.AvatarProgression.update(row.id,{global_level:50}),/Forbidden/);
 const fight=await svc.AvatarCombatEncounter.create({user_id:'b'});
 assert.equal((await client.AvatarCombatEncounter.filter({})).length,0);
 await assert.rejects(client.AvatarCombatEncounter.update(fight.id,{status:'won'}),/Forbidden/);
 await call('avatarStats','getState',{},401,'none');await call('combatDamage','start',{},401,'none');
});
test('defense cannot reduce a landed hit to zero and accuracy counters bounded dodge',()=>{
 const attacker=rules.deriveCombatStats({global_level:50}),tank=rules.deriveCombatStats({global_level:50,stat_schema_version:1,stat_allocations:{defense:100000,agility:100000}});
 const hit=rules.resolveCombatHit(attacker,tank,100,{dodge:1,crit:1});
 assert.equal(hit.damage,30);assert.equal(hit.mitigation,.7);assert.ok(tank.dodge_chance<=.35);
 assert.equal(rules.resolveCombatHit({...attacker,accuracy_rating:1e7},tank,100,{dodge:0,crit:1}).missed,false);
});
test('intelligence, wisdom, vitality and rate caps use explicit units',()=>{
 const base=rules.deriveCombatStats({stat_schema_version:1,stat_allocations:{intelligence:1,wisdom:1,vitality:1,defense:1}});
 assert.equal(base.cooldown_reduction,.001);assert.equal(base.ability_damage_bonus,.002);assert.equal(base.max_hp,1025);assert.equal(base.defense,8);
 const capped=rules.deriveCombatStats({stat_schema_version:1,stat_allocations:{intelligence:10000,wisdom:10000,agility:10000}},{crit_chance:1000,crit_damage:1000,armor_penetration:1000});
 assert.equal(capped.cooldown_reduction,.4);assert.equal(capped.ability_damage_bonus,1);assert.equal(capped.attack_speed,2);
 assert.equal(capped.crit_chance,.5);assert.equal(capped.crit_multiplier,2);assert.equal(capped.armor_penetration,.4);
});
test('verified XP gives multi-level gains and a reward replay does not grant more stats',async()=>{
 db.rows('Achievement').push({id:'ach',title:'Verified win',points:3500,rarity:'Common',category:'ability',reward:{}});
 await rewards.grantAchievement(svc,'a','ach');
 let s=await call('avatarStats','getState');assert.equal(s.combat.level,4);assert.equal(s.available,15);assert.equal(s.combat.max_hp,1300);
 await rewards.grantAchievement(svc,'a','ach');s=await call('avatarStats','getState');assert.equal(s.available,15);
});
test('equipment enhances the base, uses canonical ownership, and applies each item only once',async()=>{
 const owned=seedCard('sword','equipment');equipped('sword');
 db.rows('Loadout')[0].equipped_items['weapon-2']={user_card_id:'sword'};
 db.rows('CardProgression').push({id:'cp',user_id:'a',user_card_id:'sword',level:2,base_stats:{attack:20,defense:8},enhanced_stats:{attack:3},enchantments:[{modifiers:{attack:2}}]});
 const snapshot=await profile.loadCombatProfile(svc,'a');
 assert.equal(snapshot.equipment.length,1);assert.equal(snapshot.equipment_stats.attack,26.38);
 const equipment=await call('equipmentLoadout','getState');assert.equal(equipment.loadout.equipped_items['weapon-1'].stats.attack,26.38);
 owned.user_id='b';assert.equal((await profile.loadCombatProfile(svc,'a')).combat.attack,100);
});
test('non-active weapons, empty stacks and locked cards do not add passive power',async()=>{
 seedCard('backup','equipment');equipped('backup','weapon-2');assert.equal((await profile.loadCombatProfile(svc,'a')).combat.attack,100);
 db.rows('Loadout')[0].equipped_items={'weapon-1':{user_card_id:'backup'}};
 db.rows('UserCard')[0].quantity=0;assert.equal((await profile.loadCombatProfile(svc,'a')).combat.attack,100);
 db.rows('UserCard')[0].quantity=1;db.rows('UserCard')[0].trade_status='locked_in_trade';
 assert.equal((await profile.loadCombatProfile(svc,'a')).combat.attack,100);
});
test('transient card read failure cannot silently remove equipped gear',async()=>{
 seedCard('sword','equipment');equipped('sword');
 db.failOnce(e=>e.name==='UserCard'&&e.operation==='get');
 await call('equipmentLoadout','getState',{},503);
 assert.equal(db.rows('Loadout')[0].equipped_items['weapon-1'].user_card_id,'sword');
});
test('upgrades, Skill Book, collection and frozen battle skill use identical damage and cooldowns',async()=>{
 await avatar(10,{stat_schema_version:1,stat_allocations:{wisdom:10,intelligence:10}});
 seedCard('skill');hotbar('skill');
 db.rows('CardProgression').push({id:'cp',user_id:'a',user_card_id:'skill',card_name:'skill',level:3,stage:2,ascension:1,base_stats:{attack:20,magic:10,speed:10},enhanced_stats:{attack:8},enchantments:[{modifiers:{magic:4}}]});
 const a=await profile.loadCombatProfile(svc,'a'),frozen=await skills.loadCombatSkills(svc,'a','male',a.combat);
 const book=await call('skillBookLoadout','getState'),collection=await call('cardCollection','list');
 const b=book.skills.find(s=>s.user_card_id==='skill').progression.combat;
 const c=collection.cards.find(c=>c.user_card_id==='skill').progression.combat;
 assert.equal(b.effective_damage,frozen[0].base_damage);assert.equal(c.effective_damage,b.effective_damage);assert.equal(b.cooldown_ms,frozen[0].cooldown_ms);
 db.rows('CardProgression')[0].level=4;
 const upgraded=await skills.loadCombatSkills(svc,'a','male',a.combat);assert.ok(upgraded[0].base_damage>frozen[0].base_damage);
 assert.equal((await profile.loadCombatProfile(svc,'a')).combat.level,10);
});
test('practice combat snapshots build, rejects raw damage and duplicated actions, and never writes Model3D or XP',async()=>{
 await avatar(2);seedCard('skill');hotbar('skill');
 let s=await call('combatDamage','start',{expected_revision:0,request_id:'start-practice'});
 assert.equal(s.encounter.player.stats.level,2);
 const originalAttack=s.encounter.player.stats.attack;
 await svc.AvatarProgression.update(db.rows('AvatarProgression')[0].id,{global_level:50});
 const request={expected_revision:s.encounter.revision,request_id:'attack-practice',slot:0,damage:999999,attacker_level:999,user_id:'b'};
 const result=await call('combatDamage','attack',request);
 assert.equal(result.encounter.player.stats.attack,originalAttack);
 assert.ok(result.encounter.enemy.hp>0);
 const again=await call('combatDamage','attack',request);assert.equal(again.encounter.enemy.hp,result.encounter.enemy.hp);
 await call('combatDamage','attack',{...request,request_id:'next-practice',expected_revision:again.encounter.revision},409);
 assert.equal(db.writes.filter(w=>w.name==='Model3D').length,0);
 assert.equal((await svc.AvatarProgression.get(db.rows('AvatarProgression')[0].id)).global_xp,1000);
 await call('combatDamage','getState',{},400,'a',{reactor_id:'legacy'});
});
test('combat practice mutation from stale revision fails; another user cannot address an encounter',async()=>{
 const s=await call('combatDamage','start',{expected_revision:0,request_id:'start-practice'});
 const foreign=await call('combatDamage','getState',{encounter_id:s.encounter.id},200,'b');assert.equal(foreign.encounter,null);
 await call('combatDamage','attack',{slot:-1,expected_revision:0,request_id:'stale-practice'},409);
});
test('live PvP locks allocation using real membership and heartbeat',async()=>{
 await avatar(2);const s=await call('avatarStats','getState');
 db.rows('AIBattleMatch').push({id:'live',player_ids:['a','b'],status:'fighting'});
 db.rows('AIBattleQueueEntry').push({id:'q-a',user_id:'a',status:'matched',match_id:'live',last_seen_at:iso()});
 await call('avatarStats','allocate',change(s),409);
 assert.equal((await call('avatarStats','getState')).allocation_locked,true);
});
test('PvP basic attacks use frozen stats, defense and server rolls; forged damage is ignored',async()=>{
 const a=rules.deriveCombatStats({global_level:10,stat_schema_version:1,stat_allocations:{strength:20}});
 const b=rules.deriveCombatStats({global_level:10,stat_schema_version:1,stat_allocations:{defense:20}});
 db.rows('AIBattleMatch').push({id:'match',dashboard_channel:'test-arena',mode:'pvp',player_ids:['a','b'],host_id:'a',status:'fighting',
  players:[{id:'a',gender:'male',hp:a.max_hp,max_hp:a.max_hp,combat_stats:plain(a),skills:[]},{id:'b',gender:'male',hp:b.max_hp,max_hp:b.max_hp,combat_stats:plain(b),skills:[]}],
  atb:{a:{value:100,turn:true,at:iso()},b:{value:0,turn:false,at:iso()}},positions:{a:{x:0,z:-5},b:{x:0,z:5}},
  pending_hits:[],hit_log:[],disconnects:{},cooldowns:{},created_date:iso(),fight_starts_at:iso(-1000),fight_ends_at:iso(180000),
 });
 for(const id of ['a','b'])db.rows('AIBattleQueueEntry').push({id:'q-'+id,user_id:id,status:'matched',mode:'pvp',match_id:'match',last_seen_at:iso(),connected_at:iso(),client_session_id:'session-'+id});
 const result=await call('aiBattleMatchmaker','basic_attack',{match_id:'match',cast_id:'cast-a',damage:99999,attacker_level:999});
 const expected=rules.resolveCombatHit(a,b,a.attack,{dodge:.99,crit:.99,variance:1.049});
 assert.equal(result.cast.damage,expected.damage);
 assert.equal(result.match.players.find(p=>p.id==='b').hp,b.max_hp-expected.damage);
 assert.equal(result.match.atb.b.turn,true);
});
