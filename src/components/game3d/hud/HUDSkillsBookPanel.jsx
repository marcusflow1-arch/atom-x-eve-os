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
        <div className="text-2xl mb-1">📖</div>
        <h2 className="text-gray-700 font-black text-base tracking-tight">Tome of Skills</h2>
        <p className="text-gray-400 text-[9px] tracking-widest uppercase mt-0.5">Table of Contents</p>
      </div>

      {collectedIds.size === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-3">
          <div className="text-3xl">📜</div>
          <p className="text-gray-400 text-[10px] text-center leading-relaxed">
            Your tome is empty.<br />
            Defeat enemies to collect<br />skill scrolls.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5 flex-1">
          {CHAPTERS.map((ch, idx) => {
            const skills = getSkillsForChapter(ch.id, collectedIds);
            if (skills.length === 0) return null;
            const isActive = activeChapterIdx === idx;
            return (
              <button
                key={ch.id}
                onClick={() => onSelectChapter(idx)}
                className="group flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all text-left"
                style={{
                  background: isActive ? `${ch.color}18` : 'rgba(255,255,255,0.55)',
                  backdropFilter: 'blur(12px)',
                  borderColor: isActive ? `${ch.color}60` : 'rgba(200,200,210,0.7)',
                  boxShadow: isActive ? `0 0 12px ${ch.color}20` : '0 2px 8px rgba(0,0,0,0.06)',
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-lg flex-shrink-0 border"
                  style={{ background: `${ch.color}18`, borderColor: `${ch.color}40` }}
                >
                  {ch.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-gray-700 font-bold text-[11px]">{ch.title}</div>
                  <div className="text-gray-400 text-[8px]">{skills.length} skills</div>
                </div>
                <ChevronRight
                  className="w-3 h-3 flex-shrink-0 group-hover:translate-x-0.5 transition-transform"
                  style={{ color: isActive ? ch.color : '#d1d5db' }}
                />
              </button>
            );
          })}
        </div>
      )}

      <div className="text-center text-gray-300 text-[8px] mt-3 tracking-wide">
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
        className="flex items-center gap-2.5 mb-3 pb-2.5 border-b flex-shrink-0"
        style={{ borderColor: `${chapter.color}30` }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-xl border flex-shrink-0"
          style={{ background: `${chapter.color}18`, borderColor: `${chapter.color}50` }}
        >
          {chapter.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-gray-700 font-black text-[12px] leading-tight">{chapter.title}</h3>
          <p className="text-gray-400 text-[8px]">{chapter.subtitle}</p>
        </div>
        <div
          className="px-2 py-1 rounded-lg border flex-shrink-0 text-center"
          style={{ background: `${chapter.color}12`, borderColor: `${chapter.color}30` }}
        >
          <div className="font-black text-[12px] leading-none" style={{ color: chapter.color }}>{skills.length}</div>
          <div className="text-gray-400 text-[7px]">learned</div>
        </div>
      </div>

      {/* Skill list */}
      <div className="flex flex-col gap-1 flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        {skills.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-24 gap-2 text-gray-400 text-[10px] text-center">
            <span className="text-xl">📜</span>
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
                className="flex items-center gap-2 px-2.5 py-2 rounded-lg border transition-all text-left w-full"
                style={{
                  background: isSelected ? `${color}18` : 'rgba(255,255,255,0.6)',
                  borderColor: isSelected ? `${color}60` : 'rgba(200,200,210,0.5)',
                  boxShadow: isSelected ? `0 0 10px ${color}25` : 'none',
                }}
              >
                <div
                  className="w-7 h-7 rounded-md flex items-center justify-center text-sm flex-shrink-0 border"
                  style={{ background: `${color}20`, borderColor: `${color}50` }}
                >
                  {sk.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-gray-700 text-[10px] font-bold truncate">{sk.name}</div>
                  <div className="text-[8px] font-black tracking-wider" style={{ color }}>{sk.rarity?.toUpperCase()}</div>
                </div>
                {sk.damage_pct && (
                  <div className="text-right flex-shrink-0">
                    <span className="text-gray-500 font-black text-[9px]">{sk.damage_pct}%</span>
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
        <p className="text-gray-400 text-[10px] text-center leading-relaxed">
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
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border-2 mb-3"
          style={{
            background: `${color}18`,
            borderColor: `${color}60`,
            boxShadow: `0 0 24px ${color}30`,
          }}
        >
          {skill.icon}
        </div>
        <h3 className="text-gray-700 font-black text-sm leading-tight mb-1">{skill.name}</h3>
        <span
          className="text-[9px] px-2 py-0.5 rounded-full font-black tracking-wider border"
          style={{ color, background: `${color}15`, borderColor: `${color}40` }}
        >
          {label?.toUpperCase() || skill.rarity?.toUpperCase()}
        </span>
      </div>

      {/* Divider */}
      <div className="w-full h-px mb-4" style={{ background: `linear-gradient(to right, transparent, ${color}40, transparent)` }} />

      {/* Stats */}
      <div className="flex flex-col gap-2 flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        {skill.type && (
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-gray-400">Type</span>
            <span className="text-gray-600 font-bold">{skill.type}</span>
          </div>
        )}
        {skill.damage_pct && (
          <div
            className="flex items-center justify-between px-3 py-2 rounded-lg border"
            style={{ background: `${color}10`, borderColor: `${color}30` }}
          >
            <span className="text-gray-500 text-[10px]">Damage</span>
            <span className="font-black text-sm" style={{ color }}>{skill.damage_pct}%</span>
          </div>
        )}
        {skill.cooldown && (
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-gray-400">Cooldown</span>
            <span className="text-gray-600 font-bold">{skill.cooldown}s</span>
          </div>
        )}
        {skill.stamina_cost && (
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-gray-400">Stamina Cost</span>
            <span className="text-gray-600 font-bold">{skill.stamina_cost}</span>
          </div>
        )}
        {skill.range && (
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-gray-400">Range</span>
            <span className="text-gray-600 font-bold">{skill.range}</span>
          </div>
        )}

        {/* Description */}
        {skill.description && (
          <>
            <div className="w-full h-px mt-1" style={{ background: 'rgba(200,200,210,0.5)' }} />
            <p className="text-gray-500 text-[10px] leading-relaxed mt-1">{skill.description}</p>
          </>
        )}

        {/* Upgrade button */}
        <button
          onClick={() => onUpgradeSkill && onUpgradeSkill(skill)}
          className="mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border transition-all hover:scale-[1.02] active:scale-95"
          style={{ background: 'rgba(245,158,11,0.12)', borderColor: 'rgba(245,158,11,0.4)', color: '#f59e0b' }}
        >
          <TrendingUp className="w-3 h-3" />
          <span className="text-[9px] font-black tracking-wider">UPGRADE / ASSIGN SLOT</span>
        </button>

        {/* Equipped badge */}
        {skill.equipped && (
          <div
            className="mt-auto flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border"
            style={{ background: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.4)' }}
          >
            <Sparkles className="w-3 h-3 text-emerald-500" />
            <span className="text-emerald-600 text-[9px] font-black tracking-wider">CURRENTLY EQUIPPED</span>
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="mt-3 pt-2 border-t text-gray-300 text-[8px] text-center" style={{ borderColor: 'rgba(200,200,210,0.4)' }}>
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
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70]"
            style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)' }}
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
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '100%',
              height: '100%',
            }}
          >
            {/* ── Skill Equip Slots (outside-left of book) ── */}
            <SkillEquipSlots
              draggedSkill={draggedSkill}
              onClearDrag={() => setDraggedSkill(null)}
            />
            {/* ── Outer book cover (slight 3-D wedge feel via perspective) ── */}
            <div
              className="flex overflow-hidden"
              style={{
                width: 720,
                height: 520,
                borderRadius: 18,
                boxShadow: '0 40px 100px rgba(0,0,0,0.5), 0 8px 24px rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.18)',
                perspective: '1200px',
              }}
            >
              {/* ── LEFT PAGE ──────────────────────────────────────────── */}
              <div
                className="relative flex flex-col overflow-hidden"
                style={{
                  width: '50%',
                  borderRadius: '18px 0 0 18px',
                  /* Inward fold on right edge */
                  background: 'rgba(238, 238, 244, 0.82)',
                  backdropFilter: 'blur(40px) saturate(180%) brightness(1.06)',
                  WebkitBackdropFilter: 'blur(40px) saturate(180%) brightness(1.06)',
                  boxShadow: 'inset -8px 0 20px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.9)',
                  borderRight: '1px solid rgba(160,160,180,0.35)',
                  transformStyle: 'preserve-3d',
                  transform: 'rotateY(4deg)',
                  transformOrigin: 'right center',
                }}
              >
                {/* Left spine accent */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-1.5"
                  style={{
                    borderRadius: '18px 0 0 18px',
                    background: 'linear-gradient(to right, rgba(140,140,160,0.5), transparent)',
                  }}
                />

                {/* Left page header */}
                <div
                  className="flex items-center justify-between px-4 py-2.5 flex-shrink-0 border-b"
                  style={{ borderColor: 'rgba(180,180,200,0.4)' }}
                >
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-gray-500 text-[10px] font-black uppercase tracking-[0.12em]">
                      {activeChapter ? activeChapter.title : 'Contents'}
                    </span>
                  </div>
                  <span className="text-gray-300 text-[8px]">pg {pageIndicator + 1}/{totalPages}</span>
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
                  className="flex items-center justify-between px-4 py-2 flex-shrink-0 border-t"
                  style={{ borderColor: 'rgba(180,180,200,0.4)', background: 'rgba(220,222,228,0.45)' }}
                >
                  <button
                    onClick={prev}
                    disabled={chapterIdx === null}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-all disabled:opacity-25 hover:scale-105 active:scale-95 text-[9px] font-semibold text-gray-500"
                    style={{ background: 'rgba(255,255,255,0.7)', borderColor: 'rgba(180,180,200,0.7)' }}
                  >
                    <ChevronLeft className="w-3 h-3" /> Prev
                  </button>

                  <div className="flex items-center gap-1">
                    {[null, ...CHAPTERS.map((_, i) => i)].map((val, i) => (
                      <button
                        key={i}
                        onClick={() => goToChapter(val)}
                        className="rounded-full transition-all"
                        style={{
                          width: chapterIdx === val ? 14 : 5,
                          height: 5,
                          background: chapterIdx === val ? '#6b7280' : 'rgba(150,150,170,0.35)',
                        }}
                      />
                    ))}
                  </div>

                  <button
                    onClick={next}
                    disabled={chapterIdx === CHAPTERS.length - 1}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-all disabled:opacity-25 hover:scale-105 active:scale-95 text-[9px] font-semibold text-gray-500"
                    style={{ background: 'rgba(255,255,255,0.7)', borderColor: 'rgba(180,180,200,0.7)' }}
                  >
                    Next <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* ── SPINE shadow strip ──────────────────────────────────── */}
              <div
                style={{
                  width: 6,
                  flexShrink: 0,
                  background: 'linear-gradient(to right, rgba(0,0,0,0.18), rgba(0,0,0,0.04))',
                  zIndex: 2,
                }}
              />

              {/* ── RIGHT PAGE ─────────────────────────────────────────── */}
              <div
                className="relative flex flex-col overflow-hidden"
                style={{
                  flex: 1,
                  borderRadius: '0 18px 18px 0',
                  /* Inward fold on left edge */
                  background: 'rgba(245, 245, 250, 0.78)',
                  backdropFilter: 'blur(40px) saturate(180%) brightness(1.04)',
                  WebkitBackdropFilter: 'blur(40px) saturate(180%) brightness(1.04)',
                  boxShadow: 'inset 8px 0 20px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.85)',
                  transformStyle: 'preserve-3d',
                  transform: 'rotateY(-4deg)',
                  transformOrigin: 'left center',
                }}
              >
                {/* Right page header */}
                <div
                  className="flex items-center justify-between px-4 py-2.5 flex-shrink-0 border-b"
                  style={{ borderColor: 'rgba(180,180,200,0.4)' }}
                >
                  <span className="text-gray-500 text-[10px] font-black uppercase tracking-[0.12em]">
                    {selectedSkill ? selectedSkill.name : 'Skill Details'}
                  </span>
                  <button
                    onClick={onClose}
                    className="w-5 h-5 rounded-full flex items-center justify-center transition-all hover:scale-110"
                    style={{ background: 'rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.1)' }}
                  >
                    <X className="w-2.5 h-2.5 text-gray-500" />
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

                {/* Right spine accent */}
                <div
                  className="absolute right-0 top-0 bottom-0 w-1.5"
                  style={{
                    borderRadius: '0 18px 18px 0',
                    background: 'linear-gradient(to left, rgba(140,140,160,0.4), transparent)',
                  }}
                />
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