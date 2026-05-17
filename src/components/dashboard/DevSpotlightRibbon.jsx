import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, ChevronLeft, ChevronRight, Flame, Calendar,
  Rocket, Trophy, Play, ChevronDown
} from 'lucide-react';
import { DEV_SPOTLIGHT_DATA } from './devSpotlightData';

/**
 * Console-style Developer Spotlight Ribbon
 * PS5 / Xbox Series X inspired showcase that fills the open dashboard space.
 *
 * Features:
 *  - 3 swipeable modes: Spotlight / New Releases / Upcoming
 *  - Cinematic hero card with ambient background
 *  - Layered slide-deck queue at the bottom (the "mystery" cards reveal real content)
 *  - Smooth slide transitions + keyboard nav (A / D / arrow keys)
 *  - Mouse-wheel paging
 */

const MODES = [
  { id: 'spotlight', label: 'Developer Spotlight', icon: Sparkles, accent: '#22d3ee' },
  { id: 'new', label: 'New Releases', icon: Flame, accent: '#f97316' },
  { id: 'upcoming', label: 'Upcoming', icon: Rocket, accent: '#a855f7' }
];

// Flatten all games across all developers for slideshow content
const flattenContent = () => {
  const items = [];
  DEV_SPOTLIGHT_DATA.forEach((dev) => {
    dev.games.forEach((game) => {
      items.push({
        id: `${dev.id}-${game.id}`,
        devName: dev.name,
        devLogo: dev.logo,
        devDescription: dev.description,
        title: game.title,
        genre: game.genre,
        year: game.year,
        cover: game.cover,
        cards: game.cards
      });
    });
  });
  return items;
};

const ALL_CONTENT = flattenContent();

// Bucket items per mode
const contentByMode = {
  spotlight: ALL_CONTENT,
  new: ALL_CONTENT.filter((g) => g.year <= 2025),
  upcoming: ALL_CONTENT.filter((g) => g.year >= 2026)
};

