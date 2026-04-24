import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, Mic, MicOff } from 'lucide-react';

export const glassStyle = {
  background: 'rgba(8, 12, 18, 0.42)',
  backdropFilter: 'blur(30px) saturate(150%)',
  WebkitBackdropFilter: 'blur(30px) saturate(150%)',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.38), inset 0 1px 0 rgba(255, 255, 255, 0.04)',
};

// Mock studio games — in production pass these via props
const MOCK_STUDIO_GAMES = [
  { id: 1, title: 'Cyber Havoc', cover: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=120&h=80&fit=crop' },
  { id: 2, title: 'Void Walker', cover: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=120&h=80&fit=crop' },
  { id: 3, title: 'Iron Forge', cover: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=120&h=80&fit=crop' },
  { id: 4, title: 'Neon Drift', cover: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=120&h=80&fit=crop' },
  { id: 5, title: 'Dark Realm', cover: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=120&h=80&fit=crop' },
  { id: 6, title: 'Solar Wars', cover: 'https://images.unsplash.com/photo-1560419015-7c427e8ae5ba?w=120&h=80&fit=crop' },
  { id: 7, title: 'Phantom Run', cover: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=120&h=80&fit=crop' },
  { id: 8, title: 'Storm Knight', cover: 'https://images.unsplash.com/photo-1528938102132-4a9276b8e320?w=120&h=80&fit=crop' },
  { id: 9, title: 'Echo Prime', cover: 'https://images.unsplash.com/photo-1574169208507-84376144848b?w=120&h=80&fit=crop' },
  { id: 10, title: 'Galactic Hunt', cover: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=120&h=80&fit=crop' },
  { id: 11, title: 'Blaze Strike', cover: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=120&h=80&fit=crop' },
  { id: 12, title: 'Mech Arena', cover: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=120&h=80&fit=crop' },
  { id: 13, title: 'Shadow Pact', cover: 'https://images.unsplash.com/photo-1505506874110-6a7a69069a08?w=120&h=80&fit=crop' },
  { id: 14, title: 'Crystal Edge', cover: 'https://images.unsplash.com/photo-1487088678257-3a541e6e3922?w=120&h=80&fit=crop' },
];

const GENRES = ['All', 'Action', 'Runner', 'Shooter', 'RPG', 'Strategy', 'Horror', 'Puzzle', 'Sports', 'Racing', 'Adventure', 'Simulation'];

function GamesTopPanel({ open, studioGames = MOCK_STUDIO_GAMES, studioName = 'Studio' }) {
  const [searchValue, setSearchValue] = useState('');
  const [activeGenre, setActiveGenre] = useState('All');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const inputRef = useRef(null);

  const handleMic = () => {
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
    rec.onresult = (e) => setSearchValue(e.results[0][0].transcript);
    rec.onerror = () => setIsListening(false);
    rec.onend = () => setIsListening(false);
    rec.start();
    setIsListening(true);
  };

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  const filtered = studioGames.filter(g => {
    const matchesSearch = g.title.toLowerCase().includes(searchValue.toLowerCase());
    const matchesGenre = activeGenre === 'All' || (g.genre && g.genre === activeGenre);
    return matchesSearch && matchesGenre;
  });

  // Split into rows of 7
  const rows = [];
  for (let i = 0; i < filtered.length; i += 7) {
    rows.push(filtered.slice(i, i + 7));
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="fixed left-0 right-0 z-[34] flex"
          style={{
            top: '64px',
            height: '180px',
            background: 'rgba(6, 8, 14, 0.92)',
            backdropFilter: 'blur(40px) saturate(160%)',
            WebkitBackdropFilter: 'blur(40px) saturate(160%)',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          }}
        >
          {/* Left — Title + Search + Genre (35%) */}
          <div className="flex flex-col justify-center items-center px-6 gap-3" style={{ width: '35%', flexShrink: 0 }}>
            {/* Big centered title */}
            <p className="text-white font-extrabold text-center leading-tight" style={{ fontSize: '2.8rem', letterSpacing: '0.04em', lineHeight: 1.1 }}>
              Developer<br />
              <span className="text-white/50">You Games</span><br />
              <span className="text-white/30 text-[1.6rem]">Entitled</span>
            </p>

            {/* Smaller search bar */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-white/10 bg-white/[0.04]" style={{ width: '60%' }}>
              <Search className="w-3 h-3 flex-shrink-0 text-white/30" />
              <input
                ref={inputRef}
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Search..."
                className="flex-1 bg-transparent text-xs text-white placeholder:text-white/30 focus:outline-none"
              />
              <button
                onClick={handleMic}
                className={`flex-shrink-0 transition-colors ${isListening ? 'text-red-400' : 'text-white/40 hover:text-white'}`}
              >
                {isListening ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
              </button>
            </div>

            {/* Genre filter chips */}
            <div className="flex flex-wrap gap-1 justify-center">
              {GENRES.map(g => (
                <button
                  key={g}
                  onClick={() => setActiveGenre(g)}
                  className={`px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wide transition-all border ${
                    activeGenre === g
                      ? 'bg-white/20 border-white/30 text-white'
                      : 'border-white/10 text-white/40 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Vertical Divider */}
          <div className="self-stretch w-px bg-white/10 my-3 flex-shrink-0" />

          {/* Right — Games Grid (scrollable, 2 rows of 7 visible) */}
          <div
            className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-4"
            style={{ scrollSnapType: 'y mandatory' }}
          >
            {rows.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <span className="text-white/20 text-sm">No games found</span>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {rows.map((row, ri) => (
                  <div key={ri} className="flex gap-2" style={{ scrollSnapAlign: 'start' }}>
                    {row.map(game => (
                      <div
                        key={game.id}
                        className="flex-shrink-0 cursor-pointer group relative rounded overflow-hidden border border-white/10 hover:border-white/30 transition-all"
                        style={{ width: 'calc((100% - 48px) / 7)', aspectRatio: '3/2' }}
                        title={game.title}
                      >
                        <img
                          src={game.cover}
                          alt={game.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1">
                          <span className="text-white text-[9px] font-semibold leading-tight truncate w-full">{game.title}</span>
                        </div>
                      </div>
                    ))}
                    {/* Fill empty slots in the last row */}
                    {row.length < 7 && Array.from({ length: 7 - row.length }).map((_, i) => (
                      <div key={`empty-${i}`} style={{ width: 'calc((100% - 48px) / 7)' }} />
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function GlassPageFrame({ children, bottomContent, topContent, showTriggerTab = false, className = '' }) {
  const [overlay, setOverlay] = useState(null); // null | 'studio' | 'stream'
  const [gamesOpen, setGamesOpen] = useState(false);

  const closeAll = () => {
    setOverlay(null);
    setGamesOpen(false);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeAll();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleOverlay = (name) => {
    setGamesOpen(false);
    setOverlay(prev => prev === name ? null : name);
  };

  const toggleGames = () => {
    setOverlay(null);
    setGamesOpen(prev => !prev);
  };

  return (
    <div className={`relative w-full h-full min-h-screen ${className}`}>
      {/* Top Glass Bar */}
      <div
        className="fixed top-0 left-0 right-0 z-[35]"
        style={{
          ...glassStyle,
          height: '64px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          pointerEvents: topContent ? 'auto' : 'none',
        }}
      >
        {topContent && (
          <div className="h-full flex items-center px-6 w-full">
            {topContent}
          </div>
        )}
      </div>

      {/* Games Top Panel */}
      {showTriggerTab && <GamesTopPanel open={gamesOpen} />}

      {/* Page Content */}
      <div className="relative z-[1]">
        {children}
      </div>

      {/* Studio / Stream Overlay - between top and bottom bars */}
      <AnimatePresence>
        {overlay && (
          <motion.div
            key={overlay}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="fixed left-0 right-0 z-[34]"
            style={{
              top: '64px',
              bottom: '48px',
              background: 'rgba(6, 8, 14, 0.92)',
              backdropFilter: 'blur(40px) saturate(160%)',
              WebkitBackdropFilter: 'blur(40px) saturate(160%)',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-white/10 text-xs uppercase tracking-widest font-bold">{overlay}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Glass Bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[35]"
        style={{
          ...glassStyle,
          minHeight: '48px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          pointerEvents: bottomContent || showTriggerTab ? 'auto' : 'none',
        }}
      >
        {/* Trigger Tab */}
        {showTriggerTab && (
          <div
            className="absolute left-1/2 -translate-x-1/2 flex overflow-hidden pointer-events-auto"
            style={{
              top: '-36px',
              width: '216px',
              height: '40px',
              background: 'rgba(8, 12, 18, 0.42)',
              backdropFilter: 'blur(30px) saturate(150%)',
              WebkitBackdropFilter: 'blur(30px) saturate(150%)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderBottom: 'none',
              borderRadius: '8px 8px 0 0',
              boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.3)',
            }}
          >
            {/* Games */}
            <div
              onClick={toggleGames}
              className={`flex-1 flex items-center justify-center border-r border-white/10 cursor-pointer transition-colors ${gamesOpen ? 'bg-white/10' : 'hover:bg-white/5'}`}
            >
              <span className={`text-[9px] font-bold uppercase tracking-widest transition-colors ${gamesOpen ? 'text-white/90' : 'text-white/50'}`}>Games</span>
            </div>

            {/* Studio */}
            <div
              onClick={() => toggleOverlay('studio')}
              className={`flex-1 flex items-center justify-center border-r border-white/10 cursor-pointer transition-colors ${overlay === 'studio' ? 'bg-white/10' : 'hover:bg-white/5'}`}
            >
              <span className={`text-[9px] font-bold uppercase tracking-widest transition-colors ${overlay === 'studio' ? 'text-white/90' : 'text-white/50'}`}>Studio</span>
            </div>

            {/* Stream */}
            <div
              onClick={() => toggleOverlay('stream')}
              className={`flex-1 flex items-center justify-center cursor-pointer transition-colors ${overlay === 'stream' ? 'bg-white/10' : 'hover:bg-white/5'}`}
            >
              <span className={`text-[9px] font-bold uppercase tracking-widest transition-colors ${overlay === 'stream' ? 'text-white/90' : 'text-white/50'}`}>Stream</span>
            </div>
          </div>
        )}

        {bottomContent && (
          <div className="h-full w-full flex items-center justify-center px-6 py-2">
            {bottomContent}
          </div>
        )}
      </div>
    </div>
  );
}