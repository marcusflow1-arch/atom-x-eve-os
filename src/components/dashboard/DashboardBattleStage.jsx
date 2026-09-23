import { useMemo } from 'react';
import { Crown, Shield, Skull, Swords, Target, Users, Zap } from 'lucide-react';
import useBattleArena from '@/components/battle/useBattleArena';
import { useAuth } from '@/components/auth/AuthContext';
import { BattleAvatar, RiftEnemy } from '@/components/battle/BattleAvatar';

const hpPct = (hp, max) => Math.max(0, Math.min(100, (Number(hp || 0) / Math.max(1, Number(max || 1))) * 100));
const staggerPct = (value, max) => Math.max(0, Math.min(100, (Number(value || 0) / Math.max(1, Number(max || 100))) * 100));

function HealthPlate({ fighter, enemy = false, active = false, worldBoss = false }) {
  const name = fighter?.name || 'Combatant';
  const hp = Number(fighter?.hp || 0);
  const max = Math.max(1, Number(fighter?.max_hp || fighter?.maxHp || 1));
  const stagger = Number(fighter?.stagger || 0);
  const maxStagger = Math.max(1, Number(fighter?.max_stagger || 100));
  return (
    <div className={'min-w-[170px] border px-3 py-2.5 backdrop-blur-2xl transition-all duration-300 ' + (active ? 'border-cyan-100/26 bg-cyan-100/[0.065] shadow-[0_0_24px_rgba(103,232,249,.07)]' : enemy ? 'border-rose-100/14 bg-rose-100/[0.035]' : 'border-white/[0.07] bg-black/25')}>
      <div className="flex items-center justify-between gap-3">
        <span className="truncate text-[8px] font-semibold text-white/82">{name}</span>
        <span className="text-[7px] tabular-nums text-white/38">{Math.ceil(hp)} / {max}</span>
      </div>
      <div className="mt-2 h-[5px] overflow-hidden bg-white/[0.06]">
        <div className={'h-full transition-[width] duration-300 ' + (enemy ? 'bg-gradient-to-r from-rose-400/70 to-amber-200/65' : 'bg-gradient-to-r from-emerald-300/60 to-cyan-200/60')} style={{ width: String(hpPct(hp, max)) + '%' }} />
      </div>

      <div className="mt-1.5 flex items-center gap-2">
        <span className="text-[5px] font-black uppercase tracking-[0.11em] text-white/22">Break</span>
        <div className="h-[3px] min-w-0 flex-1 overflow-hidden bg-white/[0.045]">
          <div className={'h-full transition-[width] duration-300 ' + (enemy ? 'bg-amber-200/60' : 'bg-violet-200/50')} style={{ width: String(staggerPct(stagger, maxStagger)) + '%' }} />
        </div>
      </div>

      <div className="mt-1 flex min-h-[10px] items-center justify-between gap-2">
        <span className="text-[5px] uppercase tracking-[0.08em] text-white/20">{worldBoss ? 'WORLD BOSS' : active ? 'ACTIVE TURN' : ''}</span>
        <div className="flex items-center gap-2">
          {active && fighter?.ap != null && <span className="flex items-center gap-1 text-[6px] text-amber-100/46"><Zap className="h-2.5 w-2.5" />{fighter.ap}/5 AP</span>}
          {Number(fighter?.shield || 0) > 0 && <span className="flex items-center gap-1 text-[6px] text-cyan-100/46"><Shield className="h-2.5 w-2.5" />{fighter.shield}</span>}
        </div>
      </div>
    </div>
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
            className="absolute bottom-[5%] top-[1%] w-[42%] -translate-x-1/2 transition-all duration-500"
            style={{ left: String(x) + '%', transform: 'translateX(-50%) translateY(' + String(y) + '%) scale(' + String(scale) + ')', zIndex: 20 - Math.abs(spread) }}
          >
            <BattleAvatar player={player} active={activeId === player.id} event={lastEvent} facing={duel ? 'right' : 'front'} />
          </div>
        );
      })}
    </div>
  );
}

