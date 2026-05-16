import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen } from 'lucide-react';
import { SKILLS_DATABASE, RARITIES } from '../equipment/skillData';

const CATEGORIES = [
  { id: 'damage',  label: '⚔️ Sword / Damage', color: '#ef4444' },
  { id: 'defense', label: '🛡️ Defense',         color: '#3b82f6' },
  { id: 'ranged',  label: '🏹 Range',            color: '#10b981' },
  { id: 'passive', label: '✨ Passives & Buffs', color: '#a78bfa' },
];

// Passives are skills with no damage_pct and type doesn't include offensive
const PASSIVE_IDS = new Set([
  'iron_fortress', 'counter_pulse', 'guardian_wall', 'reflective_guard',
]);

function getRarityColor(rarityId) {
  return RARITIES.find((r) => r.id === rarityId)?.color || '#9ca3af';
}

function SkillCard({ skill }) {
  const rc = getRarityColor(skill.rarity);
  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all"
      style={{
        background: `${rc}0d`,
        borderColor: `${rc}30`,
      }}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0 border"
        style={{ background: `${rc}20`, borderColor: `${rc}44` }}
      >
        {skill.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-white text-xs font-semibold truncate">{skill.name}</span>
          {skill.equipped && (
            <span className="text-[8px] px-1 py-0.5 rounded font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex-shrink-0">
              EQ
            </span>
          )}
          {!skill.owned && (
            <span className="text-[8px] px-1 py-0.5 rounded font-bold bg-white/5 text-white/30 border border-white/10 flex-shrink-0">
              LOCKED
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-bold" style={{ color: rc }}>{skill.rarity.toUpperCase()}</span>
          <span className="text-white/30 text-[8px]">•</span>
          <span className="text-white/40 text-[9px] truncate">{skill.type}</span>
        </div>
      </div>
    </div>
  );
}

function CategorySection({ cat, skills }) {
  if (skills.length === 0) return null;
  return (
    <div className="mb-4">
      <div
        className="text-[9px] font-bold uppercase tracking-[0.15em] mb-2 px-1"
        style={{ color: cat.color }}
      >
        {cat.label}
        <span className="ml-1.5 text-white/30 normal-case tracking-normal">
          ({skills.filter((s) => s.owned).length}/{skills.length})
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        {skills.map((sk) => <SkillCard key={sk.id} skill={sk} />)}
      </div>
    </div>
  );
}

export default function HUDSkillsBookPanel({ open, onClose }) {
  const [filter, setFilter] = useState('all');

  const getSkillsFor = (catId) => {
    if (catId === 'passive') return SKILLS_DATABASE.filter((s) => PASSIVE_IDS.has(s.id));
    return SKILLS_DATABASE.filter((s) => s.path === catId && !PASSIVE_IDS.has(s.id));
  };

  const visibleCats = filter === 'all'
    ? CATEGORIES
    : CATEGORIES.filter((c) => c.id === filter);

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
            style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="fixed z-[71] flex flex-col overflow-hidden pointer-events-auto"
            style={{
              bottom: '130px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '420px',
              maxHeight: '520px',
              background: 'rgba(8, 10, 18, 0.96)',
              backdropFilter: 'blur(32px) saturate(180%)',
              WebkitBackdropFilter: 'blur(32px) saturate(180%)',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: '14px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07] flex-shrink-0">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold uppercase tracking-widest text-white/80">Skills Book</span>
              </div>
              <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-1 px-3 pt-2.5 pb-1.5 flex-shrink-0">
              <button
                onClick={() => setFilter('all')}
                className="px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all"
                style={filter === 'all' ? {
                  background: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.3)', color: '#fff',
                } : {
                  background: 'transparent', borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)',
                }}
              >
                All
              </button>
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setFilter(c.id)}
                  className="px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all"
                  style={filter === c.id ? {
                    background: `${c.color}25`, borderColor: `${c.color}55`, color: c.color,
                  } : {
                    background: 'transparent', borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)',
                  }}
                >
                  {c.label.split(' ').slice(1).join(' ')}
                </button>
              ))}
            </div>

            {/* Scrollable skill list */}
            <div className="flex-1 overflow-y-auto px-3 py-2" style={{ scrollbarWidth: 'none' }}>
              {visibleCats.map((cat) => (
                <CategorySection key={cat.id} cat={cat} skills={getSkillsFor(cat.id)} />
              ))}
            </div>

            {/* Footer hint */}
            <div className="px-4 py-2 border-t border-white/[0.06] text-[9px] text-white/25 text-center flex-shrink-0">
              Open Equipment → Skills tab to upgrade or equip skills
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}