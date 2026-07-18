import React, { useRef, useEffect, useState } from 'react';
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
  cyan: 'shadow-[0_0_20px_rgba(34,211,238,0.6)]',
  orange: 'shadow-[0_0_20px_rgba(251,146,60,0.6)]',
  purple: 'shadow-[0_0_20px_rgba(168,85,247,0.6)]',
  blue: 'shadow-[0_0_20px_rgba(96,165,250,0.6)]',
  red: 'shadow-[0_0_20px_rgba(248,113,113,0.6)]',
  green: 'shadow-[0_0_20px_rgba(74,222,128,0.6)]',
};

const ACCENT_BORDER = {
  cyan: 'border-cyan-400/40',
  orange: 'border-orange-400/40',
  purple: 'border-purple-400/40',
  blue: 'border-blue-400/40',
  red: 'border-red-400/40',
  green: 'border-green-400/40',
};

const ACCENT_TEXT = {
  cyan: 'text-cyan-400',
  orange: 'text-orange-400',
  purple: 'text-purple-400',
  blue: 'text-blue-400',
  red: 'text-red-400',
  green: 'text-green-400',
};

const ITEM_HEIGHT = 76;

export default function StudioScrollRail({ studios, activeIndex, onSelect }) {
  const containerRef = useRef(null);
  const [containerHeight, setContainerHeight] = useState(600);

  useEffect(() => {
    if (!containerRef.current) return;
    const update = () => {
      if (containerRef.current) setContainerHeight(containerRef.current.clientHeight);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Translate so the active item is centered
  const translateY = containerHeight / 2 - ITEM_HEIGHT / 2 - activeIndex * ITEM_HEIGHT;

  return (
    <div className="w-60 flex-shrink-0 h-full flex flex-col border-r border-white/[0.06]"
      style={{ background: 'rgba(8, 12, 18, 0.35)' }}
    >
      {/* Label */}
      <div className="px-4 pt-4 pb-2 flex-shrink-0">
        <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Studios A–Z</p>
        <p className="text-[9px] text-white/20 mt-0.5">{studios.length} total</p>
      </div>

      {/* Cross-scroll area */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden">
        {/* Center highlight band */}
        <div
          className="absolute left-2 right-2 pointer-events-none rounded-xl"
          style={{
            top: '50%',
            transform: 'translateY(-50%)',
            height: ITEM_HEIGHT,
            background: 'rgba(255,255,255,0.04)',
            borderTop: '1px solid rgba(255,255,255,0.10)',
            borderBottom: '1px solid rgba(255,255,255,0.10)',
          }}
        />

        {/* Top & bottom fade gradients */}
        <div className="absolute top-0 left-0 right-0 h-16 pointer-events-none z-10"
          style={{ background: 'linear-gradient(to bottom, rgba(8,12,18,0.95), transparent)' }} />
        <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none z-10"
          style={{ background: 'linear-gradient(to top, rgba(8,12,18,0.95), transparent)' }} />

        {/* Items */}
        <div
          className="absolute left-0 right-0"
          style={{
            transform: `translateY(${translateY}px)`,
            transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {studios.map((studio, idx) => {
            const distance = Math.abs(idx - activeIndex);
            const scale = Math.max(0.55, 1 - distance * 0.12);
            const opacity = Math.max(0.12, 1 - distance * 0.28);
            const isActive = idx === activeIndex;
            const dot = ACCENT_DOT[studio.accentColor] || ACCENT_DOT.cyan;
            const glow = ACCENT_GLOW[studio.accentColor] || ACCENT_GLOW.cyan;
            const border = ACCENT_BORDER[studio.accentColor] || ACCENT_BORDER.cyan;
            const accentText = ACCENT_TEXT[studio.accentColor] || ACCENT_TEXT.cyan;

            return (
              <button
                key={studio.id}
                onClick={() => onSelect(idx)}
                data-studio-item
                className="w-full flex items-center justify-center px-3"
                style={{ height: ITEM_HEIGHT }}
              >
                <div
                  className="flex items-center gap-3 w-full rounded-xl transition-all duration-300"
                  style={{
                    transform: `scale(${scale})`,
                    opacity,
                    padding: isActive ? '10px 14px' : '8px 12px',
                    background: isActive ? 'rgba(255,255,255,0.06)' : 'transparent',
                    border: isActive ? `1px solid rgba(255,255,255,0.12)` : '1px solid transparent',
                    boxShadow: isActive ? `0 0 20px rgba(255,255,255,0.04)` : 'none',
                  }}
                >
                  {/* Logo */}
                  <div
                    className={`rounded-lg overflow-hidden flex-shrink-0 border ${isActive ? border : 'border-white/5'}`}
                    style={{ width: isActive ? 40 : 32, height: isActive ? 40 : 32, transition: 'all 0.3s' }}
                  >
                    <img src={studio.logo} alt={studio.name} className="w-full h-full object-cover" />
                  </div>

                  {/* Name + tagline */}
                  <div className="flex-1 min-w-0 text-left">
                    <p
                      className={`font-bold truncate ${isActive ? 'text-white text-sm' : 'text-white/60 text-xs'}`}
                      style={{ transition: 'all 0.3s' }}
                    >
                      {studio.name}
                    </p>
                    <p className={`text-[9px] truncate ${isActive ? `${accentText}` : 'text-white/25'}`}>
                      {studio.tagline}
                    </p>
                  </div>

                  {/* Active glow dot */}
                  <div className="flex-shrink-0 flex items-center justify-center w-3">
                    {isActive && (
                      <motion.div
                        layoutId="studio-dot"
                        className={`w-2.5 h-2.5 rounded-full ${dot} ${glow}`}
                      />
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Nav hint */}
      <div className="flex-shrink-0 px-4 py-2 border-t border-white/[0.06]">
        <p className="text-[8px] text-white/20 text-center font-mono">W / S or Scroll to navigate</p>
      </div>
    </div>
  );
}