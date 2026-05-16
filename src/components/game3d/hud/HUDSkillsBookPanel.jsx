import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, BookOpen, Zap, Shield, Target, Sparkles, TrendingUp } from 'lucide-react';
import { SKILLS_DATABASE, RARITIES } from '../equipment/skillData';
import { getLootInventory, subscribeLootInventory, getLearnedSkillIds, subscribeLearnedSkills } from '../lootStore';
import SkillUpgradePanel from '../equipment/SkillUpgradePanel';
import { getSkillData, subscribeSkillUpgrades } from '../equipment/skillUpgradeStore';
import SkillEquipSlots from './SkillEquipSlots';

// ─── Data ──────────────────────────────────────────────────────────────────
const PASSIVE_IDS = new Set([
  'iron_fortress', 'counter_pulse', 'guardian_wall', 'reflective_guard',
]);

const CHAPTERS = [
  { id: 'damage',  emoji: '⚔️', title: 'Sword Arts',        subtitle: 'Offensive Combat Skills',  color: '#ef4444' },
  { id: 'defense', emoji: '🛡️', title: 'Guardian Codex',    subtitle: 'Defensive Mastery',        color: '#3b82f6' },
  { id: 'ranged',  emoji: '🏹', title: 'Range Disciplines',  subtitle: 'Ranged & Piercing Skills', color: '#10b981' },
  { id: 'passive', emoji: '✨', title: 'Passive Blessings',  subtitle: 'Aura & Passive Buffs',     color: '#a78bfa' },
];

function getRarityStyle(rarityId) {
  const r = RARITIES.find((r) => r.id === rarityId);
  return { color: r?.color || '#9ca3af', label: r?.label || rarityId };
}

function getSkillsForChapter(chapterId, collectedIds) {
  return chapterId === 'passive'
    ? SKILLS_DATABASE.filter((s) => PASSIVE_IDS.has(s.id) && collectedIds.has(s.id))
    : SKILLS_DATABASE.filter((s) => s.path === chapterId && !PASSIVE_IDS.has(s.id) && collectedIds.has(s.id));
}

