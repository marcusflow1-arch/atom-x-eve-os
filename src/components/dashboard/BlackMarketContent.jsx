import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import {
  Gamepad2, Sparkles, DollarSign, ChevronLeft, Search, Mic,
  LayoutGrid, Globe, Rocket, Crosshair, Map, Ghost, Monitor, Car,
  Star, Crown
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useCart } from '@/components/CartContext';
import LiquidGlassCard from '@/components/shared/LiquidGlassCard';

export default function BlackMarketContent({ cardSearchQuery = '' }) {
  const { addToCart } = useCart();
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
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      g = g.filter(game => (game.title || '').toLowerCase().includes(q));
    }
    return g;
  }, [games, searchQuery]);

  const gameCards = useMemo(() => {
    if (!selectedGame) return [];
    return achievements.filter(a => (a.game || '').toLowerCase() === (selectedGame.title || '').toLowerCase());
  }, [selectedGame, achievements]);

  const mysteryCards = useMemo(() => {
    const all = Array.from({ length: 70 }, (_, i) => ({ id: `mystery-${i + 1}`, label: `Card ${i + 1}` }));
    if (!cardSearchQuery.trim()) return all;
    const q = cardSearchQuery.toLowerCase();
    return all.filter(c => c.label.toLowerCase().includes(q));
  }, [cardSearchQuery]);

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

  const selectedCardDetails = useMemo(() => {
    if (!selectedMysteryCard) return null;
    return {
      title: selectedMysteryCard.label,
      rarity: ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'][cardRowIndex % 5],
      price: sellerRows[0]?.price,
      sellers: sellerRows.length,
    };
  }, [selectedMysteryCard, sellerRows, cardRowIndex]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-t-transparent border-cyan-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex min-h-0">
      {/* LEFT: Game list */}
      <div
        className="h-full flex flex-col overflow-hidden flex-shrink-0"
        style={{ width: '25%', minWidth: '200px', background: 'rgba(10, 14, 20, 0.65)', backdropFilter: 'blur(30px)', borderRight: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="p-4 border-b border-white/6">
          <div className="relative">
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
                <span className="text-white/30 text-[10px]">{game.genre}</span>
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

              <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                <div className="flex-1 min-h-0 overflow-hidden px-5 pt-3">
                  <div className="h-full rounded-t-2xl border border-white/6 border-b-0 bg-white/[0.02] flex flex-col overflow-hidden">
                    <div className="px-4 py-2 text-[11px] uppercase tracking-[0.25em] text-white/35">Seller List</div>
                    {selectedCardDetails && (
                      <div className="px-4 pb-2">
                        <div className="flex items-center justify-between gap-4 text-white/70">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-white truncate">{selectedCardDetails.title}</div>
                            <div className="text-[10px] uppercase tracking-[0.18em] text-white/35 mt-1">{selectedCardDetails.rarity} card</div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-cyan-300 text-sm font-bold">${selectedCardDetails.price}</div>
                            <div className="text-[10px] text-white/35">{selectedCardDetails.sellers} sellers</div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="mx-4 mb-2 h-px bg-white/10" />
                    <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2" style={{ scrollbarWidth: 'none' }}>
                      {(selectedMysteryCard ? sellerRows : []).map((seller) => (
                        <button key={seller.id} className="w-full text-left rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] px-3 py-2.5 transition-all">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-white text-sm font-semibold truncate">{seller.name}</div>
                              <div className="text-white/35 text-[10px] uppercase tracking-[0.18em] mt-1 truncate">{seller.type} · {seller.stock} available</div>
                            </div>
                            <div className="text-cyan-300 text-sm font-bold shrink-0">${seller.price}</div>
                          </div>
                        </button>
                      ))}
                      {!selectedMysteryCard && (
                        <div className="h-full min-h-[120px] flex items-center justify-center text-center text-white/25 text-xs px-4">Select a card below to view sellers.</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 px-5">
                  <div className="h-px bg-white/10" />
                  <div className="flex items-center px-1 py-2 text-[10px] uppercase tracking-[0.2em] text-white/35">
                    <div>Row {cardRowIndex + 1} / 10</div>
                  </div>
                </div>

                <div className="shrink-0 px-5 pb-2">
                  <div
                    className="flex gap-3 items-end"
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
                      <LiquidGlassCard key={card.id} onClick={() => setSelectedMysteryCard(card)} className={`aspect-[2.5/3.5] w-full max-w-[84px] p-0 translate-y-[1px] ${selectedMysteryCard?.id === card.id ? 'ring-1 ring-cyan-400/50 shadow-[0_0_20px_rgba(103,232,249,0.3)]' : ''}`}>
                        <div className="w-full h-full flex items-center justify-center rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(16px) saturate(180%)', WebkitBackdropFilter: 'blur(16px) saturate(180%)', border: '1px solid rgba(255,255,255,0.14)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), 0 4px 20px rgba(0,0,0,0.3)' }}>
                          <span className="text-white/50 text-3xl font-black" style={{ textShadow: '0 0 12px rgba(255,255,255,0.3)' }}>?</span>
                        </div>
                      </LiquidGlassCard>
                    ))}
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