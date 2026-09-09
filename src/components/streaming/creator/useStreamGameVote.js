import { useCallback, useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';

// Audience game-vote state for the streaming games UI.
// The backend function owns start/cast/end; this hook keeps the UI live
// through entity subscriptions so every viewer sees tallies update in real time.
export default function useStreamGameVote(userId) {
  const [session, setSession] = useState(null);
  const [ballots, setBallots] = useState([]);
  const [busy, setBusy] = useState(false);
  const sessionId = session?.id || null;

  const loadSession = useCallback(async () => {
    try {
      const sessions = await base44.entities.StreamGameVoteSession.filter({ status: 'active' }, '-created_date', 5);
      setSession(sessions[0] || null);
    } catch {
      // entity not reachable yet — leave state unchanged
    }
  }, []);

  const loadBallots = useCallback(async (id) => {
    if (!id) {
      setBallots([]);
      return;
    }
    try {
      const rows = await base44.entities.StreamGameVoteBallot.filter({ session_id: id }, '-created_date', 500);
      setBallots(rows);
    } catch {
      // keep previous ballots on transient errors
    }
  }, []);

  useEffect(() => {
    loadSession();
    const unsubscribe = base44.entities.StreamGameVoteSession.subscribe(loadSession);
    return () => unsubscribe();
  }, [loadSession]);

  useEffect(() => {
    loadBallots(sessionId);
    const unsubscribe = base44.entities.StreamGameVoteBallot.subscribe(() => loadBallots(sessionId));
    return () => unsubscribe();
  }, [sessionId, loadBallots]);

  const tally = useMemo(() => {
    const counts = {};
    for (const ballot of ballots) {
      counts[ballot.game_key] = (counts[ballot.game_key] || 0) + 1;
    }
    return counts;
  }, [ballots]);

  const myBallot = useMemo(
    () => ballots.find((ballot) => ballot.created_by_id === userId) || null,
    [ballots, userId]
  );

  const isHost = !!session && session.created_by_id === userId;

  const startVote = useCallback(async () => {
    setBusy(true);
    try {
      await base44.functions.invoke('streamGameVote', { action: 'start_vote' });
      await loadSession();
    } finally {
      setBusy(false);
    }
  }, [loadSession]);

  const castVote = useCallback(async (gameKey, gameName) => {
    if (!sessionId) return;
    setBusy(true);
    try {
      await base44.functions.invoke('streamGameVote', {
        action: 'cast_vote',
        session_id: sessionId,
        game_key: gameKey,
        game_name: gameName
      });
      await loadBallots(sessionId);
    } finally {
      setBusy(false);
    }
  }, [sessionId, loadBallots]);

  const endVote = useCallback(async () => {
    if (!sessionId) return;
    setBusy(true);
    try {
      await base44.functions.invoke('streamGameVote', { action: 'end_vote', session_id: sessionId });
      await loadSession();
    } finally {
      setBusy(false);
    }
  }, [sessionId, loadSession]);

  return {
    session,
    tally,
    totalVotes: ballots.length,
    myBallot,
    isHost,
    busy,
    startVote,
    castVote,
    endVote
  };
}