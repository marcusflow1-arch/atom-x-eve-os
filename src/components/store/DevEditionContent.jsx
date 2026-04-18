import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Gamepad2, Sparkles, Layers, Trophy, X,
  LayoutGrid, Globe, Rocket, Crown, Crosshair, Map, Ghost, Monitor, Car,
  ShoppingCart, Star, Zap, BookOpen, Users, Search, ChevronLeft, Clock,
  TrendingUp, Bell, ArrowRight
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { DEV_SPOTLIGHT_DATA } from '@/components/dashboard/devSpotlightData';
import { useCart } from '@/components/CartContext';

const GENRE_TABS = [
  { id: 'all', name: 'All', icon: LayoutGrid },
  { id: 'action-rpg', name: 'Action RPG', icon: Crosshair },
  { id: 'mmo', name: 'MMO', icon: Globe },
  { id: 'space-sim', name: 'Space Sim', icon: Rocket },
  { id: 'roguelike', name: 'Roguelike', icon: Layers },
  { id: 'fps', name: 'FPS', icon: Crosshair },
  { id: 'horror', name: 'Horror', icon: Ghost },
  { id: 'racing', name: 'Racing', icon: Car },
  { id: 'strategy', name: 'Strategy', icon: Map },
  { id: 'simulation', name: 'Simulation', icon: Monitor },
];

