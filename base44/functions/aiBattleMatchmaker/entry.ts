import { createClientFromRequest } from 'npm:@base44/sdk@0.8.51';
import { MALE_MODEL, FEMALE_MODEL } from '../../shared/avatarDefaults.ts';
import { BASIC_MELEE, DODGE, atbNow, skillStats, SKILL_SLOT_COUNT } from '../../shared/pvpSkills.ts';
import { avatarSkillError, skillEquipStatus } from '../../shared/skillEligibility.ts';
import { grantAchievement } from '../../shared/rewardEngine.ts';

type Row = Record<string, any>;
const MODES = new Set(['pvp', 'pve', 'world_boss']);
const WAITING_LIVE_MS = 30000;
const MATCH_LIVE_MS = 15000;
const RECONNECT_GRACE_MS = 120000;
const QUEUE_HEARTBEAT_MS = 8000;
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
function turnPlayerId(match: Row) {
  const ids = (match?.player_ids || []).map(String);
  return ids.find((id: string) => match?.atb?.[id]?.turn === true) || String(match?.host_id || ids[0] || '');
}
function turnAtb(match: Row, activeId: string, now = Date.now()) {
  const ids = (match?.player_ids || []).map(String);
  return Object.fromEntries(ids.map((id: string) => [id, {
    value: id === String(activeId) ? 100 : 0,
    at: new Date(now).toISOString(),
    turn: id === String(activeId),
  }]));
}

function publicQueue(row: Row | null) {
  if (!row) return null;
  return {
    id: row.id, mode: row.mode, status: row.status, queued_at: row.queued_at,
    match_id: row.match_id || null, host_id: row.host_id || null, opponent_id: row.opponent_id || null,
    connected_at: row.connected_at || null, ready_at: row.ready_at || null,
    avatar_gender: row.avatar_gender === 'female' ? 'female' : 'male',
  };
}
function publicMatch(row: Row | null) {
  if (!row) return null;
  return {
    id: row.id, mode: row.mode, status: row.status, host_id: row.host_id, host_name: row.host_name || 'Player',
    dashboard_channel: row.dashboard_channel, player_ids: row.player_ids || [], players: row.players || [],
    arena: row.arena || ARENA, positions: row.positions || {}, atb: row.atb || {}, cooldowns: row.cooldowns || {}, dodges: row.dodges || {},
    connected_at: row.connected_at || null,
    fight_starts_at: row.fight_starts_at || null, fight_ends_at: row.fight_ends_at || null,
    winner_id: row.winner_id || null, ended_reason: row.ended_reason || null,
    disconnects: row.disconnects || {}, pause_started_at: row.pause_started_at || null,
    reconnect_grace_ms: RECONNECT_GRACE_MS, prestige_awards: row.prestige_awards || {},
    turn_player_id: turnPlayerId(row),
    attack_revision: Number(row.attack_revision || 0), last_attack: row.last_attack || null,
    hit_log: Array.isArray(row.hit_log) ? row.hit_log.slice(-20) : [],
  };
}

async function getAvatarSnapshot(svc: any, userId: string, requested: Row = {}) {
  const rows = await svc.Avatar.filter({ user_id: userId }, '-updated_date', 1).catch(() => []);
  const avatar = rows?.[0] || {};
  const requestedAppearance = requested.avatar_appearance && typeof requested.avatar_appearance === 'object' ? requested.avatar_appearance : {};
  const requestedGender = String(requested.avatar_gender || requestedAppearance.gender || '').trim().toLowerCase();
  const gender = requestedGender === 'female' ? 'female' : requestedGender === 'male' ? 'male' : avatar.gender === 'female' ? 'female' : 'male';
  const fallbackModel = gender === 'female' ? FEMALE_MODEL : MALE_MODEL;
  const source = { ...avatar, ...requestedAppearance };
  const appearance = Object.fromEntries(APPEARANCE_KEYS.filter(k => source[k] !== undefined).map(k => [k, source[k]]));
  appearance.gender = gender;
  appearance.model_url = String(requested.avatar_model_url || requestedAppearance.model_url || avatar.model_url || fallbackModel);
  appearance.base_body_gender = gender;
  appearance.base_body_model_url = String(requestedAppearance.base_body_model_url || avatar.base_body_model_url || appearance.model_url || fallbackModel);
  appearance.appearance_version = Math.max(3, Number(requestedAppearance.appearance_version || avatar.appearance_version || 3));
  if (gender === 'female') appearance.female_model_variant = requestedAppearance.female_model_variant || avatar.female_model_variant || 'artemis_archer';
  return { avatar_gender: gender, avatar_model_url: appearance.model_url, avatar_appearance: appearance };
}

