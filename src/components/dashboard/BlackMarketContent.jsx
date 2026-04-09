import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import {
  Gamepad2, Sparkles, DollarSign, ChevronLeft, ShoppingCart, Search, Mic,
  LayoutGrid, Globe, Rocket, Crosshair, Map, Ghost, Monitor, Car, Layers,
  Star, Crown, ArrowRight
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useCart } from '@/components/CartContext';
import LiquidGlassCard from '@/components/shared/LiquidGlassCard';

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
  const [selectedMysteryCard, setSelectedMysteryCard] = useState(null);
  const [cardRowIndex, setCardRowIndex] = useState(0);

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

  const mysteryCards = useMemo(() => Array.from({ length: 70 }, (_, i) => ({
    id: `mystery-${i + 1}`,
    label: `Card ${i + 1}`,
  })), []);

  const visibleMysteryCards = useMemo(() => {
    const start = cardRowIndex * 7;
    return mysteryCards.slice(start, start + 7);
  }, [mysteryCards, cardRowIndex]);

  const sellerRows = useMemo(() => {
    if (!selectedMysteryCard) return [];
    return Array.from({ length: 10 }, (_, i) => ({
      id: `${selectedMysteryCard.id}-seller-${i + 1}`,
      name: `Seller ${i + 1}`,
      type: i % 3 === 0 ? 'Auction' : 'Sale',
      price: (4.99 + i * 1.75).toFixed(2),
      stock: 1 + (i % 4),
    }));
  }, [selectedMysteryCard]);

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
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-10 py-2 text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-white/20"
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center">
              <Mic className="w-3.5 h-3.5 text-white/45" />
            </button>
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

              <div className="flex-1 min-h-0 px-5 pt-5 pb-0 overflow-hidden">
                <div className="h-full">
                  <div className="min-h-0 h-full flex flex-col overflow-hidden">
                    <div className="px-4 py-2 text-[11px] uppercase tracking-[0.25em] text-white/35">Seller List</div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-2" style={{ scrollbarWidth: 'none' }}>
                      {(selectedMysteryCard ? sellerRows : []).map((seller) => (
                        <button
                          key={seller.id}
                          className="w-full text-left rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] px-3 py-3 transition-all"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="text-white text-sm font-semibold">{seller.name}</div>
                              <div className="text-white/35 text-[10px] uppercase tracking-[0.18em] mt-1">{seller.type} · {seller.stock} available</div>
                            </div>
                            <div className="text-cyan-300 text-sm font-bold">${seller.price}</div>
                          </div>
                        </button>
                      ))}
                      {!selectedMysteryCard && (
                        <div className="h-full min-h-[220px] flex items-center justify-center text-center text-white/25 text-xs px-4">Select a card below to view sellers.</div>
                      )}
                    </div>

                    <div className="px-4 py-3">
                      <div className="flex items-center justify-between gap-4 text-[10px] uppercase tracking-[0.2em] text-white/35">
                        <div>
                          Row {cardRowIndex + 1} / 10
                        </div>
                        <div className="flex items-center gap-2 text-white/40 normal-case tracking-normal text-xs w-[30%] min-w-[140px] justify-end">
                          <span>Search bar</span>
                          <Search className="w-3.5 h-3.5" />
                          <Mic className="w-3.5 h-3.5" />
                        </div>
                      </div>
                      <div
                        className="flex gap-3"
                        onWheel={(e) => {
                          e.preventDefault();
                          setCardRowIndex((prev) => {
                            if (e.deltaY > 0) return Math.min(9, prev + 1);
                            if (e.deltaY < 0) return Math.max(0, prev - 1);
                            return prev;
                          });
                        }}
                      >
                        {visibleMysteryCards.map((card) => (
                          <LiquidGlassCard key={card.id} onClick={() => setSelectedMysteryCard(card)} className={`aspect-[2.5/3.5] w-full max-w-[84px] p-0 ${selectedMysteryCard?.id === card.id ? 'shadow-[0_0_18px_rgba(103,232,249,0.22)]' : ''}`}>
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/10 via-white/[0.05] to-transparent">
                              <span className="text-white/75 text-3xl font-black">?</span>
                            </div>
                          </LiquidGlassCard>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
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