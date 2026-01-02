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
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Translucent backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl rounded-2xl overflow-hidden flex"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.02) 100%)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Left Side - Compact Card Display */}
        <div className="w-[200px] flex-shrink-0 p-5 flex flex-col items-center justify-center border-r border-white/10">
          {/* Card */}
          <div className="w-full aspect-[2.5/3.5] mb-3">
            <ShinyCard className="h-full">
              <div className="relative h-full flex flex-col">
                <div className="absolute inset-0">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                </div>
                
                <div className="relative z-10 flex-1 flex flex-col justify-between p-3">
                  <div className="flex justify-between items-start">
                    <Badge className="bg-black/60 backdrop-blur-md text-white/90 border-white/20 text-[9px] px-1.5 py-0.5">
                      {item.type}
                    </Badge>
                    <Badge variant="outline" className={`${rarity.border} ${rarity.color} text-[9px] px-1.5 py-0.5 font-bold`}>
                      {item.rarity}
                    </Badge>
                  </div>
                  
                  <div>
                    <h3 className="text-white font-bold text-sm leading-tight drop-shadow-lg">
                      {item.name}
                    </h3>
                    <Badge variant="outline" className="border-white/30 text-white/80 bg-black/30 backdrop-blur-sm text-[9px] mt-1">
                      Lv {item.level}
                    </Badge>
                  </div>
                </div>
              </div>
            </ShinyCard>
          </div>

          {/* Card Name & Rarity Below */}
          <div className="text-center">
            <h3 className="text-white font-bold text-sm mb-1">{item.name}</h3>
            <div className="flex items-center justify-center gap-1.5">
              <span className="text-white/50 text-[10px]">{item.game}</span>
            </div>
          </div>
        </div>

        {/* Right Side - Compact Item Record */}
        <div className="flex-1 p-5 flex flex-col">
          {/* Header */}
          <div className="mb-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-cyan-400" />
              Item Record
            </h2>
          </div>

          {/* Description */}
          <div className="mb-3">
            <p className="text-white/60 text-xs italic line-clamp-2">"{item.description}"</p>
          </div>

          {/* Stats Section - Compact Grid */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            <div className="bg-white/5 rounded-lg p-2 text-center">
              <div className="text-[9px] text-white/40 uppercase mb-0.5">Avg Price</div>
              <div className="text-base font-bold text-white">{item.marketPrice}</div>
            </div>
            <div className="bg-white/5 rounded-lg p-2 text-center">
              <div className="text-[9px] text-white/40 uppercase mb-0.5">Last Bid</div>
              <div className="text-base font-bold text-purple-400">{item.last_bid_price || Math.floor(item.marketPrice * 0.8)}</div>
            </div>
            <div className="bg-white/5 rounded-lg p-2 text-center">
              <div className="text-[9px] text-white/40 uppercase mb-0.5">Last Sold</div>
              <div className="text-base font-bold text-green-400">{item.last_sale_price || item.marketPrice}</div>
            </div>
            <div className="bg-white/5 rounded-lg p-2 text-center">
              <div className="text-[9px] text-white/40 uppercase mb-0.5">Power</div>
              <div className="text-base font-bold text-cyan-400">{item.power}</div>
            </div>
          </div>

          {/* Item Details - Inline */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mb-4 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="text-white/40">Series:</span>
              <span className="text-white">{item.game}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-white/40">Type:</span>
              <span className="text-white">{item.type}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-white/40">Rarity:</span>
              <Badge className={`${rarity.bg} ${rarity.color} text-[9px] px-1.5 py-0 h-4`}>{item.rarity}</Badge>
            </div>
          </div>

          {/* Action Buttons - Compact */}
          <div className="mt-auto pt-3 border-t border-white/10">
            <div className="grid grid-cols-3 gap-2">
              <Button 
                onClick={() => { onSale(item); }}
                className="bg-green-600/80 hover:bg-green-600 text-white font-bold text-xs h-10 gap-1.5"
              >
                <DollarSign className="w-4 h-4" />
                Sale
              </Button>
              <Button 
                onClick={() => { onTrade(item); }}
                className="bg-blue-600/80 hover:bg-blue-600 text-white font-bold text-xs h-10 gap-1.5"
              >
                <ArrowLeftRight className="w-4 h-4" />
                Trade
              </Button>
              <Button 
                onClick={() => { onBid(item); }}
                className="bg-purple-600/80 hover:bg-purple-600 text-white font-bold text-xs h-10 gap-1.5"
              >
                <Gavel className="w-4 h-4" />
                Bid
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}