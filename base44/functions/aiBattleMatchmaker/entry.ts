import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { MALE_MODEL, FEMALE_MODEL } from '../../shared/avatarDefaults.ts';
import { ATB_START, DODGE, atbNow, skillStats, SKILL_SLOT_COUNT } from '../../shared/pvpSkills.ts';

type Row = Record<string, any>;
const MODES = new Set(['pvp', 'pve', 'world_boss']);
const WAITING_LIVE_MS = 30000;
const MATCH_LIVE_MS = 15000;
const QUEUE_HEARTBEAT_MS = 8000;
const DASHBOARD_LIVE_MS = 60000;
const DEFAULT_BATTLE_HP = 1000;
const ARENA = { width: 12, length: 16, margin_to_net: 1, spawn_distance: 10 };
const APPEARANCE_KEYS = [
  'name','gender','female_model_variant','model_url','base_body_gender','base_body_model_url','appearance_version',
  'style_preset','skin_tone','eye_color','hair_color','skin_tint_enabled','eye_tint_enabled','hair_tint_enabled',
  'complexion','facial_hair','facial_hair_color','tattoo_style','tattoo_placement','tattoo_color','tattoo_opacity',
  'hair_style','hair_length','hair_volume','face_shape','height_scale','body_proportions','material_colors','morph_targets',
  'eyelash_style','hood_enabled','weapon_visible'
];

const json = (body: any, status = 200) => Response.json(body, { status });
const nowIso = () => new Date().toISOString();
const playerName = (user: Row) => user.full_name || user.username || user.display_name || 'Player';
const heartbeatAt = (row: Row) => Date.parse(row?.last_seen_at || row?.queued_at || 0);
const waitingLive = (row: Row) => row?.status === 'waiting' && heartbeatAt(row) > Date.now() - WAITING_LIVE_MS;
const matchedLive = (row: Row) => row?.status === 'matched' && heartbeatAt(row) > Date.now() - MATCH_LIVE_MS;
const dashboardLive = (row: Row) => row?.status !== 'offline' && Number(row?.last_update || 0) > Date.now() - DASHBOARD_LIVE_MS;
const finiteHp = (value: any, fallback = DEFAULT_BATTLE_HP) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};
const distance2D = (a: Row = {}, b: Row = {}) => Math.hypot(Number(a.x || 0) - Number(b.x || 0), Number(a.z || 0) - Number(b.z || 0));
const clamp = (v: any, min: number, max: number) => Math.max(min, Math.min(max, Number(v) || 0));
function boxFor(match: Row, playerId: string) {
  const host = String(playerId) === String(match.host_id);
  return host ? { minX: -5.5, maxX: 5.5, minZ: 1, maxZ: 7.5 } : { minX: -5.5, maxX: 5.5, minZ: -7.5, maxZ: -1 };
}
function clampPos(match: Row, playerId: string, pos: Row = {}) {
  const box = boxFor(match, playerId);
  return { x: clamp(pos.x, box.minX, box.maxX), z: clamp(pos.z, box.minZ, box.maxZ) };
}

function publicQueue(row: Row | null) {
  if (!row) return null;
  return { id: row.id, mode: row.mode, status: row.status, queued_at: row.queued_at, match_id: row.match_id || null, host_id: row.host_id || null, opponent_id: row.opponent_id || null, avatar_gender: row.avatar_gender === 'female' ? 'female' : 'male' };
}
function publicMatch(row: Row | null) {
  if (!row) return null;
  return {
    id: row.id, mode: row.mode, status: row.status, host_id: row.host_id, host_name: row.host_name || 'Player',
    dashboard_channel: row.dashboard_channel, player_ids: row.player_ids || [], players: row.players || [],
    arena: row.arena || ARENA, positions: row.positions || {}, atb: row.atb || {}, cooldowns: row.cooldowns || {}, dodges: row.dodges || {},
    fight_starts_at: row.fight_starts_at || null, fight_ends_at: row.fight_ends_at || null,
    winner_id: row.winner_id || null, ended_reason: row.ended_reason || null,
    attack_revision: Number(row.attack_revision || 0), last_attack: row.last_attack || null,
    hit_log: Array.isArray(row.hit_log) ? row.hit_log.slice(-20) : [],
  };
}

