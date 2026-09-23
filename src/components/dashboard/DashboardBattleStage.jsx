import { useMemo } from 'react';
import { Activity, Crown, Map, Shield, Skull, Swords, Target, Users, Zap } from 'lucide-react';
import useBattleArena from '@/components/battle/useBattleArena';
import { useAuth } from '@/components/auth/AuthContext';
import { BattleAvatar, RiftEnemy } from '@/components/battle/BattleAvatar';

const pct = (value, max) => Math.max(0, Math.min(100, (Number(value || 0) / Math.max(1, Number(max || 1))) * 100));

function StatusPlate({ fighter, enemy = false, active = false, worldBoss = false }) {
  const hp = Number(fighter?.hp || 0);
  const max = Math.max(1, Number(fighter?.max_hp || fighter?.maxHp || 1));
  const stagger = Number(fighter?.stagger || 0);
  const maxStagger = Math.max(1, Number(fighter?.max_stagger || 100));
  return (
    <div className={
      'min-w-[190px] overflow-hidden rounded-xl border px-3.5 py-3 shadow-[0_18px_55px_rgba(0,0,0,.28)] backdrop-blur-xl transition-all duration-300 ' +
      (active
        ? 'border-cyan-200/55 bg-cyan-100/[0.13] ring-1 ring-cyan-200/20'
        : enemy
          ? 'border-rose-200/35 bg-rose-100/[0.08]'
          : 'border-white/15 bg-slate-900/55')
    }>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[8px] font-black uppercase tracking-[0.16em] text-white/72">{enemy ? 'Opponent' : 'Ally'}</p>
          <strong className="mt-0.5 block truncate text-[12px] font-semibold text-white">{fighter?.name || 'Combatant'}</strong>
        </div>
        <span className="shrink-0 text-[9px] tabular-nums text-white/80">{Math.ceil(hp)} / {max}</span>
      </div>
      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className={'h-full rounded-full transition-[width] duration-300 ' + (enemy ? 'bg-gradient-to-r from-rose-300 via-rose-200 to-amber-200' : 'bg-gradient-to-r from-emerald-300 via-cyan-200 to-white')} style={{ width: String(pct(hp, max)) + '%' }} />
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span className="text-[7px] font-black uppercase tracking-[0.12em] text-white/58">Break</span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
          <div className={'h-full rounded-full ' + (enemy ? 'bg-amber-200/85' : 'bg-violet-200/80')} style={{ width: String(pct(stagger, maxStagger)) + '%' }} />
        </div>
        {active && fighter?.ap != null && <span className="flex items-center gap-1 text-[8px] font-bold text-amber-100/90"><Zap className="h-3 w-3" />{fighter.ap}/5</span>}
      </div>
      <div className="mt-1.5 flex items-center justify-between">
        <span className="text-[7px] uppercase tracking-[0.11em] text-white/60">{worldBoss ? 'World Boss' : active ? 'Active Turn' : 'Ready'}</span>
        {Number(fighter?.shield || 0) > 0 && <span className="flex items-center gap-1 text-[8px] text-cyan-100/88"><Shield className="h-3 w-3" />{fighter.shield} shield</span>}
      </div>
    </div>
  );
}

