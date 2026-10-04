import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import {
  Activity,
  Brain,
  Eye,
  Heart,
  Lightbulb,
  Lock,
  Network,
  Plus,
  Minus,
  Shield,
  Sparkles,
  Swords,
  Target,
  Users,
  Wind,
  Zap,
} from 'lucide-react';
import useAvatarCombatStats from '@/components/avatar/useAvatarCombatStats';
import { showError } from '@/components/error/ErrorToast';
import './avatar-progression-fantasy.css';

const KNOWLEDGE_CAP = 300;
const TEMPLATE_URL = '/ui/avatar-progression/stats-template.webp';

const ATTRIBUTE_DEFS = [
  { key: 'strength', label: 'Strength', icon: Swords, accent: '#ff7474', effect: 'Increases attack power and weapon effectiveness.' },
  { key: 'defense', label: 'Defense', icon: Shield, accent: '#6fc9ff', effect: 'Increases armor and damage reduction.' },
  { key: 'vitality', label: 'Vitality', icon: Heart, accent: '#5ef2a0', effect: 'Increases maximum HP and overall survivability.' },
  { key: 'agility', label: 'Agility', icon: Wind, accent: '#e9bf68', effect: 'Increases dodge chance and attack speed.' },
  { key: 'intelligence', label: 'Intelligence', icon: Eye, accent: '#d176ff', effect: 'Reduces cooldowns and improves skill efficiency.' },
  { key: 'wisdom', label: 'Wisdom', icon: Sparkles, accent: '#6fe7ff', effect: 'Increases ability damage and enhances effects.' },
];

const SKILL_BRANCHES = [
  { key: 'combat_reasoning', title: 'Combat Reasoning', icon: Swords, tint: 'from-rose-400/20 to-orange-300/5', effect: 'Target analysis, timing, counter logic and threat prioritization.' },
  { key: 'tactical_planning', title: 'Tactical Planning', icon: Target, tint: 'from-cyan-400/20 to-blue-300/5', effect: 'Positioning, party decisions, resource planning and objective logic.' },
  { key: 'social_intelligence', title: 'Social Intelligence', icon: Users, tint: 'from-pink-400/20 to-violet-300/5', effect: 'Dialogue awareness, teamwork, player preference and social memory.' },
  { key: 'exploration', title: 'Exploration', icon: Eye, tint: 'from-emerald-400/20 to-teal-300/5', effect: 'Discovery behavior, environmental awareness and hidden-path curiosity.' },
  { key: 'memory_recall', title: 'Memory & Recall', icon: Network, tint: 'from-violet-400/20 to-indigo-300/5', effect: 'Long-term pattern recall, cross-game memory and learned context.' },
  { key: 'creative_synthesis', title: 'Creative Synthesis', icon: Lightbulb, tint: 'from-amber-300/20 to-yellow-200/5', effect: 'Combines learned concepts into new strategies and novel responses.' },
];

const pct = value => `${(Number(value || 0) * 100).toFixed(1)}%`;

function xpToNextKnowledgeLevel(level) {
  return Math.round(140 * Math.pow(Math.max(1, Number(level) || 1), 1.18));
}

function knowledgeReward(level) {
  if (level === 1) return { points: 1, label: '1 Skill Point', bonus: 'Neural Seed' };
  if (level % 50 === 0) return { points: 4, label: '4 Skill Points', bonus: 'Cognition Core' };
  if (level % 25 === 0) return { points: 3, label: '3 Skill Points', bonus: 'Knowledge Cache' };
  if (level % 10 === 0) return { points: 2, label: '2 Skill Points', bonus: 'Neural Cache' };
  if (level % 5 === 0) return { points: 1, label: '1 Skill Point', bonus: 'Knowledge Reward' };
  return null;
}

function SkillBranch({ branch, rank, points, busy, onAllocate }) {
  const Icon = branch.icon;
  return <div className={`relative overflow-hidden rounded-[22px] border border-[#b89556]/20 bg-gradient-to-br ${branch.tint} p-4`}>
    <div className="absolute inset-0 bg-[#050a10]/84" />
    <div className="relative">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/[0.10] bg-white/[0.04]"><Icon className="h-4 w-4 text-cyan-100/75" /></div>
        <div><h4 className="font-serif text-sm font-semibold tracking-wide text-[#efe5d4]">{branch.title}</h4><p className="mt-1 text-[10px] leading-4 text-white/40">{branch.effect}</p></div>
      </div>
      <div className="mt-5 flex items-center gap-2">
        {Array.from({ length: 5 }, (_, i) => i + 1).map(node => <div key={node} className={`grid h-9 w-9 rotate-45 place-items-center border ${node <= rank ? 'border-cyan-200/50 bg-cyan-300/[0.14]' : node === rank + 1 ? 'border-[#d8bd82]/30 bg-white/[0.04]' : 'border-white/[0.06] bg-black/30'}`}><span className="-rotate-45 text-[8px] font-bold text-white/65">{node}</span></div>)}
        <div className="ml-auto text-right text-xs text-white/65">{rank}/5</div>
      </div>
      <button type="button" disabled={busy || points <= 0 || rank >= 5} onClick={() => onAllocate(branch)} className="mt-4 h-9 w-full border border-[#b89556]/15 bg-black/25 text-[8px] font-bold uppercase tracking-[.15em] text-[#d8c8a7]/65 transition hover:border-cyan-200/30 hover:text-cyan-100 disabled:opacity-25"><Plus className="mr-2 inline h-3 w-3" />{rank >= 5 ? 'Branch Mastered' : 'Unlock Next Node · 1 Skill Point'}</button>
    </div>
  </div>;
}

