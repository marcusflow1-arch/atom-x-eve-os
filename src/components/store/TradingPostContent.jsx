import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ChevronLeft, ChevronRight, Search, Gamepad2, Globe, Users, Star, ArrowLeftRight, DollarSign, Gavel, MessageSquare, Info, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '../auth/AuthContext';

const userInventory = [
  { id: 'inv_1', name: 'Dragonscale Armor Set', type: 'Armor', game: 'Elder Scrolls: Reborn', genre: 'Fantasy RPG', rarity: 'Legendary', quantity: 1, image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=300&fit=crop', description: 'Complete armor set forged from ancient dragon scales', tradeable: true },
  { id: 'inv_2', name: 'Cyber Neural Interface', type: 'Cybernetics', game: 'Cyberpunk 2088', genre: 'Sci-Fi', rarity: 'Epic', quantity: 1, image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=300&h=300&fit=crop', description: 'Advanced neural interface for enhanced hacking abilities', tradeable: true },
  { id: 'inv_3', name: 'Phoenix Fire Spell', type: 'Ability', game: 'Mage Wars Online', genre: 'MMORPG', rarity: 'Mythic', quantity: 1, image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=300&h=300&fit=crop', description: 'Legendary spell that summons phoenix flames', tradeable: true },
];

const tradeListings = [
  { id: 'trade_1', item: userInventory[0], owner: { name: 'SkyrimLord', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=64&h=64&fit=crop&crop=face' }, type: 'trade', seekingItems: ['Plasma Rifle', 'Cyber Armor'], description: 'Looking for sci-fi gear', views: 156, offers: 12 },
  { id: 'trade_2', item: userInventory[1], owner: { name: 'CyberNinja', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=face' }, type: 'bid', currentBid: 15000, buyoutPrice: 25000, description: 'Rare cybernetics from Neural Wars event', bidders: 8, views: 234 },
  { id: 'trade_3', item: userInventory[2], owner: { name: 'MysticMage', avatar: 'https://images.unsplash.com/photo-1494790108755-2616c727e3d9?w=64&h=64&fit=crop&crop=face' }, type: 'sale', price: 35000, description: 'Mythic spell from Phoenix Rising event', views: 189 },
];

const RarityBadge = ({ rarity }) => {
  const styles = {
    Mythic: "bg-red-500/10 text-red-400 border-red-500/50",
    Legendary: "bg-orange-500/10 text-orange-400 border-orange-500/50",
    Epic: "bg-purple-500/10 text-purple-400 border-purple-500/50",
    Rare: "bg-blue-500/10 text-blue-400 border-blue-500/50",
  };

  return (
    <Badge variant="outline" className={`${styles[rarity] || 'bg-slate-500/10 text-slate-400'} border px-2 py-0.5 text-[10px] font-bold`}>
      {rarity}
    </Badge>
  );
};

const LiquidCard = ({ children, className = "", onClick }) => {
  const x = useMotionValue(0);
  const mouseX = useSpring(x, { stiffness: 500, damping: 100 });
  const waveX = useTransform(mouseX, [0, 1], ["-100%", "200%"]);

  return (
    <motion.div
      className={`relative overflow-hidden rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/10 transition-all duration-300 hover:border-white/20 hover:bg-slate-800/60 cursor-pointer ${className}`}
      onMouseMove={({ currentTarget, clientX }) => {
        const { left, width } = currentTarget.getBoundingClientRect();
        x.set((clientX - left) / width);
      }}
      onMouseLeave={() => x.set(0.5)}
      onClick={onClick}
    >
      <motion.div
        className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12"
        style={{ left: waveX, width: "60%", height: "100%" }}
      />
      {children}
    </motion.div>
  );
};

export default function TradingPostContent() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState('games');
  const [selectedGame, setSelectedGame] = useState(null);
  const [selectedListingGroup, setSelectedListingGroup] = useState(null);

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
    <div className="h-[calc(100vh-200px)]">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {viewMode === 'items' && (
            <button
              onClick={() => { setViewMode('games'); setSelectedGame(null); setSelectedListingGroup(null); }}
              className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Back</span>
            </button>
          )}
          <h2 className="text-2xl font-bold text-white">
            {viewMode === 'games' ? 'Games' : selectedGame}
          </h2>
        </div>
      </div>

      <div className="h-full overflow-hidden">
        <AnimatePresence mode="wait">
          {viewMode === 'games' ? (
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
                      </div>
                    </LiquidCard>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : (
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

                  return Object.values(groupedListings).map((group, idx) => {
                    const lowestPrice = group.offers
                      .filter(o => o.type === 'sale' || o.type === 'bid')
                      .map(o => o.price || o.currentBid || Infinity)
                      .sort((a, b) => a - b)[0];

                    return (
                      <LiquidCard key={group.item.id} onClick={() => setSelectedListingGroup(group)}>
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
                    );
                  });
                })()}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}