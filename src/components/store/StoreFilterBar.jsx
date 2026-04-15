import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export const GENRES = [
  'Action', 'Adventure', 'RPG', 'Strategy', 'Shooter', 'Horror',
  'Racing', 'Sports', 'Simulation', 'Puzzle', 'Fighting', 'Platformer',
  'Survival', 'Open World', 'Sandbox', 'Sci-Fi', 'Fantasy', 'MMO',
];

const FILTER_OPTIONS = [
  {
    id: 'genre',
    label: 'Genre',
    type: 'scroll', // horizontal scroll bar
  },
  {
    id: 'mode',
    label: 'Game Mode',
    type: 'list',
    options: ['Single Player', 'Multiplayer', 'Co-op', 'PvP'],
  },
  {
    id: 'choices',
    label: 'Your Picks',
    type: 'list',
    options: ['Based on History', 'Trending for You', 'New to You', 'Top Rated', 'Recently Viewed'],
  },
  {
    id: 'free',
    label: 'Free to Play',
    type: 'toggle',
  },
  {
    id: 'pvp',
    label: 'PvP',
    type: 'toggle',
  },
];

export default function StoreFilterBar({ activeFilters = {}, onFilterChange, onGenreExtensionChange }) {
  const [openFilter, setOpenFilter] = useState(null);
  const genreScrollRef = useRef(null);

  const handleGenreWheel = (e) => {
    e.preventDefault();
    if (genreScrollRef.current) {
      genreScrollRef.current.scrollLeft += e.deltaY > 0 ? 100 : -100;
    }
  };

  const toggleFilter = (filterId) => {
    const next = openFilter === filterId ? null : filterId;
    setOpenFilter(next);
    // Notify parent when genre extension opens/closes
    if (filterId === 'genre') {
      onGenreExtensionChange?.(next === 'genre');
    }
  };

  const selectOption = (filterId, value) => {
    const current = activeFilters[filterId];
    if (filterId === 'free' || filterId === 'pvp') {
      onFilterChange?.(filterId, current ? null : true);
      setOpenFilter(null);
      return;
    }
    onFilterChange?.(filterId, current === value ? null : value);
    if (filterId !== 'genre') setOpenFilter(null);
  };

  const isActive = (filterId) => {
    return activeFilters[filterId] != null && activeFilters[filterId] !== false;
  };

  return (
    <div className="relative flex items-center gap-1.5">
      {FILTER_OPTIONS.map((filter) => {
        const active = isActive(filter.id);
        const open = openFilter === filter.id;

        // Toggle filters (free, pvp) are simple click buttons
        if (filter.type === 'toggle') {
          return (
            <button
              key={filter.id}
              onClick={() => selectOption(filter.id, true)}
              className={`relative px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border transition-all ${
                active
                  ? 'bg-cyan-400/20 border-cyan-400/50 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.2)]'
                  : 'bg-white/[0.05] border-white/10 text-white/50 hover:border-white/20 hover:text-white/80'
              }`}
            >
              {filter.label}
            </button>
          );
        }

        return (
          <div key={filter.id} className="relative">
            <button
              onClick={() => toggleFilter(filter.id)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border transition-all ${
                active || open
                  ? 'bg-cyan-400/20 border-cyan-400/50 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.2)]'
                  : 'bg-white/[0.05] border-white/10 text-white/50 hover:border-white/20 hover:text-white/80'
              }`}
            >
              {filter.label}
              {active && activeFilters[filter.id] !== true && (
                <span className="ml-1 text-cyan-400 font-black normal-case truncate max-w-[60px]">
                  · {activeFilters[filter.id]}
                </span>
              )}
              <ChevronDown className={`w-3 h-3 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {open && filter.type !== 'scroll' && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-full mb-2 left-0 z-[200]"
                  style={{
                    background: 'rgba(10,14,22,0.96)',
                    backdropFilter: 'blur(24px)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '14px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  }}
                >
                  <div className="py-2 min-w-[180px]">
                    {filter.options.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => selectOption(filter.id, opt)}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                          activeFilters[filter.id] === opt
                            ? 'text-cyan-300 bg-cyan-400/10'
                            : 'text-white/70 hover:text-white hover:bg-white/[0.06]'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}