import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Swords } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/components/auth/AuthContext';
import { touchAIBattleQueueSession, useAIBattleSnapshot } from '@/components/battle/useAIBattleQueue';

const LIVE_STATUSES = ['connecting', 'countdown', 'fighting'];

/**
 * Shown on every page except the dashboard while the player has a live PvP
 * match. The match keeps running server-side when the player navigates away;
 * this is the one-click way back into it. On the dashboard itself,
 * AIBattleHost reconnects automatically.
 */
export default function AIBattleReturnBanner({ currentPageName }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { match, isParticipant } = useAIBattleSnapshot();
  const onDashboard = currentPageName === 'LunaTemplate';

  // A fresh load of another page has no poller yet: ask once whether a match is
  // in progress. The shared heartbeat then keeps this banner current.
  useEffect(() => {
    if (!user?.id || onDashboard) return;
    touchAIBattleQueueSession(user.id).catch(() => {});
  }, [user?.id, onDashboard]);

  if (onDashboard || !isParticipant || !LIVE_STATUSES.includes(String(match?.status || ''))) return null;
  return (
    <button
      type="button"
      onClick={() => navigate(createPageUrl('LunaTemplate'))}
      className="fixed left-1/2 top-3 z-[250] flex -translate-x-1/2 items-center gap-3 border border-cyan-100/25 bg-slate-950/92 px-4 py-2.5 text-left text-white shadow-[0_12px_32px_rgba(0,0,0,.4)] backdrop-blur-xl hover:bg-cyan-950/90"
    >
      <Swords className="h-4 w-4 text-cyan-200" />
      <span>
        <span className="block text-[8px] font-black uppercase tracking-[0.18em] text-cyan-100/60">PvP match in progress</span>
        <span className="block text-[12px] font-bold">Return to match</span>
      </span>
    </button>
  );
}
