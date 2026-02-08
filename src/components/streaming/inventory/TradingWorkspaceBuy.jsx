import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Plus, Minus, Sparkles, Star, TrendingDown, SlidersHorizontal, ArrowUpDown, Store, User, Clock, ChevronDown, Filter, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useCart } from '../../CartContext';

export default function TradingWorkspaceBuy({ item, owned, marketPrice }) {
  const [sortBy, setSortBy] = useState('price_low');
  const [filterVerified, setFilterVerified] = useState('all'); // all | verified | unverified
  const [filterPriceRange, setFilterPriceRange] = useState('all'); // all | under_market | at_market | over_market
  const [filterStock, setFilterStock] = useState('all'); // all | single | bulk
  const [showFilters, setShowFilters] = useState(false);
  const [expandedSeller, setExpandedSeller] = useState(null);
  const [quantities, setQuantities] = useState({});
  const { addToCart } = useCart();

  const handleBuyFromSeller = (seller, qty) => {
    addToCart({
      id: `buy-${seller.id}-${Date.now()}`,
      title: `${item.name} ×${qty} (from ${seller.name})`,
      type: seller.isPlatform ? 'platform_purchase' : 'player_purchase',
      price: seller.price * qty,
      image: item.image,
      seller: seller.name,
      itemName: item.name,
      itemCategory: item.category,
      itemRarity: item.rarity,
      quantity: qty,
    });
  };

  // Large mock seller pool (50+)
  const allSellers = useMemo(() => {
    const names = [
      'ATOM×EVE Platform', 'TradeKing', 'CryptoGhost', 'VaultDealer', 'ShadowLord',
      'GalacticTrader', 'NovaStar', 'IronFist', 'BladeRunner', 'CyberVixen',
      'PhantomX', 'StarDust', 'NebulaHawk', 'TitanForge', 'RuneMaster',
      'VoidWalker', 'ArcaneDealer', 'NightShade', 'SteelNerve', 'MysticTrader',
      'CrimsonBlade', 'FrostByte', 'ThunderClaw', 'SilverFox', 'DarkMatter',
      'PixelPunk', 'OmegaVault', 'ZenithStar', 'EchoFlame', 'WarpDrive',
      'CosmicDust', 'NeonEdge', 'QuantumLeap', 'BlazeTrail', 'ShadowPact',
      'IronVeil', 'StormBreaker', 'LunarTide', 'SolarFlare', 'AbyssWatcher',
      'GrimReaper', 'FateWeaver', 'ChronoShift', 'CipherLock', 'VortexRider',
      'HexBound', 'MirageX', 'OnyxKnight', 'EmberSoul', 'PrismHeart',
    ];
    return names.map((name, i) => {
      const isPlatform = i === 0;
      const priceMulti = isPlatform ? 1.15 : (0.7 + Math.random() * 0.6);
      const stock = isPlatform ? 10 : Math.ceil(Math.random() * 5);
      const rating = isPlatform ? 5.0 : parseFloat((3.5 + Math.random() * 1.5).toFixed(1));
      const verified = isPlatform || Math.random() > 0.5;
      const listedMinutes = Math.floor(Math.random() * 2880);
      const listedLabel = listedMinutes < 60 ? `${listedMinutes}m ago` : listedMinutes < 1440 ? `${Math.floor(listedMinutes / 60)}h ago` : `${Math.floor(listedMinutes / 1440)}d ago`;
      return {
        id: `s${i}`,
        name,
        price: Math.floor(marketPrice * priceMulti),
        stock,
        rating,
        verified,
        isPlatform,
        listedMinutes,
        listedLabel,
      };
    });
  }, [marketPrice]);

  const filteredSellers = useMemo(() => {
    let result = [...allSellers];

    if (filterVerified === 'verified') result = result.filter(s => s.verified);
    if (filterVerified === 'unverified') result = result.filter(s => !s.verified);

    if (filterPriceRange === 'under_market') result = result.filter(s => s.price < marketPrice * 0.95);
    if (filterPriceRange === 'at_market') result = result.filter(s => s.price >= marketPrice * 0.95 && s.price <= marketPrice * 1.05);
    if (filterPriceRange === 'over_market') result = result.filter(s => s.price > marketPrice * 1.05);

    if (filterStock === 'single') result = result.filter(s => s.stock === 1);
    if (filterStock === 'bulk') result = result.filter(s => s.stock > 1);

    switch (sortBy) {
      case 'price_low': result.sort((a, b) => a.price - b.price); break;
      case 'price_high': result.sort((a, b) => b.price - a.price); break;
      case 'rating': result.sort((a, b) => b.rating - a.rating); break;
      case 'stock': result.sort((a, b) => b.stock - a.stock); break;
      case 'newest': result.sort((a, b) => a.listedMinutes - b.listedMinutes); break;
      case 'oldest': result.sort((a, b) => b.listedMinutes - a.listedMinutes); break;
      default: break;
    }

    // Pin platform
    const platform = result.find(s => s.isPlatform);
    const others = result.filter(s => !s.isPlatform);
    return platform ? [platform, ...others] : others;
  }, [sortBy, filterVerified, filterPriceRange, filterStock, marketPrice, allSellers]);

  const bestPlayerPrice = Math.min(...allSellers.filter(s => !s.isPlatform).map(s => s.price));
  const getQty = (id) => quantities[id] || 1;
  const setQty = (id, val) => setQuantities(prev => ({ ...prev, [id]: Math.max(1, val) }));

  const activeFilters = [filterVerified !== 'all', filterPriceRange !== 'all', filterStock !== 'all'].filter(Boolean).length;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-5 flex flex-col h-full min-h-0">

      {/* Top Bar: Title + Filters */}
      <div className="flex-shrink-0 space-y-3 mb-4">
        {/* Upgrade hint */}
        {owned && (
          <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg p-2.5 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <p className="text-amber-300/80 text-[10px] font-medium">Buy additional copies to combine & upgrade at the Blacksmith.</p>
          </div>
        )}

        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h4 className="text-cyan-400 font-bold text-sm flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" /> {owned ? 'Buy More Copies' : 'Purchase This Card'}
            </h4>
            <Badge className="bg-white/5 text-white/40 border-white/10 text-[9px]">
              {filteredSellers.length} listings
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-[10px] text-white/30">
              <TrendingDown className="w-3 h-3 text-cyan-400" />
              Best: <span className="text-white font-bold">{bestPlayerPrice.toLocaleString()}</span> AGP
            </div>
            <button onClick={() => setShowFilters(!showFilters)}
              className={`p-1.5 rounded-lg border transition-all relative ${showFilters ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-300' : 'bg-white/5 border-white/10 text-white/40 hover:text-white'}`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              {activeFilters > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-cyan-500 text-black text-[7px] font-bold rounded-full flex items-center justify-center">{activeFilters}</span>
              )}
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="space-y-3 pb-2">
                {/* Sort */}
                <div>
                  <label className="text-[9px] text-white/30 uppercase tracking-widest mb-1.5 block flex items-center gap-1">
                    <ArrowUpDown className="w-2.5 h-2.5" /> Sort By
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { val: 'price_low', label: 'Price: Low→High' },
                      { val: 'price_high', label: 'Price: High→Low' },
                      { val: 'rating', label: 'Best Rated' },
                      { val: 'stock', label: 'Most Stock' },
                      { val: 'newest', label: 'Newest' },
                      { val: 'oldest', label: 'Oldest' },
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
                </div>

                {/* Filters row */}
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-[9px] text-white/30 uppercase tracking-widest mb-1.5 block flex items-center gap-1">
                      <Filter className="w-2.5 h-2.5" /> Seller
                    </label>
                    <div className="flex gap-1.5">
                      {[{ val: 'all', label: 'All' }, { val: 'verified', label: 'Verified' }, { val: 'unverified', label: 'Unverified' }].map((opt) => (
                        <button key={opt.val} onClick={() => setFilterVerified(opt.val)}
                          className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold border transition-all ${
                            filterVerified === opt.val ? 'bg-cyan-500/15 border-cyan-500/25 text-cyan-300' : 'bg-white/[0.03] border-white/5 text-white/35 hover:text-white/60'
                          }`}
                        >{opt.label}</button>
                      ))}
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="text-[9px] text-white/30 uppercase tracking-widest mb-1.5 block">Price Range</label>
                    <div className="flex gap-1.5">
                      {[{ val: 'all', label: 'Any' }, { val: 'under_market', label: 'Under' }, { val: 'at_market', label: 'Market' }, { val: 'over_market', label: 'Over' }].map((opt) => (
                        <button key={opt.val} onClick={() => setFilterPriceRange(opt.val)}
                          className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold border transition-all ${
                            filterPriceRange === opt.val ? 'bg-cyan-500/15 border-cyan-500/25 text-cyan-300' : 'bg-white/[0.03] border-white/5 text-white/35 hover:text-white/60'
                          }`}
                        >{opt.label}</button>
                      ))}
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="text-[9px] text-white/30 uppercase tracking-widest mb-1.5 block">Stock</label>
                    <div className="flex gap-1.5">
                      {[{ val: 'all', label: 'Any' }, { val: 'single', label: '1 Only' }, { val: 'bulk', label: 'Bulk (2+)' }].map((opt) => (
                        <button key={opt.val} onClick={() => setFilterStock(opt.val)}
                          className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold border transition-all ${
                            filterStock === opt.val ? 'bg-cyan-500/15 border-cyan-500/25 text-cyan-300' : 'bg-white/[0.03] border-white/5 text-white/35 hover:text-white/60'
                          }`}
                        >{opt.label}</button>
                      ))}
                    </div>
                  </div>
                </div>

                {activeFilters > 0 && (
                  <button onClick={() => { setFilterVerified('all'); setFilterPriceRange('all'); setFilterStock('all'); }}
                    className="text-[9px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                  >
                    <X className="w-2.5 h-2.5" /> Clear all filters
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ═══ MULTI-COLUMN GRID OF LISTINGS ═══ */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-2">
          {filteredSellers.map((seller) => {
            const isExpanded = expandedSeller === seller.id;
            const qty = getQty(seller.id);
            return (
              <div key={seller.id} className={`rounded-xl border overflow-hidden transition-all flex flex-col ${
                seller.isPlatform
                  ? isExpanded ? 'border-cyan-500/40 shadow-lg shadow-cyan-500/10 bg-cyan-900/15' : 'border-cyan-500/20 bg-cyan-900/10 hover:border-cyan-500/30'
                  : isExpanded ? 'border-white/20 shadow-lg bg-white/[0.05]' : 'border-white/5 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/15'
              }`}>
                {/* Compact Listing Tile */}
                <div
                  onClick={() => setExpandedSeller(isExpanded ? null : seller.id)}
                  className="p-2.5 cursor-pointer flex flex-col gap-1.5"
                >
                  {/* Seller Identity */}
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                      seller.isPlatform ? 'bg-cyan-500/30 text-cyan-300' : 'bg-white/10 text-white/60'
                    }`}>
                      {seller.isPlatform ? <Store className="w-3.5 h-3.5" /> : seller.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-white text-[11px] font-medium truncate">{seller.name}</p>
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-0.5 text-yellow-400 text-[8px]">
                          <Star className="w-2 h-2 fill-current" /> {seller.rating}
                        </div>
                        {seller.verified && <span className="text-emerald-400 text-[7px] font-bold">✓</span>}
                        {seller.isPlatform && <Badge className="bg-cyan-500/10 text-cyan-300 border-cyan-500/20 text-[6px] px-1 py-0 leading-tight">Official</Badge>}
                      </div>
                    </div>
                  </div>

                  {/* Price + Stock */}
                  <div className="flex items-center justify-between">
                    <span className="text-white font-bold text-sm">{seller.price.toLocaleString()} <span className="text-white/30 text-[9px]">AGP</span></span>
                    <span className="text-white/25 text-[9px]">{seller.stock} in stock</span>
                  </div>

                  {/* Listed time */}
                  <div className="flex items-center gap-1 text-[8px] text-white/20">
                    <Clock className="w-2 h-2" />
                    <span>{seller.listedLabel}</span>
                  </div>
                </div>

                {/* Expanded Dropdown */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="px-2.5 pb-2.5 pt-1 space-y-2 border-t border-white/5">
                        {/* Qty */}
                        <div className="flex items-center justify-between">
                          <span className="text-white/50 text-[10px]">Qty</span>
                          <div className="flex items-center gap-1.5">
                            <button onClick={(e) => { e.stopPropagation(); setQty(seller.id, qty - 1); }} className="w-6 h-6 rounded-md bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all">
                              <Minus className="w-2.5 h-2.5" />
                            </button>
                            <span className="text-white font-bold text-xs w-5 text-center">{qty}</span>
                            <button onClick={(e) => { e.stopPropagation(); setQty(seller.id, Math.min(seller.stock, qty + 1)); }} className="w-6 h-6 rounded-md bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all">
                              <Plus className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>

                        {/* Total */}
                        <div className="flex items-center justify-between">
                          <span className="text-white/50 text-[10px]">Total</span>
                          <span className="text-white font-bold text-xs">{(seller.price * qty).toLocaleString()} <span className="text-cyan-400 text-[9px]">AGP</span></span>
                        </div>

                        {/* Buy Button — adds to cart checkout */}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleBuyFromSeller(seller, qty); }}
                          className={`w-full py-2 font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                          seller.isPlatform
                            ? 'bg-cyan-600 hover:bg-cyan-500 text-white hover:shadow-md hover:shadow-cyan-500/20'
                            : 'bg-white/10 hover:bg-white/15 text-white border border-white/10 hover:border-white/20'
                        }`}>
                          <ShoppingCart className="w-3 h-3" />
                          Buy{qty > 1 ? ` ×${qty}` : ''} — Add to Cart
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}

          {filteredSellers.length === 0 && (
            <div className="col-span-full py-12 text-center text-white/20 text-sm">No listings match your filters.</div>
          )}
        </div>
      </div>
    </motion.div>
  );
}