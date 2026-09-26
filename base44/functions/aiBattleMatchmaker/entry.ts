import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

type Row = Record<string, any>;
const MODES = new Set(['pvp', 'pve', 'world_boss']);
const QUEUE_LIVE_MS = 30000;
const QUEUE_HEARTBEAT_MS = 8000;
const DASHBOARD_LIVE_MS = 60000;
const DEFAULT_BATTLE_HP = 1000;
const MALE_MODEL = 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/d646be928_Getsuga_Tensho_Character.glb';
const FEMALE_MODEL = '/models/atomxe-artemis-archer.glb';
const APPEARANCE_KEYS = [
  'name','gender','female_model_variant','model_url','base_body_gender','base_body_model_url','appearance_version',
  'style_preset','skin_tone','eye_color','hair_color','skin_tint_enabled','eye_tint_enabled','hair_tint_enabled',
  'complexion','facial_hair','facial_hair_color','tattoo_style','tattoo_placement','tattoo_color','tattoo_opacity',
  'hair_style','hair_length','hair_volume','face_shape','height_scale','body_proportions','material_colors','morph_targets',
  'eyelash_style','hood_enabled','weapon_visible'
];

const nowIso = () => new Date().toISOString();
const playerName = (user: Row) => user.full_name || user.username || user.display_name || 'Player';
const queueHeartbeatAt = (row: Row) => Date.parse(row?.last_seen_at || row?.queued_at || 0);
const isQueueLive = (row: Row) => ['waiting', 'matched'].includes(String(row?.status || '')) && queueHeartbeatAt(row) > Date.now() - QUEUE_LIVE_MS;
const isDashboardLive = (row: Row) => row?.status !== 'offline' && Number(row?.last_update || 0) > Date.now() - DASHBOARD_LIVE_MS;
const json = (body: any, status = 200) => Response.json(body, { status });
const finiteHp = (value: any, fallback = DEFAULT_BATTLE_HP) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

function publicQueue(row: Row | null) {
  if (!row) return null;
  return {
    id: row.id,
    mode: row.mode,
    status: row.status,
    queued_at: row.queued_at,
    match_id: row.match_id || null,
    host_id: row.host_id || null,
    opponent_id: row.opponent_id || null,
    avatar_gender: row.avatar_gender === 'female' ? 'female' : 'male',
  };
}

function publicMatch(row: Row | null) {
  if (!row) return null;
  return {
    id: row.id,
    mode: row.mode,
    status: row.status,
    host_id: row.host_id,
    host_name: row.host_name || 'Player',
    dashboard_channel: row.dashboard_channel,
    player_ids: Array.isArray(row.player_ids) ? row.player_ids : [],
    players: Array.isArray(row.players) ? row.players : [],
    current_turn_id: row.current_turn_id || row.host_id || null,
    turn_revision: Number(row.turn_revision || 0),
    turn_started_at: row.turn_started_at || row.ready_at || null,
    attack_revision: Number(row.attack_revision || 0),
    last_attack: row.last_attack && typeof row.last_attack === 'object' ? row.last_attack : null,
  };
}

async function getAvatarSnapshot(svc: any, userId: string) {
  try {
    const rows = await svc.Avatar.filter({ user_id: userId }, '-updated_date', 1);
    const avatar = rows?.[0] || {};
    const gender = avatar.gender === 'female' ? 'female' : 'male';
    const fallbackModel = gender === 'female' ? FEMALE_MODEL : MALE_MODEL;
    const appearance = Object.fromEntries(
      APPEARANCE_KEYS.filter((key) => avatar[key] !== undefined).map((key) => [key, avatar[key]])
    );

    appearance.gender = gender;
    appearance.model_url = String(avatar.model_url || fallbackModel);
    appearance.base_body_gender = gender;
    appearance.base_body_model_url = String(avatar.base_body_model_url || appearance.model_url || fallbackModel);
    appearance.appearance_version = Math.max(3, Number(avatar.appearance_version || 3));
    if (gender === 'female') appearance.female_model_variant = avatar.female_model_variant || 'artemis_archer';

    return {
      avatar_gender: gender,
      avatar_model_url: appearance.model_url,
      avatar_appearance: appearance,
    };
  } catch (error) {
    console.warn('[aiBattleMatchmaker] avatar snapshot unavailable; queue remains open', error);
    return {
      avatar_gender: 'male',
      avatar_model_url: MALE_MODEL,
      avatar_appearance: {
        gender: 'male',
        model_url: MALE_MODEL,
        base_body_gender: 'male',
        base_body_model_url: MALE_MODEL,
        appearance_version: 3,
      },
    };
  }
}

