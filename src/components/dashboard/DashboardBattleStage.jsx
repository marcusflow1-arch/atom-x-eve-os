import { useEffect, useMemo, useRef, useState } from 'react';
import { Shield, Swords, X, Zap } from 'lucide-react';
import useBattleArena from '@/components/battle/useBattleArena';
import { useAuth } from '@/components/auth/AuthContext';
import GenesisModelPreview from '@/components/onboarding/GenesisModelPreview';
import PlayerAvatarPreview from '@/components/onboarding/PlayerAvatarPreview';
import { RiftEnemy } from '@/components/battle/BattleAvatar';
import { arenaPresentation } from '@/components/battle/arenaPresentation';
import { showError, showSuccess } from '@/components/error/ErrorToast';

const pct = (value, max) => Math.max(0, Math.min(100, (Number(value || 0) / Math.max(1, Number(max || 1))) * 100));
const FALLBACK_AVATAR = { gender: 'male', name: 'Player' };

function HealthRail({ fighter, opponent = false, compact = false }) {
  const hp = Math.max(0, Number(fighter?.hp || 0));
  const max = Math.max(1, Number(fighter?.max_hp || fighter?.maxHp || 1));
  return (
    <div className={compact ? 'w-full' : 'w-[340px]'}>
      <div className="mb-1 flex items-center justify-between gap-3 text-[7px] font-semibold uppercase tracking-[0.11em]">
        <span className={opponent ? 'text-rose-100/78' : 'text-cyan-100/78'}>{fighter?.name || (opponent ? 'Opponent' : 'You')}</span>
        <span className="tabular-nums text-white/65">{Math.ceil(hp)} / {Math.ceil(max)}</span>
      </div>
      <div className="h-[6px] overflow-hidden bg-black/45 shadow-[0_0_0_1px_rgba(255,255,255,.06)]">
        <div
          className={`h-full transition-[width] duration-300 ${opponent ? 'bg-gradient-to-r from-rose-400/80 via-rose-300/85 to-amber-200/85' : 'bg-gradient-to-r from-cyan-400/75 via-sky-300/80 to-white/80'}`}
          style={{ width: `${pct(hp, max)}%` }}
        />
      </div>
    </div>
  );
}

