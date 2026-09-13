import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  Brain,
  ChevronRight,
  CircleDot,
  Crown,
  Eye,
  Heart,
  Lightbulb,
  Lock,
  Network,
  Plus,
  Shield,
  Sparkles,
  Swords,
  Target,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import { showError } from '@/components/error/ErrorToast';

const STAT_CAP = 200;
const KNOWLEDGE_CAP = 300;

const DEFAULT_STATS = { hp: 100, strength: 10, intelligence: 10, will: 10, tenacity: 10 };

const STAT_DEFS = [
  { key: 'hp', label: 'HP', icon: Heart, step: 10, accent: 'text-rose-300', description: 'Raises total avatar health and survival ceiling.' },
  { key: 'strength', label: 'Strength', icon: Swords, step: 1, accent: 'text-orange-300', description: 'Improves physical power and close-range output.' },
  { key: 'intelligence', label: 'Intelligence', icon: Brain, step: 1, accent: 'text-violet-300', description: 'Improves reasoning, ability scaling and learned behavior.' },
  { key: 'will', label: 'Will', icon: Zap, step: 1, accent: 'text-cyan-300', description: 'Improves resilience, resource control and recovery.' },
  { key: 'tenacity', label: 'Tenacity', icon: Shield, step: 1, accent: 'text-amber-300', description: 'Improves resistance to control, stagger and pressure.' },
];

const SKILL_BRANCHES = [
  { key: 'combat_reasoning', title: 'Combat Reasoning', icon: Swords, tint: 'from-rose-400/20 to-orange-300/5', effect: 'Target analysis, timing, counter logic and threat prioritization.' },
  { key: 'tactical_planning', title: 'Tactical Planning', icon: Target, tint: 'from-cyan-400/20 to-blue-300/5', effect: 'Positioning, party decisions, resource planning and objective logic.' },
  { key: 'social_intelligence', title: 'Social Intelligence', icon: Users, tint: 'from-pink-400/20 to-violet-300/5', effect: 'Dialogue awareness, teamwork, player preference and social memory.' },
  { key: 'exploration', title: 'Exploration', icon: Eye, tint: 'from-emerald-400/20 to-teal-300/5', effect: 'Discovery behavior, environmental awareness and hidden-path curiosity.' },
  { key: 'memory_recall', title: 'Memory & Recall', icon: Network, tint: 'from-violet-400/20 to-indigo-300/5', effect: 'Long-term pattern recall, cross-game memory and learned context.' },
  { key: 'creative_synthesis', title: 'Creative Synthesis', icon: Lightbulb, tint: 'from-amber-300/20 to-yellow-200/5', effect: 'Combines learned concepts into new strategies and novel responses.' },
];

function xpToNextAvatarLevel(level) {
  return Math.round(100 * Math.pow(Math.max(1, Number(level) || 1), 1.35));
}

function xpToNextKnowledgeLevel(level) {
  return Math.round(140 * Math.pow(Math.max(1, Number(level) || 1), 1.18));
}

function statReward(level) {
  if (level === 1) return { points: 1, label: '1 Stat Point', bonus: 'Starter Core' };
  if (level % 50 === 0) return { points: 4, label: '4 Stat Points', bonus: 'Ascendant Core Cache' };
  if (level % 25 === 0) return { points: 3, label: '3 Stat Points', bonus: 'Avatar Core Cache' };
  if (level % 10 === 0) return { points: 2, label: '2 Stat Points', bonus: 'Progression Cache' };
  if (level % 5 === 0) return { points: 1, label: '1 Stat Point', bonus: 'Season Reward' };
  return null;
}

function knowledgeReward(level) {
  if (level === 1) return { points: 1, label: '1 Skill Point', bonus: 'Neural Seed' };
  if (level % 50 === 0) return { points: 4, label: '4 Skill Points', bonus: 'Cognition Core' };
  if (level % 25 === 0) return { points: 3, label: '3 Skill Points', bonus: 'Knowledge Cache' };
  if (level % 10 === 0) return { points: 2, label: '2 Skill Points', bonus: 'Neural Cache' };
  if (level % 5 === 0) return { points: 1, label: '1 Skill Point', bonus: 'Knowledge Reward' };
  return null;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number(value) || min));
}

