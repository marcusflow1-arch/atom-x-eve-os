// StorefrontHero.jsx — Featured game cinematic hero banner
import React from 'react';
import { motion } from 'framer-motion';
import { Play, Star, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import { HERO_GAME } from './storefrontData';

export default function StorefrontHero({ onPlay }) {
  const g = HERO_GAME;
  return (
    <div className="relative rounded-2xl overflow-hidden h-full min-h-[300px] border border-white/10">
      <img src={g.cover_image} alt={g.title} className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(8,10,18,0.95) 0%, rgba(8,10,18,0.6) 45%, rgba(8,10,18,0.1) 100%)' }} />

      <div className="relative z-10 h-full flex flex-col justify-center px-8 py-6 max-w-[60%]">
        <span className="inline-flex w-fit items-center gap-1.5 px-2.5 py-1 mb-3 rounded-md bg-purple-500/20 border border-purple-400/30 text-purple-200 text-[10px] font-bold uppercase tracking-widest">
          ⭐ Featured Game
        </span>
        <h1 className="text-5xl font-black text-white leading-none tracking-tight">{g.title}</h1>
        <h2 className="text-2xl font-light text-white/80 tracking-[0.3em] mb-3">{g.subtitle}</h2>
        <p className="text-cyan-300 text-xs font-bold tracking-widest mb-2">{g.tagline}</p>
        <p className="text-white/60 text-sm max-w-md mb-4 leading-relaxed">{g.description}</p>

        <div className="flex flex-wrap gap-2 mb-3">
          {g.tags.map(t => (
            <span key={t} className="px-2.5 py-1 rounded-md bg-white/[0.06] border border-white/10 text-white/60 text-[10px] font-semibold uppercase tracking-wider">{t}</span>
          ))}
        </div>

        <div className="flex items-center gap-4 text-xs mb-5">
          <div className="flex items-center gap-1 text-yellow-400"><Star className="w-3.5 h-3.5 fill-current" /><span className="font-bold">{g.rating}</span></div>
          <span className="text-white/40">{g.reviews} Reviews</span>
          <span className="flex items-center gap-1.5 text-green-400"><span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Online Now</span>
        </div>

        <div className="flex items-center gap-3">
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} onClick={onPlay}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-white text-sm shadow-lg"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', boxShadow: '0 6px 24px rgba(99,102,241,0.45)' }}>
            <Play className="w-4 h-4 fill-current" /> PLAY NOW
          </motion.button>
          <button className="px-6 py-2.5 rounded-lg font-semibold text-white/80 text-sm border border-white/15 bg-white/[0.04] hover:bg-white/10 transition-all">View Details</button>
          <button className="w-10 h-10 rounded-lg border border-white/15 bg-white/[0.04] hover:bg-white/10 flex items-center justify-center text-white/70 transition-all"><Heart className="w-4 h-4" /></button>
        </div>
      </div>

      <button className="absolute right-12 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all"><ChevronLeft className="w-4 h-4" /></button>
      <button className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all"><ChevronRight className="w-4 h-4" /></button>
      <div className="absolute bottom-4 left-8 z-10 flex gap-1.5">
        {[0, 1, 2, 3, 4].map(i => (
          <span key={i} className={`h-1 rounded-full transition-all ${i === 0 ? 'w-6 bg-purple-400' : 'w-1.5 bg-white/30'}`} />
        ))}
      </div>
    </div>
  );
}