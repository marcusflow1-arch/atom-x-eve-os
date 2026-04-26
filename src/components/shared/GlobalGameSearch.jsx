import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';

export default function GlobalGameSearch() {
  const [games, setGames] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  useEffect(() => {
    base44.entities.Game.list().then(setGames).catch(() => {});
  }, []);

  const filteredGames = useMemo(() => {
    if (!searchTerm.trim()) return [];
    return games.filter(g =>
      g.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.genre?.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 12);
  }, [searchTerm, games]);

  const close = () => { setIsOpen(false); setSearchTerm(''); inputRef.current?.blur(); };

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleSelect = (game) => {
    navigate(createPageUrl(`GameDetail?id=${game.id}`));
    close();
  };

  return (
    <div className="relative flex-shrink-0">
      <div
        className="flex items-center gap-2 rounded-full px-3 py-1.5 transition-all"
        style={{
          background: 'rgba(0,0,0,0.30)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.10)',
          minWidth: '180px',
        }}
      >
        <Search className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search games..."
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setIsOpen(e.target.value.length > 0); }}
          onFocus={() => { if (searchTerm.length > 0) setIsOpen(true); }}
          className="bg-transparent border-none outline-none text-xs text-white placeholder:text-white/30 w-full"
        />
        {searchTerm && (
          <button onClick={() => { setSearchTerm(''); setIsOpen(false); }} className="text-white/30 hover:text-white transition-all">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Results dropdown — opens upward above the bottom nav */}
      <AnimatePresence>
        {isOpen && filteredGames.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full mb-2 right-0 w-[360px] rounded-2xl overflow-hidden shadow-2xl border border-white/10"
            style={{ background: 'rgba(8,12,20,0.97)', backdropFilter: 'blur(24px)', zIndex: 99999 }}
          >
            <div className="max-h-80 overflow-y-auto p-3" style={{ scrollbarWidth: 'none' }}>
              <div className="grid grid-cols-3 gap-2">
                {filteredGames.map((game) => (
                  <button
                    key={game.id}
                    onClick={() => handleSelect(game)}
                    className="group relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer border border-white/8 hover:border-cyan-400/40 transition-all"
                  >
                    <img
                      src={game.cover_image || game.image}
                      alt={game.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-60" />
                    <div className="absolute bottom-0 left-0 right-0 p-1.5">
                      <h4 className="text-white font-bold text-[10px] leading-tight truncate">{game.title}</h4>
                      <span className="text-white/40 text-[9px]">{game.genre}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0"
            style={{ zIndex: 99998, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(3px)' }}
            onClick={close}
          />
        )}
      </AnimatePresence>
    </div>
  );
}