function TurnOrderRail({ encounter, allies, opponent, enemy, activeId }) {
  const duel = encounter.route?.type === 'pvp';
  const actors = duel
    ? [...allies, ...(opponent ? [opponent] : [])]
    : [...allies, ...(enemy ? [{ ...enemy, id: 'enemy', enemy: true }] : [])];
  const alive = actors.filter((actor) => Number(actor.hp || 0) > 0);
  if (!alive.length) return null;
  return (
    <div className="absolute left-5 top-[25%] z-30 w-[126px] border border-white/[0.055] bg-black/24 p-2 backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-white/[0.045] pb-1.5">
        <span className="text-[5px] font-black uppercase tracking-[0.14em] text-white/24">Turn Order</span>
        <span className="text-[5px] text-white/18">R{encounter.round || 1}</span>
      </div>
      <div className="mt-1 space-y-1">
        {alive.map((actor, index) => {
          const active = actor.id === activeId;
          return (
            <div key={actor.id || actor.name || index} className={'grid grid-cols-[14px_minmax(0,1fr)_auto] items-center gap-1.5 px-1.5 py-1 ' + (active ? 'bg-cyan-100/[0.055] text-white/72' : 'text-white/30')}>
              <span className={'grid h-3.5 w-3.5 place-items-center border text-[4.5px] font-black ' + (actor.enemy ? 'border-rose-100/12 text-rose-100/42' : 'border-white/[0.055]')}>{index + 1}</span>
              <span className="truncate text-[5.5px]">{actor.name || 'Combatant'}</span>
              {active ? <Zap className="h-2.5 w-2.5 text-cyan-100/46" /> : <span className="h-1 w-1 rounded-full bg-white/10" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EnemyFormation({ encounter, opponent, enemy, activeId, lastEvent }) {
  const duel = encounter.route?.type === 'pvp';
  const worldBoss = encounter.route?.type === 'world_boss';
  if (duel && opponent) {
    return (
      <div className="absolute inset-[8%_14%_13%_0%] scale-[0.84] origin-bottom-left transition-all duration-500">
        <BattleAvatar player={opponent} active={activeId === opponent.id} event={lastEvent} facing="left" />
      </div>
    );
  }
  if (!enemy) return null;
  return (
    <div className={'absolute transition-all duration-500 ' + (worldBoss ? 'inset-[-8%_-2%_-5%_-2%] scale-[1.18]' : 'inset-[0_8%_4%_8%]')}>
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
    return <div className="absolute inset-0 grid place-items-center text-[8px] uppercase tracking-[0.14em] text-white/28">Synchronizing battle stage…</div>;
  }

  const activeId = encounter.turn;
  const enemy = encounter.enemy || null;
  const worldBoss = encounter.route?.type === 'world_boss';
  const isDungeon = encounter.route?.type === 'dungeon';
  const isQuest = encounter.route?.type === 'quest';
  const hitPulse = ['hit', 'break'].includes(model.last?.kind);
  const defendPulse = model.last?.kind === 'defense';
  const backdrop = encounter.world?.image
    ? {
        backgroundImage: 'linear-gradient(180deg,rgba(4,8,13,.34),rgba(4,8,13,.86)),url(' + JSON.stringify(encounter.world.image) + ')',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : {
        background: 'radial-gradient(circle at 50% 15%,rgba(30,70,88,.20),transparent 34%),linear-gradient(180deg,#091019,#05090f 70%,#020407)',
      };

  const phaseLabel = encounter.phase === 'defend'
    ? 'INCOMING STRIKE'
    : encounter.phase === 'camp'
      ? 'CAMP'
      : encounter.status === 'lobby'
        ? 'ASSEMBLING'
        : 'ROUND ' + String(encounter.round || 1);

  return (
    <div className={'absolute inset-0 overflow-hidden transition-transform duration-300 ' + (hitPulse ? 'scale-[1.006]' : '')} aria-label="Dashboard battle stage" style={backdrop}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_68%,rgba(103,232,249,.075),transparent_34%),linear-gradient(180deg,rgba(5,9,15,.08),rgba(5,9,15,.32)_42%,rgba(5,9,15,.84))]" />
      <div className="absolute inset-x-[5%] bottom-[8%] h-[31%] rounded-[50%] border border-white/[0.05] bg-gradient-to-b from-cyan-100/[0.018] to-black/28 [transform:perspective(860px)_rotateX(65deg)] shadow-[0_0_90px_rgba(0,0,0,.28)]" />
      <div className="absolute inset-x-[12%] bottom-[10%] h-px bg-gradient-to-r from-transparent via-cyan-100/[0.12] to-transparent" />
      <div className="absolute left-1/2 top-[9%] h-[69%] w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-white/[0.055] to-transparent" />
      <div className="pointer-events-none absolute inset-0 opacity-50 [background-image:linear-gradient(rgba(255,255,255,.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.014)_1px,transparent_1px)] [background-size:48px_48px]" />

      {(hitPulse || defendPulse) && <div key={model.last?.id} className={'pointer-events-none absolute inset-0 animate-[pulse_.34s_ease-out_1] ' + (hitPulse ? 'bg-rose-200/[0.028]' : 'bg-cyan-200/[0.022]')} />}

      <div className="absolute left-5 right-5 top-4 z-30 flex items-start justify-between gap-4">
        <div className="flex max-w-[60%] flex-wrap gap-2">
          {model.allies.map((player) => <HealthPlate key={player.id} fighter={player} active={activeId === player.id} />)}
        </div>
        <div className="min-w-0">
          {model.duel && model.opponent
            ? <HealthPlate fighter={model.opponent} enemy active={activeId === model.opponent.id} />
            : enemy
              ? <HealthPlate fighter={enemy} enemy worldBoss={worldBoss} />
              : null}
        </div>
      </div>

      <div className="absolute left-1/2 top-[6.3%] z-30 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap border border-white/[0.055] bg-black/24 px-3 py-1 backdrop-blur-xl">
        <Target className="h-2.5 w-2.5 text-cyan-100/34" />
        <span className="text-[5.5px] font-black uppercase tracking-[0.1em] text-white/30">Objective</span>
        <span className="max-w-[430px] truncate text-[6px] text-white/46">{encounter.route?.objective || encounter.route?.description}</span>
        {encounter.source_field && <span className="border-l border-white/[0.07] pl-2 text-[5.5px] uppercase tracking-[0.08em] text-amber-100/38">Field · {encounter.source_field.title} · {Math.round(Number(encounter.source_field.distance_m || 0))}m</span>}
      </div>

      <TurnOrderRail encounter={encounter} allies={model.allies} opponent={model.opponent} enemy={enemy} activeId={activeId} />

      <div className="absolute left-1/2 top-[12%] z-30 -translate-x-1/2 text-center">
        <div className="inline-flex items-center gap-2 border border-white/[0.07] bg-black/28 px-3 py-1.5 backdrop-blur-xl">
          {worldBoss ? <Crown className="h-3 w-3 text-amber-100/50" /> : isDungeon ? <Skull className="h-3 w-3 text-violet-100/46" /> : isQuest ? <Map className="h-3 w-3 text-cyan-100/44" /> : <Swords className="h-3 w-3 text-rose-100/46" />}
          <span className="text-[6px] font-black uppercase tracking-[0.16em] text-white/40">{phaseLabel}</span>
        </div>
        <p className="mt-1 text-[6px] uppercase tracking-[0.11em] text-white/23">
          {encounter.world?.title} · {encounter.route?.title}
          {encounter.route?.stages?.length ? ' · Stage ' + String((encounter.stage || 0) + 1) + '/' + String(encounter.route.stages.length) : ''}
        </p>
      </div>

      <div className="absolute inset-x-[2%] bottom-[10%] top-[17%] z-10 grid grid-cols-[minmax(0,1fr)_120px_minmax(0,1fr)] items-end">
        <div className="relative h-full">
          <PartyFormation players={model.allies} activeId={activeId} lastEvent={model.last} duel={model.duel} />
        </div>

        <div className="self-center text-center">
          <div className="mx-auto grid h-12 w-12 rotate-45 place-items-center border border-white/[0.08] bg-black/22 backdrop-blur-xl shadow-[0_0_30px_rgba(103,232,249,.03)]">
            <Swords className="h-4 w-4 -rotate-45 text-white/30" />
          </div>
          <div className="mt-4 text-[5.5px] font-black uppercase tracking-[0.17em] text-white/22">
            {model.duel ? 'DUEL' : worldBoss ? 'RAID' : isDungeon ? 'DUNGEON' : 'EXPEDITION'}
          </div>
        </div>

        <div className="relative h-full">
          <EnemyFormation encounter={encounter} opponent={model.opponent} enemy={enemy} activeId={activeId} lastEvent={model.last} />
        </div>
      </div>

      <div className="absolute bottom-[3.5%] left-1/2 z-30 w-[min(760px,82%)] -translate-x-1/2 border border-white/[0.065] bg-black/40 px-4 py-2.5 text-center backdrop-blur-2xl">
        <div className="flex items-center justify-center gap-2 text-[5.5px] font-black uppercase tracking-[0.14em] text-cyan-100/30">
          {encounter.phase === 'defend' ? <Shield className="h-3 w-3" /> : <Zap className="h-3 w-3" />}
          {encounter.phase === 'defend' ? 'ACTIVE DEFENSE WINDOW' : 'CARD COMBAT'}
        </div>
        <p className="mt-1 truncate text-[8px] text-white/56">{model.last?.text || (encounter.status === 'lobby' ? 'Assembling combatants on the dashboard.' : 'The battlefield is ready.')}</p>
      </div>

      {encounter.status === 'lobby' && (
        <div className="absolute inset-0 z-40 grid place-items-center bg-black/20 backdrop-blur-[2px]">
          <div className="border border-white/[0.08] bg-black/50 px-7 py-5 text-center backdrop-blur-2xl">
            <Users className="mx-auto h-5 w-5 text-cyan-100/38" />
            <p className="mt-2 text-[7px] font-black uppercase tracking-[0.16em] text-white/34">Dashboard Battle Lobby</p>
            <p className="mt-1 text-[10px] text-white/62">{encounter.players?.length || 0} / {encounter.route?.max || 5} combatants connected</p>
            <p className="mt-2 text-[6px] text-white/26">Players fight here on the host dashboard once the expedition starts.</p>
          </div>
        </div>
      )}
    </div>
  );
}
