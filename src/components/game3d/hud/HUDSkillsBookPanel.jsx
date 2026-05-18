import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import { getAllSkills } from '../skills/skillRegistry';
import { SKILL_TYPE, WEAPON_TYPE } from '../skills/skillTypes';
import {
  getAllCompanionSkills,
  COMPANION_SKILL_CATEGORY,
} from '../skills/companionSkillRegistry';
import SkillEquipSlots from './SkillEquipSlots';
import CompanionSkillEquipSlots from './CompanionSkillEquipSlots';
import SkillsBookCategoryTabs from './SkillsBookCategoryTabs';

// Five top-level categories — exactly mirror the new skill model.
const CATEGORIES = [
  { id: 'sword',    emoji: '⚔️', title: 'Sword',    color: '#ef4444' },
  { id: 'guardian', emoji: '🛡️', title: 'Guardian', color: '#3b82f6' },
  { id: 'ranged',   emoji: '🏹', title: 'Ranged',   color: '#10b981' },
  { id: 'buffs',    emoji: '✨', title: 'Buffs',    color: '#f59e0b' },
  { id: 'passives', emoji: '🌀', title: 'Passives', color: '#a78bfa' },
];

// Companion subpage categories — partition companion skill registry.
const COMPANION_CATEGORIES = [
  { id: COMPANION_SKILL_CATEGORY.COMBAT,   emoji: '⚔️', title: 'Combat',   color: '#ef4444' },
  { id: COMPANION_SKILL_CATEGORY.SUPPORT,  emoji: '✨', title: 'Support',  color: '#34d399' },
  { id: COMPANION_SKILL_CATEGORY.MOBILITY, emoji: '💨', title: 'Mobility', color: '#22d3ee' },
  { id: COMPANION_SKILL_CATEGORY.FUSION,   emoji: '👼', title: 'Fusion',   color: '#ffd86b' },
];

// Partition the registry into the five tabs using the canonical skill metadata.
function getSkillsForCategory(categoryId) {
  const all = getAllSkills();
  switch (categoryId) {
    case 'sword':
      return all.filter((s) => s.weapon_type === WEAPON_TYPE.SWORD && s.skill_type === SKILL_TYPE.ACTIVE_ATTACK);
    case 'guardian':
      return all.filter((s) => s.weapon_type === WEAPON_TYPE.GUARDIAN && s.skill_type === SKILL_TYPE.ACTIVE_ATTACK);
    case 'ranged':
      return all.filter((s) => s.weapon_type === WEAPON_TYPE.RANGED && s.skill_type === SKILL_TYPE.ACTIVE_ATTACK);
    case 'buffs':
      return all.filter((s) => s.skill_type === SKILL_TYPE.ACTIVE_BUFF);
    case 'passives':
      return all.filter((s) => s.skill_type === SKILL_TYPE.PASSIVE);
    default:
      return [];
  }
}

// Partition companion skills by category for the companion subpage.
function getCompanionSkillsForCategory(categoryId) {
  return getAllCompanionSkills().filter((s) => s.category === categoryId);
}

// Adapter — companion skills don't have skill_type. Give them a synthetic
// one so the existing SkillList/SkillDetail rows still render correctly.
function adaptCompanionSkillForDetail(sk) {
  if (!sk) return sk;
  return {
    ...sk,
    skill_type: sk.fusion ? SKILL_TYPE.ACTIVE_BUFF : SKILL_TYPE.ACTIVE_ATTACK,
    weapon_type: null,
    hit_count: sk.hit_count || 0,
    max_level: sk.max_level || 10,
  };
}

const TYPE_COLOR = {
  [SKILL_TYPE.ACTIVE_ATTACK]: '#f59e0b',
  [SKILL_TYPE.ACTIVE_BUFF]:   '#60a5fa',
  [SKILL_TYPE.PASSIVE]:       '#a78bfa',
};

