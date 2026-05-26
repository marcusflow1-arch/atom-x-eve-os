import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Home, Sparkles, Star } from 'lucide-react';

const SECTIONS = [
  { id: 'avatar',    label: 'AI Avatar Home',       icon: Home,     color: 'cyan' },
  { id: 'developer', label: 'Developer Spotlight',  icon: Sparkles, color: 'purple' },
  { id: 'discover',  label: 'What\'s New',          icon: Star,     color: 'amber' },
];

const DOT_COLORS = {
  cyan:   'bg-cyan-400',
  purple: 'bg-purple-400',
  amber:  'bg-amber-400',
};

const GLOW_COLORS = {
  cyan:   'shadow-[0_0_16px_rgba(34,211,238,0.5)]',
  purple: 'shadow-[0_0_16px_rgba(168,85,247,0.5)]',
  amber:  'shadow-[0_0_16px_rgba(251,191,36,0.5)]',
};

const BORDER_COLORS = {
  cyan:   'border-cyan-400/40',
  purple: 'border-purple-400/40',
  amber:  'border-amber-400/40',
};

/**
 * HomeSectionSwitcher
 *
 * Renders the left-middle arrow (switches between sections horizontally)
 * and bottom-center arrow (cycles to next section).
 * Also renders section indicator dots and the current section label.
 *
 * Usage:
 *   <HomeSectionSwitcher currentSection={section} onSectionChange={setSection} />
 */
export default function HomeSectionSwitcher({ currentSection, onSectionChange }) {
  const currentIdx = SECTIONS.findIndex(s => s.id === currentSection);
  const current = SECTIONS[currentIdx] ?? SECTIONS[0];

  const goLeft = () => {
    const prev = (currentIdx - 1 + SECTIONS.length) % SECTIONS.length;
    onSectionChange(SECTIONS[prev].id);
  };

  const goRight = () => {
    const next = (currentIdx + 1) % SECTIONS.length;
    onSectionChange(SECTIONS[next].id);
  };

  const goDown = () => {
    const next = (currentIdx + 1) % SECTIONS.length;
    onSectionChange(SECTIONS[next].id);
  };

  const color = current.color;

  return (
    <>
      {/* ── Left-middle arrow (prev / next section) ── */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-2 pointer-events-auto"
           style={{ left: '4px' }}>

        {/* Prev */}
        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          onClick={goLeft}
          title="Previous section"
          className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all backdrop-blur-md
            bg-black/40 border-white/20 hover:bg-white/10 hover:${BORDER_COLORS[color]} text-white/60 hover:text-white`}>
          <ChevronLeft className="w-5 h-5" />
        </motion.button>

        {/* Section dots */}
        <div className="flex flex-col items-center gap-1.5 py-1">
          {SECTIONS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => onSectionChange(s.id)}
              title={s.label}
              className={`rounded-full transition-all duration-300 ${
                i === currentIdx
                  ? `w-2 h-2 ${DOT_COLORS[s.color]} ${GLOW_COLORS[s.color]}`
                  : 'w-1.5 h-1.5 bg-white/25 hover:bg-white/50'
              }`}
            />
          ))}
        </div>

        {/* Next */}
        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          onClick={goRight}
          title="Next section"
          className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all backdrop-blur-md
            bg-black/40 border-white/20 hover:bg-white/10 hover:${BORDER_COLORS[color]} text-white/60 hover:text-white`}>
          <ChevronRight className="w-5 h-5" />
        </motion.button>
      </div>

      {/* ── Bottom-center arrow (next section) ── */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-1 pointer-events-auto">
        {/* Label */}
        <AnimatePresence mode="wait">
          <motion.span
            key={current.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="text-white/40 text-[10px] uppercase tracking-widest font-medium select-none">
            {current.label}
          </motion.span>
        </AnimatePresence>

        {/* Down arrow */}
        <motion.button
          whileHover={{ scale: 1.15, y: 3 }}
          whileTap={{ scale: 0.9 }}
          animate={{ y: [0, 4, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          onClick={goDown}
          title="Switch section"
          className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all backdrop-blur-md
            bg-black/40 border-white/20 hover:bg-white/10 text-white/60 hover:text-white hover:${BORDER_COLORS[color]}`}>
          <ChevronDown className="w-5 h-5" />
        </motion.button>
      </div>
    </>
  );
}

export { SECTIONS };