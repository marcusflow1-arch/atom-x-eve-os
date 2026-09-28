import { createClientFromRequest } from 'npm:@base44/sdk@0.8.51';
import { MALE_MODEL, FEMALE_MODEL } from '../../shared/avatarDefaults.ts';
import { BASIC_MELEE, DODGE, atbNow, skillStats, skillStunMs, SKILL_SLOT_COUNT } from '../../shared/pvpSkills.ts';
import { avatarSkillError, skillEquipStatus } from '../../shared/skillEligibility.ts';
import { grantAchievement } from '../../shared/rewardEngine.ts';
import { loadCombatProfile } from '../../shared/combatProfile.ts';
import { loadCombatSkills } from '../../shared/combatSkills.ts';
import { resolveCombatHit } from '../../shared/combatStats.ts';

type Row = Record<string, any>;
const MODES = new Set(['pvp', 'pve', 'world_boss']);
const WAITING_LIVE_MS = 60000;
const MATCH_LIVE_MS = 45000;
const RECONNECT_GRACE_MS = 120000;
const QUEUE_TOUCH_MS = 5000;
const QUEUE_OWNER_RECOVER_MS = 120000;
// A reserved pair must finish its handshakes within these windows. Without a
// deadline, a pair whose second browser vanished stayed in `matched`/`connecting`
// forever: the remaining player was stuck on "waiting for opponent", and every
// later Queue press "reconnected" them into that dead match instead of queueing.
const PREFIGHT_MATCHED_MS = 90000;
const PREFIGHT_CONNECTING_MS = 180000;
const PREFIGHT_STATUSES = new Set(['matched', 'connecting']);
const POSITION_EPSILON_M = 0.05;
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
// A failed read (rate limit, timeout, 5xx) is NOT the same as "no row". Queue and
// match state is only ever cancelled/cleared from rows we actually read. Failures
// propagate to the request handler, which answers 5xx; the client keeps its last
// known state and simply retries on the next poll instead of being kicked out.
const isNotFound = (error: any) => Number(error?.status || error?.response?.status || 0) === 404
  || /not[\s_-]?found/i.test(String(error?.message || ''));
