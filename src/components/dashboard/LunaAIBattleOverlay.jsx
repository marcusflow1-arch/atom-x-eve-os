import { useEffect, useMemo, useState } from 'react';
import {
  Activity, BellRing, Check, ChevronRight, CircleDot, Crown,
  Loader2, Map, Shield, Skull, Swords, Target, Gem as Treasure, Trophy,
  UserRound, Users, X, Zap
} from 'lucide-react';
import useAIBattleHub from '@/components/luna/hooks/useAIBattleHub';
import { useAuth } from '@/components/auth/AuthContext';
import { sendDuelChallenge } from '@/components/game3d/social/duelChallenge';
import { showError, showSuccess } from '@/components/error/ErrorToast';

const MODES = [
  { id: 'pvp', label: 'PvP', full: 'Player vs Player', icon: Swords, tone: 'text-rose-100' },
  { id: 'pve', label: 'PvE', full: 'Player vs Environment', icon: Shield, tone: 'text-cyan-100' },
  { id: 'pvwe', label: 'PvWE', full: 'Player vs World Environment', icon: Crown, tone: 'text-amber-100' },
];

const activityIcon = (type) => ({
  mob: Target,
  boss: Skull,
  world_boss: Crown,
  treasure: Treasure,
  quest: Map,
}[type] || Activity);

const difficultyTone = {
  normal: 'text-slate-100 border-white/[0.08] bg-white/[0.025]',
  hard: 'text-amber-100 border-amber-200/15 bg-amber-200/[0.045]',
  elite: 'text-orange-100 border-orange-200/16 bg-orange-200/[0.05]',
  mythic: 'text-fuchsia-100 border-fuchsia-200/16 bg-fuchsia-200/[0.055]',
};

function pct(current, max) {
  const denominator = Math.max(1, Number(max || 1));
  return Math.max(0, Math.min(100, (Number(current || 0) / denominator) * 100));
}

