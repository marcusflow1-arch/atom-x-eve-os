import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Home, Star } from 'lucide-react';

const SECTIONS = [
  { id: 'avatar',    label: 'AI Avatar Home',       icon: Home, color: 'cyan' },
  { id: 'developer', label: 'Developer Spotlight',  icon: Star, color: 'purple' },
  { id: 'discover',  label: "What's New",           icon: Star, color: 'amber' },
];

const DOT_COLORS = {
  cyan:   'bg-cyan-400',
  purple: 'bg-purple-400',
  amber:  'bg-amber-400',
  green:  'bg-green-400',
};

const ARROW_BASE = "flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200 pointer-events-auto";
const ARROW_STYLE = {
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.18)',
  backdropFilter: 'blur(8px)',
};

export default function HomeSectionSwitcher({ currentSection, onSectionChange }) {
  const currentIdx = SECTIONS.findIndex(s => s.id === currentSection);

  const goRight = () => onSectionChange(SECTIONS[(currentIdx + 1) % SECTIONS.length].id);

  const section = SECTIONS[currentIdx];

  return (
    <>
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
    </>
  );
}

export { SECTIONS };