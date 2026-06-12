// BrowseByGenre.jsx — Horizontal genre cards row
import React from 'react';
import { motion } from 'framer-motion';
import { Swords, Shield, Crosshair, Compass, Skull, Car, ChevronRight } from 'lucide-react';
import { BROWSE_GENRES } from './storefrontData';

const ICONS = { Swords, Shield, Crosshair, Compass, Skull, Car };

export default function BrowseByGenre({ onSelect }) {
  return (
    <section>
      <h3 className="text-white font-bold text-sm uppercase tracking-widest mb-3">Browse by Genre</h3>
      <div className="relative">
        <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
          {BROWSE_GENRES.map((g, i) => {
            const Icon = ICONS[g.icon] || Swords;
            return (
              <motion.button key={g.id} onClick={() => onSelect?.(g.id)}
                whileHover={{ y: -6, scale: 1.03 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="relative flex-shrink-0 w-[180px] h-[150px] rounded-2xl overflow-hidden border border-white/10 hover:border-white/25 group"
                style={{ boxShadow: '0 8px 24px -10px rgba(0,0,0,0.6)' }}
              >
                <img src={g.image} alt={g.label} className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, transparent 30%, ${g.glow}22 70%, rgba(8,10,18,0.95) 100%)` }} />
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ boxShadow: `inset 0 0 0 1px ${g.glow}77, inset 0 0 26px ${g.glow}33` }} />
                <div className="absolute inset-0 flex flex-col justify-end p-3">
                  <Icon className="w-5 h-5 mb-1.5" style={{ color: g.glow }} />
                  <div className="text-white font-bold text-base leading-none">{g.label}</div>
                  <div className="text-white/50 text-[10px] mt-0.5">{g.count}</div>
                </div>
              </motion.button>
            );
          })}
        </div>
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white/60 pointer-events-none">
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </section>
  );
}