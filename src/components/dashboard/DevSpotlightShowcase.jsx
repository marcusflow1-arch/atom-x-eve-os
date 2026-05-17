import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, ChevronRight, ChevronLeft, Star, Flame, Calendar, Award,
  Rocket, Cpu, Globe, Zap, Swords, Users, Film, Trophy
} from 'lucide-react';

/**
 * Atom X Eve — Developer Spotlight Showcase
 * Premium PS5/Xbox-inspired cinematic carousel.
 * Fills the empty space below the Environment Hub.
 */

const SPOTLIGHT_CONTENT = [
  {
    id: 'fusion-v3',
    category: 'Fusion System',
    icon: Zap,
    accent: '#22d3ee',
    accentSecondary: '#a855f7',
    title: 'Deity Fusion v3 — Ascendance',
    subtitle: 'Multi-companion bonding & form evolution',
    description: 'Bond with multiple companions simultaneously, unlock evolving fusion forms, and channel raw cosmic energy through your avatar. Each fusion now carries unique combat trees and signature abilities.',
    tags: ['Combat', 'Companions', 'New Forms'],
    cta: 'Preview Fusion',
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=900&h=600&fit=crop',
    badge: 'Coming Soon'
  },
  {
    id: 'avatar-upgrade',
    category: 'AI Avatar',
    icon: Cpu,
    accent: '#a855f7',
    accentSecondary: '#ec4899',
    title: 'Sentient Avatar 2.0',
    subtitle: 'Personality engine + adaptive learning',
    description: 'Your avatar now remembers, reacts, and evolves with you. Real-time mood synthesis, dynamic dialogue trees, and contextual decision-making powered by a next-gen behavior core.',
    tags: ['AI', 'Personality', 'Adaptive'],
    cta: 'Meet Your Avatar',
    image: 'https://images.unsplash.com/photo-1535378917042-10a22c95931a?w=900&h=600&fit=crop',
    badge: 'Featured'
  },
  {
    id: 'world-nexus',
    category: 'Upcoming World',
    icon: Globe,
    accent: '#22c55e',
    accentSecondary: '#22d3ee',
    title: 'The Nexus — Volcanic Realm',
    subtitle: 'A living open-world battlefield',
    description: 'Step into a volcanic realm sculpted by player choices. Dynamic weather, evolving boss territories, and biome-wide events transform every visit into a new adventure.',
    tags: ['Open World', 'Boss Raids', 'Dynamic'],
    cta: 'Explore World',
    image: 'https://images.unsplash.com/photo-1465056836041-7f43ac27dcb5?w=900&h=600&fit=crop',
    badge: 'Q3 2026'
  },
  {
    id: 'card-system',
    category: 'Card System',
    icon: Trophy,
    accent: '#fbbf24',
    accentSecondary: '#f97316',
    title: 'Legendary Card Forge',
    subtitle: 'Craft, fuse, ascend',
    description: 'A brand-new crafting forge lets you fuse duplicate cards, ascend rarity tiers, and unlock signature abilities. Build your legacy through the new mastery progression system.',
    tags: ['Cards', 'Crafting', 'Mastery'],
    cta: 'Open Forge',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=900&h=600&fit=crop',
    badge: 'New Release'
  },
  {
    id: 'boss-raids',
    category: 'Boss Raid',
    icon: Swords,
    accent: '#ef4444',
    accentSecondary: '#f97316',
    title: 'Worldborn Titans',
    subtitle: '24-player synchronized raids',
    description: 'Coordinate with 23 other warriors across multiple zones to defeat colossal Titans. Each phase introduces new mechanics, environmental hazards, and legendary loot tables.',
    tags: ['Raid', '24-Player', 'Co-op'],
    cta: 'Join Raid',
    image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=900&h=600&fit=crop',
    badge: 'Event Active'
  },
  {
    id: 'community',
    category: 'Community',
    icon: Users,
    accent: '#3b82f6',
    accentSecondary: '#a855f7',
    title: 'Creator Studio Launch',
    subtitle: 'Build, share, monetize',
    description: 'Design your own quests, environments, and game modes with a no-code studio. Publish creations to the community marketplace and earn from your imagination.',
    tags: ['Creator', 'Studio', 'Marketplace'],
    cta: 'Start Creating',
    image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=900&h=600&fit=crop',
    badge: 'Beta'
  }
];

