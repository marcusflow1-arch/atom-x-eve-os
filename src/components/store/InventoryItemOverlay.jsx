import React from 'react';
import { motion } from 'framer-motion';
import { X, Coins, DollarSign, Gavel, ArrowLeftRight, TrendingUp, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ShinyCard from '@/components/shared/ShinyCard';

const rarityStyles = {
  Common: { color: "text-slate-300", border: "border-slate-600" },
  Uncommon: { color: "text-green-400", border: "border-green-500" },
  Rare: { color: "text-blue-400", border: "border-blue-500" },
  Epic: { color: "text-purple-400", border: "border-purple-500" },
  Legendary: { color: "text-orange-400", border: "border-orange-500" },
  Mythic: { color: "text-red-400", border: "border-red-500" }
};

export default function InventoryItemOverlay({ item, onClose, onSale, onTrade, onBid }) {
  if (!item) return null;

  const rarity = rarityStyles[item.rarity] || rarityStyles.Common;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden flex"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Left Side - Card Display */}
        <div className="w-1/3 p-8 flex flex-col items-center justify-center bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-r border-white/10">
          {/* Price Stats - Top Corner */}
          <div className="absolute top-6 left-6 space-y-2">
            <div className="bg-purple-600/90 backdrop-blur-md px-3 py-2 rounded-lg border border-purple-400/30 shadow-lg">
              <div className="text-[9px] text-purple-100 uppercase font-bold tracking-wider">Last Bid</div>
              <div className="text-sm font-black text-white flex items-center gap-1">
                <Coins className="w-3 h-3" />
                {item.last_bid_price || Math.floor(item.marketPrice * 0.8)}
              </div>
            </div>
            <div className="bg-green-600/90 backdrop-blur-md px-3 py-2 rounded-lg border border-green-400/30 shadow-lg">
              <div className="text-[9px] text-green-100 uppercase font-bold tracking-wider">Last Sold</div>
              <div className="text-sm font-black text-white flex items-center gap-1">
                <Coins className="w-3 h-3" />
                {item.last_sale_price || item.marketPrice}
              </div>
            </div>
          </div>

          {/* Card */}
          <div className="w-full max-w-xs aspect-[2.5/3.5]">
            <ShinyCard className="h-full">
              <div className="relative h-full flex flex-col">
                <div className="absolute inset-0">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                </div>
                
                <div className="relative z-10 flex-1 flex flex-col justify-between p-4">
                  <div className="flex justify-between items-start">
                    <Badge className="bg-slate-900/80 backdrop-blur-md text-white/90 border-white/20 text-[10px] px-2">
                      {item.type}
                    </Badge>
                    <Badge variant="outline" className={`${rarity.border} ${rarity.color} text-[10px] px-2 font-bold`}>
                      {item.rarity}
                    </Badge>
                  </div>
                  
                  <div>
                    <h3 className="text-white font-bold text-lg mb-1 line-clamp-2 leading-tight drop-shadow-lg">
                      {item.name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs">
                      <Badge variant="outline" className="border-white/30 text-white/80 bg-black/30 backdrop-blur-sm text-[10px]">
                        Lv. {item.level}
                      </Badge>
                      <span className="text-white/60">Power: {item.power}</span>
                    </div>
                  </div>
                </div>
              </div>
            </ShinyCard>
          </div>
        </div>

        {/* Right Side - Details and Actions */}
        <div className="flex-1 p-8 flex flex-col">
          {/* Item Info */}
          <div className="mb-6">
            <h2 className={`text-3xl font-black mb-2 ${rarity.color}`}>{item.name}</h2>
            <p className="text-slate-400 text-sm italic mb-4">"{item.description}"</p>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-slate-800/50 rounded-lg p-3 border border-white/10">
                <div className="text-xs text-slate-500 uppercase mb-1">Type</div>
                <div className="text-white font-semibold">{item.type}</div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3 border border-white/10">
                <div className="text-xs text-slate-500 uppercase mb-1">Game</div>
                <div className="text-white font-semibold">{item.game}</div>
              </div>
            </div>
          </div>

          {/* Market Info */}
          <div className="mb-6 p-4 bg-cyan-950/20 rounded-xl border border-cyan-500/20">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-bold text-cyan-400 uppercase flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Market Value
              </div>
              <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 text-[10px]">
                {item.demand || 'Normal'} Demand
              </Badge>
            </div>
            
            <div className="flex items-end justify-between mb-3">
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Average Price</div>
                <div className="text-2xl font-black text-white flex items-center gap-1">
                  <Coins className="w-5 h-5 text-amber-400" /> {item.marketPrice}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-400 uppercase">Last Activity</div>
                <div className="text-xs text-white flex items-center gap-1">
                  <Clock className="w-3 h-3" /> 2 mins ago
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-auto">
            <div className="text-slate-500 text-xs mb-4">
              💡 <span className="font-semibold text-slate-400">Tip:</span> Items posted to the market will appear in the Global Market for other players to buy
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <Button 
                onClick={() => { onSale(item); onClose(); }}
                className="bg-green-600 hover:bg-green-700 text-white font-bold flex-col gap-1 h-20"
              >
                <DollarSign className="w-5 h-5" />
                <span>Sale</span>
              </Button>
              <Button 
                onClick={() => { onTrade(item); onClose(); }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold flex-col gap-1 h-20"
              >
                <ArrowLeftRight className="w-5 h-5" />
                <span>Trade</span>
              </Button>
              <Button 
                onClick={() => { onBid(item); onClose(); }}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold flex-col gap-1 h-20"
              >
                <Gavel className="w-5 h-5" />
                <span>Bid</span>
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}