import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  Brain,
  Compass,
  Eye,
  Heart,
  Lightbulb,
  Lock,
  Minus,
  Network,
  Plus,
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
  {
    key: 'combat_reasoning', title: 'Combat Reasoning', verbs: 'Analyze · Adapt · Overcome', icon: Swords,
    color: '#ff8079', glow: 'rgba(255,91,87,.20)',
    description: 'Develop combat analysis, risk assessment, counter logic and adaptive decision-making.',
  },
  {
    key: 'tactical_planning', title: 'Tactical Planning', verbs: 'Plan · Coordinate · Execute', icon: Shield,
    color: '#78cfff', glow: 'rgba(64,169,255,.20)',
    description: 'Improve strategic thinking, positioning, resource management and long-term planning.',
  },
  {
    key: 'social_intelligence', title: 'Social Intelligence', verbs: 'Understand · Connect · Influence', icon: Users,
    color: '#77e7a7', glow: 'rgba(61,230,142,.20)',
    description: 'Enhance communication, empathy, persuasion, teamwork and relationship awareness.',
  },
  {
    key: 'exploration', title: 'Exploration', verbs: 'Discover · Learn · Adapt', icon: Compass,
    color: '#e8c46d', glow: 'rgba(231,186,87,.20)',
    description: 'Expand curiosity, pattern recognition, environmental awareness and hidden-path discovery.',
  },
  {
    key: 'memory_recall', title: 'Memory & Recall', verbs: 'Remember · Organize · Apply', icon: Brain,
    color: '#ca87ff', glow: 'rgba(170,83,255,.20)',
    description: 'Increase long-term pattern recall, cross-game memory, information retrieval and learned context.',
  },
  {
    key: 'creative_synthesis', title: 'Creative Synthesis', verbs: 'Combine · Imagine · Create', icon: Lightbulb,
    color: '#8adfff', glow: 'rgba(89,202,255,.20)',
    description: 'Combine learned concepts into new strategies, novel connections and original problem-solving.',
  },
];

const KNOWLEDGE_MILESTONES = [
  { level: 1, label: 'Foundation', detail: 'Neural seed' },
  { level: 5, label: 'Avatar Options', detail: 'Knowledge reward' },
  { level: 10, label: 'New Capabilities', detail: 'Neural cache' },
  { level: 25, label: 'Knowledge Cache', detail: 'Advanced reward' },
  { level: 50, label: 'Cognition Core', detail: 'Major reward' },
  { level: 100, label: 'Advanced Nodes', detail: 'Mastery depth' },
  { level: 300, label: 'Mastery Path', detail: 'Knowledge cap' },
];

function xpToNextKnowledgeLevel(level) {
  return Math.round(140 * Math.pow(Math.max(1, Number(level) || 1), 1.18));
}

function knowledgeReward(level) {
  if (level === 1) return 1;
  if (level % 50 === 0) return 4;
  if (level % 25 === 0) return 3;
  if (level % 10 === 0) return 2;
  if (level % 5 === 0) return 1;
  return 0;
}

const pct = value => `${(Number(value || 0) * 100).toFixed(1)}%`;
const num = value => Number(value || 0).toLocaleString();

function LevelRing({ level }) {
  return (
    <div className="axe-level-ring" aria-label={`Level ${level}`}>
      <span><small>Lv</small><strong>{level}</strong></span>
    </div>
  );
}

function SkillBranch({ branch, rank, points, busy, onAllocate }) {
  const Icon = branch.icon;
  const nodes = [1, 2, 3, 4, 5];
  return (
    <article className="axe-branch" style={{ '--branch-color': branch.color, '--branch-glow': branch.glow }}>
      <div className="axe-branch-icon"><Icon size={31} aria-hidden="true" /></div>
      <h3>{branch.title}</h3>
      <div className="axe-branch__verbs">{branch.verbs}</div>
      <div className="axe-node-tree" aria-label={`${branch.title} nodes`}>
        {nodes.map(node => {
          const unlocked = node <= rank;
          const next = node === rank + 1;
          return (
            <button
              key={node}
              type="button"
              className={`axe-node ${unlocked ? 'is-unlocked' : ''} ${next ? 'is-next' : ''}`}
              disabled={busy || unlocked || !next || points <= 0}
              onClick={() => next && onAllocate(branch)}
              aria-label={unlocked ? `${branch.title} node ${node} unlocked` : next ? `Unlock ${branch.title} node ${node}` : `${branch.title} node ${node} locked`}
            >
              {unlocked ? <Sparkles size={15} /> : next && points > 0 ? <Plus size={15} /> : <Lock size={14} />}
            </button>
          );
        })}
      </div>
      <div className="axe-branch__rank">Rank {rank}/5</div>
      <p className="axe-branch__desc">{branch.description}</p>
    </article>
  );
}

