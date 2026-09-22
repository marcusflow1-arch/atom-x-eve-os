import { useMemo } from 'react';
import { Crown, Shield, Skull, Sparkles, Swords, Zap } from 'lucide-react';
import GenesisModelPreview from '@/components/onboarding/GenesisModelPreview';
import useBattleArena from '@/components/battle/useBattleArena';
import { useAuth } from '@/components/auth/AuthContext';

const hpPct = (hp, max) => Math.max(0, Math.min(100, (Number(hp || 0) / Math.max(1, Number(max || 1))) * 100));

function HealthPlate({ fighter, enemy = false, active = false }) {
  const name = fighter?.name || 'Combatant';
  const hp = Number(fighter?.hp || 0);
  const max = Math.max(1, Number(fighter?.max_hp || fighter?.maxHp || 1));
  return (
    <div className={'min-w-[150px] border px-3 py-2 backdrop-blur-xl ' + (active ? 'border-cyan-100/24 bg-cyan-100/[0.06]' : enemy ? 'border-rose-100/14 bg-rose-100/[0.035]' : 'border-white/[0.07] bg-black/20')}>
      <div className="flex items-center justify-between gap-3">
        <span className="truncate text-[8px] font-semibold text-white/78">{name}</span>
        <span className="text-[7px] tabular-nums text-white/34">{Math.ceil(hp)} / {max}</span>
      </div>
      <div className="mt-2 h-[4px] overflow-hidden bg-white/[0.06]">
        <div
          className={'h-full transition-[width] duration-300 ' + (enemy ? 'bg-gradient-to-r from-rose-400/65 to-amber-200/60' : 'bg-gradient-to-r from-emerald-300/55 to-cyan-200/55')}
          style={{ width: String(hpPct(hp, max)) + '%' }}
        />
      </div>
      {Number(fighter?.shield || 0) > 0 && <div className="mt-1 text-right text-[6px] text-cyan-100/40">+{fighter.shield} shield</div>}
    </div>
  );
}

function AvatarFighter({ player, active, side = 'ally' }) {
  return (
    <div className={'relative h-full min-w-0 flex-1 transition-all duration-300 ' + (active ? 'scale-[1.035]' : 'opacity-90')}>
      {active && <div className="pointer-events-none absolute left-1/2 top-[16%] h-[62%] w-[58%] -translate-x-1/2 rounded-[50%] bg-cyan-200/[0.055] blur-2xl" />}
      <div className={'absolute inset-x-[5%] bottom-[7%] top-[3%] ' + (side === 'foe' ? '-scale-x-100' : '')}>
        <GenesisModelPreview config={player?.appearance || { gender: 'male' }} compact controls="none" idleOnly />
      </div>
      <div className="pointer-events-none absolute bottom-[5%] left-1/2 h-3 w-[48%] -translate-x-1/2 rounded-[50%] border border-cyan-100/10 bg-cyan-100/[0.035] blur-[1px]" />
      <div className="pointer-events-none absolute bottom-[1%] inset-x-2 text-center">
        <span className="block truncate text-[7px] font-semibold uppercase tracking-[0.09em] text-white/52">{player?.name || 'Player'}</span>
        {active && <span className="mt-0.5 block text-[5px] font-black uppercase tracking-[0.16em] text-cyan-100/58">Active turn</span>}
      </div>
    </div>
  );
}

function RiftBoss({ enemy, active, worldBoss }) {
  return (
    <div className="relative h-full w-full">
      <div className="pointer-events-none absolute left-1/2 top-[46%] h-[54%] w-[66%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] bg-rose-400/[0.055] blur-3xl" />
      <div className={'absolute left-1/2 top-[45%] h-[230px] w-[230px] -translate-x-1/2 -translate-y-1/2 transition-transform duration-500 ' + (active ? 'scale-105' : '')}>
        <div className="absolute inset-[14%] rotate-45 border border-rose-100/16 bg-gradient-to-br from-slate-900/80 via-cyan-950/60 to-rose-950/55 shadow-[0_0_70px_rgba(248,113,113,.08)]">
          <div className="absolute inset-[19%] border border-cyan-100/15 bg-cyan-200/[0.035]" />
          <div className="absolute left-1/2 top-1/2 h-[28%] w-[28%] -translate-x-1/2 -translate-y-1/2 bg-cyan-100/12 shadow-[0_0_34px_rgba(165,243,252,.22)]" />
        </div>
        <div className="absolute inset-0 animate-[spin_18s_linear_infinite] rounded-full border border-dashed border-white/[0.045]" />
        <div className="absolute inset-[7%] animate-[spin_12s_linear_infinite_reverse] rounded-full border border-rose-100/[0.06]" />
      </div>
      <div className="absolute bottom-[8%] inset-x-0 text-center">
        <div className="mx-auto flex w-fit items-center gap-2 text-[7px] font-black uppercase tracking-[0.16em] text-rose-100/46">
          {worldBoss ? <Crown className="h-3.5 w-3.5" /> : <Skull className="h-3.5 w-3.5" />}
          {worldBoss ? 'World Boss' : 'Rift Enemy'}
        </div>
        <strong className="mt-1 block text-[12px] font-semibold text-white/72">{enemy?.name || 'Rift Construct'}</strong>
      </div>
    </div>
  );
}