export default function DevSpotlightRibbon({ onOpenOverlay }) {
  const [modeIndex, setModeIndex] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [autoPlay, setAutoPlay] = useState(true);
  const rootRef = useRef(null);

  const mode = MODES[modeIndex];
  const items = contentByMode[mode.id] || ALL_CONTENT;
  const total = items.length;
  const active = items[activeIndex % total];

  // Ensure activeIndex stays valid when mode changes
  useEffect(() => {
    setActiveIndex(0);
    setDirection(1);
  }, [modeIndex]);

  const next = () => {
    setDirection(1);
    setActiveIndex((i) => (i + 1) % total);
  };
  const prev = () => {
    setDirection(-1);
    setActiveIndex((i) => (i - 1 + total) % total);
  };
  const goTo = (i) => {
    setDirection(i > activeIndex ? 1 : -1);
    setActiveIndex(i);
  };

  // Auto rotate
  useEffect(() => {
    if (!autoPlay) return;
    const t = setInterval(next, 6500);
    return () => clearInterval(t);
  }, [autoPlay, activeIndex, total]);

  // Keyboard nav
  useEffect(() => {
    const handle = (e) => {
      const tag = (e.target?.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;
      const k = (e.key || '').toLowerCase();
      if (k === 'a' || k === 'arrowleft') { setAutoPlay(false); prev(); }
      if (k === 'd' || k === 'arrowright') { setAutoPlay(false); next(); }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [total]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height
    });
  };

  const handleWheel = (e) => {
    if (Math.abs(e.deltaY) < 24) return;
    setAutoPlay(false);
    if (e.deltaY > 0) next(); else prev();
  };

  if (!active) return null;

  return (
    <div
      ref={rootRef}
      onMouseMove={handleMouseMove}
      onWheel={handleWheel}
      onMouseEnter={() => setAutoPlay(false)}
      onMouseLeave={() => setAutoPlay(true)}
      className="w-full h-full relative rounded-3xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(10, 15, 25, 0.92) 0%, rgba(6, 10, 18, 0.96) 50%, rgba(10, 15, 25, 0.92) 100%)',
        backdropFilter: 'blur(32px) saturate(180%)',
        WebkitBackdropFilter: 'blur(32px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)'
      }}>

      {/* Ambient blurred background from hero image */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active.id + '-ambient'}
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 0.4, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url(${active.cover})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(50px) saturate(160%)'
          }}
        />
      </AnimatePresence>

      {/* Accent gradient tint per mode */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 70% 80% at 15% 50%, ${mode.accent}26 0%, transparent 60%),
                       radial-gradient(ellipse 60% 70% at 85% 30%, ${mode.accent}1A 0%, transparent 65%),
                       linear-gradient(180deg, rgba(6,10,18,0.45) 0%, rgba(6,10,18,0.85) 100%)`
        }}
      />

      {/* Mouse-follow holographic shine */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-500"
        style={{
          opacity: 0.5,
          background: `radial-gradient(ellipse 50% 40% at ${mousePos.x * 100}% ${mousePos.y * 100}%, ${mode.accent}1F 0%, transparent 60%)`
        }}
      />

      {/* Subtle grid texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 2 + (i % 3),
              height: 2 + (i % 3),
              left: `${(i * 37) % 100}%`,
              top: `${(i * 53) % 100}%`,
              background: mode.accent,
              boxShadow: `0 0 8px ${mode.accent}`
            }}
            animate={{ y: [0, -18, 0], opacity: [0.15, 0.7, 0.15] }}
            transition={{ duration: 4 + (i % 4), repeat: Infinity, delay: i * 0.3, ease: 'easeInOut' }}
          />
        ))}
      </div>

      {/* ─── CONTENT ─── */}
      <div className="relative z-10 w-full h-full flex flex-col p-5">

        {/* HEADER: Mode tabs + pager */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          {/* Mode Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-full"
               style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {MODES.map((m, i) => {
              const Icon = m.icon;
              const isActive = i === modeIndex;
              return (
                <button
                  key={m.id}
                  onClick={(e) => { e.stopPropagation(); setModeIndex(i); setAutoPlay(false); }}
                  className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all"
                  style={{
                    background: isActive ? `linear-gradient(135deg, ${m.accent}33, ${m.accent}11)` : 'transparent',
                    border: isActive ? `1px solid ${m.accent}66` : '1px solid transparent',
                    boxShadow: isActive ? `0 0 12px ${m.accent}44` : 'none'
                  }}>
                  <Icon className="w-3 h-3" style={{ color: isActive ? m.accent : 'rgba(255,255,255,0.5)' }} />
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: isActive ? 'white' : 'rgba(255,255,255,0.55)' }}>
                    {m.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Pager */}
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); setAutoPlay(false); prev(); }}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center transition-all hover:scale-110"
              title="Previous (A)">
              <ChevronLeft className="w-4 h-4 text-white/80" />
            </button>

            <div className="flex items-center gap-1.5 px-2">
              {items.map((it, i) => (
                <button
                  key={it.id}
                  onClick={(e) => { e.stopPropagation(); setAutoPlay(false); goTo(i); }}
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: i === activeIndex ? '24px' : '6px',
                    background: i === activeIndex
                      ? `linear-gradient(90deg, ${mode.accent}, ${mode.accent}99)`
                      : 'rgba(255,255,255,0.18)',
                    boxShadow: i === activeIndex ? `0 0 8px ${mode.accent}` : 'none'
                  }}
                />
              ))}
            </div>

            <button
              onClick={(e) => { e.stopPropagation(); setAutoPlay(false); next(); }}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center transition-all hover:scale-110"
              title="Next (D)">
              <ChevronRight className="w-4 h-4 text-white/80" />
            </button>

            <div className="ml-2 hidden lg:flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider"
                 style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white">A</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white">D</kbd>
            </div>
          </div>
        </div>

        {/* BODY: Left info | Right hero */}
        <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">

          {/* LEFT — Info Panel */}
          <div className="col-span-5 flex flex-col min-h-0">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={active.id + '-info'}
                custom={direction}
                initial={{ opacity: 0, x: direction * 40, filter: 'blur(8px)' }}
                animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, x: direction * -40, filter: 'blur(8px)' }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                className="flex-1 flex flex-col rounded-2xl p-4 min-h-0"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${mode.accent}33`,
                  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 28px ${mode.accent}15`
                }}>

                {/* Studio header */}
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0"
                    style={{ border: `1px solid ${mode.accent}66`, boxShadow: `0 0 14px ${mode.accent}33` }}>
                    <img src={active.devLogo} alt={active.devName} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-bold uppercase tracking-[0.25em]" style={{ color: mode.accent }}>
                      {mode.label}
                    </p>
                    <p className="text-white/90 text-xs font-semibold truncate">{active.devName}</p>
                  </div>
                  <div
                    className="px-2 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-1 flex-shrink-0"
                    style={{
                      background: `${mode.accent}22`,
                      color: mode.accent,
                      border: `1px solid ${mode.accent}55`
                    }}>
                    <Calendar className="w-2.5 h-2.5" />
                    {active.year}
                  </div>
                </div>

                {/* Title + genre */}
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] mb-1" style={{ color: mode.accent }}>
                  {active.genre}
                </p>
                <h3 className="text-white font-black text-2xl leading-tight mb-2 drop-shadow-lg">
                  {active.title}
                </h3>
                <p className="text-white/65 text-xs leading-relaxed mb-3 line-clamp-3">
                  {active.devDescription}
                </p>

                {/* Card badges row */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.8)' }}>
                    <Trophy className="w-2.5 h-2.5 inline mr-1 -mt-0.5" />
                    {active.cards?.length || 0} Cards
                  </span>
                  {active.cards?.slice(0, 2).map((c) => (
                    <span key={c.id} className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider"
                          style={{
                            background: c.rarity === 'Legendary' ? 'rgba(251, 191, 36, 0.18)' :
                                        c.rarity === 'Epic' ? 'rgba(168, 85, 247, 0.18)' :
                                        'rgba(59, 130, 246, 0.18)',
                            color: c.rarity === 'Legendary' ? '#fbbf24' :
                                   c.rarity === 'Epic' ? '#c084fc' :
                                   '#60a5fa',
                            border: `1px solid ${c.rarity === 'Legendary' ? 'rgba(251,191,36,0.45)' :
                                                  c.rarity === 'Epic' ? 'rgba(168,85,247,0.45)' :
                                                  'rgba(59,130,246,0.45)'}`
                          }}>
                      {c.rarity}
                    </span>
                  ))}
                </div>

                {/* CTAs */}
                <div className="mt-auto flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); onOpenOverlay?.(); }}
                    className="px-4 py-2.5 rounded-lg text-white text-xs font-bold flex items-center gap-2 transition-all hover:scale-105 relative overflow-hidden"
                    style={{
                      background: `linear-gradient(135deg, ${mode.accent} 0%, ${mode.accent}aa 100%)`,
                      boxShadow: `0 4px 20px ${mode.accent}55`
                    }}>
                    <Play className="w-3.5 h-3.5 fill-white" />
                    Explore
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onOpenOverlay?.(); }}
                    className="px-4 py-2.5 rounded-lg text-white/85 text-xs font-semibold transition-all hover:bg-white/10"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.12)'
                    }}>
                    View Studio
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* RIGHT — Hero Visual + Deck */}
          <div className="col-span-7 flex flex-col gap-3 min-h-0">

            {/* HERO Visual */}
            <div className="relative flex-1 min-h-0" style={{ perspective: 1400 }}>
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={active.id + '-hero'}
                  custom={direction}
                  initial={{ opacity: 0, x: direction * 80, rotateY: direction * 6, filter: 'blur(12px)' }}
                  animate={{ opacity: 1, x: 0, rotateY: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, x: direction * -80, rotateY: direction * -6, filter: 'blur(12px)' }}
                  transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0 rounded-2xl overflow-hidden cursor-pointer"
                  onClick={() => onOpenOverlay?.()}
                  style={{
                    border: `1px solid ${mode.accent}55`,
                    boxShadow: `0 12px 40px ${mode.accent}33, inset 0 1px 0 rgba(255,255,255,0.08)`,
                    transformStyle: 'preserve-3d'
                  }}>
                  <img src={active.cover} alt={active.title} className="w-full h-full object-cover" />

                  {/* Gradient overlay */}
                  <div className="absolute inset-0" style={{
                    background: `linear-gradient(180deg, transparent 0%, rgba(6,10,18,0.3) 55%, rgba(6,10,18,0.95) 100%)`
                  }} />

                  {/* Glowing border pulse */}
                  <motion.div
                    className="absolute inset-0 rounded-2xl pointer-events-none"
                    style={{ border: `1px solid ${mode.accent}`, boxShadow: `inset 0 0 30px ${mode.accent}33` }}
                    animate={{ opacity: [0.35, 0.8, 0.35] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  />

                  {/* HUD corner brackets */}
                  {[
                    { top: 8, left: 8, borderTop: true, borderLeft: true },
                    { top: 8, right: 8, borderTop: true, borderRight: true },
                    { bottom: 8, left: 8, borderBottom: true, borderLeft: true },
                    { bottom: 8, right: 8, borderBottom: true, borderRight: true }
                  ].map((pos, i) => (
                    <div
                      key={i}
                      className="absolute w-4 h-4 pointer-events-none"
                      style={{
                        ...pos,
                        borderTopWidth: pos.borderTop ? 2 : 0,
                        borderLeftWidth: pos.borderLeft ? 2 : 0,
                        borderBottomWidth: pos.borderBottom ? 2 : 0,
                        borderRightWidth: pos.borderRight ? 2 : 0,
                        borderColor: mode.accent,
                        borderStyle: 'solid'
                      }}
                    />
                  ))}

                  {/* Bottom info strip */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between pointer-events-none">
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] font-bold uppercase tracking-[0.3em] mb-1" style={{ color: mode.accent }}>
                        Now Featuring
                      </p>
                      <h4 className="text-white font-bold text-base leading-tight truncate drop-shadow-2xl">
                        {active.title}
                      </h4>
                    </div>
                    <div
                      className="px-2.5 py-1 rounded-full flex items-center gap-1.5 text-[10px] font-bold backdrop-blur-md flex-shrink-0"
                      style={{
                        background: 'rgba(0,0,0,0.55)',
                        border: `1px solid ${mode.accent}66`,
                        color: 'white'
                      }}>
                      <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: mode.accent }} />
                      LIVE
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* DECK — upcoming/queued cards (replaces mystery boxes) */}
            <div className="flex items-stretch gap-2 h-[78px] flex-shrink-0">
              <div className="flex items-center justify-center px-2">
                <ChevronDown className="w-3 h-3 text-white/30 rotate-[-90deg]" />
              </div>
              <div className="flex-1 flex items-stretch gap-2 overflow-hidden">
                {items.map((it, i) => {
                  if (i === activeIndex) return null;
                  const offset = ((i - activeIndex + total) % total);
                  return (
                    <motion.button
                      key={it.id}
                      layout
                      onClick={(e) => { e.stopPropagation(); setAutoPlay(false); goTo(i); }}
                      whileHover={{ y: -4, scale: 1.04 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      className="relative flex-1 rounded-xl overflow-hidden cursor-pointer group min-w-0"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.10)',
                        opacity: 1 - Math.min(offset * 0.12, 0.55),
                        filter: `blur(${Math.min(offset * 0.4, 1.2)}px)`,
                        boxShadow: '0 4px 16px rgba(0,0,0,0.4)'
                      }}>
                      <img src={it.cover} alt={it.title} className="absolute inset-0 w-full h-full object-cover opacity-55 group-hover:opacity-90 transition-opacity" />
                      <div className="absolute inset-0" style={{
                        background: `linear-gradient(135deg, ${mode.accent}22 0%, rgba(6,10,18,0.85) 100%)`
                      }} />
                      <div className="relative z-10 h-full flex flex-col justify-between p-2">
                        <span className="text-[8px] font-bold uppercase tracking-wider truncate" style={{ color: mode.accent }}>
                          {it.genre}
                        </span>
                        <p className="text-white text-[10px] font-bold leading-tight line-clamp-2 drop-shadow-md">
                          {it.title}
                        </p>
                      </div>
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                        style={{ boxShadow: `inset 0 0 20px ${mode.accent}66, 0 0 16px ${mode.accent}44` }}
                      />
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}