import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Trophy, Swords, Sparkles, Radio, Crown, Gamepad2, Globe } from 'lucide-react';
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

// Avatar Focus Hub — opens blank when the 3D model is clicked; A/D (or edge arrows)
// rotate through full-page section UIs: Quest, Battle, Story, Live, Ranks, Games, Worlds.
export default function AvatarFocusHub({ onClose }) {
  const [index, setIndex] = useState(null); // null = blank landing
  const [dir, setDir] = useState(1);
  const indexRef = useRef(index);
  indexRef.current = index;

  const go = useCallback((delta) => {
    setDir(delta);
    setIndex((prev) => prev === null
      ? (delta > 0 ? 0 : SECTIONS.length - 1)
      : (prev + delta + SECTIONS.length) % SECTIONS.length);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target?.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || e.target?.isContentEditable) return;
      const k = (e.key || '').toLowerCase();
      if (k === 'a' || k === 'arrowleft') { e.preventDefault(); go(-1); }
      else if (k === 'd' || k === 'arrowright') { e.preventDefault(); go(1); }
      else if (k === 'escape') {
        e.stopPropagation();
        if (indexRef.current === null) onClose();
        else setIndex(null);
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [go, onClose]);

  const section = index === null ? null : SECTIONS[index];

  const ArrowButton = ({ side }) => (
    <button
      onClick={() => go(side === 'left' ? -1 : 1)}
      className={`absolute top-1/2 -translate-y-1/2 ${side === 'left' ? 'left-4' : 'right-4'} z-30 w-12 h-12 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:scale-110 transition-all`}
      style={glassCard('rgba(255,255,255,0.18)')}
      title={side === 'left' ? 'Rotate left (A)' : 'Rotate right (D)'}
    >
      {side === 'left' ? <ChevronLeft className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />}
    </button>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {section === null ? (
        /* ── BLANK LANDING — no environment hub, no boxes; just the directional arrow ── */
        <div className="absolute z-10 pointer-events-auto flex flex-col items-center justify-center"
          style={{ left: '350px', top: '88px', right: '24px', bottom: '120px' }}>
          <ArrowButton side="right" />
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="flex flex-col items-center gap-6">
            <span className="text-white/15 font-black text-4xl tracking-[0.35em] select-none">ATOM × EVE</span>
            <span className="text-white/35 text-[11px] uppercase tracking-[0.4em]">Focus Mode</span>
            {/* Dim section compass — shows what the rotation holds */}
            <div className="flex items-center gap-2 mt-2">
              {SECTIONS.map((s, i) => {
                const Icon = s.icon;
                return (
                  <button key={s.id} onClick={() => { setDir(1); setIndex(i); }}
                    className="flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl text-white/30 hover:text-white transition-all hover:scale-105"
                    style={glassCard('rgba(255,255,255,0.08)')}>
                    <Icon className="w-4 h-4" style={{ color: s.hex, opacity: 0.75 }} />
                    <span className="text-[9px] font-bold uppercase tracking-widest">{s.label}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-white/25 text-[10px] tracking-[0.3em] uppercase mt-2">Press D or the arrow to enter · A / D rotates</p>
          </motion.div>
        </div>
      ) : (
        /* ── FULL-PAGE SECTION UI ── */
        <div className="fixed left-0 right-0 z-[46] flex flex-col pointer-events-auto"
          style={{ top: '64px', bottom: '48px', background: 'rgba(7,10,17,0.90)', backdropFilter: 'blur(30px) saturate(150%)', WebkitBackdropFilter: 'blur(30px) saturate(150%)' }}>

          {/* Header — section identity + rotation dots */}
          <div className="flex items-center justify-between px-8 py-3 flex-shrink-0 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              <section.icon className="w-5 h-5" style={{ color: section.hex }} />
              <span className="text-white/80 font-bold text-sm uppercase tracking-[0.3em]">{section.label}</span>
            </div>
            <div className="flex items-center gap-2">
              {SECTIONS.map((s, i) => (
                <button key={s.id} onClick={() => { setDir(i > index ? 1 : -1); setIndex(i); }}
                  className="transition-all rounded-full"
                  style={{ width: i === index ? '22px' : '8px', height: '8px', background: i === index ? s.hex : 'rgba(255,255,255,0.18)' }}
                  title={s.label} />
              ))}
            </div>
            <button onClick={() => setIndex(null)}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all"
              title="Back (Esc)">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Rotating content */}
          <div className="flex-1 min-h-0 relative">
            <ArrowButton side="left" />
            <ArrowButton side="right" />
            <AnimatePresence mode="wait" custom={dir}>
              <motion.div
                key={section.id}
                custom={dir}
                initial={{ opacity: 0, x: dir * 80 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: dir * -80 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
                className="absolute inset-0 px-16"
              >
                <section.Component accent={section.hex} />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer — directional hint */}
          <div className="flex items-center justify-center gap-3 py-2 flex-shrink-0 border-t border-white/[0.06]">
            <span className="text-white/25 text-[10px] font-bold uppercase tracking-[0.3em]">◄ A</span>
            <span className="text-white/15 text-[10px] uppercase tracking-[0.3em]">rotate</span>
            <span className="text-white/25 text-[10px] font-bold uppercase tracking-[0.3em]">D ►</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}