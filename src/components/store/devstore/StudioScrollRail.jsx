import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

const ACCENT_DOT = {
  cyan: 'bg-cyan-400',
  orange: 'bg-orange-400',
  purple: 'bg-purple-400',
  blue: 'bg-blue-400',
  red: 'bg-red-400',
  green: 'bg-green-400',
};

const ACCENT_GLOW = {
  cyan: 'shadow-[0_0_12px_rgba(34,211,238,0.5)]',
  orange: 'shadow-[0_0_12px_rgba(251,146,60,0.5)]',
  purple: 'shadow-[0_0_12px_rgba(168,85,247,0.5)]',
  blue: 'shadow-[0_0_12px_rgba(96,165,250,0.5)]',
  red: 'shadow-[0_0_12px_rgba(248,113,113,0.5)]',
  green: 'shadow-[0_0_12px_rgba(74,222,128,0.5)]',
};

export default function StudioScrollRail({ studios, activeIndex, onSelect }) {
  const listRef = useRef(null);
  const itemRefs = useRef([]);

  // Scroll the active item into view within the rail
  useEffect(() => {
    const el = itemRefs.current[activeIndex];
    if (el && listRef.current) {
      const container = listRef.current;
      const containerRect = container.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const offset = elRect.top - containerRect.top;
      const target = container.scrollTop + offset - containerRect.height / 2 + elRect.height / 2;
      container.scrollTo({ top: target, behavior: 'smooth' });
    }
  }, [activeIndex]);

  return (
    <div className="w-48 sm:w-52 flex-shrink-0 h-full flex flex-col border-r border-white/[0.06]"
      style={{ background: 'rgba(8, 12, 18, 0.35)' }}
    >
      {/* Label */}
      <div className="px-4 pt-4 pb-2 flex-shrink-0">
        <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Studios A–Z</p>
        <p className="text-[9px] text-white/20 mt-0.5">{studios.length} total</p>
      </div>

      {/* Scrollable studio list */}
      <div ref={listRef} className="flex-1 overflow-y-auto scrollbar-hide px-2 pb-4 space-y-1">
        {studios.map((studio, idx) => {
          const isActive = idx === activeIndex;
          const dot = ACCENT_DOT[studio.accentColor] || ACCENT_DOT.cyan;
          const glow = ACCENT_GLOW[studio.accentColor] || ACCENT_GLOW.cyan;

          return (
            <button
              key={studio.id}
              ref={(el) => (itemRefs.current[idx] = el)}
              onClick={() => onSelect(idx)}
              data-studio-item
              className={`w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                isActive
                  ? 'bg-white/[0.08] border border-white/10'
                  : 'border border-transparent hover:bg-white/[0.03]'
              }`}
            >
              {/* Logo */}
              <div className={`w-7 h-7 rounded-lg overflow-hidden flex-shrink-0 border ${isActive ? 'border-white/20' : 'border-white/5'}`}>
                <img src={studio.logo} alt={studio.name} className="w-full h-full object-cover" />
              </div>

              {/* Name + dot indicator */}
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-bold truncate ${isActive ? 'text-white' : 'text-white/50 group-hover:text-white/70'}`}>
                  {studio.name}
                </p>
                <p className="text-[9px] text-white/25 truncate">{studio.tagline}</p>
              </div>

              {/* Active indicator */}
              <div className="flex-shrink-0 flex items-center justify-center w-2">
                {isActive && (
                  <motion.div
                    layoutId="studio-dot"
                    className={`w-2 h-2 rounded-full ${dot} ${glow}`}
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}