async function getAvatarSnapshot(svc: any, userId: string) {
  const rows = await svc.Avatar.filter({ user_id: userId }, '-updated_date', 1).catch(() => []);
  const avatar = rows?.[0] || {};
  const gender = avatar.gender === 'female' ? 'female' : 'male';
  const fallbackModel = gender === 'female' ? FEMALE_MODEL : MALE_MODEL;
  const appearance = Object.fromEntries(APPEARANCE_KEYS.filter(k => avatar[k] !== undefined).map(k => [k, avatar[k]]));
  appearance.gender = gender;
  appearance.model_url = String(avatar.model_url || fallbackModel);
  appearance.base_body_gender = gender;
  appearance.base_body_model_url = String(avatar.base_body_model_url || appearance.model_url || fallbackModel);
  appearance.appearance_version = Math.max(3, Number(avatar.appearance_version || 3));
  if (gender === 'female') appearance.female_model_variant = avatar.female_model_variant || 'artemis_archer';
  return { avatar_gender: gender, avatar_model_url: appearance.model_url, avatar_appearance: appearance };
}

async function freezeSkills(svc: any, userId: string) {
  const loadouts = await svc.Loadout.filter({ user_id: userId, loadout_type: 'skills', is_active: true }, '-updated_date', 10).catch(() => []);
  const loadout = loadouts?.[0];
  const slots = loadout?.skill_slots || {};
  const out: Row[] = [];
  for (let slot = 0; slot < SKILL_SLOT_COUNT; slot += 1) {
    const cardId = slots[String(slot)] || slots[slot];
    if (!cardId) continue;
    const card = await svc.UserCard.get(String(cardId)).catch(() => null);
    if (!card || String(card.user_id) !== String(userId)) continue;
    const progressionRows = await svc.CardProgression.filter({ user_id: userId, user_card_id: String(card.id) }, '-updated_date', 1).catch(() => []);
    const level = Math.max(1, Number(progressionRows?.[0]?.level || 1));
    const effect = card.animation_effect || {};
    const effectId = String(effect.id || '');
    const stats = skillStats(effectId, card.card_rarity || 'Common');
    out.push({
      slot, user_card_id: String(card.id), name: card.card_name || 'Ability', image: card.card_image || '', rarity: card.card_rarity || 'Common',
      effect_id: effectId, clip_name: effect.clip_name || '', duration_ms: Number(effect.duration_ms || stats.hit_ms || 400),
      cooldown_ms: Number(stats.cooldown_ms), atb_cost: Number(stats.atb_cost), range_m: Number(stats.range_m), base_damage: Number(stats.base_damage), kind: stats.kind, hit_ms: Number(stats.hit_ms), level,
      animation_effect: effect,
    });
  }
  return out;
}

async function playerFromQueue(svc: any, row: Row) {
  const gender = row.avatar_gender === 'female' ? 'female' : 'male';
  const fallbackModel = gender === 'female' ? FEMALE_MODEL : MALE_MODEL;
  const appearance = row.avatar_appearance && typeof row.avatar_appearance === 'object' ? { ...row.avatar_appearance, gender } : { gender, appearance_version: 3 };
  appearance.model_url = String(appearance.model_url || row.avatar_model_url || fallbackModel);
  appearance.base_body_gender = gender;
  appearance.base_body_model_url = String(appearance.base_body_model_url || appearance.model_url || fallbackModel);
  if (gender === 'female') appearance.female_model_variant = appearance.female_model_variant || 'artemis_archer';
  return { id: String(row.user_id), name: row.player_name || 'Player', avatar_url: row.avatar_url || '', gender, model_url: appearance.model_url, appearance, hp: DEFAULT_BATTLE_HP, max_hp: DEFAULT_BATTLE_HP, skills: await freezeSkills(svc, String(row.user_id)) };
}

async function getMatch(svc: any, id: string) { return id ? await svc.AIBattleMatch.get(id).catch(() => null) : null; }
async function latestQueue(svc: any, userId: string) {
  const rows = await svc.AIBattleQueueEntry.filter({ user_id: userId }, '-created_date', 30);
  return rows.find((r: Row) => ['waiting','matched'].includes(String(r.status))) || null;
}
async function queueForMatch(svc: any, userId: string, matchId: string) {
  const rows = await svc.AIBattleQueueEntry.filter({ user_id: userId }, '-created_date', 30);
  return rows.find((r: Row) => r.status === 'matched' && String(r.match_id || '') === String(matchId)) || null;
}
async function cancelQueue(svc: any, row: Row | null) { if (row?.id && row.status !== 'cancelled') await svc.AIBattleQueueEntry.update(row.id, { status: 'cancelled' }); }

