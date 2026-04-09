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
      {/* Header */}
      <div className="p-5 pb-3 border-b border-white/6 flex items-center gap-4 justify-between">
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
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-white/50 whitespace-nowrap">Search Cart</span>
          <button className="w-5 h-5 flex items-center justify-center text-white/40 hover:text-white/60 transition-colors">
            <Mic className="w-3.5 h-3.5" />
          </button>
          <div className="relative flex items-center">
            <Search className="absolute left-2 w-3 h-3 text-white/30 pointer-events-none" />
            <input
              value={cardSearchQuery}
              onChange={(e) => onCardSearch(e.target.value)}
              placeholder=""
              className="bg-white/5 border border-white/10 rounded-md pl-7 pr-3 py-1 text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-white/20 w-24"
            />
          </div>
        </div>
      </div>

      {/* Sellers list */}
      <div className="flex-1 min-h-0 overflow-hidden px-5 pt-3">
        <div className="h-full flex flex-col overflow-hidden">
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
      </div>

      {/* Card row indicator */}
      <div className="shrink-0 px-5">
        <div className="h-px bg-white/10" />
        <div className="flex items-center px-1 py-2 text-[10px] uppercase tracking-[0.2em] text-white/35">
          Row {cardRowIndex + 1} / 10
        </div>
      </div>

      {/* Mystery cards strip */}
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
            <LiquidGlassCard
              key={card.id}
              onClick={() => setSelectedMysteryCard(card)}
              className={`aspect-[2.5/3.5] w-full max-w-[84px] p-0 translate-y-[1px] ${selectedMysteryCard?.id === card.id ? 'ring-1 ring-cyan-400/50 shadow-[0_0_20px_rgba(103,232,249,0.3)]' : ''}`}
            >
              <div className="w-full h-full flex items-center justify-center rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(16px) saturate(180%)', WebkitBackdropFilter: 'blur(16px) saturate(180%)', border: '1px solid rgba(255,255,255,0.14)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), 0 4px 20px rgba(0,0,0,0.3)' }}>
                <span className="text-white/50 text-3xl font-black" style={{ textShadow: '0 0 12px rgba(255,255,255,0.3)' }}>?</span>
              </div>
            </LiquidGlassCard>
          ))}
        </div>
      </div>
    </div>
  );
}