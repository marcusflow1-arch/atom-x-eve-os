import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

type Row = Record<string, any>;
const MODES = new Set(['pvp', 'pve', 'world_boss']);
const QUEUE_LIVE_MS = 45000;
const QUEUE_HEARTBEAT_MS = 15000;
const DASHBOARD_LIVE_MS = 60000;

const nowIso = () => new Date().toISOString();
const playerName = (user: Row) => user.full_name || user.username || user.display_name || 'Player';
const queueHeartbeatAt = (row: Row) => Date.parse(row?.last_seen_at || row?.queued_at || 0);
const isQueueLive = (row: Row) => row?.status === 'waiting' && queueHeartbeatAt(row) > Date.now() - QUEUE_LIVE_MS;
const isDashboardLive = (row: Row) => row?.status !== 'offline' && Number(row?.last_update || 0) > Date.now() - DASHBOARD_LIVE_MS;
const json = (body: any, status = 200) => Response.json(body, { status });

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

async function cancelOtherWaiting(svc: any, userId: string, exceptId = '') {
  const rows = await svc.AIBattleQueueEntry.filter({ user_id: userId, status: 'waiting' }, '-created_date', 30);
  await Promise.all(rows.filter((row: Row) => String(row.id) !== String(exceptId)).map((row: Row) => svc.AIBattleQueueEntry.update(row.id, { status: 'cancelled' })));
}

async function retireCurrentMatch(svc: any, userId: string) {
  const queue = await latestQueueForUser(svc, userId);
  if (!queue) return;

  if (queue.status === 'waiting') {
    await svc.AIBattleQueueEntry.update(queue.id, { status: 'cancelled' });
    return;
  }

  if (queue.status === 'matched') {
    await svc.AIBattleQueueEntry.update(queue.id, { status: 'cancelled' });
    if (queue.match_id) {
      const match = await getMatch(svc, String(queue.match_id));
      if (match && match.status !== 'ended') {
        await svc.AIBattleMatch.update(match.id, { status: 'ended', ended_at: nowIso() });
      }
    }
  }
}

async function canonicalPairMatch(svc: any, mode: string, first: Row, second: Row) {
  const ids = [String(first.user_id), String(second.user_id)];
  const pairKey = `${mode}:${[...ids].sort().join(':')}`;
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
      players: [
        { id: String(first.user_id), name: first.player_name || 'Player', avatar_url: first.avatar_url || '' },
        { id: String(second.user_id), name: second.player_name || 'Player', avatar_url: second.avatar_url || '' },
      ],
      current_turn_id: String(first.user_id),
      turn_revision: 0,
      turn_started_at: nowIso(),
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
    svc.AIBattleQueueEntry.update(first.id, { status: 'matched', match_id: match.id, host_id: match.host_id, opponent_id: second.user_id, matched_at: matchedAt }),
    svc.AIBattleQueueEntry.update(second.id, { status: 'matched', match_id: match.id, host_id: match.host_id, opponent_id: first.user_id, matched_at: matchedAt }),
  ]);
  return match;
}

async function tryPairMode(svc: any, mode: string) {
  const rows = await svc.AIBattleQueueEntry.filter({ mode, status: 'waiting' }, 'created_date', 100);
  const liveRows = rows.filter(isQueueLive).sort((a: Row, b: Row) => String(a.created_date).localeCompare(String(b.created_date)) || String(a.id).localeCompare(String(b.id)));
  const unique: Row[] = [];
  const seen = new Set<string>();
  for (const row of liveRows) {
    const id = String(row.user_id);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    unique.push(row);
    if (unique.length === 2) break;
  }
  if (unique.length < 2) return null;
  return await canonicalPairMatch(svc, mode, unique[0], unique[1]);
}

