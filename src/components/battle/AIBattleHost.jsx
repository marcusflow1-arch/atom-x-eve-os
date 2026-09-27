import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/components/auth/AuthContext';
import useAIBattleQueue, { announceAIBattleNotice, OPPONENT_LEFT_NOTICE } from '@/components/battle/useAIBattleQueue';
import AIBattleSessionBridge from '@/components/battle/AIBattleSessionBridge';
import AIBattleQueueStatus from '@/components/battle/AIBattleQueueStatus';
import PvPArenaStage from '@/components/battle/PvPArenaStage';
import ErrorBoundary from '@/components/ErrorBoundary';

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
  const isParticipant = Boolean(match?.id && user?.id && (match.player_ids || []).map(String).includes(String(user.id)));
  const showArena = isParticipant && ARENA_STATUSES.includes(String(match?.status || ''));

  // A reservation that falls through (the opponent backed out or left) now puts
  // this player straight back in the queue. Say so, rather than silently
  // swapping the arena for the queue indicator.
  const previousStatus = useRef('');
  const matchStatus = String(match?.status || '');
  const queueStatus = String(battle.queue?.status || '');
  useEffect(() => {
    const before = previousStatus.current;
    previousStatus.current = matchStatus;
    if (['matched', 'connecting'].includes(before) && !matchStatus && queueStatus === 'waiting') {
      announceAIBattleNotice(OPPONENT_LEFT_NOTICE);
    }
  }, [matchStatus, queueStatus]);

  if (!user?.id || typeof document === 'undefined') return null;
  return createPortal(
    <>
      <AIBattleSessionBridge battle={battle} />
      {!showArena && <AIBattleQueueStatus battle={battle} />}
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