function winnerByHp(match: Row) {
  const players = match.players || [];
  if (players.length < 2) return String(match.host_id || players[0]?.id || '');
  const score = (p: Row) => finiteHp(p.hp, 0) / Math.max(1, finiteHp(p.max_hp, DEFAULT_BATTLE_HP));
  if (score(players[0]) === score(players[1])) return String(match.host_id || players[0].id);
  return String(score(players[0]) > score(players[1]) ? players[0].id : players[1].id);
}

async function settleMatch(svc: any, input: Row | null) {
  if (!input || input.status === 'ended') return input;
  let match = { ...input, players: (input.players || []).map((p: Row) => ({ ...p })), pending_hits: [...(input.pending_hits || [])], hit_log: [...(input.hit_log || [])] };
  const now = Date.now();
  let changed = false;

  const due = match.pending_hits.filter((hit: Row) => Date.parse(hit.resolves_at || 0) <= now).sort((a: Row,b:Row) => Date.parse(a.resolves_at)-Date.parse(b.resolves_at));
  if (due.length) {
    const dueIds = new Set(due.map((h: Row) => String(h.cast_id)));
    match.pending_hits = match.pending_hits.filter((h: Row) => !dueIds.has(String(h.cast_id)));
    for (const hit of due) {
      const dodge = match.dodges?.[hit.target_id];
      const resolveAt = Date.parse(hit.resolves_at || 0);
      const missed = dodge && Date.parse(dodge.from || 0) <= resolveAt && Date.parse(dodge.until || 0) >= resolveAt;
      let hpAfter = null;
      if (!missed) {
        match.players = match.players.map((p: Row) => {
          if (String(p.id) !== String(hit.target_id)) return p;
          const hp = Math.max(0, finiteHp(p.hp, DEFAULT_BATTLE_HP) - Number(hit.damage || 0));
          hpAfter = hp;
          return { ...p, hp };
        });
      } else {
        hpAfter = finiteHp(match.players.find((p:Row)=>String(p.id)===String(hit.target_id))?.hp, DEFAULT_BATTLE_HP);
      }
      const result = { cast_id: hit.cast_id, attacker_id: hit.attacker_id, target_id: hit.target_id, slot: hit.slot, effect_id: hit.effect_id, result: missed ? 'miss' : 'hit', damage: missed ? 0 : hit.damage, crit: !!hit.crit, hp_after: hpAfter, resolved_at: hit.resolves_at };
      match.hit_log = [...match.hit_log, result].slice(-20);
      match.attack_revision = Number(match.attack_revision || 0) + 1;
      match.last_attack = { ...result, revision: match.attack_revision };
      changed = true;
      if (!missed && Number(hpAfter) <= 0) {
        match.status = 'ended'; match.winner_id = String(hit.attacker_id); match.ended_reason = 'ko'; match.ended_at = nowIso();
        break;
      }
    }
  }

  if (match.status === 'countdown' && Date.parse(match.fight_starts_at || 0) <= now) { match.status = 'fighting'; changed = true; }
  if (match.status === 'fighting' && Date.parse(match.fight_ends_at || 0) <= now) {
    match.status = 'ended'; match.winner_id = winnerByHp(match); match.ended_reason = 'timeout'; match.ended_at = nowIso(); changed = true;
  }

  if (['countdown','fighting'].includes(match.status)) {
    const ids = (match.player_ids || []).map(String);
    const queues = await Promise.all(ids.map((id:string) => queueForMatch(svc, id, String(match.id))));
    const deadIndex = queues.findIndex((row: Row | null) => !row || !matchedLive(row));
    if (deadIndex >= 0) {
      match.status = 'ended'; match.winner_id = ids[deadIndex === 0 ? 1 : 0] || ids[0]; match.ended_reason = 'disconnect'; match.ended_at = nowIso(); changed = true;
    }
  }

  if (changed) match = await svc.AIBattleMatch.update(match.id, {
    status: match.status, players: match.players, pending_hits: match.pending_hits, hit_log: match.hit_log,
    attack_revision: match.attack_revision, last_attack: match.last_attack, winner_id: match.winner_id || '', ended_reason: match.ended_reason || '', ended_at: match.ended_at || undefined,
  });
  return match;
}

