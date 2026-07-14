// ExploreAllGames.jsx — Sortable / filterable premium game grid
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, ChevronDown, LayoutGrid, List, Heart } from 'lucide-react';
import { EXPLORE_GAMES } from './storefrontData';

function Dropdown({ label, value, options, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)} className="flex items-center gap-1.5 text-white/70 hover:text-white text-xs">
        {label && <span className="text-white/40 uppercase tracking-wider text-[10px]">{label}:</span>}
        <span className="font-semibold">{value}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-30 min-w-[140px] rounded-lg border border-white/10 bg-slate-900/95 backdrop-blur-xl overflow-hidden">
          {options.map(o => (
            <button key={o} onClick={() => { onChange(o); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-xs ${o === value ? 'bg-cyan-500/15 text-cyan-300' : 'text-white/70 hover:bg-white/5'}`}>{o}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function GameCard({ g, i, onSelect, onHoverGame }) {
  return (
    <motion.button
      onClick={() => onSelect?.(g.id)}
      onMouseEnter={() => onHoverGame?.(g)}
      whileHover={{ y: -6, scale: 1.04 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="group text-left"
    >
      <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-white/10 group-hover:border-cyan-400/50 transition-all duration-200"
        style={{ boxShadow: '0 8px 24px -8px rgba(0,0,0,0.6)' }}>
        <img src={g.cover_image || g.image} alt={g.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/10 to-transparent" />
        {/* hover glow ring */}
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ boxShadow: 'inset 0 0 0 1px rgba(56,189,248,0.5), inset 0 0 28px rgba(56,189,248,0.18)' }} />

        {/* wishlist */}
        <span className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/45 backdrop-blur-sm border border-white/15 flex items-center justify-center text-white/70 opacity-0 group-hover:opacity-100 transition-all hover:text-pink-400">
          <Heart className="w-3.5 h-3.5" />
        </span>

        {/* bottom info overlay */}
        <div className="absolute inset-x-0 bottom-0 p-2.5">
          <div className="text-white text-xs font-semibold truncate">{g.title}</div>
          {g.sub && <div className="text-white/45 text-[10px] truncate">{g.sub}</div>}
          <div className="flex items-center justify-between mt-1">
            <span className="flex items-center gap-0.5 text-yellow-400 text-[10px]"><Star className="w-2.5 h-2.5 fill-current" />{g.rating}</span>
            <span className="text-cyan-300 text-[11px] font-bold">${g.price}</span>
          </div>
        </div>
      </div>
    </motion.button>
  );
}

export default function ExploreAllGames({ onSelect, onHoverGame, games }) {
  const [sortBy, setSortBy] = useState('Featured');
  const [price, setPrice] = useState('All Prices');
  const [platform, setPlatform] = useState('All Platforms');
  const [view, setView] = useState('grid');

  const items = games && games.length > 0
    ? games.map(g => ({ id: g.id, title: g.title, sub: g.genre || '', rating: g.rating || 4.5, price: g.price ?? 0, cover_image: g.cover_image || g.image }))
    : EXPLORE_GAMES;

  return (
    <section
      className="rounded-2xl border border-white/[0.07] p-6"
      style={{ background: 'rgba(255,255,255,0.025)', backdropFilter: 'blur(12px)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }}
    >
      <h3 className="text-white font-bold text-sm uppercase tracking-widest mb-4">Explore All Games</h3>
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-5">
          <Dropdown label="Sort by" value={sortBy} options={['Featured', 'Top Rated', 'Newest', 'Price']} onChange={setSortBy} />
          <Dropdown label="Filter" value={price} options={['All Prices', 'Under $20', 'Under $40', 'Free']} onChange={setPrice} />
          <Dropdown label="" value={platform} options={['All Platforms', 'PC', 'PlayStation', 'Xbox']} onChange={setPlatform} />
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setView('grid')} className={`w-7 h-7 rounded-md flex items-center justify-center ${view === 'grid' ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white'}`}><LayoutGrid className="w-3.5 h-3.5" /></button>
          <button onClick={() => setView('list')} className={`w-7 h-7 rounded-md flex items-center justify-center ${view === 'list' ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white'}`}><List className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
        {items.map((g, i) => (
          <GameCard key={g.id} g={g} i={i} onSelect={onSelect} onHoverGame={onHoverGame} />
        ))}
      </div>
    </section>
  );
}