function ProgressRail({ cap, currentLevel, claimed = [], rewardForLevel, onClaim, busy, typeLabel }) {
  const levels = useMemo(() => Array.from({ length: cap }, (_, index) => index + 1), [cap]);
  return (
    <div className="relative overflow-hidden rounded-[24px] border border-white/[0.06] bg-white/[0.025]">
      <div className="flex items-center justify-between gap-4 border-b border-white/[0.055] px-5 py-4">
        <div>
          <p className="text-[8px] font-black uppercase tracking-[.22em] text-white/30">Seasonal Progression Timeline</p>
          <h3 className="mt-1 text-sm font-bold text-white/85">{typeLabel} 1–{cap}</h3>
        </div>
        <div className="text-right"><span className="text-[8px] uppercase tracking-wider text-white/25">Current</span><div className="text-lg font-black text-white">Lv {currentLevel}</div></div>
      </div>
      <div className="overflow-x-auto px-5 py-5" style={{ scrollbarWidth: 'thin' }}>
        <div className="relative flex min-w-max items-start gap-2 pb-2">
          <div className="absolute left-8 right-8 top-[24px] h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
          {levels.map((level) => {
            const reward = rewardForLevel(level);
            const reached = level <= currentLevel;
            const wasClaimed = claimed.includes(level);
            const major = Boolean(reward);
            return (
              <div key={level} className={`relative z-10 flex w-[68px] shrink-0 flex-col items-center ${major ? 'min-h-[148px]' : 'min-h-[82px]'}`}>
                <div className={`grid h-12 w-12 place-items-center rounded-full border text-[10px] font-black transition ${reached ? 'border-cyan-200/30 bg-cyan-300/[0.10] text-white shadow-[0_0_24px_rgba(103,232,249,.08)]' : 'border-white/[0.06] bg-[#080b11] text-white/20'}`}>
                  {reached ? level : <Lock className="h-3 w-3" />}
                </div>
                {major ? (
                  <div className="mt-2 w-full text-center">
                    <div className="text-[7px] font-black uppercase tracking-[.08em] text-white/55">{reward.label}</div>
                    <div className="mt-0.5 text-[7px] leading-3 text-white/25">{reward.bonus}</div>
                    {reached && (
                      <button
                        type="button"
                        disabled={busy || wasClaimed}
                        onClick={() => onClaim(level, reward)}
                        className={`mt-2 rounded-full px-2 py-1 text-[7px] font-black uppercase tracking-wider transition ${wasClaimed ? 'bg-emerald-300/[0.08] text-emerald-200/45' : 'bg-white text-black hover:bg-cyan-50'} disabled:cursor-default`}
                      >
                        {wasClaimed ? 'Claimed' : 'Claim'}
                      </button>
                    )}
                  </div>
                ) : <span className="mt-2 text-[7px] text-white/18">Level</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatCard({ definition, value, points, busy, onAllocate }) {
  const Icon = definition.icon;
  return (
    <div className="group rounded-[20px] border border-white/[0.055] bg-white/[0.025] p-4 transition hover:bg-white/[0.04]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/[0.045] ${definition.accent}`}><Icon className="h-4 w-4" /></div>
          <div className="min-w-0"><h4 className="text-sm font-black text-white">{definition.label}</h4><p className="mt-1 text-[10px] leading-4 text-white/30">{definition.description}</p></div>
        </div>
        <div className="text-right"><span className="text-[8px] uppercase tracking-wider text-white/25">Current</span><div className="text-xl font-black tabular-nums text-white">{value}</div></div>
      </div>
      <button
        type="button"
        disabled={busy || points <= 0}
        onClick={() => onAllocate(definition)}
        className="mt-4 flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-white/[0.055] text-[8px] font-black uppercase tracking-[.14em] text-white/55 transition hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-25"
      >
        <Plus className="h-3 w-3" /> +{definition.step} {definition.label} · 1 Point
      </button>
    </div>
  );
}

function SkillBranch({ branch, rank, points, busy, onAllocate }) {
  const Icon = branch.icon;
  const maxRank = 5;
  return (
    <div className={`relative overflow-hidden rounded-[22px] border border-white/[0.06] bg-gradient-to-br ${branch.tint} p-4`}>
      <div className="absolute inset-0 bg-[#080b12]/78" />
      <div className="relative">
        <div className="flex items-start gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.05]"><Icon className="h-4 w-4 text-white/75" /></div><div><h4 className="text-sm font-black text-white">{branch.title}</h4><p className="mt-1 text-[10px] leading-4 text-white/32">{branch.effect}</p></div></div>
        <div className="mt-4 flex items-center gap-2">
          {Array.from({ length: maxRank }, (_, index) => index + 1).map((node) => (
            <div key={node} className={`relative grid h-9 w-9 place-items-center rotate-45 border transition ${node <= rank ? 'border-cyan-200/45 bg-cyan-300/[0.14] shadow-[0_0_18px_rgba(103,232,249,.12)]' : node === rank + 1 ? 'border-white/20 bg-white/[0.055]' : 'border-white/[0.055] bg-black/20'}`}>
              <span className="-rotate-45 text-[8px] font-black text-white/65">{node}</span>
            </div>
          ))}
          <div className="ml-auto text-right"><span className="text-[7px] uppercase tracking-wider text-white/25">Rank</span><div className="text-sm font-black text-white">{rank}/{maxRank}</div></div>
        </div>
        <button
          type="button"
          disabled={busy || points <= 0 || rank >= maxRank}
          onClick={() => onAllocate(branch)}
          className="mt-4 flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-white/[0.055] text-[8px] font-black uppercase tracking-[.14em] text-white/55 transition hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-25"
        >
          <Plus className="h-3 w-3" /> {rank >= maxRank ? 'Branch Mastered' : 'Unlock Next Node · 1 Skill Point'}
        </button>
      </div>
    </div>
  );
}

export default function AvatarProgressionOverlay({ onClose, initialTab = 'skill' }) {
  const { user } = useAuth();
  const [tab, setTab] = useState(initialTab === 'stats' ? 'stats' : 'skill');
  const [progression, setProgression] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setTab(initialTab === 'stats' ? 'stats' : 'skill');
  }, [initialTab]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, []);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const rows = await base44.entities.AvatarProgression.filter({ user_id: user.id });
      let record = rows?.[0];
      if (!record) {
        record = await base44.entities.AvatarProgression.create({
          user_id: user.id,
          global_level: 1,
          global_xp: 0,
          available_stat_points: 1,
          stats: DEFAULT_STATS,
          knowledge_level: 1,
          knowledge_xp: 0,
          available_skill_points: 1,
          skill_allocations: {},
          claimed_stat_rewards: [],
          claimed_knowledge_rewards: [],
        });
      }
      const normalized = {
        ...record,
        global_level: clamp(record.global_level || 1, 1, STAT_CAP),
        global_xp: Number(record.global_xp || 0),
        available_stat_points: Number(record.available_stat_points || 0),
        stats: { ...DEFAULT_STATS, ...(record.stats || {}) },
        knowledge_level: clamp(record.knowledge_level || record.global_level || 1, 1, KNOWLEDGE_CAP),
        knowledge_xp: Number(record.knowledge_xp || 0),
        available_skill_points: Number(record.available_skill_points || 0),
        skill_allocations: record.skill_allocations || {},
        claimed_stat_rewards: Array.isArray(record.claimed_stat_rewards) ? record.claimed_stat_rewards : [],
        claimed_knowledge_rewards: Array.isArray(record.claimed_knowledge_rewards) ? record.claimed_knowledge_rewards : [],
      };
      setProgression(normalized);

      if (record.knowledge_level == null || record.skill_allocations == null || record.claimed_stat_rewards == null || record.claimed_knowledge_rewards == null) {
        await base44.entities.AvatarProgression.update(record.id, {
          knowledge_level: normalized.knowledge_level,
          knowledge_xp: normalized.knowledge_xp,
          available_skill_points: normalized.available_skill_points,
          skill_allocations: normalized.skill_allocations,
          claimed_stat_rewards: normalized.claimed_stat_rewards,
          claimed_knowledge_rewards: normalized.claimed_knowledge_rewards,
        });
      }
    } catch (error) {
      showError(error, 'Avatar Progression');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const savePatch = async (patch) => {
    if (!progression?.id || busy) return false;
    setBusy(true);
    try {
      await base44.entities.AvatarProgression.update(progression.id, patch);
      setProgression((current) => ({ ...current, ...patch }));
      window.dispatchEvent(new CustomEvent('syncPlayerStats'));
      return true;
    } catch (error) {
      showError(error, 'Avatar Progression');
      return false;
    } finally {
      setBusy(false);
    }
  };

  const allocateStat = async (definition) => {
    if (!progression || progression.available_stat_points <= 0) return;
    const stats = { ...progression.stats, [definition.key]: Number(progression.stats?.[definition.key] || 0) + definition.step };
    await savePatch({ stats, available_stat_points: progression.available_stat_points - 1 });
  };

  const claimStatReward = async (level, reward) => {
    if (progression.claimed_stat_rewards.includes(level) || level > progression.global_level) return;
    await savePatch({
      available_stat_points: progression.available_stat_points + reward.points,
      claimed_stat_rewards: [...progression.claimed_stat_rewards, level].sort((a, b) => a - b),
    });
  };

  const allocateSkill = async (branch) => {
    if (!progression || progression.available_skill_points <= 0) return;
    const currentRank = Number(progression.skill_allocations?.[branch.key] || 0);
    if (currentRank >= 5) return;
    const skill_allocations = { ...(progression.skill_allocations || {}), [branch.key]: currentRank + 1 };
    await savePatch({ skill_allocations, available_skill_points: progression.available_skill_points - 1 });
  };

  const claimKnowledgeReward = async (level, reward) => {
    if (progression.claimed_knowledge_rewards.includes(level) || level > progression.knowledge_level) return;
    await savePatch({
      available_skill_points: progression.available_skill_points + reward.points,
      claimed_knowledge_rewards: [...progression.claimed_knowledge_rewards, level].sort((a, b) => a - b),
    });
  };

  const avatarThreshold = progression ? xpToNextAvatarLevel(progression.global_level) : 1;
  const knowledgeThreshold = progression ? xpToNextKnowledgeLevel(progression.knowledge_level) : 1;
  const avatarPercent = progression ? Math.min(100, (progression.global_xp / avatarThreshold) * 100) : 0;
  const knowledgePercent = progression ? Math.min(100, (progression.knowledge_xp / knowledgeThreshold) * 100) : 0;
  const totalSkillRanks = progression ? Object.values(progression.skill_allocations || {}).reduce((sum, value) => sum + Number(value || 0), 0) : 0;

  const overlay = (
    <motion.div
      data-avatar-progression-overlay="true"
      role="dialog"
      aria-modal="true"
      aria-label="Avatar progression"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[12000] h-[100dvh] w-screen overflow-hidden bg-[#03060b] text-white"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(56,189,248,.10),transparent_28%),radial-gradient(circle_at_80%_14%,rgba(139,92,246,.08),transparent_24%),linear-gradient(145deg,#070b12_0%,#03060b_48%,#07090f_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.014)_1px,transparent_1px)] [background-size:48px_48px]" />

      <div className="relative z-10 flex h-full min-h-0 flex-col">
        <header className="shrink-0 border-b border-white/[0.055] px-6 py-5 lg:px-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[.28em] text-cyan-200/45"><CircleDot className="h-3.5 w-3.5" /> AI Avatar Progression</div>
              <h1 className="mt-2 text-2xl font-black tracking-tight md:text-3xl">Build the avatar, then build the mind.</h1>
              <p className="mt-1 max-w-3xl text-xs leading-5 text-white/32">Stats shape the avatar’s physical progression through level 200. Skill Tree develops its knowledge and decision strengths through level 300.</p>
            </div>
            <div className="flex items-center gap-3"><span className="rounded-full border border-white/[0.08] bg-white/[0.035] px-3 py-2 text-[8px] font-black uppercase tracking-[.18em] text-white/35">Esc · Close</span></div>
          </div>

          <nav className="mt-5 flex items-center gap-1 border-t border-white/[0.045] pt-3" aria-label="Avatar progression sections">
            {[['stats', 'Stats', Activity], ['skill', 'Skill Tree', Network]].map(([id, label, Icon]) => (
              <button key={id} type="button" onClick={() => setTab(id)} className={`relative flex items-center gap-2 px-5 py-2.5 text-[9px] font-black uppercase tracking-[.16em] transition ${tab === id ? 'text-white' : 'text-white/30 hover:text-white/65'}`}>
                <Icon className="h-3.5 w-3.5" /> {label}
                <span className={`absolute inset-x-3 -bottom-[13px] h-px bg-gradient-to-r from-transparent via-cyan-200 to-transparent transition-opacity ${tab === id ? 'opacity-100' : 'opacity-0'}`} />
              </button>
            ))}
          </nav>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto px-6 py-6 lg:px-10" style={{ scrollbarWidth: 'thin' }}>
          {loading || !progression ? (
            <div className="grid min-h-[60vh] place-items-center"><div className="text-center"><div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-white/10 border-t-cyan-300" /><p className="mt-4 text-xs text-white/30">Loading avatar progression…</p></div></div>
          ) : (
            <AnimatePresence mode="wait">
              {tab === 'stats' ? (
                <motion.section key="stats" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.18 }} className="space-y-6 pb-10">
                  <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
                    <div className="rounded-[26px] border border-white/[0.06] bg-white/[0.025] p-5 md:p-6">
                      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                        <div><span className="text-[8px] font-black uppercase tracking-[.22em] text-white/28">Avatar Level</span><div className="mt-1 flex items-end gap-3"><strong className="text-5xl font-black tracking-tight text-white">{progression.global_level}</strong><span className="pb-1 text-xs text-white/25">/ {STAT_CAP}</span></div></div>
                        <div className="text-left sm:text-right"><span className="text-[8px] font-black uppercase tracking-[.18em] text-white/28">Unspent Stat Points</span><div className="mt-1 text-3xl font-black text-cyan-200">{progression.available_stat_points}</div></div>
                      </div>
                      <div className="mt-5"><div className="mb-2 flex justify-between text-[8px] font-bold uppercase tracking-wider text-white/28"><span>{Math.floor(progression.global_xp)} XP</span><span>{avatarThreshold} XP to next level</span></div><div className="h-2 overflow-hidden rounded-full bg-black/35"><motion.div animate={{ width: `${avatarPercent}%` }} className="h-full bg-gradient-to-r from-cyan-400 via-sky-300 to-white" /></div></div>
                    </div>
                    <div className="rounded-[26px] border border-cyan-200/[0.10] bg-cyan-300/[0.035] p-5"><Trophy className="h-5 w-5 text-cyan-200/60" /><h3 className="mt-4 text-sm font-black">Seasonal Stat Track</h3><p className="mt-2 text-[10px] leading-5 text-white/32">Reach avatar levels through gameplay. Milestone rewards add spendable stat points; major checkpoints award larger progression caches.</p></div>
                  </div>

                  <div><div className="mb-3 flex items-end justify-between"><div><span className="text-[8px] font-black uppercase tracking-[.2em] text-white/25">Attribute Allocation</span><h2 className="mt-1 text-xl font-black">Core Stats</h2></div><span className="text-[9px] text-white/25">Changes save to your AvatarProgression profile</span></div><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{STAT_DEFS.map((definition) => <StatCard key={definition.key} definition={definition} value={progression.stats?.[definition.key] ?? DEFAULT_STATS[definition.key]} points={progression.available_stat_points} busy={busy} onAllocate={allocateStat} />)}</div></div>

                  <ProgressRail cap={STAT_CAP} currentLevel={progression.global_level} claimed={progression.claimed_stat_rewards} rewardForLevel={statReward} onClaim={claimStatReward} busy={busy} typeLabel="Avatar Levels" />
                </motion.section>
              ) : (
                <motion.section key="skill" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.18 }} className="space-y-6 pb-10">
                  <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
                    <div className="rounded-[26px] border border-white/[0.06] bg-white/[0.025] p-5 md:p-6">
                      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><span className="text-[8px] font-black uppercase tracking-[.22em] text-white/28">Knowledge Level</span><div className="mt-1 flex items-end gap-3"><strong className="text-5xl font-black tracking-tight text-white">{progression.knowledge_level}</strong><span className="pb-1 text-xs text-white/25">/ {KNOWLEDGE_CAP}</span></div></div><div className="grid grid-cols-2 gap-6 text-right"><div><span className="text-[8px] font-black uppercase tracking-[.18em] text-white/28">Skill Points</span><div className="mt-1 text-3xl font-black text-violet-200">{progression.available_skill_points}</div></div><div><span className="text-[8px] font-black uppercase tracking-[.18em] text-white/28">Nodes</span><div className="mt-1 text-3xl font-black text-white">{totalSkillRanks}<span className="text-sm text-white/25">/30</span></div></div></div></div>
                      <div className="mt-5"><div className="mb-2 flex justify-between text-[8px] font-bold uppercase tracking-wider text-white/28"><span>{Math.floor(progression.knowledge_xp)} Knowledge XP</span><span>{knowledgeThreshold} XP to next level</span></div><div className="h-2 overflow-hidden rounded-full bg-black/35"><motion.div animate={{ width: `${knowledgePercent}%` }} className="h-full bg-gradient-to-r from-violet-400 via-cyan-300 to-white" /></div></div>
                    </div>
                    <div className="rounded-[26px] border border-violet-200/[0.10] bg-violet-300/[0.035] p-5"><Brain className="h-5 w-5 text-violet-200/65" /><h3 className="mt-4 text-sm font-black">Neural Growth</h3><p className="mt-2 text-[10px] leading-5 text-white/32">Knowledge levels create skill points. Spend them in the categories you want the AI avatar to become stronger at instead of forcing one universal build.</p></div>
                  </div>

                  <div className="relative overflow-hidden rounded-[28px] border border-white/[0.06] bg-[#070a10]/80 p-5 md:p-7">
                    <div className="pointer-events-none absolute left-1/2 top-[88px] h-[calc(100%-120px)] w-px -translate-x-1/2 bg-gradient-to-b from-cyan-300/30 via-white/[0.05] to-transparent" />
                    <div className="relative mx-auto mb-6 flex w-fit items-center gap-3 rounded-full border border-cyan-200/15 bg-cyan-300/[0.06] px-5 py-3 shadow-[0_0_50px_rgba(103,232,249,.08)]"><Crown className="h-4 w-4 text-cyan-200" /><div><span className="block text-[7px] font-black uppercase tracking-[.2em] text-white/30">AI Core</span><strong className="text-xs text-white">Choose how the avatar thinks</strong></div></div>
                    <div className="relative grid gap-3 md:grid-cols-2 xl:grid-cols-3">{SKILL_BRANCHES.map((branch) => <SkillBranch key={branch.key} branch={branch} rank={Number(progression.skill_allocations?.[branch.key] || 0)} points={progression.available_skill_points} busy={busy} onAllocate={allocateSkill} />)}</div>
                  </div>

                  <ProgressRail cap={KNOWLEDGE_CAP} currentLevel={progression.knowledge_level} claimed={progression.claimed_knowledge_rewards} rewardForLevel={knowledgeReward} onClaim={claimKnowledgeReward} busy={busy} typeLabel="Knowledge Levels" />
                </motion.section>
              )}
            </AnimatePresence>
          )}
        </main>
      </div>
    </motion.div>
  );

  return typeof document !== 'undefined' ? createPortal(overlay, document.body) : overlay;
}
