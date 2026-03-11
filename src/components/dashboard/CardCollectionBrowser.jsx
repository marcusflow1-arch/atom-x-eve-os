import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ChevronLeft, ChevronRight, Sparkles, Star, Pin } from 'lucide-react';

const GENRES = ['Fear', 'Shooter', 'RPG', 'Sci-Fi', 'Action', 'Strategy', 'Adventure', 'Racing', 'Sports', 'Puzzle'];

// Mock cards per genre
const GENRE_CARDS = {
  'Fear': [
    { id: 'f1', name: 'Shadow Wraith', icon: '👻', rarity: 'Legendary', image: 'https://images.unsplash.com/photo-1509248961385-6d4f65e671ae?w=200' },
    { id: 'f2', name: 'Blood Moon', icon: '🌑', rarity: 'Epic', image: 'https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=200' },
    { id: 'f3', name: 'Crypt Keeper', icon: '💀', rarity: 'Rare', image: 'https://images.unsplash.com/photo-1477346611705-65d1883cee1e?w=200' },
    { id: 'f4', name: 'Phantom Edge', icon: '🔪', rarity: 'Epic', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=200' },
    { id: 'f5', name: 'Banshee Wail', icon: '😱', rarity: 'Rare', image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=200' },
    { id: 'f6', name: 'Night Terror', icon: '🦇', rarity: 'Legendary', image: 'https://images.unsplash.com/photo-1509248961385-6d4f65e671ae?w=200' },
    { id: 'f7', name: 'Grave Digger', icon: '⚰️', rarity: 'Common', image: 'https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=200' },
    { id: 'f8', name: 'Soul Harvest', icon: '👁️', rarity: 'Epic', image: 'https://images.unsplash.com/photo-1477346611705-65d1883cee1e?w=200' },
  ],
  'Shooter': [
    { id: 's1', name: 'Plasma Rifle', icon: '🔫', rarity: 'Legendary', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200' },
    { id: 's2', name: 'Frag Grenade', icon: '💣', rarity: 'Rare', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200' },
    { id: 's3', name: 'Tactical Vest', icon: '🦺', rarity: 'Epic', image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=200' },
    { id: 's4', name: 'Scope X12', icon: '🔭', rarity: 'Rare', image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=200' },
    { id: 's5', name: 'EMP Burst', icon: '⚡', rarity: 'Epic', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200' },
    { id: 's6', name: 'Stealth Camo', icon: '🫥', rarity: 'Legendary', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200' },
  ],
  'RPG': [
    { id: 'r1', name: 'Dragon Flame', icon: '🔥', rarity: 'Legendary', image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=200' },
    { id: 'r2', name: 'Mana Crystal', icon: '💎', rarity: 'Epic', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=200' },
    { id: 'r3', name: 'Iron Shield', icon: '🛡️', rarity: 'Rare', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=200' },
    { id: 'r4', name: 'Enchanted Bow', icon: '🏹', rarity: 'Epic', image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=200' },
    { id: 'r5', name: 'Healing Potion', icon: '🧪', rarity: 'Common', image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=200' },
  ],
  'Sci-Fi': [
    { id: 'sf1', name: 'Warp Drive', icon: '🚀', rarity: 'Legendary', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=200' },
    { id: 'sf2', name: 'Ion Cannon', icon: '💫', rarity: 'Epic', image: 'https://images.unsplash.com/photo-1505356829705-eb8b8f2d57c7?w=200' },
    { id: 'sf3', name: 'Nano Repair', icon: '🔧', rarity: 'Rare', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200' },
    { id: 'sf4', name: 'AI Core', icon: '🤖', rarity: 'Epic', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200' },
  ],
  'Action': [
    { id: 'a1', name: 'Neon Rush', icon: '⚡', rarity: 'Epic', image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=200' },
    { id: 'a2', name: 'Combo Breaker', icon: '💥', rarity: 'Rare', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200' },
    { id: 'a3', name: 'Adrenaline', icon: '🔥', rarity: 'Legendary', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200' },
  ],
  'Strategy': [
    { id: 'st1', name: 'War Council', icon: '♟️', rarity: 'Epic', image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=200' },
    { id: 'st2', name: 'Supply Chain', icon: '📦', rarity: 'Rare', image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=200' },
  ],
  'Adventure': [
    { id: 'ad1', name: 'Explorer Map', icon: '🗺️', rarity: 'Rare', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=200' },
    { id: 'ad2', name: 'Grappling Hook', icon: '🪝', rarity: 'Epic', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=200' },
  ],
  'Racing': [
    { id: 'rc1', name: 'Turbo Boost', icon: '🏎️', rarity: 'Legendary', image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=200' },
    { id: 'rc2', name: 'Nitro Tank', icon: '⛽', rarity: 'Rare', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200' },
  ],
  'Sports': [
    { id: 'sp1', name: 'MVP Trophy', icon: '🏆', rarity: 'Legendary', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200' },
    { id: 'sp2', name: 'Power Shot', icon: '⚽', rarity: 'Epic', image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=200' },
  ],
  'Puzzle': [
    { id: 'p1', name: 'Time Warp', icon: '⏳', rarity: 'Epic', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=200' },
    { id: 'p2', name: 'Mind Link', icon: '🧠', rarity: 'Rare', image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=200' },
  ],
};

const RARITY_STYLES = {
  Common: { border: 'border-slate-500/40', text: 'text-slate-400', glow: '' },
  Rare: { border: 'border-blue-500/50', text: 'text-blue-300', glow: 'shadow-[0_0_10px_rgba(59,130,246,0.3)]' },
  Epic: { border: 'border-purple-500/50', text: 'text-purple-300', glow: 'shadow-[0_0_12px_rgba(168,85,247,0.3)]' },
  Legendary: { border: 'border-amber-500/50', text: 'text-amber-300', glow: 'shadow-[0_0_15px_rgba(251,191,36,0.4)]' },
};

const COLS_PER_ROW = 4;

export default function CardCollectionBrowser() {
  const navigate = useNavigate();
  
  // Pinned Cards Logic
  const [pinnedCards, setPinnedCards] = useState(() => {
    try {
      const saved = localStorage.getItem('luna_pinned_cards');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [viewMode, setViewMode] = useState('global'); // 'global' | 'game'

  // Listen for pin updates from full page
  useEffect(() => {
    const handlePinsUpdate = () => {
      try {
        const saved = localStorage.getItem('luna_pinned_cards');
        setPinnedCards(saved ? JSON.parse(saved) : []);
      } catch {}
    };
    window.addEventListener('cardPinsUpdated', handlePinsUpdate);
    window.addEventListener('storage', handlePinsUpdate);
    return () => {
      window.removeEventListener('cardPinsUpdated', handlePinsUpdate);
      window.removeEventListener('storage', handlePinsUpdate);
    };
  }, []);

  const [genreIndex, setGenreIndex] = useState(0);
  const [isGenreHovered, setIsGenreHovered] = useState(false);
  const [isCardsHovered, setIsCardsHovered] = useState(false);
  const [scrollX, setScrollX] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const cardsRef = useRef(null);
  const genreRef = useRef(null);

  const gameName = localStorage.getItem('luna_pinned_card_game_name') || 'Cyberpunk 2077';
  const gameGenre = localStorage.getItem('luna_pinned_card_game_genre') || 'RPG';
  
  // Determine displayed genre
  const currentGenre = viewMode === 'game' ? gameGenre : GENRES[genreIndex];
  
  // Get cards for current view
  const cards = useMemo(() => {
    if (viewMode === 'game') return pinnedCards;
    return GENRE_CARDS[currentGenre] || [];
  }, [viewMode, currentGenre, pinnedCards]);

  // Build rows of COLS_PER_ROW cards
  const rows = useMemo(() => {
    const r = [];
    for (let i = 0; i < cards.length; i += COLS_PER_ROW) {
      r.push(cards.slice(i, i + COLS_PER_ROW));
    }
    return r;
  }, [cards]);

  // Start at 'game' mode if we have pinned cards available
  useEffect(() => {
    if (pinnedCards.length > 0) {
      setViewMode('game');
    }
  }, []); // Only run once on mount

  // Genre scroll: one wheel tick = one genre change
  const genreCooldown = useRef(false);
  const handleGenreWheel = useCallback((e) => {
    if (viewMode === 'game') return; // Disable genre scrolling in game mode
    if (genreCooldown.current) return;
    e.preventDefault();
    e.stopPropagation();
    genreCooldown.current = true;

    setGenreIndex(prev => {
      const minIndex = 0;
      const totalLen = GENRES.length;
      
      let next = prev;
      if (e.deltaY > 0) {
        // Next
        next++;
        if (next >= totalLen) next = minIndex;
      } else {
        // Prev
        next--;
        if (next < minIndex) next = totalLen - 1;
      }
      return next;
    });
    setScrollX(0);
    setScrollY(0);

    setTimeout(() => { genreCooldown.current = false; }, 400);
  }, [viewMode]);

  // Attach genre wheel listener
  useEffect(() => {
    const el = genreRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleGenreWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleGenreWheel);
  }, [handleGenreWheel]);

  // Cards area: vertical scroll changes rows
  const cardsCooldown = useRef(false);
  const handleCardsWheel = useCallback((e) => {
    if (cardsCooldown.current) return;
    e.preventDefault();
    e.stopPropagation();
    cardsCooldown.current = true;

    setScrollY(prev => {
      const maxRow = Math.max(0, rows.length - 1);
      if (e.deltaY > 0) return Math.min(prev + 1, maxRow);
      return Math.max(prev - 1, 0);
    });

    setTimeout(() => { cardsCooldown.current = false; }, 300);
  }, [rows.length]);

  useEffect(() => {
    const el = cardsRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleCardsWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleCardsWheel);
  }, [handleCardsWheel]);

  // A/D keys for horizontal scroll when cards area is hovered
  useEffect(() => {
    if (!isCardsHovered) return;
    const handleKey = (e) => {
      const key = e.key?.toLowerCase();
      if (key === 'd' || key === 'arrowright') {
        setScrollX(prev => {
          const currentRow = rows[scrollY] || [];
          const maxScroll = Math.max(0, currentRow.length - COLS_PER_ROW);
          return Math.min(prev + 1, maxScroll);
        });
      } else if (key === 'a' || key === 'arrowleft') {
        setScrollX(prev => Math.max(prev - 1, 0));
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isCardsHovered, rows, scrollY]);

  // Reset horizontal scroll when row changes
  useEffect(() => { setScrollX(0); }, [scrollY]);

  // Current visible row
  const visibleRow = rows[scrollY] || [];
  const visibleCards = visibleRow.slice(scrollX, scrollX + COLS_PER_ROW);
  const canScrollLeft = scrollX > 0;
  const canScrollRight = scrollX + COLS_PER_ROW < visibleRow.length;

  return (
    <div className="w-full flex flex-col items-center">
      {/* Title - Clickable for Full Page */}
      <div className="w-full flex justify-center items-center gap-2 mb-3">
        <button 
          onClick={() => {
            if (viewMode === 'game') {
              setViewMode('global');
            } else {
              navigate(createPageUrl('CardCollection'));
            }
          }}
          className="group"
        >
          <h3 
            className="text-[10px] font-extrabold uppercase tracking-widest text-center group-hover:scale-105 transition-transform" 
            style={{ 
              background: 'linear-gradient(180deg, #E2E8F0 0%, #94A3B8 45%, #0F172A 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))',
              opacity: viewMode === 'global' ? 1 : 0.6
            }}
          >
            Cards Unlocked
          </h3>
        </button>

        <div className="w-4 h-4 border border-white/40 rounded flex items-center justify-center text-white/40 flex-shrink-0">
          <span className="text-[10px] font-bold leading-none">?</span>
        </div>

        <button 
          onClick={() => {
            setViewMode('game');
          }}
          className="group"
        >
          <h3 
            className="text-[10px] font-extrabold uppercase tracking-widest text-center group-hover:scale-105 transition-transform truncate max-w-[100px]" 
            style={{ 
              background: 'linear-gradient(180deg, #E2E8F0 0%, #94A3B8 45%, #0F172A 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))',
              opacity: viewMode === 'game' ? 1 : 0.6
            }}
          >
            {gameName}
          </h3>
        </button>
      </div>

      {/* Genre Name - scroll over this to change genre */}
      <div
        ref={genreRef}
        onMouseEnter={() => setIsGenreHovered(true)}
        onMouseLeave={() => setIsGenreHovered(false)}
        className="mb-3 cursor-pointer select-none relative flex items-center justify-center gap-3 group"
      >
        <ChevronLeft className={`w-3.5 h-3.5 transition-opacity ${isGenreHovered && viewMode === 'global' ? 'text-white/50 opacity-100' : 'text-white/0 opacity-0'}`} />
        <AnimatePresence mode="wait">
          <motion.span
            key={currentGenre}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className={`text-sm font-bold uppercase tracking-[0.2em] ${viewMode === 'game' ? 'text-cyan-400' : 'text-white/60'}`}
          >
            {currentGenre} {viewMode === 'game' && <Pin className="inline w-3 h-3 ml-1 mb-0.5" />}
          </motion.span>
        </AnimatePresence>
        <ChevronRight className={`w-3.5 h-3.5 transition-opacity ${isGenreHovered && viewMode === 'global' ? 'text-white/50 opacity-100' : 'text-white/0 opacity-0'}`} />
        {isGenreHovered && viewMode === 'global' && (
          <span className="absolute -bottom-4 text-[9px] text-white/25 font-mono">scroll to change</span>
        )}
      </div>

      {/* Cards Area */}
      <div
        ref={cardsRef}
        onMouseEnter={() => setIsCardsHovered(true)}
        onMouseLeave={() => setIsCardsHovered(false)}
        className="relative w-full"
      >
        {/* Row indicator */}
        {rows.length > 1 && (
          <div className="flex justify-center gap-1 mb-2">
            {rows.map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === scrollY ? 'bg-white/60 scale-125' : 'bg-white/15'}`}
              />
            ))}
          </div>
        )}

        {/* Horizontal scroll indicators */}
        <div className="relative">
          {canScrollLeft && (
            <div className="absolute left-0 top-0 bottom-0 w-6 z-10 pointer-events-none flex items-center justify-start pl-1"
              style={{ background: 'linear-gradient(to right, rgba(15,20,25,0.8), transparent)' }}
            >
              <ChevronLeft className="w-3 h-3 text-white/40" />
            </div>
          )}
          {canScrollRight && (
            <div className="absolute right-0 top-0 bottom-0 w-6 z-10 pointer-events-none flex items-center justify-end pr-1"
              style={{ background: 'linear-gradient(to left, rgba(15,20,25,0.8), transparent)' }}
            >
              <ChevronRight className="w-3 h-3 text-white/40" />
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentGenre}-${scrollY}`}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-4 gap-2"
            >
              {visibleCards.length > 0 ? visibleCards.map((card) => {
                const rs = RARITY_STYLES[card.rarity] || RARITY_STYLES.Common;
                return (
                  <motion.div
                    key={card.id}
                    whileHover={{ scale: 1.06, y: -3 }}
                    className={`aspect-[2.5/3.5] rounded-lg overflow-hidden cursor-pointer border ${rs.border} ${rs.glow} transition-shadow relative group`}
                    style={{
                      background: 'linear-gradient(135deg, rgba(30,40,55,0.95), rgba(15,23,42,0.98))',
                    }}
                  >
                    <div className="absolute inset-0 overflow-hidden">
                      <img src={card.image} alt="" className="w-full h-full object-cover opacity-30 group-hover:opacity-40 transition-opacity" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                    </div>
                    <div className="relative h-full flex flex-col p-1.5">
                      <span className={`text-[7px] font-bold uppercase tracking-wider ${rs.text}`}>{card.rarity}</span>
                      <div className="flex-1 flex items-center justify-center">
                        <span className="text-2xl">{card.icon}</span>
                      </div>
                      <p className="text-white font-bold text-[9px] truncate text-center">{card.name}</p>
                    </div>
                  </motion.div>
                );
              }) : (
                <div className="col-span-4 flex items-center justify-center h-24 text-white/20 text-xs">
                  No cards in this genre
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* A/D hint */}
        {isCardsHovered && visibleRow.length > COLS_PER_ROW && (
          <div className="flex justify-center mt-2">
            <span className="text-[9px] text-white/25 font-mono">A / D to scroll cards</span>
          </div>
        )}
      </div>
    </div>
  );
}