async function freezeSkills(svc: any, userId: string, gender: string) {
  // PvP uses the exact same persistent Skill Book loadout as the dashboard.
  // Read all skill rows and deliberately resolve the active one instead of
  // depending on a compound filter that can miss legacy/migrated rows.
  const loadouts = await svc.Loadout.filter({ user_id: userId, loadout_type: 'skills' }, '-updated_date', 50).catch(() => []);
  const active = loadouts.find((row: Row) => row.is_active === true)
    || [...loadouts].sort((a: Row, b: Row) => Number(a.skill_set_order || 0) - Number(b.skill_set_order || 0))[0]
    || null;
  const slots = active?.skill_slots || {};
  const out: Row[] = [];
  for (let slot = 0; slot < SKILL_SLOT_COUNT; slot += 1) {
    const cardId = slots[String(slot)] || slots[slot];
    if (!cardId) continue;
    const card = await svc.UserCard.get(String(cardId)).catch(() => null);
    if (!card || String(card.user_id) !== String(userId) || !skillEquipStatus(card, gender).can_equip) continue;
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

async function syncFrozenSkillsForMatch(svc: any, match: Row) {
  const players = await Promise.all((match.players || []).map(async (player: Row) => {
    const gender = player.gender === 'female' ? 'female' : 'male';
    return { ...player, skills: await freezeSkills(svc, String(player.id || player.player_id || ''), gender) };
  }));
  return { ...match, players };
}

async function playerFromQueue(svc: any, row: Row) {
  const gender = row.avatar_gender === 'female' ? 'female' : 'male';
  const fallbackModel = gender === 'female' ? FEMALE_MODEL : MALE_MODEL;
  const appearance = row.avatar_appearance && typeof row.avatar_appearance === 'object' ? { ...row.avatar_appearance, gender } : { gender, appearance_version: 3 };
  appearance.model_url = String(appearance.model_url || row.avatar_model_url || fallbackModel);
  appearance.base_body_gender = gender;
  appearance.base_body_model_url = String(appearance.base_body_model_url || appearance.model_url || fallbackModel);
  if (gender === 'female') appearance.female_model_variant = appearance.female_model_variant || 'artemis_archer';
  return { id: String(row.user_id), name: row.player_name || 'Player', avatar_url: row.avatar_url || '', gender, model_url: appearance.model_url, appearance, hp: DEFAULT_BATTLE_HP, max_hp: DEFAULT_BATTLE_HP, skills: await freezeSkills(svc, String(row.user_id), gender) };
}

async function getMatch(svc: any, id: string) { return id ? await svc.AIBattleMatch.get(id).catch(() => null) : null; }
async function activeQueuesForUser(svc: any, userId: string) {
  const rows = await svc.AIBattleQueueEntry.filter({ user_id: userId }, '-created_date', 50).catch(() => []);
  return (rows || []).filter((r: Row) => ['waiting','matched'].includes(String(r.status)));
}
async function latestQueue(svc: any, userId: string) {
  const rows = await activeQueuesForUser(svc, userId);
  return rows.find((r: Row) => r.status === 'matched') || rows[0] || null;
}
async function cleanupQueueDuplicates(svc: any, userId: string) {
  const rows = await activeQueuesForUser(svc, userId);
  if (rows.length <= 1) return rows[0] || null;
  // A reserved match always wins over a newer accidental waiting row. Otherwise
  // keep the newest active queue and cancel the rest so rapid Queue/Q presses can
  // never leave ghost entries that another player can be paired against.
  const keep = rows.find((r: Row) => r.status === 'matched') || rows[0];
  await Promise.all(rows.filter((r: Row) => String(r.id) !== String(keep.id)).map((r: Row) => svc.AIBattleQueueEntry.update(r.id, { status: 'cancelled' }).catch(() => null)));
  return keep;
}
async function queueForMatch(svc: any, userId: string, matchId: string) {
  const rows = await svc.AIBattleQueueEntry.filter({ user_id: userId }, '-created_date', 50).catch(() => []);
  return rows.find((r: Row) => r.status === 'matched' && String(r.match_id || '') === String(matchId)) || null;
}
async function cancelQueue(svc: any, row: Row | null) { if (row?.id && row.status !== 'cancelled') await svc.AIBattleQueueEntry.update(row.id, { status: 'cancelled' }); }
async function cancelAllQueuesForUser(svc: any, userId: string) {
  const rows = await activeQueuesForUser(svc, userId);
  await Promise.all(rows.map((row: Row) => cancelQueue(svc, row).catch(() => null)));
}
async function cancelMatchQueues(svc: any, match: Row | null) {
  if (!match?.id) return;
  const rows = await Promise.all((match.player_ids || []).map((id: string) => queueForMatch(svc, String(id), String(match.id))));
  await Promise.all(rows.filter(Boolean).map((row: Row) => cancelQueue(svc, row).catch(() => null)));
}

function winnerByHp(match: Row) {
  const players = match.players || [];
  if (players.length < 2) return String(match.host_id || players[0]?.id || '');
  const score = (p: Row) => finiteHp(p.hp, 0) / Math.max(1, finiteHp(p.max_hp, DEFAULT_BATTLE_HP));
  if (score(players[0]) === score(players[1])) return String(match.host_id || players[0].id);
  return String(score(players[0]) > score(players[1]) ? players[0].id : players[1].id);
}

async function finalizeMatchRewards(svc: any, match: Row | null) {
  if (!match || match.status !== 'ended' || match.mode !== 'pvp' || !match.winner_id || match.rewards_finalized) return match;
  const ids = (match.player_ids || []).map(String);
  const prestigeAwards = Object.fromEntries(ids.map((id: string) => [id, id === String(match.winner_id) ? 100 : 25]));
  for (const id of ids) {
    const rows = await svc.AvatarProgression.filter({ user_id: id }, '-updated_date', 1).catch(() => []);
    const row = rows?.[0];
    if (row?.id) await svc.AvatarProgression.update(row.id, { prestige_score: Number(row.prestige_score || 0) + Number(prestigeAwards[id] || 0) });
  }
  const achievements = await svc.Achievement.list('title', 5000).catch(() => []);
  const matches = achievements.filter((row:Row) => row.event_rule?.event_key === 'platform.first_pvp_win');
  for (const achievement of matches) await grantAchievement(svc, String(match.winner_id), achievement.id, 'platform', { progress: { event_key: 'platform.first_pvp_win', match_id: match.id } });
  return await svc.AIBattleMatch.update(match.id, { prestige_awards: prestigeAwards, rewards_finalized: true });
}

const shiftIso = (value: any, ms: number) => {
  const stamp = Date.parse(value || 0);
  return stamp ? new Date(stamp + ms).toISOString() : value;
};
function shiftPausedTimers(match: Row, pauseMs: number) {
  if (!pauseMs) return match;
  const shifted = { ...match };
  if (shifted.fight_starts_at) shifted.fight_starts_at = shiftIso(shifted.fight_starts_at, pauseMs);
  if (shifted.fight_ends_at) shifted.fight_ends_at = shiftIso(shifted.fight_ends_at, pauseMs);
  shifted.pending_hits = (shifted.pending_hits || []).map((hit: Row) => ({ ...hit, resolves_at: shiftIso(hit.resolves_at, pauseMs) }));
  shifted.atb = Object.fromEntries(Object.entries(shifted.atb || {}).map(([id, state]: any) => [id, { ...state, at: shiftIso(state?.at, pauseMs) }]));
  shifted.dodges = Object.fromEntries(Object.entries(shifted.dodges || {}).map(([id, state]: any) => [id, { ...state, from: shiftIso(state?.from, pauseMs), until: shiftIso(state?.until, pauseMs) }]));
  shifted.cooldowns = Object.fromEntries(Object.entries(shifted.cooldowns || {}).map(([id, values]: any) => [id, Object.fromEntries(Object.entries(values || {}).map(([key, value]: any) => [key, key === '_last_cast_at' && Number.isFinite(Number(value)) ? Number(value) + pauseMs : shiftIso(value, pauseMs)]))]));
  return shifted;
}

async function settleMatch(svc: any, input: Row | null) {
  if (!input || input.status === 'ended') return input;
  let match = { ...input, players: (input.players || []).map((p: Row) => ({ ...p })), pending_hits: [...(input.pending_hits || [])], hit_log: [...(input.hit_log || [])], disconnects: { ...(input.disconnects || {}) } };
  const now = Date.now();
  let changed = false;
  let paused = false;

  if (['countdown','fighting'].includes(match.status)) {
    const ids = (match.player_ids || []).map(String);
    const queues = await Promise.all(ids.map((id:string) => queueForMatch(svc, id, String(match.id))));
    for (let index = 0; index < ids.length; index += 1) {
      const id = ids[index];
      const live = Boolean(queues[index] && matchedLive(queues[index]));
      const prior = match.disconnects[id];
      if (live && prior) {
        delete match.disconnects[id];
        changed = true;
      } else if (!live && !prior) {
        match.disconnects[id] = { disconnected_at: new Date(now).toISOString(), reconnect_deadline: new Date(now + RECONNECT_GRACE_MS).toISOString() };
        changed = true;
      }
    }
    const expiredId = ids.find((id: string) => match.disconnects[id] && Date.parse(match.disconnects[id].reconnect_deadline || 0) <= now);
    if (expiredId) {
      match.status = 'ended';
      match.winner_id = ids.find((id: string) => id !== expiredId) || ids[0];
      match.ended_reason = 'disconnect';
      match.ended_at = nowIso();
      match.pause_started_at = '';
      changed = true;
    } else {
      paused = Object.keys(match.disconnects).length > 0;
      if (paused && !match.pause_started_at) {
        match.pause_started_at = new Date(now).toISOString();
        changed = true;
      } else if (!paused && match.pause_started_at) {
        const pauseMs = Math.max(0, now - Date.parse(match.pause_started_at || 0));
        match = shiftPausedTimers(match, pauseMs);
        match.pause_started_at = '';
        changed = true;
      }
    }
  }

  const due = !paused && match.status !== 'ended' ? match.pending_hits.filter((hit: Row) => Date.parse(hit.resolves_at || 0) <= now).sort((a: Row,b:Row) => Date.parse(a.resolves_at)-Date.parse(b.resolves_at)) : [];
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

  if (!paused && match.status === 'countdown' && Date.parse(match.fight_starts_at || 0) <= now) { match.status = 'fighting'; changed = true; }
  if (!paused && match.status === 'fighting' && Date.parse(match.fight_ends_at || 0) <= now) {
    match.status = 'ended'; match.winner_id = winnerByHp(match); match.ended_reason = 'timeout'; match.ended_at = nowIso(); changed = true;
  }

  if (changed) match = await svc.AIBattleMatch.update(match.id, {
    status: match.status, players: match.players, pending_hits: match.pending_hits, hit_log: match.hit_log,
    attack_revision: match.attack_revision, last_attack: match.last_attack, winner_id: match.winner_id || '', ended_reason: match.ended_reason || '', ended_at: match.ended_at || undefined,
    disconnects: match.disconnects || {}, pause_started_at: match.pause_started_at || '', fight_starts_at: match.fight_starts_at || undefined,
    fight_ends_at: match.fight_ends_at || undefined, atb: match.atb || {}, cooldowns: match.cooldowns || {}, dodges: match.dodges || {},
  });
  if (match.status === 'ended') {
    match = await finalizeMatchRewards(svc, match) || match;
    await clearMatchForPlayers(svc, match);
  }
  return match;
}

async function setPlayerActiveMatch(svc: any, userId: string, matchId: string, channelId = '') {
  const rows = await svc.PlayerState.filter({ player_id: String(userId) }, '-updated_date', 20).catch(() => []);
  if (rows.length) {
    await Promise.all(rows.map((row: Row) => svc.PlayerState.update(row.id, { active_match_id: matchId }).catch(() => null)));
    return;
  }
  if (matchId) {
    await svc.PlayerState.create({ player_id: String(userId), channel_id: channelId || `dashboard_${userId}`, last_update: Date.now(), status: 'online', active_match_id: matchId }).catch(() => null);
  }
}

async function clearMatchForPlayers(svc: any, match: Row | null) {
  if (!match) return;
  await Promise.all((match.player_ids || []).map((id: string) => setPlayerActiveMatch(svc, String(id), '', String(match.dashboard_channel || ''))));
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
      connected_at: '', disconnects: {}, pause_started_at: '', prestige_awards: {}, rewards_finalized: false,
    });
  }
  const stamp = nowIso();
  await Promise.all([
    svc.AIBattleQueueEntry.update(first.id, { status:'matched', match_id:match.id, host_id:match.host_id, opponent_id:second.user_id, matched_at:stamp, last_seen_at:stamp, connected_at:'', connected_session_id:'', ready_at:'' }),
    svc.AIBattleQueueEntry.update(second.id, { status:'matched', match_id:match.id, host_id:match.host_id, opponent_id:first.user_id, matched_at:stamp, last_seen_at:stamp, connected_at:'', connected_session_id:'', ready_at:'' }),
  ]);
  return match;
}
async function tryPair(svc: any, mode: string, callerQueueId = '') {
  const liveRows = (await svc.AIBattleQueueEntry.filter({ mode, status:'waiting' }, '-created_date', 100).catch(() => [])).filter(waitingLive);
  const freshestByUser = new Map<string, Row>();
  for (const row of liveRows) {
    const userId = String(row.user_id || '');
    if (!userId) continue;
    const prior = freshestByUser.get(userId);
    if (!prior || heartbeatAt(row) > heartbeatAt(prior)) freshestByUser.set(userId, row);
  }
  const unique = [...freshestByUser.values()].sort((a: Row, b: Row) => Date.parse(a.queued_at || a.created_date || 0) - Date.parse(b.queued_at || b.created_date || 0)).slice(0, 2);
  if (unique.length !== 2) return null;

  // Only one deterministic queue entry is allowed to create the pair. This
  // removes the race where both clients see the same two waiters and create two
  // matches at once. The newer/second waiter owns creation; the older player will
  // observe the same match on the next status poll.
  const creator = unique[1];
  if (callerQueueId && String(creator.id) !== String(callerQueueId)) return null;

  const fresh = await Promise.all(unique.map((row: Row) => svc.AIBattleQueueEntry.get(row.id).catch(() => null)));
  if (fresh.some((row: Row | null) => !row || !waitingLive(row) || row.status !== 'waiting')) return null;
  return canonicalPairMatch(svc, mode, fresh[0], fresh[1]);
}

