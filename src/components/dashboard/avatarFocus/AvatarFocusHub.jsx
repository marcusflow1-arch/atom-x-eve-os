import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Swords, Sparkles, Radio, Crown, Gamepad2, Globe } from 'lucide-react';
import { glassCard } from './SectionShell';
import QuestSection from './sections/QuestSection';
import BattleSection from './sections/BattleSection';
import StorySection from './sections/StorySection';
import LiveSection from './sections/LiveSection';
import RanksSection from './sections/RanksSection';
import GamesSection from './sections/GamesSection';
import WorldsSection from './sections/WorldsSection';

const SECTIONS = [
  { id: 'quest', label: 'Quest', icon: Trophy, hex: '#facc15', Component: QuestSection },
  { id: 'battle', label: 'Battle', icon: Swords, hex: '#f87171', Component: BattleSection },
  { id: 'story', label: 'Story', icon: Sparkles, hex: '#22d3ee', Component: StorySection },
  { id: 'live', label: 'Live', icon: Radio, hex: '#4ade80', Component: LiveSection },
  { id: 'ranks', label: 'Ranks', icon: Crown, hex: '#a855f7', Component: RanksSection },
  { id: 'games', label: 'Games', icon: Gamepad2, hex: '#60a5fa', Component: GamesSection },
  { id: 'worlds', label: 'Worlds', icon: Globe, hex: '#f472b6', Component: WorldsSection },
];

// Avatar Focus Hub — seven feature selectors run horizontally in the main
// content area, with the selected content rendered directly underneath.
export default function AvatarFocusHub({ onClose }) {
  const [index, setIndex] = useState(0);

  const go = useCallback((delta) => {
    setIndex((prev) => (prev + delta + SECTIONS.length) % SECTIONS.length);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target?.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || e.target?.isContentEditable) return;
      const k = (e.key || '').toLowerCase();
      if (k === 'a' || k === 'arrowleft') { e.preventDefault(); go(-1); }
      else if (k === 'd' || k === 'arrowright') { e.preventDefault(); go(1); }
      else if (k === 'escape') { e.stopPropagation(); onClose(); }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [go, onClose]);

  const section = SECTIONS[index];

  return (
    <motion.div
      data-avatar-focus-hub="true"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute z-30 pointer-events-auto"
      style={{ left: '338px', top: '88px', right: '24px', bottom: '56px' }}
    >
      <div className="h-full flex flex-col min-w-0">
        {/* Horizontal selector row — directly to the right of the avatar/stats column. */}
        <div
          className="flex-shrink-0 overflow-x-auto pb-3"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <div className="flex items-center gap-2 min-w-max px-1">
            {SECTIONS.map((s, i) => {
              const Icon = s.icon;
              const active = i === index;
              return (
                <button
                  key={s.id}
                  onClick={() => setIndex(i)}
                  title={s.label}
                  className="w-20 h-12 rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] flex-shrink-0"
                  style={{
                    ...glassCard(active ? s.hex : 'rgba(255,255,255,0.10)'),
                    boxShadow: active ? `0 0 16px ${s.hex}55` : undefined,
                  }}
                >
                  <Icon className="w-4 h-4" style={{ color: s.hex, opacity: active ? 1 : 0.6 }} />
                  <span className={`text-[8px] font-bold uppercase tracking-widest ${active ? 'text-white' : 'text-white/40'}`}>
                    {s.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected content is directly below the horizontal selector row. */}
        <div className="flex-1 min-h-0 relative overflow-hidden mt-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="absolute inset-0 overflow-y-auto pr-2"
            >
              <div className="flex items-center gap-3 mb-4">
                <section.icon className="w-5 h-5" style={{ color: section.hex }} />
                <span className="text-white/80 font-bold text-sm uppercase tracking-[0.3em]">{section.label}</span>
              </div>
              <section.Component accent={section.hex} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
