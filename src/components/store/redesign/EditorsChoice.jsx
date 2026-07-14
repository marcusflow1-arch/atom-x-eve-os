// EditorsChoice.jsx — Staff-picked games with editorial blurbs
import React from 'react';
import { motion } from 'framer-motion';
import { Star, Quote, ChevronRight } from 'lucide-react';
import { EDITORS_CHOICE } from './storefrontData';

export default function EditorsChoice({ onSelect, games }) {
  const QUOTES = ['A masterclass in narrative RPG design', 'Roguelike perfection with heart', 'The greatest mystery in gaming', 'The deck-builder that started it all', 'An unforgettable journey', 'Pure gameplay bliss'];
  const items = games && games.length > 0
    ? games.map((g, i) => ({ id: g.id, title: g.title, rating: g.rating || 4.5, cover_image: g.cover_image || g.image, quote: QUOTES[i % QUOTES.length], author: '— Staff Review' }))
    : EDITORS_CHOICE;
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Quote className="w-4 h-4 text-cyan-400" />
          <h3 className="text-white font-bold text-sm uppercase tracking-widest">Editor's Choice</h3>
        </div>
        <button className="flex items-center gap-1 text-cyan-300 text-[10px] font-semibold uppercase tracking-wider hover:text-cyan-200 transition-colors">
          View All <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {items.map((g, i) => (
          <motion.button
            key={g.id}
            onClick={() => onSelect?.(g.id)}
            whileHover={{ y: -6, scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="group relative rounded-2xl overflow-hidden border border-white/10 hover:border-cyan-400/40 transition-all duration-200 text-left"
            style={{ boxShadow: '0 8px 24px -10px rgba(0,0,0,0.6)', background: 'rgba(255,255,255,0.03)' }}
          >
            <div className="relative aspect-[3/4] overflow-hidden">
              <img src={g.cover_image} alt={g.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/20 to-transparent" />
              <div className="absolute top-2 right-2 flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm border border-white/15 text-yellow-400 text-[10px] font-bold">
                <Star className="w-2.5 h-2.5 fill-current" />{g.rating}
              </div>
              <div className="absolute inset-x-0 bottom-0 p-3">
                <div className="text-white text-sm font-bold">{g.title}</div>
              </div>
            </div>
            <div className="p-3">
              <div className="text-cyan-300/80 text-[10px] italic leading-snug">"{g.quote}"</div>
              <div className="text-white/40 text-[9px] mt-1">{g.author}</div>
            </div>
          </motion.button>
        ))}
      </div>
    </section>
  );
}