async function statusFor(svc: any, userId: string) {
  let queue = await latestQueueForUser(svc, userId);
  if (!queue) return { queue: null, match: null };

  if (queue.status === 'waiting') {
    if (!isQueueLive(queue)) {
      await svc.AIBattleQueueEntry.update(queue.id, { status: 'cancelled' });
      return { queue: null, match: null };
    }

    // Status reads are frequent. Only persist a queue heartbeat occasionally so
    // polling cannot turn into a database-write storm and trip Base44 limits.
    if (queueHeartbeatAt(queue) < Date.now() - QUEUE_HEARTBEAT_MS) {
      queue = await svc.AIBattleQueueEntry.update(queue.id, { last_seen_at: nowIso() });
    }

    const paired = await tryPairMode(svc, queue.mode);
    queue = await svc.AIBattleQueueEntry.get(queue.id).catch(() => queue);
    if (paired && (paired.player_ids || []).map(String).includes(String(userId))) return { queue, match: paired };
  }

  if (queue.status === 'matched' && queue.match_id) {
    const match = await getMatch(svc, String(queue.match_id));
    if (match && match.status !== 'ended') return { queue, match };
  }

  return { queue, match: null };
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

    if (action === 'status') {
      const current = await statusFor(svc, String(user.id));
      return json({ queue: publicQueue(current.queue), match: publicMatch(current.match), server_time: Date.now() });
    }

    if (action === 'join') {
      const mode = String(data.mode || '').toLowerCase();
      if (!MODES.has(mode)) return json({ error: 'Choose PvP, PvE, or World Boss.' }, 400);
      const requestId = String(data.request_id || '').slice(0, 100);

      if (requestId) {
        const prior = await svc.AIBattleQueueEntry.filter({ user_id: user.id, request_id: requestId }, '-created_date', 5);
        if (prior[0]) {
          const match = prior[0].match_id ? await getMatch(svc, String(prior[0].match_id)) : null;
          return json({ queue: publicQueue(prior[0]), match: publicMatch(match), server_time: Date.now() });
        }
      }

      // Enter Queue is always an explicit fresh matchmaking request. A previous
      // ready/matched dashboard must never trap the user out of the queue button.
      await retireCurrentMatch(svc, String(user.id));
      await cancelOtherWaiting(svc, String(user.id));

      const created = await svc.AIBattleQueueEntry.create({
        user_id: String(user.id),
        player_name: playerName(user),
        avatar_url: user.avatar_url || user.profile_image || '',
        mode,
        status: 'waiting',
        request_id: requestId,
        queued_at: nowIso(),
        last_seen_at: nowIso(),
      });
      const match = await tryPairMode(svc, mode);
      const queue = await svc.AIBattleQueueEntry.get(created.id).catch(() => created);
      return json({ queue: publicQueue(queue), match: publicMatch(match && (match.player_ids || []).map(String).includes(String(user.id)) ? match : null), server_time: Date.now() });
    }

    if (action === 'cancel' || action === 'reset') {
      await retireCurrentMatch(svc, String(user.id));
      return json({ queue: null, match: null, server_time: Date.now() });
    }

    if (action === 'ready') {
      const match = await getMatch(svc, String(data.match_id || ''));
      if (!match || !(match.player_ids || []).map(String).includes(String(user.id))) return json({ error: 'Match not found.' }, 404);
      if (match.status === 'ended') return json({ error: 'This match has ended.' }, 409);

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
      if (!match || !(match.player_ids || []).map(String).includes(String(user.id))) return json({ error: 'Match not found.' }, 404);
      if (match.status === 'ended') return json({ error: 'This match has ended.' }, 409);
      if (String(match.mode || '') !== 'pvp') return json({ error: 'Turn passing is only enabled for PvP.' }, 409);

      const ids = (match.player_ids || []).map(String);
      const actorId = String(match.current_turn_id || match.host_id || ids[0] || '');
      if (actorId !== String(user.id)) {
        return json({ error: 'It is not your turn.', match: publicMatch(match), server_time: Date.now() }, 409);
      }

      const revision = Number(match.turn_revision || 0);
      const expected = Number(data.expected_revision);
      if (Number.isFinite(expected) && expected !== revision) {
        return json({ error: 'Turn state changed. Refreshing match.', match: publicMatch(match), server_time: Date.now() }, 409);
      }

      const nextId = ids.find((id: string) => id !== actorId);
      if (!nextId) return json({ error: 'Opponent not found.' }, 409);

      const updated = await svc.AIBattleMatch.update(match.id, {
        current_turn_id: nextId,
        turn_revision: revision + 1,
        turn_started_at: nowIso(),
      });

      return json({
        match: publicMatch(updated),
        previous_turn_id: actorId,
        current_turn_id: nextId,
        server_time: Date.now(),
      });
    }

    return json({ error: 'Unknown AI Battle action.' }, 400);
  } catch (error) {
    console.error('[aiBattleMatchmaker]', error);
    return json({ error: error?.message || 'AI Battle request failed.' }, Number(error?.status || 500));
  }
});
