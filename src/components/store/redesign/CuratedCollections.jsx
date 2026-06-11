// CuratedCollections.jsx — Editorial collection banners
import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { COLLECTIONS } from './storefrontData';

export default function CuratedCollections({ onSelect }) {
  return (
    <section>
      <h3 className="text-white font-bold text-sm uppercase tracking-widest mb-3">Curated Collections</h3>
      <div className="relative grid grid-cols-2 lg:grid-cols-4 gap-3">
        {COLLECTIONS.map(c => (
          <motion.button key={c.id} onClick={() => onSelect?.(c.id)} whileHover={{ y: -3 }}
            className="relative h-[110px] rounded-xl overflow-hidden border border-white/10 group text-left">
            <img src={c.image} alt={c.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(110deg, rgba(8,10,18,0.92) 0%, rgba(8,10,18,0.4) 60%, transparent 100%)' }} />
            <div className="absolute inset-0 flex flex-col justify-center px-4">
              <div className="text-white/70 font-bold text-xs tracking-widest leading-none">{c.title}</div>
              <div className="text-white font-black text-xl tracking-tight leading-tight">{c.big}</div>
              <div className="text-cyan-300 text-[10px] mt-1">{c.sub}</div>
            </div>
          </motion.button>
        ))}
        <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white/60 pointer-events-none">
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </section>
  );
}