async function getOptional(entity: any, id: string) {
  if (!id) return null;
  try {
    return await entity.get(id);
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
}
// One status call used to read the caller's queue rows three or four times
// (duplicate cleanup, reservation lookup, disconnect check). Base44 rate-limits
// the app as a whole, so this per-request memo matters: it serves repeat reads
// of "this user's queue rows" from the first result and drops the memo on any
// queue write so later reads in the same request see the change.
function withQueueReadCache(entities: any) {
  const queue = entities.AIBattleQueueEntry;
  const byUser = new Map<string, Promise<Row[]>>();
  const cachedQueue = {
    filter(query: Row = {}, sort?: string, limit?: number) {
      const keys = Object.keys(query || {});
      if (keys.length === 1 && keys[0] === 'user_id' && sort === '-created_date' && limit === 50) {
        const key = String(query.user_id);
        if (!byUser.has(key)) {
          byUser.set(key, queue.filter(query, sort, limit).catch((error: any) => { byUser.delete(key); throw error; }));
        }
        return byUser.get(key)!.then((rows: Row[]) => (rows || []).map((row: Row) => ({ ...row })));
      }
      return queue.filter(query, sort, limit);
    },
    get: (id: string) => queue.get(id),
    create: async (data: Row) => { byUser.clear(); try { return await queue.create(data); } finally { byUser.clear(); } },
    update: async (id: string, data: Row) => { byUser.clear(); try { return await queue.update(id, data); } finally { byUser.clear(); } },
  };
  return new Proxy(entities, { get: (target: any, name: any) => (name === 'AIBattleQueueEntry' ? cachedQueue : target[name]) });
}
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

// A stunned fighter (e.g. hit by Chidori) cannot act until `until`.
function stunRemainingMs(match: Row, playerId: string, now = Date.now()) {
  const until = Date.parse(match?.stuns?.[String(playerId)]?.until || 0);
  return until > now ? until - now : 0;
}
function stunError(match: Row, playerId: string, now = Date.now()) {
  const left = stunRemainingMs(match, playerId, now);
  return left > 0 ? `You are stunned (${(left / 1000).toFixed(1)}s).` : '';
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
    // The most recent accepted ability cast. Clients use it to start the
    // caster's animation even when the peer-to-peer relay drops the message.
    last_cast: row.last_cast || null,
    stuns: row.stuns || {},
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

async function freezeSkills(svc:any,userId:string,gender:string,combat?:Row) {
  const stats=combat || (await loadCombatProfile(svc,userId)).combat;
  return loadCombatSkills(svc,userId,gender,stats);
}

async function syncFrozenSkillsForMatch(svc: any, match: Row) {
  const players = await Promise.all((match.players || []).map(async (player: Row) => {
    const gender = player.gender === 'female' ? 'female' : 'male';
    try {
      const userId=String(player.id || player.player_id || '');
      const profile=await loadCombatProfile(svc,userId);
      return {...player,combat_stats:profile.combat,hp:profile.combat.max_hp,max_hp:profile.combat.max_hp,skills:await freezeSkills(svc,userId,gender,profile.combat)};
    } catch (error) {
      // Keep the snapshot captured at pairing instead of starting the fight with
      // no abilities because one Skill Book read failed.
      console.error('[aiBattleMatchmaker] skill refresh failed; keeping pairing snapshot', error);
      if (!player.combat_stats) throw error;
      return { ...player, skills: Array.isArray(player.skills) ? player.skills : [] };
    }
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
  // Countdown re-freezes the loadout, so a failed read here must not block pairing.
  const profile = await loadCombatProfile(svc,String(row.user_id));
  const skills = await freezeSkills(svc,String(row.user_id),gender,profile.combat);
  return { id: String(row.user_id), name: row.player_name || 'Player', avatar_url: row.avatar_url || '', gender, model_url: appearance.model_url, appearance, hp:profile.combat.max_hp,max_hp:profile.combat.max_hp,combat_stats:profile.combat,skills };
}

async function getMatch(svc: any, id: string) { return getOptional(svc.AIBattleMatch, id); }
async function activeQueuesForUser(svc: any, userId: string) {
  const rows = await svc.AIBattleQueueEntry.filter({ user_id: userId }, '-created_date', 50);
  return (rows || []).filter((r: Row) => ['waiting','matched'].includes(String(r.status)));
}
async function latestQueue(svc: any, userId: string) {
  const rows = await activeQueuesForUser(svc, userId);
  return rows.find((r: Row) => r.status === 'matched') || rows[0] || null;
}
async function cleanupQueueDuplicates(svc: any, userId: string) {
  const rows = await activeQueuesForUser(svc, userId);
  if (rows.length <= 1) return rows[0] || null;
  // A reserved match always wins. For duplicate waiting rows, keep the OLDEST
  // active request, not the newest. That gives one stable queue identity when
  // rapid/concurrent Queue requests race before the first create becomes visible;
  // every later duplicate converges onto the original row instead of replacing
  // it and making the UI appear to be repeatedly kicked out and re-queued.
  const keep = rows.find((r: Row) => r.status === 'matched') || rows[rows.length - 1];
  await Promise.all(rows.filter((r: Row) => String(r.id) !== String(keep.id)).map((r: Row) => svc.AIBattleQueueEntry.update(r.id, { status: 'cancelled' }).catch(() => null)));
  return keep;
}
async function queueForMatch(svc: any, userId: string, matchId: string) {
  const rows = await svc.AIBattleQueueEntry.filter({ user_id: userId }, '-created_date', 50);
  return rows.find((r: Row) => r.status === 'matched' && String(r.match_id || '') === String(matchId)) || null;
}
async function anyQueueForMatch(svc: any, userId: string, matchId: string) {
  const rows = await svc.AIBattleQueueEntry.filter({ user_id: userId }, '-created_date', 50);
  return rows.find((r: Row) => String(r.match_id || '') === String(matchId)) || null;
}
async function activeMatchForUser(svc: any, userId: string) {
  const states = await svc.PlayerState.filter({ player_id: String(userId) }, '-updated_date', 20);
  for (const state of states || []) {
    const matchId = String(state?.active_match_id || '');
    if (!matchId) continue;
    const match = await getMatch(svc, matchId);
    if (match && match.status !== 'ended' && (match.player_ids || []).map(String).includes(String(userId))) return match;
    if (!match || match.status === 'ended') await svc.PlayerState.update(state.id, { active_match_id: '' }).catch(() => null);
  }
  return null;
}
async function recoverQueueForMatch(svc: any, userId: string, match: Row, clientSessionId = '') {
  const stamp = nowIso();
  const existing = await anyQueueForMatch(svc, userId, String(match.id));
  const player = (match.players || []).find((p: Row) => String(p.id || p.player_id || '') === String(userId)) || {};
  const opponentId = (match.player_ids || []).map(String).find((id: string) => id !== String(userId)) || '';
  const patch: Row = {
    status: 'matched', match_id: String(match.id), host_id: String(match.host_id || ''), opponent_id: opponentId,
    last_seen_at: stamp, connected_at: stamp, connected_session_id: clientSessionId || existing?.client_session_id || '',
    client_session_id: clientSessionId || existing?.client_session_id || '',
  };
  if (existing?.id) return await svc.AIBattleQueueEntry.update(existing.id, patch);
  return await svc.AIBattleQueueEntry.create({
    user_id: String(userId), player_name: player.name || 'Player', avatar_url: player.avatar_url || '',
    avatar_gender: player.gender === 'female' ? 'female' : 'male', avatar_model_url: player.model_url || '', avatar_appearance: player.appearance || {},
    mode: String(match.mode || 'pvp'), status: 'matched', request_id: `reconnect:${match.id}`,
    client_session_id: clientSessionId, queued_at: stamp, last_seen_at: stamp, matched_at: stamp,
    connected_at: stamp, connected_session_id: clientSessionId, ready_at: '', match_id: String(match.id),
    host_id: String(match.host_id || ''), opponent_id: opponentId,
  });
}
async function cancelQueue(svc: any, row: Row | null) { if (row?.id && row.status !== 'cancelled') await svc.AIBattleQueueEntry.update(row.id, { status: 'cancelled' }); }
async function cancelAllQueuesForUser(svc: any, userId: string) {
  const rows = await activeQueuesForUser(svc, userId);
  await Promise.all(rows.map((row: Row) => cancelQueue(svc, row).catch(() => null)));
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
  shifted.stuns = Object.fromEntries(Object.entries(shifted.stuns || {}).map(([id, state]: any) => [id, { ...state, from: shiftIso(state?.from, pauseMs), until: shiftIso(state?.until, pauseMs) }]));
  shifted.cooldowns = Object.fromEntries(Object.entries(shifted.cooldowns || {}).map(([id, values]: any) => [id, Object.fromEntries(Object.entries(values || {}).map(([key, value]: any) => [key, key === '_last_cast_at' && Number.isFinite(Number(value)) ? Number(value) + pauseMs : shiftIso(value, pauseMs)]))]));
  return shifted;
}

// Put a player whose pairing fell through back into the queue. queued_at is
// kept, so they stay at the front of the line.
const requeuePatch = () => ({ status: 'waiting', match_id: '', host_id: '', opponent_id: '', connected_at: '', connected_session_id: '', ready_at: '', last_seen_at: nowIso() });

// When one player backs out of a reserved pair, the other player did nothing
// wrong: return them to the queue instead of cancelling their search as well.
async function releaseOpponentsToQueue(svc: any, match: Row, leavingUserId: string) {
  const others = (match.player_ids || []).map(String).filter((id: string) => id && id !== String(leavingUserId));
  const rows = await Promise.all(others.map((id: string) => queueForMatch(svc, id, String(match.id))));
  await Promise.all(rows.map((row: Row | null) => {
    if (!row?.id) return null;
    return svc.AIBattleQueueEntry.update(row.id, matchedLive(row) ? requeuePatch() : { status: 'cancelled' });
  }));
}

async function settlePrefight(svc: any, match: Row, now = Date.now()) {
  const ids = (match.player_ids || []).map(String).filter(Boolean);
  if (ids.length !== 2) return match;
  const queues = await Promise.all(ids.map((id: string) => queueForMatch(svc, id, String(match.id))));
  const live = queues.map((row: Row | null) => Boolean(row && matchedLive(row)));
  const connecting = match.status === 'connecting';
  const startedAt = Date.parse((connecting ? match.connected_at : '') || match.created_date || '') || 0;
  const timedOut = startedAt > 0 && now - startedAt > (connecting ? PREFIGHT_CONNECTING_MS : PREFIGHT_MATCHED_MS);
  if (!timedOut && live.every(Boolean)) return match;

  // Anyone still present goes straight back to the queue with their original
  // queued_at priority. On a timeout, only players who completed their own
  // handshake are re-queued, so a browser that cannot load the arena does not
  // drag its opponent through the same failed pairing again and again.
  const didTheirPart = (row: Row | null) => Boolean(row && (connecting ? row.ready_at : row.connected_at));
  const ended = await svc.AIBattleMatch.update(match.id, {
    status: 'ended', winner_id: '', ended_reason: 'disconnect', ended_at: new Date(now).toISOString(), pause_started_at: '',
  });
  await Promise.all(queues.map((row: Row | null, index: number) => {
    if (!row?.id) return null;
    const requeue = live[index] && (!timedOut || didTheirPart(row));
    return svc.AIBattleQueueEntry.update(row.id, requeue ? requeuePatch() : { status: 'cancelled' });
  }));
  await clearMatchForPlayers(svc, ended);
  return ended;
}

async function settleMatch(svc: any, input: Row | null) {
  if (!input || input.status === 'ended') return input;
  if (PREFIGHT_STATUSES.has(String(input.status))) return settlePrefight(svc, input);
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
      const missed = Boolean(hit.missed || (dodge && Date.parse(dodge.from || 0) <= resolveAt && Date.parse(dodge.until || 0) >= resolveAt));
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
      const stunMs = !missed && Number(hpAfter) > 0 ? Math.max(0, Number(hit.stun_ms || 0)) : 0;
      const result = { cast_id: hit.cast_id, attacker_id: hit.attacker_id, target_id: hit.target_id, slot: hit.slot, effect_id: hit.effect_id, result: missed ? 'miss' : 'hit', damage: missed ? 0 : hit.damage, crit: !!hit.crit, hp_after: hpAfter, resolved_at: hit.resolves_at, ...(stunMs ? { stun_ms: stunMs } : {}) };
      if (stunMs) {
        // The target is knocked down: they cannot act until the stun ends and
        // lose their pending turn to the attacker.
        match.stuns = { ...(match.stuns || {}), [String(hit.target_id)]: { from: hit.resolves_at, until: new Date(resolveAt + stunMs).toISOString(), cast_id: hit.cast_id, attacker_id: hit.attacker_id } };
        if (turnPlayerId(match) === String(hit.target_id)) match.atb = turnAtb(match, String(hit.attacker_id), now);
      }
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
    stuns: match.stuns || {},
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
      positions: { [host]: { x: 0, z: 5 }, [guest]: { x: 0, z: -5 } }, atb: {}, cooldowns: {}, dodges: {}, stuns: {}, pending_hits: [], hit_log: [], attack_revision: 0, last_attack: null,
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
    cooldowns: {}, dodges: {}, stuns: {}, pending_hits: [], hit_log: [],
  });
  return { match, ready: true };
}

async function statusFor(svc: any, userId: string, clientSessionId = '', pos: Row | null = null) {
  let queue = await cleanupQueueDuplicates(svc, userId);
  let savedMatch: Row | null = null;

  // Once the server has promoted a pair into a real match, PlayerState is the
  // durable recovery pointer. Consult it only when the normal queue pointer is
  // missing/wrong. A waiting row needs no lookup: `join` already recovers a
  // live match before queueing, and skipping it keeps queue polls cheap.
  if (!queue || (queue.status === 'matched' && !queue.match_id)) {
    savedMatch = await activeMatchForUser(svc, userId);
    if (savedMatch) {
      if (queue?.status === 'waiting') await cancelQueue(svc, queue).catch(() => null);
      queue = await recoverQueueForMatch(svc, userId, savedMatch, clientSessionId);
    }
  }
  if (!queue) return { queue:null, match:null };

  // Receiving a status request from the queue owner is itself proof that this
  // browser is still present. Refresh first; never kick an actively polling
  // player merely because the previous stored heartbeat crossed a timeout.
  const priorHeartbeat = heartbeatAt(queue);
  if (queue.status === 'waiting' && priorHeartbeat < Date.now() - QUEUE_OWNER_RECOVER_MS) {
    await cancelQueue(svc, queue);
    return { queue:null, match:null };
  }

  const previousSessionId = String(queue.client_session_id || '');
  const sessionChanged = Boolean(clientSessionId && previousSessionId && clientSessionId !== previousSessionId);
  if (queue.status === 'matched' && queue.match_id) {
    if (!savedMatch || String(savedMatch.id) !== String(queue.match_id)) savedMatch = await getMatch(svc, String(queue.match_id));
    if (savedMatch?.status === 'ended') {
      await cancelQueue(svc, queue);
      await clearMatchForPlayers(svc, savedMatch);
      return { queue:null, match:savedMatch };
    }
  }

  const needsReservationAck = Boolean(
    queue.status === 'matched'
    && savedMatch?.status === 'matched'
    && clientSessionId
    && (!queue.connected_at || String(queue.connected_session_id || '') !== clientSessionId)
  );
  const needsTouch = priorHeartbeat < Date.now() - QUEUE_TOUCH_MS || sessionChanged || needsReservationAck;
  if (needsTouch) {
    const patch: Row = {
      last_seen_at: nowIso(),
      client_session_id: clientSessionId || queue.client_session_id || '',
    };

    // Match acknowledgement is part of the normal status heartbeat. If this
    // client can see the reserved match, it has acknowledged it. This removes
    // the fragile dependency on a separate React effect that was not mounted on
    // every dashboard surface. The arena still waits for BOTH queue rows.
    if (needsReservationAck) {
      patch.connected_at = nowIso();
      patch.connected_session_id = clientSessionId;
      patch.ready_at = '';
    } else if (sessionChanged && savedMatch?.status === 'connecting') {
      // A reconnecting browser must reload its fighter before countdown begins.
      patch.ready_at = '';
    }
    queue = await svc.AIBattleQueueEntry.update(queue.id, patch);
  }

  if (queue.status === 'waiting') {
    const paired = await tryPair(svc, queue.mode, String(queue.id));
    // Re-read only when this call created the pair; otherwise nothing changed.
    if (!paired) return { queue, match:null };
    queue = await getOptional(svc.AIBattleQueueEntry, String(queue.id)) || queue;
    if (queue.status === 'waiting') return { queue, match:null };
  }

  if (queue.status === 'matched' && queue.match_id) {
    const current = savedMatch && String(savedMatch.id) === String(queue.match_id) ? savedMatch : await getMatch(svc, String(queue.match_id));
    if (!current) { await cancelQueue(svc, queue); return {queue:null,match:null}; }
    const statusBeforeSettle = String(current.status || '');
    let match = await settleMatch(svc, current);
    if (match?.status === 'ended' && PREFIGHT_STATUSES.has(statusBeforeSettle)) {
      // The reserved pair was abandoned before the fight began. Report where
      // the player now stands (back in the queue, or out) instead of showing a
      // victory/defeat screen for a fight that never happened.
      const refreshed = await getOptional(svc.AIBattleQueueEntry, String(queue.id));
      if (refreshed?.status === 'waiting') {
        return { queue: refreshed, match: null, notice: 'Your opponent left before the fight started. You are back in the queue with your original place.' };
      }
      return { queue: null, match: null, notice: 'The match could not finish loading, so it was cancelled. Press Queue to find a new opponent.' };
    }
    if (match.status === 'matched') {
      const connection = await startMatchIfBothConnected(svc, match);
      match = connection.match;
    }
    if (match?.status === 'connecting') {
      const readiness = await startMatchIfBothArenaReady(svc, match);
      match = readiness.match;
    }
    if (pos && ['countdown','fighting'].includes(String(match?.status || ''))) {
      const next = clampPos(match, userId, pos);
      const stored = match.positions?.[userId];
      // Positions ride along with every fight poll. Only write when the fighter
      // actually moved so two clients polling twice a second do not generate a
      // constant stream of match writes.
      if (!stored || distance2D(stored, next) > POSITION_EPSILON_M) {
        match = await svc.AIBattleMatch.update(match.id, { positions: { ...(match.positions || {}), [userId]: next } });
      }
    }
    return { queue, match };
  }
  return { queue:null,match:null };
}

Deno.serve(async (req) => {
  try {
    const client = createClientFromRequest(req); const user = await client.auth.me();
    if (!user) return json({ error:'Sign in to use AI Battle.' },401);
    const svc = withQueueReadCache(client.asServiceRole.entities);
    const body = await req.json().catch(()=>({})); const action=String(body?.action||'status'); const data=body?.data||{}; const userId=String(user.id);
    const sessionId=String(data.client_session_id||'').slice(0,160);

    if (action === 'status') {
      const current = await statusFor(svc,userId,sessionId,data.position||null);
      return json({ queue:publicQueue(current.queue), match:publicMatch(current.match), notice:current.notice||null, server_time:Date.now() });
    }
    if (action === 'join') {
      const mode=String(data.mode||'').toLowerCase(); if(!MODES.has(mode)) return json({error:'Choose PvP, PvE, or World Boss.'},400);
      const liveMatch=await activeMatchForUser(svc,userId);
      if(liveMatch){
        await recoverQueueForMatch(svc,userId,liveMatch,sessionId);
        const recovered=await statusFor(svc,userId,sessionId,data.position||null);
        return json({queue:publicQueue(recovered.queue),match:publicMatch(recovered.match),notice:recovered.notice||null,reconnected:Boolean(recovered.match),server_time:Date.now()});
      }
      let current=await cleanupQueueDuplicates(svc,userId);
      if(current){
        if(current.status==='waiting'){
          if(String(current.mode)!==mode) return json({error:`You are already queued for ${String(current.mode).toUpperCase()}. Cancel that queue before changing modes.`},409);
          const refreshedAvatar=await getAvatarSnapshot(svc,userId,data);
          current=await svc.AIBattleQueueEntry.update(current.id,{...refreshedAvatar,last_seen_at:nowIso(),client_session_id:sessionId||current.client_session_id||''});
        }
        const state=await statusFor(svc,userId,sessionId); if(state.queue) return json({queue:publicQueue(state.queue),match:publicMatch(state.match),notice:state.notice||null,server_time:Date.now()});
      }
      const avatar=await getAvatarSnapshot(svc,userId,data);
      const created=await svc.AIBattleQueueEntry.create({ user_id:userId,player_name:playerName(user),avatar_url:user.avatar_url||user.profile_image||'',...avatar,mode,status:'waiting',request_id:String(data.request_id||'').slice(0,100),client_session_id:sessionId,queued_at:nowIso(),last_seen_at:nowIso(),connected_at:'',connected_session_id:'',ready_at:'' });
      current=await cleanupQueueDuplicates(svc,userId);
      if(current?.id&&String(current.id)===String(created.id)&&current.status==='waiting') await tryPair(svc,mode,String(current.id));
      const state=await statusFor(svc,userId,sessionId);
      return json({queue:publicQueue(state.queue),match:publicMatch(state.match),notice:state.notice||null,server_time:Date.now()});
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
    if (action === 'reconnect') {
      let match=await activeMatchForUser(svc,userId);
      if(!match){
        const existingQueue=await latestQueue(svc,userId);
        if(existingQueue?.match_id){
          const queuedMatch=await getMatch(svc,String(existingQueue.match_id));
          if(queuedMatch&&queuedMatch.status!=='ended'&&(queuedMatch.player_ids||[]).map(String).includes(userId)) match=queuedMatch;
        }
      }
      if(!match) return json({error:'There is no active PvP match to reconnect to.'},404);
      await recoverQueueForMatch(svc,userId,match,sessionId);
      const current=await statusFor(svc,userId,sessionId,data.position||null);
      // Never fall back to the pre-settle row: if the pair was abandoned while
      // this player was away, they are back in the queue (or out) — not in a
      // dead arena.
      return json({queue:publicQueue(current.queue),match:publicMatch(current.match),notice:current.notice||null,reconnected:Boolean(current.match),server_time:Date.now()});
    }
    if (action === 'cancel' || action === 'reset') {
      const queue=await latestQueue(svc,userId);
      if(queue?.match_id){
        let match=await getMatch(svc,String(queue.match_id));
        if(match&&['matched','connecting'].includes(String(match.status))){
          match=await svc.AIBattleMatch.update(match.id,{status:'ended',winner_id:'',ended_reason:'forfeit',ended_at:nowIso()});
          await clearMatchForPlayers(svc,match);
          await releaseOpponentsToQueue(svc,match,userId);
          await cancelAllQueuesForUser(svc,userId);
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
        await clearMatchForPlayers(svc,match);
        await releaseOpponentsToQueue(svc,match,userId);
        await cancelAllQueuesForUser(svc,userId);
        return json({queue:null,match:publicMatch(match),server_time:Date.now()});
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
      if(stunError(match,userId)) return json({error:stunError(match,userId)},409);
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
      if(stunError(match,userId)) return json({error:stunError(match,userId)},409);
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
      const resolved = me.combat_stats && target.combat_stats
        ? resolveCombatHit(me.combat_stats,target.combat_stats,me.combat_stats.attack,{dodge:Math.random(),crit:Math.random(),variance:0.95+Math.random()*0.10})
        : {damage:Number(BASIC_MELEE.base_damage),crit:false,missed:false,result:'hit'};
      const {damage,crit,missed}=resolved;
      const castId=String(data.cast_id||crypto.randomUUID());
      const targetHpBefore=finiteHp(target.hp,DEFAULT_BATTLE_HP);
      const targetHpAfter=Math.max(0,targetHpBefore-damage);
      const players=(match.players||[]).map((p:Row)=>String(p.id)===targetId?{...p,hp:targetHpAfter}:p);
      const resolvedAt=nowIso();
      const result={cast_id:castId,attacker_id:userId,target_id:targetId,slot:-1,effect_id:BASIC_MELEE.id,result:resolved.result,damage,crit,hp_after:targetHpAfter,resolved_at:resolvedAt};
      const hitLog=[...(match.hit_log||[]),result].slice(-20);
      const attackRevision=Number(match.attack_revision||0)+1;
      // A default melee strike is a real turn/action, not a free extra hit. Once
      // committed it spends the current action budget and restarts ATB from 0.
      const atb=turnAtb(match,targetId,now);
      const cooldowns={...(match.cooldowns||{}),[userId]:{...myCooldowns,_melee:new Date(now+Math.round(BASIC_MELEE.cooldown_ms/Math.max(1,Number(me.combat_stats?.attack_speed || 1)))).toISOString(),_last_cast_at:now}};
      const positions={...(match.positions||{}),[userId]:attackerPos,[targetId]:targetPos};
      const ended=targetHpAfter<=0;
      match=await svc.AIBattleMatch.update(match.id,{players,hit_log:hitLog,attack_revision:attackRevision,last_attack:{...result,revision:attackRevision},atb,cooldowns,positions,...(ended?{status:'ended',winner_id:userId,ended_reason:'ko',ended_at:resolvedAt}:{})});
      if(ended){match=await finalizeMatchRewards(svc,match)||match;await clearMatchForPlayers(svc,match);}
      return json({match:publicMatch(match),cast:{cast_id:castId,slot:-1,effect_id:BASIC_MELEE.id,resolves_at:resolvedAt,damage,crit,missed,result:resolved.result,target_id:targetId,range_m:BASIC_MELEE.range_m,atb_cost:BASIC_MELEE.atb_cost,lock_on:true},server_time:now});
    }
    if (action === 'use_skill') {
      let match=await getMatch(svc,String(data.match_id||'')); if(!match||(match.player_ids||[]).map(String).includes(userId)===false) return json({error:'Match not found.'},404);
      match=await settleMatch(svc,match);
      if(match.status!=='fighting') return json({error:'Fight has not started.'},409);
      if(Object.keys(match.disconnects || {}).length) return json({error:'Match paused while a player reconnects.'},409);
      const me=(match.players||[]).find((p:Row)=>String(p.id)===userId); const target=(match.players||[]).find((p:Row)=>String(p.id)!==userId); const slot=Number(data.slot);
      if(stunError(match,userId)) return json({error:stunError(match,userId)},409);
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
      let damage:number,crit:boolean,missed=false;
      if(me.combat_stats && target?.combat_stats && skill.rules_version===1){
        ({damage,crit,missed}=resolveCombatHit(me.combat_stats,target.combat_stats,Number(skill.base_damage),{dodge:Math.random(),crit:Math.random(),variance:0.95+Math.random()*0.10}));
      }else{
        crit=Math.random()<0.10;
        damage=Math.round(Number(skill.effective_base_damage||skill.base_damage||40)*(0.95+Math.random()*0.10)*(crit?1.5:1));
      }      const castId=String(data.cast_id||crypto.randomUUID()); const resolvesAt=new Date(now+Number(skill.hit_ms||400)).toISOString();
      const stunMs=skillStunMs(String(skill.effect_id||''),skill);
      const pending=[...(match.pending_hits||[]),{cast_id:castId,attacker_id:userId,target_id:targetId,slot,effect_id:skill.effect_id||'',damage,crit,missed,resolves_at:resolvesAt,...(stunMs?{stun_ms:stunMs}:{})}];
      const atb=turnAtb(match,targetId,now);
      const cooldowns={...(match.cooldowns||{}),[userId]:{...myCooldowns,[String(slot)]:new Date(now+Number(skill.cooldown_ms||3000)).toISOString(),_last_cast_at:now}};
      const positions={...(match.positions||{}),[userId]:attackerPos,[targetId]:targetPos};
      const lastCast={cast_id:castId,attacker_id:userId,target_id:targetId,slot,effect_id:skill.effect_id||'',clip_name:skill.clip_name||'',resolves_at:resolvesAt,cast_at:new Date(now).toISOString(),missed,...(stunMs?{stun_ms:stunMs}:{})};
      match=await svc.AIBattleMatch.update(match.id,{pending_hits:pending,atb,cooldowns,positions,last_cast:lastCast});
      return json({match:publicMatch(match),cast:{cast_id:castId,slot,effect_id:skill.effect_id||'',clip_name:skill.clip_name||'',animation_effect:skill.animation_effect||{},resolves_at:resolvesAt,cast_at:new Date(now).toISOString(),damage,crit,missed,target_id:targetId,...(stunMs?{stun_ms:stunMs}:{})},server_time:now});
    }

    return json({error:'Unknown AI Battle action.'},400);
  } catch(error){console.error('[aiBattleMatchmaker]',error);return json({error:error?.message||'AI Battle request failed.'},Number(error?.status||500));}
});