// ─── Left Page: TOC ────────────────────────────────────────────────────────
function TOCLeftPage({ onSelectChapter, collectedIds, activeChapterIdx }) {
  return (
    <div className="flex flex-col h-full px-5 py-5">
      <div className="text-center mb-4">
        <div className="text-2xl mb-1 opacity-80">📖</div>
        <h2 className="text-amber-100/90 font-semibold text-base tracking-[0.25em] uppercase">Tome of Skills</h2>
        <p className="text-white/40 text-[9px] tracking-[0.35em] uppercase mt-1">Table of Contents</p>
        <div className="mx-auto mt-2 h-px w-20" style={{ background: 'linear-gradient(to right, transparent, rgba(255,216,107,0.4), transparent)' }} />
      </div>

      {collectedIds.size === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-3">
          <div className="text-3xl opacity-60">📜</div>
          <p className="text-white/50 text-[10px] text-center leading-relaxed tracking-wide">
            Your tome is empty.<br />
            Defeat enemies to collect<br />skill scrolls.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 flex-1">
          {CHAPTERS.map((ch, idx) => {
            const skills = getSkillsForChapter(ch.id, collectedIds);
            if (skills.length === 0) return null;
            const isActive = activeChapterIdx === idx;
            return (
              <button
                key={ch.id}
                onClick={() => onSelectChapter(idx)}
                className="group flex items-center gap-2.5 px-3 py-2.5 transition-all text-left"
                style={{
                  background: isActive
                    ? `linear-gradient(90deg, ${ch.color}22 0%, transparent 100%)`
                    : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isActive ? ch.color + '60' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 2,
                  boxShadow: isActive ? `inset 0 0 12px ${ch.color}20` : 'none',
                }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                  style={{
                    background: `radial-gradient(circle, ${ch.color}30 0%, rgba(0,0,0,0.5) 70%)`,
                    border: `1px solid ${ch.color}80`,
                    boxShadow: `0 0 8px ${ch.color}40`,
                  }}
                >
                  {ch.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white/90 font-semibold text-[11px] tracking-[0.18em] uppercase">{ch.title}</div>
                  <div className="text-white/40 text-[8px] tracking-widest uppercase mt-0.5">{skills.length} skills</div>
                </div>
                <ChevronRight
                  className="w-3.5 h-3.5 flex-shrink-0 group-hover:translate-x-0.5 transition-transform"
                  style={{ color: isActive ? ch.color : 'rgba(255,255,255,0.25)' }}
                />
              </button>
            );
          })}
        </div>
      )}

      <div className="text-center text-white/30 text-[8px] mt-3 tracking-[0.3em] uppercase">
        ← → to turn pages
      </div>
    </div>
  );
}

// ─── Left Page: Chapter skill list ─────────────────────────────────────────
function ChapterLeftPage({ chapter, skills, selectedSkill, onSelectSkill, onUpgradeSkill }) {
  return (
    <div className="flex flex-col h-full px-4 py-4">
      {/* Chapter header */}
      <div
        className="flex items-center gap-2.5 mb-3 pb-2.5 flex-shrink-0"
        style={{ borderBottom: `1px solid ${chapter.color}40` }}
      >
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-xl flex-shrink-0"
          style={{
            background: `radial-gradient(circle, ${chapter.color}30 0%, rgba(0,0,0,0.5) 70%)`,
            border: `1px solid ${chapter.color}90`,
            boxShadow: `0 0 10px ${chapter.color}40`,
          }}
        >
          {chapter.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white/95 font-semibold text-[12px] leading-tight tracking-[0.2em] uppercase">{chapter.title}</h3>
          <p className="text-white/45 text-[8px] tracking-widest uppercase mt-0.5">{chapter.subtitle}</p>
        </div>
        <div
          className="px-2 py-1 flex-shrink-0 text-center"
          style={{
            background: `${chapter.color}15`,
            border: `1px solid ${chapter.color}40`,
            borderRadius: 2,
          }}
        >
          <div className="font-semibold text-[12px] leading-none" style={{ color: chapter.color }}>{skills.length}</div>
          <div className="text-white/40 text-[7px] tracking-widest uppercase mt-0.5">learned</div>
        </div>
      </div>

      {/* Skill list */}
      <div className="flex flex-col gap-1 flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        {skills.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-24 gap-2 text-white/45 text-[10px] text-center tracking-wide">
            <span className="text-xl opacity-60">📜</span>
            No {chapter.title} skills yet.<br />Defeat enemies to find scrolls.
          </div>
        ) : (
          skills.map((sk) => {
            const { color } = getRarityStyle(sk.rarity);
            const isSelected = selectedSkill?.id === sk.id;
            return (
              <button
                key={sk.id}
                onClick={() => { onSelectSkill(isSelected ? null : sk); }}
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
                  <div className="text-right flex-shrink-0">
                    <span className="text-white/70 font-semibold text-[9px] tabular-nums">{sk.damage_pct}%</span>
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Right Page: Skill detail ──────────────────────────────────────────────
function SkillDetailPage({ skill, chapter, onUpgradeSkill }) {
  if (!skill) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 px-5">
        <div className="text-3xl opacity-30">👆</div>
        <p className="text-white/45 text-[10px] text-center leading-relaxed tracking-wide">
          Select a skill on the left<br />to view its details here.
        </p>
      </div>
    );
  }

  const { color, label } = getRarityStyle(skill.rarity);

  return (
    <div className="flex flex-col h-full px-5 py-5">
      {/* Skill identity */}
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
          style={{
            color,
            background: `${color}18`,
            border: `1px solid ${color}55`,
            borderRadius: 2,
          }}
        >
          {label || skill.rarity}
        </span>
      </div>

      {/* Divider */}
      <div className="w-full h-px mb-4" style={{ background: `linear-gradient(to right, transparent, ${color}60, transparent)` }} />

      {/* Stats */}
      <div className="flex flex-col gap-2 flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        {skill.type && (
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-white/45 tracking-[0.2em] uppercase">Type</span>
            <span className="text-white/85 font-semibold tracking-wide">{skill.type}</span>
          </div>
        )}
        {skill.damage_pct && (
          <div
            className="flex items-center justify-between px-3 py-2"
            style={{
              background: `${color}12`,
              border: `1px solid ${color}40`,
              borderRadius: 2,
            }}
          >
            <span className="text-white/60 text-[10px] tracking-[0.2em] uppercase">Damage</span>
            <span className="font-semibold text-sm tabular-nums" style={{ color }}>{skill.damage_pct}%</span>
          </div>
        )}
        {skill.cooldown && (
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-white/45 tracking-[0.2em] uppercase">Cooldown</span>
            <span className="text-white/85 font-semibold tabular-nums">{skill.cooldown}s</span>
          </div>
        )}
        {skill.stamina_cost && (
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-white/45 tracking-[0.2em] uppercase">Stamina Cost</span>
            <span className="text-white/85 font-semibold tabular-nums">{skill.stamina_cost}</span>
          </div>
        )}
        {skill.range && (
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-white/45 tracking-[0.2em] uppercase">Range</span>
            <span className="text-white/85 font-semibold tabular-nums">{skill.range}</span>
          </div>
        )}

        {/* Description */}
        {skill.description && (
          <>
            <div className="w-full h-px mt-1" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <p className="text-white/65 text-[10px] leading-relaxed mt-1 italic">{skill.description}</p>
          </>
        )}

        {/* Upgrade button */}
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

        {/* Equipped badge */}
        {skill.equipped && (
          <div
            className="mt-auto flex items-center justify-center gap-1.5 px-3 py-2"
            style={{
              background: 'rgba(16,185,129,0.12)',
              border: '1px solid rgba(16,185,129,0.45)',
              borderRadius: 2,
            }}
          >
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span className="text-emerald-300 text-[9px] font-semibold tracking-[0.3em] uppercase">Currently Equipped</span>
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="mt-3 pt-2 text-white/30 text-[8px] text-center tracking-[0.25em] uppercase" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        Equip via Equipment → Skills tab
      </div>
    </div>
  );
}

// ─── Page turn variants ────────────────────────────────────────────────────
const LEFT_PAGE_VARIANTS = {
  enter: (dir) => ({ opacity: 0, rotateY: dir > 0 ? -12 : 12, x: dir > 0 ? -30 : 30 }),
  center: { opacity: 1, rotateY: 0, x: 0 },
  exit: (dir) => ({ opacity: 0, rotateY: dir > 0 ? 12 : -12, x: dir > 0 ? 30 : -30 }),
};

// ─── Main component ────────────────────────────────────────────────────────
export default function HUDSkillsBookPanel({ open, onClose }) {
  const [chapterIdx, setChapterIdx] = useState(null); // null = TOC view
  const [direction, setDirection] = useState(1);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [lootInv, setLootInv] = useState(getLootInventory());
  const [learnedIds, setLearnedIds] = useState(getLearnedSkillIds());
  const [upgradeSkill, setUpgradeSkill] = useState(null);
  const [draggedSkill, setDraggedSkill] = useState(null); // skill pending equip into a slot

  useEffect(() => subscribeLootInventory(setLootInv), []);
  useEffect(() => subscribeLearnedSkills(setLearnedIds), []);

  const collectedIds = useMemo(() => {
    const set = new Set();
    // Editor/preview: every skill is pre-learned for testing
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
    // From loot drops in inventory
    const skillDrops = lootInv['skill'] || [];
    skillDrops.forEach((drop) => {
      const match = SKILLS_DATABASE.find(
        (s) => s.name.toLowerCase() === drop.name.toLowerCase() || drop.id?.includes(s.id)
      );
      if (match) set.add(match.id);
    });
    // From explicitly learned skills (right-click → Learn)
    learnedIds.forEach((lootId) => {
      const match = SKILLS_DATABASE.find(
        (s) => lootId.includes(s.id) || lootId === `skill_${s.id}`
      );
      if (match) set.add(match.id);
    });
    return set;
  }, [lootInv, learnedIds]);

  const goToChapter = (idx) => {
    setDirection(idx !== null && (chapterIdx === null || idx > chapterIdx) ? 1 : -1);
    setChapterIdx(idx);
    setSelectedSkill(null);
  };

  const prev = () => {
    if (chapterIdx === null) return;
    if (chapterIdx === 0) { setDirection(-1); setChapterIdx(null); setSelectedSkill(null); }
    else goToChapter(chapterIdx - 1);
  };
  const next = () => {
    if (chapterIdx === null) { goToChapter(0); }
    else if (chapterIdx < CHAPTERS.length - 1) goToChapter(chapterIdx + 1);
  };

  const activeChapter = chapterIdx !== null ? CHAPTERS[chapterIdx] : null;
  const activeSkills = activeChapter ? getSkillsForChapter(activeChapter.id, collectedIds) : [];
  const totalPages = CHAPTERS.length + 1;
  const pageIndicator = chapterIdx === null ? 0 : chapterIdx + 1;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop — lighter so the world shows through */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70]"
            style={{ background: 'rgba(4,8,14,0.32)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
          />

          {/* Book wrapper — slots on left + two pages side by side */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 24 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className="fixed z-[71] flex items-center justify-center pointer-events-auto"
            style={{
              top: 'calc(50% - 288px)',
              left: 160,
              transform: 'translateY(-50%)',
            }}
          >
            {/* ── Skill Equip Slots (outside-left of book) ── */}
            <SkillEquipSlots
              draggedSkill={draggedSkill}
              onClearDrag={() => setDraggedSkill(null)}
            />
            {/* ── Outer book frame — liquid-glass, New-World style ── */}
            <div
              className="flex overflow-hidden relative"
              style={{
                width: 720,
                height: 520,
                borderRadius: 4,
                boxShadow: '0 40px 100px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,216,107,0.12), 0 0 24px rgba(255,216,107,0.08)',
                border: '1px solid rgba(255,216,107,0.28)',
                perspective: '1200px',
                background: 'linear-gradient(135deg, rgba(10,14,22,0.55) 0%, rgba(6,10,16,0.55) 100%)',
                backdropFilter: 'blur(16px) saturate(140%)',
                WebkitBackdropFilter: 'blur(16px) saturate(140%)',
              }}
            >
              {/* Decorative engraved corner brackets */}
              {[
                { top: 6, left: 6, borderTop: '1px solid rgba(255,216,107,0.5)', borderLeft: '1px solid rgba(255,216,107,0.5)' },
                { top: 6, right: 6, borderTop: '1px solid rgba(255,216,107,0.5)', borderRight: '1px solid rgba(255,216,107,0.5)' },
                { bottom: 6, left: 6, borderBottom: '1px solid rgba(255,216,107,0.5)', borderLeft: '1px solid rgba(255,216,107,0.5)' },
                { bottom: 6, right: 6, borderBottom: '1px solid rgba(255,216,107,0.5)', borderRight: '1px solid rgba(255,216,107,0.5)' },
              ].map((s, i) => (
                <div key={i} className="absolute w-3 h-3 pointer-events-none z-10" style={s} />
              ))}

              {/* ── LEFT PAGE ──────────────────────────────────────────── */}
              <div
                className="relative flex flex-col overflow-hidden"
                style={{
                  width: '50%',
                  background: 'linear-gradient(135deg, rgba(14,22,34,0.40) 0%, rgba(8,12,20,0.40) 100%)',
                  boxShadow: 'inset -1px 0 0 rgba(255,216,107,0.15), inset 0 0 60px rgba(0,0,0,0.35)',
                }}
              >
                {/* Left page header */}
                <div
                  className="flex items-center justify-between px-4 py-2.5 flex-shrink-0"
                  style={{ borderBottom: '1px solid rgba(255,216,107,0.25)' }}
                >
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-amber-200/70" />
                    <span className="text-amber-100/85 text-[10px] font-semibold uppercase tracking-[0.3em]">
                      {activeChapter ? activeChapter.title : 'Contents'}
                    </span>
                  </div>
                  <span className="text-white/35 text-[8px] tracking-[0.25em] uppercase">pg {pageIndicator + 1}/{totalPages}</span>
                </div>

                {/* Animated page content */}
                <div className="flex-1 relative overflow-hidden">
                  <AnimatePresence custom={direction} mode="wait">
                    <motion.div
                      key={chapterIdx ?? 'toc'}
                      custom={direction}
                      variants={LEFT_PAGE_VARIANTS}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ type: 'spring', stiffness: 320, damping: 30, mass: 0.8 }}
                      className="absolute inset-0 overflow-hidden"
                      style={{ transformOrigin: direction > 0 ? 'left center' : 'right center' }}
                    >
                      {chapterIdx === null ? (
                        <TOCLeftPage
                          onSelectChapter={goToChapter}
                          collectedIds={collectedIds}
                          activeChapterIdx={chapterIdx}
                        />
                      ) : (
                        <ChapterLeftPage
                          chapter={activeChapter}
                          skills={activeSkills}
                          selectedSkill={selectedSkill}
                          onSelectSkill={(sk) => { setSelectedSkill(sk); setDraggedSkill(sk); }}
                          onUpgradeSkill={setUpgradeSkill}
                        />
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Footer nav */}
                <div
                  className="flex items-center justify-between px-4 py-2 flex-shrink-0"
                  style={{
                    borderTop: '1px solid rgba(255,216,107,0.18)',
                    background: 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.30) 100%)',
                  }}
                >
                  <button
                    onClick={prev}
                    disabled={chapterIdx === null}
                    className="flex items-center gap-1 px-2.5 py-1 transition-all disabled:opacity-25 hover:brightness-125 active:scale-95 text-[9px] font-semibold tracking-[0.2em] uppercase"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,216,107,0.30)',
                      color: 'rgba(255,216,107,0.85)',
                      borderRadius: 2,
                    }}
                  >
                    <ChevronLeft className="w-3 h-3" /> Prev
                  </button>

                  <div className="flex items-center gap-1.5">
                    {[null, ...CHAPTERS.map((_, i) => i)].map((val, i) => (
                      <button
                        key={i}
                        onClick={() => goToChapter(val)}
                        className="transition-all"
                        style={{
                          width: chapterIdx === val ? 16 : 5,
                          height: 5,
                          background: chapterIdx === val ? 'rgba(255,216,107,0.85)' : 'rgba(255,255,255,0.18)',
                          boxShadow: chapterIdx === val ? '0 0 6px rgba(255,216,107,0.6)' : 'none',
                        }}
                      />
                    ))}
                  </div>

                  <button
                    onClick={next}
                    disabled={chapterIdx === CHAPTERS.length - 1}
                    className="flex items-center gap-1 px-2.5 py-1 transition-all disabled:opacity-25 hover:brightness-125 active:scale-95 text-[9px] font-semibold tracking-[0.2em] uppercase"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,216,107,0.30)',
                      color: 'rgba(255,216,107,0.85)',
                      borderRadius: 2,
                    }}
                  >
                    Next <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* ── SPINE — engraved gold seam ──────────────────────────── */}
              <div
                style={{
                  width: 2,
                  flexShrink: 0,
                  background: 'linear-gradient(to bottom, transparent, rgba(255,216,107,0.55), transparent)',
                  boxShadow: '0 0 8px rgba(255,216,107,0.30)',
                  zIndex: 2,
                }}
              />

              {/* ── RIGHT PAGE ─────────────────────────────────────────── */}
              <div
                className="relative flex flex-col overflow-hidden"
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, rgba(14,22,34,0.40) 0%, rgba(8,12,20,0.40) 100%)',
                  boxShadow: 'inset 1px 0 0 rgba(255,216,107,0.15), inset 0 0 60px rgba(0,0,0,0.35)',
                }}
              >
                {/* Right page header */}
                <div
                  className="flex items-center justify-between px-4 py-2.5 flex-shrink-0"
                  style={{ borderBottom: '1px solid rgba(255,216,107,0.25)' }}
                >
                  <span className="text-amber-100/85 text-[10px] font-semibold uppercase tracking-[0.3em] truncate">
                    {selectedSkill ? selectedSkill.name : 'Skill Details'}
                  </span>
                  <button
                    onClick={onClose}
                    className="w-6 h-6 rounded-full flex items-center justify-center transition-all hover:brightness-125"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,216,107,0.35)',
                    }}
                  >
                    <X className="w-3 h-3 text-amber-100/80" />
                  </button>
                </div>

                {/* Skill detail content — animated on selection */}
                <div className="flex-1 overflow-hidden relative">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={selectedSkill?.id ?? 'empty'}
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -16 }}
                      transition={{ duration: 0.22, ease: 'easeOut' }}
                      className="absolute inset-0 overflow-y-auto"
                      style={{ scrollbarWidth: 'none' }}
                    >
                      <SkillDetailPage skill={selectedSkill} chapter={activeChapter} onUpgradeSkill={setUpgradeSkill} />
                    </motion.div>
                  </AnimatePresence>
                </div>


              </div>
            </div>
          </motion.div>
        </>
      )}
      {/* Skill Upgrade Panel — opens alongside the book */}

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