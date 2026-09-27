import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Crown, Loader2, Shield, Swords, X } from 'lucide-react';
import useAIBattleQueue, { setAIBattleOverlayOpen } from '@/components/battle/useAIBattleQueue';
import { startLoopSound, stopLoopSound } from '@/components/game3d/combatAudioStore';
import { showError } from '@/components/error/ErrorToast';
import useOnlineSummary from '@/components/social/useOnlineSummary';

const MODES = [
  { id: 'pvp', label: 'PvP', sub: 'Player vs Player', icon: Swords },
  { id: 'pve', label: 'PvE', sub: 'Two players vs environment', icon: Shield },
  { id: 'world_boss', label: 'World Boss', sub: 'Two players vs boss', icon: Crown },
];

const isRateLimitError = (error) => /rate limit|too many requests|too many attempts/i.test(String(error?.message || error || ''));

export default function LunaAIBattleOverlay({ onClose }) {
  const preferred = typeof window !== 'undefined' ? window.__lunaAIBattlePreferredMode : null;
  const { data: onlineSummary } = useOnlineSummary();
  const [mode, setMode] = useState(MODES.some((item) => item.id === preferred) ? preferred : 'pvp');
  const queuedFromThisOverlayRef = useRef(false);
  const queueRequestRef = useRef(false);
  // The popup reads the shared matchmaking cache. AIBattleHost (mounted once at
  // the page root) owns polling and the multiplayer room bridge, so opening the
  // popup neither doubles the status request rate nor duplicates combat relays.
  const battle = useAIBattleQueue({ sessionBridge: false, polling: false });

  // While the popup is open, the compact queue indicator steps aside.
  useEffect(() => {
    setAIBattleOverlayOpen(true);
    return () => setAIBattleOverlayOpen(false);
  }, []);
  const waiting = battle.queue?.status === 'waiting';
  const reserved = battle.match?.status === 'matched';
  const connecting = battle.match?.status === 'connecting';
  const ready = ['countdown', 'fighting'].includes(String(battle.match?.status || ''));
  const queuedMode = battle.match?.mode || battle.queue?.mode || null;
  const active = useMemo(() => MODES.find((item) => item.id === mode) || MODES[0], [mode]);

  // Reopening the menu reflects the queue/match that already exists. This only
  // updates the selected tile; it never creates a queue or calls join().
  useEffect(() => {
    if (queuedMode && MODES.some((item) => item.id === queuedMode)) setMode(queuedMode);
  }, [queuedMode]);

  // `matched` is only a reservation. Do not close the queue UI or reveal the
  // arena until the server confirms BOTH browser clients acknowledged that same
  // reservation and promotes the match to `connecting`.
  useEffect(() => {
    if (!queuedFromThisOverlayRef.current) return;
    if (!connecting && !ready) return;
    queuedFromThisOverlayRef.current = false;
    window.dispatchEvent(new CustomEvent('lunaAIBattleStageEntered', {
      detail: { matchId: battle.match?.id || null, mode: battle.match?.mode || mode },
    }));
    onClose?.();
  }, [connecting, ready, battle.match?.id, battle.match?.mode, mode, onClose]);

  const leaveQueue = useCallback(async () => {
    if (battle.busy) return;
    queuedFromThisOverlayRef.current = false;
    queueRequestRef.current = false;
    try {
      await battle.cancel();
    } catch (error) {
      if (!isRateLimitError(error)) showError(error, 'Leave AI Battle Queue');
    }
  }, [battle]);

  const enterQueue = useCallback(async () => {
    // A local one-shot guard closes the tiny gap before React's mutation state
    // updates. Repeated Q presses can no longer fire parallel join requests.
    if (queueRequestRef.current || battle.busy || waiting || reserved || connecting || ready) return;
    queueRequestRef.current = true;
    queuedFromThisOverlayRef.current = true;
    // Start PvP music from the user's queue-button gesture so browsers permit
    // playback. The persistent dashboard bridge keeps this same loop alive.
    if (mode === 'pvp') startLoopSound('bgm_boss');
    try {
      const body = await battle.join(mode);
      // A returned `matched` reservation stays in the queue UI. Only a server
      // confirmed two-client connection may transition into the arena.
      if (body?.match && ['connecting', 'countdown', 'fighting'].includes(String(body.match.status || ''))) {
        queuedFromThisOverlayRef.current = false;
        window.dispatchEvent(new CustomEvent('lunaAIBattleStageEntered', {
          detail: { matchId: body.match.id || null, mode: body.match.mode || mode },
        }));
        onClose?.();
      }
    } catch (error) {
      queuedFromThisOverlayRef.current = false;
      if (mode === 'pvp') stopLoopSound('bgm_boss');
      if (!isRateLimitError(error)) showError(error, 'AI Battle Queue');
    } finally {
      queueRequestRef.current = false;
    }
  }, [battle, mode, waiting, reserved, connecting, ready, onClose]);

  const chooseMode = useCallback((nextMode) => {
    // Queue state is explicit and idempotent. A tile click never doubles as a
    // hidden cancel; use the Cancel Queue button when you actually want to leave.
    if (waiting || reserved || connecting || ready || battle.busy) return;
    setMode(nextMode);
  }, [waiting, reserved, connecting, ready, battle.busy]);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key.toLowerCase() !== 'q' || event.repeat) return;
      const target = event.target;
      if (target instanceof HTMLElement && target.closest('input,textarea,select,[contenteditable=true]')) return;
      event.preventDefault();
      // Q is join-only. Once queued/reserved/connecting, extra presses are ignored
      // instead of toggling cancel/join and creating ghost queue entries.
      if (waiting || reserved || connecting || ready) return;
      enterQueue();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enterQueue, waiting, reserved, connecting, ready]);

  const statusText = reserved
    ? 'Opponent found. Waiting for both players to confirm the same match before the arena opens…'
    : connecting
      ? 'Both players connected. Loading the shared PvP arena for both sides…'
      : waiting
        ? 'You are queued. You can close this window and keep using the dashboard — you stay in the queue until another live player joins.'
        : ready
          ? (battle.match?.status === 'countdown' ? 'Both fighters loaded. Countdown starting…' : 'Match connected. Fight in progress.')
          : 'Choose a mode, then press Q or Enter Queue. Opening AI Battle never queues automatically.';

  return (
    <div className="fixed left-[390px] right-[338px] top-[205px] z-[130] flex justify-center pointer-events-none" data-dashboard-utility-workspace>
      <section className="pointer-events-auto w-[min(540px,94%)] border border-white/[0.10] bg-slate-950/78 text-white shadow-[0_24px_70px_rgba(0,0,0,.28)] backdrop-blur-2xl">
        <header className="flex items-center gap-3 border-b border-white/[0.07] px-4 py-3">
          <Swords className="h-4 w-4 text-cyan-100/75" />
          <div>
            <p className="text-[7px] font-black uppercase tracking-[0.18em] text-cyan-100/45">Luna</p>
            <h2 className="text-[15px] font-semibold">AI Battle</h2>
          </div>
          <button type="button" onClick={onClose} className="ml-auto grid h-8 w-8 place-items-center border border-white/[0.07] text-white/50 hover:bg-white/[0.06] hover:text-white" aria-label="Close AI Battle"><X className="h-3.5 w-3.5" /></button>
        </header>

        <div className="grid grid-cols-3 border-b border-white/[0.07]">
          {MODES.map(({ id, label, sub, icon: Icon }) => {
            const selected = mode === id;
            const activeQueueTile = queuedMode === id && (waiting || reserved || connecting || ready);
            const disabled = battle.busy || ((reserved || connecting || ready) && !activeQueueTile) || (waiting && !activeQueueTile);
            return (
              <button
                key={id}
                type="button"
                disabled={disabled}
                onClick={() => chooseMode(id)}
                aria-pressed={selected}
                className={`min-h-[72px] border-r border-white/[0.055] px-3 text-left last:border-r-0 ${selected ? 'bg-cyan-100/[0.075]' : 'hover:bg-white/[0.03]'} ${disabled ? 'cursor-default opacity-45' : ''}`}
              >
                <Icon className={`mb-2 h-4 w-4 ${selected ? 'text-cyan-100' : 'text-white/35'}`} />
                <strong className="block text-[10px] text-white/90">{label}</strong>
                <small className="mt-0.5 block text-[7px] text-white/35">
                  {waiting && activeQueueTile ? 'Queued · waiting for opponent' : reserved && activeQueueTile ? 'Opponent found · confirming both players' : sub}
                </small>
              </button>
            );
          })}
        </div>

        <div className="p-4">
          <div className="mb-3 text-[11px] font-semibold text-white/58">
            Online now: {onlineSummary?.online ?? 0} · In queue: {onlineSummary?.in_queue ?? 0} · Live matches: {onlineSummary?.matches_live ?? 0}
          </div>
          <div className="flex min-h-[58px] items-center border border-white/[0.07] bg-white/[0.025] px-4">
            {(battle.busy || reserved || connecting || ready) && <Loader2 className="mr-3 h-4 w-4 animate-spin text-cyan-200/70" />}
            <div>
              <p className="text-[10px] font-semibold text-white/80">{active.label}</p>
              <p className="mt-1 text-[8px] text-white/42">{statusText}</p>
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            {waiting ? (
              <button type="button" disabled={battle.busy} onClick={leaveQueue} className="h-10 flex-1 border border-white/[0.10] text-[9px] font-black uppercase tracking-[0.12em] text-white/70 hover:bg-white/[0.05] disabled:opacity-50">{battle.busy ? 'Leaving Queue…' : 'Cancel Queue'}</button>
            ) : reserved ? (
              <button type="button" disabled={battle.busy} onClick={leaveQueue} className="h-10 flex-1 border border-cyan-100/[0.14] bg-cyan-100/[0.04] text-[9px] font-black uppercase tracking-[0.12em] text-cyan-100/80 hover:bg-cyan-100/[0.08] disabled:opacity-50">{battle.busy ? 'Cancelling…' : 'Cancel Match Reservation'}</button>
            ) : connecting || ready ? (
              <button type="button" disabled className="h-10 flex-1 border border-cyan-100/[0.14] bg-cyan-100/[0.04] text-[9px] font-black uppercase tracking-[0.12em] text-cyan-100/80 opacity-80">Entering Match…</button>
            ) : (
              <button type="button" disabled={battle.busy} onClick={enterQueue} className="h-10 flex-1 bg-cyan-200 text-[9px] font-black uppercase tracking-[0.12em] text-slate-950 hover:bg-cyan-100 disabled:opacity-50">{battle.busy ? 'Entering Queue…' : 'Enter Queue · Q'}</button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
