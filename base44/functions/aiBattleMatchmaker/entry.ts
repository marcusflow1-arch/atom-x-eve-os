import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

type Row = Record<string, any>;
const MODES = new Set(['pvp', 'pve', 'world_boss']);
const QUEUE_LIVE_MS = 30000;
const QUEUE_HEARTBEAT_MS = 8000;
const DASHBOARD_LIVE_MS = 60000;

const nowIso = () => new Date().toISOString();
const playerName = (user: Row) => user.full_name || user.username || user.display_name || 'Player';
const queueHeartbeatAt = (row: Row) => Date.parse(row?.last_seen_at || row?.queued_at || 0);
const isQueueLive = (row: Row) => ['waiting', 'matched'].includes(String(row?.status || '')) && queueHeartbeatAt(row) > Date.now() - QUEUE_LIVE_MS;
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
  if (match.status !== 'ended') {
    await svc.AIBattleMatch.update(match.id, { status: 'ended', ended_at: nowIso() });
  }
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
  const queue = await latestQueueForUser(svc, userId);
  await retireQueueAndLinkedMatch(svc, queue);
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
    svc.AIBattleQueueEntry.update(first.id, {
      status: 'matched',
      match_id: match.id,
      host_id: match.host_id,
      opponent_id: second.user_id,
      matched_at: matchedAt,
      last_seen_at: matchedAt,
    }),
    svc.AIBattleQueueEntry.update(second.id, {
      status: 'matched',
      match_id: match.id,
      host_id: match.host_id,
      opponent_id: first.user_id,
      matched_at: matchedAt,
      last_seen_at: matchedAt,
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

/**
 * Queue state belongs to the authenticated account, not to a specific browser
 * origin or Base44 surface. Editor preview and published/live may both poll the
 * same queue and match. A client_session_id is accepted only as diagnostics and
 * never invalidates another surface for the same user.
 */
async function statusFor(svc: any, userId: string, clientSessionId = '') {
  let queue = await latestQueueForUser(svc, userId);
  if (!queue) return { queue: null, match: null };

  if (!isQueueLive(queue)) {
    await retireQueueAndLinkedMatch(svc, queue);
    return { queue: null, match: null };
  }

  // Any authenticated surface for this user can keep the same explicitly-created
  // queue alive. Reading status never creates a queue and therefore cannot put a
  // user into matchmaking by itself.
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

    // Both player accounts must still have a live matched queue. It does not
    // matter whether each player is using editor preview, published/live, or has
    // both open at once. If an account disappears entirely past the TTL, both
    // sides are released and must explicitly queue again.
    const pairAlive = await validateMatchedPair(svc, match);
    if (!pairAlive) {
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

      // If this account is already waiting or matched, another surface must join
      // that same state rather than destroy/recreate it. This is what lets editor
      // preview and published/live show the same PvP match simultaneously.
      const existing = await latestQueueForUser(svc, String(user.id));
      if (existing) {
        const current = await statusFor(svc, String(user.id), clientSessionId);
        if (current.queue) {
          return json({ queue: publicQueue(current.queue), match: publicMatch(current.match), server_time: Date.now() });
        }
      }

      if (requestId) {
        const prior = await svc.AIBattleQueueEntry.filter({ user_id: user.id, request_id: requestId }, '-created_date', 5);
        const activePrior = prior.find((row: Row) => row.status === 'waiting' || row.status === 'matched');
        if (activePrior) {
          const current = await statusFor(svc, String(user.id), clientSessionId);
          return json({ queue: publicQueue(current.queue), match: publicMatch(current.match), server_time: Date.now() });
        }
      }

      // A brand-new queue row is ONLY created by explicit Enter Queue. Status,
      // opening AI Battle, opening the editor, or opening the published app never
      // creates matchmaking state.
      await cancelOtherWaiting(svc, String(user.id));

      const created = await svc.AIBattleQueueEntry.create({
        user_id: String(user.id),
        player_name: playerName(user),
        avatar_url: user.avatar_url || user.profile_image || '',
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
      // Cancel is account-wide and intentionally tears down a linked match for
      // both players. The remaining player never stays trapped on Connecting.
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
      if (!match || !(match.player_ids || []).map(String).includes(String(user.id))) return json({ error: 'Match not found.' }, 404);
      if (match.status === 'ended') return json({ error: 'This match has ended.' }, 409);
      if (String(match.mode || '') !== 'pvp') return json({ error: 'Turn passing is only enabled for PvP.' }, 409);
      if (!(await validateMatchedPair(svc, match))) {
        await cancelMatchForAll(svc, match);
        return json({ error: 'The other player disconnected. Both players must re-queue.' }, 409);
      }

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
