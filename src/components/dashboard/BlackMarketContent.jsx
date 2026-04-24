import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Gamepad2, DollarSign, ChevronLeft, Star, Search, Mic } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import LiquidGlassCard from '@/components/shared/LiquidGlassCard';

export default function BlackMarketContent({ cardSearchQuery = '', onCardSearch = () => {}, selectedGame }) {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMysteryCard, setSelectedMysteryCard] = useState(null);
  const [cardRowIndex, setCardRowIndex] = useState(0);
  const [sellerFilter, setSellerFilter] = useState('highest');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const a = await base44.entities.Achievement.list();
        setAchievements(a || []);
      } catch (e) {
        console.error('BlackMarket fetch error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Reset card selection when game changes
  useEffect(() => {
    setSelectedMysteryCard(null);
    setCardRowIndex(0);
  }, [selectedGame?.id]);

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
    const rows = Array.from({ length: 10 }, (_, i) => ({
      id: `${selectedMysteryCard.id}-seller-${i + 1}`,
      name: `Seller ${i + 1}`,
      price: parseFloat((4.99 + i * 1.75).toFixed(2)),
      isBid: i % 3 === 2,
    }));
    if (sellerFilter === 'highest') return [...rows].sort((a, b) => b.price - a.price);
    if (sellerFilter === 'lowest') return [...rows].sort((a, b) => a.price - b.price);
    if (sellerFilter === 'bid') return rows.filter(r => r.isBid);
    return rows;
  }, [selectedMysteryCard, sellerFilter]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-t-transparent border-cyan-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!selectedGame) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/20 flex items-center justify-center mb-4">
          <DollarSign className="w-8 h-8 text-red-400/60" />
        </div>
        <h2 className="text-xl font-bold text-white/60 mb-2">Black Market</h2>
        <p className="text-white/30 text-sm max-w-sm">Select a game from the left panel to view its cards.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-5 pb-3 border-b border-white/6 flex items-center gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
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
            </div>
          </div>
        </div>
      </div>

      {/* Main content: LEFT (70%) + RIGHT (30%) */}
      <div className="flex-1 flex gap-4 overflow-hidden px-5 pt-3 pb-3">
        {/* LEFT: Sellers List (70%) */}
        <div className="w-[70%] flex flex-col border-r border-white/10 pr-4 overflow-hidden">
          {/* Header row: Sellers | filter chips | Price */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] uppercase tracking-[0.25em] text-white/35 shrink-0">Sellers</span>
            <div className="flex items-center gap-1 flex-1">
              {[
                { key: 'highest', label: 'Highest' },
                { key: 'lowest', label: 'Lowest' },
                { key: 'bid', label: 'Bid' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setSellerFilter(key)}
                  className={`px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wide transition-all border ${
                    sellerFilter === key
                      ? 'bg-white/20 border-white/30 text-white'
                      : 'border-white/10 text-white/40 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <span className="text-[11px] uppercase tracking-[0.25em] text-white/35 shrink-0">Price</span>
          </div>
          <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
            {(selectedMysteryCard ? sellerRows : []).map((seller) => (
              <div key={seller.id}>
                <div className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm">{seller.name}</span>
                    {seller.isBid && <span className="text-[9px] uppercase tracking-wide text-amber-400/80 border border-amber-400/30 px-1.5 py-0.5 rounded-full">Bid</span>}
                  </div>
                  <span className="text-cyan-300 text-sm font-semibold">${seller.price.toFixed(2)}</span>
                </div>
                <div className="h-px bg-white/10" />
              </div>
            ))}
            {!selectedMysteryCard && (
              <div className="py-8 text-center text-white/25 text-xs">Select a card below to view sellers.</div>
            )}
          </div>
        </div>

        {/* RIGHT: Mystery Cards Grid (30%) */}
        <div className="w-[30%] flex flex-col pl-4 overflow-hidden">
          {/* Search Bar */}
          <div className="pb-3 mb-3 border-b border-white/6 flex items-center">
            <div className="relative flex items-center flex-1">
              <Search className="absolute left-2 w-3 h-3 text-white/30 pointer-events-none" />
              <input
                value={cardSearchQuery}
                onChange={(e) => onCardSearch(e.target.value)}
                placeholder="search cars"
                className="bg-white/5 border border-white/10 rounded-md pl-7 pr-8 py-1 text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-white/20 w-full"
              />
              <button className="absolute right-2 w-4 h-4 flex items-center justify-center text-white/40 hover:text-white/60 transition-colors">
                <Mic className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div className="text-[11px] uppercase tracking-[0.25em] text-white/35 mb-2">Cards</div>
          <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
            <div className="space-y-2">
              {mysteryCards.length === 0 ? (
                <div className="text-center text-white/25 text-xs py-8">No cards</div>
              ) : (
                Array.from({ length: Math.ceil(mysteryCards.length / 4) }, (_, rowIdx) => {
                  const rowStart = rowIdx * 4;
                  const rowCards = mysteryCards.slice(rowStart, rowStart + 4);
                  return (
                    <div key={`row-${rowIdx}`} className="flex gap-2">
                      {rowCards.map((card) => (
                        <div key={card.id} className="flex-1 flex flex-col items-center gap-1">
                          <LiquidGlassCard
                            onClick={() => setSelectedMysteryCard(card)}
                            className={`w-full aspect-[2.5/3.5] p-0 cursor-pointer ${selectedMysteryCard?.id === card.id ? 'ring-1 ring-cyan-400/50' : ''}`}
                          >
                            <div className="w-full h-full flex items-center justify-center rounded-lg overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                              <span className="text-white/40 text-xl font-black">?</span>
                            </div>
                          </LiquidGlassCard>
                          <span className="text-white/50 text-[9px] font-medium text-center leading-tight truncate w-full px-0.5">{card.name || card.title || 'Unknown'}</span>
                        </div>
                      ))}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

{/* OLD CODE REMOVED */}