function SkillList({ category, skills, selectedSkill, onSelectSkill }) {
  if (skills.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-white/45 text-[10px] text-center tracking-wide px-6">
        <span className="text-2xl opacity-60">📜</span>
        No {category.title} skills yet.
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-1 h-full overflow-y-auto px-3 py-2" style={{ scrollbarWidth: 'none' }}>
      {skills.map((sk) => {
        const color = TYPE_COLOR[sk.skill_type] || '#9ca3af';
        const isSelected = selectedSkill?.skill_id === sk.skill_id;
        return (
          <button
            key={sk.skill_id}
            onClick={() => onSelectSkill(isSelected ? null : sk)}
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
              <div className="text-white/90 text-[10px] font-semibold truncate tracking-wide">{sk.skill_name}</div>
              <div className="text-[8px] font-semibold tracking-[0.25em] uppercase mt-0.5" style={{ color }}>
                {sk.skill_type.replace('ACTIVE_', '').toLowerCase()}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function SkillDetail({ skill }) {
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
  const color = TYPE_COLOR[skill.skill_type] || '#9ca3af';
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
        <h3 className="text-white/95 font-semibold text-sm leading-tight mb-2 tracking-[0.2em] uppercase">{skill.skill_name}</h3>
        <span
          className="text-[9px] px-2.5 py-0.5 font-semibold tracking-[0.3em] uppercase"
          style={{ color, background: `${color}18`, border: `1px solid ${color}55`, borderRadius: 2 }}
        >
          {skill.skill_type.replace('ACTIVE_', '')}
        </span>
      </div>

      <div className="w-full h-px mb-3" style={{ background: `linear-gradient(to right, transparent, ${color}60, transparent)` }} />

      <div className="flex flex-col gap-2 flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        {skill.weapon_type && (
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-white/45 tracking-[0.2em] uppercase">Weapon</span>
            <span className="text-white/85 font-semibold tracking-wide">{skill.weapon_type}</span>
          </div>
        )}
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-white/45 tracking-[0.2em] uppercase">Cooldown</span>
          <span className="text-white/85 font-semibold tracking-wide">{skill.cooldown}s</span>
        </div>
        {skill.duration > 0 && (
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-white/45 tracking-[0.2em] uppercase">Duration</span>
            <span className="text-white/85 font-semibold tracking-wide">{skill.duration}s</span>
          </div>
        )}
        {skill.hit_count > 0 && (
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-white/45 tracking-[0.2em] uppercase">Hits</span>
            <span className="text-white/85 font-semibold tracking-wide">{skill.hit_count}</span>
          </div>
        )}
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-white/45 tracking-[0.2em] uppercase">Max Level</span>
          <span className="text-white/85 font-semibold tracking-wide">{skill.max_level}</span>
        </div>
        {skill.description && (
          <>
            <div className="w-full h-px mt-1" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <p className="text-white/65 text-[10px] leading-relaxed mt-1 italic">{skill.description}</p>
          </>
        )}

        {skill.skill_type === SKILL_TYPE.PASSIVE && (
          <div className="mt-auto flex items-center justify-center gap-1.5 px-3 py-2"
            style={{ background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.45)', borderRadius: 2 }}>
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span className="text-purple-300 text-[9px] font-semibold tracking-[0.3em] uppercase">Always active — cannot be equipped to active slots</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function HUDSkillsBookPanel({ open, onClose }) {
  // 'player' or 'companion' — top-level subpage toggle.
  const [mode, setMode] = useState('player');
  const [activeCategory, setActiveCategory] = useState('sword');
  const [activeCompanionCategory, setActiveCompanionCategory] = useState(COMPANION_SKILL_CATEGORY.COMBAT);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [draggedSkill, setDraggedSkill] = useState(null);

  const countsById = useMemo(() => {
    const out = {};
    if (mode === 'companion') {
      COMPANION_CATEGORIES.forEach((c) => { out[c.id] = getCompanionSkillsForCategory(c.id).length; });
    } else {
      CATEGORIES.forEach((c) => { out[c.id] = getSkillsForCategory(c.id).length; });
    }
    return out;
  }, [mode]);

  const handleSelectCategory = (id) => {
    if (mode === 'companion') setActiveCompanionCategory(id);
    else setActiveCategory(id);
    setSelectedSkill(null);
    setDraggedSkill(null);
  };

  const handleSwitchMode = (newMode) => {
    if (newMode === mode) return;
    setMode(newMode);
    setSelectedSkill(null);
    setDraggedSkill(null);
  };

  const isCompanion = mode === 'companion';
  const categoryList = isCompanion ? COMPANION_CATEGORIES : CATEGORIES;
  const currentCategoryId = isCompanion ? activeCompanionCategory : activeCategory;
  const category = categoryList.find((c) => c.id === currentCategoryId) || categoryList[0];
  const rawSkills = isCompanion
    ? getCompanionSkillsForCategory(currentCategoryId)
    : getSkillsForCategory(currentCategoryId);
  // For the detail panel, companion skills need a synthetic skill_type.
  const skills = isCompanion ? rawSkills.map(adaptCompanionSkillForDetail) : rawSkills;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70]"
            style={{ background: 'rgba(4,8,14,0.32)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className="fixed z-[71] flex items-center gap-0 pointer-events-auto"
            style={{ top: 'calc(50% - 516px)', left: 'calc(50% - 360px)', transform: 'translateY(-50%)' }}
          >
           {/* Equip slots — rendered OUTSIDE the panel on the left */}
           <div className="flex-shrink-0">
             {open && (isCompanion ? (
               <CompanionSkillEquipSlots
                 draggedSkill={draggedSkill}
                 onClearDrag={() => setDraggedSkill(null)}
               />
             ) : (
               <SkillEquipSlots
                 draggedSkill={draggedSkill}
                 onClearDrag={() => setDraggedSkill(null)}
               />
             ))}
           </div>

           <div
              className="relative flex flex-col overflow-hidden"
              style={{
                width: 720, height: 540, borderRadius: 4,
                boxShadow: '0 40px 100px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,216,107,0.12), 0 0 24px rgba(255,216,107,0.08)',
                border: '1px solid rgba(255,216,107,0.28)',
                background: 'linear-gradient(135deg, rgba(10,14,22,0.55) 0%, rgba(6,10,16,0.55) 100%)',
                backdropFilter: 'blur(16px) saturate(140%)',
                WebkitBackdropFilter: 'blur(16px) saturate(140%)',
              }}
            >
              {[
                { _k: 'tl', top: 6, left: 6, borderTop: '1px solid rgba(255,216,107,0.5)', borderLeft: '1px solid rgba(255,216,107,0.5)' },
                { _k: 'tr', top: 6, right: 6, borderTop: '1px solid rgba(255,216,107,0.5)', borderRight: '1px solid rgba(255,216,107,0.5)' },
                { _k: 'bl', bottom: 6, left: 6, borderBottom: '1px solid rgba(255,216,107,0.5)', borderLeft: '1px solid rgba(255,216,107,0.5)' },
                { _k: 'br', bottom: 6, right: 6, borderBottom: '1px solid rgba(255,216,107,0.5)', borderRight: '1px solid rgba(255,216,107,0.5)' },
              ].map(({ _k, ...s }) => (
                <div key={_k} className="absolute w-3 h-3 pointer-events-none z-10" style={s} />
              ))}

              <div
                className="flex items-center justify-between px-5 pt-3 pb-2 flex-shrink-0"
                style={{ borderBottom: '1px solid rgba(255,216,107,0.20)' }}
              >
                <div className="text-amber-100/90 text-[11px] font-semibold tracking-[0.35em] uppercase">
                  Tome of Skills
                </div>

                {/* Player ↔ Companion toggle */}
                <div className="flex items-center gap-1">
                  {['player', 'companion'].map((m) => {
                    const active = mode === m;
                    return (
                      <button
                        key={m}
                        onClick={() => handleSwitchMode(m)}
                        className="px-2.5 py-1 text-[9px] font-bold tracking-[0.25em] uppercase transition-all"
                        style={{
                          color: active ? '#ffd86b' : 'rgba(255,255,255,0.5)',
                          background: active ? 'rgba(255,216,107,0.14)' : 'transparent',
                          border: `1px solid ${active ? 'rgba(255,216,107,0.55)' : 'rgba(255,255,255,0.12)'}`,
                          borderRadius: 2,
                        }}
                      >
                        {m === 'player' ? '👤 Player' : '🐾 Companion'}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={onClose}
                  className="w-6 h-6 rounded-full flex items-center justify-center transition-all hover:brightness-125"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,216,107,0.35)' }}
                >
                  <X className="w-3 h-3 text-amber-100/80" />
                </button>
              </div>

              <SkillsBookCategoryTabs
                categories={categoryList}
                activeId={currentCategoryId}
                onSelect={handleSelectCategory}
                countsById={countsById}
              />

              <div className="h-px mx-4" style={{ background: `linear-gradient(to right, transparent, ${category.color}50, transparent)` }} />

              <div className="flex flex-1 overflow-hidden">
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="px-4 pt-2 pb-1 flex items-center justify-between flex-shrink-0">
                    <span className="text-[9px] font-semibold tracking-[0.3em] uppercase" style={{ color: category.color }}>
                      {category.title}
                    </span>
                    <span className="text-white/40 text-[8px] tracking-[0.25em] uppercase">
                      {skills.length} skills
                    </span>
                  </div>
                  <div className="flex flex-1 overflow-hidden">
                    <div className="flex-1 overflow-hidden" style={{ borderRight: '1px solid rgba(255,216,107,0.15)' }}>
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={`${mode}-${currentCategoryId}`}
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
                          />
                        </motion.div>
                      </AnimatePresence>
                    </div>

                    <div className="flex-1 overflow-hidden">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={selectedSkill?.skill_id ?? 'empty'}
                          initial={{ opacity: 0, x: 16 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -16 }}
                          transition={{ duration: 0.22, ease: 'easeOut' }}
                          className="h-full"
                        >
                          <SkillDetail skill={selectedSkill} />
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}