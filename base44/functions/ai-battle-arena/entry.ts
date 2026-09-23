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
  { id:'patrol', title:'Rift patrol', type:'quest', description:'Scout the breach, defeat its guardian, and recover a field chest.', objective:'Clear the breach and secure its field chest.', stages:['Rift scouts','Breach guardian'], hp:150, attack:18, xp:90, min:1, max:5 },
  { id:'vault', title:'The sunken archive', type:'dungeon', description:'Three linked rooms. Carry your health forward and regroup between encounters.', objective:'Survive all archive rooms and defeat the Vault Sovereign.', stages:['Archive sentinels','The gatekeeper','Vault sovereign'], hp:200, attack:24, xp:180, min:1, max:5 },
  { id:'colossus', title:'Rift colossus', type:'world_boss', description:'Rally your dashboard party against a shared boss with heavy, telegraphed attacks.', objective:'Break and defeat the Rift Colossus with your dashboard party.', stages:['Rift colossus'], hp:550, attack:30, xp:240, min:2, max:5 },
  { id:'duel', title:'Dashboard duel', type:'pvp', description:'A friendly card duel. Both players accept before the first turn.', objective:'Reduce the opposing avatar to 0 HP using your locked four-card loadout.', stages:[], hp:0, attack:0, xp:60, min:2, max:2 },
];
const routeFor = (id: string) => ROUTES.find(r => r.id === id);
const accessible = (room: Row, uid: string) => room.host_id === uid || (room.invited_ids || []).includes(uid);
const live = (p: Row) => p.status !== 'offline' && num(p.last_update) > Date.now() - 20000;
const label = (u: Row) => u.username || u.full_name || u.display_name || 'Player';

const normalize = (value: any) => String(value || '').trim().toLowerCase();
const textBlob = (...parts: any[]) => parts.flat(Infinity).filter(Boolean).map(String).join(' ').toLowerCase();

function inferElement(progress: Row | undefined, achievement: Row | undefined) {
  const enchantments = Array.isArray(progress?.enchantments) ? progress.enchantments : [];
  const explicit = enchantments.find((item: Row) => item?.element)?.element;
  if (explicit) return String(explicit).toLowerCase();
  const blob = textBlob(achievement?.reward?.abilities, achievement?.reward?.description, achievement?.description);
  for (const element of ['fire','ice','frost','lightning','shock','arc','void','holy','shadow','poison','earth','wind','water']) {
    if (blob.includes(element)) return element === 'frost' ? 'ice' : element === 'shock' ? 'lightning' : element;
  }
  return '';
}

function inferCombatIdentity(card: Row, progress: Row | undefined, achievement: Row | undefined, power: number) {
  const blob = textBlob(
    card.card_name,
    achievement?.reward?.type,
    achievement?.reward?.description,
    achievement?.reward?.abilities,
    achievement?.description,
    progress?.active_perks,
    progress?.enhanced_stats
  );

  let effect = card.card_type === 'Equipment' ? 'shield' : card.card_type === 'Companion' ? 'heal' : 'strike';
  if (/\b(heal|restore|regenerat|revive|mend|lifesteal|life steal)\b/.test(blob)) effect = 'heal';
  else if (/\b(shield|barrier|guard|armor|ward|mitigat)\b/.test(blob)) effect = 'shield';

  const level = Math.max(1, num(progress?.level, 1));
  const stage = Math.max(1, num(progress?.stage, 1));
  const ascension = Math.max(0, num(progress?.ascension, 0));
  const overEnchant = Math.max(0, num(progress?.over_enchant_rank, 0));
  const stats = { ...(progress?.base_stats || {}), ...(progress?.enhanced_stats || {}) };
  const statTotal = Object.values(stats).reduce((sum: number, value: any) => sum + Math.max(0, num(value)), 0);
  const perkCount = Array.isArray(progress?.active_perks) ? progress.active_perks.length : 0;

  const base = Math.round(16 + power * .19 + level * .8 + (stage - 1) * 3 + ascension * 4 + overEnchant * 2 + Math.min(24, statTotal * .04));
  const value = effect === 'heal' ? Math.round(base * .82) : effect === 'shield' ? Math.round(base * .92) : base;
  const stagger = Math.round(18 + level * 1.7 + ascension * 4 + perkCount * 2 + (/\b(stagger|break|stun|knock|impact)\b/.test(blob) ? 20 : 0));
  const criticalBonus = /\b(crit|critical|execute|weak point|headshot)\b/.test(blob) ? 12 : 0;
  const cost = Math.max(1, Math.min(3, effect === 'strike' && power >= 160 ? 3 : effect === 'strike' ? 2 : 1));
  const cooldown = Math.max(1, Math.min(4, effect === 'heal' ? 3 : effect === 'shield' ? 2 : power >= 180 ? 3 : 1));

  return {
    effect,
    value,
    stagger,
    critical_bonus_pct: criticalBonus,
    cost,
    cooldown,
    element: inferElement(progress, achievement),
    abilities: Array.isArray(achievement?.reward?.abilities) ? achievement.reward.abilities.slice(0, 6) : [],
    active_perks: Array.isArray(progress?.active_perks) ? progress.active_perks.slice(0, 6) : [],
    stage,
    ascension,
    over_enchant_rank: overEnchant,
    description: achievement?.reward?.description || achievement?.description || '',
  };
}

