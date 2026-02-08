import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gavel, Clock, TrendingUp, Zap, SlidersHorizontal, ArrowUpDown, ChevronDown, Star, X, Filter, Users, ShoppingCart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useCart } from '../../CartContext';

export default function TradingWorkspaceAuction({ item, owned, marketPrice }) {
  const [sortBy, setSortBy] = useState('ending_soon');
  const [filterBuyout, setFilterBuyout] = useState('all');
  const [filterPriceRange, setFilterPriceRange] = useState('all');
  const [filterTimeLeft, setFilterTimeLeft] = useState('all'); // all | urgent | hours | days
  const [filterBidCount, setFilterBidCount] = useState('all'); // all | hot | low | none
  const [showFilters, setShowFilters] = useState(false);
  const [expandedAuction, setExpandedAuction] = useState(null);
  const [bidAmounts, setBidAmounts] = useState({});
  const { addToCart } = useCart();

  // Large mock auction pool (50+)
  const allAuctions = useMemo(() => {
    const sellers = [
      'VoidHunter', 'MarketBot', 'CyberNinja', 'ShadowLord', 'GalacticTrader',
      'NovaStar', 'IronFist', 'BladeRunner', 'CyberVixen', 'PhantomX',
      'StarDust', 'NebulaHawk', 'TitanForge', 'RuneMaster', 'VoidWalker',
      'ArcaneDealer', 'NightShade', 'SteelNerve', 'MysticTrader', 'CrimsonBlade',
      'FrostByte', 'ThunderClaw', 'SilverFox', 'DarkMatter', 'PixelPunk',
      'OmegaVault', 'ZenithStar', 'EchoFlame', 'WarpDrive', 'CosmicDust',
      'NeonEdge', 'QuantumLeap', 'BlazeTrail', 'ShadowPact', 'IronVeil',
      'StormBreaker', 'LunarTide', 'SolarFlare', 'AbyssWatcher', 'GrimReaper',
      'FateWeaver', 'ChronoShift', 'CipherLock', 'VortexRider', 'HexBound',
      'MirageX', 'OnyxKnight', 'EmberSoul', 'PrismHeart', 'AstralBlade',
    ];
    return sellers.map((name, i) => {
      const bidMulti = 0.15 + Math.random() * 0.85;
      const hasBuyout = Math.random() > 0.3;
      const buyoutMulti = hasBuyout ? (0.85 + Math.random() * 0.5) : null;
      const timeMinutes = Math.floor(5 + Math.random() * 2880);
      const bids = Math.floor(Math.random() * 25);
      const rating = parseFloat((3.5 + Math.random() * 1.5).toFixed(1));
      const listedMinutes = Math.floor(Math.random() * 2880);
      const listedLabel = listedMinutes < 60 ? `${listedMinutes}m ago` : listedMinutes < 1440 ? `${Math.floor(listedMinutes / 60)}h ago` : `${Math.floor(listedMinutes / 1440)}d ago`;

      const hours = Math.floor(timeMinutes / 60);
      const mins = timeMinutes % 60;
      const timeLeft = hours > 0 ? `${hours}h ${mins.toString().padStart(2, '0')}m` : `${mins}m`;

      return {
        id: `a${i}`,
        seller: name,
        currentBid: Math.floor(marketPrice * bidMulti),
        buyout: buyoutMulti ? Math.floor(marketPrice * buyoutMulti) : null,
        timeLeft,
        timeMinutes,
        bids,
        rating,
        listedLabel,
      };
    });
  }, [marketPrice]);

  const filteredAuctions = useMemo(() => {
    let result = [...allAuctions];

    if (filterBuyout === 'has_buyout') result = result.filter(a => a.buyout !== null);
    if (filterBuyout === 'no_buyout') result = result.filter(a => a.buyout === null);

    if (filterPriceRange === 'low') result = result.filter(a => a.currentBid < marketPrice * 0.5);
    if (filterPriceRange === 'mid') result = result.filter(a => a.currentBid >= marketPrice * 0.5 && a.currentBid < marketPrice * 0.8);
    if (filterPriceRange === 'high') result = result.filter(a => a.currentBid >= marketPrice * 0.8);

    if (filterTimeLeft === 'urgent') result = result.filter(a => a.timeMinutes < 120);
    if (filterTimeLeft === 'hours') result = result.filter(a => a.timeMinutes >= 120 && a.timeMinutes < 1440);
    if (filterTimeLeft === 'days') result = result.filter(a => a.timeMinutes >= 1440);

    if (filterBidCount === 'hot') result = result.filter(a => a.bids >= 10);
    if (filterBidCount === 'low') result = result.filter(a => a.bids > 0 && a.bids < 10);
    if (filterBidCount === 'none') result = result.filter(a => a.bids === 0);

    switch (sortBy) {
      case 'ending_soon': result.sort((a, b) => a.timeMinutes - b.timeMinutes); break;
      case 'price_low': result.sort((a, b) => a.currentBid - b.currentBid); break;
      case 'price_high': result.sort((a, b) => b.currentBid - a.currentBid); break;
      case 'most_bids': result.sort((a, b) => b.bids - a.bids); break;
      case 'least_bids': result.sort((a, b) => a.bids - b.bids); break;
      case 'buyout_low': result.sort((a, b) => (a.buyout || Infinity) - (b.buyout || Infinity)); break;
      case 'buyout_high': result.sort((a, b) => (b.buyout || 0) - (a.buyout || 0)); break;
      case 'newest': result.sort((a, b) => b.timeMinutes - a.timeMinutes); break;
      default: break;
    }

    return result;
  }, [sortBy, filterBuyout, filterPriceRange, filterTimeLeft, filterBidCount, marketPrice, allAuctions]);

  const handleBidChange = (id, val) => setBidAmounts(prev => ({ ...prev, [id]: val }));

  const handleBuyout = (auction) => {
    addToCart({
      id: `auction-buyout-${auction.id}-${Date.now()}`,
      title: `${item.name} (Buyout from ${auction.seller})`,
      type: 'auction_buyout',
      price: auction.buyout,
      image: item.image,
      seller: auction.seller,
      itemName: item.name,
      itemCategory: item.category,
      itemRarity: item.rarity,
    });
  };

  const activeFilters = [filterBuyout !== 'all', filterPriceRange !== 'all', filterTimeLeft !== 'all', filterBidCount !== 'all'].filter(Boolean).length;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-5 flex flex-col h-full min-h-0">

      {/* Top Bar */}
      <div className="flex-shrink-0 space-y-3 mb-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h4 className="text-purple-400 font-bold text-sm flex items-center gap-2">
              <Gavel className="w-4 h-4" /> Auction House
            </h4>
            <Badge className="bg-purple-500/10 text-purple-300 border-purple-500/20 text-[9px]">
              {filteredAuctions.length} active
            </Badge>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-1.5 rounded-lg border transition-all relative ${showFilters ? 'bg-purple-500/20 border-purple-500/30 text-purple-300' : 'bg-white/5 border-white/10 text-white/40 hover:text-white'}`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            {activeFilters > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-purple-500 text-black text-[7px] font-bold rounded-full flex items-center justify-center">{activeFilters}</span>
            )}
          </button>
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
                      { val: 'ending_soon', label: 'Ending Soon' },
                      { val: 'price_low', label: 'Bid: Low→High' },
                      { val: 'price_high', label: 'Bid: High→Low' },
                      { val: 'most_bids', label: 'Most Bids' },
                      { val: 'least_bids', label: 'Least Bids' },
                      { val: 'buyout_low', label: 'Buyout: Low' },
                      { val: 'buyout_high', label: 'Buyout: High' },
                      { val: 'newest', label: 'Newest' },
                    ].map((opt) => (
                      <button key={opt.val} onClick={() => setSortBy(opt.val)}
                        className={`px-2.5 py-1.5 rounded-lg text-[9px] font-bold border transition-all ${
                          sortBy === opt.val ? 'bg-purple-500/20 border-purple-500/30 text-purple-300' : 'bg-white/[0.03] border-white/5 text-white/35 hover:text-white/60'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filter rows */}
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-[9px] text-white/30 uppercase tracking-widest mb-1.5 block flex items-center gap-1">
                      <Filter className="w-2.5 h-2.5" /> Buyout
                    </label>
                    <div className="flex gap-1.5">
                      {[{ val: 'all', label: 'All' }, { val: 'has_buyout', label: 'Has Buyout' }, { val: 'no_buyout', label: 'Bid Only' }].map((opt) => (
                        <button key={opt.val} onClick={() => setFilterBuyout(opt.val)}
                          className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold border transition-all ${
                            filterBuyout === opt.val ? 'bg-purple-500/15 border-purple-500/25 text-purple-300' : 'bg-white/[0.03] border-white/5 text-white/35 hover:text-white/60'
                          }`}
                        >{opt.label}</button>
                      ))}
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="text-[9px] text-white/30 uppercase tracking-widest mb-1.5 block flex items-center gap-1">
                      <TrendingUp className="w-2.5 h-2.5" /> Bid Range
                    </label>
                    <div className="flex gap-1.5">
                      {[{ val: 'all', label: 'Any' }, { val: 'low', label: 'Under 50%' }, { val: 'mid', label: '50-80%' }, { val: 'high', label: 'Over 80%' }].map((opt) => (
                        <button key={opt.val} onClick={() => setFilterPriceRange(opt.val)}
                          className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold border transition-all ${
                            filterPriceRange === opt.val ? 'bg-purple-500/15 border-purple-500/25 text-purple-300' : 'bg-white/[0.03] border-white/5 text-white/35 hover:text-white/60'
                          }`}
                        >{opt.label}</button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-[9px] text-white/30 uppercase tracking-widest mb-1.5 block flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" /> Time Left
                    </label>
                    <div className="flex gap-1.5">
                      {[{ val: 'all', label: 'Any' }, { val: 'urgent', label: '< 2h' }, { val: 'hours', label: '2-24h' }, { val: 'days', label: '24h+' }].map((opt) => (
                        <button key={opt.val} onClick={() => setFilterTimeLeft(opt.val)}
                          className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold border transition-all ${
                            filterTimeLeft === opt.val ? 'bg-purple-500/15 border-purple-500/25 text-purple-300' : 'bg-white/[0.03] border-white/5 text-white/35 hover:text-white/60'
                          }`}
                        >{opt.label}</button>
                      ))}
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="text-[9px] text-white/30 uppercase tracking-widest mb-1.5 block flex items-center gap-1">
                      <Users className="w-2.5 h-2.5" /> Bid Activity
                    </label>
                    <div className="flex gap-1.5">
                      {[{ val: 'all', label: 'Any' }, { val: 'hot', label: 'Hot (10+)' }, { val: 'low', label: '1-9' }, { val: 'none', label: 'No Bids' }].map((opt) => (
                        <button key={opt.val} onClick={() => setFilterBidCount(opt.val)}
                          className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold border transition-all ${
                            filterBidCount === opt.val ? 'bg-purple-500/15 border-purple-500/25 text-purple-300' : 'bg-white/[0.03] border-white/5 text-white/35 hover:text-white/60'
                          }`}
                        >{opt.label}</button>
                      ))}
                    </div>
                  </div>
                </div>

                {activeFilters > 0 && (
                  <button onClick={() => { setFilterBuyout('all'); setFilterPriceRange('all'); setFilterTimeLeft('all'); setFilterBidCount('all'); }}
                    className="text-[9px] text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
                  >
                    <X className="w-2.5 h-2.5" /> Clear all filters
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ═══ MULTI-COLUMN AUCTION GRID ═══ */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-2">
          {filteredAuctions.map((auction) => {
            const isExpanded = expandedAuction === auction.id;
            const isUrgent = auction.timeMinutes < 120;
            const minBid = auction.currentBid + Math.max(100, Math.floor(auction.currentBid * 0.05));
            return (
              <div key={auction.id} className={`rounded-xl border overflow-hidden transition-all flex flex-col ${
                isExpanded
                  ? 'border-purple-500/40 shadow-lg shadow-purple-500/10 bg-purple-900/15'
                  : isUrgent
                    ? 'border-red-500/20 bg-red-900/5 hover:border-red-500/30'
                    : 'border-purple-500/10 bg-purple-900/5 hover:border-purple-500/20'
              }`}>
                {/* Compact Tile */}
                <div
                  onClick={() => setExpandedAuction(isExpanded ? null : auction.id)}
                  className="p-2.5 cursor-pointer flex flex-col gap-1.5"
                >
                  {/* Seller + Time */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 text-[9px] font-bold flex-shrink-0">
                        {auction.seller.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white text-[11px] font-medium truncate">{auction.seller}</p>
                        <div className="flex items-center gap-1 text-[8px] text-yellow-400">
                          <Star className="w-2 h-2 fill-current" /> {auction.rating}
                        </div>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1 text-[9px] font-medium flex-shrink-0 ${isUrgent ? 'text-red-400 animate-pulse' : 'text-white/30'}`}>
                      <Clock className="w-2.5 h-2.5" />
                      <span>{auction.timeLeft}</span>
                    </div>
                  </div>

                  {/* Bid / Buyout / Bids row */}
                  <div className="grid grid-cols-3 gap-1.5">
                    <div className="bg-black/20 rounded-md px-2 py-1">
                      <p className="text-[7px] text-white/25 uppercase tracking-wider">Current Bid</p>
                      <p className="text-white font-bold text-[11px]">{auction.currentBid.toLocaleString()}</p>
                    </div>
                    <div className="bg-black/20 rounded-md px-2 py-1">
                      <p className="text-[7px] text-white/25 uppercase tracking-wider">Buyout</p>
                      <p className="text-white font-bold text-[11px]">{auction.buyout ? auction.buyout.toLocaleString() : '—'}</p>
                    </div>
                    <div className="bg-black/20 rounded-md px-2 py-1">
                      <p className="text-[7px] text-white/25 uppercase tracking-wider">Bids</p>
                      <p className={`font-bold text-[11px] ${auction.bids >= 10 ? 'text-orange-400' : 'text-white'}`}>{auction.bids}</p>
                    </div>
                  </div>

                  {/* Listed */}
                  <div className="text-[8px] text-white/20">Listed {auction.listedLabel}</div>
                </div>

                {/* Expanded Dropdown: Bid / Buyout */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="px-2.5 pb-2.5 pt-1 space-y-2 border-t border-purple-500/10">
                        <p className="text-[9px] text-white/30">Min next bid: <span className="text-white/60 font-bold">{minBid.toLocaleString()} AGP</span></p>

                        {/* Bid input + button */}
                        <div className="flex gap-1.5">
                          <input
                            type="number"
                            value={bidAmounts[auction.id] || ''}
                            onChange={(e) => handleBidChange(auction.id, e.target.value)}
                            placeholder={minBid.toLocaleString()}
                            className="flex-1 bg-black/30 border border-purple-500/20 rounded-lg px-2.5 py-2 text-white text-[11px] outline-none focus:border-purple-500/40 transition-colors min-w-0"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <button className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold rounded-lg transition-all hover:shadow-md hover:shadow-purple-500/20 flex-shrink-0">
                            Bid
                          </button>
                        </div>

                        {/* Buyout button */}
                        {auction.buyout && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleBuyout(auction); }}
                            className="w-full py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-[10px] font-bold rounded-lg border border-purple-500/20 transition-all flex items-center justify-center gap-1.5"
                          >
                            <Zap className="w-3 h-3" /> Buyout {auction.buyout.toLocaleString()} AGP
                            <ShoppingCart className="w-3 h-3 ml-1 opacity-50" />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}

          {filteredAuctions.length === 0 && (
            <div className="col-span-full py-12 text-center text-white/20 text-sm">No auctions match your filters.</div>
          )}
        </div>
      </div>
    </motion.div>
  );
}