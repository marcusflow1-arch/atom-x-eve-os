import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { SKILLS_DATABASE, RARITIES } from '../equipment/skillData';
import { getLootInventory, subscribeLootInventory } from '../lootStore';

// ─── Data ──────────────────────────────────────────────────────────────────
const PASSIVE_IDS = new Set([
  'iron_fortress', 'counter_pulse', 'guardian_wall', 'reflective_guard',
]);

const CHAPTERS = [
  { id: 'damage',  emoji: '⚔️', title: 'Sword Arts',       subtitle: 'Offensive Combat Skills',  color: '#ef4444', path: 'damage'  },
  { id: 'defense', emoji: '🛡️', title: 'Guardian Codex',   subtitle: 'Defensive Mastery',        color: '#3b82f6', path: 'defense' },
  { id: 'ranged',  emoji: '🏹', title: 'Range Disciplines', subtitle: 'Ranged & Piercing Skills', color: '#10b981', path: 'ranged'  },
  { id: 'passive', emoji: '✨', title: 'Passive Blessings', subtitle: 'Aura & Passive Buffs',     color: '#a78bfa', path: 'passive' },
];

function getRarityStyle(rarityId) {
  const r = RARITIES.find((r) => r.id === rarityId);
  return { color: r?.color || '#9ca3af' };
}

