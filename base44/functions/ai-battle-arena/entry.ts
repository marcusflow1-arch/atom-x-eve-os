import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// All encounter changes are immutable commands. Replaying the earliest valid
// command at each revision avoids lost updates across separate function workers.
// No browser can write encounters, HP, loadouts, rewards or command timestamps.
type Row = Record<string, any>;
const num = (v: any, d = 0) => Number.isFinite(Number(v)) ? Number(v) : d;
const copy = (v: any) => JSON.parse(JSON.stringify(v));
const fail = (message: string, status = 409) => { throw Object.assign(new Error(message), { status }); };
const MODEL = '/models/luna-hi3d/warrior.glb';
const FEMALE = 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/9c8e45258_Hi3D_Cel-ShadedGreekMythicArcherArtemis3DModel_allparts_20260915_100610.glb';
const APPEARANCE = ['name','gender','model_url','base_body_model_url','appearance_version','style_preset','skin_tone','eye_color','hair_color','skin_tint_enabled','eye_tint_enabled','hair_tint_enabled','complexion','facial_hair','facial_hair_color','tattoo_style','tattoo_placement','tattoo_color','tattoo_opacity','hair_style','face_shape','height_scale','body_proportions','material_colors','morph_targets','eyelash_style','hood_enabled','weapon_visible'];
const ROUTES = [
  { id:'patrol', title:'Rift patrol', type:'quest', description:'Scout the breach, defeat its guardian, and recover a field chest.', stages:['Rift scouts','Breach guardian'], hp:150, attack:18, xp:90, min:1, max:5 },
  { id:'vault', title:'The sunken archive', type:'dungeon', description:'Three linked rooms. Carry your health forward and regroup between encounters.', stages:['Archive sentinels','The gatekeeper','Vault sovereign'], hp:200, attack:24, xp:180, min:1, max:5 },
  { id:'colossus', title:'Rift colossus', type:'world_boss', description:'Rally your dashboard party against a shared boss with heavy, telegraphed attacks.', stages:['Rift colossus'], hp:550, attack:30, xp:240, min:2, max:5 },
  { id:'duel', title:'Dashboard duel', type:'pvp', description:'A friendly card duel. Both players accept before the first turn.', stages:[], hp:0, attack:0, xp:60, min:2, max:2 },
];
const routeFor = (id: string) => ROUTES.find(r => r.id === id);
const accessible = (room: Row, uid: string) => room.host_id === uid || (room.invited_ids || []).includes(uid);
const live = (p: Row) => p.status !== 'offline' && num(p.last_update) > Date.now() - 20000;
const label = (u: Row) => u.username || u.full_name || u.display_name || 'Player';

