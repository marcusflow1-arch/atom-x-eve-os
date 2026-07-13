// TopSellers.jsx — Ranked best-seller grid with large rank numbers
import React from 'react';
import { motion } from 'framer-motion';
import { Star, TrendingUp, ChevronRight } from 'lucide-react';
import { TOP_SELLERS } from './storefrontData';

const RANK_COLORS = [
  'text-yellow-300',
  'text-cyan-300',
  'text-fuchsia-300',
  'text-emerald-300',
  'text-orange-300',
  'text-purple-300',
];

export default function TopSellers({ onSelect }) {
  return (
    <section
      className="rounded-2xl border border-white/[0.07] p-6"
      style={{ background: 'rgba(255,255,255,0.025)', backdropFilter: 'blur(12px)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <h3 className="text-white font-bold text-sm uppercase tracking-widest">Top Sellers</h3>
        </div>
        <button className="flex items-center gap-1 text-cyan-300 text-[10px] font-semibold uppercase tracking-wider hover:text-cyan-200 transition-colors">
          View All <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {TOP_SELLERS.map((g, i) => (
          <motion.button
            key={g.id}
            onClick={() => onSelect?.(g.id)}
            whileHover={{ y: -6, scale: 1.03 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="group relative text-left"
          >
            <div className="relative aspect-[3/4] rounded-xl overflow-hidden border border-white/10 group-hover:border-emerald-400/50 transition-all duration-200" style={{ boxShadow: '0 8px 24px -8px rgba(0,0,0,0.6)' }}>
              <img src={g.cover_image} alt={g.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/10 to-transparent" />
              <div className={`absolute top-1.5 left-1.5 font-black text-3xl leading-none ${RANK_COLORS[i] || RANK_COLORS[5]}`} style={{ textShadow: '0 0 12px rgba(0,0,0,0.8)' }}>
                {g.rank}
              </div>
              <div className="absolute inset-x-0 bottom-0 p-2.5">
                <div className="text-white text-xs font-bold truncate">{g.title}</div>
                <div className="text-white/50 text-[10px] truncate">{g.genre}</div>
                <div className="flex items-center justify-between mt-1">
                  <span className="flex items-center gap-0.5 text-yellow-400 text-[10px]"><Star className="w-2.5 h-2.5 fill-current" />{g.rating}</span>
                  <span className="text-cyan-300 text-[11px] font-bold">${g.price}</span>
                </div>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </section>
  );
}