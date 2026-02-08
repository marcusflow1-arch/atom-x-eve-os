import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Plus, Minus, Sparkles, Star, TrendingDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function TradingWorkspaceBuy({ item, owned, marketPrice }) {
  const [quantity, setQuantity] = useState(1);

  // Mock sellers
  const sellers = [
    { name: 'MarketBot', price: marketPrice, stock: 5, rating: 5.0, verified: true },
    { name: 'TradeKing', price: Math.floor(marketPrice * 0.95), stock: 2, rating: 4.8, verified: true },
    { name: 'VaultDealer', price: Math.floor(marketPrice * 1.1), stock: 1, rating: 4.3, verified: false },
    { name: 'CryptoGhost', price: Math.floor(marketPrice * 0.88), stock: 3, rating: 4.6, verified: false },
  ];

  const bestPrice = Math.min(...sellers.map(s => s.price));

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-5 space-y-5">
      {/* Upgrade hint for owners */}
      {owned && (
        <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3.5 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-300 text-xs font-bold mb-0.5">Upgrade System</p>
            <p className="text-white/40 text-[10px] leading-relaxed">
              Buying a 2nd copy allows you to combine & upgrade this card to a higher tier at the Blacksmith.
            </p>
          </div>
        </div>
      )}

      {/* Quick Buy Section */}
      <div className="bg-cyan-900/15 border border-cyan-500/15 rounded-xl p-4 space-y-4">
        <h4 className="text-cyan-400 font-bold text-sm flex items-center gap-2">
          <ShoppingCart className="w-4 h-4" /> {owned ? 'Buy Another Copy' : 'Purchase Card'}
        </h4>

        {/* Quantity selector */}
        <div className="flex items-center justify-between">
          <span className="text-white/50 text-xs">Quantity</span>
          <div className="flex items-center gap-3">
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all">
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-white font-bold text-lg w-8 text-center">{quantity}</span>
            <button onClick={() => setQuantity(quantity + 1)} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="h-px bg-white/5" />

        {/* Best price info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-white/40">
            <TrendingDown className="w-3 h-3 text-cyan-400" />
            <span>Best price</span>
          </div>
          <span className="text-white font-bold text-sm">{bestPrice.toLocaleString()} <span className="text-white/30 text-xs">AGP</span></span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-white/60 text-sm font-medium">Total</span>
          <div className="flex items-baseline gap-1">
            <span className="text-white font-bold text-xl">{(bestPrice * quantity).toLocaleString()}</span>
            <span className="text-cyan-400 text-xs font-bold">AGP</span>
          </div>
        </div>

        <button className="w-full py-3.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm uppercase tracking-wider rounded-xl transition-all hover:shadow-lg hover:shadow-cyan-500/20 flex items-center justify-center gap-2">
          <ShoppingCart className="w-4 h-4" />
          {owned ? `Buy ${quantity} Copy${quantity > 1 ? 'ies' : ''}` : `Purchase for ${(bestPrice * quantity).toLocaleString()} AGP`}
        </button>
      </div>

      {/* Available Sellers */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Available Sellers</p>
          <Badge className="bg-white/5 text-white/40 border-white/10 text-[9px]">{sellers.length} listings</Badge>
        </div>
        <div className="space-y-2">
          {sellers.sort((a, b) => a.price - b.price).map((seller, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-cyan-400/20 transition-colors cursor-pointer group">
              <div className="w-9 h-9 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-xs font-bold">{seller.name.charAt(0)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-white text-xs font-medium">{seller.name}</p>
                  {seller.verified && <Badge className="bg-emerald-500/10 text-emerald-300 border-emerald-500/20 text-[7px] px-1 py-0">✓</Badge>}
                </div>
                <p className="text-white/30 text-[10px]">{seller.stock} in stock</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="flex items-center gap-0.5 text-yellow-400 text-[10px]">
                  <Star className="w-2.5 h-2.5 fill-current" />
                  {seller.rating}
                </div>
                <span className="text-white font-bold text-xs">{seller.price.toLocaleString()} <span className="text-white/30 text-[10px]">AGP</span></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}