function KnowledgeRail({ level, claimed, busy, onClaim }) {
  return (
    <section className="axe-knowledge-rail" aria-label="Knowledge level progression">
      <div className="axe-knowledge-rail__title">
        <h3>Knowledge Level Progression</h3>
        <span>Current · Lv {level}</span>
      </div>
      <div className="axe-milestones">
        {KNOWLEDGE_MILESTONES.map(milestone => {
          const reached = level >= milestone.level;
          const current = level === milestone.level || (level > milestone.level && !KNOWLEDGE_MILESTONES.some(other => other.level > milestone.level && other.level <= level));
          const reward = knowledgeReward(milestone.level);
          const wasClaimed = claimed.includes(milestone.level);
          const claimable = reached && reward > 0 && !wasClaimed;
          return (
            <div key={milestone.level} className={`axe-milestone ${reached ? 'is-reached' : ''} ${current ? 'is-current' : ''}`}>
              <div className="axe-milestone__orb">{reached ? milestone.level : <Lock size={13} />}</div>
              <strong>{milestone.label}</strong>
              <small>{milestone.detail}</small>
              {reward > 0 && reached && (
                <button type="button" disabled={busy || wasClaimed} onClick={() => claimable && onClaim(milestone.level)}>{wasClaimed ? 'Claimed' : `Claim +${reward}`}</button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function StatsTemplate({ state, busy, save }) {
  const combat = state.combat;
  const progression = state.progression;
  const allocations = state.allocations || {};
  const level = Number(combat.level || 1);
  const xpPerLevel = Number(state.rules?.xp_per_level || 1000);
  const xp = Math.max(0, Number(progression.global_xp || 0) - (level - 1) * xpPerLevel);
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
    { icon: Heart, label: 'Max HP', value: num(combat.max_hp) },
    { icon: Swords, label: 'Attack', value: num(combat.attack) },
    { icon: Shield, label: 'Defense', value: num(combat.defense) },
    { icon: Wind, label: 'Dodge Chance', value: pct(combat.dodge_chance) },
    { icon: Zap, label: 'Attack Speed', value: `${Number(combat.attack_speed || 0).toFixed(3)}×` },
    { icon: Sparkles, label: 'Critical Chance', value: pct(combat.crit_chance) },
    { icon: Brain, label: 'Cooldown Reduction', value: pct(combat.cooldown_reduction) },
    { icon: Target, label: 'Ability Bonus', value: pct(combat.ability_damage_bonus) },
  ];

  return (
    <section className="axe-stats-template-stage" aria-label="Avatar stats allocation">
      <img src={TEMPLATE_URL} alt="" aria-hidden="true" className="axe-stats-template-image" />
      <div className="axe-stats-template-shade" />

      <div className="axe-stats-avatar-live">
        <div className="axe-stats-level-ring"><span>LV</span><strong>{level}</strong></div>
        <div className="axe-stats-xp axe-stats-live-surface">
          <b>{Math.floor(xp).toLocaleString()} / {xpPerLevel.toLocaleString()} XP</b>
          <div className="axe-stats-xp-track"><i style={{ width: `${xpPercent}%` }} /></div>
          <small>{Math.max(0, xpPerLevel - xp).toLocaleString()} XP to next level</small>
        </div>
        <div className="axe-stats-points axe-stats-live-surface">
          <span>Available stat points</span>
          <strong>{Number(state.available || 0)}</strong>
          <small>Use stat points to shape your avatar's core attributes and enhance its capabilities.</small>
        </div>
        <div className="axe-stats-results axe-stats-live-surface">
          {coreStats.map(stat => <StatsResult key={stat.label} icon={stat.icon} label={stat.label} value={stat.value} />)}
        </div>
      </div>

      <div className="axe-stats-attributes-live">
        {ATTRIBUTE_DEFS.map(def => (
          <StatsAttribute
            key={def.key}
            def={def}
            value={Number(allocations[def.key] || 0)}
            busy={busy || state.allocation_locked}
            remaining={Number(state.available || 0)}
            onPlus={() => allocate(def.key)}
          />
        ))}
      </div>
    </section>
  );
}

function StatsResult({ icon: Icon, label, value }) {
  return <div className="axe-stats-result"><Icon /><span><strong>{value}</strong><small>{label}</small></span></div>;
}

function StatsAttribute({ def, value, remaining, busy, onPlus }) {
  const Icon = def.icon;
  return (
    <article className="axe-stats-attribute axe-stats-live-surface" style={{ '--accent': def.accent }}>
      <div className="axe-stats-icon-orb"><Icon /></div>
      <h3>{def.label}</h3>
      <strong className="axe-stats-attribute-value">{value}</strong>
      <p className="axe-stats-effect">{def.effect}</p>
      <div className="axe-stats-stepper">
        <button type="button" aria-label={`Decrease ${def.label}`} title="Respec is not enabled for committed stat points" disabled><Minus /></button>
        <span>{value}</span>
        <button type="button" aria-label={`Increase ${def.label}`} disabled={busy || remaining <= 0} onClick={onPlus}><Plus /></button>
      </div>
    </article>
  );
}

export default function AvatarProgressionOverlay({ onClose, initialTab = 'skill' }) {
  const [tab, setTab] = useState(initialTab === 'stats' ? 'stats' : 'skill');
  const [savedMessage, setSavedMessage] = useState('');
  const { state, isLoading: loading, error, refetch, save, saving: busy } = useAvatarCombatStats();
  const progression = state?.progression;
  const combat = state?.combat;

  useEffect(() => setTab(initialTab === 'stats' ? 'stats' : 'skill'), [initialTab]);
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const key = event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose?.();
      }
    };
    window.addEventListener('keydown', key, true);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', key, true);
    };
  }, [onClose]);

  const allocateSkill = async branch => {
    try {
      await save({ action: 'allocateKnowledge', data: { branch: branch.key } });
      setSavedMessage(`${branch.title} advanced.`);
    } catch (err) {
      showError(err, 'Avatar Progression');
    }
  };

  const claimKnowledgeReward = async level => {
    try {
      await save({ action: 'claimKnowledge', data: { level } });
      setSavedMessage(`Knowledge level ${level} reward claimed.`);
    } catch (err) {
      showError(err, 'Avatar Progression');
    }
  };

  const overlay = (
    <motion.div
      data-avatar-progression-overlay="true"
      role="dialog"
      aria-modal="true"
      aria-label="AI Avatar Progression"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: .2 }}
      className="axe-progression"
    >
      <div className="axe-progression__veil" />
      <div className="axe-progression__shell">
        <header className="axe-progression__topbar">
          <div className="axe-progression__brand"><span className="axe-progression__brand-mark" aria-hidden="true" />Atom X Eve</div>
          <div className="axe-progression__center-nav">
            <div className="axe-progression__eyebrow">AI Avatar Progression</div>
            <div className="axe-progression__nav-line" />
            <nav className="axe-progression__tabs" aria-label="Avatar progression sections">
              <button type="button" className={`axe-progression__tab ${tab === 'stats' ? 'is-active' : ''}`} onClick={() => setTab('stats')}><Activity size={15} />Stats</button>
              <button type="button" className={`axe-progression__tab ${tab === 'skill' ? 'is-active' : ''}`} onClick={() => setTab('skill')}><Network size={15} />Skill Tree</button>
            </nav>
          </div>
          <div className="axe-progression__motto">Build the avatar,<br />then build the mind.<br /><button type="button" onClick={onClose}>Esc · Close</button></div>
        </header>

        <main className={`axe-progression__body ${tab === 'stats' ? 'axe-progression__body--stats' : ''}`}>
          {error ? (
            <div className="axe-error" role="alert">{error.message}<button type="button" className="axe-action" onClick={() => refetch()}>Try again</button></div>
          ) : loading || !progression || !combat ? (
            <div className="axe-loading"><div><span /><p>Loading avatar progression…</p></div></div>
          ) : (
            <AnimatePresence mode="wait">
              {tab === 'stats' ? (
                <motion.section key="stats" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: .18 }} className="axe-stats-template-wrap">
                  <StatsTemplate state={state} busy={busy} save={save} />
                </motion.section>
              ) : (
                <motion.section key="skill" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: .18 }}>
                  <div className="axe-skill-header">
                    <LevelRing level={progression.knowledge_level} />
                    <div className="axe-knowledge-copy">
                      <span className="label">Knowledge Level</span>
                      <div className="xp">{num(progression.knowledge_xp)} / {num(xpToNextKnowledgeLevel(progression.knowledge_level))} XP</div>
                      <div className="axe-xp-track"><span style={{ width: `${Math.min(100, Number(progression.knowledge_xp || 0) / Math.max(1, xpToNextKnowledgeLevel(progression.knowledge_level)) * 100)}%` }} /></div>
                      <span className="next">{num(Math.max(0, xpToNextKnowledgeLevel(progression.knowledge_level) - Number(progression.knowledge_xp || 0)))} XP to next level</span>
                    </div>
                    <div className="axe-skill-counter"><span>Skill Points</span><strong>{progression.available_skill_points}</strong><p>Earn through experience to unlock new knowledge nodes.</p></div>
                    <div className="axe-skill-counter"><span>Nodes Unlocked</span><strong>{Object.values(progression.skill_allocations || {}).reduce((sum, value) => sum + Number(value || 0), 0)}</strong><p>Across all six AI knowledge branches.</p></div>
                  </div>

                  <div className="axe-skill-scroll">
                    <div className="axe-skill-grid">
                      {SKILL_BRANCHES.map(branch => (
                        <SkillBranch
                          key={branch.key}
                          branch={branch}
                          rank={Number(progression.skill_allocations?.[branch.key] || 0)}
                          points={Number(progression.available_skill_points || 0)}
                          busy={busy}
                          onAllocate={allocateSkill}
                        />
                      ))}
                    </div>
                  </div>

                  <KnowledgeRail level={Number(progression.knowledge_level || 1)} claimed={progression.claimed_knowledge_rewards || []} busy={busy} onClaim={claimKnowledgeReward} />
                </motion.section>
              )}
            </AnimatePresence>
          )}
        </main>
      </div>
      {savedMessage && <div className="axe-progress-toast" role="status" aria-live="polite">{savedMessage}</div>}
    </motion.div>
  );

  return typeof document !== 'undefined' ? createPortal(overlay, document.body) : overlay;
}