function ProgressRail({ currentLevel, claimed = [], onClaim, busy }) {
  const levels = useMemo(() => [1, 2, 3, 5, 8, 10, 15, 20, 25, 30], []);
  return <div className="rounded-[20px] border border-[#b89556]/20 bg-black/35 px-5 py-5">
    <div className="mb-4 flex items-center justify-between"><div><p className="text-[8px] font-bold uppercase tracking-[.22em] text-[#d6ba7b]">Knowledge Level Progression</p><p className="mt-1 text-xs text-white/45">Milestones across the AI avatar knowledge path.</p></div><strong className="font-serif text-lg text-[#efe5d4]">Lv {currentLevel}</strong></div>
    <div className="relative flex min-w-max items-start gap-6 overflow-x-auto pb-2">
      <div className="absolute left-7 right-7 top-6 h-px bg-gradient-to-r from-cyan-200/15 via-[#d9b86d]/45 to-cyan-200/15" />
      {levels.map(level => {
        const reward = knowledgeReward(level);
        const reached = level <= currentLevel;
        const wasClaimed = claimed.includes(level);
        return <div key={level} className="relative z-10 flex w-20 shrink-0 flex-col items-center">
          <div className={`grid h-12 w-12 place-items-center rounded-full border font-serif ${reached ? 'border-cyan-200/40 bg-cyan-300/[.10] text-white' : 'border-white/10 bg-[#060a10] text-white/25'}`}>{reached ? level : <Lock className="h-3 w-3" />}</div>
          {reward && <><span className="mt-2 text-center text-[7px] uppercase tracking-wider text-white/45">{reward.label}</span>{reached && <button type="button" disabled={busy || wasClaimed} onClick={() => onClaim(level)} className="mt-2 px-2 py-1 text-[7px] uppercase tracking-wider text-[#d9b86d] disabled:text-white/20">{wasClaimed ? 'Claimed' : 'Claim'}</button>}</>}
        </div>;
      })}
    </div>
  </div>;
}

function StatsTemplate({ state, busy, save }) {
  const s = state.combat;
  const p = state.progression;
  const allocations = state.allocations || {};
  const level = Number(s.level || 1);
  const xpPerLevel = Number(state.rules?.xp_per_level || 1000);
  const xp = Math.max(0, Number(p.global_xp || 0) - (level - 1) * xpPerLevel);
  const xpPercent = Math.min(100, (xp / xpPerLevel) * 100);
  const unavailable = busy || state.allocation_locked || Number(state.available || 0) <= 0;

  const allocate = async key => {
    if (unavailable) return;
    try {
      await save({ action: 'allocate', data: { stat: key, points: 1 } });
    } catch (error) {
      showError(error, 'Avatar Progression');
    }
  };

  const coreStats = [
    { icon: Heart, label: 'Max HP', value: Number(s.max_hp || 0).toLocaleString() },
    { icon: Swords, label: 'Attack', value: Number(s.attack || 0).toLocaleString() },
    { icon: Shield, label: 'Defense', value: Number(s.defense || 0).toLocaleString() },
    { icon: Wind, label: 'Dodge Chance', value: pct(s.dodge_chance) },
    { icon: Zap, label: 'Attack Speed', value: `${Number(s.attack_speed || 0).toFixed(3)}×` },
    { icon: Sparkles, label: 'Critical Chance', value: pct(s.crit_chance) },
    { icon: Brain, label: 'Cooldown Reduction', value: pct(s.cooldown_reduction) },
    { icon: Target, label: 'Ability Bonus', value: pct(s.ability_damage_bonus) },
  ];

  return <section className="ax-template-stage" aria-label="Avatar stats allocation">
    <img src={TEMPLATE_URL} alt="" aria-hidden="true" className="ax-template-image" />
    <div className="ax-template-shade" />

    <div className="ax-avatar-live">
      <div className="ax-avatar-level-ring"><span>LV</span><strong>{level}</strong></div>
      <div className="ax-xp-copy ax-live-surface"><b>{Math.floor(xp).toLocaleString()} / {xpPerLevel.toLocaleString()} XP</b><div className="ax-xp-track"><i style={{ width: `${xpPercent}%` }} /></div><small>{Math.max(0, xpPerLevel - xp).toLocaleString()} XP to next level</small></div>
      <div className="ax-points ax-live-surface"><span>Available stat points</span><strong>{Number(state.available || 0)}</strong><small>Use stat points to shape your avatar's core attributes and enhance its capabilities.</small></div>
      <div className="ax-results ax-live-surface">{coreStats.map(stat => <Result key={stat.label} icon={stat.icon} label={stat.label} value={stat.value} />)}</div>
    </div>

    <div className="ax-attributes-live">
      {ATTRIBUTE_DEFS.map(def => <AttributeOverlay key={def.key} def={def} value={Number(allocations[def.key] || 0)} busy={busy || state.allocation_locked} remaining={Number(state.available || 0)} onPlus={() => allocate(def.key)} />)}
    </div>
  </section>;
}