function TurnRail({ encounter, allies, opponent, enemy, activeId }) {
  const duel = encounter.route?.type === 'pvp';
  const actors = duel
    ? [...allies, ...(opponent ? [opponent] : [])]
    : [...allies, ...(enemy ? [{ ...enemy, id: 'enemy', enemy: true }] : [])];
  const alive = actors.filter((actor) => Number(actor.hp || 0) > 0);
  if (!alive.length) return null;
  return (
    <aside className="absolute left-5 top-[27%] z-30 w-[148px] rounded-xl border border-white/14 bg-slate-950/62 p-2.5 shadow-[0_18px_50px_rgba(0,0,0,.26)] backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <span className="flex items-center gap-1.5 text-[7px] font-black uppercase tracking-[0.14em] text-white/72"><Activity className="h-3 w-3 text-cyan-100/80" /> Turn Order</span>
        <span className="text-[7px] font-bold text-white/60">R{encounter.round || 1}</span>
      </div>
      <div className="mt-1.5 space-y-1">
        {alive.map((actor, index) => {
          const active = actor.id === activeId;
          return (
            <div key={actor.id || actor.name || index} className={'grid grid-cols-[18px_minmax(0,1fr)_auto] items-center gap-2 rounded-lg px-2 py-1.5 ' + (active ? 'bg-cyan-100/[0.12] text-white ring-1 ring-cyan-100/20' : 'text-white/65')}>
              <span className={'grid h-4 w-4 place-items-center rounded border text-[6px] font-black ' + (actor.enemy ? 'border-rose-200/35 text-rose-100/80' : 'border-white/18 text-white/72')}>{index + 1}</span>
              <span className="truncate text-[7px] font-semibold">{actor.name || 'Combatant'}</span>
              {active ? <Zap className="h-3 w-3 text-cyan-100/90" /> : <span className="h-1.5 w-1.5 rounded-full bg-white/30" />}
            </div>
          );
        })}
      </div>
    </aside>
  );
}

function PartyFormation({ players, activeId, lastEvent, duel = false }) {
  const count = Math.max(1, players.length);
  return (
    <div className="relative h-full w-full">
      {players.map((player, index) => {
        const spread = count === 1 ? 0 : (index - (count - 1) / 2);
        const x = (duel ? 67 : 50) + spread * Math.min(21, 52 / count);
        const y = (duel ? 9 : 5) + Math.abs(spread) * 3.5;
        const scale = duel ? 1.08 : Math.max(.7, 1 - Math.abs(spread) * .07);
        return (
          <div
            key={player.id}
            className="absolute bottom-[5%] top-[1%] w-[44%] -translate-x-1/2 transition-all duration-500"
            style={{ left: String(x) + '%', transform: 'translateX(-50%) translateY(' + String(y) + '%) scale(' + String(scale) + ')', zIndex: 20 - Math.abs(spread) }}
          >
            <BattleAvatar player={player} active={activeId === player.id} event={lastEvent} facing={duel ? 'right' : 'front'} skillEffects={duel} />
          </div>
        );
      })}
    </div>
  );
}

