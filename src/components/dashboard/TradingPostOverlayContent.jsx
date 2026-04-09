import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Gamepad2, ChevronLeft, Search, Layers, DollarSign, Gavel, Mic,
  ArrowLeftRight, Star, Eye, Filter, ArrowUpDown, Globe, ChevronRight
} from 'lucide-react';
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

export default function TradingPostOverlayContent() {
  const { user } = useAuth();
  const [games, setGames] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [offerSort, setOfferSort] = useState('price-low');
  const [offerTypeFilter, setOfferTypeFilter] = useState('all');
  const [selectedMysteryTradeCard, setSelectedMysteryTradeCard] = useState(null);
  const [tradeCardRowIndex, setTradeCardRowIndex] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [g, a] = await Promise.all([
          base44.entities.Game.list(),
          base44.entities.Achievement.list(),
        ]);
        setGames(g || []);
        setAchievements(a || []);
      } catch (e) {
        console.error('TradingPost fetch error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const { data: tradeOffers } = useQuery({
    queryKey: ['tradeOffers-overlay'],
    queryFn: async () => {
      const result = await base44.entities.TradeOffer.filter({ status: 'active' }, '-created_date', 200);
      return result || [];
    },
    initialData: [],
  });

  const filteredGames = useMemo(() => {
    let g = [...games];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      g = g.filter(game => (game.title || '').toLowerCase().includes(q));
    }
    return g;
  }, [games, searchQuery]);

  // Items (achievements) for the selected game
  const gameItems = useMemo(() => {
    if (!selectedGame) return [];
    return achievements.filter(a => (a.game || '').toLowerCase() === (selectedGame.title || '').toLowerCase());
  }, [selectedGame, achievements]);

  // Offers for selected item
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

    // If no real offers, show a mock one
    if (offers.length === 0) {
      offers = [
        { id: 'mock-1', seller: { name: 'MarketBot', avatar: '', rating: 5.0 }, type: 'sale', price: selectedItem.points ? selectedItem.points * 10 : 500, description: 'System listing — fixed price.', postedAt: 'Today' },
      ];
    }

    // Filter
    if (offerTypeFilter !== 'all') {
      offers = offers.filter(o => o.type === offerTypeFilter);
    }
    // Sort
    if (offerSort === 'price-low') offers.sort((a, b) => (a.price || 0) - (b.price || 0));
    else if (offerSort === 'price-high') offers.sort((a, b) => (b.price || 0) - (a.price || 0));

    return offers;
  }, [selectedItem, selectedGame, tradeOffers, offerTypeFilter, offerSort]);

  const mysteryTradeCards = useMemo(() => Array.from({ length: 70 }, (_, i) => ({
    id: `trade-mystery-${i + 1}`,
    label: `Trade Card ${i + 1}`,
  })), []);

  const visibleMysteryTradeCards = useMemo(() => {
    const start = tradeCardRowIndex * 7;
    return mysteryTradeCards.slice(start, start + 7);
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

  const selectedTradeCardDetails = useMemo(() => {
    if (!selectedMysteryTradeCard) return null;
    return {
      title: selectedMysteryTradeCard.label,
      type: mysteryTradeRows[0]?.type || 'Trade',
      value: mysteryTradeRows[0]?.value,
      traders: mysteryTradeRows.length,
    };
  }, [selectedMysteryTradeCard, mysteryTradeRows]);

  const handleBack = () => {
    if (selectedOffer) setSelectedOffer(null);
    else if (selectedItem) { setSelectedItem(null); setSelectedOffer(null); }
    else if (selectedGame) setSelectedGame(null);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-t-transparent border-cyan-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex min-h-0">
      {/* LEFT: Game list */}
      <div className="h-full flex flex-col overflow-hidden flex-shrink-0"
        style={{ width: '225px', minWidth: '225px', background: 'rgba(10, 14, 20, 0.65)', backdropFilter: 'blur(30px)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>

        <div className="p-4 border-b border-white/6">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <ArrowLeftRight className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-sm">Trading Post</h2>
              <p className="text-white/35 text-[10px]">Buy, bid, or trade items</p>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search games..."
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-10 py-2 text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-white/20"
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center">
              <Mic className="w-3.5 h-3.5 text-white/45" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2.5 space-y-1" style={{ scrollbarWidth: 'none' }}>
          {filteredGames.map(game => (
            <motion.button
              key={game.id}
              whileHover={{ x: 2 }}
              onClick={() => { setSelectedGame(game); setSelectedItem(null); setSelectedOffer(null); }}
              className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all border ${
                selectedGame?.id === game.id ? 'bg-white/10 border-white/15' : 'bg-transparent border-transparent hover:bg-white/5 hover:border-white/6'
              }`}
            >
              <div className="w-10 h-14 rounded-lg overflow-hidden flex-shrink-0 border border-white/8 bg-black/30">
                {game.cover_image ? (
                  <img src={game.cover_image} alt={game.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Gamepad2 className="w-4 h-4 text-white/10" /></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white text-xs font-semibold truncate">{game.title}</h3>
                <span className="text-white/30 text-[10px]">{game.genre}</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-white/15 flex-shrink-0" />
            </motion.button>
          ))}
        </div>
      </div>

      {/* RIGHT: Items → Offers → Detail */}
      <div className="flex-1 h-full overflow-hidden" style={{ background: 'rgba(8, 12, 18, 0.55)', backdropFilter: 'blur(20px)' }}>
        <AnimatePresence mode="wait">
          {/* Level 2: Offer detail */}
          {selectedOffer ? (
            <motion.div key="offer-detail" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }} className="h-full flex flex-col p-5">
              <div className="flex items-center gap-3 mb-6">
                <button onClick={handleBack} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/8">
                  <ChevronLeft className="w-4 h-4 text-white/60" />
                </button>
                <h2 className="text-white font-bold text-lg">Transaction Details</h2>
              </div>

              <div className="flex-1 grid grid-cols-3 gap-6 overflow-hidden">
                <div className="col-span-1 bg-slate-900/50 rounded-2xl border border-white/10 p-5 flex flex-col gap-4">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-white/5 border-2 border-white/10 mx-auto mb-3 flex items-center justify-center overflow-hidden">
                      {selectedOffer.seller.avatar ? (
                        <img src={selectedOffer.seller.avatar} className="w-full h-full object-cover" />
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

          /* Level 1: Item selected → show sellers */
          ) : selectedItem ? (
            <motion.div key="item-offers" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="h-full flex flex-col">
              <div className="p-5 pb-3 border-b border-white/6 flex items-center gap-4">
                <button onClick={handleBack} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/8">
                  <ChevronLeft className="w-4 h-4 text-white/60" />
                </button>
                <div className="flex-1 min-w-0">
                  <h2 className="text-white font-bold text-lg truncate">{selectedItem.title}</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <RarityBadge rarity={selectedItem.rarity} />
                    <span className="text-white/30 text-xs">{itemOffers.length} seller{itemOffers.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                {/* Filter/Sort */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <select value={offerTypeFilter} onChange={(e) => setOfferTypeFilter(e.target.value)} className="bg-slate-800 border border-white/20 text-white text-[10px] rounded-lg px-2 py-1.5">
                    <option value="all">All Types</option>
                    <option value="sale">Buy</option>
                    <option value="bid">Bid</option>
                    <option value="trade">Trade</option>
                  </select>
                  <select value={offerSort} onChange={(e) => setOfferSort(e.target.value)} className="bg-slate-800 border border-white/20 text-white text-[10px] rounded-lg px-2 py-1.5">
                    <option value="price-low">Price ↑</option>
                    <option value="price-high">Price ↓</option>
                  </select>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-2" style={{ scrollbarWidth: 'none' }}>
                {itemOffers.map((offer, idx) => (
                  <motion.div
                    key={offer.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    onClick={() => setSelectedOffer(offer)}
                    className="p-4 rounded-xl cursor-pointer border border-white/10 hover:border-blue-500/30 transition-all"
                    style={{ background: 'rgba(255,255,255,0.03)' }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {offer.seller.avatar ? (
                          <img src={offer.seller.avatar} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-white/30 text-sm font-bold">{(offer.seller.name || 'U')[0]}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-white font-bold text-sm">{offer.seller.name}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Badge variant="secondary" className="text-[9px] uppercase bg-white/10 text-white/60 h-4">
                            {offer.type === 'sale' ? 'Selling' : offer.type === 'bid' ? 'Auction' : 'Trading'}
                          </Badge>
                          <span className="text-[10px] text-white/25">{offer.postedAt}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-lg font-bold text-white">{(offer.price || 0).toLocaleString()} <span className="text-[10px] text-white/40">AGP</span></div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

          /* Level 0: Game selected → show items */
          ) : selectedGame ? (
            <motion.div key={`items-${selectedGame.id}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="h-full flex flex-col">
              <div className="p-5 pb-3 border-b border-white/6 flex items-center gap-4">
                <div className="w-12 h-16 rounded-lg overflow-hidden border border-white/10 flex-shrink-0">
                  {selectedGame.cover_image ? (
                    <img src={selectedGame.cover_image} alt="" className="w-full h-full object-cover" />
                  ) : <div className="w-full h-full bg-black/30" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-white font-bold text-lg truncate">{selectedGame.title}</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge className="bg-white/10 text-white/70 border-white/20 text-[10px]">{selectedGame.genre}</Badge>
                    <span className="text-white/30 text-xs">{gameItems.length} items</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                  <div className="flex-1 min-h-0 overflow-hidden px-5 pt-4">
                    <div className="h-full rounded-t-2xl border border-white/6 border-b-0 bg-white/[0.02] flex flex-col overflow-hidden">
                      <div className="px-4 py-2 text-[11px] uppercase tracking-[0.25em] text-white/35">Trade / Sell List</div>
                      {selectedTradeCardDetails && (
                        <div className="px-4 pb-2">
                          <div className="flex items-center justify-between gap-4 text-white/70">
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-white truncate">{selectedTradeCardDetails.title}</div>
                              <div className="text-[10px] uppercase tracking-[0.18em] text-white/35 mt-1">{selectedTradeCardDetails.type} listing</div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="text-cyan-300 text-sm font-bold">${selectedTradeCardDetails.value}</div>
                              <div className="text-[10px] text-white/35">{selectedTradeCardDetails.traders} traders</div>
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="mx-4 mb-2 h-px bg-white/10" />
                      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2" style={{ scrollbarWidth: 'none' }}>
                        {(selectedMysteryTradeCard ? mysteryTradeRows : []).map((row) => (
                          <button key={row.id} className="w-full text-left rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] px-3 py-2.5 transition-all">
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <div className="text-white text-sm font-semibold truncate">{row.name}</div>
                                <div className="text-white/35 text-[10px] uppercase tracking-[0.18em] mt-1 truncate">{row.type}</div>
                              </div>
                              <div className="text-cyan-300 text-sm font-bold shrink-0">${row.value}</div>
                            </div>
                          </button>
                        ))}
                        {!selectedMysteryTradeCard && (
                          <div className="h-full min-h-[120px] flex items-center justify-center text-center text-white/25 text-xs px-4">Select a card below to view traders and sellers.</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 px-5">
                    <div className="h-px bg-white/10" />
                    <div className="flex items-center justify-between gap-4 px-1 py-2 text-[10px] uppercase tracking-[0.2em] text-white/35">
                      <div>Row {tradeCardRowIndex + 1} / 10</div>
                      <div className="flex items-center gap-2 text-white/40 normal-case tracking-normal text-xs w-[30%] min-w-[140px] justify-end">
                        <span>Search bar</span>
                        <Search className="w-3.5 h-3.5" />
                        <Mic className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 px-5 pb-0">
                    <div
                      className="flex gap-3 items-end"
                      onWheel={(e) => {
                        e.preventDefault();
                        setTradeCardRowIndex((prev) => {
                          if (e.deltaY > 0) return Math.min(9, prev + 1);
                          if (e.deltaY < 0) return Math.max(0, prev - 1);
                          return prev;
                        });
                      }}
                    >
                      {visibleMysteryTradeCards.map((card) => (
                        <LiquidGlassCard key={card.id} onClick={() => setSelectedMysteryTradeCard(card)} className={`aspect-[2.5/3.5] w-full max-w-[84px] p-0 translate-y-[1px] ${selectedMysteryTradeCard?.id === card.id ? 'shadow-[0_0_18px_rgba(103,232,249,0.22)]' : ''}`}>
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/10 via-white/[0.05] to-transparent">
                            <span className="text-white/75 text-3xl font-black">?</span>
                          </div>
                        </LiquidGlassCard>
                      ))}
                    </div>
                  </div>
              </div>
            </motion.div>
          ) : (
            /* No game selected */
            <motion.div key="no-game" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col items-center justify-center text-center px-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/20 flex items-center justify-center mb-4">
                <ArrowLeftRight className="w-8 h-8 text-blue-400/60" />
              </div>
              <h2 className="text-xl font-bold text-white/60 mb-2">Trading Post</h2>
              <p className="text-white/30 text-sm max-w-sm mb-1">Click a game to see its items. Click an item to see who's selling, bidding, or trading.</p>
              <p className="text-white/20 text-xs">Select a game from the left to begin</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}