function LoadoutCore({ loadout }) {
  const cards = Array.isArray(loadout?.cards) ? loadout.cards : [];
  return (
    <aside className="min-w-0 border-l border-white/[0.07] bg-black/[0.12] p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[7px] font-black uppercase tracking-[0.16em] text-white/30">Loadout Core</p>
          <h3 className="mt-1 text-[12px] font-semibold text-white/85">Cards entering battle</h3>
        </div>
        <div className="text-right">
          <p className="text-[6px] uppercase tracking-[0.1em] text-white/25">Power</p>
          <p className="text-[16px] font-semibold tabular-nums text-cyan-100/90">{Number(loadout?.player_power || 0).toLocaleString()}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {[0, 1, 2, 3].map((index) => {
          const card = cards[index];
          return (
            <div key={index} className="relative min-h-[116px] overflow-hidden border border-white/[0.07] bg-white/[0.018]">
              {card?.image ? <img src={card.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" /> : null}
              <div className="absolute inset-0 bg-gradient-to-t from-[#070b11] via-[#070b11]/78 to-transparent" />
              <div className="relative z-10 flex h-full min-h-[116px] flex-col justify-end p-2">
                <span className="text-[5px] font-black uppercase tracking-[0.13em] text-white/26">Slot {index + 1}</span>
                <strong className="mt-1 line-clamp-2 text-[8px] leading-3 text-white/78">{card?.name || 'Empty'}</strong>
                {card && (
                  <div className="mt-1 flex items-center justify-between gap-1">
                    <span className="truncate text-[5px] uppercase text-cyan-100/36">{card.rarity}</span>
                    <span className="text-[6px] font-semibold text-white/40">{card.power} PWR</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!cards.length && <p className="mt-3 text-[8px] leading-4 text-amber-100/50">Equip at least one Ability card in the Skill Book before entering PvE or PvWE.</p>}

      <div className="mt-4 border-t border-white/[0.06] pt-3">
        <div className="flex items-center justify-between text-[7px]">
          <span className="text-white/28">Avatar HP</span>
          <span className="font-semibold text-white/62">{Number(loadout?.player_hp || 100).toLocaleString()}</span>
        </div>
        <div className="mt-2 h-[3px] overflow-hidden bg-white/[0.05]"><div className="h-full w-full bg-cyan-200/35" /></div>
      </div>
    </aside>
  );
}

function PvPPanel({ loadout, pvp, opponents, duels, onRefresh }) {
  const { user } = useAuth();
  const [busyId, setBusyId] = useState(null);
  const activeDuel = pvp?.active_duel || null;
  const recent = (duels || []).filter((row) => row.status === 'finished').slice(0, 6);

  const challenge = async (opponent) => {
    if (!user?.id || busyId) return;
    setBusyId(opponent.id);
    try {
      await sendDuelChallenge(
        { id: user.id, name: user.username || user.full_name || 'Player' },
        { id: opponent.id, name: opponent.name || 'Player' }
      );
      showSuccess('Duel challenge sent.');
      onRefresh?.();
    } catch (error) {
      showError(error, 'PvP Challenge');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="grid h-full min-h-0 grid-cols-[minmax(0,1.35fr)_minmax(280px,.65fr)] gap-px bg-white/[0.055]">
      <section className="min-h-0 overflow-y-auto bg-[#080d14]/84 p-5">
        <div className="grid grid-cols-3 gap-2">
          {[
            ['Wins', pvp?.wins || 0, Trophy],
            ['Losses', pvp?.losses || 0, Shield],
            ['Matches', pvp?.matches || 0, Swords],
          ].map(([label, value, Icon]) => (
            <div key={label} className="border border-white/[0.06] bg-white/[0.02] p-3">
              <Icon className="h-3.5 w-3.5 text-rose-100/45" />
              <p className="mt-2 text-[6px] font-black uppercase tracking-[0.13em] text-white/26">{label}</p>
              <p className="mt-0.5 text-lg font-semibold text-white/82">{value}</p>
            </div>
          ))}
        </div>

        {activeDuel ? (
          <section className="mt-4 border border-rose-200/12 bg-rose-200/[0.035] p-4">
            <div className="flex items-center gap-2 text-[7px] font-black uppercase tracking-[0.15em] text-rose-100/52"><CircleDot className="h-3 w-3" />Active Duel</div>
            <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
              <div>
                <p className="text-[7px] text-white/30">{activeDuel.challenger_id === user?.id ? 'You' : 'Challenger'}</p>
                <strong className="mt-1 block text-[13px] text-white/84">{activeDuel.challenger_name || 'Challenger'}</strong>
                <p className="mt-1 text-[7px] text-white/34">{Number(activeDuel.challenger_power || 0).toLocaleString()} power</p>
              </div>
              <Swords className="h-5 w-5 text-rose-100/46" />
              <div className="text-right">
                <p className="text-[7px] text-white/30">{activeDuel.opponent_id === user?.id ? 'You' : 'Opponent'}</p>
                <strong className="mt-1 block text-[13px] text-white/84">{activeDuel.opponent_name || 'Opponent'}</strong>
                <p className="mt-1 text-[7px] text-white/34">{Number(activeDuel.opponent_power || 0).toLocaleString()} power</p>
              </div>
            </div>
            <p className="mt-4 text-[8px] leading-4 text-white/38">The duel uses the shared DuelSession pipeline. Both four-card loadouts are snapshotted when the challenge is accepted.</p>
          </section>
        ) : (
          <section className="mt-4 border border-white/[0.06] bg-white/[0.015] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[7px] font-black uppercase tracking-[0.14em] text-white/30">Challenge Players</p>
                <h3 className="mt-1 text-[13px] font-semibold text-white/78">Test your cards against a friend</h3>
              </div>
              <Users className="h-5 w-5 text-white/25" />
            </div>
            <div className="mt-3 divide-y divide-white/[0.045]">
              {(opponents || []).length ? opponents.map((opponent) => (
                <div key={opponent.id} className="flex items-center gap-3 py-2.5">
                  <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden border border-white/[0.07] bg-white/[0.025]">
                    {opponent.avatar ? <img src={opponent.avatar} alt="" className="h-full w-full object-cover" /> : <UserRound className="h-4 w-4 text-white/28" />}
                    <i className={'absolute bottom-0 right-0 h-2 w-2 border border-[#080d14] ' + (opponent.status === 'online' ? 'bg-emerald-300' : 'bg-slate-500')} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <strong className="block truncate text-[9px] text-white/72">{opponent.name}</strong>
                    <span className="text-[6px] uppercase tracking-[0.08em] text-white/28">{opponent.current_game || opponent.status}</span>
                  </div>
                  <button type="button" onClick={() => challenge(opponent)} disabled={busyId === opponent.id} className="flex h-8 items-center gap-1.5 border border-rose-200/12 bg-rose-200/[0.04] px-3 text-[7px] font-black uppercase tracking-[0.09em] text-rose-50/65 hover:bg-rose-200/[0.08] disabled:opacity-40">
                    {busyId === opponent.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Swords className="h-3 w-3" />}Challenge
                  </button>
                </div>
              )) : <div className="py-10 text-center text-[8px] text-white/30">Friends appear here when available for a duel challenge.</div>}
            </div>
          </section>
        )}

        <section className="mt-4">
          <p className="text-[7px] font-black uppercase tracking-[0.14em] text-white/26">Recent Duel Record</p>
          <div className="mt-2 divide-y divide-white/[0.045] border-y border-white/[0.05]">
            {recent.length ? recent.map((duel) => {
              const won = duel.winner_id === user?.id;
              const other = duel.challenger_id === user?.id ? duel.opponent_name : duel.challenger_name;
              return (
                <div key={duel.id} className="grid grid-cols-[80px_1fr_auto] items-center gap-3 py-2 text-[8px]">
                  <span className={won ? 'text-emerald-200/60' : 'text-rose-200/55'}>{won ? 'VICTORY' : 'DEFEAT'}</span>
                  <span className="truncate text-white/45">{other || 'Player'}</span>
                  <span className="text-white/22">{duel.battle_format || 'duel'}</span>
                </div>
              );
            }) : <div className="py-6 text-center text-[8px] text-white/25">No finished duels yet.</div>}
          </div>
        </section>
      </section>
      <LoadoutCore loadout={loadout} />
    </div>
  );
}

function ActivityPanel({ mode, activities, sessions, loadout, onStart, onAct, onAbandon, busy }) {
  const visible = useMemo(() => (activities || []).filter((row) => row.mode === mode), [activities, mode]);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    if (!visible.length) return;
    if (!visible.some((row) => row.id === selectedId)) setSelectedId(visible[0].id);
  }, [visible, selectedId]);

  const selected = visible.find((row) => row.id === selectedId) || visible[0] || null;
  const active = (sessions || []).find((row) => row.status === 'active' && row.activity_id === selected?.id) || null;
  const lastForActivity = (sessions || []).find((row) => row.activity_id === selected?.id) || null;
  const Icon = activityIcon(selected?.activity_type);
  const combat = selected && !['treasure', 'quest'].includes(selected.activity_type);
  const isWorldBoss = selected?.activity_type === 'world_boss';
  const enemyCurrent = isWorldBoss ? selected?.current_hp : (active?.enemy_hp_current ?? selected?.max_hp);
  const enemyMax = selected?.max_hp || 1;

  return (
    <div className="grid h-full min-h-0 grid-cols-[250px_minmax(0,1fr)_300px] gap-px bg-white/[0.055]">
      <nav className="min-h-0 overflow-y-auto bg-[#070c12]/88 p-3">
        <div className="px-2 pb-3">
          <p className="text-[6px] font-black uppercase tracking-[0.16em] text-white/24">{mode === 'pve' ? 'Encounter Select' : 'World Operations'}</p>
          <p className="mt-1 text-[9px] text-white/42">{visible.length} active activities</p>
        </div>
        <div className="space-y-1.5">
          {visible.map((activity) => {
            const ItemIcon = activityIcon(activity.activity_type);
            const currentSession = (sessions || []).find((row) => row.activity_id === activity.id && row.status === 'active');
            return (
              <button key={activity.id} type="button" onClick={() => setSelectedId(activity.id)} className={'w-full border p-3 text-left transition-colors ' + (activity.id === selected?.id ? 'border-cyan-100/16 bg-cyan-100/[0.055]' : 'border-white/[0.045] bg-white/[0.012] hover:bg-white/[0.03]')}>
                <div className="flex items-start gap-2.5">
                  <div className="grid h-8 w-8 shrink-0 place-items-center border border-white/[0.06] bg-white/[0.02]"><ItemIcon className="h-3.5 w-3.5 text-white/42" /></div>
                  <div className="min-w-0 flex-1">
                    <strong className="block truncate text-[9px] text-white/72">{activity.title}</strong>
                    <span className="mt-0.5 block truncate text-[6px] uppercase tracking-[0.08em] text-white/28">{String(activity.activity_type || '').replaceAll('_', ' ')} · {activity.difficulty}</span>
                  </div>
                </div>
                {currentSession && <div className="mt-2 flex items-center gap-1 text-[6px] font-black uppercase tracking-[0.1em] text-cyan-100/50"><CircleDot className="h-2.5 w-2.5" />In progress</div>}
              </button>
            );
          })}
        </div>
      </nav>

      <section className="relative min-h-0 overflow-y-auto bg-[#090f17]/84 p-5">
        {selected ? (
          <>
            <div className="pointer-events-none absolute right-[-70px] top-[-70px] h-52 w-52 rotate-45 border border-white/[0.045]" />
            <header className="relative z-10 flex items-start justify-between gap-5 border-b border-white/[0.06] pb-4">
              <div className="flex min-w-0 items-start gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center border border-white/[0.08] bg-white/[0.025]"><Icon className="h-5 w-5 text-cyan-100/55" /></div>
                <div className="min-w-0">
                  <p className="text-[6px] font-black uppercase tracking-[0.15em] text-cyan-100/36">{selected.subtitle}</p>
                  <h2 className="mt-1 text-[20px] font-semibold tracking-tight text-white/88">{selected.title}</h2>
                  <p className="mt-1 max-w-2xl text-[8px] leading-4 text-white/36">{selected.description}</p>
                </div>
              </div>
              <span className={'shrink-0 border px-2 py-1 text-[6px] font-black uppercase tracking-[0.11em] ' + (difficultyTone[selected.difficulty] || difficultyTone.normal)}>{selected.difficulty}</span>
            </header>

            <div className="mt-4 grid grid-cols-4 gap-2">
              {[
                ['Region', selected.region || 'Unknown', Map],
                ['Enemy Lv', selected.enemy_level || '—', Skull],
                ['Rec. Power', Number(selected.recommended_power || 0).toLocaleString(), Zap],
                ['Players', Number(selected.participants_count || 0).toLocaleString(), Users],
              ].map(([label, value, StatIcon]) => (
                <div key={label} className="border border-white/[0.05] bg-white/[0.015] p-2.5">
                  <StatIcon className="h-3 w-3 text-white/28" />
                  <p className="mt-2 text-[5px] font-black uppercase tracking-[0.1em] text-white/22">{label}</p>
                  <strong className="mt-0.5 block truncate text-[8px] text-white/62">{value}</strong>
                </div>
              ))}
            </div>

            {combat ? (
              <div className="mt-5 border border-white/[0.06] bg-black/[0.12] p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[6px] font-black uppercase tracking-[0.14em] text-white/26">{isWorldBoss ? 'Shared World Health' : 'Enemy Health'}</p>
                    <h3 className="mt-1 text-[13px] font-semibold text-white/76">{selected.enemy_name || selected.title}</h3>
                  </div>
                  <span className="text-[9px] tabular-nums text-white/46">{Number(enemyCurrent || 0).toLocaleString()} / {Number(enemyMax).toLocaleString()}</span>
                </div>
                <div className="mt-3 h-[7px] overflow-hidden bg-white/[0.05]"><div className="h-full bg-gradient-to-r from-rose-400/55 to-amber-200/60 transition-[width]" style={{ width: String(pct(enemyCurrent, enemyMax)) + '%' }} /></div>

                {active && (
                  <>
                    <div className="mt-5 flex items-center justify-between">
                      <div><p className="text-[6px] font-black uppercase tracking-[0.14em] text-white/26">Your AI Avatar</p><h3 className="mt-1 text-[12px] font-semibold text-white/70">Battle HP</h3></div>
                      <span className="text-[9px] tabular-nums text-white/42">{active.player_hp_current} / {active.player_hp_max}</span>
                    </div>
                    <div className="mt-2 h-[5px] overflow-hidden bg-white/[0.05]"><div className="h-full bg-emerald-300/48 transition-[width]" style={{ width: String(pct(active.player_hp_current, active.player_hp_max)) + '%' }} /></div>
                  </>
                )}
              </div>
            ) : (
              <div className="mt-5 border border-white/[0.06] bg-black/[0.12] p-4">
                <div className="flex items-center justify-between">
                  <div><p className="text-[6px] font-black uppercase tracking-[0.14em] text-white/26">Objective</p><h3 className="mt-1 text-[13px] font-semibold text-white/76">{selected.objective_text}</h3></div>
                  <span className="text-[9px] text-white/40">{active?.objective_progress || 0} / {active?.objective_target || selected.objective_target}</span>
                </div>
                <div className="mt-3 h-[6px] overflow-hidden bg-white/[0.05]"><div className="h-full bg-amber-200/50 transition-[width]" style={{ width: String(pct(active?.objective_progress || 0, active?.objective_target || selected.objective_target)) + '%' }} /></div>
              </div>
            )}

            <div className="mt-5 grid grid-cols-[1fr_auto] gap-3">
              <div className="border border-white/[0.05] bg-white/[0.012] p-3">
                <p className="text-[6px] font-black uppercase tracking-[0.12em] text-white/24">Rewards</p>
                <p className="mt-1 text-[8px] leading-4 text-amber-100/52">{selected.reward_description}</p>
                {lastForActivity?.status === 'completed' && <p className="mt-2 flex items-center gap-1 text-[6px] uppercase tracking-[0.09em] text-emerald-200/50"><Check className="h-3 w-3" />Completed previously</p>}
              </div>
              <div className="flex items-stretch gap-2">
                {active ? (
                  <>
                    <button type="button" disabled={busy} onClick={() => onAct(active.id)} className="flex min-w-[126px] items-center justify-center gap-2 border border-cyan-100/16 bg-cyan-100/[0.07] px-4 text-[8px] font-black uppercase tracking-[0.11em] text-cyan-50/75 hover:bg-cyan-100/[0.11] disabled:opacity-40">
                      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : combat ? <Swords className="h-3.5 w-3.5" /> : <Treasure className="h-3.5 w-3.5" />}
                      {combat ? 'Attack' : selected.activity_type === 'treasure' ? 'Search' : 'Advance'}
                    </button>
                    <button type="button" disabled={busy} onClick={() => onAbandon(active.id)} className="border border-white/[0.06] bg-white/[0.018] px-3 text-[7px] uppercase tracking-[0.09em] text-white/35 hover:text-white/60 disabled:opacity-40">Retreat</button>
                  </>
                ) : (
                  <button type="button" disabled={busy || !(loadout?.cards?.length)} onClick={() => onStart(selected.id)} className="flex min-w-[150px] items-center justify-center gap-2 border border-cyan-100/16 bg-cyan-100/[0.07] px-4 text-[8px] font-black uppercase tracking-[0.11em] text-cyan-50/75 hover:bg-cyan-100/[0.11] disabled:opacity-35">
                    {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ChevronRight className="h-3.5 w-3.5" />}Enter Encounter
                  </button>
                )}
              </div>
            </div>

            {active && (
              <div className="mt-3 grid grid-cols-3 gap-2 text-[7px]">
                <div className="border border-white/[0.045] bg-white/[0.012] p-2"><span className="text-white/24">Damage dealt</span><strong className="mt-1 block text-white/56">{Number(active.damage_dealt || 0).toLocaleString()}</strong></div>
                <div className="border border-white/[0.045] bg-white/[0.012] p-2"><span className="text-white/24">Damage taken</span><strong className="mt-1 block text-white/56">{Number(active.damage_taken || 0).toLocaleString()}</strong></div>
                <div className="border border-white/[0.045] bg-white/[0.012] p-2"><span className="text-white/24">Battle power</span><strong className="mt-1 block text-white/56">{Number(active.player_power || 0).toLocaleString()}</strong></div>
              </div>
            )}
          </>
        ) : <div className="grid h-full place-items-center text-[9px] text-white/28">No activities are active.</div>}
      </section>

      <LoadoutCore loadout={loadout} />
    </div>
  );
}

export default function LunaAIBattleOverlay({ onClose }) {
  const [mode, setMode] = useState('pvp');
  const battle = useAIBattleHub();

  const run = async (promise, successMessage) => {
    try {
      await promise;
      if (successMessage) showSuccess(successMessage);
    } catch (error) {
      showError(error, 'AI Battle');
    }
  };

  const activeMode = MODES.find((item) => item.id === mode) || MODES[0];
  const ActiveModeIcon = activeMode.icon;

  return (
    <div
      data-dashboard-utility-workspace
      aria-label="AI Battle workspace"
      className="fixed left-[330px] right-0 top-[64px] bottom-[32px] z-[130] pointer-events-auto overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(7,11,17,.96), rgba(13,20,30,.94) 46%, rgba(6,10,16,.97))',
        backdropFilter: 'blur(26px) saturate(132%)',
        WebkitBackdropFilter: 'blur(26px) saturate(132%)',
        boxShadow: 'inset 1px 0 0 rgba(255,255,255,.055), inset 0 1px 0 rgba(255,255,255,.035)',
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_8%,rgba(244,63,94,.07),transparent_30%),radial-gradient(circle_at_64%_18%,rgba(103,232,249,.055),transparent_34%),radial-gradient(circle_at_88%_88%,rgba(251,191,36,.045),transparent_30%)]" />
      <div className="pointer-events-none absolute -right-36 -top-44 h-[420px] w-[420px] rotate-45 border border-white/[0.035]" />

      <div className="relative z-10 flex h-full min-h-0 flex-col">
        <header className="flex shrink-0 items-center justify-between gap-5 border-b border-white/[0.07] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rotate-45 border border-white/[0.10] bg-white/[0.025]"><ActiveModeIcon className={'h-4 w-4 -rotate-45 ' + activeMode.tone} /></div>
            <div>
              <p className="text-[7px] font-black uppercase tracking-[0.2em] text-white/28">Luna Combat Network</p>
              <h1 className="mt-0.5 text-[21px] font-semibold tracking-tight text-white/90">AI Battle</h1>
              <p className="mt-0.5 text-[8px] text-white/34">Put your equipped cards to work across competitive, encounter, and world activities.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {battle.isFetching && <span className="flex items-center gap-1.5 text-[6px] uppercase tracking-[0.1em] text-white/25"><Loader2 className="h-3 w-3 animate-spin" />Syncing</span>}
            <button type="button" onClick={onClose} aria-label="Close AI Battle" className="grid h-9 w-9 place-items-center border border-white/[0.07] bg-white/[0.02] text-white/45 hover:bg-white/[0.06] hover:text-white"><X className="h-4 w-4" /></button>
          </div>
        </header>

        <div className="flex shrink-0 items-center border-b border-white/[0.055] px-6">
          {MODES.map(({ id, label, full, icon: Icon, tone }) => (
            <button key={id} type="button" onClick={() => setMode(id)} className={'relative flex min-w-[170px] items-center gap-2.5 px-4 py-3 text-left transition-colors ' + (mode === id ? 'bg-white/[0.03]' : 'hover:bg-white/[0.018]')}>
              <Icon className={'h-3.5 w-3.5 ' + (mode === id ? tone : 'text-white/25')} />
              <span>
                <strong className={mode === id ? 'text-[9px] text-white/82' : 'text-[9px] text-white/42'}>{label}</strong>
                <small className="mt-0.5 block text-[5.5px] uppercase tracking-[0.08em] text-white/22">{full}</small>
              </span>
              {mode === id && <i className="absolute inset-x-3 bottom-0 h-px bg-cyan-100/38" />}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-5 px-3 text-[7px]">
            <span className="text-white/25">Power <strong className="ml-1 text-white/60">{Number(battle.loadout?.player_power || 0).toLocaleString()}</strong></span>
            <span className="text-white/25">Cards <strong className="ml-1 text-white/60">{battle.loadout?.cards?.length || 0}/4</strong></span>
          </div>
        </div>

        <main className="min-h-0 flex-1">
          {battle.isLoading ? (
            <div className="grid h-full place-items-center"><div className="text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-cyan-100/40" /><p className="mt-3 text-[8px] uppercase tracking-[0.14em] text-white/28">Connecting battle network</p></div></div>
          ) : battle.error ? (
            <div className="grid h-full place-items-center"><div className="text-center"><Shield className="mx-auto h-7 w-7 text-rose-100/35" /><p className="mt-3 text-[10px] text-white/48">AI Battle could not load.</p><button type="button" onClick={() => battle.refetch()} className="mt-3 border border-white/[0.07] bg-white/[0.02] px-4 py-2 text-[7px] uppercase tracking-[0.1em] text-white/50">Retry</button></div></div>
          ) : mode === 'pvp' ? (
            <PvPPanel loadout={battle.loadout} pvp={battle.pvp} opponents={battle.opponents} duels={battle.duels} onRefresh={battle.refetch} />
          ) : (
            <ActivityPanel
              mode={mode}
              activities={battle.activities}
              sessions={battle.sessions}
              loadout={battle.loadout}
              busy={battle.isActing}
              onStart={(id) => run(battle.startActivity(id), 'Encounter started.')}
              onAct={(id) => run(battle.act(id))}
              onAbandon={(id) => run(battle.abandon(id), 'Encounter abandoned.')}
            />
          )}
        </main>

        <footer className="flex shrink-0 items-center justify-between border-t border-white/[0.055] px-6 py-2 text-[6px] uppercase tracking-[0.11em] text-white/22">
          <span>Card loadout snapshots · persistent encounter state · realtime world health</span>
          <span className="flex items-center gap-1.5"><BellRing className="h-3 w-3" />Battle backend connected</span>
        </footer>
      </div>
    </div>
  );
}
