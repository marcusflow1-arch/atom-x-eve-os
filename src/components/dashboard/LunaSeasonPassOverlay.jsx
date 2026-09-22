import { useMemo, useRef, useState } from 'react';
import {
  ArrowLeft, ArrowRight, Check, ChevronLeft, ChevronRight, Crown, Gift,
  Lock, Medal, ScrollText, Shield, Sparkles, Star, Swords, Target, Trophy, X, Zap
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';

const MAX_LEVEL = 20;

const REWARD_TYPES = [
  { icon: Zap, free: '500 Essence', premium: '1,000 Essence' },
  { icon: Gift, free: 'Card Cache', premium: 'Rare Card Cache' },
  { icon: Sparkles, free: 'Enchant Dust', premium: 'Over-Enchant Core' },
  { icon: Trophy, free: 'Achievement Token', premium: 'Prestige Token' },
  { icon: Shield, free: 'Upgrade Material', premium: 'Epic Equipment Cache' },
];

const MILESTONES = {
  5: { free: 'Season Card', premium: 'Epic Season Card' },
  10: { free: 'Avatar Banner', premium: 'Season Companion' },
  15: { free: 'Legendary Cache', premium: 'Mythical Card Cache' },
  20: { free: 'Season Emblem', premium: 'Ascendant Reward' },
};

const laneReward = (level, premium = false) => {
  const milestone = MILESTONES[level];
  if (milestone) return premium ? milestone.premium : milestone.free;
  const template = REWARD_TYPES[(level - 1) % REWARD_TYPES.length];
  return premium ? template.premium : template.free;
};

const rewardIcon = (level) => {
  if (level === 20) return Crown;
  if (level % 5 === 0) return Medal;
  return REWARD_TYPES[(level - 1) % REWARD_TYPES.length].icon;
};

function RewardTile({ level, premium, currentLevel }) {
  const Icon = rewardIcon(level);
  const unlocked = level <= currentLevel;
  const milestone = level % 5 === 0;

  return (
    <div
      className={`relative flex h-[108px] min-w-[116px] flex-col justify-between overflow-hidden border px-3 py-3 transition-all ${milestone
        ? premium
          ? 'border-amber-200/24 bg-amber-100/[0.075]'
          : 'border-cyan-100/18 bg-cyan-100/[0.055]'
        : premium
          ? 'border-amber-100/[0.10] bg-amber-100/[0.025]'
          : 'border-white/[0.07] bg-white/[0.022]'} ${unlocked ? '' : 'opacity-55'}`}
    >
      <div className="flex items-start justify-between">
        <div className={`flex h-8 w-8 items-center justify-center border ${premium ? 'border-amber-200/16 bg-amber-100/[0.055] text-amber-100/80' : 'border-cyan-100/12 bg-cyan-100/[0.04] text-cyan-100/75'}`}>
          <Icon className="h-4 w-4" />
        </div>
        {unlocked
          ? <Check className="h-3.5 w-3.5 text-emerald-300/70" />
          : <Lock className="h-3.5 w-3.5 text-white/25" />}
      </div>
      <div>
        <p className="line-clamp-2 text-[8px] font-semibold leading-3 text-white">{laneReward(level, premium)}</p>
        <p className={`mt-1 text-[6px] font-black uppercase tracking-[0.12em] ${premium ? 'text-amber-100/45' : 'text-white/35'}`}>Level {level}</p>
      </div>
      {milestone && <div className={`absolute inset-x-0 bottom-0 h-[2px] ${premium ? 'bg-amber-300/45' : 'bg-cyan-300/35'}`} />}
    </div>
  );
}

export default function LunaSeasonPassOverlay({ onClose }) {
  const { user } = useAuth();
  const [tab, setTab] = useState('rewards');
  const [track, setTrack] = useState('all');
  const scrollRef = useRef(null);

  const { data: progressionRows = [] } = useQuery({
    queryKey: ['luna-season-avatar-progression', user?.id],
    queryFn: () => base44.entities.AvatarProgression.filter({ user_id: user.id }),
    enabled: Boolean(user?.id),
    staleTime: 30000,
  });

  const { data: challenges = [], isLoading: challengesLoading } = useQuery({
    queryKey: ['luna-season-challenges'],
    queryFn: () => base44.entities.Challenge.list('-start_date', 100),
    staleTime: 30000,
  });

  const { data: achievements = [] } = useQuery({
    queryKey: ['luna-season-user-achievements', user?.id],
    queryFn: () => base44.entities.UserAchievement.filter({ user_id: user.id }, '-created_date', 500),
    enabled: Boolean(user?.id),
    staleTime: 30000,
  });

  const progression = progressionRows?.[0] || null;

  // There is no dedicated player SeasonPassProgress entity yet. Keep the pass
  // at its real initial state rather than misrepresenting global avatar level as season level.
  const currentLevel = 1;
  const currentXp = 0;
  const nextXp = 1000;

  const unlockedAchievementIds = useMemo(
    () => new Set((achievements || []).filter((row) => row.status === 'unlocked').map((row) => String(row.achievement_id))),
    [achievements]
  );

  const activeChallenges = useMemo(() => {
    const now = Date.now();
    return (challenges || [])
      .filter((challenge) => {
        if (challenge.status === 'active') return true;
        const start = new Date(challenge.start_date || 0).getTime();
        const end = new Date(challenge.end_date || 0).getTime();
        return start <= now && end >= now;
      })
      .slice(0, 12)
      .map((challenge) => {
        const targets = challenge.target_achievements || [];
        const complete = targets.filter((id) => unlockedAchievementIds.has(String(id))).length;
        const total = Math.max(1, targets.length);
        return { ...challenge, complete, total, pct: Math.round((complete / total) * 100) };
      });
  }, [challenges, unlockedAchievementIds]);

  const scrollRewards = (direction) => {
    scrollRef.current?.scrollBy({ left: direction * 520, behavior: 'smooth' });
  };

  const globalLevel = Number(progression?.global_level || user?.level || 1);

  return (
    <div
      data-dashboard-utility-workspace
      aria-label="Season Pass"
      className="fixed left-[330px] right-0 top-0 bottom-0 z-[132] pointer-events-auto overflow-hidden text-white"
      style={{
        background: 'linear-gradient(135deg, rgba(10,17,28,.96), rgba(21,32,49,.94) 48%, rgba(7,13,23,.98))',
        backdropFilter: 'blur(28px) saturate(138%)',
        WebkitBackdropFilter: 'blur(28px) saturate(138%)',
        boxShadow: 'inset 1px 0 0 rgba(255,255,255,.055)',
      }}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-[8%] -top-[18%] h-[68%] w-[62%] rounded-full bg-violet-500/[0.13] blur-[110px]" />
        <div className="absolute left-[18%] top-[4%] h-[46%] w-[42%] rounded-full bg-cyan-300/[0.075] blur-[100px]" />
        <div className="absolute bottom-[-20%] right-[18%] h-[50%] w-[48%] rounded-full bg-amber-300/[0.055] blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_0%,rgba(255,255,255,.022)_38%,transparent_66%)]" />
      </div>

      <div className="relative z-10 flex h-full min-h-0 flex-col">
        <header className="relative shrink-0 overflow-hidden border-b border-white/[0.065] px-8 pb-6 pt-7">
          <div className="pointer-events-none absolute right-7 top-1/2 -translate-y-1/2 opacity-[0.10]">
            <Crown className="h-44 w-44" />
          </div>

          <div className="relative flex items-start justify-between gap-8">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.24em] text-amber-100/55">
                <Sparkles className="h-3.5 w-3.5" />
                Season 01
              </div>
              <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.035em] text-white">Season of Ascension</h1>
              <p className="mt-2 max-w-xl text-[11px] leading-5 text-white/42">
                Play across Atom X Eve, complete seasonal objectives, and move through a shared reward path of cards, upgrade materials, cosmetics, and companion rewards.
              </p>

              <div className="mt-5 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setTab('rewards')}
                  className={`flex h-9 items-center gap-2 border px-4 text-[8px] font-black uppercase tracking-[0.12em] transition-colors ${tab === 'rewards' ? 'border-amber-200/22 bg-amber-100/[0.08] text-white' : 'border-white/[0.07] bg-white/[0.02] text-white/45 hover:text-white'}`}
                >
                  <Gift className="h-3.5 w-3.5" />
                  Rewards
                </button>
                <button
                  type="button"
                  onClick={() => setTab('missions')}
                  className={`flex h-9 items-center gap-2 border px-4 text-[8px] font-black uppercase tracking-[0.12em] transition-colors ${tab === 'missions' ? 'border-cyan-200/20 bg-cyan-100/[0.07] text-white' : 'border-white/[0.07] bg-white/[0.02] text-white/45 hover:text-white'}`}
                >
                  <ScrollText className="h-3.5 w-3.5" />
                  Missions
                </button>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="min-w-[210px] border border-white/[0.075] bg-white/[0.025] px-4 py-3 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <span className="text-[7px] font-black uppercase tracking-[0.14em] text-white/35">Season Level</span>
                  <span className="text-[10px] font-semibold text-amber-100">{currentLevel} / {MAX_LEVEL}</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden bg-white/[0.07]">
                  <div className="h-full bg-gradient-to-r from-cyan-300/70 to-amber-200/75" style={{ width: `${Math.min(100, (currentXp / nextXp) * 100)}%` }} />
                </div>
                <div className="mt-2 flex items-center justify-between text-[7px] text-white/34">
                  <span>{currentXp.toLocaleString()} / {nextXp.toLocaleString()} Season XP</span>
                  <span>Account Lv {globalLevel}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close Season Pass"
                className="flex h-10 w-10 items-center justify-center border border-white/[0.08] bg-black/15 text-white/55 transition-colors hover:bg-white/[0.07] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        {tab === 'rewards' ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex shrink-0 items-center justify-between border-b border-white/[0.05] px-8 py-3">
              <div className="flex items-center gap-2">
                {[
                  ['all', 'All'],
                  ['solo', 'Solo'],
                  ['pvp', 'PvP'],
                  ['pve', 'PvE'],
                ].map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTrack(id)}
                    className={`h-8 border px-3 text-[7px] font-black uppercase tracking-[0.11em] transition-colors ${track === id
                      ? 'border-white/[0.15] bg-white/[0.07] text-white'
                      : 'border-white/[0.055] bg-white/[0.015] text-white/38 hover:text-white'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button type="button" onClick={() => scrollRewards(-1)} className="flex h-8 w-8 items-center justify-center border border-white/[0.06] bg-white/[0.02] text-white/45 hover:text-white"><ChevronLeft className="h-4 w-4" /></button>
                <button type="button" onClick={() => scrollRewards(1)} className="flex h-8 w-8 items-center justify-center border border-white/[0.06] bg-white/[0.02] text-white/45 hover:text-white"><ChevronRight className="h-4 w-4" /></button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden px-8 py-5">
              <div ref={scrollRef} className="h-full overflow-x-auto overflow-y-hidden [scrollbar-width:thin]">
                <div className="min-w-max pr-10">
                  <div className="mb-3 grid grid-cols-[94px_repeat(20,116px)] gap-2">
                    <div className="flex items-end pb-1 text-[7px] font-black uppercase tracking-[0.15em] text-white/30">Tier</div>
                    {Array.from({ length: MAX_LEVEL }, (_, index) => index + 1).map((level) => (
                      <div key={level} className="flex h-7 items-center justify-center">
                        <span className={`text-[8px] font-black ${level <= currentLevel ? 'text-white' : 'text-white/30'}`}>{level}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mb-3 grid grid-cols-[94px_repeat(20,116px)] gap-2">
                    <div className="flex h-[108px] flex-col justify-center border-r border-white/[0.06] pr-3">
                      <span className="text-[7px] font-black uppercase tracking-[0.14em] text-cyan-100/45">Free</span>
                      <span className="mt-1 text-[10px] font-semibold text-white">Path</span>
                    </div>
                    {Array.from({ length: MAX_LEVEL }, (_, index) => index + 1).map((level) => (
                      <RewardTile key={`free-${level}`} level={level} premium={false} currentLevel={currentLevel} />
                    ))}
                  </div>

                  <div className="grid grid-cols-[94px_repeat(20,116px)] gap-2">
                    <div className="flex h-[108px] flex-col justify-center border-r border-amber-200/[0.08] pr-3">
                      <span className="text-[7px] font-black uppercase tracking-[0.14em] text-amber-100/50">Premium</span>
                      <span className="mt-1 text-[10px] font-semibold text-white">Path</span>
                    </div>
                    {Array.from({ length: MAX_LEVEL }, (_, index) => index + 1).map((level) => (
                      <RewardTile key={`premium-${level}`} level={level} premium currentLevel={currentLevel} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="shrink-0 border-t border-white/[0.055] px-8 py-4">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center border border-amber-200/15 bg-amber-100/[0.05] text-amber-100/75">
                  <Crown className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[9px] font-semibold text-white">Premium Path</p>
                  <p className="mt-0.5 text-[7px] text-white/36">Premium ownership and reward granting will connect to the platform season entitlement system.</p>
                </div>
                <button type="button" disabled className="ml-auto h-9 border border-amber-200/12 bg-amber-100/[0.04] px-5 text-[7px] font-black uppercase tracking-[0.12em] text-amber-100/35">
                  Premium Locked
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto px-8 py-6">
            <div className="mx-auto max-w-5xl">
              <div className="mb-5 flex items-end justify-between">
                <div>
                  <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.16em] text-cyan-100/50">
                    <Target className="h-3.5 w-3.5" />
                    Seasonal Objectives
                  </div>
                  <h2 className="mt-1 text-xl font-semibold text-white">Missions</h2>
                  <p className="mt-1 text-[9px] text-white/36">Active platform challenges feed this list automatically.</p>
                </div>
                <div className="flex items-center gap-2 text-[8px] text-white/35">
                  <Swords className="h-3.5 w-3.5" />
                  Solo · PvP · PvE
                </div>
              </div>

              {challengesLoading ? (
                <div className="grid min-h-[320px] place-items-center text-[9px] text-white/35">Loading active seasonal challenges…</div>
              ) : activeChallenges.length ? (
                <div className="grid grid-cols-2 gap-3">
                  {activeChallenges.map((challenge) => (
                    <div key={challenge.id} className="border border-white/[0.065] bg-white/[0.022] p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-cyan-100/10 bg-cyan-100/[0.035] text-cyan-100/70">
                          <Trophy className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-[11px] font-semibold text-white">{challenge.title}</p>
                              <p className="mt-1 line-clamp-2 text-[8px] leading-4 text-white/40">{challenge.description || 'Complete the seasonal objective.'}</p>
                            </div>
                            <span className="shrink-0 border border-white/[0.06] bg-white/[0.02] px-2 py-1 text-[6px] font-black uppercase tracking-[0.1em] text-white/40">{challenge.type || 'solo'}</span>
                          </div>

                          <div className="mt-4 h-1.5 overflow-hidden bg-white/[0.06]">
                            <div className="h-full bg-cyan-300/55" style={{ width: `${challenge.pct}%` }} />
                          </div>
                          <div className="mt-2 flex items-center justify-between text-[7px]">
                            <span className="text-white/38">{challenge.complete} / {challenge.total} objectives</span>
                            <span className="text-amber-100/55">{challenge.reward_description || 'Season XP reward'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid min-h-[340px] place-items-center border border-white/[0.055] bg-white/[0.015] text-center">
                  <div>
                    <ScrollText className="mx-auto h-8 w-8 text-white/20" />
                    <p className="mt-3 text-[10px] font-semibold text-white/60">No active seasonal challenges yet.</p>
                    <p className="mt-1 text-[8px] text-white/30">New Challenge records will appear here automatically when their season window opens.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
