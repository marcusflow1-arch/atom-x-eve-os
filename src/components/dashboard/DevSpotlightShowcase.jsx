import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronRight, ChevronLeft, Star, Flame, Calendar, Award } from 'lucide-react';
import { DEV_SPOTLIGHT_DATA } from './devSpotlightData';

/**
 * PS5-style Developer Spotlight Showcase
 * Fills the entire space below the top row (lunar dashboard, environment, memories, friends, etc.)
 * Designed to be the centerpiece of the home dashboard.
 */
export default function DevSpotlightShowcase({ onOpenOverlay }) {
  const [activeDevIndex, setActiveDevIndex] = useState(0);
  const [activeGameIndex, setActiveGameIndex] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });

  const devs = DEV_SPOTLIGHT_DATA;
  const activeDev = devs[activeDevIndex];
  const activeGame = activeDev?.games?.[activeGameIndex];
  const featuredCards = activeGame?.cards || [];

  // Auto-rotate featured dev every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveDevIndex((i) => (i + 1) % devs.length);
      setActiveGameIndex(0);
    }, 8000);
    return () => clearInterval(interval);
  }, [devs.length]);

  const handleNext = () => {
    setActiveDevIndex((i) => (i + 1) % devs.length);
    setActiveGameIndex(0);
  };

  const handlePrev = () => {
    setActiveDevIndex((i) => (i - 1 + devs.length) % devs.length);
    setActiveGameIndex(0);
  };

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height
    });
  };

  const rarityGlow = {
    Legendary: '0 0 24px rgba(251, 191, 36, 0.45)',
    Epic: '0 0 24px rgba(168, 85, 247, 0.45)',
    Rare: '0 0 24px rgba(59, 130, 246, 0.45)',
    Common: '0 0 16px rgba(255, 255, 255, 0.15)'
  };

  const rarityBorder = {
    Legendary: 'rgba(251, 191, 36, 0.55)',
    Epic: 'rgba(168, 85, 247, 0.55)',
    Rare: 'rgba(59, 130, 246, 0.55)',
    Common: 'rgba(255, 255, 255, 0.20)'
  };

  return (
    <div
      className="w-full h-full relative rounded-3xl overflow-hidden cursor-pointer group"
      onMouseMove={handleMouseMove}
      onClick={onOpenOverlay}
      style={{
        background: 'linear-gradient(135deg, rgba(15, 20, 30, 0.85) 0%, rgba(10, 14, 22, 0.92) 50%, rgba(15, 20, 30, 0.85) 100%)',
        backdropFilter: 'blur(28px) saturate(160%)',
        WebkitBackdropFilter: 'blur(28px) saturate(160%)',
        border: '1px solid rgba(255, 255, 255, 0.10)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)'
      }}>

      {/* Animated background hero image */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeDev.id + '-bg'}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 0.35, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2 }}
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url(${activeGame?.cover})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(8px) saturate(140%)'
          }}
        />
      </AnimatePresence>

      {/* Dark gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(8,10,16,0.35) 0%, rgba(8,10,16,0.75) 60%, rgba(8,10,16,0.9) 100%)'
        }}
      />

      {/* Interactive shine */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-500"
        style={{
          opacity: 0.5,
          background: `radial-gradient(ellipse 60% 50% at ${mousePos.x * 100}% ${mousePos.y * 100}%, rgba(125, 211, 252, 0.10) 0%, transparent 60%)`
        }}
      />

      {/* CONTENT */}
      <div className="relative z-10 w-full h-full flex flex-col p-6">
        {/* HEADER ROW */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.25), rgba(168, 85, 247, 0.25))',
                border: '1px solid rgba(125, 211, 252, 0.3)'
              }}>
              <Sparkles className="w-4 h-4 text-cyan-300" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-300/80">Developer Spotlight</p>
              <h2 className="text-white text-xl font-bold tracking-wide drop-shadow-lg">Featured Studios & Drops</h2>
            </div>
          </div>

          {/* Dev pager dots */}
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); handlePrev(); }}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center transition-all">
              <ChevronLeft className="w-4 h-4 text-white/70" />
            </button>
            <div className="flex items-center gap-1.5 px-2">
              {devs.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setActiveDevIndex(i); setActiveGameIndex(0); }}
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: i === activeDevIndex ? '24px' : '6px',
                    background: i === activeDevIndex
                      ? 'linear-gradient(90deg, #22d3ee, #a855f7)'
                      : 'rgba(255,255,255,0.20)'
                  }}
                />
              ))}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center transition-all">
              <ChevronRight className="w-4 h-4 text-white/70" />
            </button>
          </div>
        </div>

        {/* MAIN CONTENT - 3 columns: Studio Info | Featured Game | Cards Grid */}
        <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
          {/* LEFT — Studio Profile */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeDev.id + '-studio'}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
              className="col-span-3 flex flex-col gap-3 rounded-2xl p-4"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(20px)'
              }}>
              {/* Studio logo + name */}
              <div className="flex items-center gap-3">
                <div
                  className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0"
                  style={{
                    border: '2px solid rgba(125, 211, 252, 0.4)',
                    boxShadow: '0 0 20px rgba(34, 211, 238, 0.25)'
                  }}>
                  <img src={activeDev.logo} alt={activeDev.name} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-cyan-300/70">Studio</p>
                  <h3 className="text-white font-bold text-sm leading-tight truncate">{activeDev.name}</h3>
                </div>
              </div>

              {/* Description */}
              <p className="text-white/60 text-xs leading-relaxed">{activeDev.description}</p>

              {/* Studio stats */}
              <div className="grid grid-cols-3 gap-2 mt-1">
                <div className="text-center rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-cyan-300 text-base font-bold">{activeDev.games.length}</p>
                  <p className="text-white/50 text-[9px] uppercase tracking-wider">Games</p>
                </div>
                <div className="text-center rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-purple-300 text-base font-bold">
                    {activeDev.games.reduce((sum, g) => sum + g.cards.length, 0)}
                  </p>
                  <p className="text-white/50 text-[9px] uppercase tracking-wider">Cards</p>
                </div>
                <div className="text-center rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-amber-300 text-base font-bold flex items-center justify-center gap-0.5">
                    <Star className="w-3 h-3 fill-amber-300" />4.8
                  </p>
                  <p className="text-white/50 text-[9px] uppercase tracking-wider">Rating</p>
                </div>
              </div>

              {/* Game tabs */}
              <div className="flex flex-col gap-1.5 mt-1">
                <p className="text-[9px] font-bold uppercase tracking-widest text-white/40">Releases</p>
                {activeDev.games.map((game, i) => (
                  <button
                    key={game.id}
                    onClick={(e) => { e.stopPropagation(); setActiveGameIndex(i); }}
                    className="flex items-center gap-2 rounded-lg p-1.5 transition-all text-left"
                    style={{
                      background: i === activeGameIndex ? 'rgba(34, 211, 238, 0.12)' : 'rgba(255,255,255,0.02)',
                      border: i === activeGameIndex ? '1px solid rgba(34, 211, 238, 0.35)' : '1px solid rgba(255,255,255,0.05)'
                    }}>
                    <div className="w-7 h-9 rounded overflow-hidden flex-shrink-0">
                      <img src={game.cover} alt={game.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-[11px] font-semibold truncate">{game.title}</p>
                      <p className="text-white/40 text-[9px]">{game.genre} · {game.year}</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* CENTER — Hero Game Showcase */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeGame?.id + '-hero'}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="col-span-5 relative rounded-2xl overflow-hidden flex flex-col justify-end"
              style={{
                border: '1px solid rgba(255,255,255,0.10)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
              }}>
              {/* Hero image */}
              <div className="absolute inset-0">
                <img src={activeGame?.cover} alt={activeGame?.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0" style={{
                  background: 'linear-gradient(180deg, transparent 0%, rgba(8,10,16,0.4) 50%, rgba(8,10,16,0.95) 100%)'
                }} />
              </div>

              {/* Badge top-left */}
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <div
                  className="px-2.5 py-1 rounded-full flex items-center gap-1.5"
                  style={{
                    background: 'rgba(239, 68, 68, 0.85)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 200, 200, 0.3)'
                  }}>
                  <Flame className="w-3 h-3 text-white" />
                  <span className="text-white text-[10px] font-bold uppercase tracking-wider">Now Featured</span>
                </div>
              </div>

              {/* Year badge top-right */}
              <div className="absolute top-3 right-3">
                <div
                  className="px-2.5 py-1 rounded-full flex items-center gap-1.5"
                  style={{
                    background: 'rgba(0,0,0,0.55)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.15)'
                  }}>
                  <Calendar className="w-3 h-3 text-white/80" />
                  <span className="text-white/90 text-[10px] font-bold">{activeGame?.year}</span>
                </div>
              </div>

              {/* Content overlay */}
              <div className="relative z-10 p-5">
                <p className="text-cyan-300 text-[10px] font-bold uppercase tracking-[0.3em] mb-1">{activeGame?.genre}</p>
                <h3 className="text-white font-black text-3xl leading-tight mb-2 drop-shadow-2xl">
                  {activeGame?.title}
                </h3>
                <p className="text-white/70 text-xs mb-3 line-clamp-2">
                  Step into a meticulously crafted universe with cutting-edge mechanics and breathtaking visual design.
                </p>

                {/* CTA buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); onOpenOverlay?.(); }}
                    className="px-4 py-2 rounded-lg text-white text-xs font-bold flex items-center gap-2 transition-all hover:scale-105"
                    style={{
                      background: 'linear-gradient(135deg, #22d3ee 0%, #a855f7 100%)',
                      boxShadow: '0 4px 16px rgba(34, 211, 238, 0.35)'
                    }}>
                    Explore Drops
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onOpenOverlay?.(); }}
                    className="px-4 py-2 rounded-lg text-white/80 text-xs font-semibold transition-all hover:bg-white/10"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.15)'
                    }}>
                    View Studio
                  </button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* RIGHT — Featured Cards Grid */}
          <div className="col-span-4 flex flex-col gap-2 min-h-0">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-300" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Featured Drops</p>
              </div>
              <span className="text-[10px] text-cyan-300 font-bold">{featuredCards.length} Cards</span>
            </div>

            <div className="flex-1 grid grid-cols-2 gap-2 min-h-0">
              <AnimatePresence mode="popLayout">
                {featuredCards.slice(0, 4).map((card, i) => (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    whileHover={{ y: -3, scale: 1.03 }}
                    onClick={(e) => { e.stopPropagation(); onOpenOverlay?.(); }}
                    className="relative rounded-xl overflow-hidden cursor-pointer flex flex-col"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: `1px solid ${rarityBorder[card.rarity] || rarityBorder.Common}`,
                      boxShadow: rarityGlow[card.rarity] || rarityGlow.Common
                    }}>
                    {/* Card image */}
                    <div className="relative flex-1 min-h-0 overflow-hidden">
                      <img src={card.image} alt={card.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0" style={{
                        background: 'linear-gradient(180deg, transparent 40%, rgba(8,10,16,0.95) 100%)'
                      }} />

                      {/* Icon emoji top-right */}
                      <div className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full flex items-center justify-center text-base" style={{
                        background: 'rgba(0,0,0,0.6)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255,255,255,0.15)'
                      }}>
                        {card.icon}
                      </div>

                      {/* Rarity badge bottom-left */}
                      <div
                        className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider"
                        style={{
                          background: 'rgba(0,0,0,0.7)',
                          color: rarityBorder[card.rarity] || 'rgba(255,255,255,0.7)',
                          border: `1px solid ${rarityBorder[card.rarity] || rarityBorder.Common}`
                        }}>
                        {card.rarity}
                      </div>
                    </div>

                    {/* Card name + price */}
                    <div className="p-2 flex items-center justify-between gap-1" style={{ background: 'rgba(8,10,16,0.6)' }}>
                      <p className="text-white text-[10px] font-bold truncate flex-1">{card.name}</p>
                      <p className="text-cyan-300 text-[9px] font-bold flex-shrink-0">{card.price}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}