function GenreScrollTabs({ tabs, selectedTab, onSelect }) {
  const scrollRef = useRef(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleWheel = (e) => { e.preventDefault(); el.scrollLeft += e.deltaY > 0 ? 80 : -80; };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  return (
    <div className="flex-1 min-w-0 relative">
      <div className="absolute left-0 top-0 bottom-0 w-6 z-10 pointer-events-none" style={{ background: 'linear-gradient(to right, rgba(8,12,18,0.9), transparent)' }} />
      <div className="absolute right-0 top-0 bottom-0 w-6 z-10 pointer-events-none" style={{ background: 'linear-gradient(to left, rgba(8,12,18,0.9), transparent)' }} />
      <div ref={scrollRef} className="flex items-center gap-1.5 overflow-x-auto px-2" style={{ scrollBehavior: 'smooth', scrollbarWidth: 'none' }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => onSelect(t)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full whitespace-nowrap border transition-all text-xs font-semibold flex-shrink-0 ${
              selectedTab?.id === t.id
                ? 'bg-white/12 border-white/20 text-white'
                : 'bg-transparent border-transparent text-white/45 hover:bg-white/5 hover:text-white/70'
            }`}
          >
            {React.createElement(t.icon, { className: 'w-3.5 h-3.5' })}
            <span>{t.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function QuickAccessPanel({ recentGames, allGames, onSelectGame }) {
  const [activeTab, setActiveTab] = useState('recent');
  const tabs = [
    { id: 'recent', label: 'Recent', icon: Clock },
    { id: 'top', label: 'Top', icon: TrendingUp },
    { id: 'new', label: 'New', icon: Bell },
  ];

  const topGames = useMemo(() => [...allGames].sort((a, b) => (b.cardCount || 0) - (a.cardCount || 0)).slice(0, 10), [allGames]);
  const newCardGames = useMemo(() => allGames.filter(g => g.cards?.some(c => c.tag === 'New' || c.tag === 'New Release')).slice(0, 10), [allGames]);
  const displayGames = activeTab === 'recent' ? recentGames : activeTab === 'top' ? topGames : newCardGames;

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-white/6">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
            <Clock className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <h2 className="text-white font-bold text-sm">Quick Access</h2>
            <p className="text-white/35 text-[10px]">Shortcuts & discoveries</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-white/10 text-white border border-white/15'
                  : 'text-white/30 hover:text-white/60 border border-transparent hover:bg-white/5'
              }`}
            >
              <tab.icon className="w-3 h-3" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-1" style={{ scrollbarWidth: 'none' }}>
        {displayGames.length === 0 ? (
          <div className="text-center py-12 text-white/20">
            <Clock className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p className="text-xs font-medium">No games yet</p>
            <p className="text-[10px] mt-1 text-white/15">Click a game to track it</p>
          </div>
        ) : (
          displayGames.map(game => (
            <motion.button
              key={game.id}
              whileHover={{ x: 3 }}
              onClick={() => onSelectGame(game)}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left hover:bg-white/5 transition-all border border-transparent hover:border-white/6"
            >
              <div className="w-10 h-14 rounded-lg overflow-hidden flex-shrink-0 border border-white/8 bg-black/30">
                <img src={game.cover} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-semibold truncate">{game.title}</p>
                <p className="text-white/25 text-[10px] truncate">{game.developerName}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-white/20 text-[9px]">{game.genre}</span>
                  <span className="text-cyan-400/40 text-[9px] flex items-center gap-0.5">
                    <Sparkles className="w-2.5 h-2.5" />{game.cardCount} cards
                  </span>
                </div>
              </div>
            </motion.button>
          ))
        )}
      </div>
    </div>
  );
}

function DeveloperCard({ dev, onClick, gameCount, cardCount }) {
  return (
    <motion.button
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => onClick(dev)}
      className="group relative w-full overflow-hidden rounded-2xl text-left transition-all border border-white/8 hover:border-cyan-400/20"
      style={{
        background: 'linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.02) 100%)',
        boxShadow: '0 12px 24px rgba(0,0,0,0.2)'
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/8 via-transparent to-purple-500/8 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative p-3.5 flex items-center gap-3 min-h-[108px]">
        <img src={dev.logo} alt={dev.name} className="w-12 h-12 rounded-xl object-cover border border-white/12 shadow-md flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-white font-semibold text-sm leading-tight truncate group-hover:text-cyan-200 transition-colors">{dev.name}</h3>
              <p className="text-white/42 text-[10px] mt-1 line-clamp-2">{dev.description}</p>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white/60 group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-0.5" />
          </div>
          <div className="flex flex-wrap items-center gap-1.5 mt-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/6 px-2 py-1 text-[10px] text-white/68 border border-white/8">
              <Gamepad2 className="w-3 h-3" /> {gameCount}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-cyan-400/8 px-2 py-1 text-[10px] text-cyan-200/80 border border-cyan-400/10">
              <Sparkles className="w-3 h-3" /> {cardCount}
            </span>
          </div>
        </div>
      </div>
    </motion.button>
  );
}

export default function DevEditionContent() {
  const { addToCart } = useCart();
  const [selectedGenre, setSelectedGenre] = useState(GENRE_TABS[0]);
  const [selectedDev, setSelectedDev] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentGames, setRecentGames] = useState(() => {
    try {
      const saved = localStorage.getItem('dev_edition_recent');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const allGamesFlat = useMemo(() => {
    let games = [];
    DEV_SPOTLIGHT_DATA.forEach(dev => {
      dev.games.forEach(game => {
        games.push({ ...game, developerName: dev.name, developerLogo: dev.logo, developerId: dev.id, cardCount: game.cards.length });
      });
    });
    return games;
  }, []);

  const filteredDevs = useMemo(() => {
    let devs = DEV_SPOTLIGHT_DATA.map(dev => ({
      ...dev,
      gameCount: dev.games.length,
      cardCount: dev.games.reduce((sum, g) => sum + g.cards.length, 0)
    }));
    if (selectedGenre.id !== 'all') {
      devs = devs.filter(dev => dev.games.some(g => g.genre.toLowerCase().replace(/\s+/g, '-').includes(selectedGenre.id)));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      devs = devs.filter(dev =>
        dev.name.toLowerCase().includes(q) || dev.description.toLowerCase().includes(q) || dev.games.some(g => g.title.toLowerCase().includes(q))
      );
    }
    return devs;
  }, [selectedGenre, searchQuery]);

  const devGames = useMemo(() => {
    if (!selectedDev) return [];
    return selectedDev.games.map(game => ({ ...game, developerName: selectedDev.name, developerLogo: selectedDev.logo, developerId: selectedDev.id, cardCount: game.cards.length }));
  }, [selectedDev]);

  const displayCards = useMemo(() => selectedGame?.cards || [], [selectedGame]);

  const trackRecentGame = useCallback((game) => {
    setRecentGames(prev => {
      const filtered = prev.filter(g => g.id !== game.id);
      const updated = [game, ...filtered].slice(0, 10);
      localStorage.setItem('dev_edition_recent', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleSelectDev = (dev) => { setSelectedDev(dev); setSelectedGame(null); };
  const handleSelectGame = (game) => {
    setSelectedGame(game);
    trackRecentGame(game);
    if (!selectedDev) {
      const dev = DEV_SPOTLIGHT_DATA.find(d => d.id === game.developerId);
      if (dev) setSelectedDev(dev);
    }
  };
  const handleBackToDevs = () => { setSelectedDev(null); setSelectedGame(null); };

  return (
    <div className="w-full h-full text-white font-sans flex flex-col relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 25%, #0d1117 50%, #1a1f2e 75%, #0f1419 100%)' }}>

      {/* Ambient glow */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[120px] mix-blend-screen" />
      </div>

      {/* Sub-nav bar with genre tabs */}
      <div className="relative z-10 flex-shrink-0">
        <div className="flex items-center px-4 py-2 gap-0" style={{ background: 'rgba(8, 12, 18, 0.5)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <span className="text-white/50 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap flex-shrink-0 mr-2 select-none hidden md:block">Dev Cards</span>
          <div className="flex-shrink-0 w-px h-6 mx-2 relative hidden md:block">
            <div className="absolute inset-x-0 top-0 bottom-0" style={{ background: 'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.15) 35%, rgba(255,255,255,0.15) 65%, transparent 100%)' }} />
          </div>
          <GenreScrollTabs tabs={GENRE_TABS} selectedTab={selectedGenre} onSelect={(t) => { setSelectedGenre(t); handleBackToDevs(); }} />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex min-h-0 relative z-10">

        {/* LEFT PANEL */}
        <div className="h-full flex flex-col overflow-hidden flex-shrink-0"
          style={{ width: '280px', minWidth: '280px', background: 'rgba(10, 14, 20, 0.65)', backdropFilter: 'blur(30px)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
          <AnimatePresence mode="wait">
            {!selectedDev ? (
              <motion.div key="quick-access" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                <QuickAccessPanel recentGames={recentGames} allGames={allGamesFlat} onSelectGame={handleSelectGame} />
              </motion.div>
            ) : (
              <motion.div key="dev-games" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="h-full flex flex-col">
                <div className="p-4 border-b border-white/6">
                  <div className="flex items-center gap-3 mb-1">
                    <button onClick={handleBackToDevs} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors border border-white/8">
                      <ChevronLeft className="w-4 h-4 text-white/60" />
                    </button>
                    <img src={selectedDev.logo} alt="" className="w-9 h-9 rounded-lg border border-white/15" />
                    <div className="flex-1 min-w-0">
                      <h2 className="text-white font-bold text-sm truncate">{selectedDev.name}</h2>
                      <p className="text-white/35 text-[10px]">{devGames.length} game{devGames.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2.5 space-y-1" style={{ scrollbarWidth: 'none' }}>
                  {devGames.map((game) => (
                    <motion.button key={game.id} onClick={() => handleSelectGame(game)} whileHover={{ x: 2 }}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all border ${selectedGame?.id === game.id ? 'bg-white/10 border-white/15' : 'bg-transparent border-transparent hover:bg-white/5 hover:border-white/6'}`}>
                      <div className="w-10 h-14 rounded-lg overflow-hidden flex-shrink-0 border border-white/8 bg-black/30">
                        <img src={game.cover} alt={game.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white text-xs font-semibold truncate">{game.title}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-white/30 text-[10px]">{game.genre}</span>
                          <span className="text-cyan-400/50 text-[10px] flex items-center gap-0.5"><Sparkles className="w-2.5 h-2.5" />{game.cardCount}</span>
                        </div>
                        <p className="text-white/20 text-[9px] mt-0.5">{game.year}</p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT PANEL */}
        <div className="flex-1 h-full overflow-hidden" style={{ background: 'rgba(8, 12, 18, 0.55)', backdropFilter: 'blur(20px)' }}>
          <AnimatePresence mode="wait">
            {selectedGame ? (
              <motion.div key={`cards-${selectedGame.id}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }} className="h-full flex flex-col">
                <div className="p-5 pb-3 border-b border-white/6 flex items-center gap-4">
                  <div className="w-12 h-16 rounded-lg overflow-hidden border border-white/10 flex-shrink-0">
                    <img src={selectedGame.cover} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-white font-bold text-lg truncate">{selectedGame.title}</h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge className="bg-white/10 text-white/70 border-white/20 text-[10px]">{selectedGame.genre}</Badge>
                      <span className="text-white/30 text-xs">{displayCards.length} cards</span>
                      <div className="w-px h-3 bg-white/15" />
                      <span className="text-white/25 text-[10px]">{selectedGame.developerName}</span>
                    </div>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-5" style={{ scrollbarWidth: 'none' }}>
                  {displayCards.length > 0 ? (
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                      {displayCards.map((card, i) => {
                        const rarityColor = card.rarity === 'Legendary' ? 'border-orange-500/50 text-orange-400' : card.rarity === 'Epic' ? 'border-purple-500/50 text-purple-400' : card.rarity === 'Rare' ? 'border-blue-500/50 text-blue-400' : 'border-slate-500/50 text-slate-400';
                        return (
                          <motion.div key={card.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                            onClick={() => addToCart({ id: `dev-card-${card.id}`, title: card.name, image: card.image || selectedGame.cover, price: parseFloat(String(card.price || '0').replace(/[^0-9.]/g, '')) || 4.99, type: 'card' })}
                            whileHover={{ scale: 1.05, y: -4 }}
                            className="aspect-[2.5/3.5] rounded-xl overflow-hidden cursor-pointer border border-white/10 hover:border-white/25 transition-all relative bg-slate-900/80 shadow-lg hover:shadow-xl hover:shadow-cyan-500/10">
                            <div className="relative w-full h-3/5 overflow-hidden">
                              <img src={card.image || selectedGame.cover} alt={card.name} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent" />
                            </div>
                            <div className="p-2 flex flex-col gap-1">
                              <h3 className="text-white font-bold text-[10px] leading-tight line-clamp-2">{card.name}</h3>
                              <div className="flex gap-1 flex-wrap">
                                <Badge variant="outline" className={`text-[8px] h-3.5 px-1 border ${rarityColor}`}>{card.rarity}</Badge>
                                <Badge variant="outline" className="text-[8px] h-3.5 px-1 border-white/15 text-white/40">{card.type}</Badge>
                              </div>
                              {card.price && <span className="text-cyan-400/70 text-[9px] font-semibold mt-0.5">{card.price}</span>}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="h-64 flex flex-col items-center justify-center text-slate-500">
                      <Layers className="w-12 h-12 mb-3 opacity-20" />
                      <p className="text-sm font-medium">No cards released yet</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : selectedDev ? (
              <motion.div key="dev-info" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col items-center justify-center text-center px-8">
                <img src={selectedDev.logo} alt="" className="w-20 h-20 rounded-2xl border border-white/15 shadow-2xl mb-6" />
                <h2 className="text-xl font-bold text-white/60 mb-2">{selectedDev.name}</h2>
                <p className="text-white/30 text-sm max-w-sm mb-4">{selectedDev.description}</p>
                <p className="text-white/20 text-xs">Select a game from the left to view its cards</p>
              </motion.div>
            ) : (
              <motion.div key="dev-listing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col">
                <div className="p-5 pb-4 border-b border-white/6 flex items-center gap-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                      <Users className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h2 className="text-white font-bold text-base">Developer Studios</h2>
                      <p className="text-white/35 text-[10px]">{filteredDevs.length} studio{filteredDevs.length !== 1 ? 's' : ''} available</p>
                    </div>
                  </div>
                  <div className="flex-1" />
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search studios or games..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-white/20 focus:bg-white/8 transition-all"
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-5" style={{ scrollbarWidth: 'none' }}>
                  {filteredDevs.length === 0 ? (
                    <div className="text-center py-20 text-white/20">
                      <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p className="text-sm font-medium">No studios found</p>
                      <p className="text-[10px] mt-1">Try a different genre or search term</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
                      {filteredDevs.map(dev => (
                        <DeveloperCard key={dev.id} dev={dev} onClick={handleSelectDev} gameCount={dev.gameCount} cardCount={dev.cardCount} />
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}