function EnemyFormation({ encounter, opponent, enemy, activeId, lastEvent }) {
  const duel = encounter.route?.type === 'pvp';
  const worldBoss = encounter.route?.type === 'world_boss';
  if (duel && opponent) {
    return (
      <div className="absolute inset-[7%_11%_11%_0%] scale-[0.88] origin-bottom-left transition-all duration-500">
        <BattleAvatar player={opponent} active={activeId === opponent.id} event={lastEvent} facing="left" />
      </div>
    );
  }
  if (!enemy) return null;
  return (
    <div className={'absolute transition-all duration-500 ' + (worldBoss ? 'inset-[-10%_-4%_-5%_-4%] scale-[1.2]' : 'inset-[-1%_5%_3%_5%]')}>
      <RiftEnemy enemy={enemy} event={lastEvent} />
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
    return <div className="absolute inset-0 grid place-items-center bg-slate-950/20 text-[10px] font-black uppercase tracking-[0.16em] text-white/68">Synchronizing battle stage…</div>;
  }

  const activeId = encounter.turn;
  const enemy = encounter.enemy || null;
  const worldBoss = encounter.route?.type === 'world_boss';
  const isDungeon = encounter.route?.type === 'dungeon';
  const isQuest = encounter.route?.type === 'quest';
  const hitPulse = ['hit', 'break'].includes(model.last?.kind);
  const defendPulse = model.last?.kind === 'defense';
  const phaseLabel = encounter.phase === 'defend'
    ? 'INCOMING STRIKE'
    : encounter.phase === 'camp'
      ? 'CAMP'
      : encounter.status === 'lobby'
        ? 'ASSEMBLING'
        : 'ROUND ' + String(encounter.round || 1);

  const backdrop = encounter.world?.image
    ? {
        backgroundImage: 'linear-gradient(180deg,rgba(7,13,20,.16),rgba(7,13,20,.56)),url(' + JSON.stringify(encounter.world.image) + ')',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : {
        background: 'radial-gradient(circle at 50% 12%,rgba(84,154,176,.22),transparent 32%),radial-gradient(circle at 20% 72%,rgba(104,84,156,.12),transparent 28%),linear-gradient(180deg,#132231,#0a141f 68%,#081019)',
      };

  return (
    <div className={'absolute inset-0 overflow-hidden transition-transform duration-300 ' + (hitPulse ? 'scale-[1.004]' : '')} aria-label="Dashboard battle stage" style={backdrop}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_64%,rgba(100,235,255,.11),transparent_33%),linear-gradient(180deg,rgba(8,15,23,.04),rgba(8,15,23,.18)_42%,rgba(8,15,23,.52))]" />
      <div className="absolute inset-x-[5%] bottom-[7%] h-[34%] rounded-[50%] border border-cyan-100/14 bg-cyan-100/[0.045] [transform:perspective(860px)_rotateX(65deg)] shadow-[0_0_90px_rgba(80,210,235,.10)]" />
      <div className="absolute inset-x-[9%] bottom-[10%] h-px bg-gradient-to-r from-transparent via-cyan-100/25 to-transparent" />
      <div className="absolute left-1/2 top-[10%] h-[66%] w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-white/12 to-transparent" />
      <div className="pointer-events-none absolute inset-0 opacity-70 [background-image:linear-gradient(rgba(255,255,255,.028)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.020)_1px,transparent_1px)] [background-size:48px_48px]" />

      {(hitPulse || defendPulse) && <div key={model.last?.id} className={'pointer-events-none absolute inset-0 animate-[pulse_.34s_ease-out_1] ' + (hitPulse ? 'bg-rose-200/[0.06]' : 'bg-cyan-200/[0.05]')} />}

      <div className="absolute left-5 right-5 top-4 z-30 flex items-start justify-between gap-4">
        <div className="flex max-w-[62%] flex-wrap gap-2">
          {model.allies.map((player) => <StatusPlate key={player.id} fighter={player} active={activeId === player.id} />)}
        </div>
        <div className="min-w-0">
          {model.duel && model.opponent
            ? <StatusPlate fighter={model.opponent} enemy active={activeId === model.opponent.id} />
            : enemy
              ? <StatusPlate fighter={enemy} enemy worldBoss={worldBoss} />
              : null}
        </div>
      </div>

      <div className="absolute left-1/2 top-4 z-30 -translate-x-1/2">
        <div className="flex items-center gap-3 rounded-full border border-white/16 bg-slate-950/58 px-4 py-2 shadow-[0_14px_40px_rgba(0,0,0,.22)] backdrop-blur-xl">
          <Target className="h-3.5 w-3.5 text-cyan-100/90" />
          <div className="max-w-[430px] text-center">
            <p className="text-[7px] font-black uppercase tracking-[0.18em] text-cyan-100/85">Objective</p>
            <p className="mt-0.5 truncate text-[9px] font-semibold text-white/95">{encounter.route?.objective || encounter.route?.description || 'Secure the field.'}</p>
          </div>
          {encounter.source_field && <span className="border-l border-white/12 pl-3 text-[8px] font-bold text-amber-100/88">Field · {encounter.source_field.title} · {Math.round(Number(encounter.source_field.distance_m || 0))}m</span>}
        </div>
      </div>

      <div className="absolute right-5 top-[16%] z-30 flex items-center gap-2 rounded-full border border-white/14 bg-slate-950/48 px-3 py-1.5 backdrop-blur-xl">
        {worldBoss ? <Crown className="h-3.5 w-3.5 text-amber-100/85" /> : isDungeon ? <Skull className="h-3.5 w-3.5 text-violet-100/85" /> : isQuest ? <Map className="h-3.5 w-3.5 text-cyan-100/85" /> : <Swords className="h-3.5 w-3.5 text-rose-100/85" />}
        <span className="text-[8px] font-black uppercase tracking-[0.16em] text-white/90">{phaseLabel}</span>
      </div>

      <TurnRail encounter={encounter} allies={model.allies} opponent={model.opponent} enemy={enemy} activeId={activeId} />

      <div className="absolute inset-x-[2%] bottom-[9%] top-[18%] z-10 grid grid-cols-[minmax(0,1fr)_140px_minmax(0,1fr)] items-end">
        <div className="relative h-full">
          <PartyFormation players={model.allies} activeId={activeId} lastEvent={model.last} duel={model.duel} />
        </div>

        <div className="self-center text-center">
          <div className="mx-auto grid h-16 w-16 rotate-45 place-items-center rounded-2xl border border-cyan-100/18 bg-slate-950/45 shadow-[0_0_40px_rgba(103,232,249,.08)] backdrop-blur-xl">
            <Swords className="h-5 w-5 -rotate-45 text-cyan-100/75" />
          </div>
          <p className="mt-5 text-[8px] font-black uppercase tracking-[0.2em] text-white/75">{model.duel ? 'DUEL' : worldBoss ? 'RAID' : isDungeon ? 'DUNGEON' : 'EXPEDITION'}</p>
          <p className="mt-1 text-[7px] uppercase tracking-[0.14em] text-white/58">{encounter.world?.title} · {encounter.route?.title}</p>
        </div>

        <div className="relative h-full">
          <EnemyFormation encounter={encounter} opponent={model.opponent} enemy={enemy} activeId={activeId} lastEvent={model.last} />
        </div>
      </div>

      <div className="absolute bottom-4 left-1/2 z-30 w-[min(860px,82%)] -translate-x-1/2 rounded-2xl border border-white/14 bg-slate-950/62 px-5 py-3 shadow-[0_20px_55px_rgba(0,0,0,.25)] backdrop-blur-xl">
        <div className="flex items-center justify-center gap-2 text-[7px] font-black uppercase tracking-[0.18em] text-cyan-100/80">
          {encounter.phase === 'defend' ? <Shield className="h-3.5 w-3.5" /> : <Zap className="h-3.5 w-3.5" />}
          {encounter.phase === 'defend' ? 'Active defense window' : 'Card combat live'}
        </div>
        <p className="mt-1.5 text-center text-[10px] font-medium text-white/88">{model.last?.text || (encounter.status === 'lobby' ? 'Assembling combatants on the dashboard.' : 'The battlefield is ready.')}</p>
      </div>

      {encounter.status === 'lobby' && (
        <div className="absolute inset-0 z-40 grid place-items-center bg-slate-950/12 backdrop-blur-[1px]">
          <div className="rounded-2xl border border-cyan-100/25 bg-slate-950/78 px-8 py-6 text-center shadow-[0_25px_80px_rgba(0,0,0,.30)]">
            <div className="mx-auto grid h-10 w-10 place-items-center rounded-full border border-cyan-100/22 bg-cyan-100/[0.09]"><Users className="h-5 w-5 text-cyan-100/90" /></div>
            <p className="mt-3 text-[9px] font-black uppercase tracking-[0.17em] text-cyan-100/85">Dashboard Battle Lobby</p>
            <p className="mt-1 text-[13px] font-semibold text-white">{encounter.players?.length || 0} / {encounter.route?.max || 5} combatants connected</p>
            <p className="mt-2 max-w-sm text-[9px] leading-4 text-white/72">The host dashboard is the battle floor. Once the lobby is ready, your equipped cards and avatar enter the encounter together.</p>
          </div>
        </div>
      )}
    </div>
  );
};
