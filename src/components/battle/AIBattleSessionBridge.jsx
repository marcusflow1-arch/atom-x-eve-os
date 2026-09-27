import { useEffect, useState } from 'react';
import useAIBattleQueue from '@/components/battle/useAIBattleQueue';
import { useDashboardSession } from '@/components/social/dashboardSession';
import { startLoopSound, stopLoopSound } from '@/components/game3d/combatAudioStore';

// Keep matchmaking hooks independent of the environment presentation lifecycle.
export default function AIBattleSessionBridge() {
  const { queue, match, reconnect, busy } = useAIBattleQueue();
  const session = useDashboardSession();
  const [showReconnect, setShowReconnect] = useState(false);
  const queuedForPvp = queue?.status === 'waiting' && queue?.mode === 'pvp';
  const matchStatus = String(match?.status || '');
  const activePvpMatch = match?.mode === 'pvp'
    && ['matched', 'connecting', 'countdown', 'fighting'].includes(matchStatus);
  const musicActive = queuedForPvp || activePvpMatch;

  const expectedChannel = activePvpMatch ? String(match?.dashboard_channel || `dashboard_${match?.host_id || ''}`) : '';
  const requiredIds = activePvpMatch ? (match?.player_ids || []).map(String).filter(Boolean) : [];
  const sessionIds = new Set((session.players || []).map((player) => String(player.player_id || '')));
  const roomHealthy = Boolean(
    activePvpMatch
    && String(session.channel_id || '') === expectedChannel
    && session.status === 'connected'
    && requiredIds.length === 2
    && requiredIds.every((id) => sessionIds.has(id))
  );
  const rememberedMatch = typeof window !== 'undefined' ? sessionStorage.getItem('luna_pvp_active_match_id') : '';
  const reconnectable = Boolean((['connecting','countdown','fighting'].includes(matchStatus) && !roomHealthy) || (!match && rememberedMatch));

  useEffect(() => {
    if (musicActive) startLoopSound('bgm_boss');
    else stopLoopSound('bgm_boss');
  }, [musicActive]);
  useEffect(() => () => stopLoopSound('bgm_boss'), []);

  // Avoid flashing the control during the normal half-second room transition.
  // If the shared room stays unhealthy, expose a manual recovery path while the
  // automatic retry loop continues in the background.
  useEffect(() => {
    if (!reconnectable) {
      setShowReconnect(false);
      return undefined;
    }
    const timer = window.setTimeout(() => setShowReconnect(true), 1400);
    return () => window.clearTimeout(timer);
  }, [reconnectable, match?.id, session.status, session.channel_id]);

  const handleReconnect = async () => {
    try {
      await reconnect();
      setShowReconnect(false);
    } catch (error) {
      console.warn('[AI Battle] manual reconnect failed', error);
    }
  };

  if (!showReconnect) return null;
  return (
    <button
      type="button"
      onClick={handleReconnect}
      disabled={busy}
      className="pointer-events-auto absolute left-1/2 top-2 z-[96] -translate-x-1/2 border border-cyan-100/20 bg-slate-950/88 px-4 py-2 text-[9px] font-black uppercase tracking-[0.16em] text-cyan-100 shadow-[0_10px_28px_rgba(0,0,0,.32)] backdrop-blur-xl hover:bg-cyan-950/90 disabled:opacity-50"
    >
      {busy ? 'Reconnecting…' : 'Reconnect to Match'}
    </button>
  );
}