import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ChevronDown, Home, Sparkles, Star } from 'lucide-react';

const SECTIONS = [
  { id: 'avatar',    label: 'AI Avatar Home',      icon: Home,     color: 'cyan' },
  { id: 'developer', label: 'Developer Spotlight', icon: Sparkles, color: 'purple' },
  { id: 'discover',  label: "What's New",          icon: Star,     color: 'amber' },
];

const DOT_COLORS = {
  cyan:   'bg-cyan-400',
  purple: 'bg-purple-400',
  amber:  'bg-amber-400',
};

const ARROW_BASE = "flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200 pointer-events-auto";
const ARROW_STYLE = {
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.18)',
  backdropFilter: 'blur(8px)',
};

export default function HomeSectionSwitcher({ currentSection, onSectionChange }) {
  const currentIdx = SECTIONS.findIndex(s => s.id === currentSection);

  const goLeft  = () => onSectionChange(SECTIONS[(currentIdx - 1 + SECTIONS.length) % SECTIONS.length].id);
  const goRight = () => onSectionChange(SECTIONS[(currentIdx + 1) % SECTIONS.length].id);
  const goDown  = () => onSectionChange(SECTIONS[(currentIdx + 1) % SECTIONS.length].id);

  const section = SECTIONS[currentIdx];

  return (
    <>
      {/* LEFT arrow — vertically centered, right next to the left sidebar rail */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={goLeft}
        title="Previous section"
        className={`${ARROW_BASE} absolute z-50 pointer-events-auto`}
        style={{ left: '52px', top: '50%', transform: 'translateY(-50%)', ...ARROW_STYLE }}
      >
        <ChevronLeft className="w-5 h-5 text-white/80" />
      </motion.button>

      {/* RIGHT arrow — vertically centered, at far right */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={goRight}
        title="Next section"
        className={`${ARROW_BASE} absolute z-50 pointer-events-auto`}
        style={{ right: '16px', top: '50%', transform: 'translateY(-50%)', ...ARROW_STYLE }}
      >
        <ChevronRight className="w-5 h-5 text-white/80" />
      </motion.button>

      {/* BOTTOM center — down arrow + dots + label, above the bottom nav */}
      <div
        className="absolute z-50 flex flex-col items-center gap-1.5 pointer-events-auto"
        style={{ bottom: '76px', left: '52px', right: '52px' }}
      >
        {/* Section label */}
        <AnimatePresence mode="wait">
          <motion.span
            key={currentSection}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="text-white/50 text-[10px] uppercase tracking-widest select-none font-medium"
          >
            {section?.label}
          </motion.span>
        </AnimatePresence>

        {/* Dots */}
        <div className="flex items-center gap-2">
          {SECTIONS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => onSectionChange(s.id)}
              title={s.label}
              className={`rounded-full transition-all duration-300 ${
                i === currentIdx
                  ? `w-2.5 h-2.5 ${DOT_COLORS[s.color]} shadow-lg`
                  : 'w-1.5 h-1.5 bg-white/25 hover:bg-white/50'
              }`}
            />
          ))}
        </div>

        {/* Down arrow button */}
        <motion.button
          whileHover={{ scale: 1.15, y: 2 }}
          whileTap={{ scale: 0.9 }}
          onClick={goDown}
          title="Next section"
          className={`${ARROW_BASE} mt-0.5`}
          style={ARROW_STYLE}
        >
          <ChevronDown className="w-5 h-5 text-white/80" />
        </motion.button>
      </div>
    </>
  );
}

export { SECTIONS };