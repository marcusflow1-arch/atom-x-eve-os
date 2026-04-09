import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import {
  Gamepad2, Sparkles, DollarSign, ChevronLeft, ShoppingCart, Search,
  LayoutGrid, Globe, Rocket, Crosshair, Map, Ghost, Monitor, Car, Layers,
  Star, Crown, ArrowRight
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useCart } from '@/components/CartContext';

const GENRE_TABS = [
  { id: 'all', name: 'All', icon: LayoutGrid },
  { id: 'action', name: 'Action', icon: Crosshair },
  { id: 'rpg', name: 'RPG', icon: Globe },
  { id: 'sci-fi', name: 'Sci-Fi', icon: Rocket },
  { id: 'fantasy', name: 'Fantasy', icon: Sparkles },
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
    <div className="relative flex-1 min-w-0">
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

export default function BlackMarketContent() {
  const { addToCart } = useCart();
  const [selectedGenre, setSelectedGenre] = useState(GENRE_TABS[0]);
  const [games, setGames] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [g, a] = await Promise.all([
          base44.entities.Game.list(),
          base44.entities.Achievement.list(),
        ]);
        setGames(g || []);
        setAchievements(a || []);
      } catch (e) {
        console.error('BlackMarket fetch error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredGames = useMemo(() => {
    let g = [...games];
    if (selectedGenre.id !== 'all') {
      g = g.filter(game => (game.genre || '').toLowerCase().includes(selectedGenre.id));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      g = g.filter(game => (game.title || '').toLowerCase().includes(q));
    }
    return g;
  }, [games, selectedGenre, searchQuery]);

  const gameCards = useMemo(() => {
    if (!selectedGame) return [];
    return achievements.filter(a => (a.game || '').toLowerCase() === (selectedGame.title || '').toLowerCase());
  }, [selectedGame, achievements]);

  const handleBuyCard = (card) => {
    const price = card.points ? Math.max(1.99, card.points * 0.1) : 4.99;
    addToCart({
      id: `bm-card-${card.id}`,
      title: card.title,
      image: card.icon || selectedGame?.cover_image,
      price,
      type: 'card',
    });
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-t-transparent border-cyan-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex min-h-0">
      {/* LEFT: Genre filter + game list */}
      <div className="h-full flex flex-col overflow-hidden flex-shrink-0"
        style={{ width: '225px', minWidth: '225px', background: 'rgba(10, 14, 20, 0.65)', backdropFilter: 'blur(30px)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>

        <div className="p-4 border-b border-white/6">
          <GenreScrollTabs tabs={GENRE_TABS} selectedTab={selectedGenre} onSelect={(t) => { setSelectedGenre(t); setSelectedGame(null); }} />
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search games..."
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-white/20"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2.5 space-y-1" style={{ scrollbarWidth: 'none' }}>
          {filteredGames.length === 0 ? (
            <div className="text-center py-16 text-white/20">
              <Gamepad2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">No games found</p>
            </div>
          ) : filteredGames.map(game => (
            <motion.button
              key={game.id}
              whileHover={{ x: 2 }}
              onClick={() => setSelectedGame(game)}
              className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all border ${
                selectedGame?.id === game.id ? 'bg-white/10 border-white/15' : 'bg-transparent border-transparent hover:bg-white/5 hover:border-white/6'
              }`}
            >
              <div className="w-10 h-14 rounded-lg overflow-hidden flex-shrink-0 border border-white/8 bg-black/30">
                {game.cover_image ? (
                  <img src={game.cover_image} alt={game.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Gamepad2 className="w-4 h-4 text-white/10" /></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white text-xs font-semibold truncate">{game.title}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-white/30 text-[10px]">{game.genre}</span>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* RIGHT: Cards grid */}
      <div className="flex-1 h-full overflow-hidden" style={{ background: 'rgba(8, 12, 18, 0.55)', backdropFilter: 'blur(20px)' }}>
        <AnimatePresence mode="wait">
          {selectedGame ? (
            <motion.div key={`cards-${selectedGame.id}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="h-full flex flex-col">
              <div className="p-5 pb-3 border-b border-white/6 flex items-center gap-4">
                <button onClick={() => setSelectedGame(null)} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/8">
                  <ChevronLeft className="w-4 h-4 text-white/60" />
                </button>
                <div className="w-12 h-16 rounded-lg overflow-hidden border border-white/10 flex-shrink-0">
                  {selectedGame.cover_image ? (
                    <img src={selectedGame.cover_image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-black/30 flex items-center justify-center"><Gamepad2 className="w-5 h-5 text-white/10" /></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-white font-bold text-lg truncate">{selectedGame.title}</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge className="bg-white/10 text-white/70 border-white/20 text-[10px]">{selectedGame.genre}</Badge>
                    <span className="text-white/30 text-xs">{gameCards.length} cards available</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5">
                {gameCards.length > 0 ? (
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {gameCards.map((card, i) => {
                      const rarityColor = card.rarity === 'Legendary' ? 'border-orange-500/50 text-orange-400' : card.rarity === 'Epic' ? 'border-purple-500/50 text-purple-400' : card.rarity === 'Rare' ? 'border-blue-500/50 text-blue-400' : card.rarity === 'Mythical' ? 'border-red-500/50 text-red-400' : 'border-slate-500/50 text-slate-400';
                      const price = card.points ? Math.max(1.99, (card.points * 0.1).toFixed(2)) : '4.99';
                      return (
                        <motion.div
                          key={card.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.02 }}
                          onClick={() => handleBuyCard(card)}
                          whileHover={{ scale: 1.05, y: -4 }}
                          className="aspect-[2.5/3.5] rounded-xl overflow-hidden cursor-pointer border border-white/10 hover:border-white/25 transition-all relative bg-slate-900/80 shadow-lg hover:shadow-xl hover:shadow-cyan-500/10"
                        >
                          <div className="relative w-full h-3/5 overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                            <span className="text-4xl">{card.icon || '🏆'}</span>
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent" />
                          </div>
                          <div className="p-2 flex flex-col gap-1">
                            <h3 className="text-white font-bold text-[10px] leading-tight line-clamp-2">{card.title}</h3>
                            <div className="flex gap-1 flex-wrap">
                              <Badge variant="outline" className={`text-[8px] h-3.5 px-1 border ${rarityColor}`}>{card.rarity}</Badge>
                              <Badge variant="outline" className="text-[8px] h-3.5 px-1 border-white/15 text-white/40">{card.category}</Badge>
                            </div>
                            <div className="flex items-center justify-between mt-0.5">
                              <span className="text-cyan-400/70 text-[9px] font-semibold">${price}</span>
                              <ShoppingCart className="w-3 h-3 text-white/20" />
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-slate-500">
                    <Layers className="w-12 h-12 mb-3 opacity-20" />
                    <p className="text-sm font-medium">No cards available for this game</p>
                    <p className="text-[10px] mt-1 text-white/20">Cards are created from Achievements in the admin panel.</p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div key="no-game" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col items-center justify-center text-center px-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/20 flex items-center justify-center mb-4">
                <DollarSign className="w-8 h-8 text-red-400/60" />
              </div>
              <h2 className="text-xl font-bold text-white/60 mb-2">Black Market</h2>
              <p className="text-white/30 text-sm max-w-sm mb-1">Browse games by genre and buy achievement cards directly.</p>
              <p className="text-white/20 text-xs">Select a game from the left to view its cards</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}