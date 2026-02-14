import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen } from 'lucide-react';

const ALL_PAGES = [
  [
    { id: 1, title: 'Dragon Slayer', desc: 'Defeat 3 dragons in RPG games', progress: 2, total: 3, rarity: 'Legendary', icon: '🐉' },
    { id: 2, title: 'Speed Runner', desc: 'Complete a race under 2 min', progress: 0, total: 1, rarity: 'Rare', icon: '⚡' },
    { id: 3, title: 'Social Butterfly', desc: 'Join 2 clan events', progress: 1, total: 2, rarity: 'Common', icon: '🦋' },
  ],
  [
    { id: 4, title: 'Card Collector', desc: 'Collect 10 Epic+ cards', progress: 7, total: 10, rarity: 'Epic', icon: '🃏' },
    { id: 5, title: 'Arena Victor', desc: 'Win 5 PvP battles', progress: 3, total: 5, rarity: 'Rare', icon: '⚔️' },
    { id: 6, title: 'Explorer', desc: 'Visit 4 environments', progress: 4, total: 4, rarity: 'Common', icon: '🗺️', complete: true },
  ],
  [
    { id: 7, title: 'Loot Hoarder', desc: 'Open 20 loot chests', progress: 14, total: 20, rarity: 'Epic', icon: '📦' },
    { id: 8, title: 'Sharpshooter', desc: '50 headshots in FPS games', progress: 32, total: 50, rarity: 'Rare', icon: '🎯' },
    { id: 9, title: 'Night Owl', desc: 'Play 10 sessions after midnight', progress: 6, total: 10, rarity: 'Common', icon: '🦉' },
  ],
  [
    { id: 10, title: 'Forge Master', desc: 'Craft 5 Legendary items', progress: 1, total: 5, rarity: 'Legendary', icon: '🔨' },
    { id: 11, title: 'Diplomancer', desc: 'Trade with 8 unique players', progress: 5, total: 8, rarity: 'Epic', icon: '🤝' },
    { id: 12, title: 'Speedster', desc: 'Win 3 races in a row', progress: 3, total: 3, rarity: 'Rare', icon: '🏎️', complete: true },
  ],
  [
    { id: 13, title: 'World Walker', desc: 'Visit all 6 biomes', progress: 4, total: 6, rarity: 'Epic', icon: '🌍' },
    { id: 14, title: 'Perfectionist', desc: '100% a game', progress: 0, total: 1, rarity: 'Legendary', icon: '💯' },
    { id: 15, title: 'First Blood', desc: 'Get first kill in 5 matches', progress: 5, total: 5, rarity: 'Common', icon: '🩸', complete: true },
  ],
];

const RARITY_COLOR = {
  Legendary: 'text-amber-300',
  Epic: 'text-purple-300',
  Rare: 'text-blue-300',
  Common: 'text-slate-300',
};

function QuestEntry({ quest }) {
  const pct = Math.min(100, Math.round((quest.progress / quest.total) * 100));
  const color = RARITY_COLOR[quest.rarity] || 'text-white/60';
  const isComplete = quest.complete || quest.progress >= quest.total;

  return (
    <div className={`flex items-start gap-2.5 px-3 py-2 rounded-lg transition-colors ${isComplete ? 'opacity-50' : 'hover:bg-white/5'}`}>
      <span className="text-lg flex-shrink-0 mt-0.5">{quest.icon}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-[10px] font-bold truncate ${isComplete ? 'line-through text-white/30' : 'text-white/80'}`}>{quest.title}</p>
        <p className="text-[8px] text-white/25 truncate">{quest.desc}</p>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 h-1 bg-white/8 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${isComplete ? 'bg-green-500/60' : 'bg-cyan-400/60'}`} style={{ width: `${pct}%` }} />
          </div>
          <span className={`text-[8px] font-mono ${color}`}>{quest.progress}/{quest.total}</span>
        </div>
      </div>
    </div>
  );
}

