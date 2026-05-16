import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, TrendingUp } from 'lucide-react';
import { SKILLS_DATABASE, RARITIES } from '../equipment/skillData';
import { getLootInventory, subscribeLootInventory, getLearnedSkillIds, subscribeLearnedSkills } from '../lootStore';
import SkillUpgradePanel from '../equipment/SkillUpgradePanel';
import SkillEquipSlots from './SkillEquipSlots';
import SkillsBookCategoryTabs from './SkillsBookCategoryTabs';

// ─── Five top-level categories ─────────────────────────────────────────────
const CATEGORIES = [
  { id: 'sword',    emoji: '⚔️', title: 'Sword Arts',  color: '#ef4444' },
  { id: 'guardian', emoji: '🛡️', title: 'Guardian',    color: '#3b82f6' },
  { id: 'ranged',   emoji: '🏹', title: 'Ranged',      color: '#10b981' },
  { id: 'buffs',    emoji: '✨', title: 'Buffs',       color: '#f59e0b' },
  { id: 'passives', emoji: '🌀', title: 'Passives',    color: '#a78bfa' },
];

// ─── Explicit per-category skill id sets ───────────────────────────────────
// Each skill belongs to exactly one category. Items that drop and are
// "free-floating" buffs (Repulsion, Barrier, Decisive Blow, God's Deflection,
// Aegis Shield, Focus, Haste) live under "Buffs" so they don't pollute the
// weapon-specific lists.
const CATEGORY_SKILL_IDS = {
  sword: new Set([
    'berserker_slash',   // sword active
    'brutal_force',      // native passive — primary buff for damage class
  ]),
  guardian: new Set([
    'shield_slash',
    'guardian_triple_strike',
    'iron_fortress',
    'counter_pulse',
    'iron_stance',       // native passive — primary buff for defense class
  ]),
  ranged: new Set([
    'barrage_volley',
    'phantom_shot',
    'storm_rounds',
    'piercing_rain',
    'swift_marksman',    // native passive — primary buff for ranged class
  ]),
  buffs: new Set([
    'focus',
    'aegis_shield',
    'decisive_blow',
    'gods_deflection',
    'haste',
    'repulsion',
    'barrier_aura',
  ]),
  passives: new Set([
    'heavens_destruction',
    'guardian_wall',
    'reflective_guard',
  ]),
};

function getRarityStyle(rarityId) {
  const r = RARITIES.find((r) => r.id === rarityId);
  return { color: r?.color || '#9ca3af', label: r?.label || rarityId };
}

function getSkillsForCategory(categoryId, collectedIds) {
  const ids = CATEGORY_SKILL_IDS[categoryId];
  if (!ids) return [];
  return SKILLS_DATABASE.filter((s) => ids.has(s.id) && collectedIds.has(s.id));
}

