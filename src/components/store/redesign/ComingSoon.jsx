// ComingSoon.jsx — Wide banner cards for upcoming releases
import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Heart, Calendar } from 'lucide-react';
import { COMING_SOON } from './storefrontData';

export default function ComingSoon({ onSelect }) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-bold text-sm uppercase tracking-widest">Coming Soon</h3>
        <button className="flex items-center gap-1 text-cyan-300 text-[10px] font-semibold uppercase tracking-wider hover:text-cyan-200 transition-colors">
          View All <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {COMING_SOON.map((g, i) => (
          <motion.button
            key={g.id}
            onClick={() => onSelect?.(g.id)}
            whileHover={{ y: -5, scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="group relative h-[140px] rounded-2xl overflow-hidden border border-white/10 hover:border-purple-400/40 transition-all duration-200 text-left"
            style={{ boxShadow: '0 8px 24px -10px rgba(0,0,0,0.6)' }}
          >
            <img src={g.image} alt={g.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(110deg, rgba(8,10,18,0.95) 0%, rgba(8,10,18,0.5) 60%, transparent 100%)' }} />
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" style={{ boxShadow: 'inset 0 0 0 1px rgba(168,85,247,0.45), inset 0 0 24px rgba(168,85,247,0.16)' }} />
            <div className="relative z-10 h-full flex flex-col justify-center px-5">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="px-2 py-0.5 rounded-full bg-purple-500/30 border border-purple-400/30 text-purple-300 text-[9px] font-bold uppercase tracking-wider">{g.genre}</span>
              </div>
              <div className="text-white font-black text-lg tracking-tight leading-tight">{g.title}</div>
              <div className="flex items-center gap-1 text-purple-300 text-[11px] mt-1">
                <Calendar className="w-3 h-3" /> {g.date}
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-white/50 text-[10px]">{g.wishlist_count} wishlisted</span>
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-white/20 transition-all">
                  <Heart className="w-3 h-3" /> Wishlist
                </span>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </section>
  );
}