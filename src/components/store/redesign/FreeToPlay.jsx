// FreeToPlay.jsx — Grid of free-to-play titles
import React from 'react';
import { motion } from 'framer-motion';
import { Star, Users, ChevronRight, Gift } from 'lucide-react';
import { FREE_TO_PLAY } from './storefrontData';

export default function FreeToPlay({ onSelect }) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Gift className="w-4 h-4 text-emerald-400" />
          <h3 className="text-white font-bold text-sm uppercase tracking-widest">Free to Play</h3>
        </div>
        <button className="flex items-center gap-1 text-cyan-300 text-[10px] font-semibold uppercase tracking-wider hover:text-cyan-200 transition-colors">
          View All <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {FREE_TO_PLAY.map((g, i) => (
          <motion.button
            key={g.id}
            onClick={() => onSelect?.(g.id)}
            whileHover={{ y: -6, scale: 1.03 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: i * 0.03 }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative text-left"
          >
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-white/10 group-hover:border-emerald-400/50 transition-all duration-200" style={{ boxShadow: '0 8px 24px -8px rgba(0,0,0,0.6)' }}>
              <img src={g.cover_image} alt={g.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/10 to-transparent" />
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-emerald-500/80 backdrop-blur-sm text-white text-[9px] font-bold uppercase tracking-wider">
                FREE
              </div>
              <div className="absolute inset-x-0 bottom-0 p-2.5">
                <div className="text-white text-xs font-bold truncate">{g.title}</div>
                <div className="text-white/50 text-[10px] truncate">{g.genre}</div>
                <div className="flex items-center justify-between mt-1">
                  <span className="flex items-center gap-0.5 text-yellow-400 text-[10px]"><Star className="w-2.5 h-2.5 fill-current" />{g.rating}</span>
                  <span className="flex items-center gap-0.5 text-cyan-300 text-[10px] font-bold"><Users className="w-2.5 h-2.5" />{g.players}</span>
                </div>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </section>
  );
}