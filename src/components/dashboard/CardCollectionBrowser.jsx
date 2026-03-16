import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

const GENRES = ['Fear', 'Shooter', 'RPG', 'Sci-Fi', 'Action', 'Strategy', 'Adventure', 'Racing', 'Sports', 'Puzzle'];

const MOCK_GAMES_BY_GENRE = {
  'Fear': ['Resident Evil', 'Silent Hill', 'Outlast', 'Amnesia'],
  'Shooter': ['Doom', 'Halo', 'Cyberpunk', 'Apex'],
  'RPG': ['Witcher', 'Skyrim', 'Fallout', 'Persona'],
  'Sci-Fi': ['Mass Effect', 'Dead Space', 'Starcraft'],
  'Action': ['God of War', 'Devil May Cry', 'Bayonetta'],
  'Strategy': ['Civilization', 'XCOM', 'Age of Empires'],
  'Adventure': ['Uncharted', 'Tomb Raider', 'Zelda'],
  'Racing': ['Need for Speed', 'Forza', 'Gran Turismo'],
  'Sports': ['FIFA', 'Madden', 'NBA'],
  'Puzzle': ['Portal', 'Tetris', 'The Witness']
};

const GENRE_CARDS = {
  'Fear': [
    { id: 'f1', game: 'Resident Evil', name: 'Shadow Wraith', icon: '👻', rarity: 'Legendary', image: 'https://images.unsplash.com/photo-1509248961385-6d4f65e671ae?w=200' },
    { id: 'f2', game: 'Silent Hill', name: 'Blood Moon', icon: '🌑', rarity: 'Epic', image: 'https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=200' },
    { id: 'f3', game: 'Outlast', name: 'Crypt Keeper', icon: '💀', rarity: 'Rare', image: 'https://images.unsplash.com/photo-1477346611705-65d1883cee1e?w=200' },
    { id: 'f4', game: 'Amnesia', name: 'Phantom Edge', icon: '🔪', rarity: 'Epic', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=200' },
    { id: 'f5', game: 'Resident Evil', name: 'Banshee Wail', icon: '😱', rarity: 'Rare', image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=200' },
    { id: 'f6', game: 'Silent Hill', name: 'Night Terror', icon: '🦇', rarity: 'Legendary', image: 'https://images.unsplash.com/photo-1509248961385-6d4f65e671ae?w=200' },
    { id: 'f7', game: 'Outlast', name: 'Grave Digger', icon: '⚰️', rarity: 'Common', image: 'https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=200' },
    { id: 'f8', game: 'Amnesia', name: 'Soul Harvest', icon: '👁️', rarity: 'Epic', image: 'https://images.unsplash.com/photo-1477346611705-65d1883cee1e?w=200' },
  ],
  'Shooter': [
    { id: 's1', game: 'Doom', name: 'Plasma Rifle', icon: '🔫', rarity: 'Legendary', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200' },
    { id: 's2', game: 'Halo', name: 'Frag Grenade', icon: '💣', rarity: 'Rare', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200' },
    { id: 's3', game: 'Cyberpunk', name: 'Tactical Vest', icon: '🦺', rarity: 'Epic', image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=200' },
    { id: 's4', game: 'Apex', name: 'Scope X12', icon: '🔭', rarity: 'Rare', image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=200' },
    { id: 's5', game: 'Doom', name: 'EMP Burst', icon: '⚡', rarity: 'Epic', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200' },
    { id: 's6', game: 'Halo', name: 'Stealth Camo', icon: '🫥', rarity: 'Legendary', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200' },
  ],
  'RPG': [
    { id: 'r1', game: 'Witcher', name: 'Dragon Flame', icon: '🔥', rarity: 'Legendary', image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=200' },
    { id: 'r2', game: 'Skyrim', name: 'Mana Crystal', icon: '💎', rarity: 'Epic', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=200' },
    { id: 'r3', game: 'Fallout', name: 'Iron Shield', icon: '🛡️', rarity: 'Rare', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=200' },
    { id: 'r4', game: 'Persona', name: 'Enchanted Bow', icon: '🏹', rarity: 'Epic', image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=200' },
    { id: 'r5', game: 'Witcher', name: 'Healing Potion', icon: '🧪', rarity: 'Common', image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=200' },
  ],
  'Sci-Fi': [
    { id: 'sf1', game: 'Mass Effect', name: 'Warp Drive', icon: '🚀', rarity: 'Legendary', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=200' },
    { id: 'sf2', game: 'Dead Space', name: 'Ion Cannon', icon: '💫', rarity: 'Epic', image: 'https://images.unsplash.com/photo-1505356829705-eb8b8f2d57c7?w=200' },
    { id: 'sf3', game: 'Starcraft', name: 'Nano Repair', icon: '🔧', rarity: 'Rare', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200' },
    { id: 'sf4', game: 'Mass Effect', name: 'AI Core', icon: '🤖', rarity: 'Epic', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200' },
  ],
  'Action': [
    { id: 'a1', game: 'God of War', name: 'Neon Rush', icon: '⚡', rarity: 'Epic', image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=200' },
    { id: 'a2', game: 'Devil May Cry', name: 'Combo Breaker', icon: '💥', rarity: 'Rare', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200' },
    { id: 'a3', game: 'Bayonetta', name: 'Adrenaline', icon: '🔥', rarity: 'Legendary', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200' },
  ],
  'Strategy': [
    { id: 'st1', game: 'Civilization', name: 'War Council', icon: '♟️', rarity: 'Epic', image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=200' },
    { id: 'st2', game: 'XCOM', name: 'Supply Chain', icon: '📦', rarity: 'Rare', image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=200' },
  ],
  'Adventure': [
    { id: 'ad1', game: 'Uncharted', name: 'Explorer Map', icon: '🗺️', rarity: 'Rare', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=200' },
    { id: 'ad2', game: 'Tomb Raider', name: 'Grappling Hook', icon: '🪝', rarity: 'Epic', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=200' },
  ],
  'Racing': [
    { id: 'rc1', game: 'Need for Speed', name: 'Turbo Boost', icon: '🏎️', rarity: 'Legendary', image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=200' },
    { id: 'rc2', game: 'Forza', name: 'Nitro Tank', icon: '⛽', rarity: 'Rare', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200' },
  ],
  'Sports': [
    { id: 'sp1', game: 'FIFA', name: 'MVP Trophy', icon: '🏆', rarity: 'Legendary', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200' },
    { id: 'sp2', game: 'Madden', name: 'Power Shot', icon: '⚽', rarity: 'Epic', image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=200' },
  ],
  'Puzzle': [
    { id: 'p1', game: 'Portal', name: 'Time Warp', icon: '⏳', rarity: 'Epic', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=200' },
    { id: 'p2', game: 'Tetris', name: 'Mind Link', icon: '🧠', rarity: 'Rare', image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=200' },
  ],
};

const CardUI = ({ card, small }) => {
  const RARITY_STYLES = {
    Common: { border: 'border-slate-500/40', text: 'text-slate-400', glow: '' },
    Rare: { border: 'border-blue-500/50', text: 'text-blue-300', glow: 'shadow-[0_0_10px_rgba(59,130,246,0.3)]' },
    Epic: { border: 'border-purple-500/50', text: 'text-purple-300', glow: 'shadow-[0_0_12px_rgba(168,85,247,0.3)]' },
    Legendary: { border: 'border-amber-500/50', text: 'text-amber-300', glow: 'shadow-[0_0_15px_rgba(251,191,36,0.4)]' },
  };
  const rs = RARITY_STYLES[card.rarity] || RARITY_STYLES.Common;
  
  return (
    <div
      className={`w-full h-full rounded overflow-hidden border ${rs.border} ${rs.glow} relative group select-none flex flex-col items-center justify-center bg-black/60 hover:scale-105 transition-transform duration-200`}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img src={card.image} alt="" className="w-full h-full object-cover opacity-30 group-hover:opacity-40 transition-opacity" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
      </div>
      <div className="relative h-full flex flex-col w-full p-1.5 pointer-events-none">
        <span className={`text-[8px] font-bold uppercase tracking-wider ${rs.text} text-center`}>{card.rarity}</span>
        <div className="flex-1 flex items-center justify-center">
          <span className={small ? 'text-2xl' : 'text-3xl'}>{card.icon}</span>
        </div>
        <p className={`text-white font-bold truncate text-center ${small ? 'text-[8px]' : 'text-[10px]'}`}>{card.name}</p>
      </div>
    </div>
  );
};

export default function CardCollectionBrowser() {
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedGame, setSelectedGame] = useState(null);
  const [gamesHovered, setGamesHovered] = useState(false);
  
  const [pinnedCardsByGenre, setPinnedCardsByGenre] = useState(() => {
    try {
      const saved = localStorage.getItem('luna_pinned_cards_by_genre');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  const gamesScrollRef = useRef(null);
  const wheelCooldown = useRef(false);

  const visibleCards = useMemo(() => {
    let all = [];
    if (selectedGenre === 'All') {
       Object.values(GENRE_CARDS).forEach(arr => all.push(...arr));
    } else {
       all = GENRE_CARDS[selectedGenre] || [];
       if (selectedGame) {
          all = all.filter(c => c.game === selectedGame);
       }
    }
    return all;
  }, [selectedGenre, selectedGame]);

  const onDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;
    
    if (source.droppableId === 'center' && destination.droppableId.startsWith('pinned-')) {
      const destGenre = destination.droppableId.replace('pinned-', '');
      const draggedCard = visibleCards[source.index];
      if (!draggedCard) return;

      setPinnedCardsByGenre(prev => {
         const currentPinned = prev[destGenre] || [];
         if (currentPinned.find(c => c.id === draggedCard.id)) return prev; 
         if (currentPinned.length >= 12) return prev; 
         
         const newPinned = Array.from(currentPinned);
         newPinned.splice(destination.index, 0, draggedCard);
         
         const newState = { ...prev, [destGenre]: newPinned };
         localStorage.setItem('luna_pinned_cards_by_genre', JSON.stringify(newState));
         
         // Sync with legacy format if needed
         if (destGenre === selectedGenre) {
           localStorage.setItem('luna_pinned_cards', JSON.stringify(newPinned));
           window.dispatchEvent(new Event('cardPinsUpdated'));
         }
         return newState;
      });
    } else if (source.droppableId === destination.droppableId && source.droppableId.startsWith('pinned-')) {
      const destGenre = destination.droppableId.replace('pinned-', '');
      setPinnedCardsByGenre(prev => {
         const currentPinned = prev[destGenre] || [];
         const newPinned = Array.from(currentPinned);
         const [removed] = newPinned.splice(source.index, 1);
         newPinned.splice(destination.index, 0, removed);
         
         const newState = { ...prev, [destGenre]: newPinned };
         localStorage.setItem('luna_pinned_cards_by_genre', JSON.stringify(newState));

         if (destGenre === selectedGenre) {
           localStorage.setItem('luna_pinned_cards', JSON.stringify(newPinned));
           window.dispatchEvent(new Event('cardPinsUpdated'));
         }
         return newState;
      });
    }
  };

  const removePinnedCard = (genre, cardId) => {
    setPinnedCardsByGenre(prev => {
       const currentPinned = prev[genre] || [];
       const newPinned = currentPinned.filter(c => c.id !== cardId);
       const newState = { ...prev, [genre]: newPinned };
       localStorage.setItem('luna_pinned_cards_by_genre', JSON.stringify(newState));
       
       if (genre === selectedGenre) {
           localStorage.setItem('luna_pinned_cards', JSON.stringify(newPinned));
           window.dispatchEvent(new Event('cardPinsUpdated'));
       }
       return newState;
    });
  };

  // Horizontal Wheel Handling for Games
  useEffect(() => {
    const el = gamesScrollRef.current;
    if (!el || selectedGenre === 'All') return;
    
    const gamesInGenre = MOCK_GAMES_BY_GENRE[selectedGenre] || [];
    
    const onWheel = (e) => {
      e.preventDefault();
      if (wheelCooldown.current) return;
      wheelCooldown.current = true;
      
      const currentIndex = gamesInGenre.indexOf(selectedGame);
      let nextIndex = currentIndex === -1 ? 0 : currentIndex;
      
      if (e.deltaY > 0) {
         nextIndex = Math.min(nextIndex + 1, gamesInGenre.length - 1);
      } else if (e.deltaY < 0) {
         nextIndex = Math.max(nextIndex - 1, 0);
      }
      setSelectedGame(gamesInGenre[nextIndex]);
      
      setTimeout(() => { wheelCooldown.current = false; }, 150);
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [selectedGenre, selectedGame]);

  // A/D Keys Handling for Games
  useEffect(() => {
    if (!gamesHovered || selectedGenre === 'All') return;
    const gamesInGenre = MOCK_GAMES_BY_GENRE[selectedGenre] || [];
    
    const handleKey = (e) => {
      const key = e.key.toLowerCase();
      if (key === 'a' || key === 'arrowleft') {
        const currentIndex = gamesInGenre.indexOf(selectedGame);
        if (currentIndex > 0) setSelectedGame(gamesInGenre[currentIndex - 1]);
        else if (currentIndex === -1 && gamesInGenre.length > 0) setSelectedGame(gamesInGenre[0]);
      } else if (key === 'd' || key === 'arrowright') {
        const currentIndex = gamesInGenre.indexOf(selectedGame);
        if (currentIndex < gamesInGenre.length - 1) setSelectedGame(gamesInGenre[currentIndex + 1]);
        else if (currentIndex === -1 && gamesInGenre.length > 0) setSelectedGame(gamesInGenre[0]);
      }
    };
    
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [gamesHovered, selectedGenre, selectedGame]);

  // Scroll active game into view
  useEffect(() => {
    if (!selectedGame || !gamesScrollRef.current) return;
    const container = gamesScrollRef.current;
    const activeEl = container.querySelector(`[data-game="${selectedGame}"]`);
    if (activeEl) {
       activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [selectedGame]);

  // RENDER ORIGINAL UI (For Card Collection Base Page)
  if (window.location.pathname.toLowerCase().includes('cardcollection')) {
    // Basic restore of the exact UI layout from the original Card Collection page as requested.
    return (
      <div className="w-full flex flex-col items-center">
        {/* Title - Clickable for Full Page */}
        <div className="w-full flex justify-center items-center gap-2 mb-3">
          <button 
            onClick={() => {
               // Switches back to 'Cards Unlocked' UI mode if needed
            }}
            className="group"
          >
            <h3 
              className="text-[12.5px] font-extrabold uppercase tracking-widest text-center group-hover:scale-105 transition-transform" 
              style={{ 
                background: 'linear-gradient(180deg, #E2E8F0 0%, #94A3B8 45%, #0F172A 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))'
              }}
            >
              Cards Unlocked
            </h3>
          </button>
  
          <div className="w-4 h-4 border border-white/40 rounded flex items-center justify-center text-white/40 flex-shrink-0">
            <span className="text-[10px] font-bold leading-none">?</span>
          </div>
  
          <button 
            className="group"
          >
            <h3 
              className="text-[12.5px] font-extrabold uppercase tracking-widest text-center group-hover:scale-105 transition-transform truncate max-w-[120px]" 
              style={{ 
                background: 'linear-gradient(180deg, #E2E8F0 0%, #94A3B8 45%, #0F172A 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))',
                opacity: 0.6
              }}
            >
              {selectedGame || 'Cyberpunk 2077'}
            </h3>
          </button>
        </div>
  
        {/* Genre Name - scroll over this to change genre */}
        <div
          className="mb-3 cursor-pointer select-none relative flex items-center justify-center gap-3 group"
        >
          <ChevronLeft className={`w-3.5 h-3.5 transition-opacity text-white/0 opacity-0`} />
          <AnimatePresence mode="wait">
            <motion.span
              key={selectedGenre}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className={`text-sm font-bold uppercase tracking-[0.2em] text-white/60`}
            >
              {selectedGenre === 'All' ? 'Fear' : selectedGenre}
            </motion.span>
          </AnimatePresence>
          <ChevronRight className={`w-3.5 h-3.5 transition-opacity text-white/0 opacity-0`} />
        </div>
  
        {/* Cards Area */}
        <div className="relative w-full">
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-4 gap-2"
            >
              {visibleCards.slice(0, 4).map((card) => {
                return (
                  <motion.div
                    key={card.id}
                    whileHover={{ scale: 1.06, y: -3 }}
                    className={`aspect-[2.5/3.5] rounded-lg overflow-hidden cursor-pointer border border-slate-500/40 transition-shadow relative group`}
                    style={{ background: 'linear-gradient(135deg, rgba(30,40,55,0.95), rgba(15,23,42,0.98))' }}
                  >
                    <div className="absolute inset-0 overflow-hidden">
                      <img src={card.image} alt="" className="w-full h-full object-cover opacity-30 group-hover:opacity-40 transition-opacity" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                    </div>
                    <div className="relative h-full flex flex-col p-1.5">
                      <span className={`text-[7px] font-bold uppercase tracking-wider text-slate-400`}>{card.rarity}</span>
                      <div className="flex-1 flex items-center justify-center">
                        <span className="text-2xl">{card.icon}</span>
                      </div>
                      <p className="text-white font-bold text-[9px] truncate text-center">{card.name}</p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // RENDER "UNLOCK CARDS" UI (The one we just built with 15/70/15 layout)
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex w-full h-full text-white font-sans overflow-hidden bg-transparent min-h-[500px]">
        
        {/* LEFT - 15% (Genres & Games) */}
        <div className="w-[15%] h-full flex flex-col border-r border-white/10 overflow-y-auto no-scrollbar relative" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <div className="flex flex-col gap-1 py-4 px-2">
            
            {/* Back button (Optional if they want to navigate out like the screenshot) */}
            <div className="mb-4 px-3 flex flex-col gap-2">
              <button 
                onClick={() => {
                   // Optional action
                }}
              />
            </div>

            <div 
              onClick={() => { setSelectedGenre('All'); setSelectedGame(null); }}
              className={`px-3 py-2 text-sm font-bold uppercase tracking-wider cursor-pointer transition-colors ${selectedGenre === 'All' ? 'text-cyan-400' : 'text-white/40 hover:text-white/80'}`}
            >
              All
            </div>
            {GENRES.map(genre => (
              <div key={genre} className="flex flex-col">
                <div 
                  onClick={() => { setSelectedGenre(genre); setSelectedGame(null); }}
                  className={`px-3 py-2 text-sm font-bold uppercase tracking-wider cursor-pointer transition-colors ${selectedGenre === genre ? 'text-cyan-400' : 'text-white/40 hover:text-white/80'}`}
                >
                  {genre}
                </div>
                
                <AnimatePresence>
                  {selectedGenre === genre && MOCK_GAMES_BY_GENRE[genre] && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div 
                        ref={gamesScrollRef}
                        className="flex items-center gap-3 px-3 py-2 overflow-x-auto ml-2 border-l-2 border-white/10"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        onMouseEnter={() => setGamesHovered(true)}
                        onMouseLeave={() => setGamesHovered(false)}
                      >
                        {MOCK_GAMES_BY_GENRE[genre].map(game => (
                          <div 
                            key={game}
                            data-game={game}
                            onClick={() => setSelectedGame(game)}
                            className={`flex-shrink-0 text-xs px-2 py-1 rounded cursor-pointer whitespace-nowrap transition-colors ${selectedGame === game ? 'bg-cyan-500/20 text-cyan-300' : 'text-white/50 hover:text-white/80'}`}
                          >
                            {game}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
        
        {/* CENTER - 70% (Cards) */}
        <div className="w-[70%] h-full flex flex-col p-6 overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <Droppable droppableId="center" isDropDisabled={true}>
            {(provided) => (
              <div 
                ref={provided.innerRef} 
                {...provided.droppableProps}
                className="grid grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3 content-start"
              >
                 {visibleCards.map((card, index) => (
                   <Draggable key={`center-${card.id}`} draggableId={card.id} index={index}>
                     {(provided) => (
                        <div
                           ref={provided.innerRef}
                           {...provided.draggableProps}
                           {...provided.dragHandleProps}
                           className="aspect-[2.5/3.5] w-full"
                        >
                           <CardUI card={card} />
                        </div>
                     )}
                   </Draggable>
                 ))}
                 {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
        
        {/* RIGHT - 15% (Pinned Cards) */}
        <div className="w-[15%] h-full flex flex-col border-l border-white/10 bg-black/20 p-4 overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
           <div className="text-center mb-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-cyan-400">{selectedGenre}</h3>
              <div className="w-full h-px bg-white/20 mt-2"></div>
           </div>
           
           <Droppable droppableId={`pinned-${selectedGenre}`} direction="horizontal">
              {(provided) => (
                 <div 
                   ref={provided.innerRef} 
                   {...provided.droppableProps} 
                   className="relative flex-1"
                 >
                    {/* Background 12 slots */}
                    <div className="absolute inset-0 grid grid-cols-4 gap-2 pointer-events-none content-start">
                       {Array.from({length: 12}).map((_, i) => (
                          <div key={`bg-${i}`} className="aspect-[2.5/3.5] border border-white/10 rounded bg-black/40"></div>
                       ))}
                    </div>
                    
                    {/* Draggable pinned cards */}
                    <div className="grid grid-cols-4 gap-2 content-start min-h-[300px]">
                       {pinnedCardsByGenre[selectedGenre]?.map((card, index) => (
                          <Draggable key={`pinned-${card.id}`} draggableId={`pinned-${card.id}`} index={index}>
                            {(provided) => (
                               <div
                                 ref={provided.innerRef}
                                 {...provided.draggableProps}
                                 {...provided.dragHandleProps}
                                 className="aspect-[2.5/3.5] z-10 relative group"
                               >
                                  <CardUI card={card} small />
                                  <button 
                                     onClick={() => removePinnedCard(selectedGenre, card.id)}
                                     className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[8px] z-20 hover:scale-110 transition-all"
                                  >
                                     <X className="w-2.5 h-2.5" />
                                  </button>
                               </div>
                            )}
                          </Draggable>
                       ))}
                       {provided.placeholder}
                    </div>
                 </div>
              )}
           </Droppable>
        </div>
        
      </div>
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </DragDropContext>
  );
}