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
        background: 'linear-gradient(135deg, rgba(180, 195, 215, 0.10) 0%, rgba(140, 160, 185, 0.07) 40%, rgba(200, 210, 225, 0.09) 100%)',
        backdropFilter: 'blur(28px) saturate(160%)',
        WebkitBackdropFilter: 'blur(28px) saturate(160%)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.08)',
      }}
    >
      {/* Spine edge highlight */}
      <div className={`absolute top-0 bottom-0 w-[2px] ${tiltDirection === 'left' ? 'right-0' : 'left-0'}`}
        style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.12), rgba(255,255,255,0.04), rgba(255,255,255,0.08))' }}
      />

      {/* Inner bend shadow — simulates the page curving into the spine */}
      <div
        className={`absolute top-0 bottom-0 pointer-events-none z-10 ${tiltDirection === 'left' ? 'right-0 w-8' : 'left-0 w-8'}`}
        style={{
          background: tiltDirection === 'left'
            ? 'linear-gradient(to left, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.08) 40%, transparent 100%)'
            : 'linear-gradient(to right, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.08) 40%, transparent 100%)',
          borderRadius: tiltDirection === 'left' ? '0 12px 12px 0' : '12px 0 0 12px',
        }}
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
          Quest Book
        </h3>
      </div>

      {/* Book — layered backing for depth, then glass pages on top */}
      <div className="w-full relative" style={{ transformStyle: 'preserve-3d' }}>

        {/* Back layer 2 — outermost "page stack" edge */}
        <div
          className="absolute inset-x-2 rounded-xl pointer-events-none"
          style={{
            top: '6px',
            bottom: '-6px',
            transform: 'perspective(800px) translateZ(-12px)',
            background: 'linear-gradient(135deg, rgba(100, 115, 135, 0.08) 0%, rgba(80, 95, 115, 0.06) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
          }}
        />

        {/* Back layer 1 — inner "page stack" edge */}
        <div
          className="absolute inset-x-1 rounded-xl pointer-events-none"
          style={{
            top: '3px',
            bottom: '-3px',
            transform: 'perspective(800px) translateZ(-6px)',
            background: 'linear-gradient(135deg, rgba(130, 145, 165, 0.09) 0%, rgba(110, 125, 145, 0.07) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
          }}
        />

        {/* Center spine / binding strip — connects the two pages */}
        <div
          className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-5 rounded-sm pointer-events-none z-30"
          style={{
            background: 'linear-gradient(90deg, rgba(0,0,0,0.25) 0%, rgba(255,255,255,0.06) 35%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.06) 65%, rgba(0,0,0,0.25) 100%)',
            boxShadow: 'inset 2px 0 4px rgba(0,0,0,0.3), inset -2px 0 4px rgba(0,0,0,0.3), 0 0 12px rgba(0,0,0,0.4)',
          }}
        />

        {/* The actual book pages */}
        <div className="relative z-20 w-full flex gap-1" style={{ transformStyle: 'preserve-3d' }}>
          <div className="flex-1 min-w-0" onClick={handleClickLeft}>
            <BookPage quests={ALL_PAGES[leftIdx]} tiltDirection="left" contentVisible={contentVisible} />
          </div>
          <div className="flex-1 min-w-0" onClick={handleClickRight}>
            <BookPage quests={ALL_PAGES[rightIdx]} tiltDirection="right" contentVisible={contentVisible} />
          </div>
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