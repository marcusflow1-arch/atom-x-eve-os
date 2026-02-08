import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, DollarSign, ArrowLeftRight, Gavel, ShoppingCart, TrendingUp, 
  Star, Gamepad2, Trophy, Zap, Shield, User, Trees, Package,
  ChevronRight, Plus, Minus, Search, Clock, Sparkles
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const CATEGORY_CONFIG = {
  achievement: { icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', label: 'Achievement' },
  ability: { icon: Zap, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', label: 'Ability' },
  equipment: { icon: Shield, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', label: 'Equipment' },
  companion: { icon: User, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', label: 'Companion' },
  environment: { icon: Trees, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: 'Environment' },
};

const RARITY_COLORS = {
  Mythic: 'text-red-400 bg-red-500/10 border-red-500/30',
  Legendary: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  Epic: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
  Rare: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  Uncommon: 'text-green-400 bg-green-500/10 border-green-500/30',
  Common: 'text-slate-400 bg-slate-500/10 border-slate-500/30',
};

const PRICE_MAP = {
  Mythic: 95000, Legendary: 75000, Epic: 45000, Rare: 25000, Uncommon: 12000, Common: 5000
};

export default function InventoryMarketPanel({ item, owned, onClose }) {
  const [activeAction, setActiveAction] = useState(null); // 'sell' | 'trade' | 'bid' | 'buy'
  const [sellPrice, setSellPrice] = useState('');
  const [bidPrice, setBidPrice] = useState('');
  const [buyoutPrice, setBuyoutPrice] = useState('');
  const [tradeSeek, setTradeSeek] = useState('');
  const [quantity, setQuantity] = useState(1);

  if (!item) return null;

  const cfg = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.achievement;
  const Icon = cfg.icon;
  const rarity = RARITY_COLORS[item.rarity] || RARITY_COLORS.Common;
  const marketPrice = PRICE_MAP[item.rarity] || 10000;

  const actions = owned
    ? [
        { id: 'sell', label: 'Sell', icon: DollarSign, color: 'green', desc: 'List for a fixed price' },
        { id: 'trade', label: 'Trade', icon: ArrowLeftRight, color: 'blue', desc: 'Offer to trade' },
        { id: 'bid', label: 'Auction', icon: Gavel, color: 'purple', desc: 'Set up an auction' },
        { id: 'buy', label: 'Buy More', icon: ShoppingCart, color: 'cyan', desc: 'Stack for upgrades' },
      ]
    : [
        { id: 'buy', label: 'Buy Now', icon: ShoppingCart, color: 'cyan', desc: 'Purchase this card' },
        { id: 'trade', label: 'Trade For', icon: ArrowLeftRight, color: 'blue', desc: 'Offer a trade' },
        { id: 'bid', label: 'Find Auction', icon: Gavel, color: 'purple', desc: 'Bid on auctions' },
      ];

  const colorMap = {
    green: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400', btn: 'bg-green-600 hover:bg-green-500', glow: 'shadow-green-500/20' },
    blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', btn: 'bg-blue-600 hover:bg-blue-500', glow: 'shadow-blue-500/20' },
    purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400', btn: 'bg-purple-600 hover:bg-purple-500', glow: 'shadow-purple-500/20' },
    cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400', btn: 'bg-cyan-600 hover:bg-cyan-500', glow: 'shadow-cyan-500/20' },
  };

  return (
    <motion.div
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 40, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed top-0 right-0 bottom-0 w-[360px] xl:w-[420px] z-[69] flex flex-col overflow-hidden"
      style={{
        background: 'rgba(10, 14, 20, 0.75)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        boxShadow: '-10px 0 50px rgba(0,0,0,0.6)',
        borderLeft: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* Header with card preview */}
      <div className={`relative flex-shrink-0 p-5 ${cfg.bg} border-b border-white/5`}>
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-full bg-black/40 hover:bg-white/10 text-white/50 hover:text-white transition-colors backdrop-blur-md z-10">
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-4">
          <div className={`w-16 h-20 rounded-xl border-2 ${cfg.border} flex items-center justify-center relative overflow-hidden flex-shrink-0`}
            style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)' }}
          >
            <Icon className={`w-8 h-8 ${cfg.color} opacity-40`} />
            {!owned && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="text-[8px] font-bold text-white/60 uppercase">Locked</span>
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <Badge className={`text-[9px] border mb-1 ${rarity}`}>{item.rarity}</Badge>
            <h3 className="text-lg font-bold text-white leading-tight truncate">{item.name}</h3>
            <p className="text-white/40 text-xs truncate">{item.game} • {cfg.label}</p>
          </div>
        </div>

        {/* Market Price */}
        <div className="mt-3 flex items-center justify-between bg-black/20 rounded-lg px-3 py-2">
          <div className="flex items-center gap-1.5 text-white/50 text-xs">
            <TrendingUp className="w-3 h-3" />
            <span>Market Value</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-white font-bold text-lg">{(marketPrice).toLocaleString()}</span>
            <span className="text-cyan-400 text-[10px] font-bold">AGP</span>
          </div>
        </div>

        {owned && (
          <div className="mt-2 flex items-center gap-1.5 text-[10px] text-amber-400/80">
            <Sparkles className="w-3 h-3" />
            <span>Buy a 2nd copy to upgrade this card</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="p-4 space-y-2 border-b border-white/5">
        <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">
          {owned ? 'What do you want to do?' : 'How to get this card'}
        </p>
        <div className={`grid ${actions.length === 4 ? 'grid-cols-2' : 'grid-cols-3'} gap-2`}>
          {actions.map((action) => {
            const c = colorMap[action.color];
            const isActive = activeAction === action.id;
            return (
              <button
                key={action.id}
                onClick={() => setActiveAction(isActive ? null : action.id)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all text-center ${
                  isActive
                    ? `${c.bg} ${c.border} ${c.text} shadow-lg ${c.glow}`
                    : 'bg-white/[0.03] border-white/5 text-white/50 hover:bg-white/[0.06] hover:text-white'
                }`}
              >
                <action.icon className="w-5 h-5" />
                <span className="text-[11px] font-bold uppercase tracking-wider">{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Detail Area */}
      <div className="flex-1 overflow-y-auto p-4">
        <AnimatePresence mode="wait">
          {activeAction === 'sell' && owned && (
            <motion.div key="sell" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
              <div className="bg-green-900/20 border border-green-500/20 rounded-xl p-4">
                <h4 className="text-green-400 font-bold text-sm mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" /> Set Your Price
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] text-white/40 uppercase mb-1 block">Sale Price (AGP)</label>
                    <input
                      type="number"
                      value={sellPrice}
                      onChange={(e) => setSellPrice(e.target.value)}
                      placeholder={`Suggested: ${marketPrice.toLocaleString()}`}
                      className="w-full bg-black/30 border border-green-500/20 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-green-500/50"
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-white/30">
                    <span>Platform fee: 5%</span>
                    <span>You receive: {sellPrice ? Math.floor(parseInt(sellPrice) * 0.95).toLocaleString() : '---'} AGP</span>
                  </div>
                  <button className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold text-sm uppercase tracking-wider rounded-xl transition-all hover:shadow-lg hover:shadow-green-500/20">
                    List for Sale
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeAction === 'trade' && (
            <motion.div key="trade" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
              <div className="bg-blue-900/20 border border-blue-500/20 rounded-xl p-4">
                <h4 className="text-blue-400 font-bold text-sm mb-3 flex items-center gap-2">
                  <ArrowLeftRight className="w-4 h-4" /> {owned ? 'Trade This Card' : 'Offer a Trade'}
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] text-white/40 uppercase mb-1 block">
                      {owned ? 'What are you looking for?' : 'What will you offer?'}
                    </label>
                    <input
                      type="text"
                      value={tradeSeek}
                      onChange={(e) => setTradeSeek(e.target.value)}
                      placeholder="e.g. Void Walker Set, Neural Hack..."
                      className="w-full bg-black/30 border border-blue-500/20 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-blue-500/50"
                    />
                  </div>
                  <button className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm uppercase tracking-wider rounded-xl transition-all hover:shadow-lg hover:shadow-blue-500/20">
                    {owned ? 'Post Trade Listing' : 'Send Trade Request'}
                  </button>
                </div>
              </div>

              {/* Active Trade Listings */}
              <div>
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Active Trade Listings</p>
                {[
                  { user: 'VoidHunter', wants: 'Any Epic Equipment', rating: 4.8 },
                  { user: 'CyberNinja', wants: 'Legendary Ability Cards', rating: 4.5 },
                ].map((listing, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/5 mb-2 hover:bg-white/[0.06] transition-colors cursor-pointer">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-bold">{listing.user.charAt(0)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-medium">{listing.user}</p>
                      <p className="text-white/30 text-[10px] truncate">Wants: {listing.wants}</p>
                    </div>
                    <div className="flex items-center gap-1 text-yellow-400 text-[10px]">
                      <Star className="w-2.5 h-2.5 fill-current" />
                      {listing.rating}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeAction === 'bid' && (
            <motion.div key="bid" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
              <div className="bg-purple-900/20 border border-purple-500/20 rounded-xl p-4">
                <h4 className="text-purple-400 font-bold text-sm mb-3 flex items-center gap-2">
                  <Gavel className="w-4 h-4" /> {owned ? 'Start an Auction' : 'Bid on Auctions'}
                </h4>
                {owned ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-white/40 uppercase mb-1 block">Starting Bid</label>
                        <input
                          type="number"
                          value={bidPrice}
                          onChange={(e) => setBidPrice(e.target.value)}
                          placeholder="Min bid"
                          className="w-full bg-black/30 border border-purple-500/20 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-purple-500/50"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-white/40 uppercase mb-1 block">Buyout Price</label>
                        <input
                          type="number"
                          value={buyoutPrice}
                          onChange={(e) => setBuyoutPrice(e.target.value)}
                          placeholder="Instant buy"
                          className="w-full bg-black/30 border border-purple-500/20 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-purple-500/50"
                        />
                      </div>
                    </div>
                    <button className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm uppercase tracking-wider rounded-xl transition-all hover:shadow-lg hover:shadow-purple-500/20">
                      Start Auction
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Active auctions for this card */}
                    {[
                      { user: 'AuctionHouse', currentBid: Math.floor(marketPrice * 0.6), buyout: marketPrice, timeLeft: '4h 23m', bids: 8 },
                      { user: 'MarketBot', currentBid: Math.floor(marketPrice * 0.4), buyout: Math.floor(marketPrice * 0.9), timeLeft: '11h 05m', bids: 3 },
                    ].map((auction, i) => (
                      <div key={i} className="bg-black/20 border border-purple-500/10 rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-white text-xs font-medium">{auction.user}</span>
                          <div className="flex items-center gap-1 text-white/30 text-[10px]">
                            <Clock className="w-3 h-3" /> {auction.timeLeft}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-black/20 rounded px-2 py-1.5">
                            <p className="text-[9px] text-white/40 uppercase">Current Bid</p>
                            <p className="text-white font-bold text-sm">{auction.currentBid.toLocaleString()}</p>
                          </div>
                          <div className="bg-black/20 rounded px-2 py-1.5">
                            <p className="text-[9px] text-white/40 uppercase">Buyout</p>
                            <p className="text-white font-bold text-sm">{auction.buyout.toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <input type="number" placeholder="Your bid..." className="flex-1 bg-black/30 border border-purple-500/20 rounded px-2 py-1.5 text-white text-xs outline-none" />
                          <button className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded transition-all">Bid</button>
                          <button className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs font-bold rounded border border-purple-500/20 transition-all">Buyout</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeAction === 'buy' && (
            <motion.div key="buy" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
              <div className="bg-cyan-900/20 border border-cyan-500/20 rounded-xl p-4">
                <h4 className="text-cyan-400 font-bold text-sm mb-3 flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" /> {owned ? 'Buy Another Copy' : 'Purchase Card'}
                </h4>

                {owned && (
                  <div className="bg-black/20 rounded-lg p-3 mb-3 border border-amber-500/10">
                    <div className="flex items-center gap-2 text-amber-400 text-xs mb-1">
                      <Sparkles className="w-3 h-3" />
                      <span className="font-bold">Upgrade System</span>
                    </div>
                    <p className="text-white/40 text-[10px] leading-relaxed">
                      Buying a 2nd copy allows you to combine & upgrade this card to a higher tier at the Blacksmith.
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  {/* Quantity selector */}
                  <div className="flex items-center justify-between">
                    <span className="text-white/50 text-xs">Quantity</span>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-white font-bold text-lg w-6 text-center">{quantity}</span>
                      <button onClick={() => setQuantity(quantity + 1)} className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="h-px bg-white/5" />

                  <div className="flex items-center justify-between">
                    <span className="text-white/50 text-xs">Total</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-white font-bold text-xl">{(marketPrice * quantity).toLocaleString()}</span>
                      <span className="text-cyan-400 text-xs font-bold">AGP</span>
                    </div>
                  </div>

                  <button className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm uppercase tracking-wider rounded-xl transition-all hover:shadow-lg hover:shadow-cyan-500/20">
                    {owned ? `Buy ${quantity} Copy${quantity > 1 ? 'ies' : ''}` : `Purchase for ${(marketPrice * quantity).toLocaleString()} AGP`}
                  </button>
                </div>

                {/* Available sellers */}
                <div className="mt-4">
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Available From</p>
                  {[
                    { name: 'MarketBot', price: marketPrice, stock: 5 },
                    { name: 'TradeKing', price: Math.floor(marketPrice * 0.95), stock: 2 },
                    { name: 'VaultDealer', price: Math.floor(marketPrice * 1.1), stock: 1 },
                  ].map((seller, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.03] border border-white/5 mb-1.5 hover:bg-white/[0.06] transition-colors cursor-pointer">
                      <div className="w-7 h-7 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-[10px] font-bold">{seller.name.charAt(0)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-medium">{seller.name}</p>
                        <p className="text-white/30 text-[10px]">{seller.stock} in stock</p>
                      </div>
                      <span className="text-white font-bold text-xs">{seller.price.toLocaleString()} <span className="text-white/30">AGP</span></span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {!activeAction && (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="w-12 h-12 text-white/10 mb-3" />
              <p className="text-white/30 text-sm">Select an action above</p>
              <p className="text-white/15 text-xs mt-1">to manage this card</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}