async function canonicalPairMatch(svc: any, mode: string, first: Row, second: Row) {
  const ids = [String(first.user_id), String(second.user_id)];
  const pairKey = `${mode}:${[...ids].sort().join(':')}:${[String(first.id),String(second.id)].sort().join(':')}`;
  const existing = await svc.AIBattleMatch.filter({ pair_key: pairKey }, 'created_date', 10);
  let match = existing.find((m:Row) => m.status !== 'ended') || null;
  if (!match) {
    const host = ids[0], guest = ids[1];
    match = await svc.AIBattleMatch.create({
      mode, status: 'matched', host_id: host, host_name: first.player_name || 'Player', dashboard_channel: `dashboard_${host}`,
      pair_key: pairKey, player_ids: ids, players: [await playerFromQueue(svc, first), await playerFromQueue(svc, second)], arena: ARENA,
      positions: { [host]: { x: 0, z: 5 }, [guest]: { x: 0, z: -5 } }, atb: {}, cooldowns: {}, dodges: {}, pending_hits: [], hit_log: [], attack_revision: 0, last_attack: null,
    });
  }
  const stamp = nowIso();
  await Promise.all([
    svc.AIBattleQueueEntry.update(first.id, { status:'matched', match_id:match.id, host_id:match.host_id, opponent_id:second.user_id, matched_at:stamp, last_seen_at:stamp }),
    svc.AIBattleQueueEntry.update(second.id, { status:'matched', match_id:match.id, host_id:match.host_id, opponent_id:first.user_id, matched_at:stamp, last_seen_at:stamp }),
  ]);
  return match;
}
async function tryPair(svc: any, mode: string) {
  const rows = (await svc.AIBattleQueueEntry.filter({ mode, status:'waiting' }, 'created_date', 100)).filter(waitingLive);
  const unique: Row[] = []; const seen = new Set<string>();
  for (const row of rows) { const id=String(row.user_id||''); if(id&&!seen.has(id)){seen.add(id);unique.push(row);} if(unique.length===2) break; }
  return unique.length===2 ? await canonicalPairMatch(svc, mode, unique[0], unique[1]) : null;
}

async function statusFor(svc: any, userId: string, clientSessionId = '', pos: Row | null = null) {
  let queue = await latestQueue(svc, userId);
  if (!queue) return { queue:null, match:null };
  if (queue.status === 'waiting' && !waitingLive(queue)) { await cancelQueue(svc, queue); return {queue:null,match:null}; }
  if (heartbeatAt(queue) < Date.now() - QUEUE_HEARTBEAT_MS) queue = await svc.AIBattleQueueEntry.update(queue.id, { last_seen_at: nowIso(), client_session_id: clientSessionId || queue.client_session_id || '' });
  if (queue.status === 'waiting') {
    const paired = await tryPair(svc, queue.mode);
    queue = await svc.AIBattleQueueEntry.get(queue.id).catch(() => queue);
    return { queue, match: paired && (paired.player_ids||[]).map(String).includes(userId) ? paired : null };
  }
  if (queue.status === 'matched' && queue.match_id) {
    let match = await settleMatch(svc, await getMatch(svc, String(queue.match_id)));
    if (!match) { await cancelQueue(svc, queue); return {queue:null,match:null}; }
    if (pos && ['countdown','fighting'].includes(match.status)) {
      const positions = { ...(match.positions || {}), [userId]: clampPos(match, userId, pos) };
      match = await svc.AIBattleMatch.update(match.id, { positions });
    }
    return { queue, match };
  }
  return { queue:null,match:null };
}