function matchPlayerFromQueue(row: Row, previous: Row | null = null) {
  const gender = row.avatar_gender === 'female' ? 'female' : 'male';
  const fallbackModel = gender === 'female' ? FEMALE_MODEL : MALE_MODEL;
  const appearance = row.avatar_appearance && typeof row.avatar_appearance === 'object'
    ? { ...row.avatar_appearance, gender }
    : { gender, appearance_version: 3 };
  appearance.model_url = String(appearance.model_url || row.avatar_model_url || fallbackModel);
  appearance.base_body_gender = gender;
  appearance.base_body_model_url = String(appearance.base_body_model_url || appearance.model_url || fallbackModel);
  if (gender === 'female') appearance.female_model_variant = appearance.female_model_variant || 'artemis_archer';

  const maxHp = Math.max(1, finiteHp(previous?.max_hp ?? previous?.maxHp, DEFAULT_BATTLE_HP));
  const hp = Math.min(maxHp, finiteHp(previous?.hp, maxHp));

  return {
    ...(previous || {}),
    id: String(row.user_id),
    name: row.player_name || previous?.name || 'Player',
    avatar_url: row.avatar_url || previous?.avatar_url || '',
    gender,
    model_url: appearance.model_url,
    appearance,
    hp,
    max_hp: maxHp,
  };
}

async function getMatch(svc: any, id: string) {
  if (!id) return null;
  return await svc.AIBattleMatch.get(id).catch(() => null);
}

async function latestQueueForUser(svc: any, userId: string) {
  const rows = await svc.AIBattleQueueEntry.filter({ user_id: userId }, '-created_date', 30);
  return rows.find((row: Row) => row.status === 'waiting' || row.status === 'matched') || null;
}

async function queueForUserAndMatch(svc: any, userId: string, matchId: string) {
  const rows = await svc.AIBattleQueueEntry.filter({ user_id: userId }, '-created_date', 30);
  return rows.find((row: Row) => row.status === 'matched' && String(row.match_id || '') === String(matchId || '')) || null;
}

async function cancelQueueRow(svc: any, row: Row | null) {
  if (!row?.id || row.status === 'cancelled') return;
  await svc.AIBattleQueueEntry.update(row.id, { status: 'cancelled' });
}

async function cancelMatchForAll(svc: any, match: Row | null) {
  if (!match) return;
  const playerIds = (match.player_ids || []).map(String).filter(Boolean);
  const linkedQueues = await Promise.all(playerIds.map((id: string) => queueForUserAndMatch(svc, id, String(match.id))));
  await Promise.all(linkedQueues.filter(Boolean).map((row: Row) => cancelQueueRow(svc, row)));
  if (match.status !== 'ended') await svc.AIBattleMatch.update(match.id, { status: 'ended', ended_at: nowIso() });
}

async function cancelOtherWaiting(svc: any, userId: string, exceptId = '') {
  const rows = await svc.AIBattleQueueEntry.filter({ user_id: userId, status: 'waiting' }, '-created_date', 30);
  await Promise.all(rows.filter((row: Row) => String(row.id) !== String(exceptId)).map((row: Row) => cancelQueueRow(svc, row)));
}

async function retireQueueAndLinkedMatch(svc: any, queue: Row | null) {
  if (!queue) return;
  if (queue.status === 'waiting') {
    await cancelQueueRow(svc, queue);
    return;
  }
  if (queue.status === 'matched') {
    const match = queue.match_id ? await getMatch(svc, String(queue.match_id)) : null;
    if (match) await cancelMatchForAll(svc, match);
    else await cancelQueueRow(svc, queue);
  }
}

async function retireCurrentMatch(svc: any, userId: string) {
  await retireQueueAndLinkedMatch(svc, await latestQueueForUser(svc, userId));
}

async function syncQueueAvatarSnapshot(svc: any, queue: Row, snapshot: Row) {
  if (!queue?.id) return queue;
  const updated = await svc.AIBattleQueueEntry.update(queue.id, snapshot);

  if (queue.status === 'matched' && queue.match_id) {
    const match = await getMatch(svc, String(queue.match_id));
    if (match && match.status !== 'ended') {
      const refreshedQueue = { ...queue, ...snapshot };
      const players = (Array.isArray(match.players) ? match.players : []).map((player: Row) =>
        String(player.id || player.player_id || '') === String(queue.user_id)
          ? matchPlayerFromQueue(refreshedQueue, player)
          : player
      );
      await svc.AIBattleMatch.update(match.id, { players });
    }
  }

  return updated;
}

