import { useCallback, useEffect, useMemo, useState } from 'react';
import { Crown, Loader2, Shield, Swords, X } from 'lucide-react';
import useAIBattleQueue from '@/components/battle/useAIBattleQueue';
import { showError } from '@/components/error/ErrorToast';

const MODES = [
  { id: 'pvp', label: 'PvP', sub: 'Player vs Player', icon: Swords },
  { id: 'pve', label: 'PvE', sub: 'Two players vs environment', icon: Shield },
  { id: 'world_boss', label: 'World Boss', sub: 'Two players vs boss', icon: Crown },
];

export default function LunaAIBattleOverlay({ onClose }) {
  const preferred = typeof window !== 'undefined' ? window.__lunaAIBattlePreferredMode : null;
  const [mode, setMode] = useState(MODES.some((item) => item.id === preferred) ? preferred : 'pvp');
  const battle = useAIBattleQueue();
  const active = useMemo(() => MODES.find((item) => item.id === mode) || MODES[0], [mode]);
  const waiting = battle.queue?.status === 'waiting';
  const matched = battle.match && battle.match.status !== 'ended';
  const ready = battle.match?.status === 'ready';

  const enterQueue = useCallback(async () => {
    if (battle.busy || waiting || matched) return;
    try {
      await battle.join(mode);
    } catch (error) {
      showError(error, 'AI Battle Queue');
    }
  }, [battle, mode, waiting, matched]);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key.toLowerCase() !== 'q' || event.repeat) return;
      const target = event.target;
      if (target instanceof HTMLElement && target.closest('input,textarea,select,[contenteditable=true]')) return;
      event.preventDefault();
      enterQueue();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enterQueue]);

  useEffect(() => {
    if (!ready) return undefined;
    const timer = window.setTimeout(() => onClose?.(), 900);
    return () => window.clearTimeout(timer);
  }, [ready, onClose]);

  const statusText = ready
    ? 'Both players connected. Battle dashboard ready.'
    : matched
      ? `Match found. Connecting both players to ${battle.match.host_name || 'the host'}'s dashboard…`
      : waiting
        ? 'Waiting for the next player in this queue…'
        : 'Choose a mode, then press Q or Enter Queue.';

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
          {MODES.map(({ id, label, sub, icon: Icon }) => (
            <button key={id} type="button" disabled={waiting || matched} onClick={() => setMode(id)} className={`min-h-[72px] border-r border-white/[0.055] px-3 text-left last:border-r-0 ${mode === id ? 'bg-cyan-100/[0.075]' : 'hover:bg-white/[0.03]'} disabled:cursor-default`}>
              <Icon className={`mb-2 h-4 w-4 ${mode === id ? 'text-cyan-100' : 'text-white/35'}`} />
              <strong className="block text-[10px] text-white/90">{label}</strong>
              <small className="mt-0.5 block text-[7px] text-white/35">{sub}</small>
            </button>
          ))}
        </div>

        <div className="p-4">
          <div className="flex min-h-[58px] items-center border border-white/[0.07] bg-white/[0.025] px-4">
            {(battle.busy || matched) && !ready && <Loader2 className="mr-3 h-4 w-4 animate-spin text-cyan-200/70" />}
            <div>
              <p className="text-[10px] font-semibold text-white/80">{active.label}</p>
              <p className="mt-1 text-[8px] text-white/42">{statusText}</p>
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            {waiting ? (
              <button type="button" disabled={battle.busy} onClick={() => battle.cancel().catch((error) => showError(error, 'Cancel Queue'))} className="h-10 flex-1 border border-white/[0.10] text-[9px] font-black uppercase tracking-[0.12em] text-white/70 hover:bg-white/[0.05]">Cancel Queue</button>
            ) : !matched ? (
              <button type="button" disabled={battle.busy} onClick={enterQueue} className="h-10 flex-1 bg-cyan-200 text-[9px] font-black uppercase tracking-[0.12em] text-slate-950 hover:bg-cyan-100 disabled:opacity-50">{battle.busy ? 'Entering Queue…' : 'Enter Queue · Q'}</button>
            ) : (
              <div className="flex h-10 flex-1 items-center justify-center border border-cyan-100/[0.12] bg-cyan-100/[0.04] text-[9px] font-black uppercase tracking-[0.12em] text-cyan-100/75">{ready ? 'Dashboard Ready' : 'Connecting…'}</div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
