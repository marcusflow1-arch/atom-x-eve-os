import { activeDashboardWindow } from './windows/DashboardWindow';
import { useCallback, useEffect, useRef, useState } from 'react';
import AIBattleMenuWorkspace from './AIBattleMenuWorkspace';
import { BATTLE_MODES as MODES, getBattleAvailability, getBattleQueueTarget } from '@/components/battle/battleMenuCatalog';
import useAIBattleQueue, { isRateLimited, setAIBattleOverlayOpen } from '@/components/battle/useAIBattleQueue';
import { startLoopSound, stopLoopSound } from '@/components/game3d/combatAudioStore';
import { showError, showInfo } from '@/components/error/ErrorToast';
import useOnlineSummary from '@/components/social/useOnlineSummary';

const BUSY_MESSAGE = 'AI Battle is busy right now. Wait a few seconds and press Queue again.';

export default function LunaAIBattleOverlay({ onClose, embedded = false, onOpenSkillBook }) {
  const preferred = typeof window !== 'undefined' ? window.__lunaAIBattlePreferredMode : null;
  const { data: onlineSummary } = useOnlineSummary();
  const [mode, setMode] = useState(MODES.some((item) => item.id === preferred) ? preferred : 'pvp');
  const [genreId, setGenreId] = useState(mode === 'pvp' ? 'core' : 'fighting');
  const availability = getBattleAvailability(mode, genreId);
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
  const locked = waiting || reserved || connecting || ready || battle.busy || battle.isLoading;

  // Reopening the menu reflects the queue/match that already exists. This only
  // updates the selected tile; it never creates a queue or calls join().
  useEffect(() => {
    if ((waiting || reserved || connecting || ready) && queuedMode && MODES.some((item) => item.id === queuedMode)) {
      setMode(queuedMode);
      setGenreId('core');
    }
  }, [queuedMode, waiting, reserved, connecting, ready]);

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
      if (isRateLimited(error)) showInfo(BUSY_MESSAGE);
      else showError(error, 'Leave AI Battle Queue');
    }
  }, [battle]);

  const enterQueue = useCallback(async () => {
    // A local one-shot guard closes the tiny gap before React's mutation state
    // updates. Repeated Q presses can no longer fire parallel join requests.
    const target = getBattleQueueTarget(mode, genreId);
    if (!target || queueRequestRef.current || battle.isLoading || battle.busy || waiting || reserved || connecting || ready) return;
    queueRequestRef.current = true;
    queuedFromThisOverlayRef.current = true;
    // Start PvP music from the user's queue-button gesture so browsers permit
    // playback. The persistent dashboard bridge keeps this same loop alive.
    if (mode === 'pvp') startLoopSound('bgm_boss');
    try {
      const body = await battle.join(target.mode);
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
      // join already retried the rate limit several times. Never fail silently:
      // that is what made the button just flip back to Q.
      if (isRateLimited(error)) showInfo(BUSY_MESSAGE);
      else showError(error, 'AI Battle Queue');
    } finally {
      queueRequestRef.current = false;
    }
  }, [battle, mode, genreId, waiting, reserved, connecting, ready, onClose]);

  const chooseMode = useCallback((nextMode) => {
    // Queue state is explicit and idempotent. A tile click never doubles as a
    // hidden cancel; use the Cancel Queue button when you actually want to leave.
    if (locked) return;
    setMode(nextMode);
    if (nextMode !== 'pvp' && genreId === 'core') setGenreId('fighting');
  }, [locked, genreId]);

  const chooseGenre = useCallback((nextGenre) => {
    if (!locked) setGenreId(nextGenre);
  }, [locked]);
  const openSkillBook = () => {
    if (onOpenSkillBook) onOpenSkillBook();
    else window.dispatchEvent(new CustomEvent('openLunaSkillBook'));
  };

  useEffect(() => {
    const onKey = (event) => {
      if (event.key.toLowerCase() !== 'q' || event.repeat || event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
      if (embedded && (activeDashboardWindow() !== 'ai-battle' || document.querySelector('[data-luna-window="ai-battle"]')?.dataset.minimized)) return;
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
  }, [enterQueue, waiting, reserved, connecting, ready, embedded]);

  const statusText = reserved
    ? 'Opponent found. Waiting for both players to confirm the same match before the arena opens…'
    : connecting
      ? 'Both players connected. Loading the shared PvP arena for both sides…'
      : waiting
        ? 'You are queued. You can close this window and keep using the dashboard — you stay in the queue until another live player joins.'
        : ready
          ? (battle.match?.status === 'countdown' ? 'Both fighters loaded. Countdown starting…' : 'Match connected. Fight in progress.')
          : battle.busy ? 'Requesting your place in the avatar duel queue…' : 'Choose your arena, then select Find opponent. Opening AI Battle never queues automatically.';

  return (
    <AIBattleMenuWorkspace
      embedded={embedded} onClose={onClose} mode={mode} genreId={genreId}
      chooseMode={chooseMode} chooseGenre={chooseGenre} locked={locked}
      availability={availability} battle={battle} waiting={waiting}
      reserved={reserved} connecting={connecting} ready={ready}
      enterQueue={enterQueue} leaveQueue={leaveQueue} onlineSummary={onlineSummary}
      statusText={statusText} openSkillBook={openSkillBook}
    />
  );
}