// ─── Skill list (left side) ────────────────────────────────────────────────
function SkillList({ category, skills, selectedSkill, onSelectSkill, onUpgradeSkill }) {
  if (skills.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-white/45 text-[10px] text-center tracking-wide px-6">
        <span className="text-2xl opacity-60">📜</span>
        No {category.title} skills yet.<br />Defeat enemies to find scrolls.
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-1 h-full overflow-y-auto px-3 py-2" style={{ scrollbarWidth: 'none' }}>
      {skills.map((sk) => {
        const { color } = getRarityStyle(sk.rarity);
        const isSelected = selectedSkill?.id === sk.id;
        return (
          <button
            key={sk.id}
            onClick={() => onSelectSkill(isSelected ? null : sk)}
            onDoubleClick={() => onUpgradeSkill && onUpgradeSkill(sk)}
            className="flex items-center gap-2 px-2.5 py-2 transition-all text-left w-full"
            style={{
              background: isSelected
                ? `linear-gradient(90deg, ${color}25 0%, transparent 100%)`
                : 'rgba(255,255,255,0.025)',
              border: `1px solid ${isSelected ? color + '70' : 'rgba(255,255,255,0.06)'}`,
              borderRadius: 2,
              boxShadow: isSelected ? `inset 0 0 10px ${color}25` : 'none',
            }}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0"
              style={{
                background: `radial-gradient(circle, ${color}30 0%, rgba(0,0,0,0.55) 70%)`,
                border: `1px solid ${color}80`,
                boxShadow: `0 0 6px ${color}40`,
              }}
            >
              {sk.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white/90 text-[10px] font-semibold truncate tracking-wide">{sk.name}</div>
              <div className="text-[8px] font-semibold tracking-[0.25em] uppercase mt-0.5" style={{ color }}>{sk.rarity}</div>
            </div>
            {sk.damage_pct && (
              <span className="text-white/70 font-semibold text-[9px] tabular-nums flex-shrink-0">{sk.damage_pct}%</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Skill detail (right side) ─────────────────────────────────────────────
function SkillDetail({ skill, onUpgradeSkill }) {
  if (!skill) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 px-5">
        <div className="text-3xl opacity-30">👆</div>
        <p className="text-white/45 text-[10px] text-center leading-relaxed tracking-wide">
          Select a skill to view<br />its details here.
        </p>
      </div>
    );
  }
  const { color, label } = getRarityStyle(skill.rarity);
  return (
    <div className="flex flex-col h-full px-5 py-4">
      <div className="flex flex-col items-center text-center mb-4">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-3"
          style={{
            background: `radial-gradient(circle, ${color}30 0%, rgba(0,0,0,0.55) 70%)`,
            border: `1.5px solid ${color}`,
            boxShadow: `0 0 28px ${color}55, inset 0 0 12px ${color}33`,
          }}
        >
          {skill.icon}
        </div>
        <h3 className="text-white/95 font-semibold text-sm leading-tight mb-2 tracking-[0.2em] uppercase">{skill.name}</h3>
        <span
          className="text-[9px] px-2.5 py-0.5 font-semibold tracking-[0.3em] uppercase"
          style={{ color, background: `${color}18`, border: `1px solid ${color}55`, borderRadius: 2 }}
        >
          {label || skill.rarity}
        </span>
      </div>

      <div className="w-full h-px mb-3" style={{ background: `linear-gradient(to right, transparent, ${color}60, transparent)` }} />

      <div className="flex flex-col gap-2 flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        {skill.type && (
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-white/45 tracking-[0.2em] uppercase">Type</span>
            <span className="text-white/85 font-semibold tracking-wide">{skill.type}</span>
          </div>
        )}
        {skill.damage_pct && (
          <div className="flex items-center justify-between px-3 py-2"
            style={{ background: `${color}12`, border: `1px solid ${color}40`, borderRadius: 2 }}>
            <span className="text-white/60 text-[10px] tracking-[0.2em] uppercase">Damage</span>
            <span className="font-semibold text-sm tabular-nums" style={{ color }}>{skill.damage_pct}%</span>
          </div>
        )}
        {skill.description && (
          <>
            <div className="w-full h-px mt-1" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <p className="text-white/65 text-[10px] leading-relaxed mt-1 italic">{skill.description}</p>
          </>
        )}

        <button
          onClick={() => onUpgradeSkill && onUpgradeSkill(skill)}
          className="mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-2 transition-all hover:brightness-125 active:scale-95"
          style={{
            background: 'linear-gradient(180deg, rgba(245,158,11,0.25) 0%, rgba(180,83,9,0.20) 100%)',
            border: '1px solid rgba(245,158,11,0.55)',
            color: '#fde68a',
            borderRadius: 2,
            boxShadow: '0 0 12px rgba(245,158,11,0.20), inset 0 0 10px rgba(245,158,11,0.15)',
          }}
        >
          <TrendingUp className="w-3 h-3" />
          <span className="text-[9px] font-semibold tracking-[0.3em] uppercase">Upgrade / Assign Slot</span>
        </button>

        {skill.equipped && (
          <div className="mt-auto flex items-center justify-center gap-1.5 px-3 py-2"
            style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.45)', borderRadius: 2 }}>
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span className="text-emerald-300 text-[9px] font-semibold tracking-[0.3em] uppercase">Currently Equipped</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────
export default function HUDSkillsBookPanel({ open, onClose }) {
  const [activeCategory, setActiveCategory] = useState('sword');
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [lootInv, setLootInv] = useState(getLootInventory());
  const [learnedIds, setLearnedIds] = useState(getLearnedSkillIds());
  const [upgradeSkill, setUpgradeSkill] = useState(null);
  const [draggedSkill, setDraggedSkill] = useState(null);

  useEffect(() => subscribeLootInventory(setLootInv), []);
  useEffect(() => subscribeLearnedSkills(setLearnedIds), []);

  const collectedIds = useMemo(() => {
    const set = new Set();
    const isEditor = (() => {
      try {
        const h = window.location.hostname;
        return h === 'localhost' || h.includes('base44.app') || h.includes('preview');
      } catch { return false; }
    })();
    if (isEditor) {
      SKILLS_DATABASE.forEach((s) => set.add(s.id));
      return set;
    }
    const skillDrops = lootInv['skill'] || [];
    skillDrops.forEach((drop) => {
      const match = SKILLS_DATABASE.find(
        (s) => s.name.toLowerCase() === drop.name.toLowerCase() || drop.id?.includes(s.id)
      );
      if (match) set.add(match.id);
    });
    learnedIds.forEach((lootId) => {
      const match = SKILLS_DATABASE.find(
        (s) => lootId.includes(s.id) || lootId === `skill_${s.id}`
      );
      if (match) set.add(match.id);
    });
    return set;
  }, [lootInv, learnedIds]);

  const countsById = useMemo(() => {
    const out = {};
    CATEGORIES.forEach((c) => { out[c.id] = getSkillsForCategory(c.id, collectedIds).length; });
    return out;
  }, [collectedIds]);

  const handleSelectCategory = (id) => {
    setActiveCategory(id);
    setSelectedSkill(null);
  };

  const category = CATEGORIES.find((c) => c.id === activeCategory) || CATEGORIES[0];
  const skills = getSkillsForCategory(activeCategory, collectedIds);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70]"
            style={{ background: 'rgba(4,8,14,0.32)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
          />

          {/* Panel wrapper */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className="fixed z-[71] flex items-center pointer-events-auto"
            style={{
              top: 'calc(50% - 300px)',
              left: 160,
              transform: 'translateY(-50%)',
            }}
          >
            <SkillEquipSlots
              draggedSkill={draggedSkill}
              onClearDrag={() => setDraggedSkill(null)}
            />

            {/* Skills Book frame */}
            <div
              className="relative flex flex-col overflow-hidden"
              style={{
                width: 720,
                height: 540,
                borderRadius: 4,
                boxShadow: '0 40px 100px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,216,107,0.12), 0 0 24px rgba(255,216,107,0.08)',
                border: '1px solid rgba(255,216,107,0.28)',
                background: 'linear-gradient(135deg, rgba(10,14,22,0.55) 0%, rgba(6,10,16,0.55) 100%)',
                backdropFilter: 'blur(16px) saturate(140%)',
                WebkitBackdropFilter: 'blur(16px) saturate(140%)',
              }}
            >
              {/* Engraved corner brackets */}
              {[
                { top: 6, left: 6, borderTop: '1px solid rgba(255,216,107,0.5)', borderLeft: '1px solid rgba(255,216,107,0.5)' },
                { top: 6, right: 6, borderTop: '1px solid rgba(255,216,107,0.5)', borderRight: '1px solid rgba(255,216,107,0.5)' },
                { bottom: 6, left: 6, borderBottom: '1px solid rgba(255,216,107,0.5)', borderLeft: '1px solid rgba(255,216,107,0.5)' },
                { bottom: 6, right: 6, borderBottom: '1px solid rgba(255,216,107,0.5)', borderRight: '1px solid rgba(255,216,107,0.5)' },
              ].map((s, i) => (
                <div key={i} className="absolute w-3 h-3 pointer-events-none z-10" style={s} />
              ))}

              {/* Header — title + close */}
              <div
                className="flex items-center justify-between px-5 pt-3 pb-2 flex-shrink-0"
                style={{ borderBottom: '1px solid rgba(255,216,107,0.20)' }}
              >
                <div className="text-amber-100/90 text-[11px] font-semibold tracking-[0.35em] uppercase">
                  Tome of Skills
                </div>
                <button
                  onClick={onClose}
                  className="w-6 h-6 rounded-full flex items-center justify-center transition-all hover:brightness-125"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,216,107,0.35)' }}
                >
                  <X className="w-3 h-3 text-amber-100/80" />
                </button>
              </div>

              {/* Top category tabs */}
              <SkillsBookCategoryTabs
                categories={CATEGORIES}
                activeId={activeCategory}
                onSelect={handleSelectCategory}
                countsById={countsById}
              />

              {/* Divider */}
              <div className="h-px mx-4" style={{ background: `linear-gradient(to right, transparent, ${category.color}50, transparent)` }} />

              {/* Body — list + detail */}
              <div className="flex flex-1 overflow-hidden">
                {/* Left: skill list */}
                <div className="flex-1 flex flex-col overflow-hidden" style={{ borderRight: '1px solid rgba(255,216,107,0.15)' }}>
                  <div className="px-4 pt-2 pb-1 flex items-center justify-between flex-shrink-0">
                    <span className="text-[9px] font-semibold tracking-[0.3em] uppercase" style={{ color: category.color }}>
                      {category.title}
                    </span>
                    <span className="text-white/40 text-[8px] tracking-[0.25em] uppercase">
                      {skills.length} learned
                    </span>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeCategory}
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -12 }}
                        transition={{ duration: 0.18 }}
                        className="h-full"
                      >
                        <SkillList
                          category={category}
                          skills={skills}
                          selectedSkill={selectedSkill}
                          onSelectSkill={(sk) => { setSelectedSkill(sk); setDraggedSkill(sk); }}
                          onUpgradeSkill={setUpgradeSkill}
                        />
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>

                {/* Right: detail */}
                <div className="flex-1 overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={selectedSkill?.id ?? 'empty'}
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -16 }}
                      transition={{ duration: 0.22, ease: 'easeOut' }}
                      className="h-full"
                    >
                      <SkillDetail skill={selectedSkill} onUpgradeSkill={setUpgradeSkill} />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}

      <AnimatePresence>
        {upgradeSkill && (
          <SkillUpgradePanel
            skill={upgradeSkill}
            onClose={() => setUpgradeSkill(null)}
          />
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
}