export default function DashboardBattleStage({ encounterId }) {
  const { user } = useAuth();
  const battle = useBattleArena(encounterId);
  const encounter = battle.encounter;
  const [now, setNow] = useState(Date.now());
  const autoStartRef = useRef('');
  const timedRef = useRef('');

  const model = useMemo(() => {
    if (!encounter) return null;
    const me = encounter.players?.find((player) => String(player.id) === String(user?.id)) || null;
    const duel = encounter.route?.type === 'pvp';
    const opponent = duel ? encounter.players?.find((player) => String(player.id) !== String(user?.id)) || null : null;
    const enemy = duel ? null : encounter.enemy || null;
    const last = encounter.log?.[encounter.log.length - 1] || null;
    return { me, duel, opponent, enemy, last };
  }, [encounter, user?.id]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 150);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!encounter || !model?.me || battle.busy) return;
    if (encounter.status !== 'lobby' || String(encounter.host_id) !== String(user?.id)) return;
    const ready = Number(encounter.players?.length || 0) >= Number(encounter.route?.min || 1);
    if (!ready) return;
    const key = `${encounter.id}:${encounter.revision}:start`;
    if (autoStartRef.current === key) return;
    autoStartRef.current = key;
    battle.command('start').catch((error) => {
      autoStartRef.current = '';
      console.warn('Dashboard battle auto-start failed', error);
    });
  }, [battle, encounter, model?.me, user?.id]);

  useEffect(() => {
    if (!encounter || encounter.status !== 'active' || !encounter.deadline || battle.busy) return;
    const serverNow = now + battle.serverOffset;
    if (serverNow < Number(encounter.deadline)) return;
    const key = `${encounter.id}:${encounter.revision}:timeout`;
    if (timedRef.current === key) return;
    timedRef.current = key;
    battle.command('timeout').catch(() => { timedRef.current = ''; });
  }, [battle, encounter, now]);

  useEffect(() => {
    const activate = (event) => {
      const slotIndex = Number(event?.detail?.slotIndex);
      if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex > 3) return;
      if (!encounter || !model?.me || battle.busy) return;
      if (encounter.status !== 'active' || encounter.phase !== 'turn' || String(encounter.turn) !== String(model.me.id)) return;
      const card = (model.me.cards || []).find((entry) => Number(entry.slot) === slotIndex);
      if (!card) return;
      battle.command('card', { card_id: card.id }).catch((error) => showError(error, 'Ability'));
    };
    window.addEventListener('lunaSkillSlotActivated', activate);
    return () => window.removeEventListener('lunaSkillSlotActivated', activate);
  }, [battle, encounter, model?.me]);

  if (!encounter || !model?.me) {
    return <div className="pointer-events-none absolute left-1/2 top-[12%] z-30 -translate-x-1/2 text-[8px] font-semibold uppercase tracking-[0.12em] text-white/45">Loading your avatar…</div>;
  }

  const me = model.me;
  const target = model.duel ? model.opponent : model.enemy;
  const mine = String(encounter.turn) === String(me.id);
  const defending = encounter.phase === 'defend';
  const finished = ['victory', 'defeat', 'abandoned'].includes(encounter.status);
  const canClaim = encounter.status === 'victory' && (!model.duel || String(encounter.winner_id) === String(me.id));
  const claimed = encounter.claimed?.includes(me.id);
  const isHost = String(encounter.host_id) === String(user?.id);
  const latestText = model.last?.text || (encounter.status === 'lobby' ? 'Waiting for the other combatant…' : 'Battle ready.');

  const run = async (command, success) => {
    try {
      const result = await battle.command(command);
      if (success) showSuccess(success);
      return result;
    } catch (error) {
      showError(error, 'AI Battle');
      return null;
    }
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden" aria-label="Dashboard battle">
      {['hit', 'break'].includes(model.last?.kind) && <div key={model.last?.id} className="absolute inset-0 animate-[pulse_.28s_ease-out_1] bg-rose-200/[0.035]" />}

      <div className="absolute bottom-[54px] left-[7%] top-[2%] z-10 w-[43%]">
        <PlayerAvatarPreview controls="none" idleOnly skillEffects />
        <div className="absolute bottom-[8%] left-1/2 -translate-x-1/2 text-[7px] font-semibold uppercase tracking-[0.12em] text-cyan-100/62">You</div>
      </div>

      {model.duel && model.opponent && (
        <div className="absolute bottom-[54px] right-[2%] top-[2%] z-10 w-[43%]">
          <GenesisModelPreview config={model.opponent.appearance || FALLBACK_AVATAR} compact controls="none" idleOnly initialYaw={-Math.PI / 4} />
          <div className="absolute bottom-[8%] left-1/2 -translate-x-1/2 max-w-[160px] truncate text-[7px] font-semibold uppercase tracking-[0.12em] text-rose-100/62">{model.opponent.name || 'Opponent'}</div>
        </div>
      )}

      {!model.duel && model.enemy && (
        <div className={`absolute bottom-[58px] right-[3%] top-[4%] z-10 w-[42%] ${encounter.route?.type === 'world_boss' ? 'scale-[1.12]' : ''}`}>
          <RiftEnemy enemy={model.enemy} event={model.last} />
        </div>
      )}

      {target && (
        <div className="absolute left-1/2 top-[5px] z-40 -translate-x-1/2">
          <HealthRail fighter={target} opponent />
          <div className="mt-2 max-w-[420px] truncate text-center text-[7px] font-medium text-white/50">{latestText}</div>
        </div>
      )}

      <div className="absolute bottom-[84px] left-[142px] right-[386px] z-40">
        <HealthRail fighter={me} compact />
        <div className="mt-1 flex items-center justify-between text-[6px] uppercase tracking-[0.11em] text-white/38">
          <span>{mine ? 'Your turn' : 'Waiting'}</span>
          <span className="flex items-center gap-1"><Zap className="h-2.5 w-2.5" />{me.ap ?? 0} / 5 AP</span>
        </div>
      </div>

      {encounter.status === 'lobby' && (
        <div className="absolute left-1/2 top-[52px] z-40 -translate-x-1/2 text-[7px] font-black uppercase tracking-[0.14em] text-white/46">
          {Number(encounter.players?.length || 0) < Number(encounter.route?.min || 1) ? 'Waiting for opponent…' : 'Starting battle…'}
        </div>
      )}

      {encounter.status === 'active' && encounter.phase === 'turn' && mine && (
        <div className="pointer-events-auto absolute bottom-[122px] left-1/2 z-50 flex -translate-x-1/2 gap-1.5">
          <button type="button" disabled={battle.busy} onClick={() => run('strike')} className="flex h-7 items-center gap-1.5 border border-white/[0.09] bg-black/35 px-2.5 text-[6px] font-black uppercase tracking-[0.08em] text-white/55 backdrop-blur-md hover:bg-white/[0.07]"><Swords className="h-3 w-3" />Strike</button>
          <button type="button" disabled={battle.busy} onClick={() => run('guard')} className="flex h-7 items-center gap-1.5 border border-white/[0.09] bg-black/35 px-2.5 text-[6px] font-black uppercase tracking-[0.08em] text-white/55 backdrop-blur-md hover:bg-white/[0.07]"><Shield className="h-3 w-3" />Guard</button>
        </div>
      )}

      {encounter.status === 'active' && defending && mine && (
        <div className="pointer-events-auto absolute bottom-[122px] left-1/2 z-50 flex -translate-x-1/2 gap-1.5">
          <button type="button" disabled={battle.busy} onClick={() => run('brace')} className="h-7 border border-white/[0.09] bg-black/40 px-2.5 text-[6px] font-black uppercase tracking-[0.08em] text-white/60 backdrop-blur-md">Brace</button>
          <button type="button" disabled={battle.busy} onClick={() => run('evade')} className="h-7 border border-cyan-100/[0.12] bg-cyan-100/[0.04] px-2.5 text-[6px] font-black uppercase tracking-[0.08em] text-cyan-50/70 backdrop-blur-md">Evade</button>
          <button type="button" disabled={battle.busy} onClick={() => run('parry')} className="h-7 border border-amber-100/[0.12] bg-amber-100/[0.04] px-2.5 text-[6px] font-black uppercase tracking-[0.08em] text-amber-50/70 backdrop-blur-md">Parry</button>
        </div>
      )}

      {encounter.status === 'active' && encounter.phase === 'camp' && (
        <div className="pointer-events-auto absolute bottom-[122px] left-1/2 z-50 -translate-x-1/2">
          <button type="button" disabled={!isHost || battle.busy} onClick={() => run('continue')} className="h-8 border border-cyan-100/[0.12] bg-black/40 px-3 text-[6px] font-black uppercase tracking-[0.09em] text-cyan-50/70 backdrop-blur-md">{isHost ? 'Next Room' : 'Waiting for Host'}</button>
        </div>
      )}

      {finished && (
        <div className="pointer-events-auto absolute left-1/2 top-[54px] z-50 flex -translate-x-1/2 items-center gap-2 border border-white/[0.08] bg-black/48 px-3 py-2 backdrop-blur-xl">
          <span className="text-[7px] font-black uppercase tracking-[0.12em] text-white/72">{encounter.status === 'victory' ? (model.duel && String(encounter.winner_id) !== String(me.id) ? 'Defeat' : 'Victory') : 'Battle Ended'}</span>
          {canClaim && !claimed ? (
            <button type="button" disabled={battle.busy} onClick={() => run('claim', 'Reward claimed.')} className="border border-amber-100/[0.12] px-2 py-1 text-[6px] font-black uppercase text-amber-100/75">Claim</button>
          ) : (
            <button type="button" onClick={() => arenaPresentation.clear()} className="grid h-6 w-6 place-items-center text-white/50 hover:text-white" aria-label="Close battle"><X className="h-3 w-3" /></button>
          )}
        </div>
      )}
    </div>
  );
}