async function startMatchIfBothConnected(svc: any, input: Row | null) {
  if (!input || input.status !== 'matched') return { match: input, connected: ['connecting','countdown','fighting'].includes(String(input?.status || '')) };
  const ids = (input.player_ids || []).map(String).filter(Boolean);
  if (ids.length !== 2) return { match: input, connected: false };
  const queues = await Promise.all(ids.map((id: string) => queueForMatch(svc, id, String(input.id))));
  const connected = queues.length === 2 && queues.every((row: Row | null) => Boolean(
    row
    && matchedLive(row)
    && row.connected_at
    && row.connected_session_id
    && String(row.connected_session_id) === String(row.client_session_id || '')
  ));
  if (!connected) return { match: input, connected: false };

  const connectedAt = nowIso();
  const match = await svc.AIBattleMatch.update(input.id, { status: 'connecting', connected_at: connectedAt });
  await Promise.all(ids.map((id: string) => setPlayerActiveMatch(svc, id, String(match.id), String(match.dashboard_channel || ''))));
  return { match, connected: true };
}

async function startMatchIfBothArenaReady(svc: any, input: Row | null) {
  if (!input || input.status !== 'connecting') return { match: input, ready: input?.status === 'countdown' || input?.status === 'fighting' };
  const ids = (input.player_ids || []).map(String).filter(Boolean);
  if (ids.length !== 2) return { match: input, ready: false };
  const queues = await Promise.all(ids.map((id: string) => queueForMatch(svc, id, String(input.id))));
  const ready = queues.length === 2 && queues.every((row: Row | null) => Boolean(row && matchedLive(row) && row.connected_at && row.ready_at));
  if (!ready) return { match: input, ready: false };

  // Arena entry is a second handshake: the pair was already acknowledged by
  // both browser clients before `connecting`, and now both 3D fighters have
  // finished loading. Only then may the server begin the shared countdown.
  let match = await syncFrozenSkillsForMatch(svc, input);
  const start = Date.now() + 3500;
  const atb = turnAtb(match, String(match.host_id || ids[0] || ''), start);
  const players = (match.players || []).map((p: Row) => ({
    ...p,
    hp: finiteHp(p.max_hp, DEFAULT_BATTLE_HP),
    max_hp: finiteHp(p.max_hp, DEFAULT_BATTLE_HP),
  }));
  match = await svc.AIBattleMatch.update(match.id, {
    status: 'countdown', ready_at: nowIso(), fight_starts_at: new Date(start).toISOString(),
    fight_ends_at: new Date(start + 180000).toISOString(), players, atb,
    cooldowns: {}, dodges: {}, pending_hits: [], hit_log: [],
  });
  return { match, ready: true };
}

