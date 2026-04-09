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
    return Array.from({ length: 10 }, (_, i) => ({
      id: `${selectedMysteryCard.id}-seller-${i + 1}`,
      name: `Seller ${i + 1}`,
      price: (4.99 + i * 1.75).toFixed(2),
    }));
  }, [selectedMysteryCard]);

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
      {/* Header - Search Bar Only */}
      <div className="px-5 pt-3 pb-3 border-b border-white/6 flex items-center">
        <div className="relative flex items-center flex-1">
          <Search className="absolute left-2 w-3 h-3 text-white/30 pointer-events-none" />
          <input
            value={cardSearchQuery}
            onChange={(e) => onCardSearch(e.target.value)}
            placeholder="search cards"
            className="bg-white/5 border border-white/10 rounded-md pl-7 pr-8 py-1 text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-white/20 w-full"
          />
          <button className="absolute right-2 w-4 h-4 flex items-center justify-center text-white/40 hover:text-white/60 transition-colors">
            <Mic className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Main content: LEFT (70%) + RIGHT (30%) */}
      <div className="flex-1 flex gap-0 overflow-hidden">
        {/* LEFT: Sellers List (70%) */}
        <div className="w-[70%] flex flex-col px-5 pt-3 pb-3 overflow-hidden">
          <div className="text-[11px] uppercase tracking-[0.25em] text-white/35 mb-2">Sellers</div>
          <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
            {(selectedMysteryCard ? sellerRows : []).map((seller) => (
              <div key={seller.id}>
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-white text-sm">{seller.name}</span>
                  <span className="text-cyan-300 text-sm font-semibold">${seller.price}</span>
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
        <div className="w-[30%] flex flex-col border-l border-white/6 px-5 pt-3 pb-3 overflow-hidden">
          <div className="text-[11px] uppercase tracking-[0.25em] text-white/35 mb-2">Cards</div>
          <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
            <div className="space-y-2">
              {mysteryCards.length === 0 ? (
                <div className="text-center text-white/25 text-xs py-8">No cards</div>
              ) : (
                Array.from({ length: Math.ceil(mysteryCards.length / 5) }, (_, rowIdx) => {
                  const rowStart = rowIdx * 5;
                  const rowCards = mysteryCards.slice(rowStart, rowStart + 5);
                  return (
                    <div key={`row-${rowIdx}`} className="flex gap-1.5">
                      {rowCards.map((card) => (
                        <LiquidGlassCard
                          key={card.id}
                          onClick={() => setSelectedMysteryCard(card)}
                          className={`flex-1 aspect-[2.5/3.5] p-0 cursor-pointer ${selectedMysteryCard?.id === card.id ? 'ring-1 ring-cyan-400/50' : ''}`}
                        >
                          <div className="w-full h-full flex items-center justify-center rounded-lg overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <span className="text-white/40 text-lg font-black">?</span>
                          </div>
                        </LiquidGlassCard>
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