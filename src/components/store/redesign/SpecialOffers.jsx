// SpecialOffers.jsx — Discounted games grid with old/new pricing
import React from 'react';
import { motion } from 'framer-motion';
import { Star, ChevronRight, Flame } from 'lucide-react';
import { SPECIAL_OFFERS } from './storefrontData';

export default function SpecialOffers({ onSelect }) {
  return (
    <section
      className="rounded-2xl border border-white/[0.07] p-6 relative overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.025)', backdropFilter: 'blur(12px)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }}
    >
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(251,146,60,0.08) 0%, transparent 70%)' }} />
      <div className="flex items-center justify-between mb-4 relative">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-400" />
          <h3 className="text-white font-bold text-sm uppercase tracking-widest">Special Offers</h3>
        </div>
        <button className="flex items-center gap-1 text-cyan-300 text-[10px] font-semibold uppercase tracking-wider hover:text-cyan-200 transition-colors">
          View All <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 relative">
        {SPECIAL_OFFERS.map((g, i) => (
          <motion.button
            key={g.id}
            onClick={() => onSelect?.(g.id)}
            whileHover={{ y: -6, scale: 1.03 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="group relative text-left"
          >
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-white/10 group-hover:border-orange-400/50 transition-all duration-200" style={{ boxShadow: '0 8px 24px -8px rgba(0,0,0,0.6)' }}>
              <img src={g.cover_image} alt={g.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/10 to-transparent" />
              <div className="absolute top-2 left-2 px-2 py-1 rounded-lg bg-orange-500/90 backdrop-blur-sm text-white text-[11px] font-black tracking-tight">
                {g.discount}
              </div>
              <div className="absolute inset-x-0 bottom-0 p-2.5">
                <div className="text-white text-xs font-bold truncate">{g.title}</div>
                <div className="text-white/50 text-[10px] truncate">{g.genre}</div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-white/30 text-[10px] line-through">${g.oldPrice}</span>
                  <span className="text-orange-400 text-[12px] font-black">${g.price}</span>
                </div>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </section>
  );
}