export default function DashboardBattleStage({ encounterId }) {
  const { user } = useAuth();
  const battle = useBattleArena(encounterId);
  const encounter = battle.encounter;

  const model = useMemo(() => {
    if (!encounter) return null;
    const me = encounter.players?.find((player) => player.id === user?.id) || null;
    const duel = encounter.route?.type === 'pvp';
    const opponent = duel ? encounter.players?.find((player) => player.id !== user?.id) : null;
    const allies = duel
      ? encounter.players?.filter((player) => player.id === user?.id) || []
      : encounter.players || [];
    const last = encounter.log?.[encounter.log.length - 1] || null;
    return { me, duel, opponent, allies, last };
  }, [encounter, user?.id]);

  if (!encounter || !model) {
    return <div className="absolute inset-0 grid place-items-center text-[8px] uppercase tracking-[0.14em] text-white/28">Synchronizing battle stage…</div>;
  }

  const activeId = encounter.turn;
  const enemy = encounter.enemy || null;
  const worldBoss = encounter.route?.type === 'world_boss';
  const backdrop = encounter.world?.image
    ? {
        backgroundImage: 'linear-gradient(180deg,rgba(4,8,13,.52),rgba(4,8,13,.84)),url(' + JSON.stringify(encounter.world.image) + ')',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : {};

  return (
    <div className="absolute inset-0 overflow-hidden" aria-label="Dashboard battle stage" style={backdrop}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_68%,rgba(103,232,249,.07),transparent_36%),linear-gradient(180deg,rgba(5,9,15,.30),rgba(5,9,15,.78))]" />
      <div className="absolute inset-x-[9%] bottom-[12%] h-[27%] rounded-[50%] border border-white/[0.05] bg-gradient-to-b from-cyan-100/[0.015] to-black/20 [transform:perspective(800px)_rotateX(64deg)]" />
      <div className="absolute left-1/2 top-[10%] h-[66%] w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-white/[0.06] to-transparent" />

      <div className="absolute left-4 right-4 top-4 z-20 flex items-start justify-between gap-4">
        <div className="flex max-w-[58%] flex-wrap gap-2">
          {model.allies.map((player) => <HealthPlate key={player.id} fighter={player} active={activeId === player.id} />)}
        </div>
        <div className="min-w-0">
          {model.duel && model.opponent ? <HealthPlate fighter={model.opponent} enemy active={activeId === model.opponent.id} /> : enemy ? <HealthPlate fighter={enemy} enemy /> : null}
        </div>
      </div>

      <div className="absolute inset-x-[3%] bottom-[13%] top-[16%] z-10 grid grid-cols-[minmax(0,1fr)_140px_minmax(0,1fr)] items-end">
        <div className="flex h-full items-end justify-center gap-1">
          {model.allies.map((player) => <AvatarFighter key={player.id} player={player} active={activeId === player.id} side="ally" />)}
        </div>

        <div className="self-center text-center">
          <div className="mx-auto grid h-12 w-12 rotate-45 place-items-center border border-white/[0.08] bg-black/20 backdrop-blur-lg">
            <Swords className="h-4 w-4 -rotate-45 text-white/28" />
          </div>
          <div className="mt-4 text-[6px] font-black uppercase tracking-[0.18em] text-white/24">Round {encounter.round || 1}</div>
        </div>

        <div className="h-full">
          {model.duel && model.opponent
            ? <AvatarFighter player={model.opponent} active={activeId === model.opponent.id} side="foe" />
            : enemy
              ? <RiftBoss enemy={enemy} active={encounter.phase === 'defend'} worldBoss={worldBoss} />
              : null}
        </div>
      </div>

      <div className="absolute bottom-[4%] left-1/2 z-30 w-[min(720px,80%)] -translate-x-1/2 border border-white/[0.06] bg-black/35 px-4 py-2 text-center backdrop-blur-xl">
        <div className="flex items-center justify-center gap-2 text-[6px] font-black uppercase tracking-[0.14em] text-cyan-100/32">
          {encounter.phase === 'defend' ? <Shield className="h-3 w-3" /> : <Zap className="h-3 w-3" />}
          {encounter.route?.title} · {encounter.world?.title}
        </div>
        <p className="mt-1 truncate text-[8px] text-white/52">{model.last?.text || (encounter.status === 'lobby' ? 'Assembling combatants on the dashboard.' : 'The battle field is ready.')}</p>
      </div>

      {encounter.status === 'lobby' && (
        <div className="absolute inset-0 z-40 grid place-items-center bg-black/20 backdrop-blur-[2px]">
          <div className="border border-white/[0.08] bg-black/45 px-6 py-4 text-center backdrop-blur-xl">
            <Users className="mx-auto h-5 w-5 text-cyan-100/38" />
            <p className="mt-2 text-[7px] font-black uppercase tracking-[0.16em] text-white/34">Battle Lobby</p>
            <p className="mt-1 text-[10px] text-white/62">{encounter.players?.length || 0} / {encounter.route?.max || 5} combatants connected</p>
          </div>
        </div>
      )}
    </div>
  );
}