async function canonicalPairMatch(svc: any, mode: string, first: Row, second: Row) {
  const ids = [String(first.user_id), String(second.user_id)];
  const queueIds = [String(first.id), String(second.id)].sort();
  const pairKey = `${mode}:${[...ids].sort().join(':')}:${queueIds.join(':')}`;
  let matches = await svc.AIBattleMatch.filter({ pair_key: pairKey }, 'created_date', 20);
  let match = matches.find((row: Row) => row.status === 'matched' || row.status === 'ready') || null;

  if (!match) {
    match = await svc.AIBattleMatch.create({
      mode,
      status: 'matched',
      host_id: String(first.user_id),
      host_name: first.player_name || 'Player',
      dashboard_channel: `dashboard_${first.user_id}`,
      pair_key: pairKey,
      player_ids: ids,
      players: [matchPlayerFromQueue(first), matchPlayerFromQueue(second)],
      current_turn_id: String(first.user_id),
      turn_revision: 0,
      turn_started_at: nowIso(),
      attack_revision: 0,
      last_attack: null,
    });

    matches = await svc.AIBattleMatch.filter({ pair_key: pairKey }, 'created_date', 20);
    const active = matches.filter((row: Row) => row.status === 'matched' || row.status === 'ready');
    if (active.length > 1) {
      active.sort((a: Row, b: Row) => String(a.created_date).localeCompare(String(b.created_date)) || String(a.id).localeCompare(String(b.id)));
      match = active[0];
      for (const duplicate of active.slice(1)) {
        if (duplicate.id !== match.id) await svc.AIBattleMatch.update(duplicate.id, { status: 'ended', ended_at: nowIso() });
      }
    }
  }

  const matchedAt = nowIso();
  await Promise.all([
    svc.AIBattleQueueEntry.update(first.id, {
      status: 'matched', match_id: match.id, host_id: match.host_id,
      opponent_id: second.user_id, matched_at: matchedAt, last_seen_at: matchedAt,
    }),
    svc.AIBattleQueueEntry.update(second.id, {
      status: 'matched', match_id: match.id, host_id: match.host_id,
      opponent_id: first.user_id, matched_at: matchedAt, last_seen_at: matchedAt,
    }),
  ]);
  return match;
}

async function tryPairMode(svc: any, mode: string) {
  const rows = await svc.AIBattleQueueEntry.filter({ mode, status: 'waiting' }, 'created_date', 100);
  const liveRows = rows
    .filter(isQueueLive)
    .sort((a: Row, b: Row) => String(a.created_date).localeCompare(String(b.created_date)) || String(a.id).localeCompare(String(b.id)));

  const unique: Row[] = [];
  const seen = new Set<string>();
  for (const row of liveRows) {
    const id = String(row.user_id || '');
    if (!id || seen.has(id)) continue;
    seen.add(id);
    unique.push(row);
    if (unique.length === 2) break;
  }
  if (unique.length < 2) return null;
  return await canonicalPairMatch(svc, mode, unique[0], unique[1]);
}

async function validateMatchedPair(svc: any, match: Row) {
  const ids = (match.player_ids || []).map(String).filter(Boolean);
  if (ids.length !== 2 || new Set(ids).size !== 2) return false;
  const queues = await Promise.all(ids.map((id: string) => queueForUserAndMatch(svc, id, String(match.id))));
  return queues.length === 2 && queues.every((row: Row | null) => row && isQueueLive(row));
}

async function statusFor(svc: any, userId: string, clientSessionId = '') {
  let queue = await latestQueueForUser(svc, userId);
  if (!queue) return { queue: null, match: null };

  if (!isQueueLive(queue)) {
    await retireQueueAndLinkedMatch(svc, queue);
    return { queue: null, match: null };
  }

  if (queueHeartbeatAt(queue) < Date.now() - QUEUE_HEARTBEAT_MS) {
    const patch: Row = { last_seen_at: nowIso() };
    if (clientSessionId) patch.client_session_id = String(clientSessionId).slice(0, 160);
    queue = await svc.AIBattleQueueEntry.update(queue.id, patch);
  }

  if (queue.status === 'waiting') {
    const paired = await tryPairMode(svc, queue.mode);
    queue = await svc.AIBattleQueueEntry.get(queue.id).catch(() => queue);
    if (paired && (paired.player_ids || []).map(String).includes(String(userId))) return { queue, match: paired };
    return { queue, match: null };
  }

  if (queue.status === 'matched' && queue.match_id) {
    const match = await getMatch(svc, String(queue.match_id));
    if (!match || match.status === 'ended') {
      await cancelQueueRow(svc, queue);
      return { queue: null, match: null };
    }
    if (!(await validateMatchedPair(svc, match))) {
      await cancelMatchForAll(svc, match);
      return { queue: null, match: null };
    }
    return { queue, match };
  }

  return { queue: null, match: null };
}

