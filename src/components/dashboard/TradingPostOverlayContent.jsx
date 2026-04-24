import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Gamepad2, DollarSign, Gavel, ArrowLeftRight, Star, ChevronLeft as ChevronLeftIcon, Search, Mic, ArrowRight, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/components/auth/AuthContext';
import LiquidGlassCard from '@/components/shared/LiquidGlassCard';

const RarityBadge = ({ rarity }) => {
  const styles = {
    Mythical: 'bg-red-500/10 text-red-400 border-red-500/50',
    Legendary: 'bg-orange-500/10 text-orange-400 border-orange-500/50',
    Epic: 'bg-purple-500/10 text-purple-400 border-purple-500/50',
    Rare: 'bg-blue-500/10 text-blue-400 border-blue-500/50',
    Uncommon: 'bg-green-500/10 text-green-400 border-green-500/50',
    Common: 'bg-slate-500/10 text-slate-400 border-slate-500/50',
  };
  return (
    <Badge variant="outline" className={`${styles[rarity] || styles.Common} border px-2 py-0.5 uppercase tracking-wider text-[10px] font-bold`}>
      {rarity}
    </Badge>
  );
};

export default function TradingPostOverlayContent({ cardSearchQuery = '', onCardSearch = () => {}, selectedGame }) {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [selectedTrader, setSelectedTrader] = useState(null);
  const [tradeConfirming, setTradeConfirming] = useState(false);
  const [counterOfferDrawerOpen, setCounterOfferDrawerOpen] = useState(false);
  const [selectedCounterCard, setSelectedCounterCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [offerSort, setOfferSort] = useState('price-low');
  const [offerTypeFilter, setOfferTypeFilter] = useState('all');
  const [selectedMysteryTradeCard, setSelectedMysteryTradeCard] = useState(null);
  const [tradeCardRowIndex, setTradeCardRowIndex] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const a = await base44.entities.Achievement.list();
        setAchievements(a || []);
      } catch (e) {
        console.error('TradingPost fetch error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Reset state when game changes
  useEffect(() => {
    setSelectedItem(null);
    setSelectedOffer(null);
    setSelectedMysteryTradeCard(null);
    setTradeCardRowIndex(0);
  }, [selectedGame?.id]);

  const { data: tradeOffers } = useQuery({
    queryKey: ['tradeOffers-overlay'],
    queryFn: async () => {
      const result = await base44.entities.TradeOffer.filter({ status: 'active' }, '-created_date', 200);
      return result || [];
    },
    initialData: [],
  });

  const gameItems = useMemo(() => {
    if (!selectedGame) return [];
    return achievements.filter(a => (a.game || '').toLowerCase() === (selectedGame.title || '').toLowerCase());
  }, [selectedGame, achievements]);

  const itemOffers = useMemo(() => {
    if (!selectedItem) return [];
    const itemName = selectedItem.title?.toLowerCase();
    const gameName = selectedGame?.title?.toLowerCase();
    let offers = tradeOffers.filter(o =>
      (o.item_name || '').toLowerCase() === itemName && (o.game_name || '').toLowerCase() === gameName
    ).map(o => ({
      id: o.id,
      seller: { name: o.trader_name || 'Unknown', avatar: o.trader_avatar, rating: 4.5 },
      type: o.offer_type,
      price: o.price || o.buyout_price || o.current_bid || 0,
      currentBid: o.current_bid,
      buyoutPrice: o.buyout_price,
      seeking: o.seeking_items || [],
      description: o.description,
      postedAt: o.created_date ? new Date(o.created_date).toLocaleDateString() : 'Recently',
      endsAt: o.expires_at ? new Date(o.expires_at).toLocaleDateString() : null,
    }));
    if (offers.length === 0) {
      offers = [{ id: 'mock-1', seller: { name: 'MarketBot', avatar: '', rating: 5.0 }, type: 'sale', price: selectedItem.points ? selectedItem.points * 10 : 500, description: 'System listing — fixed price.', postedAt: 'Today' }];
    }
    if (offerTypeFilter !== 'all') offers = offers.filter(o => o.type === offerTypeFilter);
    if (offerSort === 'price-low') offers.sort((a, b) => (a.price || 0) - (b.price || 0));
    else if (offerSort === 'price-high') offers.sort((a, b) => (b.price || 0) - (a.price || 0));
    return offers;
  }, [selectedItem, selectedGame, tradeOffers, offerTypeFilter, offerSort]);

  const mysteryTradeCards = useMemo(() => {
    const all = Array.from({ length: 70 }, (_, i) => ({ id: `trade-mystery-${i + 1}`, label: `Trade Card ${i + 1}` }));
    if (!cardSearchQuery.trim()) return all;
    const q = cardSearchQuery.toLowerCase();
    return all.filter(c => c.label.toLowerCase().includes(q));
  }, [cardSearchQuery]);

  const CARDS_PER_ROW = 4;
  const totalRows = Math.ceil(mysteryTradeCards.length / CARDS_PER_ROW);

  const visibleMysteryTradeCards = useMemo(() => {
    const start = tradeCardRowIndex * CARDS_PER_ROW;
    return mysteryTradeCards.slice(start, start + CARDS_PER_ROW);
  }, [mysteryTradeCards, tradeCardRowIndex]);

  const mysteryTradeRows = useMemo(() => {
    if (!selectedMysteryTradeCard) return [];
    return Array.from({ length: 10 }, (_, i) => ({
      id: `${selectedMysteryTradeCard.id}-offer-${i + 1}`,
      name: `Trader ${i + 1}`,
      type: i % 2 === 0 ? 'Trade' : 'Sale',
      value: (12 + i * 3).toFixed(2),
    }));
  }, [selectedMysteryTradeCard]);

  const handleBack = () => {
    if (selectedTrader) {
      setSelectedTrader(null);
    } else if (selectedOffer) {
      setSelectedOffer(null);
    } else if (selectedItem) {
      setSelectedItem(null);
      setSelectedOffer(null);
    }
  };

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
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/20 flex items-center justify-center mb-4">
          <ArrowLeftRight className="w-8 h-8 text-blue-400/60" />
        </div>
        <h2 className="text-xl font-bold text-white/60 mb-2">Trading Post</h2>
        <p className="text-white/30 text-sm max-w-sm">Select a game from the left panel to view its items.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <AnimatePresence mode="wait">
        {selectedTrader ? (
          <motion.div key="trader-detail" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }} className="h-full flex flex-col p-5">
            <div className="flex items-center gap-3 mb-6">
              <button onClick={handleBack} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/8">
                <ChevronLeftIcon className="w-4 h-4 text-white/60" />
              </button>
              <h2 className="text-white font-bold text-lg">{selectedTrader.name}</h2>
            </div>

            {/* Trade details - 60/40 split layout */}
             <div className="flex-1 flex gap-6 overflow-hidden pt-4">
               {/* LEFT: Trade visualization (60%) */}
               <div className="flex-1 flex flex-col gap-4 border-r border-white/10 pr-6">
                 {/* Trade exchange visualization */}
                 <div className="flex items-start gap-3 justify-center">
                   {/* Their card */}
                   <div className="flex-1 flex flex-col items-center gap-2">
                     <span className="text-xs text-white/40 uppercase tracking-wider">Their Card</span>
                     <div className="w-full aspect-[3/4] rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                       <span className="text-white/40 text-3xl font-black">?</span>
                     </div>
                     <p className="text-xs text-white/40 text-center mt-2">Card description goes here</p>
                   </div>

                   {/* Arrow */}
                   <div className="flex flex-col items-center gap-1 shrink-0 pt-6">
                     <ArrowRight className="w-5 h-5 text-white/40" />
                     <span className="text-[8px] text-white/30 uppercase tracking-wide">For</span>
                   </div>

                   {/* Your card */}
                   <div className="flex-1 flex flex-col items-center gap-2">
                     <span className="text-xs text-white/40 uppercase tracking-wider">Your Card</span>
                     <button onClick={() => setCounterOfferDrawerOpen(true)} className="w-full aspect-[3/4] rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity" style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                       <span className="text-white/40 text-3xl font-black">?</span>
                     </button>
                     <p className="text-xs text-white/40 text-center mt-2">Click to select card</p>
                   </div>
                 </div>

                 {/* Confirm button */}
                 <button
                   onClick={() => setTradeConfirming(!tradeConfirming)}
                   className="py-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/50 text-blue-400 font-bold uppercase text-xs tracking-wider transition-colors mt-auto"
                 >
                   Confirm
                 </button>
               </div>

               {/* RIGHT: Counter offer box (40%) */}
               <div className="w-[40%] flex flex-col pl-4 pb-20">
                 <div className="flex-1 flex flex-col items-center justify-end gap-3">
                   <div className="h-px w-full bg-white/10 mb-4" />
                   <button
                     onClick={() => setCounterOfferDrawerOpen(true)}
                     className="w-20 h-[120px] flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-purple-500/50 hover:border-purple-500/80 hover:bg-purple-500/10 transition-colors"
                   >
                     <span className="text-white/60 text-[10px] uppercase tracking-wider mb-1">Enter</span>
                     <span className="text-white/40 text-[9px]">Counter</span>
                   </button>
                 </div>
               </div>
             </div>

            {/* Counter Offer Drawer */}
            {counterOfferDrawerOpen && (
              <motion.div
                initial={{ x: 320 }}
                animate={{ x: 0 }}
                exit={{ x: 320 }}
                className="fixed right-0 top-0 bottom-0 w-80 bg-slate-900/95 border-l border-white/10 shadow-2xl z-50 flex flex-col"
              >
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                  <h3 className="text-white font-bold text-sm">Select Your Card</h3>
                  <button onClick={() => setCounterOfferDrawerOpen(false)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/10">
                    <X className="w-4 h-4 text-white/60" />
                  </button>
                </div>

                {/* Search bar */}
                <div className="p-4 border-b border-white/10">
                  <div className="relative flex items-center">
                    <Search className="absolute left-2 w-3 h-3 text-white/30 pointer-events-none" />
                    <input
                      placeholder="search cards"
                      className="w-full bg-white/5 border border-white/10 rounded pl-7 pr-7 py-2 text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-white/20"
                    />
                    <button className="absolute right-2 text-white/40 hover:text-white/60">
                      <Mic className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Header */}
                <div className="p-4 border-b border-white/10">
                  <h3 className="text-white font-bold text-sm mb-2">Enter Your Counter Offer</h3>
                  <p className="text-xs text-white/40">Select a card below to send as counter offer</p>
                </div>

                {/* Cards list */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {Array.from({ length: 12 }, (_, i) => (
                    <div
                      key={i}
                      onClick={() => setSelectedCounterCard(i)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedCounterCard === i
                          ? 'bg-purple-500/20 border-purple-500/50'
                          : 'bg-white/5 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="text-xs text-white/60 mb-1">Card {i + 1}</div>
                      <div className="w-full h-16 rounded bg-white/5 flex items-center justify-center border border-white/10">
                        <span className="text-white/30 text-lg font-black">?</span>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedCounterCard !== null && (
                  <div className="p-4 border-t border-white/10">
                    <button className="w-full py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm uppercase tracking-wider transition-colors">
                      Send Counter Offer
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>

        ) : selectedOffer ? (
          <motion.div key="offer-detail" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }} className="h-full flex flex-col p-5">
            <div className="flex items-center gap-3 mb-6">
              <button onClick={handleBack} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/8">
                <ChevronLeftIcon className="w-4 h-4 text-white/60" />
              </button>
              <h2 className="text-white font-bold text-lg">Transaction Details</h2>
            </div>
            <div className="flex-1 grid grid-cols-3 gap-6 overflow-hidden">
              <div className="col-span-1 bg-slate-900/50 rounded-2xl border border-white/10 p-5 flex flex-col gap-4">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-white/5 border-2 border-white/10 mx-auto mb-3 flex items-center justify-center overflow-hidden">
                    {selectedOffer.seller.avatar ? (
                      <img src={selectedOffer.seller.avatar} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <span className="text-white/30 text-xl font-bold">{(selectedOffer.seller.name || 'U')[0]}</span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-white">{selectedOffer.seller.name}</h3>
                  <div className="flex items-center justify-center gap-1 text-yellow-400 mt-1">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span className="font-bold text-sm">{selectedOffer.seller.rating}</span>
                  </div>
                </div>
                <div className="bg-white/5 p-3 rounded-xl">
                  <span className="text-[10px] text-white/40 uppercase block mb-1">Type</span>
                  <Badge className="bg-white/10 text-white/70 text-xs capitalize">{selectedOffer.type === 'sale' ? 'Fixed Price' : selectedOffer.type === 'bid' ? 'Auction' : 'Trade'}</Badge>
                </div>
                {selectedOffer.description && (
                  <div className="bg-white/5 p-3 rounded-xl">
                    <span className="text-[10px] text-white/40 uppercase block mb-1">Description</span>
                    <p className="text-sm text-white/60 italic">"{selectedOffer.description}"</p>
                  </div>
                )}
                <div className="text-[10px] text-white/20">Posted: {selectedOffer.postedAt}</div>
              </div>
              <div className="col-span-2 space-y-4 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                {(selectedOffer.type === 'sale' || !selectedOffer.type) && (
                  <div className="bg-gradient-to-br from-green-900/20 to-slate-900 border border-green-500/30 rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><DollarSign className="w-28 h-28 text-green-500" /></div>
                    <h3 className="text-lg font-bold text-green-400 mb-3 flex items-center gap-2"><DollarSign className="w-5 h-5" /> Buy Now</h3>
                    <div className="text-4xl font-black text-white mb-4">{(selectedOffer.price || 0).toLocaleString()} <span className="text-lg text-white/40">AGP</span></div>
                    <Button className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-5 text-lg rounded-xl">Purchase Item</Button>
                  </div>
                )}
                {selectedOffer.type === 'bid' && (
                  <div className="bg-gradient-to-br from-purple-900/20 to-slate-900 border border-purple-500/30 rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><Gavel className="w-28 h-28 text-purple-500" /></div>
                    <h3 className="text-lg font-bold text-purple-400 mb-3 flex items-center gap-2"><Gavel className="w-5 h-5" /> Auction</h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-black/30 p-3 rounded-lg"><div className="text-xs text-white/40">Current Bid</div><div className="text-xl font-bold text-white">{(selectedOffer.currentBid || 0).toLocaleString()}</div></div>
                      <div className="bg-black/30 p-3 rounded-lg"><div className="text-xs text-white/40">Buyout</div><div className="text-xl font-bold text-white">{(selectedOffer.buyoutPrice || 0).toLocaleString()}</div></div>
                    </div>
                    <div className="flex gap-3">
                      <Input type="number" placeholder="Enter bid..." className="bg-black/30 border-purple-500/30 h-12 text-white" />
                      <Button className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-8 h-12 rounded-xl">Place Bid</Button>
                    </div>
                  </div>
                )}
                {selectedOffer.type === 'trade' && (
                  <div className="bg-gradient-to-br from-blue-900/20 to-slate-900 border border-blue-500/30 rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><ArrowLeftRight className="w-28 h-28 text-blue-500" /></div>
                    <h3 className="text-lg font-bold text-blue-400 mb-3 flex items-center gap-2"><ArrowLeftRight className="w-5 h-5" /> Trade</h3>
                    {selectedOffer.seeking?.length > 0 && (
                      <div className="bg-black/30 p-3 rounded-xl mb-4">
                        <div className="text-xs text-white/40 mb-1">Seeking:</div>
                        <div className="flex flex-wrap gap-2">{selectedOffer.seeking.map((s, i) => <Badge key={i} variant="outline" className="border-blue-500/40 text-blue-300">{s}</Badge>)}</div>
                      </div>
                    )}
                    <Button variant="outline" className="w-full border-blue-500/50 text-blue-400 hover:bg-blue-500/10 font-bold py-5 text-lg rounded-xl">Propose Trade</Button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

        ) : selectedItem ? (
          <motion.div key="item-offers" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="h-full flex flex-col">
            {/* Item title + back */}
            <div className="p-5 pb-3 border-b border-white/6 flex items-center gap-3">
              <button onClick={handleBack} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/8">
                <ChevronLeftIcon className="w-4 h-4 text-white/60" />
              </button>
              <div className="flex-1 min-w-0">
                <h2 className="text-white font-bold text-base truncate">{selectedItem.title}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <RarityBadge rarity={selectedItem.rarity} />
                </div>
              </div>
            </div>

            {/* Traders | filter chips | Offers header row */}
            <div className="flex items-center gap-2 px-5 pt-3 pb-2">
              <span className="text-[11px] uppercase tracking-[0.25em] text-white/35 shrink-0">Traders</span>
              <div className="flex items-center gap-1 flex-1 justify-center">
                {[
                  { key: 'price-high', label: 'Highest', typeKey: null },
                  { key: 'price-low',  label: 'Lowest',  typeKey: null },
                  { key: 'bid',        label: 'Bid',     typeKey: 'bid' },
                  { key: 'trade',      label: 'Trade',   typeKey: 'trade' },
                ].map(({ key, label, typeKey }) => {
                  const isActive = typeKey
                    ? offerTypeFilter === typeKey
                    : offerSort === key && offerTypeFilter === 'all';
                  return (
                    <button
                      key={key}
                      onClick={() => {
                        if (typeKey) {
                          setOfferTypeFilter(prev => prev === typeKey ? 'all' : typeKey);
                        } else {
                          setOfferTypeFilter('all');
                          setOfferSort(key);
                        }
                      }}
                      className={`px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wide transition-all border ${
                        isActive
                          ? 'bg-white/20 border-white/30 text-white'
                          : 'border-white/10 text-white/40 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              <span className="text-[11px] uppercase tracking-[0.25em] text-white/35 shrink-0">Offers</span>
            </div>

            {/* Offer rows */}
            <div className="flex-1 overflow-y-auto px-5 pb-4" style={{ scrollbarWidth: 'none' }}>
              {itemOffers.map((offer) => (
                <div key={offer.id}>
                  <div
                    className="flex items-center justify-between py-2.5 cursor-pointer hover:bg-white/5 rounded px-1 transition-colors"
                    onClick={() => setSelectedOffer(offer)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm font-medium">{offer.seller.name}</span>
                      {offer.type === 'bid' && (
                        <span className="text-[9px] uppercase tracking-wide text-amber-400/80 border border-amber-400/30 px-1.5 py-0.5 rounded-full">Bid</span>
                      )}
                      {offer.type === 'trade' && (
                        <span className="text-[9px] uppercase tracking-wide text-blue-400/80 border border-blue-400/30 px-1.5 py-0.5 rounded-full">Trade</span>
                      )}
                    </div>
                    <span className="text-cyan-300 text-sm font-semibold">{(offer.price || 0).toLocaleString()} AGP</span>
                  </div>
                  <div className="h-px bg-white/10" />
                </div>
              ))}
            </div>
          </motion.div>

        ) : (
          <motion.div key={`game-${selectedGame.id}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="h-full flex flex-col overflow-hidden">
            {/* Header spanning both sections */}
            <div className="p-5 pb-6 border-b border-white/6 flex items-center gap-4">
              <div className="w-10 h-14 rounded-lg overflow-hidden border border-white/10">
                {selectedGame.cover_image ? (
                  <img src={selectedGame.cover_image} alt="" className="w-full h-full object-cover" />
                ) : <div className="w-full h-full bg-black/30" />}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-white font-bold text-sm truncate">{selectedGame.title}</h2>
                <Badge className="bg-white/10 text-white/70 border-white/20 text-[10px] mt-1">{selectedGame.genre}</Badge>
              </div>
            </div>

            {/* Content area with 60/40 split */}
            <div className="flex-1 flex gap-4 overflow-hidden px-5 pt-8 pb-3">
              {/* LEFT: Traders List (60%) */}
              <div className="w-[60%] flex flex-col border-r border-white/10 pr-4 overflow-hidden">

              <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] uppercase tracking-[0.25em] text-white/35">Traders</span>
                  <span className="text-[11px] uppercase tracking-[0.25em] text-white/35">Offer</span>
                </div>
                {(selectedMysteryTradeCard ? mysteryTradeRows : []).map((row) => (
                  <div key={row.id}>
                    <div
                      className="flex items-center justify-between py-3 px-2 cursor-pointer hover:bg-white/5 rounded transition-colors"
                      onClick={() => setSelectedTrader(row)}
                    >
                      <span className="text-white text-sm font-medium">{row.name}</span>
                      <div className="w-12 h-16 rounded flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <span className="text-white/40 text-lg font-black">?</span>
                      </div>
                    </div>
                    <div className="h-px bg-white/10" />
                  </div>
                ))}
                {!selectedMysteryTradeCard && (
                  <div className="py-8 text-center text-white/25 text-xs">Select a card to view traders.</div>
                )}
              </div>

              <div className="shrink-0 border-t border-white/10 pt-2 mt-2">
                <div className="text-[10px] uppercase tracking-[0.2em] text-white/35">
                  Row {tradeCardRowIndex + 1} / {totalRows}
                </div>
              </div>
            </div>

              {/* RIGHT: Cards Grid (40%) */}
              <div className="w-[40%] flex flex-col pl-4 overflow-hidden">
                {/* Search Bar */}
                <div className="pb-3 mb-3 border-b border-white/6 flex items-center">
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
                <div className="text-[11px] uppercase tracking-[0.25em] text-white/35 mb-2">Cards</div>

              <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                <div className="space-y-2">
                  {mysteryTradeCards.length === 0 ? (
                    <div className="text-center text-white/25 text-xs py-8">No cards</div>
                  ) : (
                    Array.from({ length: totalRows }, (_, rowIdx) => {
                      const rowStart = rowIdx * CARDS_PER_ROW;
                      const rowCards = mysteryTradeCards.slice(rowStart, rowStart + CARDS_PER_ROW);
                      return (
                        <div key={`row-${rowIdx}`} className="flex flex-col gap-2">
                          <div className="flex gap-1.5">
                            {rowCards.map((card) => (
                              <LiquidGlassCard
                                key={card.id}
                                onClick={() => setSelectedMysteryTradeCard(card)}
                                className={`flex-1 aspect-[2.5/3.5] p-0 cursor-pointer ${selectedMysteryTradeCard?.id === card.id ? 'ring-1 ring-cyan-400/50' : ''}`}
                              >
                                <div className="w-full h-full flex items-center justify-center rounded-lg overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                  <span className="text-white/40 text-lg font-black">?</span>
                                </div>
                              </LiquidGlassCard>
                            ))}
                          </div>
                          <div className="flex gap-1.5 px-1">
                            {rowCards.map((card) => (
                              <span key={`label-${card.id}`} className="flex-1 text-center text-[9px] text-white/50 truncate">{card.label}</span>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}