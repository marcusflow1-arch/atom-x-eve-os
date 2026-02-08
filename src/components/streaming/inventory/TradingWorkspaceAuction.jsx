import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gavel, Clock, TrendingUp, Zap, SlidersHorizontal, ArrowUpDown, ChevronDown, Star, X, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function TradingWorkspaceAuction({ item, owned, marketPrice }) {
  const [sortBy, setSortBy] = useState('ending_soon'); // ending_soon | price_low | price_high | newest | oldest | buyout_low | buyout_high
  const [filterBuyout, setFilterBuyout] = useState('all'); // all | has_buyout | no_buyout
  const [filterPriceRange, setFilterPriceRange] = useState('all'); // all | low | mid | high
  const [showFilters, setShowFilters] = useState(false);
  const [expandedAuction, setExpandedAuction] = useState(null);
  const [bidAmounts, setBidAmounts] = useState({});

  // Mock active auctions for this card
  const allAuctions = [
    { id: 'a1', seller: 'VoidHunter', currentBid: Math.floor(marketPrice * 0.6), buyout: marketPrice, timeLeft: '4h 23m', timeMinutes: 263, bids: 8, rating: 4.8, listed: '2h ago' },
    { id: 'a2', seller: 'MarketBot', currentBid: Math.floor(marketPrice * 0.45), buyout: Math.floor(marketPrice * 0.9), timeLeft: '11h 05m', timeMinutes: 665, bids: 3, rating: 5.0, listed: '5h ago' },
    { id: 'a3', seller: 'CyberNinja', currentBid: Math.floor(marketPrice * 0.75), buyout: Math.floor(marketPrice * 1.1), timeLeft: '1h 12m', timeMinutes: 72, bids: 14, rating: 4.5, listed: '23h ago' },
    { id: 'a4', seller: 'ShadowLord', currentBid: Math.floor(marketPrice * 0.3), buyout: null, timeLeft: '6h 44m', timeMinutes: 404, bids: 2, rating: 3.9, listed: '1h ago' },
    { id: 'a5', seller: 'GalacticTrader', currentBid: Math.floor(marketPrice * 0.9), buyout: Math.floor(marketPrice * 1.2), timeLeft: '22h 10m', timeMinutes: 1330, bids: 21, rating: 4.9, listed: '26h ago' },
    { id: 'a6', seller: 'NovaStar', currentBid: Math.floor(marketPrice * 0.55), buyout: Math.floor(marketPrice * 0.85), timeLeft: '3h 01m', timeMinutes: 181, bids: 6, rating: 4.2, listed: '12h ago' },
    { id: 'a7', seller: 'IronFist', currentBid: Math.floor(marketPrice * 0.15), buyout: null, timeLeft: '47h 59m', timeMinutes: 2879, bids: 1, rating: 4.7, listed: '10m ago' },
  ];

  const filteredAuctions = useMemo(() => {
    let result = [...allAuctions];

    // Filter by buyout availability
    if (filterBuyout === 'has_buyout') result = result.filter(a => a.buyout !== null);
    if (filterBuyout === 'no_buyout') result = result.filter(a => a.buyout === null);

    // Filter by price range
    if (filterPriceRange === 'low') result = result.filter(a => a.currentBid < marketPrice * 0.5);
    if (filterPriceRange === 'mid') result = result.filter(a => a.currentBid >= marketPrice * 0.5 && a.currentBid < marketPrice * 0.8);
    if (filterPriceRange === 'high') result = result.filter(a => a.currentBid >= marketPrice * 0.8);

    // Sort
    switch (sortBy) {
      case 'ending_soon': result.sort((a, b) => a.timeMinutes - b.timeMinutes); break;
      case 'price_low': result.sort((a, b) => a.currentBid - b.currentBid); break;
      case 'price_high': result.sort((a, b) => b.currentBid - a.currentBid); break;
      case 'newest': result.sort((a, b) => a.timeMinutes - b.timeMinutes); break; // proxy
      case 'oldest': result.sort((a, b) => b.timeMinutes - a.timeMinutes); break;
      case 'buyout_low': result.sort((a, b) => (a.buyout || Infinity) - (b.buyout || Infinity)); break;
      case 'buyout_high': result.sort((a, b) => (b.buyout || 0) - (a.buyout || 0)); break;
      default: break;
    }

    return result;
  }, [sortBy, filterBuyout, filterPriceRange, marketPrice]);

  const handleBidChange = (id, val) => setBidAmounts(prev => ({ ...prev, [id]: val }));

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-5 space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-purple-400 font-bold text-sm flex items-center gap-2">
          <Gavel className="w-4 h-4" /> Auction House
        </h4>
        <div className="flex items-center gap-2">
          <Badge className="bg-purple-500/10 text-purple-300 border-purple-500/20 text-[9px]">
            {filteredAuctions.length} active
          </Badge>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-1.5 rounded-lg border transition-all ${showFilters ? 'bg-purple-500/20 border-purple-500/30 text-purple-300' : 'bg-white/5 border-white/10 text-white/40 hover:text-white'}`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filter & Sort Bar */}
      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-3">
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
                  { val: 'newest', label: 'Newest' },
                  { val: 'oldest', label: 'Oldest' },
                  { val: 'buyout_low', label: 'Buyout: Low' },
                  { val: 'buyout_high', label: 'Buyout: High' },
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

            {/* Buyout Filter */}
            <div>
              <label className="text-[9px] text-white/30 uppercase tracking-widest mb-1.5 block flex items-center gap-1">
                <Filter className="w-2.5 h-2.5" /> Buyout Option
              </label>
              <div className="flex gap-1.5">
                {[
                  { val: 'all', label: 'All' },
                  { val: 'has_buyout', label: 'Has Buyout' },
                  { val: 'no_buyout', label: 'No Buyout' },
                ].map((opt) => (
                  <button key={opt.val} onClick={() => setFilterBuyout(opt.val)}
                    className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold border transition-all ${
                      filterBuyout === opt.val ? 'bg-purple-500/15 border-purple-500/25 text-purple-300' : 'bg-white/[0.03] border-white/5 text-white/35 hover:text-white/60'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range Filter */}
            <div>
              <label className="text-[9px] text-white/30 uppercase tracking-widest mb-1.5 block flex items-center gap-1">
                <TrendingUp className="w-2.5 h-2.5" /> Bid Range
              </label>
              <div className="flex gap-1.5">
                {[
                  { val: 'all', label: 'Any Price' },
                  { val: 'low', label: `Under ${Math.floor(marketPrice * 0.5).toLocaleString()}` },
                  { val: 'mid', label: `${Math.floor(marketPrice * 0.5).toLocaleString()} – ${Math.floor(marketPrice * 0.8).toLocaleString()}` },
                  { val: 'high', label: `Over ${Math.floor(marketPrice * 0.8).toLocaleString()}` },
                ].map((opt) => (
                  <button key={opt.val} onClick={() => setFilterPriceRange(opt.val)}
                    className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold border transition-all ${
                      filterPriceRange === opt.val ? 'bg-purple-500/15 border-purple-500/25 text-purple-300' : 'bg-white/[0.03] border-white/5 text-white/35 hover:text-white/60'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auction Listings */}
      <div className="space-y-3">
        {filteredAuctions.map((auction) => {
          const isExpanded = expandedAuction === auction.id;
          const isUrgent = auction.timeMinutes < 120;
          return (
            <div key={auction.id} className={`bg-purple-900/10 border rounded-xl overflow-hidden transition-all ${isExpanded ? 'border-purple-500/30 shadow-lg shadow-purple-500/10' : 'border-purple-500/10 hover:border-purple-500/20'}`}>
              {/* Summary Row */}
              <div
                onClick={() => setExpandedAuction(isExpanded ? null : auction.id)}
                className="p-3.5 cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 text-[10px] font-bold">{auction.seller.charAt(0)}</div>
                    <div>
                      <span className="text-white text-xs font-medium">{auction.seller}</span>
                      <div className="flex items-center gap-1 text-[9px] text-yellow-400">
                        <Star className="w-2 h-2 fill-current" /> {auction.rating}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-1 text-[10px] ${isUrgent ? 'text-red-400 animate-pulse' : 'text-white/30'}`}>
                      <Clock className="w-3 h-3" />
                      <span className="font-medium">{auction.timeLeft}</span>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-white/30 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-black/20 rounded-lg px-2.5 py-1.5">
                    <p className="text-[8px] text-white/30 uppercase tracking-wider">Current Bid</p>
                    <p className="text-white font-bold text-sm">{auction.currentBid.toLocaleString()}</p>
                  </div>
                  <div className="bg-black/20 rounded-lg px-2.5 py-1.5">
                    <p className="text-[8px] text-white/30 uppercase tracking-wider">Buyout</p>
                    <p className="text-white font-bold text-sm">{auction.buyout ? auction.buyout.toLocaleString() : '—'}</p>
                  </div>
                  <div className="bg-black/20 rounded-lg px-2.5 py-1.5">
                    <p className="text-[8px] text-white/30 uppercase tracking-wider">Bids</p>
                    <p className="text-white font-bold text-sm">{auction.bids}</p>
                  </div>
                </div>
              </div>

              {/* Expanded Detail */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="px-3.5 pb-3.5 pt-1 space-y-3 border-t border-purple-500/10">
                      <div className="flex items-center gap-2 text-[10px] text-white/30">
                        <span>Listed: {auction.listed}</span>
                        <span className="text-white/10">•</span>
                        <span>Min next bid: {(auction.currentBid + Math.max(100, Math.floor(auction.currentBid * 0.05))).toLocaleString()} AGP</span>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={bidAmounts[auction.id] || ''}
                          onChange={(e) => handleBidChange(auction.id, e.target.value)}
                          placeholder={`Min: ${(auction.currentBid + Math.max(100, Math.floor(auction.currentBid * 0.05))).toLocaleString()}`}
                          className="flex-1 bg-black/30 border border-purple-500/20 rounded-lg px-3 py-2.5 text-white text-xs outline-none focus:border-purple-500/40 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <button className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg transition-all hover:shadow-md hover:shadow-purple-500/20">
                          Bid
                        </button>
                        {auction.buyout && (
                          <button className="px-4 py-2.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs font-bold rounded-lg border border-purple-500/20 transition-all flex items-center gap-1">
                            <Zap className="w-3 h-3" /> Buyout
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {filteredAuctions.length === 0 && (
          <div className="py-10 text-center text-white/20 text-sm">No auctions match your filters.</div>
        )}
      </div>
    </motion.div>
  );
}