Deno.serve(async (req) => {
  try {
    const client = createClientFromRequest(req);
    const user = await client.auth.me();
    if (!user) return json({ error: 'Sign in to use AI Battle.' }, 401);

    const svc = client.asServiceRole.entities;
    const body = await req.json().catch(() => ({}));
    const action = String(body?.action || 'status');
    const data = body?.data || {};
    const clientSessionId = String(data?.client_session_id || '').slice(0, 160);

    if (action === 'status') {
      const current = await statusFor(svc, String(user.id), clientSessionId);
      return json({ queue: publicQueue(current.queue), match: publicMatch(current.match), server_time: Date.now() });
    }

    if (action === 'join') {
      const mode = String(data.mode || '').toLowerCase();
      if (!MODES.has(mode)) return json({ error: 'Choose PvP, PvE, or World Boss.' }, 400);
      const requestId = String(data.request_id || '').slice(0, 100);
      const avatarSnapshot = await getAvatarSnapshot(svc, String(user.id));

      const existing = await latestQueueForUser(svc, String(user.id));
      if (existing) {
        await syncQueueAvatarSnapshot(svc, existing, avatarSnapshot);
        const current = await statusFor(svc, String(user.id), clientSessionId);
        if (current.queue) return json({ queue: publicQueue(current.queue), match: publicMatch(current.match), server_time: Date.now() });
      }

      if (requestId) {
        const prior = await svc.AIBattleQueueEntry.filter({ user_id: user.id, request_id: requestId }, '-created_date', 5);
        const activePrior = prior.find((row: Row) => row.status === 'waiting' || row.status === 'matched');
        if (activePrior) {
          await syncQueueAvatarSnapshot(svc, activePrior, avatarSnapshot);
          const current = await statusFor(svc, String(user.id), clientSessionId);
          return json({ queue: publicQueue(current.queue), match: publicMatch(current.match), server_time: Date.now() });
        }
      }

      await cancelOtherWaiting(svc, String(user.id));
      const created = await svc.AIBattleQueueEntry.create({
        user_id: String(user.id),
        player_name: playerName(user),
        avatar_url: user.avatar_url || user.profile_image || '',
        ...avatarSnapshot,
        mode,
        status: 'waiting',
        request_id: requestId,
        client_session_id: clientSessionId || '',
        queued_at: nowIso(),
        last_seen_at: nowIso(),
      });

      const match = await tryPairMode(svc, mode);
      const queue = await svc.AIBattleQueueEntry.get(created.id).catch(() => created);
      return json({
        queue: publicQueue(queue),
        match: publicMatch(match && (match.player_ids || []).map(String).includes(String(user.id)) ? match : null),
        server_time: Date.now(),
      });
    }

    if (action === 'cancel' || action === 'reset') {
      await retireCurrentMatch(svc, String(user.id));
      return json({ queue: null, match: null, server_time: Date.now() });
    }

    if (action === 'ready') {
      const match = await getMatch(svc, String(data.match_id || ''));
      if (!match || !(match.player_ids || []).map(String).includes(String(user.id))) return json({ error: 'Match not found.' }, 404);
      if (match.status === 'ended') return json({ error: 'This match has ended.' }, 409);
      if (!(await validateMatchedPair(svc, match))) {
        await cancelMatchForAll(svc, match);
        return json({ error: 'The other player left the queue. Both players must re-queue.' }, 409);
      }

      const room = await svc.PlayerState.filter({ channel_id: match.dashboard_channel });
      const liveIds = new Set(room.filter(isDashboardLive).map((row: Row) => String(row.player_id)));
      const ready = (match.player_ids || []).every((id: string) => liveIds.has(String(id)));
      let updated = match;
      if (ready && (match.status !== 'ready' || !match.current_turn_id)) {
        const patch: Row = {};
        if (match.status !== 'ready') {
          patch.status = 'ready';
          patch.ready_at = nowIso();
        }
        if (!match.current_turn_id) {
          patch.current_turn_id = String(match.host_id || match.player_ids?.[0] || '');
          patch.turn_revision = Number(match.turn_revision || 0);
          patch.turn_started_at = nowIso();
        }
        updated = await svc.AIBattleMatch.update(match.id, patch);
      }
      return json({ match: publicMatch(updated), ready, server_time: Date.now() });
    }

    if (action === 'end_turn') {
      const match = await getMatch(svc, String(data.match_id || ''));
      const userId = String(user.id);
      if (!match || !(match.player_ids || []).map(String).includes(userId)) return json({ error: 'Match not found.' }, 404);
      if (match.status === 'ended') return json({ error: 'This match has ended.' }, 409);
      if (String(match.mode || '') !== 'pvp') return json({ error: 'Turn passing is only enabled for PvP.' }, 409);
      if (!(await validateMatchedPair(svc, match))) {
        await cancelMatchForAll(svc, match);
        return json({ error: 'The other player disconnected. Both players must re-queue.' }, 409);
      }

      const ids = (match.player_ids || []).map(String);
      const actorId = String(match.current_turn_id || match.host_id || ids[0] || '');
      if (actorId !== userId) {
        return json({ error: 'It is not your turn.', match: publicMatch(match), server_time: Date.now() }, 409);
      }

      const revision = Number(match.turn_revision || 0);
      const expected = Number(data.expected_revision);
      if (Number.isFinite(expected) && expected !== revision) {
        return json({ error: 'Turn state changed. Refreshing match.', match: publicMatch(match), server_time: Date.now() }, 409);
      }

      const nextId = ids.find((id: string) => id !== actorId);
      if (!nextId) return json({ error: 'Opponent not found.' }, 409);

      // Damage and turn ownership are committed in the SAME server write. This
      // is the authoritative online path: actor hits opponent -> opponent HP is
      // reduced -> current_turn_id becomes that opponent. Clients never have to
      // independently guess whether the hit or turn happened first.
      const requestedTargetId = String(data.target_player_id || '');
      const rawDamage = Number(data.damage || 0);
      const damage = Number.isFinite(rawDamage) ? Math.max(0, Math.min(100000, rawDamage)) : 0;
      const hasAttack = damage > 0;
      if (hasAttack && requestedTargetId && requestedTargetId !== nextId) {
        return json({ error: 'PvP attack target does not match the active opponent.' }, 409);
      }

      let players = Array.isArray(match.players) ? match.players.map((player: Row) => ({ ...player })) : [];
      let lastAttack = match.last_attack || null;
      let attackRevision = Number(match.attack_revision || 0);

      if (hasAttack) {
        const targetId = nextId;
        let foundTarget = false;
        players = players.map((player: Row) => {
          const playerId = String(player.id || player.player_id || '');
          if (playerId !== targetId) return player;
          foundTarget = true;
          const maxHp = Math.max(1, finiteHp(player.max_hp ?? player.maxHp, DEFAULT_BATTLE_HP));
          const before = Math.min(maxHp, finiteHp(player.hp, maxHp));
          return { ...player, hp: Math.max(0, before - damage), max_hp: maxHp };
        });

        if (!foundTarget) {
          players.push({ id: targetId, name: 'Opponent', hp: Math.max(0, DEFAULT_BATTLE_HP - damage), max_hp: DEFAULT_BATTLE_HP });
        }

        const target = players.find((player: Row) => String(player.id || player.player_id || '') === targetId) || {};
        attackRevision += 1;
        lastAttack = {
          revision: attackRevision,
          turn_revision: revision + 1,
          source_player_id: actorId,
          target_player_id: targetId,
          damage,
          hp_after: finiteHp(target.hp, 0),
          max_hp: Math.max(1, finiteHp(target.max_hp ?? target.maxHp, DEFAULT_BATTLE_HP)),
          effect_id: String(data.effect_id || ''),
          resolved_at: nowIso(),
        };
      }

      const updated = await svc.AIBattleMatch.update(match.id, {
        players,
        current_turn_id: nextId,
        turn_revision: revision + 1,
        turn_started_at: nowIso(),
        attack_revision: attackRevision,
        last_attack: lastAttack,
      });

      return json({
        match: publicMatch(updated),
        previous_turn_id: actorId,
        current_turn_id: nextId,
        attack: hasAttack ? lastAttack : null,
        server_time: Date.now(),
      });
    }

    return json({ error: 'Unknown AI Battle action.' }, 400);
  } catch (error) {
    console.error('[aiBattleMatchmaker]', error);
    return json({ error: error?.message || 'AI Battle request failed.' }, Number(error?.status || 500));
  }
});
