import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Mic } from 'lucide-react';

export default function StoreSearchDropdown({ games, onGameSelect, isListening, toggleVoice }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  const close = () => {
    setIsOpen(false);
    setIsFocused(false);
    inputRef.current?.blur();
  };

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  const filteredGames = useMemo(() => {
    if (!searchTerm.trim()) return [];
    return games.filter(g => 
      g.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.genre?.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 20);
  }, [searchTerm, games]);

  return (
    <div className="relative flex-1 max-w-sm">
      <div className="flex items-center gap-2 bg-black/30 backdrop-blur-xl border border-white/10 rounded-full px-3 py-1.5 w-full focus-within:border-white/30 transition-all">
        <Search className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
        <input
          type="text"
          placeholder={isListening ? 'Listening...' : 'Search games...'}
          value={searchTerm}
          ref={inputRef}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(e.target.value.length > 0);
          }}
          onFocus={() => { setIsFocused(true); if (searchTerm.length > 0) setIsOpen(true); }}
          onBlur={() => {}}

          className="bg-transparent border-none outline-none text-xs text-white placeholder:text-white/30 w-full"
        />
        {searchTerm && (
          <button onClick={() => { setSearchTerm(''); setIsOpen(false); }} className="text-white/30 hover:text-white transition-all">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        <button onClick={toggleVoice} className={`transition-colors flex-shrink-0 ${isListening ? 'text-purple-400' : 'text-white/30 hover:text-white'}`}>
          <Mic className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && filteredGames.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 z-50"
            onClick={() => setIsOpen(false)}
          >
              {/* Content */}
              <div className="max-h-96 overflow-y-auto p-4" style={{ scrollbarWidth: 'none' }}>
                <div className="grid grid-cols-2 gap-3">
                  {filteredGames.map((game) => (
                    <motion.button
                      key={game.id}
                      whileHover={{ y: -4, scale: 1.02 }}
                      onClick={() => {
                        onGameSelect(game.id);
                        setSearchTerm('');
                        setIsOpen(false);
                      }}
                      className="group relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer border border-white/8 hover:border-cyan-400/30 transition-all"
                    >
                      <img
                        src={game.cover_image || game.image}
                        alt={game.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />
                      <div className="absolute bottom-0 left-0 right-0 p-2">
                        <h4 className="text-white font-bold text-xs leading-tight truncate">{game.title}</h4>
                        <div className="flex items-center justify-between text-[10px] mt-0.5">
                          <span className="text-white/40">{game.genre}</span>
                          <span className="text-green-400 font-bold">${game.price}</span>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shadow overlay — closes on click outside or Escape */}
      <AnimatePresence>
        {(isOpen || isFocused) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
            onClick={close}
          />
        )}
      </AnimatePresence>
    </div>
  );
}