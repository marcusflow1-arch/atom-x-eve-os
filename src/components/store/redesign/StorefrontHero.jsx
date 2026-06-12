// StorefrontHero.jsx — Featured game cinematic hero banner (dynamic on card hover)
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Star, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import { HERO_GAME } from './storefrontData';

export default function StorefrontHero({ game, onPlay }) {
  // When a card is hovered, `game` is supplied — otherwise show the featured default
  const active = game
    ? {
        id: game.id,
        title: (game.title || '').toUpperCase(),
        subtitle: game.sub ? game.sub.toUpperCase() : '',
        tagline: 'NOW FEATURED',
        description: game.description || 'Dive into this title and shape your legacy across the galaxy.',
        tags: game.tags || HERO_GAME.tags,
        rating: game.rating || HERO_GAME.rating,
        reviews: game.reviews || HERO_GAME.reviews,
        cover_image: game.cover_image || game.image || HERO_GAME.cover_image,
      }
    : HERO_GAME;

  return (
    <div
      className="relative rounded-2xl overflow-hidden h-full min-h-[360px] border border-white/10"
      style={{ boxShadow: '0 20px 60px -15px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)' }}
    >
      {/* Cross-fading cover image */}
      <AnimatePresence mode="popLayout">
        <motion.img
          key={active.id}
          src={active.cover_image}
          alt={active.title}
          initial={{ opacity: 0, scale: 1.06 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </AnimatePresence>
      <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(6,9,18,0.97) 0%, rgba(6,9,18,0.7) 45%, rgba(6,9,18,0.05) 100%)' }} />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 55%, rgba(6,9,18,0.85) 100%)' }} />

      <AnimatePresence mode="wait">
        <motion.div
          key={active.id}
          initial={{ opacity: 0, x: -14 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="relative z-10 h-full flex flex-col justify-center px-10 py-7 max-w-[62%]"
        >
          <span className="inline-flex w-fit items-center gap-1.5 px-2.5 py-1 mb-3 rounded-md bg-purple-500/20 border border-purple-400/30 text-purple-200 text-[10px] font-bold uppercase tracking-widest">
            ⭐ {active.tagline}
          </span>
          <h1 className="text-6xl font-black text-white leading-none tracking-tight drop-shadow-[0_2px_20px_rgba(0,0,0,0.8)]">{active.title}</h1>
          {active.subtitle && <h2 className="text-2xl font-light text-white/80 tracking-[0.3em] mb-3">{active.subtitle}</h2>}
          <p className="text-white/60 text-sm max-w-md mb-4 leading-relaxed mt-2">{active.description}</p>

          <div className="flex flex-wrap gap-2 mb-3">
            {active.tags.map(t => (
              <span key={t} className="px-2.5 py-1 rounded-md bg-white/[0.06] border border-white/10 text-white/60 text-[10px] font-semibold uppercase tracking-wider backdrop-blur-sm">{t}</span>
            ))}
          </div>

          <div className="flex items-center gap-4 text-xs mb-5">
            <div className="flex items-center gap-1 text-yellow-400"><Star className="w-3.5 h-3.5 fill-current" /><span className="font-bold">{active.rating}</span></div>
            <span className="text-white/40">{active.reviews} Reviews</span>
            <span className="flex items-center gap-1.5 text-green-400"><span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Online Now</span>
          </div>

          <div className="flex items-center gap-3">
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} onClick={onPlay}
              className="flex items-center gap-2 px-7 py-2.5 rounded-lg font-bold text-white text-sm shadow-lg"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', boxShadow: '0 6px 28px rgba(99,102,241,0.5)' }}>
              <Play className="w-4 h-4 fill-current" /> PLAY NOW
            </motion.button>
            <button className="px-6 py-2.5 rounded-lg font-semibold text-white/80 text-sm border border-white/15 bg-white/[0.04] hover:bg-white/10 transition-all backdrop-blur-sm">View Details</button>
            <button className="w-10 h-10 rounded-lg border border-white/15 bg-white/[0.04] hover:bg-white/10 flex items-center justify-center text-white/70 transition-all backdrop-blur-sm"><Heart className="w-4 h-4" /></button>
          </div>
        </motion.div>
      </AnimatePresence>

      <button className="absolute right-12 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all backdrop-blur-sm"><ChevronLeft className="w-4 h-4" /></button>
      <button className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all backdrop-blur-sm"><ChevronRight className="w-4 h-4" /></button>
      <div className="absolute bottom-4 left-10 z-10 flex gap-1.5">
        {[0, 1, 2, 3, 4].map(i => (
          <span key={i} className={`h-1 rounded-full transition-all ${i === 0 ? 'w-6 bg-purple-400' : 'w-1.5 bg-white/30'}`} />
        ))}
      </div>
    </div>
  );
}