async function snapshot(svc: any, user: Row) {
  const [loadouts, cards, progress, avatars, levels] = await Promise.all([
    svc.Loadout.filter({user_id:user.id,loadout_type:'skills'},'-updated_date',20),
    svc.UserCard.filter({user_id:user.id},'-created_date',1000),
    svc.CardProgression.filter({user_id:user.id},'-updated_date',1000),
    svc.Avatar.filter({user_id:user.id},'-updated_date',1),
    svc.AvatarProgression.filter({user_id:user.id},'-updated_date',1),
  ]);
  const loadout = loadouts.find((r: Row) => r.is_active) || loadouts[0];
  const ids = [...new Set(Object.values(loadout?.skill_slots || {}).slice(0,4).map(String))];
  const rarity: Row = {Common:5,Uncommon:10,Rare:20,Epic:35,Legendary:55,Mythic:80,Unique:100};
  const deck = ids.map(id => cards.find((c: Row) => String(c.id) === id && c.trade_status !== 'locked_in_trade')).filter(Boolean).map((c: Row) => {
    const p = progress.find((r: Row) => r.user_card_id === c.id);
    const power = Math.max(15, Math.min(240,num(p?.power_score,12*num(p?.level,1)+(rarity[c.card_rarity]||5))));
    const effect = c.card_type === 'Equipment' ? 'shield' : c.card_type === 'Companion' ? 'heal' : 'strike';
    return {id:c.id,name:c.card_name,type:c.card_type,image:c.card_image||'',rarity:c.card_rarity||'Common',game_name:c.game_name||'',game_id:c.game_id||'',origin:c.acquisition_method||'unlocked',level:num(p?.level,1),effect,cost:effect==='strike'?2:1,value:Math.round(18+power*.2),cooldown:effect==='strike'?1:2};
  });
  const saved = avatars[0] || {};
  const appearance = Object.fromEntries(APPEARANCE.filter(k=>saved[k]!==undefined).map(k=>[k,saved[k]]));
  if (num(saved.appearance_version)<3) appearance.model_url = saved.gender === 'female' ? FEMALE : MODEL;
  const maxHp = Math.max(100,Math.min(400,num(levels[0]?.stats?.hp,100) + num(levels[0]?.global_level,1)*8));
  return {id:user.id,name:label(user),portrait:user.avatar_url||user.profile_image||'',appearance,hp:maxHp,max_hp:maxHp,ap:3,shield:0,cards:deck,cooldowns:{},damage:0,actions:0};
}
async function contacts(svc: any, user: Row) {
  const [memberships, friends, own] = await Promise.all([
    svc.PartyMember.filter({user_id:user.id}),svc.Friend.filter({user_id:user.id},'-created_date',100),
    svc.PlayerState.filter({player_id:user.id},'-last_update',3),
  ]);
  const channel = own.find(live)?.channel_id || 'dashboard_'+user.id;
  const present = await svc.PlayerState.filter({channel_id:channel});
  let party: Row[] = [];
  for (const membership of memberships) {
    const p = await svc.Party.get(membership.party_id).catch(()=>null);
    if (p && !['completed','disbanded'].includes(p.status)) { party = await svc.PartyMember.filter({party_id:p.id}); break; }
  }
  const map = new Map<string,Row>();
  friends.forEach((f: Row)=>map.set(f.friend_id,{id:f.friend_id,name:f.friend_name||'Friend',portrait:f.friend_avatar||'',kind:'friend'}));
  party.forEach((p: Row)=>map.set(p.user_id,{id:p.user_id,name:p.user_name||'Party member',portrait:p.user_avatar||'',kind:'party'}));
  present.filter(live).forEach((p: Row)=>map.set(p.player_id,{...map.get(p.player_id),id:p.player_id,name:p.display_name||'Player',portrait:p.avatar_url||'',in_dashboard:true,kind:map.get(p.player_id)?.kind||'visitor'}));
  map.delete(user.id);
  return [...map.values()];
}
async function worlds(svc: any, user: Row) {
  const cards = await svc.UserCard.filter({user_id:user.id},'-created_date',1000);
  const result: Row[] = [{id:'luna',title:'Luna frontier',image:'',cards:0,earned:0}];
  const seen = new Set();
  for (const c of cards) {
    const key = c.game_id || c.game_name;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    const related = cards.filter((x: Row)=>(x.game_id||x.game_name)===key);
    const game = c.game_id ? await svc.Game.get(c.game_id).catch(()=>null) : null;
    result.push({id:String(key),title:game?.title||c.game_name||'Game world',image:game?.banner_image||game?.cover_image||'',cards:related.length,earned:related.filter((x: Row)=>x.acquisition_method==='unlocked').length});
    if (result.length>=24) break;
  }
  return result;
}
function say(state: Row, text: string, kind = 'info', actor = '') {
  state.log = [...state.log,{id:state.revision+1,text,kind,actor}].slice(-30);
}
function enemyFor(room: Row, state: Row) {
  const route = routeFor(room.route_id)!;
  const count = state.players.length;
  const max = Math.round(route.hp*(1+.65*(count-1))*(1+.3*state.stage));
  return {name:route.stages[state.stage],hp:max,max_hp:max,attack:Math.round(route.attack*(1+.15*state.stage)),intent:'Strike',shield:0};
}
function nextRound(room: Row, state: Row, at: number) {
  state.round++;
  state.players.filter((p: Row)=>p.hp>0).forEach((p: Row)=>{p.ap=Math.min(5,p.ap+1);Object.keys(p.cooldowns).forEach(k=>p.cooldowns[k]=Math.max(0,p.cooldowns[k]-1));});
  state.turn=state.players.find((p: Row)=>p.hp>0)?.id;
  state.phase='turn'; state.deadline=at+45000;
}
function finishIfNeeded(room: Row, s: Row) {
  if (room.route_id==='duel') {
    const alive=s.players.filter((p: Row)=>p.hp>0);
    if(alive.length<2){s.status='victory';s.phase='result';s.winner_id=alive[0]?.id;s.deadline=0;say(s,(alive[0]?.name||'Player')+' won the duel.','victory');return true;}
  } else if(s.enemy.hp<=0) {
    if(s.stage+1<routeFor(room.route_id)!.stages.length){s.phase='camp';s.deadline=0;say(s,'Room cleared. Regroup before continuing.','victory');}
    else {s.status='victory';s.phase='result';s.deadline=0;say(s,'Expedition complete. Your field chest is ready.','victory');}
    return true;
  } else if(!s.players.some((p: Row)=>p.hp>0)){
    s.status='defeat';s.phase='result';s.deadline=0;say(s,'The expedition fell. Regroup and try another route.','defeat');return true;
  }
  return false;
}
function advance(room: Row, s: Row, actor: Row, at: number) {
  if(finishIfNeeded(room,s))return;
  if(room.route_id==='duel'){
    const next=s.players.find((p: Row)=>p.id!==actor.id);
    next.ap=Math.min(5,next.ap+1);
    Object.keys(next.cooldowns).forEach(k=>next.cooldowns[k]=Math.max(0,next.cooldowns[k]-1));
    s.turn=next.id;s.round++;s.deadline=at+45000;return;
  }
  const index=s.players.findIndex((p: Row)=>p.id===actor.id);
  const next=s.players.slice(index+1).find((p: Row)=>p.hp>0);
  if(next){s.turn=next.id;s.deadline=at+45000;return;}
  const target=s.players.filter((p: Row)=>p.hp>0).sort((a: Row,b: Row)=>a.hp-b.hp)[0];
  s.phase='defend';s.turn=target.id;s.defense_started_at=at;s.deadline=at+6000;
  s.enemy.intent=s.round%3===0?'Crushing blow':'Rift strike';
  say(s,s.enemy.name+' targets '+target.name+'. Brace, or time an evade.','telegraph');
}
// Pure reducer: only server-enriched command payloads reach this function.
function reduce(room: Row, previous: Row, event: Row) {
  const s=copy(previous), data=event.payload||{}, at=event.received_at;
  const actor=s.players.find((p: Row)=>p.id===event.actor_id);
  const cmd=event.command;
  if(cmd==='join'){
    if(s.status!=='lobby'||actor||!accessible(room,event.actor_id)||s.players.length>=routeFor(room.route_id)!.max)fail('This lobby cannot be joined.');
    if(!data.player?.cards?.length)fail('Equip a card in the Skill Book first.');
    s.players.push(data.player);say(s,data.player.name+' joined the expedition.');
  }else if(cmd==='decline'){
    if(s.status!=='lobby'||actor||!accessible(room,event.actor_id))fail('This invitation is no longer available.');
    s.declined=[...new Set([...s.declined,event.actor_id])];
  }else{
    if(!actor)fail('Join this encounter first.',403);
    if(cmd==='start'){
      if(room.host_id!==actor.id||s.status!=='lobby')fail('Only the host can start a waiting lobby.',403);
      if(s.players.length<routeFor(room.route_id)!.min)fail('Waiting for another player to accept.');
      s.status='active';s.phase='turn';s.turn=s.players[0].id;s.deadline=at+45000;
      if(room.route_id!=='duel')s.enemy=enemyFor(room,s);
      say(s,'Battle begins. Use cards or strike to recover action points.');
    }else if(cmd==='leave'){
      if(!['lobby','active'].includes(s.status))fail('This encounter has ended.');
      if(s.status==='lobby'&&room.host_id!==actor.id){s.players=s.players.filter((p: Row)=>p.id!==actor.id);s.declined.push(actor.id);}
      else if(room.route_id==='duel'&&s.status==='active'){actor.hp=0;finishIfNeeded(room,s);}
      else if(room.host_id===actor.id){s.status='abandoned';s.phase='result';s.deadline=0;}
      else {actor.hp=0;say(s,actor.name+' withdrew.');if(s.turn===actor.id)nextRound(room,s,at);}
    }else if(cmd==='claim'){
      if(s.status!=='victory'||(room.route_id==='duel'&&s.winner_id!==actor.id))fail('Win the encounter to open this chest.');
      if(!s.claimed.includes(actor.id)){s.claimed.push(actor.id);say(s,actor.name+' opened a field chest: '+routeFor(room.route_id)!.xp+' Expedition XP.','reward');}
    }else if(cmd==='continue'){
      if(s.status!=='active'||s.phase!=='camp'||actor.id!==room.host_id)fail('Only the host can continue after a cleared room.');
      s.stage++;s.players.forEach((p: Row)=>{p.hp=Math.min(p.max_hp,p.hp+Math.round(p.max_hp*.2));p.shield=0;p.ap=3;p.cooldowns={};});
      s.enemy=enemyFor(room,s);nextRound(room,s,at);say(s,'Entered '+s.enemy.name+'. Camp restored 20% health.');
    }else{
      if(s.status!=='active')fail('This encounter is not active.');
      if(cmd==='timeout'){
        if(!s.deadline||at<s.deadline)fail('The turn is still in progress.');
      }else if(s.turn!==actor.id)fail('Wait for your turn.');
      const current=s.players.find((p: Row)=>p.id===s.turn);
      if(s.phase==='defend'){
        if(!['brace','evade','parry','timeout'].includes(cmd))fail('Respond to the incoming attack first.');
        const elapsed=at-s.defense_started_at;
        const success=cmd==='evade'?elapsed>=2600&&elapsed<=4600:cmd==='parry'?elapsed>=3400&&elapsed<=4100:false;
        const scale=success?0:cmd==='brace'?.4:1;
        const raw=Math.round(s.enemy.attack*(s.round%3===0?1.6:1)*scale);
        const hit=Math.max(0,raw-current.shield);current.shield=Math.max(0,current.shield-raw);current.hp=Math.max(0,current.hp-hit);
        if(success&&cmd==='parry'){s.enemy.hp=Math.max(0,s.enemy.hp-20);current.damage+=20;current.ap=Math.min(5,current.ap+1);}
        say(s,success?current.name+' '+(cmd==='parry'?'parried and countered.':'evaded the strike.'):current.name+' took '+hit+' damage'+(cmd==='brace'?' while bracing.':'.'),success?'defense':'hit',current.id);
        if(!finishIfNeeded(room,s))nextRound(room,s,at);
      }else if(s.phase==='turn'){
        let target=room.route_id==='duel'?s.players.find((p: Row)=>p.id!==current.id):s.enemy;
        if(cmd==='guard'||cmd==='timeout'){current.shield+=18;current.ap=Math.min(5,current.ap+1);say(s,current.name+' guarded: +18 shield, +1 AP.','defense',current.id);}
        else if(cmd==='strike'){const hit=Math.max(0,16-target.shield);target.shield=Math.max(0,target.shield-16);target.hp=Math.max(0,target.hp-hit);current.damage+=hit;current.ap=Math.min(5,current.ap+1);say(s,current.name+' struck for '+hit+' damage.','hit',current.id);}
        else if(cmd==='card'){
          const card=current.cards.find((c: Row)=>c.id===data.card_id);
          if(!card)fail('That card is not in your locked loadout.',403);
          if(current.ap<card.cost||current.cooldowns[card.id]>0)fail('This card is not ready.');
          current.ap-=card.cost;current.cooldowns[card.id]=card.cooldown+1;
          const resonance=card.game_id===room.world.id||card.game_name===room.world.title;
          const value=card.value+(resonance?5:0);
          if(card.effect==='heal'){const before=current.hp;current.hp=Math.min(current.max_hp,current.hp+value);say(s,current.name+' used '+card.name+': restored '+(current.hp-before)+' HP.','heal',current.id);}
          else if(card.effect==='shield'){current.shield+=value;say(s,current.name+' used '+card.name+': +'+value+' shield.','defense',current.id);}
          else {const hit=Math.max(0,value-target.shield);target.shield=Math.max(0,target.shield-value);target.hp=Math.max(0,target.hp-hit);current.damage+=hit;say(s,current.name+' used '+card.name+': '+hit+' damage'+(resonance?' · world resonance.':'.'),'hit',current.id);}
        }else fail('Choose a card, strike, or guard.',400);
        current.actions++;advance(room,s,current,at);
      }else fail('This action is unavailable.');
    }
  }
  s.revision++;
  return s;
}
function initial(room: Row) {
  return {revision:0,status:'lobby',phase:'lobby',players:[copy(room.host_snapshot)],round:1,stage:0,turn:room.host_id,deadline:0,enemy:null,claimed:[],declined:[],log:[]};
}
async function replay(svc: any, room: Row) {
  const events = await svc.AIBattleTurn.filter({encounter_id:room.id},'created_date',1000);
  events.sort((a: Row,b: Row)=>String(a.created_date).localeCompare(String(b.created_date))||String(a.id).localeCompare(String(b.id)));
  let state=initial(room);const applied=new Set<string>();
  for(const e of events){
    if(applied.has(e.actor_id+':'+e.request_id)||num(e.expected_revision,-1)!==state.revision)continue;
    try {state=reduce(room,state,e);applied.add(e.actor_id+':'+e.request_id);}catch{/* competing/stale command has no effect */}
  }
  return {state,events,applied};
}
function publicRoom(room: Row, state: Row) {
  return {id:room.id,host_id:room.host_id,host_name:room.host_name,world:room.world,route:routeFor(room.route_id),invited_ids:room.invited_ids,created_date:room.created_date,...state};
}
async function roomFor(svc: any, id: string, user: Row) {
  const room=await svc.AIBattleEncounter.get(id).catch(()=>null);
  if(!room||!accessible(room,user.id))fail('Encounter not found.',404);
  return room;
}
async function applyClaimReward(svc: any, user: Row, room: Row, state: Row, requestId: string) {
  const route = routeFor(room.route_id);
  if (!route) return null;
  const existing = await svc.AIBattleRewardClaim.filter({encounter_id:room.id,user_id:user.id},'-created_date',10);
  let claim = existing.find((row: Row)=>row.status==='applied') || existing[0] || null;
  const avatarXp = Math.max(1,num(route.xp));
  const cardXp = Math.max(10,Math.round(avatarXp*.28));
  const agp = Math.max(10,Math.round(avatarXp*.5));
  if (claim?.status === 'applied') return claim;
  if (!claim) {
    claim = await svc.AIBattleRewardClaim.create({
      encounter_id:room.id,user_id:user.id,request_id:requestId,route_id:room.route_id,
      avatar_xp:avatarXp,card_xp_each:cardXp,agp,status:'applying'
    });
  }

  const player = state.players.find((p: Row)=>p.id===user.id);
  if (!player) return claim;

  const avatarRows = await svc.AvatarProgression.filter({user_id:user.id},'-updated_date',1);
  const avatar = avatarRows[0];
  if (avatar) {
    const nextXp = num(avatar.global_xp) + avatarXp;
    const nextLevel = Math.max(num(avatar.global_level,1),1+Math.floor(nextXp/1000));
    await svc.AvatarProgression.update(avatar.id,{global_xp:nextXp,global_level:nextLevel});
  } else {
    await svc.AvatarProgression.create({user_id:user.id,global_xp:avatarXp,global_level:1+Math.floor(avatarXp/1000)});
  }

  for (const card of player.cards || []) {
    const rows = await svc.CardProgression.filter({user_card_id:card.id},'-updated_date',1);
    let progress = rows[0];
    if (!progress) {
      progress = await svc.CardProgression.create({
        user_id:user.id,user_card_id:card.id,card_name:card.name||'Card',game_id:card.game_id||'',game_name:card.game_name||'',
        level:num(card.level,1),xp:0,xp_to_next:120,max_level:10,skill_points:1,power_score:num(card.value,15),
        last_action:'ai_battle_initialized',last_action_at:new Date().toISOString(),revision:1
      });
    }
    let xp=num(progress.xp)+cardXp,level=num(progress.level,1),xpToNext=Math.max(1,num(progress.xp_to_next,120)),skillPoints=num(progress.skill_points);
    while(xp>=xpToNext&&level<num(progress.max_level,10)){xp-=xpToNext;level++;skillPoints++;xpToNext=Math.max(120,Math.round(xpToNext*1.22));}
    await svc.CardProgression.update(progress.id,{xp,level,xp_to_next:xpToNext,skill_points:skillPoints,last_action:'ai_battle_reward',last_action_at:new Date().toISOString(),revision:num(progress.revision)+1});
  }

  await svc.User.update(user.id,{avatar_gamer_points:num(user.avatar_gamer_points)+agp});
  claim = await svc.AIBattleRewardClaim.update(claim.id,{status:'applied',applied_at:new Date().toISOString(),avatar_xp:avatarXp,card_xp_each:cardXp,agp});
  return claim;
}

