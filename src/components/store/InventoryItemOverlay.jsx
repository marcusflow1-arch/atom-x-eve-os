import React from 'react';
import { motion } from 'framer-motion';
import { X, Coins, DollarSign, Gavel, ArrowLeftRight, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ShinyCard from '@/components/shared/ShinyCard';

const rarityStyles = {
  Common: { color: "text-slate-300", bg: "bg-slate-800/80", border: "border-slate-600" },
  Uncommon: { color: "text-green-400", bg: "bg-green-900/80", border: "border-green-500/80" },
  Rare: { color: "text-blue-400", bg: "bg-blue-900/80", border: "border-blue-500/80" },
  Epic: { color: "text-purple-400", bg: "bg-purple-900/80", border: "border-purple-500/80" },
  Legendary: { color: "text-orange-400", bg: "bg-orange-900/80", border: "border-orange-500/80" },
  Mythic: { color: "text-red-400", bg: "bg-red-900/80", border: "border-red-500/80" }
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
        className={`relative w-full max-w-5xl rounded-2xl border-2 ${rarity.border} ${rarity.bg} shadow-2xl overflow-hidden flex`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-10 bg-black/80 hover:bg-black text-white p-2 rounded-full transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Left Side - Card Display */}
        <div className="w-[40%] p-12 flex flex-col items-center justify-center border-r border-white/10">
          {/* Card */}
          <div className="w-full max-w-xs aspect-[2.5/3.5] mb-6">
            <ShinyCard className="h-full">
              <div className="relative h-full flex flex-col">
                <div className="absolute inset-0">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                </div>
                
                <div className="relative z-10 flex-1 flex flex-col justify-between p-5">
                  <div className="flex justify-between items-start">
                    <Badge className="bg-slate-900/80 backdrop-blur-md text-white/90 border-white/20 text-xs px-3 py-1">
                      {item.type}
                    </Badge>
                    <Badge variant="outline" className={`${rarity.border} ${rarity.color} text-xs px-3 py-1 font-bold`}>
                      {item.rarity}
                    </Badge>
                  </div>
                  
                  <div>
                    <h3 className="text-white font-bold text-2xl mb-2 leading-tight drop-shadow-lg">
                      {item.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-white/30 text-white/80 bg-black/30 backdrop-blur-sm">
                        Level {item.level}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </ShinyCard>
          </div>

          {/* Card Name & Rarity Below */}
          <div className="text-center">
            <h3 className={`text-2xl font-bold mb-2 ${rarity.color}`}>{item.name}</h3>
            <div className="flex items-center justify-center gap-2">
              <span className="text-slate-400">{item.game}</span>
              <Badge className={`${rarity.bg} ${rarity.color} border ${rarity.border}`}>{item.rarity}</Badge>
            </div>
          </div>
        </div>

        {/* Right Side - Item Record */}
        <div className="flex-1 p-8 overflow-y-auto bg-slate-900/50">
          {/* Header */}
          <div className="mb-6 pb-4 border-b-2 border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
              <Package className="w-6 h-6 text-blue-400" />
              Item Record
            </h2>
            <p className="text-slate-400 text-sm">Detailed information about this item</p>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Description</h3>
            <p className="text-slate-300 text-lg italic">"{item.description}"</p>
          </div>

          {/* Series & Rarity */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Series</h3>
              <p className="text-white font-semibold text-lg">{item.game}</p>
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Rarity</h3>
              <Badge className={`${rarity.bg} ${rarity.color} ${rarity.border} border text-sm px-3 py-1`}>{item.rarity}</Badge>
            </div>
          </div>

          {/* Market Stats */}
          <div className="mb-6">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Market Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800/60 backdrop-blur-sm rounded-lg p-4 border border-slate-700">
                <div className="text-xs text-slate-400 uppercase mb-1">Average Price</div>
                <div className="text-3xl font-bold text-white">{item.marketPrice}</div>
              </div>
              <div className="bg-purple-900/40 backdrop-blur-sm rounded-lg p-4 border border-purple-500/50">
                <div className="text-xs text-purple-300 uppercase mb-1">Last Bid</div>
                <div className="text-3xl font-bold text-purple-400">{item.last_bid_price || Math.floor(item.marketPrice * 0.8)}</div>
              </div>
              <div className="bg-green-900/40 backdrop-blur-sm rounded-lg p-4 border border-green-500/50">
                <div className="text-xs text-green-300 uppercase mb-1">Last Sold</div>
                <div className="text-3xl font-bold text-green-400">{item.last_sale_price || item.marketPrice}</div>
              </div>
              <div className="bg-slate-800/60 backdrop-blur-sm rounded-lg p-4 border border-slate-700">
                <div className="text-xs text-slate-400 uppercase mb-1">Power</div>
                <div className="text-3xl font-bold text-blue-400">{item.power}</div>
              </div>
            </div>
          </div>

          {/* Item Details */}
          <div className="mb-6">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Item Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center pb-3 border-b border-slate-700/50">
                <span className="text-slate-400">Item ID</span>
                <span className="text-white font-mono text-xs">{item.id}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-700/50">
                <span className="text-slate-400">Type</span>
                <span className="text-white font-semibold">{item.type}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-700/50">
                <span className="text-slate-400">Collection</span>
                <span className="text-white font-semibold">{item.game}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-auto pt-6 border-t-2 border-slate-700">
            <div className="text-slate-400 text-sm mb-4">
              <span className="font-semibold text-white">💡 Tip:</span> Items posted to the market will appear in the Global Market for other players to buy
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <Button 
                onClick={() => { onSale(item); }}
                className="bg-green-600 hover:bg-green-700 text-white font-bold flex-col gap-2 h-24 text-base"
              >
                <DollarSign className="w-6 h-6" />
                <span>Sale</span>
              </Button>
              <Button 
                onClick={() => { onTrade(item); }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold flex-col gap-2 h-24 text-base"
              >
                <ArrowLeftRight className="w-6 h-6" />
                <span>Trade</span>
              </Button>
              <Button 
                onClick={() => { onBid(item); }}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold flex-col gap-2 h-24 text-base"
              >
                <Gavel className="w-6 h-6" />
                <span>Bid</span>
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}