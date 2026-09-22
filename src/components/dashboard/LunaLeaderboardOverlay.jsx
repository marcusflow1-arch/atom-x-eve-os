import { useMemo, useState } from 'react';
import { Award, Crown, Medal, Search, Shield, Swords, Target, Trophy, UserRound, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';

const TABS = [
  { id: 'achievements', label: 'Achievements', icon: Trophy },
  { id: 'pvp', label: 'PvP', icon: Swords },
  { id: 'pve', label: 'PvE', icon: Shield },
];

const numberOf = (...values) => {
  for (const value of values) {
    const number = Number(value);
    if (Number.isFinite(number)) return number;
  }
  return 0;
};

const nameOf = (user) => user?.username || user?.full_name || user?.display_name || user?.name || 'Player';

const rankTone = (rank) => {
  if (rank === 1) return 'border-amber-300/30 bg-amber-300/[0.07] text-amber-100';
  if (rank === 2) return 'border-slate-200/24 bg-slate-200/[0.055] text-slate-100';
  if (rank === 3) return 'border-orange-300/25 bg-orange-300/[0.055] text-orange-100';
  return 'border-white/[0.08] bg-white/[0.025] text-white/70';
};

function RankGlyph({ rank }) {
  if (rank === 1) return <Crown className="h-4 w-4" />;
  if (rank <= 3) return <Medal className="h-4 w-4" />;
  return <span className="text-[10px] font-black tabular-nums">{rank}</span>;
}

function EmptyLadder({ mode }) {
  return (
    <div className="grid min-h-[360px] place-items-center text-center">
      <div>
        <Target className="mx-auto h-8 w-8 text-white/22" />
        <h3 className="mt-3 text-sm font-semibold text-white/78">No ranked {mode} records yet</h3>
        <p className="mx-auto mt-1 max-w-md text-[10px] leading-5 text-white/38">
          This ladder will populate from recorded {mode} results as those systems write shared competitive stats.
        </p>
      </div>
    </div>
  );
}

export default function LunaLeaderboardOverlay({ onClose }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('achievements');
  const [search, setSearch] = useState('');

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['luna-leaderboard-users'],
    queryFn: () => base44.entities.User.list('-level', 150),
    staleTime: 15000,
    refetchInterval: 15000,
  });

  const { data: duels = [] } = useQuery({
    queryKey: ['luna-leaderboard-duels'],
    queryFn: async () => {
      try {
        return await base44.entities.DuelSession.list('-created_date', 750);
      } catch {
        return [];
      }
    },
    staleTime: 10000,
    refetchInterval: 10000,
  });

  const { data: progression = [] } = useQuery({
    queryKey: ['luna-leaderboard-progression'],
    queryFn: async () => {
      try {
        return await base44.entities.AvatarProgression.list('-global_xp', 150);
      } catch {
        return [];
      }
    },
    staleTime: 15000,
  });

  const progressionByUser = useMemo(
    () => new Map((progression || []).map((row) => [row.user_id, row])),
    [progression]
  );

  const duelStats = useMemo(() => {
    const stats = new Map();
    const ensure = (id) => {
      if (!id) return null;
      if (!stats.has(id)) stats.set(id, { wins: 0, losses: 0, matches: 0 });
      return stats.get(id);
    };

    (duels || []).forEach((duel) => {
      if (duel.status !== 'finished' || !duel.winner_id) return;
      const winner = ensure(duel.winner_id);
      const loser = ensure(duel.loser_id || (duel.challenger_id === duel.winner_id ? duel.opponent_id : duel.challenger_id));
      if (winner) {
        winner.wins += 1;
        winner.matches += 1;
      }
      if (loser) {
        loser.losses += 1;
        loser.matches += 1;
      }
    });

    return stats;
  }, [duels]);

  const rows = useMemo(() => {
    const source = (users || []).map((entry) => {
      const progress = progressionByUser.get(entry.id) || {};
      const duel = duelStats.get(entry.id) || { wins: 0, losses: 0, matches: 0 };
      const achievements = Array.isArray(entry.unlocked_achievements)
        ? entry.unlocked_achievements.length
        : numberOf(entry.achievements_count, entry.achievement_count);

      const achievementScore = numberOf(
        entry.gamer_score,
        entry.gamerScore,
        entry.achievement_score,
        achievements * 100
      );

      const explicitPvpWins = numberOf(entry.pvp_wins, entry.pvpWins, entry.competitive_wins);
      const explicitPvpLosses = numberOf(entry.pvp_losses, entry.pvpLosses, entry.competitive_losses);
      const pvpWins = explicitPvpWins || duel.wins;
      const pvpLosses = explicitPvpLosses || duel.losses;
      const pvpMatches = Math.max(duel.matches, pvpWins + pvpLosses);
      const pvpScore = numberOf(
        entry.pvp_rating,
        entry.pvp_mmr,
        entry.pvp_score,
        entry.competitive_score,
        pvpWins > 0 || pvpLosses > 0 ? Math.max(0, pvpWins * 100 - pvpLosses * 20) : 0
      );

      const pveKills = numberOf(entry.pve_kills, entry.pveKills, entry.enemy_kills);
      const bossKills = numberOf(entry.boss_kills, entry.bossKills);
      const raids = numberOf(entry.raid_completions, entry.raids_completed, entry.raid_wins);
      const pveScore = numberOf(
        entry.pve_score,
        entry.pve_points,
        entry.pve_rating,
        (pveKills || bossKills || raids) ? pveKills + bossKills * 25 + raids * 100 : 0
      );

      return {
        id: entry.id,
        name: nameOf(entry),
        avatar: entry.avatar_url || '',
        level: numberOf(progress.global_level, entry.level, 1),
        globalXp: numberOf(progress.global_xp),
        gamesPlayed: numberOf(entry.games_played, entry.gamesPlayed),
        achievements,
        achievementScore,
        pvpWins,
        pvpLosses,
        pvpMatches,
        pvpScore,
        pveKills,
        bossKills,
        raids,
        pveScore,
      };
    });

    let ranked;
    if (activeTab === 'pvp') {
      ranked = source
        .filter((row) => row.pvpMatches > 0 || row.pvpScore > 0)
        .sort((a, b) => b.pvpScore - a.pvpScore || b.pvpWins - a.pvpWins);
    } else if (activeTab === 'pve') {
      ranked = source
        .filter((row) => row.pveScore > 0 || row.pveKills > 0 || row.bossKills > 0 || row.raids > 0)
        .sort((a, b) => b.pveScore - a.pveScore || b.bossKills - a.bossKills);
    } else {
      ranked = source.sort((a, b) => b.achievementScore - a.achievementScore || b.achievements - a.achievements);
    }

    return ranked.map((row, index) => ({ ...row, rank: index + 1 }));
  }, [users, progressionByUser, duelStats, activeTab]);

  const filteredRows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((row) => row.name.toLowerCase().includes(needle));
  }, [rows, search]);

  const me = rows.find((row) => row.id === user?.id) || null;
  const topThree = filteredRows.slice(0, 3);

  const valueFor = (row) => {
    if (activeTab === 'pvp') return row.pvpScore.toLocaleString();
    if (activeTab === 'pve') return row.pveScore.toLocaleString();
    return row.achievementScore.toLocaleString();
  };

  const metaFor = (row) => {
    if (activeTab === 'pvp') {
      const total = Math.max(1, row.pvpWins + row.pvpLosses);
      return `${row.pvpWins}W · ${row.pvpLosses}L · ${Math.round((row.pvpWins / total) * 100)}%`;
    }
    if (activeTab === 'pve') return `${row.pveKills} kills · ${row.bossKills} bosses · ${row.raids} raids`;
    return `${row.achievements} achievements · ${row.gamesPlayed} games`;
  };

  const ActiveIcon = TABS.find((tab) => tab.id === activeTab)?.icon || Trophy;

  return (
    <div
      data-dashboard-utility-workspace
      aria-label="Leaderboard workspace"
      className="fixed left-[330px] right-0 top-[64px] bottom-[32px] z-[120] pointer-events-auto overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(11,18,29,.91), rgba(18,29,44,.86) 48%, rgba(8,15,25,.92))',
        backdropFilter: 'blur(26px) saturate(135%)',
        WebkitBackdropFilter: 'blur(26px) saturate(135%)',
        boxShadow: 'inset 1px 0 0 rgba(255,255,255,.055), inset 0 1px 0 rgba(255,255,255,.035)',
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_12%,rgba(103,232,249,.08),transparent_30%),radial-gradient(circle_at_82%_18%,rgba(251,191,36,.055),transparent_26%),radial-gradient(circle_at_72%_86%,rgba(99,102,241,.06),transparent_30%)]" />

      <div className="relative z-10 flex h-full min-h-0 flex-col">
        <header className="flex shrink-0 items-center justify-between border-b border-white/[0.07] px-7 py-5">
          <div>
            <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.24em] text-cyan-100/55">
              <Award className="h-3.5 w-3.5" />
              Atom X Eve Rankings
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">Leaderboard</h1>
            <p className="mt-1 text-[10px] text-white/38">Achievement mastery, competitive PvP, and PvE performance.</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close leaderboard"
            className="flex h-9 w-9 items-center justify-center border border-white/[0.08] bg-white/[0.03] text-white/55 transition-colors hover:bg-white/[0.08] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex shrink-0 items-center gap-2 border-b border-white/[0.055] px-7 py-3">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`flex h-9 items-center gap-2 border px-4 text-[9px] font-black uppercase tracking-[0.12em] transition-colors ${activeTab === id
                ? 'border-cyan-200/20 bg-cyan-200/[0.08] text-white'
                : 'border-white/[0.06] bg-white/[0.02] text-white/48 hover:bg-white/[0.05] hover:text-white'}`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}

          <div className="relative ml-auto w-[260px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search players"
              className="h-9 w-full border border-white/[0.07] bg-black/15 pl-9 pr-3 text-[9px] text-white outline-none placeholder:text-white/28 focus:border-cyan-200/18"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-7 py-5">
          {me && (
            <div className="mb-5 flex items-center gap-4 border border-cyan-200/10 bg-cyan-200/[0.035] px-4 py-3">
              <div className="flex h-10 w-10 items-center justify-center border border-cyan-200/12 bg-cyan-200/[0.05] text-cyan-100">
                <UserRound className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[7px] font-black uppercase tracking-[0.14em] text-cyan-100/45">Your Rank</p>
                <p className="mt-0.5 truncate text-sm font-semibold text-white">#{me.rank} · {me.name}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-base font-semibold tabular-nums text-white">{valueFor(me)}</p>
                <p className="text-[8px] text-white/38">{metaFor(me)}</p>
              </div>
            </div>
          )}

          {usersLoading ? (
            <div className="grid min-h-[380px] place-items-center text-[10px] text-white/40">Loading leaderboard…</div>
          ) : rows.length === 0 ? (
            <EmptyLadder mode={activeTab === 'pvp' ? 'PvP' : activeTab === 'pve' ? 'PvE' : 'achievement'} />
          ) : (
            <>
              {!search && topThree.length > 0 && (
                <div className="mb-5 grid grid-cols-3 gap-3">
                  {topThree.map((row) => (
                    <div
                      key={row.id}
                      className={`relative overflow-hidden border p-4 ${rankTone(row.rank)}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className={`flex h-8 w-8 items-center justify-center border ${rankTone(row.rank)}`}>
                          <RankGlyph rank={row.rank} />
                        </div>
                        <ActiveIcon className="h-4 w-4 opacity-55" />
                      </div>
                      <div className="mt-4 flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden border border-white/[0.08] bg-slate-900">
                          {row.avatar
                            ? <img src={row.avatar} alt="" className="h-full w-full object-cover" />
                            : <span className="text-sm font-black text-white/60">{row.name.charAt(0).toUpperCase()}</span>}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[11px] font-semibold text-white">{row.name}</p>
                          <p className="mt-0.5 text-[7px] uppercase tracking-[0.08em] text-white/36">Level {row.level}</p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <p className="text-xl font-semibold tabular-nums text-white">{valueFor(row)}</p>
                        <p className="mt-1 truncate text-[8px] text-white/40">{metaFor(row)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="overflow-hidden border border-white/[0.07] bg-black/10">
                <div className="grid grid-cols-[72px_1fr_140px_220px] border-b border-white/[0.06] px-4 py-2 text-[7px] font-black uppercase tracking-[0.13em] text-white/30">
                  <span>Rank</span>
                  <span>Player</span>
                  <span className="text-right">Score</span>
                  <span className="text-right">Record</span>
                </div>

                <div className="divide-y divide-white/[0.045]">
                  {filteredRows.map((row) => (
                    <div
                      key={row.id}
                      className={`grid grid-cols-[72px_1fr_140px_220px] items-center px-4 py-3 transition-colors hover:bg-white/[0.03] ${row.id === user?.id ? 'bg-cyan-200/[0.025]' : ''}`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`flex h-7 w-7 items-center justify-center border ${rankTone(row.rank)}`}>
                          <RankGlyph rank={row.rank} />
                        </div>
                      </div>

                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden border border-white/[0.07] bg-slate-900">
                          {row.avatar
                            ? <img src={row.avatar} alt="" className="h-full w-full object-cover" />
                            : <span className="text-xs font-black text-white/55">{row.name.charAt(0).toUpperCase()}</span>}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[10px] font-semibold text-white">{row.name}{row.id === user?.id ? ' · You' : ''}</p>
                          <p className="mt-0.5 text-[7px] text-white/30">Level {row.level}</p>
                        </div>
                      </div>

                      <p className="text-right text-[11px] font-semibold tabular-nums text-white">{valueFor(row)}</p>
                      <p className="truncate text-right text-[8px] text-white/38">{metaFor(row)}</p>
                    </div>
                  ))}

                  {filteredRows.length === 0 && (
                    <div className="py-16 text-center text-[9px] text-white/35">No players match that search.</div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