export default function DevSpotlightShowcase({ onOpenOverlay }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [autoPlay, setAutoPlay] = useState(true);
  const containerRef = useRef(null);

  const active = SPOTLIGHT_CONTENT[activeIndex];
  const total = SPOTLIGHT_CONTENT.length;
  const ActiveIcon = active.icon;

  const goNext = () => {
    setDirection(1);
    setActiveIndex((i) => (i + 1) % total);
  };

  const goPrev = () => {
    setDirection(-1);
    setActiveIndex((i) => (i - 1 + total) % total);
  };

  const goTo = (i) => {
    setDirection(i > activeIndex ? 1 : -1);
    setActiveIndex(i);
  };

  // Auto-play
  useEffect(() => {
    if (!autoPlay) return;
    const t = setInterval(goNext, 7000);
    return () => clearInterval(t);
  }, [autoPlay, activeIndex]);

  // Keyboard navigation (A / D + arrows)
  useEffect(() => {
    const handleKey = (e) => {
      const tag = (e.target?.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;
      const k = (e.key || '').toLowerCase();
      if (k === 'a' || k === 'arrowleft') {
        if (containerRef.current && document.activeElement &&
            !containerRef.current.contains(document.activeElement) &&
            document.activeElement !== document.body) return;
        setAutoPlay(false);
        goPrev();
      }
      if (k === 'd' || k === 'arrowright') {
        if (containerRef.current && document.activeElement &&
            !containerRef.current.contains(document.activeElement) &&
            document.activeElement !== document.body) return;
        setAutoPlay(false);
        goNext();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height
    });
  };

  const handleWheel = (e) => {
    if (Math.abs(e.deltaY) < 20) return;
    setAutoPlay(false);
    if (e.deltaY > 0) goNext(); else goPrev();
  };

  // Card slide variants
  const slideVariants = {
    enter: (dir) => ({ opacity: 0, x: dir * 60, filter: 'blur(12px)', scale: 0.96 }),
    center: { opacity: 1, x: 0, filter: 'blur(0px)', scale: 1 },
    exit: (dir) => ({ opacity: 0, x: dir * -60, filter: 'blur(12px)', scale: 0.96 })
  };

  return (
    <div
      ref={containerRef}
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

      {/* Animated ambient hero blur background */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active.id + '-ambient'}
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 0.38, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url(${active.image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(40px) saturate(150%)'
          }}
        />
      </AnimatePresence>

      {/* Neon accent gradient overlay (changes with active) */}
      <motion.div
        key={active.id + '-tint'}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 70% 80% at 20% 50%, ${active.accent}22 0%, transparent 60%),
                       radial-gradient(ellipse 60% 70% at 85% 30%, ${active.accentSecondary}22 0%, transparent 65%),
                       linear-gradient(180deg, rgba(6,10,18,0.35) 0%, rgba(6,10,18,0.85) 100%)`
        }}
      />

      {/* Mouse-following holographic shine */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-500"
        style={{
          opacity: 0.6,
          background: `radial-gradient(ellipse 50% 40% at ${mousePos.x * 100}% ${mousePos.y * 100}%, ${active.accent}1A 0%, transparent 60%)`
        }}
      />

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(14)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 2 + (i % 3),
              height: 2 + (i % 3),
              left: `${(i * 37) % 100}%`,
              top: `${(i * 53) % 100}%`,
              background: i % 2 ? active.accent : active.accentSecondary,
              boxShadow: `0 0 8px ${active.accent}`
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.2, 0.8, 0.2]
            }}
            transition={{
              duration: 4 + (i % 4),
              repeat: Infinity,
              delay: i * 0.3,
              ease: 'easeInOut'
            }}
          />
        ))}
      </div>

      {/* Grid overlay (subtle sci-fi texture) */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />

      {/* ─── CONTENT ─── */}
      <div className="relative z-10 w-full h-full flex flex-col p-5">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            <motion.div
              key={active.id + '-icon'}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="w-10 h-10 rounded-xl flex items-center justify-center relative"
              style={{
                background: `linear-gradient(135deg, ${active.accent}30, ${active.accentSecondary}30)`,
                border: `1px solid ${active.accent}55`,
                boxShadow: `0 0 20px ${active.accent}44`
              }}>
              <Sparkles className="w-4 h-4" style={{ color: active.accent }} />
              {/* Pulsing ring */}
              <motion.div
                className="absolute inset-0 rounded-xl"
                style={{ border: `1px solid ${active.accent}` }}
                animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 2.5, repeat: Infinity }}
              />
            </motion.div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.35em]" style={{ color: active.accent }}>
                Developer Spotlight
              </p>
              <h2 className="text-white text-lg font-bold tracking-wide drop-shadow-lg leading-tight">
                Atom × Eve Evolving Universe
              </h2>
            </div>
          </div>

          {/* Pager controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); setAutoPlay(false); goPrev(); }}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center transition-all hover:scale-110"
              title="Previous (A)">
              <ChevronLeft className="w-4 h-4 text-white/80" />
            </button>

            <div className="flex items-center gap-1.5 px-2">
              {SPOTLIGHT_CONTENT.map((s, i) => (
                <button
                  key={s.id}
                  onClick={(e) => { e.stopPropagation(); setAutoPlay(false); goTo(i); }}
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: i === activeIndex ? '26px' : '6px',
                    background: i === activeIndex
                      ? `linear-gradient(90deg, ${active.accent}, ${active.accentSecondary})`
                      : 'rgba(255,255,255,0.18)',
                    boxShadow: i === activeIndex ? `0 0 8px ${active.accent}` : 'none'
                  }}
                />
              ))}
            </div>

            <button
              onClick={(e) => { e.stopPropagation(); setAutoPlay(false); goNext(); }}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center transition-all hover:scale-110"
              title="Next (D)">
              <ChevronRight className="w-4 h-4 text-white/80" />
            </button>

            <div className="ml-2 hidden md:flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider"
                 style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white">A</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white">D</kbd>
            </div>
          </div>
        </div>

        {/* MAIN BODY — Left info / Right visual + carousel queue */}
        <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">

          {/* LEFT — Info Panel */}
          <div className="col-span-5 flex flex-col min-h-0">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={active.id + '-info'}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="flex-1 flex flex-col rounded-2xl p-4 min-h-0"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${active.accent}33`,
                  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 28px ${active.accent}15`
                }}>

                {/* Category + badge */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, ${active.accent}40, ${active.accentSecondary}40)`,
                        border: `1px solid ${active.accent}66`
                      }}>
                      <ActiveIcon className="w-3.5 h-3.5" style={{ color: active.accent }} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: active.accent }}>
                      {active.category}
                    </span>
                  </div>
                  <div
                    className="px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-1"
                    style={{
                      background: `${active.accent}22`,
                      color: active.accent,
                      border: `1px solid ${active.accent}55`
                    }}>
                    <Flame className="w-2.5 h-2.5" />
                    {active.badge}
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-white font-black text-2xl leading-tight mb-1 drop-shadow-lg">
                  {active.title}
                </h3>
                <p className="text-white/60 text-xs font-medium mb-3 italic">
                  {active.subtitle}
                </p>

                {/* Description */}
                <p className="text-white/70 text-xs leading-relaxed mb-3 line-clamp-4">
                  {active.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {active.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.10)',
                        color: 'rgba(255,255,255,0.75)'
                      }}>
                      {tag}
                    </span>
                  ))}
                </div>

                {/* CTA buttons */}
                <div className="mt-auto flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); onOpenOverlay?.(); }}
                    className="px-4 py-2.5 rounded-lg text-white text-xs font-bold flex items-center gap-2 transition-all hover:scale-105 relative overflow-hidden group"
                    style={{
                      background: `linear-gradient(135deg, ${active.accent} 0%, ${active.accentSecondary} 100%)`,
                      boxShadow: `0 4px 20px ${active.accent}55`
                    }}>
                    <span className="relative z-10">{active.cta}</span>
                    <ChevronRight className="w-3.5 h-3.5 relative z-10" />
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{
                        background: `linear-gradient(135deg, ${active.accentSecondary} 0%, ${active.accent} 100%)`
                      }}
                    />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onOpenOverlay?.(); }}
                    className="px-4 py-2.5 rounded-lg text-white/80 text-xs font-semibold transition-all hover:bg-white/10"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.12)'
                    }}>
                    Learn More
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* RIGHT — Hero Visual + Layered Queue */}
          <div className="col-span-7 flex flex-col gap-3 min-h-0">

            {/* HERO Visual */}
            <div className="relative flex-1 min-h-0" style={{ perspective: 1400 }}>
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={active.id + '-hero'}
                  custom={direction}
                  initial={{ opacity: 0, x: direction * 80, rotateY: direction * 8, filter: 'blur(16px)' }}
                  animate={{ opacity: 1, x: 0, rotateY: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, x: direction * -80, rotateY: direction * -8, filter: 'blur(16px)' }}
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0 rounded-2xl overflow-hidden"
                  style={{
                    border: `1px solid ${active.accent}55`,
                    boxShadow: `0 12px 40px ${active.accent}33, inset 0 1px 0 rgba(255,255,255,0.08)`,
                    transformStyle: 'preserve-3d'
                  }}>
                  {/* Hero image */}
                  <img
                    src={active.image}
                    alt={active.title}
                    className="w-full h-full object-cover"
                  />

                  {/* Gradient overlays */}
                  <div className="absolute inset-0" style={{
                    background: `linear-gradient(180deg, transparent 0%, rgba(6,10,18,0.3) 50%, rgba(6,10,18,0.92) 100%)`
                  }} />

                  {/* Animated glowing edge */}
                  <motion.div
                    className="absolute inset-0 rounded-2xl pointer-events-none"
                    style={{
                      border: `1px solid ${active.accent}`,
                      boxShadow: `inset 0 0 30px ${active.accent}44`
                    }}
                    animate={{ opacity: [0.4, 0.85, 0.4] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  />

                  {/* Corner brackets — sci-fi HUD */}
                  {[
                    { top: 8, left: 8, borderTop: true, borderLeft: true },
                    { top: 8, right: 8, borderTop: true, borderRight: true },
                    { bottom: 8, left: 8, borderBottom: true, borderLeft: true },
                    { bottom: 8, right: 8, borderBottom: true, borderRight: true }
                  ].map((pos, i) => (
                    <div
                      key={i}
                      className="absolute w-4 h-4"
                      style={{
                        ...pos,
                        borderTopWidth: pos.borderTop ? 2 : 0,
                        borderLeftWidth: pos.borderLeft ? 2 : 0,
                        borderBottomWidth: pos.borderBottom ? 2 : 0,
                        borderRightWidth: pos.borderRight ? 2 : 0,
                        borderColor: active.accent,
                        borderStyle: 'solid'
                      }}
                    />
                  ))}

                  {/* Bottom info strip on hero */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[0.3em] mb-1" style={{ color: active.accent }}>
                        Now Featuring
                      </p>
                      <h4 className="text-white font-bold text-base leading-tight drop-shadow-2xl">
                        {active.title}
                      </h4>
                    </div>
                    <div
                      className="px-2.5 py-1 rounded-full flex items-center gap-1.5 text-[10px] font-bold backdrop-blur-md"
                      style={{
                        background: 'rgba(0,0,0,0.55)',
                        border: `1px solid ${active.accent}66`,
                        color: 'white'
                      }}>
                      <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: active.accent }} />
                      LIVE
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* LAYERED QUEUE — Hidden upcoming spotlight cards */}
            <div className="flex items-center gap-2 h-[78px] flex-shrink-0">
              <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/40 [writing-mode:vertical-rl] rotate-180 flex-shrink-0">
                Queue
              </span>
              <div className="flex-1 flex items-stretch gap-2 overflow-hidden">
                {SPOTLIGHT_CONTENT.map((s, i) => {
                  if (i === activeIndex) return null;
                  const offset = ((i - activeIndex + total) % total);
                  const Icon = s.icon;
                  return (
                    <motion.button
                      key={s.id}
                      layout
                      onClick={(e) => { e.stopPropagation(); setAutoPlay(false); goTo(i); }}
                      whileHover={{ y: -4, scale: 1.04 }}
                      className="relative flex-1 rounded-xl overflow-hidden cursor-pointer group"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.10)',
                        opacity: 1 - Math.min(offset * 0.12, 0.5),
                        filter: `blur(${Math.min(offset * 0.4, 1.2)}px)`,
                        boxShadow: `0 4px 16px rgba(0,0,0,0.4)`
                      }}>
                      {/* BG image */}
                      <img src={s.image} alt={s.title} className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-80 transition-opacity" />
                      <div className="absolute inset-0" style={{
                        background: `linear-gradient(135deg, ${s.accent}33 0%, rgba(6,10,18,0.85) 100%)`
                      }} />

                      {/* Content */}
                      <div className="relative z-10 h-full flex flex-col justify-between p-2">
                        <div className="flex items-center gap-1.5">
                          <div
                            className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                            style={{ background: `${s.accent}33`, border: `1px solid ${s.accent}66` }}>
                            <Icon className="w-2.5 h-2.5" style={{ color: s.accent }} />
                          </div>
                          <span className="text-[8px] font-bold uppercase tracking-wider truncate" style={{ color: s.accent }}>
                            {s.category}
                          </span>
                        </div>
                        <p className="text-white text-[10px] font-bold leading-tight line-clamp-2 drop-shadow-md">
                          {s.title}
                        </p>
                      </div>

                      {/* Hover glow */}
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                        style={{ boxShadow: `inset 0 0 20px ${s.accent}66, 0 0 16px ${s.accent}44` }}
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