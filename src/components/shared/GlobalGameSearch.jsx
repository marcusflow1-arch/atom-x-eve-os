import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Mic, MicOff } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function GlobalGameSearch() {
  const [games, setGames] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    base44.entities.Game.list().then(setGames).catch(() => {});
  }, []);

  const filteredGames = useMemo(() => {
    if (!searchTerm.trim()) return [];
    return games.filter(g =>
      g.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.genre?.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 20);
  }, [searchTerm, games]);

  const close = () => {
    setIsOpen(false);
    setSearchTerm('');
    inputRef.current?.blur();
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const toggleVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const rec = new SR();
    recognitionRef.current = rec;
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setSearchTerm(text);
      setIsOpen(text.length > 0);
    };
    rec.onerror = () => setIsListening(false);
    rec.onend = () => setIsListening(false);
    rec.start();
    setIsListening(true);
  };

  const handleSelect = (game) => {
    navigate(createPageUrl('Store') + `?gameId=${game.id}`);
    close();
  };

  return (
    <div className="relative flex-shrink-0">
      {/* Search Input */}
      <div
        className="flex items-center gap-2 rounded-full px-3 py-1.5 transition-all focus-within:border-white/30"
        style={{
          background: 'rgba(0,0,0,0.30)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.10)',
          minWidth: '200px',
        }}
      >
        <Search className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          placeholder={isListening ? 'Listening...' : 'Search games...'}
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setIsOpen(e.target.value.length > 0); }}
          onFocus={() => { if (searchTerm.length > 0) setIsOpen(true); }}
          className="bg-transparent border-none outline-none text-xs text-white placeholder:text-white/30 w-full"
        />
        {searchTerm && (
          <button onClick={() => { setSearchTerm(''); setIsOpen(false); }} className="text-white/30 hover:text-white transition-all flex-shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          onClick={toggleVoice}
          className={`transition-colors flex-shrink-0 ${isListening ? 'text-purple-400' : 'text-white/30 hover:text-white'}`}
        >
          {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Store-style Results Dropdown — opens upward */}
      <AnimatePresence>
        {isOpen && filteredGames.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full mb-2 right-0 w-[480px] rounded-2xl overflow-hidden shadow-2xl border border-white/10"
            style={{ background: 'rgba(8,12,20,0.97)', backdropFilter: 'blur(30px)', zIndex: 99999 }}
          >
            <div className="p-3 border-b border-white/8">
              <p className="text-white/40 text-[10px] uppercase tracking-widest font-semibold">{filteredGames.length} results for "{searchTerm}"</p>
            </div>
            <div className="max-h-96 overflow-y-auto p-4" style={{ scrollbarWidth: 'none' }}>
              <div className="grid grid-cols-2 gap-3">
                {filteredGames.map((game) => (
                  <motion.button
                    key={game.id}
                    whileHover={{ y: -4, scale: 1.02 }}
                    onClick={() => handleSelect(game)}
                    className="group relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer border border-white/8 hover:border-cyan-400/30 transition-all"
                  >
                    <img
                      src={game.cover_image || game.banner_image}
                      alt={game.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />
                    <div className="absolute bottom-0 left-0 right-0 p-2">
                      <h4 className="text-white font-bold text-xs leading-tight truncate">{game.title}</h4>
                      <div className="flex items-center justify-between text-[10px] mt-0.5">
                        <span className="text-white/40">{game.genre}</span>
                        {game.price != null && (
                          <span className="text-green-400 font-bold">${game.price}</span>
                        )}
                      </div>
                    </div>
                  </motion.button>
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
            style={{ zIndex: 99998, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
            onClick={close}
          />
        )}
      </AnimatePresence>
    </div>
  );
}