async function statusFor(svc: any, userId: string, clientSessionId = '', pos: Row | null = null) {
  let queue = await cleanupQueueDuplicates(svc, userId);
  if (!queue) return { queue:null, match:null };
  if (queue.status === 'waiting' && !waitingLive(queue)) { await cancelQueue(svc, queue); return {queue:null,match:null}; }

  let savedMatch: Row | null = null;
  const previousSessionId = String(queue.client_session_id || '');
  const sessionChanged = Boolean(clientSessionId && previousSessionId && clientSessionId !== previousSessionId);
  if (queue.status === 'matched' && queue.match_id) {
    savedMatch = await getMatch(svc, String(queue.match_id));
    if (savedMatch?.status === 'ended' && sessionChanged) {
      await cancelQueue(svc, queue);
      await clearMatchForPlayers(svc, savedMatch);
      return { queue:null, match:null };
    }
  }

  if (heartbeatAt(queue) < Date.now() - QUEUE_HEARTBEAT_MS || (clientSessionId && previousSessionId !== clientSessionId)) {
    const patch: Row = { last_seen_at: nowIso(), client_session_id: clientSessionId || queue.client_session_id || '' };
    // A refreshed browser must perform the pre-arena acknowledgement again while
    // a reservation is still only `matched`. If the arena was already unlocked,
    // only fighter readiness is cleared so the rebuilt model has to load again.
    if (sessionChanged && savedMatch?.status === 'matched') {
      patch.connected_at = '';
      patch.connected_session_id = '';
      patch.ready_at = '';
    } else if (sessionChanged && savedMatch?.status === 'connecting') {
      patch.ready_at = '';
    }
    queue = await svc.AIBattleQueueEntry.update(queue.id, patch);
  }

  if (queue.status === 'waiting') {
    await tryPair(svc, queue.mode, String(queue.id));
    queue = await svc.AIBattleQueueEntry.get(queue.id).catch(() => queue);
    if (queue.status === 'waiting') return { queue, match:null };
  }

  if (queue.status === 'matched' && queue.match_id) {
    let match = await settleMatch(svc, savedMatch && String(savedMatch.id) === String(queue.match_id) ? savedMatch : await getMatch(svc, String(queue.match_id)));
    if (!match) { await cancelQueue(svc, queue); return {queue:null,match:null}; }
    if (match.status === 'matched') {
      const connection = await startMatchIfBothConnected(svc, match);
      match = connection.match;
    }
    if (match?.status === 'connecting') {
      const readiness = await startMatchIfBothArenaReady(svc, match);
      match = readiness.match;
    }
    if (pos && ['countdown','fighting'].includes(String(match?.status || ''))) {
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
      let current=await cleanupQueueDuplicates(svc,userId);
      if(current){
        if(current.status==='waiting'){
          if(String(current.mode)!==mode) return json({error:`You are already queued for ${String(current.mode).toUpperCase()}. Cancel that queue before changing modes.`},409);
          const refreshedAvatar=await getAvatarSnapshot(svc,userId,data);
          current=await svc.AIBattleQueueEntry.update(current.id,{...refreshedAvatar,last_seen_at:nowIso(),client_session_id:sessionId||current.client_session_id||''});
        }
        const state=await statusFor(svc,userId,sessionId); if(state.queue) return json({queue:publicQueue(state.queue),match:publicMatch(state.match),server_time:Date.now()});
      }
      const avatar=await getAvatarSnapshot(svc,userId,data);
      const created=await svc.AIBattleQueueEntry.create({ user_id:userId,player_name:playerName(user),avatar_url:user.avatar_url||user.profile_image||'',...avatar,mode,status:'waiting',request_id:String(data.request_id||'').slice(0,100),client_session_id:sessionId,queued_at:nowIso(),last_seen_at:nowIso(),connected_at:'',connected_session_id:'',ready_at:'' });
      current=await cleanupQueueDuplicates(svc,userId);
      if(current?.id&&String(current.id)===String(created.id)&&current.status==='waiting') await tryPair(svc,mode,String(current.id));
      const state=await statusFor(svc,userId,sessionId);
      return json({queue:publicQueue(state.queue),match:publicMatch(state.match),server_time:Date.now()});
    }
    if (action === 'ack_match') {
      let match=await getMatch(svc,String(data.match_id||''));
      if(!match||(match.player_ids||[]).map(String).includes(userId)===false) return json({error:'Match not found.'},404);
      if(match.status==='ended') return json({error:'This match has ended.',match:publicMatch(match)},409);
      const mine=await queueForMatch(svc,userId,String(match.id));
      if(!mine?.id) return json({error:'Your queue reservation is no longer active.'},409);
      const stamp=nowIso();
      const queue=await svc.AIBattleQueueEntry.update(mine.id,{connected_at:stamp,connected_session_id:sessionId||mine.client_session_id||'',client_session_id:sessionId||mine.client_session_id||'',last_seen_at:stamp,ready_at:''});
      if(match.status==='matched'){
        const connection=await startMatchIfBothConnected(svc,match);
        match=connection.match;
      }
      return json({queue:publicQueue(queue),match:publicMatch(match),connected:['connecting','countdown','fighting'].includes(String(match?.status||'')),server_time:Date.now()});
    }
    if (action === 'cancel' || action === 'reset') {
      const queue=await latestQueue(svc,userId);
      if(queue?.match_id){
        let match=await getMatch(svc,String(queue.match_id));
        if(match&&['matched','connecting'].includes(String(match.status))){
          match=await svc.AIBattleMatch.update(match.id,{status:'ended',winner_id:'',ended_reason:'forfeit',ended_at:nowIso()});
          await clearMatchForPlayers(svc,match);
          await cancelMatchQueues(svc,match);
          return json({queue:null,match:null,server_time:Date.now()});
        }
        if(match&&['countdown','fighting'].includes(String(match.status))){
          const ids=(match.player_ids||[]).map(String);
          const ended=await svc.AIBattleMatch.update(match.id,{status:'ended',winner_id:ids.find((id:string)=>id!==userId)||'',ended_reason:'forfeit',ended_at:nowIso()});
          await finalizeMatchRewards(svc,ended); await clearMatchForPlayers(svc,ended);
        }
      }
      await cancelAllQueuesForUser(svc,userId);
      return json({queue:null,match:null,server_time:Date.now()});
    }
    if (action === 'ready') {
      let match=await getMatch(svc,String(data.match_id||'')); if(!match||(match.player_ids||[]).map(String).includes(userId)===false) return json({error:'Match not found.'},404);
      match=await settleMatch(svc,match);
      if(match.status==='ended') return json({error:'This match has ended.',match:publicMatch(match)},409);
      if(match.status==='matched') return json({error:'Waiting for both players to connect before loading the arena.',match:publicMatch(match)},409);

      // This is the second handshake. It is sent only after this client's two 3D
      // fighters are loaded inside an arena that was unlocked for BOTH clients.
      const mine=await queueForMatch(svc,userId,String(match.id));
      if(mine?.id) await svc.AIBattleQueueEntry.update(mine.id,{ready_at:nowIso(),last_seen_at:nowIso()});
      const readiness=await startMatchIfBothArenaReady(svc,match);
      match=readiness.match;
      return json({match:publicMatch(match),ready:readiness.ready,server_time:Date.now()});
    }
    if (action === 'forfeit') {
      let match=await getMatch(svc,String(data.match_id||'')); if(!match||(match.player_ids||[]).map(String).includes(userId)===false) return json({error:'Match not found.'},404);
      if(['matched','connecting'].includes(String(match.status))){
        match=await svc.AIBattleMatch.update(match.id,{status:'ended',winner_id:'',ended_reason:'forfeit',ended_at:nowIso()});
        await clearMatchForPlayers(svc,match); await cancelMatchQueues(svc,match);
        return json({match:publicMatch(match),server_time:Date.now()});
      }
      const winner=(match.player_ids||[]).map(String).find((id:string)=>id!==userId)||''; match=await svc.AIBattleMatch.update(match.id,{status:'ended',winner_id:winner,ended_reason:'forfeit',ended_at:nowIso()});
      match = await finalizeMatchRewards(svc,match) || match;
      await clearMatchForPlayers(svc,match);
      return json({match:publicMatch(match),server_time:Date.now()});
    }
    if (action === 'dodge') {
      let match=await getMatch(svc,String(data.match_id||'')); if(!match||(match.player_ids||[]).map(String).includes(userId)===false) return json({error:'Match not found.'},404);
      match=await settleMatch(svc,match);
      if(match.status!=='fighting') return json({error:'Fight has not started.'},409);
      if(Object.keys(match.disconnects || {}).length) return json({error:'Match paused while a player reconnects.'},409);
      if(turnPlayerId(match)!==userId) return json({error:'It is not your turn.'},409);
      const now=Date.now(); const currentAtb=atbNow(match.atb?.[userId],now); const cd=Date.parse(match.cooldowns?.[userId]?._dodge||0);
      if(cd>now) return json({error:'Dodge is on cooldown.'},409); if(currentAtb<DODGE.atb_cost) return json({error:'Not enough ATB.'},409);
      const nextPlayer=(match.player_ids||[]).map(String).find((id:string)=>id!==userId)||userId;
      const atb=turnAtb(match,nextPlayer,now);
      const cooldowns={...(match.cooldowns||{}),[userId]:{...(match.cooldowns?.[userId]||{}),_dodge:new Date(now+DODGE.cooldown_ms).toISOString()}};
      const dodges={...(match.dodges||{}),[userId]:{from:new Date(now).toISOString(),until:new Date(now+DODGE.window_ms).toISOString()}};
      match=await svc.AIBattleMatch.update(match.id,{atb,cooldowns,dodges}); return json({match:publicMatch(match),server_time:now});
    }
    if (action === 'basic_attack') {
      let match=await getMatch(svc,String(data.match_id||'')); if(!match||(match.player_ids||[]).map(String).includes(userId)===false) return json({error:'Match not found.'},404);
      match=await settleMatch(svc,match);
      if(match.status!=='fighting') return json({error:'Fight has not started.'},409);
      if(Object.keys(match.disconnects || {}).length) return json({error:'Match paused while a player reconnects.'},409);
      const me=(match.players||[]).find((p:Row)=>String(p.id)===userId); const target=(match.players||[]).find((p:Row)=>String(p.id)!==userId);
      if(!me||!target) return json({error:'Fighters are not ready.'},409);
      if(turnPlayerId(match)!==userId) return json({error:'It is not your turn.'},409);
      const now=Date.now(); const myCooldowns=match.cooldowns?.[userId]||{};
      if(Date.parse(myCooldowns._melee||0)>now) return json({error:'Melee attack is recovering.'},409);
      if(now-Number(myCooldowns._last_cast_at||0)<400) return json({error:'Acting too quickly.'},409);
      const currentAtb=atbNow(match.atb?.[userId],now); if(currentAtb<BASIC_MELEE.atb_cost) return json({error:'Not enough ATB for a melee attack.'},409);
      const storedA=clampPos(match,userId,match.positions?.[userId]||{}); const targetId=String(target.id); const storedT=clampPos(match,targetId,match.positions?.[targetId]||{});
      const proposedA=clampPos(match,userId,data.attacker_pos||storedA); const proposedT=clampPos(match,targetId,data.target_pos||storedT);
      const attackerPos=distance2D(proposedA,storedA)>3?storedA:proposedA; const targetPos=distance2D(proposedT,storedT)>3?storedT:proposedT;
      // Basic attack is a lock-on command. Arena distance never rejects it;
      // positions are only sanitized/stored for shared movement state.
      const damage=Number(BASIC_MELEE.base_damage);
      const castId=String(data.cast_id||crypto.randomUUID());
      const targetHpBefore=finiteHp(target.hp,DEFAULT_BATTLE_HP);
      const targetHpAfter=Math.max(0,targetHpBefore-damage);
      const players=(match.players||[]).map((p:Row)=>String(p.id)===targetId?{...p,hp:targetHpAfter}:p);
      const resolvedAt=nowIso();
      const result={cast_id:castId,attacker_id:userId,target_id:targetId,slot:-1,effect_id:BASIC_MELEE.id,result:'hit',damage,crit:false,hp_after:targetHpAfter,resolved_at:resolvedAt};
      const hitLog=[...(match.hit_log||[]),result].slice(-20);
      const attackRevision=Number(match.attack_revision||0)+1;
      // A default melee strike is a real turn/action, not a free extra hit. Once
      // committed it spends the current action budget and restarts ATB from 0.
      const atb=turnAtb(match,targetId,now);
      const cooldowns={...(match.cooldowns||{}),[userId]:{...myCooldowns,_melee:new Date(now+BASIC_MELEE.cooldown_ms).toISOString(),_last_cast_at:now}};
      const positions={...(match.positions||{}),[userId]:attackerPos,[targetId]:targetPos};
      const ended=targetHpAfter<=0;
      match=await svc.AIBattleMatch.update(match.id,{players,hit_log:hitLog,attack_revision:attackRevision,last_attack:{...result,revision:attackRevision},atb,cooldowns,positions,...(ended?{status:'ended',winner_id:userId,ended_reason:'ko',ended_at:resolvedAt}:{})});
      if(ended){match=await finalizeMatchRewards(svc,match)||match;await clearMatchForPlayers(svc,match);}
      return json({match:publicMatch(match),cast:{cast_id:castId,slot:-1,effect_id:BASIC_MELEE.id,resolves_at:resolvedAt,damage,crit:false,target_id:targetId,range_m:BASIC_MELEE.range_m,atb_cost:BASIC_MELEE.atb_cost,lock_on:true},server_time:now});
    }
    if (action === 'use_skill') {
      let match=await getMatch(svc,String(data.match_id||'')); if(!match||(match.player_ids||[]).map(String).includes(userId)===false) return json({error:'Match not found.'},404);
      match=await settleMatch(svc,match);
      if(match.status!=='fighting') return json({error:'Fight has not started.'},409);
      if(Object.keys(match.disconnects || {}).length) return json({error:'Match paused while a player reconnects.'},409);
      const me=(match.players||[]).find((p:Row)=>String(p.id)===userId); const target=(match.players||[]).find((p:Row)=>String(p.id)!==userId); const slot=Number(data.slot);
      if(turnPlayerId(match)!==userId) return json({error:'It is not your turn.'},409);
      if(!Number.isInteger(slot)||slot<0||slot>=SKILL_SLOT_COUNT) return json({error:'Invalid skill slot.'},400);
      const skill=(me?.skills||[]).find((s:Row)=>Number(s.slot)===slot); if(!skill) return json({error:'That skill is not equipped.'},409);
      // Recheck legacy frozen loadouts against the avatar captured for this match.
      const compatibilityError=avatarSkillError(skill,me?.gender);
      if(compatibilityError) return json({error:compatibilityError},409);
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
      const atb=turnAtb(match,targetId,now);
      const cooldowns={...(match.cooldowns||{}),[userId]:{...myCooldowns,[String(slot)]:new Date(now+Number(skill.cooldown_ms||3000)).toISOString(),_last_cast_at:now}};
      const positions={...(match.positions||{}),[userId]:attackerPos,[targetId]:targetPos};
      match=await svc.AIBattleMatch.update(match.id,{pending_hits:pending,atb,cooldowns,positions});
      return json({match:publicMatch(match),cast:{cast_id:castId,slot,effect_id:skill.effect_id||'',clip_name:skill.clip_name||'',animation_effect:skill.animation_effect||{},resolves_at:resolvesAt,damage,crit,target_id:targetId},server_time:now});
    }

    return json({error:'Unknown AI Battle action.'},400);
  } catch(error){console.error('[aiBattleMatchmaker]',error);return json({error:error?.message||'AI Battle request failed.'},Number(error?.status||500));}
});