async function snapshot(svc: any, user: Row) {
  const [loadouts, cards, progress, avatars, levels, achievements] = await Promise.all([
    svc.Loadout.filter({user_id:user.id,loadout_type:'skills'},'-updated_date',20),
    svc.UserCard.filter({user_id:user.id},'-created_date',1000),
    svc.CardProgression.filter({user_id:user.id},'-updated_date',1000),
    svc.Avatar.filter({user_id:user.id},'-updated_date',1),
    svc.AvatarProgression.filter({user_id:user.id},'-updated_date',1),
    svc.Achievement.list('-created_date',1500).catch(()=>[]),
  ]);
  const loadout = loadouts.find((r: Row) => r.is_active) || loadouts[0];
  const ids = [...new Set(Object.values(loadout?.skill_slots || {}).slice(0,4).map(String))];
  const rarity: Row = {Common:5,Uncommon:10,Rare:20,Epic:35,Legendary:55,Mythic:80,Unique:100};
  const deck = ids.map(id => cards.find((c: Row) => String(c.id) === id && c.trade_status !== 'locked_in_trade')).filter(Boolean).map((c: Row) => {
    const p = progress.find((r: Row) => r.user_card_id === c.id);
    const power = Math.max(15, Math.min(300,num(p?.power_score,12*num(p?.level,1)+(rarity[c.card_rarity]||5))));
    const achievement = achievements.find((a: Row) => {
      if (p?.achievement_id && String(a.id) === String(p.achievement_id)) return true;
      const rewardName = normalize(a?.reward?.name || a?.title);
      const sameName = rewardName && rewardName === normalize(c.card_name);
      const sameGame = !a?.game || !c.game_name || normalize(a.game) === normalize(c.game_name);
      return sameName && sameGame;
    });
    const combat = inferCombatIdentity(c,p,achievement,power);
    return {
      id:c.id,name:c.card_name,type:c.card_type,image:c.card_image||'',rarity:c.card_rarity||'Common',
      game_name:c.game_name||'',game_id:c.game_id||'',origin:c.acquisition_method||'unlocked',
      level:num(p?.level,1),power,...combat
    };
  });
  const saved = avatars[0] || {};
  const appearance = Object.fromEntries(APPEARANCE.filter(k=>saved[k]!==undefined).map(k=>[k,saved[k]]));
  if (num(saved.appearance_version)<3) appearance.model_url = saved.gender === 'female' ? FEMALE : MODEL;
  const maxHp = Math.max(100,Math.min(400,num(levels[0]?.stats?.hp,100) + num(levels[0]?.global_level,1)*8));
  return {id:user.id,name:label(user),portrait:user.avatar_url||user.profile_image||'',appearance,hp:maxHp,max_hp:maxHp,ap:3,shield:0,stagger:0,max_stagger:100,cards:deck,cooldowns:{},damage:0,actions:0,jawan:{id:loadout?.jawan_id||'jawan-1',name:loadout?.jawan_name||loadout?.name||'Jawan I',role:loadout?.jawan_role||'Balanced',loadout_id:loadout?.id||''}};
}
function demoBotSnapshot(player: Row) {
  const maxHp = Math.max(120, Math.round(num(player?.max_hp, 140) * .92));
  const botCards = [
    { id:'bot-pulse-slash', name:'Pulse Slash', type:'Ability', image:'', rarity:'Rare', game_name:'Luna frontier', game_id:'luna', origin:'demo', level:12, power:86, effect:'strike', value:30, stagger:34, critical_bonus_pct:8, cost:2, cooldown:1, element:'arc', abilities:[], active_perks:[], stage:2, ascension:0, over_enchant_rank:0, description:'A fast arc slash used by the Luna sparring AI.' },
    { id:'bot-guard-matrix', name:'Guard Matrix', type:'Equipment', image:'', rarity:'Epic', game_name:'Luna frontier', game_id:'luna', origin:'demo', level:10, power:78, effect:'shield', value:26, stagger:12, critical_bonus_pct:0, cost:1, cooldown:2, element:'', abilities:[], active_perks:[], stage:2, ascension:0, over_enchant_rank:0, description:'Projects a short defensive barrier.' },
    { id:'bot-rift-burst', name:'Rift Burst', type:'Ability', image:'', rarity:'Epic', game_name:'Luna frontier', game_id:'luna', origin:'demo', level:14, power:104, effect:'strike', value:38, stagger:46, critical_bonus_pct:10, cost:3, cooldown:3, element:'void', abilities:[], active_perks:[], stage:3, ascension:0, over_enchant_rank:0, description:'A heavier void burst built to pressure the break gauge.' },
    { id:'bot-repair-cycle', name:'Repair Cycle', type:'Companion', image:'', rarity:'Rare', game_name:'Luna frontier', game_id:'luna', origin:'demo', level:9, power:70, effect:'heal', value:22, stagger:0, critical_bonus_pct:0, cost:1, cooldown:3, element:'', abilities:[], active_perks:[], stage:1, ascension:0, over_enchant_rank:0, description:'Restores a small amount of combat integrity.' },
  ];
  return {
    id:'luna-demo-bot',
    name:'Luna Sparring Bot',
    portrait:'',
    appearance:{ name:'Luna Sparring Bot', gender:'male', model_url:MODEL, appearance_version:3, style_preset:'heroic_fantasy', skin_tone:'#8e9eaa', eye_color:'#67e8f9', hair_color:'#111827' },
    hp:maxHp,max_hp:maxHp,ap:3,shield:0,stagger:0,max_stagger:100,
    cards:botCards,cooldowns:{},damage:0,actions:0,
    jawan:{id:'demo-bot',name:'Combat Bot',role:'Balanced',loadout_id:'demo-bot'}
  };
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
function staggerHit(state: Row, target: Row, amount: number, actorName: string) {
  if (!target) return 0;
  const max = Math.max(1,num(target.max_stagger,100));
  target.stagger = Math.min(max,num(target.stagger)+Math.max(0,amount));
  if (target.stagger < max) return 0;
  target.stagger = 0;
  target.shield = 0;
  const bonus = Math.max(18,Math.round(max*.22));
  target.hp = Math.max(0,num(target.hp)-bonus);
  say(state,(target.name||'Target')+' was broken by '+actorName+' for '+bonus+' bonus damage.','break');
  return bonus;
}
function enemyFor(room: Row, state: Row) {
  const route = routeFor(room.route_id)!;
  const count = state.players.length;
  const max = Math.round(route.hp*(1+.65*(count-1))*(1+.3*state.stage));
  const maxStagger = room.route_id==='colossus' ? 180 : 100 + state.stage*20;
  return {name:route.stages[state.stage],hp:max,max_hp:max,attack:Math.round(route.attack*(1+.15*state.stage)),intent:'Strike',shield:0,stagger:0,max_stagger:maxStagger};
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
      s.stage++;s.players.forEach((p: Row)=>{p.hp=Math.min(p.max_hp,p.hp+Math.round(p.max_hp*.2));p.shield=0;p.stagger=0;p.ap=3;p.cooldowns={};});
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
        if(success&&cmd==='parry'){s.enemy.hp=Math.max(0,s.enemy.hp-20);const bonus=staggerHit(s,s.enemy,38,current.name);current.damage+=20+bonus;current.ap=Math.min(5,current.ap+1);}
        say(s,success?current.name+' '+(cmd==='parry'?'parried and countered.':'evaded the strike.'):current.name+' took '+hit+' damage'+(cmd==='brace'?' while bracing.':'.'),success?'defense':'hit',current.id);
        if(!finishIfNeeded(room,s))nextRound(room,s,at);
      }else if(s.phase==='turn'){
        let target=room.route_id==='duel'?s.players.find((p: Row)=>p.id!==current.id):s.enemy;
        if(cmd==='guard'||cmd==='timeout'){current.shield+=18;current.ap=Math.min(5,current.ap+1);say(s,current.name+' guarded: +18 shield, +1 AP.','defense',current.id);}
        else if(cmd==='strike'){const hit=Math.max(0,16-target.shield);target.shield=Math.max(0,target.shield-16);target.hp=Math.max(0,target.hp-hit);const bonus=staggerHit(s,target,18,current.name);current.damage+=hit+bonus;current.ap=Math.min(5,current.ap+1);say(s,current.name+' struck for '+hit+' damage.','hit',current.id);}
        else if(cmd==='card'){
          const card=current.cards.find((c: Row)=>c.id===data.card_id);
          if(!card)fail('That card is not in your locked loadout.',403);
          if(current.ap<card.cost||current.cooldowns[card.id]>0)fail('This card is not ready.');
          current.ap-=card.cost;current.cooldowns[card.id]=card.cooldown+1;
          const resonance=card.game_id===room.world.id||card.game_name===room.world.title;
          const resonanceBonus=resonance?Math.max(5,Math.round(num(card.value)*.12)+num(card.ascension)*2):0;
          const value=Math.max(1,num(card.value)+resonanceBonus);
          const element=card.element?' · '+String(card.element).toUpperCase():'';
          if(card.effect==='heal'){
            const before=current.hp;current.hp=Math.min(current.max_hp,current.hp+value);
            say(s,current.name+' used '+card.name+element+': restored '+(current.hp-before)+' HP'+(resonance?' · world resonance.':'.'),'heal',current.id);
          }
          else if(card.effect==='shield'){
            current.shield+=value;
            say(s,current.name+' used '+card.name+element+': +'+value+' shield'+(resonance?' · world resonance.':'.'),'defense',current.id);
          }
          else {
            const critChance=Math.max(0,Math.min(35,num(card.critical_bonus_pct)));
            const critical=critChance>0&&((seedHash(event.request_id+'|'+card.id+'|'+s.revision)%100)<critChance);
            const raw=critical?Math.round(value*1.5):value;
            const hit=Math.max(0,raw-target.shield);
            target.shield=Math.max(0,target.shield-raw);target.hp=Math.max(0,target.hp-hit);
            const bonus=staggerHit(s,target,Math.max(12,num(card.stagger,24)),current.name);
            current.damage+=hit+bonus;
            say(s,current.name+' used '+card.name+element+': '+hit+' damage'+(critical?' · CRITICAL':'')+(resonance?' · world resonance.':'.'),'hit',current.id);
          }
        }else fail('Choose a card, strike, or guard.',400);
        current.actions++;advance(room,s,current,at);
      }else fail('This action is unavailable.');
    }
  }
  s.revision++;
  return s;
}
function initial(room: Row) {
  const players=[copy(room.host_snapshot)];
  if(room.guest_snapshot)players.push(copy(room.guest_snapshot));
  return {revision:0,status:'lobby',phase:'lobby',players,round:1,stage:0,turn:room.host_id,deadline:0,enemy:null,claimed:[],declined:[],log:room.matchmaking?[{id:0,text:'Match found. Both Jawan loadouts are locked for this duel.',kind:'info',actor:''}]:[]};
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
  return {id:room.id,host_id:room.host_id,host_name:room.host_name,world:room.world,route:routeFor(room.route_id),source_field:room.source_field||null,invited_ids:room.invited_ids,matchmaking:Boolean(room.matchmaking),created_date:room.created_date,...state};
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
function seedHash(value: string) {
  let hash = 2166136261;
  for (let i=0;i<value.length;i++){hash^=value.charCodeAt(i);hash=Math.imul(hash,16777619);}
  return hash>>>0;
}
function seeded(seed: number) {
  let state=seed>>>0;
  return ()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
}
function fieldNodes(availableWorlds: Row[], cellLat: number, cellLng: number) {
  const day=new Date().toISOString().slice(0,10);
  const rand=seeded(seedHash(day+'|'+cellLat.toFixed(2)+'|'+cellLng.toFixed(2)));
  const kinds=[
    {type:'cache',route_id:'patrol',title:'Hidden Field Cache',detail:'Track a short signal trail and secure a field chest.'},
    {type:'quest',route_id:'patrol',title:'Rift Signal',detail:'A game-world anomaly is bleeding into the local field layer.'},
    {type:'dungeon',route_id:'vault',title:'Dungeon Breach',detail:'A temporary dungeon entrance is open nearby.'},
    {type:'world_boss',route_id:'colossus',title:'World Boss Signal',detail:'A high-threat encounter is visible to nearby expedition players.'},
  ];
  const worldsPool=availableWorlds.length?availableWorlds:[{id:'luna',title:'Luna frontier',image:''}];
  return Array.from({length:6},(_,index)=>{
    const kind=kinds[index%kinds.length];
    const world=worldsPool[Math.floor(rand()*worldsPool.length)]||worldsPool[0];
    const distance=Math.round(90+rand()*1350);
    const bearing=Math.round(rand()*359);
    return {
      id:'field-'+seedHash(day+'|'+index+'|'+world.id+'|'+cellLat+'|'+cellLng).toString(36),
      type:kind.type,
      route_id:kind.route_id,
      title:kind.title,
      description:kind.detail,
      world:{id:world.id,title:world.title,image:world.image||''},
      distance_m:distance,
      bearing_deg:bearing,
      expires_at:new Date(Date.now()+6*60*60*1000).toISOString(),
    };
  }).sort((a,b)=>a.distance_m-b.distance_m);
}
Deno.serve(async req=>{
  try{
    const client=createClientFromRequest(req),user=await client.auth.me();
    if(!user)return Response.json({error:'Sign in to enter AI Battle.'},{status:401});
    const svc=client.asServiceRole.entities;
    const {action='hub',data={}}=await req.json();
    if(action==='hub'){
      const [availableWorlds,peers,player,rooms,queueRows]=await Promise.all([
        worlds(svc,user),contacts(svc,user),snapshot(svc,user),
        svc.AIBattleEncounter.filter({$or:[{host_id:user.id},{invited_ids:{$in:[user.id]}}]},'-created_date',30),
        svc.AIBattleQueue.filter({user_id:user.id},'-created_date',20),
      ]);
      const encounters=await Promise.all(rooms.filter((r: Row)=>accessible(r,user.id)).map(async(r: Row)=>publicRoom(r,(await replay(svc,r)).state)));
      const activeEncounterIds=new Set(encounters.filter((e: Row)=>['lobby','active'].includes(e.status)).map((e: Row)=>String(e.id)));
      const queue=queueRows.find((q: Row)=>q.status==='waiting')||queueRows.find((q: Row)=>q.status==='matched'&&activeEncounterIds.has(String(q.matched_encounter_id)))||null;
      return Response.json({worlds:availableWorlds,contacts:peers,player,routes:ROUTES,encounters,queue,server_time:Date.now()});
    }
    if(action==='field'){
      const cellLat=Math.round(num(data.cell_lat)*100)/100;
      const cellLng=Math.round(num(data.cell_lng)*100)/100;
      if(cellLat < -90 || cellLat > 90 || cellLng < -180 || cellLng > 180)fail('Field location is invalid.',400);
      const availableWorlds=await worlds(svc,user);
      return Response.json({
        nodes:fieldNodes(availableWorlds,cellLat,cellLng),
        precision:'coarse_0.01_degree',
        generated_at:new Date().toISOString(),
        server_time:Date.now()
      });
    }
    if(action==='demoBot'){
      const route=routeFor('duel')!;
      const availableWorlds=await worlds(svc,user);
      const world=availableWorlds.find(w=>String(w.id)===String(data.world_id))||availableWorlds[0];
      if(!world)fail('No battle world is available.',403);
      const player=await snapshot(svc,user);
      if(!player.cards.length)fail('Equip at least one card in the active skill set before queueing.');
      const recent=await svc.AIBattleEncounter.filter({host_id:user.id},'-created_date',20);
      for(const existing of recent){
        const state=(await replay(svc,existing)).state;
        if(['lobby','active'].includes(state.status)){
          if(existing.request_id==='demo-bot-match')return Response.json({matched:true,demo:true,encounter:publicRoom(existing,state),server_time:Date.now()});
          fail('Finish or leave your current expedition first.');
        }
      }
      const bot=demoBotSnapshot(player);
      const room=await svc.AIBattleEncounter.create({
        host_id:user.id,host_name:label(user),host_snapshot:player,guest_snapshot:bot,
        invited_ids:[],world,route_id:route.id,request_id:'demo-bot-match',matchmaking:true,queue_ids:[]
      });
      await svc.AIBattleTurn.create({
        encounter_id:room.id,actor_id:user.id,request_id:'demo-start-'+room.id,
        expected_revision:0,command:'start',payload:{},received_at:Date.now()
      });
      const state=(await replay(svc,room)).state;
      return Response.json({matched:true,demo:true,encounter:publicRoom(room,state),server_time:Date.now()});
    }
    if(action==='queueStatus'){
      const rows=await svc.AIBattleQueue.filter({user_id:user.id},'-created_date',20);
      const queue=rows.find((q: Row)=>q.status==='waiting'||q.status==='matched')||null;
      if(queue?.status==='matched'&&queue.matched_encounter_id){
        const room=await svc.AIBattleEncounter.get(queue.matched_encounter_id).catch(()=>null);
        if(room&&accessible(room,user.id))return Response.json({queue,matched:true,encounter:publicRoom(room,(await replay(svc,room)).state),server_time:Date.now()});
      }
      return Response.json({queue,matched:false,server_time:Date.now()});
    }
    if(action==='cancelQueue'){
      const rows=await svc.AIBattleQueue.filter({user_id:user.id,status:'waiting'},'-created_date',20);
      const now=new Date().toISOString();
      for(const row of rows)await svc.AIBattleQueue.update(row.id,{status:'cancelled',cancelled_at:now});
      return Response.json({queue:null,cancelled:true,server_time:Date.now()});
    }
    if(action==='queue'){
      const route=routeFor('duel')!;
      const availableWorlds=await worlds(svc,user);
      const world=availableWorlds.find(w=>String(w.id)===String(data.world_id));
      if(!world)fail('Choose a game world from your collection before queueing.',403);
      const player=await snapshot(svc,user);
      if(!player.cards.length)fail('Equip at least one card in the active Jawan before queueing.');
      const requestId=String(data.request_id||'').slice(0,100);
      if(!requestId)fail('A request identifier is required.',400);

      const ownRooms=await svc.AIBattleEncounter.filter({$or:[{host_id:user.id},{invited_ids:{$in:[user.id]}}]},'-created_date',20);
      for(const existingRoom of ownRooms){
        const existingState=(await replay(svc,existingRoom)).state;
        if(['lobby','active'].includes(existingState.status))return Response.json({matched:true,encounter:publicRoom(existingRoom,existingState),server_time:Date.now()});
      }

      const ownQueues=await svc.AIBattleQueue.filter({user_id:user.id},'-created_date',20);
      const matched=ownQueues.find((q: Row)=>q.status==='matched'&&q.matched_encounter_id);
      if(matched){
        const room=await svc.AIBattleEncounter.get(matched.matched_encounter_id).catch(()=>null);
        if(room){
          const state=(await replay(svc,room)).state;
          if(['lobby','active'].includes(state.status))return Response.json({queue:matched,matched:true,encounter:publicRoom(room,state),server_time:Date.now()});
        }
      }
      const waiting=ownQueues.find((q: Row)=>q.status==='waiting');
      if(waiting&&String(waiting.world_id)===String(world.id))return Response.json({queue:waiting,matched:false,server_time:Date.now()});
      if(waiting)await svc.AIBattleQueue.update(waiting.id,{status:'cancelled',cancelled_at:new Date().toISOString()});

      const candidates=await svc.AIBattleQueue.filter({status:'waiting',route_id:'duel',world_id:String(world.id)},'created_date',60);
      const cutoff=Date.now()-10*60*1000;
      const opponent=candidates.find((q: Row)=>String(q.user_id)!==String(user.id)&&new Date(q.queued_at||q.created_date||0).getTime()>=cutoff);
      const mine=await svc.AIBattleQueue.create({
        user_id:user.id,status:'waiting',route_id:'duel',world_id:String(world.id),world,
        player_snapshot:player,request_id:requestId,queued_at:new Date().toISOString()
      });
      if(!opponent)return Response.json({queue:mine,matched:false,server_time:Date.now()});

      const freshOpponent=await svc.AIBattleQueue.get(opponent.id).catch(()=>null);
      if(!freshOpponent||freshOpponent.status!=='waiting')return Response.json({queue:mine,matched:false,server_time:Date.now()});
      const matchRequest=('match-'+String(freshOpponent.id)+'-'+String(mine.id)).slice(0,100);
      const room=await svc.AIBattleEncounter.create({
        host_id:freshOpponent.user_id,
        host_name:freshOpponent.player_snapshot?.name||'Player',
        host_snapshot:freshOpponent.player_snapshot,
        guest_snapshot:player,
        invited_ids:[user.id],
        world,
        route_id:route.id,
        request_id:matchRequest,
        matchmaking:true,
        queue_ids:[freshOpponent.id,mine.id]
      });
      const matchedAt=new Date().toISOString();
      await Promise.all([
        svc.AIBattleQueue.update(freshOpponent.id,{status:'matched',matched_encounter_id:room.id,matched_user_id:user.id,matched_at:matchedAt}),
        svc.AIBattleQueue.update(mine.id,{status:'matched',matched_encounter_id:room.id,matched_user_id:freshOpponent.user_id,matched_at:matchedAt})
      ]);
      const mineMatched={...mine,status:'matched',matched_encounter_id:room.id,matched_user_id:freshOpponent.user_id,matched_at:matchedAt};
      return Response.json({queue:mineMatched,matched:true,encounter:publicRoom(room,initial(room)),server_time:Date.now()});
    }
    if(action==='create'){
      const route=routeFor(String(data.route_id));
      if(!route)fail('Choose an expedition route.',400);
      const availableWorlds=await worlds(svc,user);
      const world=availableWorlds.find(w=>w.id===data.world_id);
      if(!world)fail('This world is not in your game collection.',403);
      let sourceField=null;
      if(data.field_node_id){
        const cellLat=Math.round(num(data.field_cell_lat)*100)/100;
        const cellLng=Math.round(num(data.field_cell_lng)*100)/100;
        if(cellLat < -90 || cellLat > 90 || cellLng < -180 || cellLng > 180)fail('Field location is invalid.',400);
        const node=fieldNodes(availableWorlds,cellLat,cellLng).find((item: Row)=>String(item.id)===String(data.field_node_id));
        if(!node)fail('This field discovery expired or does not belong to this coarse field cell.',403);
        if(String(node.route_id)!==String(route.id)||String(node.world?.id)!==String(world.id))fail('This field discovery does not match the selected expedition.',403);
        sourceField={id:node.id,type:node.type,title:node.title,description:node.description,distance_m:node.distance_m,bearing_deg:node.bearing_deg,expires_at:node.expires_at};
      }
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
      const room=await svc.AIBattleEncounter.create({host_id:user.id,host_name:label(user),host_snapshot:player,invited_ids:ids,world,route_id:route.id,request_id:requestId,...(sourceField?{source_field:sourceField}:{})});
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
    if(command==='start'&&state.players.length>1&&!room.matchmaking)await requireDashboard(svc,room.host_id,state.players.map((p: Row)=>p.id));
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