Deno.serve(async (req) => {
  try {
    const client = createClientFromRequest(req); const user = await client.auth.me();
    if (!user) return json({ error:'Sign in to use AI Battle.' },401);
    const svc = client.asServiceRole.entities;
    const body = await req.json().catch(()=>({})); const action=String(body?.action||'status'); const data=body?.data||{}; const userId=String(user.id);
    const sessionId=String(data.client_session_id||'').slice(0,160);

    if (action === 'status') {
      const current = await statusFor(svc,userId,sessionId,data.position||null);
      return json({ queue:publicQueue(current.queue), match:publicMatch(current.match), server_time:Date.now() });
    }
    if (action === 'join') {
      const mode=String(data.mode||'').toLowerCase(); if(!MODES.has(mode)) return json({error:'Choose PvP, PvE, or World Boss.'},400);
      const current=await latestQueue(svc,userId); if(current){const state=await statusFor(svc,userId,sessionId); if(state.queue) return json({queue:publicQueue(state.queue),match:publicMatch(state.match),server_time:Date.now()});}
      const avatar=await getAvatarSnapshot(svc,userId);
      const created=await svc.AIBattleQueueEntry.create({ user_id:userId,player_name:playerName(user),avatar_url:user.avatar_url||user.profile_image||'',...avatar,mode,status:'waiting',request_id:String(data.request_id||'').slice(0,100),client_session_id:sessionId,queued_at:nowIso(),last_seen_at:nowIso() });
      const paired=await tryPair(svc,mode); const queue=await svc.AIBattleQueueEntry.get(created.id).catch(()=>created);
      return json({queue:publicQueue(queue),match:publicMatch(paired&&(paired.player_ids||[]).map(String).includes(userId)?paired:null),server_time:Date.now()});
    }
    if (action === 'cancel' || action === 'reset') {
      const queue=await latestQueue(svc,userId); if(queue?.match_id){const match=await getMatch(svc,String(queue.match_id)); if(match&&['countdown','fighting'].includes(match.status)){const ids=(match.player_ids||[]).map(String);await svc.AIBattleMatch.update(match.id,{status:'ended',winner_id:ids.find((id:string)=>id!==userId)||'',ended_reason:'forfeit',ended_at:nowIso()});}} await cancelQueue(svc,queue); return json({queue:null,match:null,server_time:Date.now()});
    }
    if (action === 'ready') {
      let match=await settleMatch(svc,await getMatch(svc,String(data.match_id||''))); if(!match||(match.player_ids||[]).map(String).includes(userId)===false) return json({error:'Match not found.'},404);
      if(match.status==='ended') return json({error:'This match has ended.',match:publicMatch(match)},409);
      const room=await svc.PlayerState.filter({channel_id:match.dashboard_channel}); const liveIds=new Set(room.filter(dashboardLive).map((r:Row)=>String(r.player_id)));
      const ready=(match.player_ids||[]).every((id:string)=>liveIds.has(String(id)));
      if(ready&&match.status==='matched'){
        const start=Date.now()+3500; const ids=(match.player_ids||[]).map(String); const atb=Object.fromEntries(ids.map((id:string)=>[id,{value:ATB_START,at:new Date(start).toISOString()}]));
        const players=(match.players||[]).map((p:Row)=>({...p,hp:finiteHp(p.max_hp,DEFAULT_BATTLE_HP),max_hp:finiteHp(p.max_hp,DEFAULT_BATTLE_HP)}));
        match=await svc.AIBattleMatch.update(match.id,{status:'countdown',ready_at:nowIso(),fight_starts_at:new Date(start).toISOString(),fight_ends_at:new Date(start+180000).toISOString(),players,atb,cooldowns:{},dodges:{},pending_hits:[],hit_log:[]});
      }
      return json({match:publicMatch(match),ready,server_time:Date.now()});
    }
    if (action === 'forfeit') {
      let match=await getMatch(svc,String(data.match_id||'')); if(!match||(match.player_ids||[]).map(String).includes(userId)===false) return json({error:'Match not found.'},404);
      const winner=(match.player_ids||[]).map(String).find((id:string)=>id!==userId)||''; match=await svc.AIBattleMatch.update(match.id,{status:'ended',winner_id:winner,ended_reason:'forfeit',ended_at:nowIso()});
      return json({match:publicMatch(match),server_time:Date.now()});
    }
    if (action === 'dodge') {
      let match=await settleMatch(svc,await getMatch(svc,String(data.match_id||''))); if(!match||(match.player_ids||[]).map(String).includes(userId)===false) return json({error:'Match not found.'},404);
      if(match.status!=='fighting') return json({error:'Fight has not started.'},409);
      const now=Date.now(); const currentAtb=atbNow(match.atb?.[userId],now); const cd=Date.parse(match.cooldowns?.[userId]?._dodge||0);
      if(cd>now) return json({error:'Dodge is on cooldown.'},409); if(currentAtb<DODGE.atb_cost) return json({error:'Not enough ATB.'},409);
      const atb={...(match.atb||{}),[userId]:{value:currentAtb-DODGE.atb_cost,at:new Date(now).toISOString()}};
      const cooldowns={...(match.cooldowns||{}),[userId]:{...(match.cooldowns?.[userId]||{}),_dodge:new Date(now+DODGE.cooldown_ms).toISOString()}};
      const dodges={...(match.dodges||{}),[userId]:{from:new Date(now).toISOString(),until:new Date(now+DODGE.window_ms).toISOString()}};
      match=await svc.AIBattleMatch.update(match.id,{atb,cooldowns,dodges}); return json({match:publicMatch(match),server_time:now});
    }
    if (action === 'use_skill') {
      let match=await settleMatch(svc,await getMatch(svc,String(data.match_id||''))); if(!match||(match.player_ids||[]).map(String).includes(userId)===false) return json({error:'Match not found.'},404);
      if(match.status!=='fighting') return json({error:'Fight has not started.'},409);
      const me=(match.players||[]).find((p:Row)=>String(p.id)===userId); const target=(match.players||[]).find((p:Row)=>String(p.id)!==userId); const slot=Number(data.slot);
      const skill=(me?.skills||[]).find((s:Row)=>Number(s.slot)===slot); if(!skill) return json({error:'That skill is not equipped.'},409);
      const now=Date.now(); const myCooldowns=match.cooldowns?.[userId]||{}; if(Date.parse(myCooldowns[String(slot)]||0)>now) return json({error:'On cooldown.'},409);
      if(now-Number(myCooldowns._last_cast_at||0)<400) return json({error:'Casting too quickly.'},409);
      const currentAtb=atbNow(match.atb?.[userId],now); if(currentAtb<Number(skill.atb_cost||0)) return json({error:'Not enough ATB.'},409);
      const storedA=clampPos(match,userId,match.positions?.[userId]||{}); const targetId=String(target?.id||''); const storedT=clampPos(match,targetId,match.positions?.[targetId]||{});
      const proposedA=clampPos(match,userId,data.attacker_pos||storedA); const proposedT=clampPos(match,targetId,data.target_pos||storedT);
      const attackerPos=distance2D(proposedA,storedA)>3?storedA:proposedA; const targetPos=distance2D(proposedT,storedT)>3?storedT:proposedT;
      if(distance2D(attackerPos,targetPos)>Number(skill.range_m||3)+1.5) return json({error:'Out of range.'},409);
      const crit=Math.random()<0.10; const variance=0.95+Math.random()*0.10; const damage=Math.round(Number(skill.base_damage||40)*(1+0.03*(Math.max(1,Number(skill.level||1))-1))*variance*(crit?1.5:1));
      const castId=String(data.cast_id||crypto.randomUUID()); const resolvesAt=new Date(now+Number(skill.hit_ms||400)).toISOString();
      const pending=[...(match.pending_hits||[]),{cast_id:castId,attacker_id:userId,target_id:targetId,slot,effect_id:skill.effect_id||'',damage,crit,resolves_at:resolvesAt}];
      const atb={...(match.atb||{}),[userId]:{value:currentAtb-Number(skill.atb_cost||0),at:new Date(now).toISOString()}};
      const cooldowns={...(match.cooldowns||{}),[userId]:{...myCooldowns,[String(slot)]:new Date(now+Number(skill.cooldown_ms||3000)).toISOString(),_last_cast_at:now}};
      const positions={...(match.positions||{}),[userId]:attackerPos,[targetId]:targetPos};
      match=await svc.AIBattleMatch.update(match.id,{pending_hits:pending,atb,cooldowns,positions});
      return json({match:publicMatch(match),cast:{cast_id:castId,slot,effect_id:skill.effect_id||'',clip_name:skill.clip_name||'',animation_effect:skill.animation_effect||{},resolves_at:resolvesAt,damage,crit,target_id:targetId},server_time:now});
    }

    return json({error:'Unknown AI Battle action.'},400);
  } catch(error){console.error('[aiBattleMatchmaker]',error);return json({error:error?.message||'AI Battle request failed.'},Number(error?.status||500));}
});
