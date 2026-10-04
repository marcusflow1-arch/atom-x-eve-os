import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  Brain,
  Compass,
  Crown,
  Eye,
  Feather,
  Heart,
  Lightbulb,
  Lock,
  Minus,
  Network,
  Plus,
  RotateCcw,
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
const EMPTY_DRAFT = Object.freeze({ strength: 0, defense: 0, vitality: 0, agility: 0, intelligence: 0, wisdom: 0 });

const ATTRIBUTES = [
  {
    key: 'strength', label: 'Strength', icon: Swords, color: '#ff827d', glow: 'rgba(255,93,89,.22)',
    description: 'Increases attack power and weapon effectiveness.',
    effects: ['Attack Power', 'Weapon Scaling', 'Physical Damage'],
    recommended: 'Ideal for direct, high-damage playstyles.',
  },
  {
    key: 'defense', label: 'Defense', icon: Shield, color: '#79cfff', glow: 'rgba(64,169,255,.22)',
    description: 'Increases armor and reduces incoming damage.',
    effects: ['Armor Rating', 'Damage Reduction', 'Survivability'],
    recommended: 'Recommended for tank and front-line roles.',
  },
  {
    key: 'vitality', label: 'Vitality', icon: Heart, color: '#70edaa', glow: 'rgba(61,230,142,.22)',
    description: 'Increases maximum HP and overall survivability.',
    effects: ['Maximum HP', 'HP Reserve', 'Status Endurance'],
    recommended: 'Ideal for longer fights and sustained combat.',
  },
  {
    key: 'agility', label: 'Agility', icon: Feather, color: '#e7c46d', glow: 'rgba(231,186,87,.22)',
    description: 'Increases dodge rating and attack speed.',
    effects: ['Dodge Rating', 'Attack Speed', 'Movement Readiness'],
    recommended: 'Recommended for fast, evasive playstyles.',
  },
  {
    key: 'intelligence', label: 'Intelligence', icon: Eye, color: '#cf88ff', glow: 'rgba(170,83,255,.22)',
    description: 'Reduces cooldowns and improves skill efficiency.',
    effects: ['Cooldown Reduction', 'Skill Efficiency', 'Resource Control'],
    recommended: 'Ideal for skill-focused and caster playstyles.',
  },
  {
    key: 'wisdom', label: 'Wisdom', icon: Sparkles, color: '#8ddfff', glow: 'rgba(89,202,255,.22)',
    description: 'Increases ability damage and effect strength.',
    effects: ['Ability Damage', 'Effect Strength', 'Control Presence'],
    recommended: 'Recommended for support and control roles.',
  },
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

function ResultRow({ icon: Icon, value, label }) {
  return (
    <div className="axe-result">
      <Icon size={20} aria-hidden="true" />
      <div><strong>{value}</strong><small>{label}</small></div>
    </div>
  );
}

function AttributeCard({ definition, current, pending, available, locked, onChange }) {
  const Icon = definition.icon;
  const displayValue = current + pending;
  return (
    <article
      className="axe-attribute-card"
      style={{ '--attr-color': definition.color, '--attr-glow': definition.glow }}
    >
      <div className="axe-attribute-icon"><Icon size={30} aria-hidden="true" /></div>
      <h3>{definition.label}</h3>
      <div className="axe-attribute-value">{displayValue}</div>
      <div className="axe-attribute-base">Saved {current}</div>
      <div className="axe-attribute-stepper" aria-label={`${definition.label} allocation`}>
        <button type="button" aria-label={`Remove pending ${definition.label} point`} disabled={locked || pending <= 0} onClick={() => onChange(definition.key, -1)}><Minus size={14} /></button>
        <span>{displayValue}</span>
        <button type="button" aria-label={`Add ${definition.label} point`} disabled={locked || available <= 0} onClick={() => onChange(definition.key, 1)}><Plus size={14} /></button>
      </div>
      <p className="axe-attribute-desc">{definition.description}</p>
      <div className="axe-attribute-effects">
        <b>Key effects</b>
        {definition.effects.map(effect => <span key={effect}>{effect}</span>)}
      </div>
      <div className="axe-attribute-rec"><b>Recommended</b>{definition.recommended}</div>
    </article>
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

export default function AvatarProgressionOverlay({ onClose, initialTab = 'skill' }) {
  const [tab, setTab] = useState(initialTab === 'stats' ? 'stats' : 'skill');
  const [draft, setDraft] = useState({ ...EMPTY_DRAFT });
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
  useEffect(() => {
    setDraft({ ...EMPTY_DRAFT });
  }, [state?.revision]);

  const pendingTotal = useMemo(() => Object.values(draft).reduce((sum, value) => sum + Number(value || 0), 0), [draft]);
  const availableAfterDraft = Math.max(0, Number(state?.available || 0) - pendingTotal);
  const allocations = state?.allocations || EMPTY_DRAFT;

  const preview = useMemo(() => {
    if (!combat) return null;
    return {
      maxHp: Number(combat.max_hp || 0) + draft.vitality * 25,
      armor: Number(combat.defense || 0) + draft.defense * 8,
      attack: Number(combat.attack || 0) + draft.strength * 7,
      attackSpeed: Number(combat.attack_speed || 1) + draft.agility * 0.002,
      cooldown: Math.min(.4, Number(combat.cooldown_reduction || 0) + draft.intelligence * 0.001),
      ability: Number(combat.ability_damage_bonus || 0) + draft.wisdom * 0.002,
      dodgeRatingGain: draft.agility * 3,
    };
  }, [combat, draft]);

  const adjustDraft = (key, delta) => {
    setSavedMessage('');
    setDraft(current => {
      const currentValue = Number(current[key] || 0);
      if (delta > 0) {
        const used = Object.values(current).reduce((sum, value) => sum + Number(value || 0), 0);
        if (used >= Number(state?.available || 0)) return current;
      }
      return { ...current, [key]: Math.max(0, currentValue + delta) };
    });
  };

  const resetDraft = () => {
    setDraft({ ...EMPTY_DRAFT });
    setSavedMessage('');
  };

  const confirmDraft = async () => {
    if (!pendingTotal) return;
    try {
      await save({ action: 'allocateBatch', data: { allocations: draft } });
      setDraft({ ...EMPTY_DRAFT });
      setSavedMessage('Attribute changes confirmed.');
    } catch (err) {
      showError(err, 'Avatar Progression');
    }
  };

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

        <main className="axe-progression__body">
          {error ? (
            <div className="axe-error" role="alert">{error.message}<button type="button" className="axe-action" onClick={() => refetch()}>Try again</button></div>
          ) : loading || !progression || !combat || !preview ? (
            <div className="axe-loading"><div><span /><p>Loading avatar progression…</p></div></div>
          ) : (
            <AnimatePresence mode="wait">
              {tab === 'stats' ? (
                <motion.section key="stats" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: .18 }}>
                  <div className="axe-progression__hero">
                    <div className="axe-progression__hero-kicker">Attribute Build</div>
                    <h1>Shape Your Avatar</h1>
                    <p>Allocate attribute points to define your avatar’s strengths, adapt to your strategy, and shape how it performs in combat and beyond.</p>
                    <div className="axe-progression__divider"><i /></div>
                  </div>

                  <div className="axe-stats-layout">
                    <aside className="axe-avatar-summary axe-panel">
                      <div className="axe-avatar-summary__title">Your Avatar</div>
                      <LevelRing level={combat.level} />
                      <div className="axe-xp-copy">{num(Math.max(0, Number(progression.global_xp || 0) - (combat.level - 1) * Number(state.rules?.xp_per_level || 1000)))} / {num(state.rules?.xp_per_level || 1000)} XP</div>
                      <div className="axe-xp-track"><span style={{ width: `${combat.level >= Number(state.rules?.level_cap || 50) ? 100 : Math.min(100, Math.max(0, (Number(progression.global_xp || 0) - (combat.level - 1) * Number(state.rules?.xp_per_level || 1000)) / Number(state.rules?.xp_per_level || 1000) * 100))}%` }} /></div>
                      <div className="axe-xp-next">{combat.level >= Number(state.rules?.level_cap || 50) ? 'Maximum avatar level' : `${num(Math.max(0, Number(state.rules?.xp_per_level || 1000) - Math.max(0, Number(progression.global_xp || 0) - (combat.level - 1) * Number(state.rules?.xp_per_level || 1000))))} XP to next level`}</div>
                      <div className="axe-summary-sep" />
                      <div className="axe-points"><div className="axe-points__rune"><Sparkles size={21} /></div><div className="axe-points__copy"><span>Available Points</span><strong data-testid="available-stat-points">{availableAfterDraft}</strong></div></div>
                      <p className="axe-summary-note">Allocate points to shape your avatar’s combat style. Pending changes are only saved when you confirm them.</p>
                      <div className="axe-summary-sep" />
                      <div className="axe-results-title">Key Combat Results</div>
                      <ResultRow icon={Heart} value={num(preview.maxHp)} label="HP" />
                      <ResultRow icon={Swords} value={num(preview.attack)} label="Attack" />
                      <ResultRow icon={Shield} value={num(preview.armor)} label="Defense" />
                      <ResultRow icon={Sparkles} value={pct(combat.crit_chance)} label="Crit Chance" />
                      <ResultRow icon={Wind} value={`${preview.attackSpeed.toFixed(3)}×`} label="Attack Speed" />
                      <ResultRow icon={Zap} value={pct(preview.cooldown)} label="Cooldown Red." />
                    </aside>

                    <div className="axe-stats-main">
                      <div className="axe-attribute-grid">
                        {ATTRIBUTES.map(definition => (
                          <AttributeCard
                            key={definition.key}
                            definition={definition}
                            current={Number(allocations[definition.key] || 0)}
                            pending={Number(draft[definition.key] || 0)}
                            available={availableAfterDraft}
                            locked={busy || state.allocation_locked}
                            onChange={adjustDraft}
                          />
                        ))}
                      </div>

                      <div className="axe-preview-bar" aria-label="Expected stat changes">
                        <div><h4>Expected Stat Changes</h4><p>Preview how pending allocation affects your key combat results before confirming.</p></div>
                        <div><h4>HP</h4><div className="axe-preview-stat">{num(combat.max_hp)} → <em>{num(preview.maxHp)}</em></div></div>
                        <div><h4>Armor</h4><div className="axe-preview-stat">{num(combat.defense)} → <em>{num(preview.armor)}</em></div></div>
                        <div><h4>Attack</h4><div className="axe-preview-stat">{num(combat.attack)} → <em>{num(preview.attack)}</em></div></div>
                        <div><h4>Attack Speed</h4><div className="axe-preview-stat">{Number(combat.attack_speed || 1).toFixed(3)}× → <em>{preview.attackSpeed.toFixed(3)}×</em></div></div>
                        <div><h4>Cooldown Red.</h4><div className="axe-preview-stat">{pct(combat.cooldown_reduction)} → <em>{pct(preview.cooldown)}</em></div></div>
                      </div>

                      {draft.agility > 0 && <p className="axe-save-note">Agility also adds +{preview.dodgeRatingGain} pending dodge rating.</p>}
                      {draft.wisdom > 0 && <p className="axe-save-note">Wisdom previews ability bonus at {pct(preview.ability)}.</p>}
                      {state.allocation_locked && <p className="axe-lock-note">Your combat build is locked until the active PvP match ends.</p>}
                      <div className="axe-stats-actions">
                        <button type="button" className="axe-action" disabled={busy || pendingTotal === 0} onClick={resetDraft}><RotateCcw size={13} /> Reset Pending</button>
                        <button type="button" className="axe-action axe-action--primary" disabled={busy || pendingTotal === 0 || state.allocation_locked} onClick={confirmDraft}><Crown size={14} /> {busy ? 'Saving…' : `Confirm Changes${pendingTotal ? ` · ${pendingTotal}` : ''}`}</button>
                      </div>
                    </div>
                  </div>
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
