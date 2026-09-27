import { useEffect, useState } from 'react';
import { Loader2, Swords, X } from 'lucide-react';
import { useAIBattleOverlayOpen } from '@/components/battle/useAIBattleQueue';

const MODE_LABELS = { pvp: 'PvP', pve: 'PvE', world_boss: 'World Boss' };
const formatElapsed = (ms) => {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
};

/**
 * Compact, always-visible queue status. Closing the AI Battle popup, switching
 * dashboard panels or visiting another view never leaves the queue, but it used
 * to hide every sign of it, which looked exactly like being kicked out.
 */
export default function AIBattleQueueStatus({ battle }) {
  const overlayOpen = useAIBattleOverlayOpen();
  const [now, setNow] = useState(() => Date.now());
  const waiting = battle.queue?.status === 'waiting';
  const reserved = battle.match?.status === 'matched';
  const visible = (waiting || reserved) && !overlayOpen;

  useEffect(() => {
    if (!visible) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [visible]);

  if (!visible) return null;
  const mode = MODE_LABELS[battle.queue?.mode || battle.match?.mode] || 'AI Battle';
  const queuedAt = Date.parse(battle.queue?.queued_at || 0);
  const elapsed = queuedAt ? formatElapsed(now + Number(battle.serverOffsetMs || 0) - queuedAt) : '';

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-auto fixed left-1/2 top-3 z-[240] flex -translate-x-1/2 items-center gap-3 border border-cyan-100/15 bg-slate-950/88 px-3 py-2 text-white shadow-[0_12px_32px_rgba(0,0,0,.35)] backdrop-blur-xl"
    >
      {reserved ? <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-200/80" /> : <Swords className="h-3.5 w-3.5 text-cyan-200/80" />}
      <button
        type="button"
        onClick={() => window.dispatchEvent(new CustomEvent('openAIBattle', { detail: { mode: battle.queue?.mode || battle.match?.mode } }))}
        className="text-left"
        title="Open AI Battle"
      >
        <span className="block text-[8px] font-black uppercase tracking-[0.18em] text-cyan-100/60">{mode} queue</span>
        <span className="block text-[11px] font-semibold text-white/85">
          {reserved ? 'Opponent found — connecting…' : `Searching for an opponent${elapsed ? ` · ${elapsed}` : ''}`}
        </span>
      </button>
      {waiting && (
        <button
          type="button"
          disabled={battle.busy}
          onClick={() => battle.cancel().catch((error) => console.warn('[AI Battle] leave queue failed', error))}
          className="ml-1 grid h-7 w-7 place-items-center border border-white/10 text-white/55 hover:bg-white/[0.06] hover:text-white disabled:opacity-40"
          aria-label="Leave queue"
          title="Leave queue"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
