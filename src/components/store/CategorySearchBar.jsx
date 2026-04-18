import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ChevronDown } from 'lucide-react';
import { CATEGORIES } from './StoreCategoryOverlay';

const CATEGORY_LABELS = {
  recommended: 'Recommended',
  new_releases: 'New Releases',
  top_rated: 'Top Games',
  trending: 'Trending',
  hidden_gems: 'Hidden Gems',
};

export default function CategorySearchBar({ activeCategoryOverlay, games, onGameSelect }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  const label = activeCategoryOverlay ? CATEGORY_LABELS[activeCategoryOverlay] : null;

  // Get the filtered games for the active category
  const categoryGames = useMemo(() => {
    if (!activeCategoryOverlay || !games) return [];
    const cat = CATEGORIES.find(c => c.id === activeCategoryOverlay);
    return cat ? cat.filter(games) : [];
  }, [activeCategoryOverlay, games]);

  const results = useMemo(() => {
    if (!query.trim()) return categoryGames.slice(0, 8);
    return categoryGames.filter(g =>
      g.title?.toLowerCase().includes(query.toLowerCase()) ||
      g.genre?.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 10);
  }, [query, categoryGames]);

  // Open when category becomes active
  useEffect(() => {
    if (activeCategoryOverlay) {
      setOpen(false);
      setQuery('');
    }
  }, [activeCategoryOverlay]);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  if (!activeCategoryOverlay || !label) return null;

  return (
    <div className="relative" style={{ zIndex: 9999 }}>
      {/* The pill button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all border"
        style={{
          background: open ? 'rgba(34,211,238,0.18)' : 'rgba(255,255,255,0.08)',
          border: open ? '1px solid rgba(34,211,238,0.45)' : '1px solid rgba(255,255,255,0.15)',
          color: open ? 'rgba(103,232,249,1)' : 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <Search className="w-3.5 h-3.5" />
        <span>{label}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown search panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="absolute top-full mt-2 left-0 w-80 rounded-2xl overflow-hidden shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(10,14,22,0.97) 0%, rgba(18,24,36,0.97) 100%)',
              backdropFilter: 'blur(40px) saturate(180%)',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
              zIndex: 99999,
              position: 'absolute',
            }}
          >
            {/* Search input */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/8">
              <Search className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={`Search ${label}...`}
                className="flex-1 bg-transparent text-white text-sm placeholder-white/30 outline-none"
              />
              {query && (
                <button onClick={() => setQuery('')} className="text-white/30 hover:text-white transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Results list */}
            <div className="max-h-72 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
              {results.length === 0 ? (
                <p className="text-white/30 text-xs text-center py-6">No games found</p>
              ) : (
                results.map(game => (
                  <button
                    key={game.id}
                    onClick={() => { onGameSelect?.(game); setOpen(false); setQuery(''); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.06] transition-all text-left group"
                  >
                    <img src={game.cover_image} alt={game.title} className="w-9 h-12 object-cover rounded-lg flex-shrink-0 border border-white/10" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-semibold truncate group-hover:text-cyan-300 transition-colors">{game.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {game.genre && <span className="text-white/40 text-[10px]">{game.genre}</span>}
                        {game.price != null && <span className="text-green-400 text-[10px] font-bold">${game.price}</span>}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}