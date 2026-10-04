import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/components/auth/AuthContext';
import useAIBattleQueue, { announceAIBattleNotice, OPPONENT_LEFT_NOTICE } from '@/components/battle/useAIBattleQueue';
import AIBattleSessionBridge from '@/components/battle/AIBattleSessionBridge';
import AIBattleQueueStatus from '@/components/battle/AIBattleQueueStatus';
import PvPArenaStage from '@/components/battle/PvPArenaStage';
import ErrorBoundary from '@/components/ErrorBoundary';
import { clearAIBattlePostMatch, setAIBattleDashboardMode, setAIBattleParticipants, setAIBattlePostMatch, useAIBattleSurfaceState } from '@/components/battle/aiBattleSurfaceState';

const ARENA_STATUSES = ['connecting', 'countdown', 'fighting', 'ended'];

/**
 * The single owner of AI Battle matchmaking on the dashboard page.
 *
 * It is mounted once at the top of LunaTemplate, outside every dashboard panel,
 * focus mode and section switch. Previously the arena lived deep inside the
 * avatar card tree, so pressing C, opening focus mode, changing sections or
 * toggling the UI unmounted the fight and the player appeared to be kicked out.
 * Here the arena stays mounted for as long as the server says the match is
 * live, and a reload reconnects automatically on the first status poll.
 */
export default function AIBattleHost() {
  const { user } = useAuth();
  const battle = useAIBattleQueue({ sessionBridge: true, polling: true });
  const match = battle.match;
  const surface = useAIBattleSurfaceState();
  const isParticipant = Boolean(match?.id && user?.id && (match.player_ids || []).map(String).includes(String(user.id)));
  const matchStatus = String(match?.status || '');
  const dashboardModeForMatch = surface.dashboardMode && String(surface.matchId || '') === String(match?.id || '');
  // An active PvP match can be temporarily viewed from the Luna dashboard.
  // The server-side match and queue keep running; only the arena presentation
  // is hidden. Results always take over again so victory/defeat is not missed.
  const showArena = isParticipant
    && ARENA_STATUSES.includes(matchStatus)
    && (matchStatus === 'ended' || !dashboardModeForMatch);

  // A reservation that falls through (the opponent backed out or left) now puts
  // this player straight back in the queue. Say so, rather than silently
  // swapping the arena for the queue indicator.
  const previousStatus = useRef('');
  const previousMatchId = useRef('');
  const queueStatus = String(battle.queue?.status || '');
  useEffect(() => {
    const before = previousStatus.current;
    previousStatus.current = matchStatus;
    if (['matched', 'connecting'].includes(before) && !matchStatus && queueStatus === 'waiting') {
      announceAIBattleNotice(OPPONENT_LEFT_NOTICE);
    }
  }, [matchStatus, queueStatus]);

  useEffect(() => {
    const nextId = String(match?.id || '');
    if (previousMatchId.current && previousMatchId.current !== nextId) setAIBattleDashboardMode(false, '');
    previousMatchId.current = nextId;
    if (!nextId || matchStatus === 'ended') setAIBattleDashboardMode(false, nextId);
  }, [match?.id, matchStatus]);

  useEffect(() => {
    const ids = (match?.player_ids || []).map(String).filter(Boolean);
    if (ids.length) {
      setAIBattleParticipants(ids);
      return undefined;
    }
    // Keep the just-finished PvP roster quarantined briefly while dashboard
    // presence heartbeats age out, so a random opponent never flashes as a
    // normal party/dashboard guest after the result screen closes.
    const timer = window.setTimeout(() => setAIBattleParticipants([]), 20000);
    return () => window.clearTimeout(timer);
  }, [match?.id, match?.player_ids]);

  useEffect(() => {
    if (match?.id && matchStatus === 'ended' && (match.players || []).length === 2) {
      setAIBattlePostMatch({
        matchId: String(match.id),
        winnerId: String(match.winner_id || ''),
        endedReason: String(match.ended_reason || ''),
        hostId: String(match.host_id || ''),
        playerIds: (match.player_ids || []).map(String),
        players: (match.players || []).map((player) => ({ ...player })),
        finishedAt: Date.now(),
      });
    } else if (match?.id && ['matched', 'connecting', 'countdown', 'fighting'].includes(matchStatus)) {
      clearAIBattlePostMatch();
    }
  }, [match?.id, matchStatus, match?.winner_id, match?.ended_reason, match?.host_id, match?.player_ids, match?.players]);

  useEffect(() => {
    const requestRematch = async (event) => {
      const opponentId = String(event?.detail?.opponentId || '');
      if (!opponentId || !user?.id) return;
      try {
        clearAIBattlePostMatch();
        await battle.join('pvp', { preferredOpponentId: opponentId });
      } catch (error) {
        console.warn('[AI Battle] rematch queue failed', error);
        // Restore the post-match view if queueing failed so the player does not
        // lose the opponent card/actions because of a transient request error.
        if (match?.status === 'ended' && (match.players || []).length === 2) {
          setAIBattlePostMatch({ matchId: String(match.id), winnerId: String(match.winner_id || ''), endedReason: String(match.ended_reason || ''), hostId: String(match.host_id || ''), playerIds: (match.player_ids || []).map(String), players: (match.players || []).map((player) => ({ ...player })), finishedAt: Date.now() });
        }
      }
    };
    const dismissPostMatch = () => clearAIBattlePostMatch();
    window.addEventListener('lunaAIBattleRematchRequest', requestRematch);
    window.addEventListener('lunaAIBattlePostMatchDismiss', dismissPostMatch);
    return () => {
      window.removeEventListener('lunaAIBattleRematchRequest', requestRematch);
      window.removeEventListener('lunaAIBattlePostMatchDismiss', dismissPostMatch);
    };
  }, [battle.join, match, user?.id]);

  if (!user?.id || typeof document === 'undefined') return null;
  return createPortal(
    <>
      <AIBattleSessionBridge battle={battle} />
      {!showArena && !dashboardModeForMatch && <AIBattleQueueStatus battle={battle} />}
      {showArena && (
        <div className="fixed inset-0 z-[220]" data-ai-battle-arena-host>
          {/* An arena crash must not take the whole dashboard down. Reloading
              reconnects to the same match automatically. */}
          <ErrorBoundary key={match.id}>
            <PvPArenaStage match={match} serverOffsetMs={battle.serverOffsetMs} />
          </ErrorBoundary>
        </div>
      )}
    </>,
    document.body,
  );
}
