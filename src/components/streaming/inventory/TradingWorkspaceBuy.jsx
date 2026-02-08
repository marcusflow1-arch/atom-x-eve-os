import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Plus, Minus, Sparkles, Star, TrendingDown, ChevronDown, SlidersHorizontal, ArrowUpDown, Store, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function TradingWorkspaceBuy({ item, owned, marketPrice }) {
  const [sortBy, setSortBy] = useState('price_low'); // price_low | price_high | rating | stock
  const [showFilters, setShowFilters] = useState(false);
  const [expandedSeller, setExpandedSeller] = useState(null);
  const [quantities, setQuantities] = useState({});

  // Mock sellers — players AND the platform
  const allSellers = [
    { id: 's0', name: 'ATOM×EVE Platform', price: Math.floor(marketPrice * 1.15), stock: 10, rating: 5.0, verified: true, isPlatform: true, note: 'Official release — guaranteed authentic.' },
    { id: 's1', name: 'TradeKing', price: Math.floor(marketPrice * 0.95), stock: 2, rating: 4.8, verified: true, isPlatform: false, note: 'Fast delivery, bulk discount available.' },
    { id: 's2', name: 'CryptoGhost', price: Math.floor(marketPrice * 0.88), stock: 3, rating: 4.6, verified: false, isPlatform: false, note: 'Cheapest on market right now.' },
    { id: 's3', name: 'VaultDealer', price: Math.floor(marketPrice * 1.1), stock: 1, rating: 4.3, verified: false, isPlatform: false, note: 'Mint condition, never equipped.' },
    { id: 's4', name: 'ShadowLord', price: Math.floor(marketPrice * 0.78), stock: 1, rating: 3.9, verified: false, isPlatform: false, note: 'Quick sale — need AGP for auction.' },
    { id: 's5', name: 'GalacticTrader', price: Math.floor(marketPrice * 1.02), stock: 4, rating: 4.9, verified: true, isPlatform: false, note: 'Trusted seller, 500+ transactions.' },
    { id: 's6', name: 'NovaStar', price: Math.floor(marketPrice * 0.92), stock: 2, rating: 4.7, verified: true, isPlatform: false, note: 'Clan member discount if you message me.' },
  ];

  const sortedSellers = useMemo(() => {
    const arr = [...allSellers];
    switch (sortBy) {
      case 'price_low': arr.sort((a, b) => a.price - b.price); break;
      case 'price_high': arr.sort((a, b) => b.price - a.price); break;
      case 'rating': arr.sort((a, b) => b.rating - a.rating); break;
      case 'stock': arr.sort((a, b) => b.stock - a.stock); break;
      default: break;
    }
    // Always pin platform to top option
    const platform = arr.find(s => s.isPlatform);
    const others = arr.filter(s => !s.isPlatform);
    return platform ? [platform, ...others] : others;
  }, [sortBy, marketPrice]);

  const bestPlayerPrice = Math.min(...allSellers.filter(s => !s.isPlatform).map(s => s.price));

  const getQty = (id) => quantities[id] || 1;
  const setQty = (id, val) => setQuantities(prev => ({ ...prev, [id]: Math.max(1, val) }));

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-5 space-y-4">

      {/* Upgrade hint for owners */}
      {owned && (
        <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3 flex items-start gap-3">
          <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-300 text-[11px] font-bold mb-0.5">Stack for Upgrades</p>
            <p className="text-white/40 text-[10px] leading-relaxed">Buy additional copies to combine & upgrade at the Blacksmith.</p>
          </div>
        </div>
      )}

      {/* Header + Sort */}
      <div className="flex items-center justify-between">
        <h4 className="text-cyan-400 font-bold text-sm flex items-center gap-2">
          <ShoppingCart className="w-4 h-4" /> {owned ? 'Buy More Copies' : 'Purchase This Card'}
        </h4>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[10px] text-white/30">
            <TrendingDown className="w-3 h-3 text-cyan-400" />
            Best: <span className="text-white font-bold">{bestPlayerPrice.toLocaleString()}</span> AGP
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`p-1.5 rounded-lg border transition-all ${showFilters ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-300' : 'bg-white/5 border-white/10 text-white/40 hover:text-white'}`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Sort Options */}
      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="flex flex-wrap gap-1.5 mb-2">
              {[
                { val: 'price_low', label: 'Price: Low→High' },
                { val: 'price_high', label: 'Price: High→Low' },
                { val: 'rating', label: 'Best Rated' },
                { val: 'stock', label: 'Most Stock' },
              ].map((opt) => (
                <button key={opt.val} onClick={() => setSortBy(opt.val)}
                  className={`px-2.5 py-1.5 rounded-lg text-[9px] font-bold border transition-all ${
                    sortBy === opt.val ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-300' : 'bg-white/[0.03] border-white/5 text-white/35 hover:text-white/60'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Seller Listings */}
      <div className="space-y-2">
        {sortedSellers.map((seller) => {
          const isExpanded = expandedSeller === seller.id;
          const qty = getQty(seller.id);
          return (
            <div key={seller.id} className={`rounded-xl border overflow-hidden transition-all ${
              seller.isPlatform
                ? isExpanded ? 'border-cyan-500/40 shadow-lg shadow-cyan-500/10 bg-cyan-900/15' : 'border-cyan-500/20 bg-cyan-900/10 hover:border-cyan-500/30'
                : isExpanded ? 'border-white/20 shadow-lg bg-white/[0.05]' : 'border-white/5 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/15'
            }`}>
              {/* Summary Row */}
              <div onClick={() => setExpandedSeller(isExpanded ? null : seller.id)} className="flex items-center gap-3 p-3 cursor-pointer">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  seller.isPlatform ? 'bg-cyan-500/30 text-cyan-300' : 'bg-white/10 text-white/60'
                }`}>
                  {seller.isPlatform ? <Store className="w-4 h-4" /> : seller.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-white text-xs font-medium">{seller.name}</p>
                    {seller.verified && <Badge className="bg-emerald-500/10 text-emerald-300 border-emerald-500/20 text-[7px] px-1 py-0">✓</Badge>}
                    {seller.isPlatform && <Badge className="bg-cyan-500/10 text-cyan-300 border-cyan-500/20 text-[7px] px-1 py-0">Official</Badge>}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex items-center gap-0.5 text-yellow-400 text-[9px]">
                      <Star className="w-2 h-2 fill-current" /> {seller.rating}
                    </div>
                    <span className="text-white/20 text-[8px]">•</span>
                    <span className="text-white/30 text-[9px]">{seller.stock} in stock</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-white font-bold text-sm">{seller.price.toLocaleString()} <span className="text-white/30 text-[10px]">AGP</span></span>
                  <ChevronDown className={`w-3.5 h-3.5 text-white/30 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
              </div>

              {/* Expanded: Buy from this seller */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="px-3 pb-3 pt-1 space-y-3 border-t border-white/5">
                      {seller.note && (
                        <div className="bg-black/20 rounded-lg p-2.5">
                          <p className="text-[10px] text-white/30 uppercase tracking-wider mb-0.5">Seller Note</p>
                          <p className="text-white/60 text-xs">{seller.note}</p>
                        </div>
                      )}

                      {/* Quantity & Total */}
                      <div className="flex items-center justify-between">
                        <span className="text-white/50 text-xs">Quantity</span>
                        <div className="flex items-center gap-2">
                          <button onClick={(e) => { e.stopPropagation(); setQty(seller.id, qty - 1); }} className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-white font-bold text-sm w-6 text-center">{qty}</span>
                          <button onClick={(e) => { e.stopPropagation(); setQty(seller.id, Math.min(seller.stock, qty + 1)); }} className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-white/60 text-xs font-medium">Total</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-white font-bold text-lg">{(seller.price * qty).toLocaleString()}</span>
                          <span className="text-cyan-400 text-xs font-bold">AGP</span>
                        </div>
                      </div>

                      <button className={`w-full py-3 font-bold text-sm uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 ${
                        seller.isPlatform
                          ? 'bg-cyan-600 hover:bg-cyan-500 text-white hover:shadow-lg hover:shadow-cyan-500/20'
                          : 'bg-white/10 hover:bg-white/15 text-white border border-white/10 hover:border-white/20'
                      }`}>
                        <ShoppingCart className="w-4 h-4" />
                        Buy {qty > 1 ? `${qty} Copies` : ''} from {seller.isPlatform ? 'Platform' : seller.name}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}