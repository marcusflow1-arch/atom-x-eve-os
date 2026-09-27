import {createClientFromRequest} from 'npm:@base44/sdk@0.8.51';
import {deriveCombatStats,resolveCombatHit} from '../../shared/combatStats.ts';
import {loadCombatProfile} from '../../shared/combatProfile.ts';
import {loadCombatSkills} from '../../shared/combatSkills.ts';
import {conditionalUpdate,ensureKeyedRecord,findKeyedRecord} from '../../shared/rewardJournal.ts';
const json=(body:any,status=200)=>Response.json(body,{status});
const roll=()=>({dodge:Math.random(),crit:Math.random(),variance:0.95+Math.random()*0.10});
const publicEncounter=(row:any)=>row?Object.fromEntries(Object.entries(row).filter(([key])=>!['requests','created_by','created_by_id'].includes(key))):null;
// This endpoint owns player encounter state. Never write HP/XP into Model3D assets.
// Practice deliberately has no reward path; production PvE rewards require verified objectives.
Deno.serve(async(req)=>{
 try{
  const client=createClientFromRequest(req),user=await client.auth.me();
  if(!user)return json({error:'Unauthorized'},401);
  const {action='getState',data={},reactor_id}=await req.json().catch(()=>({}));
  if(reactor_id)return json({error:'Legacy model-asset damage is retired. Use a player encounter.'},400);
  if(!['getState','start','attack','abandon'].includes(action))return json({error:'Unknown combat action'},400);
  const svc=client.asServiceRole.entities;
  let encounter=await findKeyedRecord(svc.AvatarCombatEncounter,{user_id:user.id});
  const respond=()=>json({success:true,encounter:publicEncounter(encounter),server_time:Date.now()});
  if(action==='getState')return respond();
  const requestId=String(data.request_id||'');
  if(!/^[a-zA-Z0-9:_-]{8,100}$/.test(requestId))return json({error:'A valid request ID is required'},400);
  if(!encounter && action==='start')encounter=await ensureKeyedRecord(svc.AvatarCombatEncounter,{user_id:user.id});
  if(!encounter)return json({error:'Start a practice encounter first'},409);
  const signature=JSON.stringify([action,data.slot??null]);
  const previous=(encounter.requests||[]).find((r:any)=>r.id===requestId);
  if(previous)return previous.signature===signature?respond():json({error:'Request ID was already used'},409);
  if(action==='start'&&encounter.status==='active')return respond();
  if(data.expected_revision!==Number(encounter.revision||0))return json({error:'Encounter changed. Refresh before acting again.'},409);
  const now=Date.now();let patch:any={};
  if(action==='start'){
    const profile=await loadCombatProfile(svc,user.id);
    const avatars=await svc.Avatar.filter({user_id:user.id},'-updated_date',1);
    const gender=avatars[0]?.gender==='female'?'female':'male';
    const skills=await loadCombatSkills(svc,user.id,gender,profile.combat);
    const n=(profile.combat.level-1)*5;
    const enemy=deriveCombatStats({global_level:profile.combat.level,stat_schema_version:1,stat_allocations:{strength:Math.floor(n*.4),defense:Math.floor(n*.4),vitality:Math.floor(n*.2)}});
    patch={status:'active',player:{hp:profile.combat.max_hp,stats:profile.combat},enemy:{hp:enemy.max_hp,stats:enemy},skills,cooldowns:{},next_action_at:0,log:[],started_at:new Date(now).toISOString()};
  }else{
    if(encounter.status!=='active')return json({error:'This encounter has ended'},409);
    if(action==='abandon')patch={status:'abandoned'};
    else{
      if(now<Number(encounter.next_action_at||0))return json({error:'Your avatar is recovering. Wait before the next action.'},409);
      const slot=data.slot;
      if(!Number.isInteger(slot)||slot < -1||slot > 3)return json({error:'Invalid attack slot'},400);
      const skill=slot>=0?(encounter.skills||[]).find((s:any)=>s.slot===slot):null;
      if(slot>=0&&!skill)return json({error:'That skill is not in your frozen Skill Book'},409);
      if(skill&&now<Number(encounter.cooldowns?.[slot]||0))return json({error:'That skill is on cooldown'},409);
      const player={...encounter.player},enemy={...encounter.enemy};
      const hit=resolveCombatHit(player.stats,enemy.stats,skill?skill.base_damage:player.stats.attack,roll());
      enemy.hp=Math.max(0,enemy.hp-hit.damage);
      const log=[...(encounter.log||[]),{actor:'player',...hit,slot}];
      if(enemy.hp>0){
        const counter=resolveCombatHit(enemy.stats,player.stats,enemy.stats.attack*0.70,roll());
        player.hp=Math.max(0,player.hp-counter.damage);log.push({actor:'enemy',...counter,slot:-1});
      }
      patch={player,enemy,status:enemy.hp<=0?'won':player.hp<=0?'lost':'active',log:log.slice(-20),
        cooldowns:{...(encounter.cooldowns||{}),...(skill?{[slot]:now+skill.cooldown_ms}:{})},
        next_action_at:now+Math.max(400,Math.round(1000/player.stats.attack_speed))};
    }
  }
  const accepted=await conditionalUpdate(svc.AvatarCombatEncounter,{id:encounter.id,user_id:user.id,revision:Number(encounter.revision||0)},{
    $set:{...patch,requests:[...(encounter.requests||[]).slice(-31),{id:requestId,signature}]},$inc:{revision:1}
  });
  if(!accepted)return json({error:'Another action arrived first. Refresh the encounter.'},409);
  encounter=await svc.AvatarCombatEncounter.get(encounter.id);return respond();
 }catch(error:any){console.error('combatDamage',error);return json({error:error?.message||'Combat unavailable'},Number(error?.status||500));}
});