// ─── Table of Contents page ────────────────────────────────────────────────
function TOCPage({ onSelectChapter, collectedIds }) {
  return (
    <div className="flex flex-col h-full px-6 py-5">
      <div className="text-center mb-5">
        <div className="text-3xl mb-1">📖</div>
        <h2 className="text-gray-700 font-black text-lg tracking-tight">Tome of Skills</h2>
        <p className="text-gray-400 text-[10px] tracking-widest uppercase mt-0.5">Table of Contents</p>
      </div>

      {collectedIds.size === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-3">
          <div className="text-4xl">📜</div>
          <p className="text-gray-400 text-xs text-center leading-relaxed">
            Your tome is empty.<br />
            Defeat enemies to collect skill scrolls,<br />then pick them up to learn them.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 flex-1">
          {CHAPTERS.map((ch, idx) => {
            const skills = ch.id === 'passive'
              ? SKILLS_DATABASE.filter((s) => PASSIVE_IDS.has(s.id) && collectedIds.has(s.id))
              : SKILLS_DATABASE.filter((s) => s.path === ch.id && !PASSIVE_IDS.has(s.id) && collectedIds.has(s.id));
            if (skills.length === 0) return null;
            const owned = skills.length;

          return (
            <button
              key={ch.id}
              onClick={() => onSelectChapter(idx + 1)}
              className="group flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left"
              style={{
                background: 'rgba(255,255,255,0.55)',
                backdropFilter: 'blur(12px)',
                borderColor: 'rgba(200,200,210,0.7)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center text-xl flex-shrink-0 border"
                style={{ background: `${ch.color}18`, borderColor: `${ch.color}40` }}
              >
                {ch.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-gray-700 font-bold text-xs">{ch.title}</div>
                <div className="text-gray-400 text-[9px]">{ch.subtitle}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-gray-500 font-bold text-[10px]">{owned}</div>
                <div className="text-gray-400 text-[8px]">learned</div>
              </div>
              <ChevronRight
                className="w-3.5 h-3.5 flex-shrink-0 group-hover:translate-x-0.5 transition-transform"
                style={{ color: ch.color }}
              />
            </button>
          );
        })}
          <div className="text-center text-gray-400 text-[9px] mt-3 tracking-wide">
            Use ← → arrows or click a chapter
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Single skill row ──────────────────────────────────────────────────────
function SkillRow({ skill }) {
  const { color } = getRarityStyle(skill.rarity);
  return (
    <div
      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all"
      style={{
        background: skill.owned ? 'rgba(255,255,255,0.6)' : 'rgba(220,220,228,0.3)',
        backdropFilter: 'blur(8px)',
        borderColor: skill.owned ? `${color}40` : 'rgba(190,190,200,0.5)',
        opacity: skill.owned ? 1 : 0.6,
      }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0 border"
        style={{ background: `${color}20`, borderColor: `${color}50` }}
      >
        {skill.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-gray-700 text-[11px] font-bold truncate">{skill.name}</span>
          {skill.equipped && (
            <span className="text-[7px] px-1 py-0.5 rounded font-black bg-emerald-100 text-emerald-600 border border-emerald-300 flex-shrink-0 tracking-wider">
              EQ
            </span>
          )}
          {!skill.owned && (
            <span className="text-[7px] px-1 py-0.5 rounded font-bold bg-gray-100 text-gray-400 border border-gray-300 flex-shrink-0">
              LOCKED
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[8px] font-black tracking-wider" style={{ color }}>{skill.rarity?.toUpperCase()}</span>
          <span className="text-gray-300 text-[7px]">•</span>
          <span className="text-gray-400 text-[8px] truncate">{skill.type}</span>
        </div>
      </div>
      {skill.damage_pct && (
        <div className="text-right flex-shrink-0">
          <div className="text-gray-600 font-black text-[10px]">{skill.damage_pct}%</div>
          <div className="text-gray-400 text-[7px]">dmg</div>
        </div>
      )}
    </div>
  );
}

// ─── Chapter page ──────────────────────────────────────────────────────────
function ChapterPage({ chapter, collectedIds }) {
  const skills = chapter.id === 'passive'
    ? SKILLS_DATABASE.filter((s) => PASSIVE_IDS.has(s.id) && collectedIds.has(s.id))
    : SKILLS_DATABASE.filter((s) => s.path === chapter.id && !PASSIVE_IDS.has(s.id) && collectedIds.has(s.id));
  const owned = skills.length;

  return (
    <div className="flex flex-col h-full px-5 py-4">
      {/* Chapter header */}
      <div
        className="flex items-center gap-3 mb-4 pb-3 border-b"
        style={{ borderColor: `${chapter.color}30` }}
      >
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl border"
          style={{ background: `${chapter.color}18`, borderColor: `${chapter.color}50` }}
        >
          {chapter.emoji}
        </div>
        <div className="flex-1">
          <h3 className="text-gray-700 font-black text-sm leading-tight">{chapter.title}</h3>
          <p className="text-gray-400 text-[9px] mt-0.5">{chapter.subtitle}</p>
        </div>
        <div
          className="text-right px-2.5 py-1.5 rounded-lg border"
          style={{ background: `${chapter.color}12`, borderColor: `${chapter.color}30` }}
        >
          <div className="font-black text-sm leading-none" style={{ color: chapter.color }}>{owned}</div>
          <div className="text-gray-400 text-[8px] mt-0.5">learned</div>
        </div>
      </div>

      {/* Skill list */}
      <div className="flex flex-col gap-1.5 flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        {skills.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-28 gap-2 text-gray-400 text-xs text-center">
          <span className="text-2xl">📜</span>
          No {chapter.title} skills learned yet.<br/>Defeat enemies to find scrolls.
        </div>
        ) : (
          skills.map((sk) => <SkillRow key={sk.id} skill={sk} />)
        )}
      </div>

      {/* Page footnote */}
      <div
        className="mt-3 pt-2 border-t text-gray-400 text-[8px] text-center"
        style={{ borderColor: `${chapter.color}20` }}
      >
        Equip skills via Equipment → Skills tab
      </div>
    </div>
  );
}

// ─── Page turn animation wrapper ───────────────────────────────────────────
const PAGE_VARIANTS = {
  enter: (dir) => ({
    x: dir > 0 ? 60 : -60,
    opacity: 0,
    rotateY: dir > 0 ? 8 : -8,
  }),
  center: { x: 0, opacity: 1, rotateY: 0 },
  exit: (dir) => ({
    x: dir > 0 ? -60 : 60,
    opacity: 0,
    rotateY: dir > 0 ? -8 : 8,
  }),
};

// ─── Main component ────────────────────────────────────────────────────────
export default function HUDSkillsBookPanel({ open, onClose }) {
  const [pageIndex, setPageIndex] = useState(0);   // 0 = TOC, 1–4 = chapters
  const [direction, setDirection] = useState(1);
  const [lootInv, setLootInv] = useState(getLootInventory());

  useEffect(() => subscribeLootInventory(setLootInv), []);

  // Build a Set of skill loot IDs that map back to SKILLS_DATABASE entries by name match
  const collectedIds = useMemo(() => {
    const skillDrops = lootInv['skill'] || [];
    const set = new Set();
    skillDrops.forEach((drop) => {
      // Match by loot item name → skill name (e.g. "Berserker Slash" → id "berserker_slash")
      const match = SKILLS_DATABASE.find(
        (s) => s.name.toLowerCase() === drop.name.toLowerCase() ||
               drop.id?.includes(s.id)
      );
      if (match) set.add(match.id);
    });
    return set;
  }, [lootInv]);

  const totalPages = CHAPTERS.length + 1; // TOC + 4 chapters

  const goTo = (idx) => {
    setDirection(idx > pageIndex ? 1 : -1);
    setPageIndex(idx);
  };
  const prev = () => pageIndex > 0 && goTo(pageIndex - 1);
  const next = () => pageIndex < totalPages - 1 && goTo(pageIndex + 1);

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
            style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)' }}
            onClick={onClose}
          />

          {/* Book container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
            className="fixed z-[71] flex flex-col pointer-events-auto overflow-hidden"
            style={{
              bottom: '130px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 400,
              height: 540,
              /* Liquid glass — light gray */
              background: 'rgba(235, 236, 240, 0.72)',
              backdropFilter: 'blur(40px) saturate(200%) brightness(1.08)',
              WebkitBackdropFilter: 'blur(40px) saturate(200%) brightness(1.08)',
              border: '1px solid rgba(255,255,255,0.85)',
              borderRadius: 20,
              boxShadow:
                '0 32px 80px rgba(0,0,0,0.35), 0 2px 0 rgba(255,255,255,0.9) inset, 0 -1px 0 rgba(0,0,0,0.06) inset, 4px 0 12px rgba(0,0,0,0.08) inset',
            }}
          >
            {/* Book spine accent (left edge) */}
            <div
              className="absolute left-0 top-0 bottom-0 w-1 rounded-l-[20px]"
              style={{
                background: 'linear-gradient(to bottom, rgba(160,160,180,0.6) 0%, rgba(200,200,220,0.3) 50%, rgba(160,160,180,0.6) 100%)',
              }}
            />

            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-3 flex-shrink-0 border-b"
              style={{ borderColor: 'rgba(180,180,200,0.5)' }}
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" style={{ color: '#6b7280' }} />
                <span className="text-gray-600 text-[11px] font-black uppercase tracking-[0.15em]">Skills Tome</span>
                <span
                  className="text-[9px] px-1.5 py-0.5 rounded-full border font-semibold"
                  style={{ background: 'rgba(255,255,255,0.6)', borderColor: 'rgba(180,180,200,0.7)', color: '#9ca3af' }}
                >
                  pg {pageIndex + 1}/{totalPages}
                </span>
              </div>
              <button
                onClick={onClose}
                className="w-6 h-6 rounded-full flex items-center justify-center transition-all hover:scale-110"
                style={{ background: 'rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.1)' }}
              >
                <X className="w-3 h-3 text-gray-500" />
              </button>
            </div>

            {/* Animated page content */}
            <div className="flex-1 relative overflow-hidden" style={{ perspective: '800px' }}>
              <AnimatePresence custom={direction} mode="wait">
                <motion.div
                  key={pageIndex}
                  custom={direction}
                  variants={PAGE_VARIANTS}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: 'spring', stiffness: 320, damping: 30, mass: 0.8 }}
                  className="absolute inset-0 overflow-hidden"
                  style={{ transformOrigin: direction > 0 ? 'left center' : 'right center' }}
                >
                  {pageIndex === 0 ? (
                    <TOCPage onSelectChapter={(i) => goTo(i)} collectedIds={collectedIds} />
                  ) : (
                    <ChapterPage chapter={CHAPTERS[pageIndex - 1]} collectedIds={collectedIds} />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer nav — page turn buttons */}
            <div
              className="flex items-center justify-between px-5 py-3 flex-shrink-0 border-t"
              style={{ borderColor: 'rgba(180,180,200,0.5)', background: 'rgba(220,222,228,0.5)' }}
            >
              <button
                onClick={prev}
                disabled={pageIndex === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                style={{ background: 'rgba(255,255,255,0.7)', borderColor: 'rgba(180,180,200,0.7)', color: '#6b7280' }}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="text-[10px] font-semibold">Prev</span>
              </button>

              {/* Dot indicators */}
              <div className="flex items-center gap-1.5">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    className="transition-all rounded-full"
                    style={{
                      width: i === pageIndex ? 16 : 6,
                      height: 6,
                      background: i === pageIndex
                        ? '#6b7280'
                        : 'rgba(150,150,170,0.4)',
                    }}
                  />
                ))}
              </div>

              <button
                onClick={next}
                disabled={pageIndex === totalPages - 1}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                style={{ background: 'rgba(255,255,255,0.7)', borderColor: 'rgba(180,180,200,0.7)', color: '#6b7280' }}
              >
                <span className="text-[10px] font-semibold">Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}