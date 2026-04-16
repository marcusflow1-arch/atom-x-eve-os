import React, { useState, useRef, useEffect } from 'react';
import { Search, Mic, MicOff, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SearchGameQuickView from './SearchGameQuickView';

export default function StoreSearchDropdown({ games, onGameSelect, isListening, toggleVoice }) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  const filtered = query.trim().length > 1
    ? games.filter(g => g.title?.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : [];

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setFocused(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (game) => {
    setQuery(game.title);
    setFocused(false);
    setSelectedGame(game);
  };

  const clearSearch = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  return (
    <>
      <div ref={containerRef} className="relative w-80">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/15 bg-white/[0.06] backdrop-blur-md">
          <Search className="w-4 h-4 text-white/40 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setFocused(true); }}
            onFocus={() => setFocused(true)}
            placeholder="Search games..."
            className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none min-w-0"
          />
          {query && (
            <button onClick={clearSearch} className="text-white/30 hover:text-white/60 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={toggleVoice}
            className={`flex-shrink-0 transition-colors ${isListening ? 'text-red-400' : 'text-white/30 hover:text-white/60'}`}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        </div>

        <AnimatePresence>
          {focused && filtered.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 right-0 mt-2 rounded-xl overflow-hidden z-[200] shadow-2xl"
              style={{
                background: 'rgba(10,14,22,0.97)',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(20px)',
              }}
            >
              {filtered.map((game) => (
                <button
                  key={game.id}
                  onClick={() => handleSelect(game)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/8 transition-colors text-left"
                >
                  <div className="w-9 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-slate-800 border border-white/10">
                    {game.cover_image && (
                      <img src={game.cover_image} alt={game.title} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{game.title}</p>
                    <p className="text-xs text-white/40 truncate">{game.genre}</p>
                  </div>
                  {game.price != null && (
                    <span className="ml-auto text-xs font-bold text-cyan-400 flex-shrink-0">
                      {game.price === 0 ? 'Free' : `$${game.price}`}
                    </span>
                  )}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quick View Overlay */}
      <AnimatePresence>
        {selectedGame && (
          <SearchGameQuickView
            game={selectedGame}
            onClose={() => setSelectedGame(null)}
            onGoToStore={(id) => { setSelectedGame(null); onGameSelect(id); }}
          />
        )}
      </AnimatePresence>
    </>
  );
}