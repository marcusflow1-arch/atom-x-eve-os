import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Audience game-vote backend for streamers.
// Actions:
//   start_vote                - the streamer opens a new vote (closes their previous active one)
//   cast_vote                 - a viewer casts/changes their one ballot for a game
//   end_vote                  - the streamer closes the vote and the backend picks the winner
// The backend owns the one-ballot-per-viewer rule and the winner selection,
// so any frontend (games overlay, chat, etc.) can reuse it.

async function buildTally(base44, sessionId) {
  const ballots = await base44.entities.StreamGameVoteBallot.filter({ session_id: sessionId }, '-created_date', 500);
  const tally = {};
  for (const ballot of ballots) {
    tally[ballot.game_key] = (tally[ballot.game_key] || 0) + 1;
  }
  return { tally, ballots };
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const action = body?.action;

    if (action === 'start_vote') {
      const active = await base44.entities.StreamGameVoteSession.filter({ status: 'active' }, '-created_date', 50);
      for (const session of active) {
        if (session.created_by_id === user.id) {
          await base44.entities.StreamGameVoteSession.update(session.id, { status: 'ended' });
        }
      }
      const session = await base44.entities.StreamGameVoteSession.create({ status: 'active' });
      return Response.json({ session });
    }

    if (action === 'cast_vote') {
      const sessionId = body?.session_id;
      const gameKey = body?.game_key;
      const gameName = body?.game_name || gameKey;
      if (!sessionId || !gameKey) {
        return Response.json({ error: 'session_id and game_key are required' }, { status: 400 });
      }

      const session = await base44.entities.StreamGameVoteSession.get(sessionId);
      if (!session) return Response.json({ error: 'Vote session not found' }, { status: 404 });
      if (session.status !== 'active') return Response.json({ error: 'This vote has ended' }, { status: 400 });

      const existing = await base44.entities.StreamGameVoteBallot.filter(
        { session_id: sessionId, created_by_id: user.id },
        '-created_date',
        10
      );
      if (existing.length) {
        await base44.entities.StreamGameVoteBallot.update(existing[0].id, { game_key: gameKey, game_name: gameName });
      } else {
        await base44.entities.StreamGameVoteBallot.create({
          session_id: sessionId,
          game_key: gameKey,
          game_name: gameName,
          voter_name: user.full_name || user.email || 'Viewer'
        });
      }

      const { tally, ballots } = await buildTally(base44, sessionId);
      return Response.json({ tally, total_votes: ballots.length });
    }

    if (action === 'end_vote') {
      const sessionId = body?.session_id;
      if (!sessionId) return Response.json({ error: 'session_id is required' }, { status: 400 });

      const session = await base44.entities.StreamGameVoteSession.get(sessionId);
      if (!session) return Response.json({ error: 'Vote session not found' }, { status: 404 });
      if (session.created_by_id !== user.id) {
        return Response.json({ error: 'Only the vote host can end this vote' }, { status: 403 });
      }

      const { tally, ballots } = await buildTally(base44, sessionId);
      const entries = Object.entries(tally).sort((a, b) => b[1] - a[1]);
      const top = entries[0] || null;
      const winnerGameName = top ? ((ballots.find((b) => b.game_key === top[0]) || {}).game_name || top[0]) : null;

      const updated = await base44.entities.StreamGameVoteSession.update(sessionId, {
        status: 'ended',
        winner_game_key: top ? top[0] : null,
        winner_game_name: winnerGameName,
        total_votes: ballots.length
      });

      return Response.json({
        session: updated,
        tally,
        winner: top ? { game_key: top[0], game_name: winnerGameName, votes: top[1] } : null
      });
    }

    return Response.json({ error: 'Unknown action. Use start_vote, cast_vote or end_vote.' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}