async function requireDashboard(svc: any, hostId: string, ids: string[]) {
  const players=await svc.PlayerState.filter({channel_id:'dashboard_'+hostId});
  if(ids.some(id=>!players.some((p: Row)=>p.player_id===id&&live(p))))fail('Everyone must join the host’s Luna dashboard before battle begins.');
}
Deno.serve(async req=>{
  try{
    const client=createClientFromRequest(req),user=await client.auth.me();
    if(!user)return Response.json({error:'Sign in to enter AI Battle.'},{status:401});
    const svc=client.asServiceRole.entities;
    const {action='hub',data={}}=await req.json();
    if(action==='hub'){
      const [availableWorlds,peers,player,rooms]=await Promise.all([
        worlds(svc,user),contacts(svc,user),snapshot(svc,user),
        svc.AIBattleEncounter.filter({$or:[{host_id:user.id},{invited_ids:{$in:[user.id]}}]},'-created_date',30),
      ]);
      const encounters=await Promise.all(rooms.filter((r: Row)=>accessible(r,user.id)).map(async(r: Row)=>publicRoom(r,(await replay(svc,r)).state)));
      return Response.json({worlds:availableWorlds,contacts:peers,player,routes:ROUTES,encounters,server_time:Date.now()});
    }
    if(action==='create'){
      const route=routeFor(String(data.route_id));
      if(!route)fail('Choose an expedition route.',400);
      const world=(await worlds(svc,user)).find(w=>w.id===data.world_id);
      if(!world)fail('This world is not in your game collection.',403);
      const peers=await contacts(svc,user);
      const ids=[...new Set((Array.isArray(data.invited_ids)?data.invited_ids:[]).map(String))];
      if(ids.length>route.max-1||ids.some(id=>!peers.some(p=>p.id===id)))fail('Invite friends, party members, or players on your dashboard.',403);
      if(ids.length+1<route.min)fail('This route requires another player.');
      const player=await snapshot(svc,user);
      if(!player.cards.length)fail('Equip at least one card in the Skill Book before starting.');
      const recent=await svc.AIBattleEncounter.filter({host_id:user.id},'-created_date',10);
      const requestId=String(data.request_id||'').slice(0,100);
      if(!requestId)fail('A request identifier is required.',400);
      const duplicate=recent.find((r: Row)=>r.request_id===requestId);
      if(duplicate)return Response.json({encounter:publicRoom(duplicate,(await replay(svc,duplicate)).state),server_time:Date.now()});
      for(const r of recent){const s=(await replay(svc,r)).state;if(['active','lobby'].includes(s.status))fail('Finish or leave your current expedition first.');}
      const room=await svc.AIBattleEncounter.create({host_id:user.id,host_name:label(user),host_snapshot:player,invited_ids:ids,world,route_id:route.id,request_id:requestId});
      return Response.json({encounter:publicRoom(room,initial(room)),server_time:Date.now()});
    }
    const room=await roomFor(svc,String(data.encounter_id||''),user);
    const {state,events,applied}=await replay(svc,room);
    if(action==='state')return Response.json({encounter:publicRoom(room,state),server_time:Date.now()});
    if(action!=='command')fail('Unknown battle action.',400);
    const requestId=String(data.request_id||'').slice(0,100);
    if(!requestId)fail('A request identifier is required.',400);
    if(applied.has(user.id+':'+requestId)){
      const prior=events.find((e: Row)=>e.actor_id===user.id&&e.request_id===requestId);
      if(prior?.command==='claim'&&state.claimed.includes(user.id))await applyClaimReward(svc,user,room,state,requestId);
      return Response.json({encounter:publicRoom(room,state),server_time:Date.now()});
    }
    if(events.length>=900)fail('This encounter reached its action limit.');
    if(num(data.expected_revision,-1)!==state.revision)return Response.json({error:'The battle moved forward. Your view has refreshed; choose again.',encounter:publicRoom(room,state),server_time:Date.now()},{status:409});
    const command=String(data.command||'');
    if(!['join','decline','start','leave','claim','continue','timeout','brace','evade','parry','guard','strike','card'].includes(command))fail('Unknown combat command.',400);
    const payload: Row={card_id:String(data.card_id||'')};
    if(command==='join'){
      if(state.declined.includes(user.id))fail('This invitation was declined.');
      payload.player=await snapshot(svc,user);
    }
    if(command==='start'&&state.players.length>1)await requireDashboard(svc,room.host_id,state.players.map((p: Row)=>p.id));
    const event={encounter_id:room.id,actor_id:user.id,request_id:requestId,expected_revision:state.revision,command,payload,received_at:Date.now()};
    reduce(room,state,event); // validate before persisting; HP/amounts never come from request
    await svc.AIBattleTurn.create(event);
    const next=await replay(svc,room);
    let reward=null;
    if(command==='claim'&&next.applied.has(user.id+':'+requestId)&&next.state.claimed.includes(user.id)){
      reward=await applyClaimReward(svc,user,room,next.state,requestId);
    }
    return Response.json({encounter:publicRoom(room,next.state),reward,server_time:Date.now()});
  }catch(error){return Response.json({error:error instanceof Error?error.message:'Battle request failed.'},{status:num(error.status,500)});}
});
