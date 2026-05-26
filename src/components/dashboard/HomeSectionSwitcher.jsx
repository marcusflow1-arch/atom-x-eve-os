import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Home, Sparkles, Star } from 'lucide-react';

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

export default function HomeSectionSwitcher({ currentSection, onSectionChange }) {
  const currentIdx = SECTIONS.findIndex(s => s.id === currentSection);

  const goLeft  = () => onSectionChange(SECTIONS[(currentIdx - 1 + SECTIONS.length) % SECTIONS.length].id);
  const goRight = () => onSectionChange(SECTIONS[(currentIdx + 1) % SECTIONS.length].id);

  return (
    /* Strip sits at the very bottom of the right-side content area, above the bottom nav */
    <div
      className="absolute z-50 flex items-center justify-between pointer-events-auto"
      style={{ left: '360px', right: '16px', bottom: '72px', height: '32px' }}>

      {/* Left arrow — bare icon, far left of the strip */}
      <motion.button
        whileHover={{ x: -2, opacity: 1 }}
        whileTap={{ scale: 0.85 }}
        onClick={goLeft}
        title="Previous section"
        className="text-white/30 hover:text-white/80 transition-colors">
        <ChevronLeft className="w-5 h-5" />
      </motion.button>

      {/* Section dots + label centered */}
      <div className="flex flex-col items-center gap-1">
        <AnimatePresence mode="wait">
          <motion.span
            key={currentSection}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="text-white/30 text-[9px] uppercase tracking-widest select-none">
            {SECTIONS[currentIdx]?.label}
          </motion.span>
        </AnimatePresence>
        <div className="flex items-center gap-1.5">
          {SECTIONS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => onSectionChange(s.id)}
              title={s.label}
              className={`rounded-full transition-all duration-300 ${
                i === currentIdx
                  ? `w-2 h-2 ${DOT_COLORS[s.color]}`
                  : 'w-1.5 h-1.5 bg-white/20 hover:bg-white/40'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Right arrow — bare icon, far right of the strip */}
      <motion.button
        whileHover={{ x: 2, opacity: 1 }}
        whileTap={{ scale: 0.85 }}
        onClick={goRight}
        title="Next section"
        className="text-white/30 hover:text-white/80 transition-colors">
        <ChevronRight className="w-5 h-5" />
      </motion.button>
    </div>
  );
}

export { SECTIONS };