function BookPage({ quests, tiltDirection, contentVisible }) {
  // Left page tilts right (positive rotateY), right page tilts left (negative rotateY) — like an open book
  const tiltAngle = tiltDirection === 'left' ? 8 : -8;

  return (
    <div
      className="flex-1 min-w-0 rounded-xl overflow-hidden relative cursor-pointer"
      style={{
        transform: `perspective(800px) rotateY(${tiltAngle}deg)`,
        transformOrigin: tiltDirection === 'left' ? 'right center' : 'left center',
        background: 'linear-gradient(135deg, rgba(200, 210, 225, 0.08) 0%, rgba(160, 175, 195, 0.05) 40%, rgba(180, 190, 210, 0.07) 100%)',
        backdropFilter: 'blur(24px) saturate(150%)',
        WebkitBackdropFilter: 'blur(24px) saturate(150%)',
        border: '1px solid rgba(255, 255, 255, 0.10)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.06)',
      }}
    >
      {/* Spine edge highlight */}
      <div className={`absolute top-0 bottom-0 w-[2px] ${tiltDirection === 'left' ? 'right-0' : 'left-0'}`}
        style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.12), rgba(255,255,255,0.04), rgba(255,255,255,0.08))' }}
      />

      {/* Content fades in/out while the glass shell stays */}
      <div
        className="relative z-20 p-3 flex flex-col gap-1 h-full transition-opacity duration-200"
        style={{ opacity: contentVisible ? 1 : 0 }}
      >
        {quests.map(q => <QuestEntry key={q.id} quest={q} />)}
      </div>
    </div>
  );
}

export default function QuestLogBook() {
  const [leftIdx, setLeftIdx] = useState(0);
  const [rightIdx, setRightIdx] = useState(1);
  const [contentVisible, setContentVisible] = useState(true);
  const [turning, setTurning] = useState(false);

  const totalPages = ALL_PAGES.length;

  const handleClickRight = () => {
    if (turning) return;
    setTurning(true);
    setContentVisible(false);
    setTimeout(() => {
      setLeftIdx(rightIdx);
      setRightIdx((rightIdx + 1) % totalPages);
      setContentVisible(true);
      setTurning(false);
    }, 220);
  };

  const handleClickLeft = () => {
    if (turning) return;
    setTurning(true);
    setContentVisible(false);
    setTimeout(() => {
      setRightIdx(leftIdx);
      setLeftIdx((leftIdx - 1 + totalPages) % totalPages);
      setContentVisible(true);
      setTurning(false);
    }, 220);
  };

  return (
    <div className="w-full flex flex-col items-center" style={{ perspective: '1000px' }}>
      {/* Title */}
      <div className="flex items-center gap-2 mb-3 w-full justify-center">
        <BookOpen className="w-4 h-4 text-white/40" />
        <h3
          className="text-sm font-extrabold uppercase tracking-widest text-center"
          style={{
            background: 'linear-gradient(180deg, #E2E8F0 0%, #94A3B8 45%, #475569 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))',
          }}
        >
          Quest Log
        </h3>
      </div>

      {/* Book — glass shells stay, only inner content fades */}
      <div className="w-full flex gap-1" style={{ transformStyle: 'preserve-3d' }}>
        <div className="flex-1 min-w-0" onClick={handleClickLeft}>
          <BookPage quests={ALL_PAGES[leftIdx]} tiltDirection="left" contentVisible={contentVisible} />
        </div>
        <div className="flex-1 min-w-0" onClick={handleClickRight}>
          <BookPage quests={ALL_PAGES[rightIdx]} tiltDirection="right" contentVisible={contentVisible} />
        </div>
      </div>

      {/* Page indicator dots */}
      <div className="mt-2 flex items-center gap-1">
        {ALL_PAGES.map((_, i) => (
          <div
            key={i}
            className={`rounded-full transition-all ${i === leftIdx || i === rightIdx ? 'bg-white/40 w-1.5 h-1.5' : 'bg-white/12 w-1 h-1'}`}
          />
        ))}
      </div>
    </div>
  );
}