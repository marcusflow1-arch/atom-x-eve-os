// NewReleases.jsx — Horizontal scroll of recently launched games
import React from 'react';
import { motion } from 'framer-motion';
import { Star, ChevronRight, Calendar } from 'lucide-react';
import { NEW_RELEASES } from './storefrontData';

export default function NewReleases({ onSelect }) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-bold text-sm uppercase tracking-widest">New Releases</h3>
        <button className="flex items-center gap-1 text-cyan-300 text-[10px] font-semibold uppercase tracking-wider hover:text-cyan-200 transition-colors">
          View All <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      <div className="relative">
        <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
          {NEW_RELEASES.map((g, i) => (
            <motion.button
              key={g.id}
              onClick={() => onSelect?.(g.id)}
              whileHover={{ y: -6, scale: 1.03 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="group relative flex-shrink-0 w-[160px] text-left"
            >
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-white/10 group-hover:border-cyan-400/50 transition-all duration-200" style={{ boxShadow: '0 8px 24px -8px rgba(0,0,0,0.6)' }}>
                <img src={g.cover_image} alt={g.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/10 to-transparent" />
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ boxShadow: 'inset 0 0 0 1px rgba(56,189,248,0.5), inset 0 0 28px rgba(56,189,248,0.18)' }} />
                <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/80 backdrop-blur-sm text-white text-[9px] font-bold uppercase tracking-wider">
                  <Calendar className="w-2.5 h-2.5" /> NEW
                </div>
                <div className="absolute inset-x-0 bottom-0 p-3">
                  <div className="text-white text-xs font-bold truncate">{g.title}</div>
                  <div className="text-white/50 text-[10px] truncate">{g.genre}</div>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="flex items-center gap-0.5 text-yellow-400 text-[10px]"><Star className="w-2.5 h-2.5 fill-current" />{g.rating}</span>
                    <span className="text-cyan-300 text-[11px] font-bold">${g.price}</span>
                  </div>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white/60 pointer-events-none">
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </section>
  );
}