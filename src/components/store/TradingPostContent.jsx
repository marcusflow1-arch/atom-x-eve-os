import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { 
  ChevronLeft, ChevronRight, Search, Gamepad2, Globe, Users, Star, 
  ArrowLeftRight, DollarSign, Gavel, MessageSquare, Plus, Package
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Mock Data
const userInventory = [
  { id: 'inv_1', name: 'Dragonscale Armor Set', type: 'Armor', game: 'Elder Scrolls: Reborn', genre: 'Fantasy RPG', rarity: 'Legendary', quantity: 1, image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=300&fit=crop', description: 'Complete armor set forged from ancient dragon scales', tradeable: true },
  { id: 'inv_2', name: 'Cyber Neural Interface', type: 'Cybernetics', game: 'Cyberpunk 2088', genre: 'Sci-Fi', rarity: 'Epic', quantity: 1, image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=300&h=300&fit=crop', description: 'Advanced neural interface for enhanced hacking abilities', tradeable: true },
  { id: 'inv_3', name: 'Phoenix Fire Spell', type: 'Ability', game: 'Mage Wars Online', genre: 'MMORPG', rarity: 'Mythic', quantity: 1, image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=300&h=300&fit=crop', description: 'Legendary spell that summons phoenix flames', tradeable: true },
  { id: 'inv_4', name: 'Quantum Rifle MK-VII', type: 'Weapon', game: 'Galactic Warfare', genre: 'Shooter', rarity: 'Epic', quantity: 2, image: 'https://images.unsplash.com/photo-1542751371-331572b78519?w=300&h=300&fit=crop', description: 'High-tech quantum rifle with energy burst capabilities', tradeable: true },
];

const tradeListings = [
  { id: 'trade_1', item: userInventory[0], owner: { name: 'SkyrimLord', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=64&h=64&fit=crop&crop=face' }, type: 'trade', seekingItems: ['Plasma Rifle', 'Cyber Armor'], description: 'Looking for sci-fi gear to complete my cyberpunk build', views: 156, offers: 12 },
  { id: 'trade_1_b', item: userInventory[0], owner: { name: 'DragonSlayer99', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=64&h=64&fit=crop&crop=face' }, type: 'sale', price: 45000, description: 'Selling my spare armor set. Gold only.', views: 42, offers: 0 },
  { id: 'trade_1_c', item: userInventory[0], owner: { name: 'MerchantGuild_Rep', avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=64&h=64&fit=crop&crop=face' }, type: 'bid', currentBid: 12000, buyoutPrice: 60000, description: 'Auctioning this legendary set. Starting low!', bidders: 15, views: 300 },
  { id: 'trade_2', item: userInventory[1], owner: { name: 'CyberNinja', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=face' }, type: 'bid', currentBid: 15000, buyoutPrice: 25000, description: 'Rare cybernetics from the Neural Wars event', bidders: 8, views: 234 },
  { id: 'trade_3', item: userInventory[2], owner: { name: 'MysticMage', avatar: 'https://images.unsplash.com/photo-1494790108755-2616c727e3d9?w=64&h=64&fit=crop&crop=face' }, type: 'sale', price: 35000, description: 'Mythic spell from limited-time Phoenix Rising event', views: 189 },
  { id: 'trade_4', item: userInventory[3], owner: { name: 'SpaceCommander', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=face' }, type: 'trade', seekingItems: ['Fantasy Weapons', 'Magic Items'], description: 'Trading sci-fi weapons for fantasy gear', views: 98, offers: 5 },
];

const rarityStyles = {
  Mythic: "bg-red-500/10 text-red-400 border-red-500/50",
  Legendary: "bg-orange-500/10 text-orange-400 border-orange-500/50",
  Epic: "bg-purple-500/10 text-purple-400 border-purple-500/50",
  Rare: "bg-blue-500/10 text-blue-400 border-blue-500/50",
  Uncommon: "bg-green-500/10 text-green-400 border-green-500/50",
  Common: "bg-slate-500/10 text-slate-400 border-slate-500/50"
};

const RarityBadge = ({ rarity }) => (
  <Badge variant="outline" className={`${rarityStyles[rarity] || rarityStyles.Common} border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider`}>
    {rarity}
  </Badge>
);

// Liquid Glass Card
const LiquidCard = ({ children, className = "", onClick }) => {
  const x = useMotionValue(0);
  const mouseX = useSpring(x, { stiffness: 500, damping: 100 });
  const waveX = useTransform(mouseX, [0, 1], ["-100%", "200%"]);

  return (
    <motion.div
      className={`relative overflow-hidden rounded-2xl transition-all duration-300 hover:border-white/20 hover:shadow-[0_0_30px_rgba(100,150,255,0.1)] cursor-pointer ${className}`}
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0.01) 100%)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
      }}
      onMouseMove={({ currentTarget, clientX }) => {
        const { left, width } = currentTarget.getBoundingClientRect();
        x.set((clientX - left) / width);
      }}
      onMouseLeave={() => x.set(0.5)}
      onClick={onClick}
    >
      <motion.div
        className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-r from-transparent via-white/8 to-transparent -skew-x-12"
        style={{ left: waveX, width: "60%", height: "100%" }}
      />
      {children}
    </motion.div>
  );
};

// Trade Action Modal
const TradeActionModal = ({ offer, item, isOpen, onClose }) => {
  const [bidAmount, setBidAmount] = useState('');

  if (!offer || !item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-slate-700 max-w-lg text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-3">
            <img src={offer.owner.avatar} alt={offer.owner.name} className="w-10 h-10 rounded-full border border-white/20" />
            <div>
              <span>Trade with {offer.owner.name}</span>
              <div className="flex items-center gap-1 text-xs text-slate-400 font-normal mt-0.5">
                <Star className="w-3 h-3 text-yellow-500 fill-current" /> 4.9 Rating • 128 Completed Trades
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Item Preview */}
          <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl border border-white/5">
            <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg object-cover" />
            <div className="flex-1">
              <h4 className="font-bold text-white">{item.name}</h4>
              <div className="flex items-center gap-2 mt-1">
                <RarityBadge rarity={item.rarity} />
                <span className="text-xs text-slate-400">{item.game}</span>
              </div>
            </div>
          </div>

          {/* Listing Info */}
          <div className="p-4 bg-slate-800/30 rounded-xl border border-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Listing Type:</span>
              <Badge className={`
                ${offer.type === 'trade' ? 'bg-blue-500/20 text-blue-400' : 
                  offer.type === 'bid' ? 'bg-purple-500/20 text-purple-400' : 
                  'bg-green-500/20 text-green-400'}
              `}>
                {offer.type === 'trade' ? 'Item Trade' : offer.type === 'bid' ? 'Auction' : 'Direct Sale'}
              </Badge>
            </div>
            {(offer.type === 'sale' || offer.type === 'bid') && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">{offer.type === 'bid' ? 'Current Bid:' : 'Price:'}</span>
                <span className="text-lg font-bold text-green-400">
                  {(offer.price || offer.currentBid)?.toLocaleString()} AGP
                </span>
              </div>
            )}
            {offer.type === 'bid' && offer.buyoutPrice && (
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm text-slate-400">Buyout Price:</span>
                <span className="text-lg font-bold text-yellow-400">{offer.buyoutPrice.toLocaleString()} AGP</span>
              </div>
            )}
            {offer.type === 'trade' && offer.seekingItems && (
              <div className="mt-2">
                <span className="text-sm text-slate-400">Looking for:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {offer.seekingItems.map((seekItem, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs border-blue-500/30 text-blue-300">{seekItem}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12">
              <ArrowLeftRight className="w-5 h-5 mr-2" />
              Offer a Trade (Your Items)
            </Button>

            {offer.type === 'bid' && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input 
                    type="number" 
                    placeholder="Enter bid amount" 
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    className="flex-1 bg-slate-800 border-slate-700"
                  />
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white px-6">
                    <Gavel className="w-4 h-4 mr-2" />
                    Place Bid
                  </Button>
                </div>
              </div>
            )}

            {offer.type === 'bid' && offer.buyoutPrice && (
              <Button className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-bold h-12">
                <DollarSign className="w-5 h-5 mr-2" />
                Instant Buyout ({offer.buyoutPrice.toLocaleString()} AGP)
              </Button>
            )}

            {offer.type === 'sale' && (
              <Button className="w-full bg-green-600 hover:bg-green-700 text-white h-12">
                <DollarSign className="w-5 h-5 mr-2" />
                Buy Now ({offer.price?.toLocaleString()} AGP)
              </Button>
            )}

            <Button variant="outline" className="w-full border-slate-600 text-slate-300 hover:bg-slate-800 h-10">
              <MessageSquare className="w-4 h-4 mr-2" />
              Message Trader
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default function TradingPostContent() {
  const [viewMode, setViewMode] = useState('games');
  const [selectedGame, setSelectedGame] = useState(null);
  const [selectedListingGroup, setSelectedListingGroup] = useState(null);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('lowest_price');

  const gamesList = useMemo(() => {
    const games = {};
    tradeListings.forEach(listing => {
      const game = listing.item.game;
      if (!games[game]) {
        games[game] = { name: game, count: 0, image: listing.item.image };
      }
      games[game].count++;
    });
    return Object.values(games);
  }, []);

  return (
    <div className="h-[calc(100vh-200px)] pt-6">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {(viewMode === 'items' || selectedListingGroup) && (
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => { 
                if (selectedListingGroup) {
                  setSelectedListingGroup(null);
                } else {
                  setViewMode('games'); 
                  setSelectedGame(null); 
                }
              }}
              className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium">Back</span>
            </motion.button>
          )}
          <h2 className="text-2xl font-bold text-white">
            {viewMode === 'games' ? 'Games' : selectedListingGroup ? selectedListingGroup.item.name : selectedGame}
          </h2>
        </div>
        
        {/* Search */}
        <div 
          className="flex items-center gap-3 px-4 py-2 rounded-full"
          style={{
            background: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <Search className="w-4 h-4 text-white/50" />
          <input 
            type="text" 
            placeholder="Search..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-white placeholder:text-white/40 text-sm w-48"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="h-full overflow-hidden">
        <AnimatePresence mode="wait">
          {viewMode === 'games' ? (
            /* Game Selection Grid */
            <motion.div
              key="games"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full"
            >
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto h-full pb-4 pr-2">
                {gamesList.map((game, idx) => (
                  <motion.div
                    key={game.name}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => { setSelectedGame(game.name); setViewMode('items'); }}
                    className="group"
                  >
                    <LiquidCard className="h-full">
                      <div className="aspect-[4/5] relative overflow-hidden">
                        <img 
                          src={game.image} 
                          alt={game.name}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80" />
                        
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <h3 className="text-white font-bold text-lg mb-1 group-hover:text-blue-300 transition-colors">
                            {game.name}
                          </h3>
                          <div className="flex items-center gap-2">
                            <span className="text-white/60 text-sm">{game.count} listings</span>
                            <div className="w-1 h-1 rounded-full bg-white/30" />
                            <span className="text-green-400 text-sm font-medium">Active</span>
                          </div>
                        </div>

                        {/* Hover Glow */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                          <div className="absolute inset-0 bg-gradient-to-t from-blue-500/20 to-transparent" />
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500" />
                        </div>
                      </div>
                    </LiquidCard>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : !selectedListingGroup ? (
            /* Item List for Selected Game */
            <motion.div
              key="items"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="h-full overflow-y-auto pr-2"
            >
              <div className="space-y-3">
                {(() => {
                  const gameListings = tradeListings.filter(l => l.item.game === selectedGame);
                  const groupedListings = gameListings.reduce((groups, listing) => {
                    const key = listing.item.name;
                    if (!groups[key]) {
                      groups[key] = { item: listing.item, offers: [] };
                    }
                    groups[key].offers.push(listing);
                    return groups;
                  }, {});

                  const filteredGroups = Object.values(groupedListings).filter(group => 
                    group.item.name.toLowerCase().includes(searchQuery.toLowerCase())
                  );

                  if (filteredGroups.length === 0) {
                    return (
                      <div className="text-center py-16">
                        <Package className="w-12 h-12 text-white/20 mx-auto mb-4" />
                        <p className="text-white/50">No items found for this game</p>
                      </div>
                    );
                  }

                  return filteredGroups.map((group, idx) => {
                    const lowestPrice = group.offers
                      .filter(o => o.type === 'sale' || o.type === 'bid')
                      .map(o => o.price || o.currentBid || Infinity)
                      .sort((a, b) => a - b)[0];

                    return (
                      <motion.div
                        key={group.item.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={() => setSelectedListingGroup(group)}
                        className="group"
                      >
                        <LiquidCard>
                          <div className="flex items-center gap-4 p-4">
                            <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-black/30">
                              <img src={group.item.image} alt={group.item.name} className="w-full h-full object-cover" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <h3 className="text-white font-bold text-lg mb-1 group-hover:text-blue-300 transition-colors truncate">
                                {group.item.name}
                              </h3>
                              <div className="flex items-center gap-3">
                                <RarityBadge rarity={group.item.rarity} />
                                <span className="text-white/40 text-sm">{group.item.type}</span>
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-2xl font-bold text-white mb-1">
                                {lowestPrice && lowestPrice !== Infinity 
                                  ? <span className="text-green-400">{lowestPrice.toLocaleString()}<span className="text-sm text-white/40 ml-1">AGP</span></span>
                                  : <span className="text-blue-400 text-lg">Trade</span>
                                }
                              </div>
                              <div className="text-white/40 text-sm">{group.offers.length} offers</div>
                            </div>

                            <ChevronRight className="w-6 h-6 text-white/20 group-hover:text-white/60 transition-colors" />
                          </div>
                        </LiquidCard>
                      </motion.div>
                    );
                  });
                })()}
              </div>
            </motion.div>
          ) : (
            /* Offers Detail View */
            <motion.div
              key="offers"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="h-full flex gap-6"
            >
              {/* Left: Item Preview */}
              <div className="w-[320px] flex-shrink-0">
                <LiquidCard className="h-full" onClick={() => {}}>
                  <div className="aspect-square relative overflow-hidden">
                    <img 
                      src={selectedListingGroup.item.image} 
                      alt={selectedListingGroup.item.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <RarityBadge rarity={selectedListingGroup.item.rarity} />
                    </div>
                  </div>

                  <div className="p-5">
                    <h2 className="text-xl font-bold text-white mb-2">{selectedListingGroup.item.name}</h2>
                    <p className="text-white/50 text-sm mb-4">{selectedListingGroup.item.description}</p>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/40">Type</span>
                        <span className="text-white">{selectedListingGroup.item.type}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/40">Game</span>
                        <span className="text-white">{selectedListingGroup.item.game}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/40">Total Offers</span>
                        <span className="text-blue-400 font-bold">{selectedListingGroup.offers.length}</span>
                      </div>
                    </div>
                  </div>
                </LiquidCard>
              </div>

              {/* Right: Offers List */}
              <div className="flex-1 flex flex-col min-w-0">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-bold text-lg">Available Offers</h3>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[180px] bg-slate-800/50 border-white/10">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lowest_price">Lowest Price</SelectItem>
                      <SelectItem value="highest_price">Highest Price</SelectItem>
                      <SelectItem value="newest">Newest Listed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                  {selectedListingGroup.offers.map((offer, idx) => (
                    <motion.div
                      key={offer.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => setSelectedOffer(offer)}
                      className="group"
                    >
                      <LiquidCard>
                        <div className="p-4">
                          <div className="flex items-center gap-4">
                            {/* Seller Avatar */}
                            <img 
                              src={offer.owner.avatar} 
                              alt={offer.owner.name}
                              className="w-12 h-12 rounded-full border-2 border-white/20"
                            />

                            {/* Seller Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-white font-bold group-hover:text-blue-400 transition-colors">{offer.owner.name}</span>
                                <div className="flex items-center gap-1">
                                  <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                  <span className="text-white/60 text-xs">4.9</span>
                                </div>
                              </div>
                              <p className="text-white/40 text-sm truncate">{offer.description}</p>
                            </div>

                            {/* Offer Type & Price */}
                            <div className="text-right">
                              <div className={`text-xs font-bold uppercase mb-1 ${
                                offer.type === 'sale' ? 'text-green-400' :
                                offer.type === 'bid' ? 'text-purple-400' :
                                'text-blue-400'
                              }`}>
                                {offer.type === 'sale' ? 'BUY NOW' : offer.type === 'bid' ? 'AUCTION' : 'TRADE'}
                              </div>
                              {(offer.price || offer.currentBid) && (
                                <div className="text-xl font-bold text-white">
                                  {(offer.price || offer.currentBid).toLocaleString()}
                                  <span className="text-xs text-white/40 ml-1">AGP</span>
                                </div>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col gap-2">
                              {offer.type === 'sale' && (
                                <button className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm font-bold transition-colors">
                                  Buy
                                </button>
                              )}
                              {offer.type === 'bid' && (
                                <button className="px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white text-sm font-bold transition-colors">
                                  Bid
                                </button>
                              )}
                              {offer.type === 'trade' && (
                                <button className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold transition-colors">
                                  Offer
                                </button>
                              )}
                              <button className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors flex items-center justify-center">
                                <MessageSquare className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </LiquidCard>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Trade Action Modal */}
      <TradeActionModal 
        offer={selectedOffer} 
        item={selectedListingGroup?.item}
        isOpen={!!selectedOffer} 
        onClose={() => setSelectedOffer(null)} 
      />
    </div>
  );
}