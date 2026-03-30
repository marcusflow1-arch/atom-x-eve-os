import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, RefreshCw, ShoppingBag, Trophy, ChevronDown } from 'lucide-react';

const glassStyle = {
  background: 'rgba(6, 9, 16, 0.72)',
  backdropFilter: 'blur(60px) saturate(180%)',
  WebkitBackdropFilter: 'blur(60px) saturate(180%)',
  borderLeft: '1px solid rgba(255,255,255,0.07)',
  boxShadow: '0 4px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04)',
};

const mockChapters = [
  { name: 'Prologue: The Awakening', progress: 100, completed: true },
  { name: 'Ch. 1: Dark Crossing', progress: 60, completed: false },
  { name: 'Ch. 2: Cyber Breach', progress: 0, completed: false },
];

const mockExpansions = [
  { name: 'Neural Expansion Pack', price: 14.99 },
  { name: 'Void Walker Arsenal', price: 14.99 },
];

const mockPatches = [
  {
    version: 'V2.1.8',
    title: 'Patch 2.1 - Cyber Dawn',
    body: 'New neon city district, 5 new weapons, balance changes.',
    date: 'TODAY',
  },
  {
    version: 'EVENT',
    title: 'Event: Void Walker\'s Return',
    body: 'Limited time event! Earn double XP and exclusive void skins.',
    date: '2 DAYS AGO',
  },
];

export default function LibraryGameDetailModal({ game, onClose }) {
  const [expandedChapter, setExpandedChapter] = useState(null);
  const overallProgress = 35;

  if (!game) return null;

  const title = game.title || game.name || 'Unknown Game';

  return (
    <AnimatePresence>
      <motion.div
        key="game-detail-panel"
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 20, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        className="fixed z-[68] flex flex-col overflow-hidden"
        style={{
          right: 0,
          top: '64px',
          bottom: '52px',
          width: '380px',
          ...glassStyle,
        }}
      >
        {/* Header bar */}
        <div
          className="flex items-center justify-between px-5 py-3 flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.025)' }}
        >
          <span className="text-white font-bold text-sm tracking-wide">{title}</span>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-full flex items-center justify-center transition-colors hover:bg-white/10"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <X className="w-3 h-3 text-white/50" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 px-4 py-3 border-b border-white/5 flex-shrink-0">
          <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-400 text-xs font-bold transition-colors">
            <Play className="w-3 h-3 fill-current" /> Play
          </button>
          <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 text-xs font-bold transition-colors">
            Info
          </button>
        </div>

        {/* Body: scrollable content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ scrollbarWidth: 'none' }}>

          {/* Game Updates */}
          <div>
            <p className="text-white/35 text-[9px] uppercase tracking-wider font-bold mb-2">Latest Updates</p>
            <div className="space-y-2">
              {mockPatches.map((patch, i) => (
                <div key={i} className="border-l-2 border-cyan-500/40 pl-3">
                  <p className="text-white font-semibold text-[10px] leading-tight">{patch.title}</p>
                  <p className="text-white/40 text-[9px] leading-relaxed mt-0.5">{patch.body}</p>
                  <p className="text-white/25 text-[8px] mt-1">{patch.date}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Expansion Content */}
          <div>
            <p className="text-white/35 text-[9px] uppercase tracking-wider font-bold mb-2">DLC & Add-ons</p>
            <div className="space-y-1.5">
              {mockExpansions.map((exp, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 border border-white/5 hover:bg-white/8 transition-colors">
                  <span className="text-white/80 text-[10px] font-medium">{exp.name}</span>
                  <span className="text-white/60 text-[9px]">${exp.price.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Game Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-white/35 text-[9px] uppercase tracking-wider font-bold">Progress</p>
              <span className="text-cyan-400 font-bold text-[9px]">{overallProgress}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/10 mb-4 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400"
                style={{ width: `${overallProgress}%` }}
              />
            </div>

            {/* Main Story */}
            <p className="text-white/35 text-[9px] uppercase tracking-wider font-bold mb-2">Main Story</p>
            <div className="space-y-1">
              {mockChapters.map((ch, i) => (
                <div key={i} className="rounded-lg bg-white/5 border border-white/5 overflow-hidden">
                  <button
                    onClick={() => setExpandedChapter(expandedChapter === i ? null : i)}
                    className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {ch.completed && <span className="text-green-400 text-[8px]">✓</span>}
                      <span className={`text-[9px] font-medium truncate ${ch.completed ? 'text-white/70' : 'text-white'}`}>{ch.name}</span>
                    </div>
                    <ChevronDown className={`w-2.5 h-2.5 text-white/30 transition-transform flex-shrink-0 ${expandedChapter === i ? 'rotate-180' : ''}`} />
                  </button>
                  {expandedChapter === i && (
                    <div className="px-3 pb-2">
                      <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${ch.completed ? 'bg-green-500' : 'bg-yellow-400'}`}
                          style={{ width: `${ch.progress}%` }}
                        />
                      </div>
                      <p className="text-white/25 text-[8px] mt-1">{ch.progress}% complete</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      </motion.div>
    </AnimatePresence>
  );
}