function Result({ icon: Icon, label, value }) {
  return <div className="ax-result"><Icon /><span><strong>{value}</strong><small>{label}</small></span></div>;
}

function AttributeOverlay({ def, value, remaining, busy, onPlus }) {
  const Icon = def.icon;
  return <article className="ax-attribute-overlay ax-live-surface" style={{ '--accent': def.accent }}>
    <div className="ax-icon-orb"><Icon /></div>
    <h3>{def.label}</h3>
    <strong className="ax-attribute-value">{value}</strong>
    <p className="ax-effect">{def.effect}</p>
    <div className="ax-stepper">
      <button type="button" aria-label={`Decrease ${def.label}`} title="Respec is not enabled for committed stat points" disabled><Minus /></button>
      <span>{value}</span>
      <button type="button" aria-label={`Increase ${def.label}`} disabled={busy || remaining <= 0} onClick={onPlus}><Plus /></button>
    </div>
  </article>;
}

export default function AvatarProgressionOverlay({ onClose, initialTab = 'skill' }) {
  const [tab, setTab] = useState(initialTab === 'stats' ? 'stats' : 'skill');
  const { state, isLoading: loading, error, refetch, save, saving: busy } = useAvatarCombatStats();
  const progression = state?.progression;

  useEffect(() => setTab(initialTab === 'stats' ? 'stats' : 'skill'), [initialTab]);
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const key = event => { if (event.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', key);
    return () => { document.body.style.overflow = previous; window.removeEventListener('keydown', key); };
  }, [onClose]);

  const allocateSkill = async branch => {
    try { await save({ action: 'allocateKnowledge', data: { branch: branch.key } }); }
    catch (error) { showError(error, 'Avatar Progression'); }
  };
  const claimKnowledgeReward = async level => {
    try { await save({ action: 'claimKnowledge', data: { level } }); }
    catch (error) { showError(error, 'Avatar Progression'); }
  };

  const threshold = progression ? xpToNextKnowledgeLevel(progression.knowledge_level) : 1;
  const percent = progression ? Math.min(100, (progression.knowledge_xp / threshold) * 100) : 0;
  const ranks = progression ? Object.values(progression.skill_allocations || {}).reduce((sum, value) => sum + Number(value || 0), 0) : 0;

  const overlay = <motion.div role="dialog" aria-modal="true" aria-label="Avatar progression" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="ax-progression-root">
    <button type="button" className="ax-close" onClick={onClose}>ESC · CLOSE</button>
    {error ? <div className="ax-load-state">{error.message}<button onClick={() => refetch()}>Try again</button></div> : loading || !progression ? <div className="ax-load-state">Loading avatar progression…</div> : <>
      {tab === 'stats' ? <StatsTemplate state={state} busy={busy} save={save} /> : <div className="ax-skill-page">
        <div className="ax-skill-header"><div><span>Knowledge Level</span><strong>{progression.knowledge_level}</strong><small>/ {KNOWLEDGE_CAP}</small><div className="ax-knowledge-track"><i style={{ width: `${percent}%` }} /></div><p>{Math.floor(progression.knowledge_xp)} / {threshold} XP</p></div><div className="ax-skill-metrics"><Metric label="Skill Points" value={progression.available_skill_points} /><Metric label="Nodes Unlocked" value={ranks} /></div></div>
        <div className="ax-skill-tabs"><button onClick={() => setTab('stats')}><Activity />Stats</button><button className="active"><Network />Skill Tree</button></div>
        <div className="ax-skill-grid">{SKILL_BRANCHES.map(branch => <SkillBranch key={branch.key} branch={branch} rank={Number(progression.skill_allocations?.[branch.key] || 0)} points={progression.available_skill_points} busy={busy} onAllocate={allocateSkill} />)}</div>
        <ProgressRail currentLevel={progression.knowledge_level} claimed={progression.claimed_knowledge_rewards} onClaim={claimKnowledgeReward} busy={busy} />
      </div>}
      {tab === 'stats' && <button type="button" className="ax-skill-tab-hit" aria-label="Open Skill Tree" onClick={() => setTab('skill')} />}
    </>}
  </motion.div>;

  return typeof document !== 'undefined' ? createPortal(overlay, document.body) : overlay;
}

function Metric({ label, value }) {
  return <div><span>{label}</span><strong>{value}</strong></div>;
}
