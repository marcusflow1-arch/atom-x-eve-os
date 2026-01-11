import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeftRight, Tag, Clock, Eye, AlertTriangle, 
  Check, X, History, Shield, Star, Crown, TrendingUp
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { calculateMarketValue, calculateTradeTax, canTradeCard, ValueBreakdown } from './MarketValuation';
import { MaterialCard, MATERIAL_INFO } from './MaterialSystem';

export default function TradingPanel({ card, onClose, onListCard }) {
  const [listingType, setListingType] = useState('fixed_price');
  const [askingPrice, setAskingPrice] = useState(calculateMarketValue(card));
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const tradeCheck = canTradeCard(card, card.last_trade_date);
  const marketValue = calculateMarketValue(card);
  const tax = calculateTradeTax(card, askingPrice);
  const netProceeds = askingPrice - tax;

  // Mock card history
  const cardHistory = [
    { type: 'upgrade', action: 'Leveled to 15', date: '2 days ago' },
    { type: 'enhance', action: 'Enhanced Attack +20', date: '3 days ago' },
    { type: 'acquire', action: 'Unlocked via Achievement', date: '1 week ago', achievement: 'Dragon Slayer' },
  ];

  const handleListCard = () => {
    if (!tradeCheck.canTrade) return;
    
    onListCard?.({
      card_id: card.id,
      listing_type: listingType,
      asking_price: listingType === 'fixed_price' ? askingPrice : null,
      asking_materials: listingType === 'trade_offer' ? selectedMaterials : null,
      market_value_score: marketValue,
      card_snapshot: {
        name: card.title || card.name,
        rarity: card.rarity,
        level: card.level,
        stars: card.stars,
        ascension: card.ascension,
        enhanced_stats: card.enhanced_stats,
        origin_game: card.series,
        image: card.image
      }
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-8"
      style={{ background: 'rgba(0, 0, 0, 0.8)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-4xl rounded-3xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(30, 40, 50, 0.95) 0%, rgba(20, 25, 35, 0.95) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-500/30">
              <ArrowLeftRight className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Trade Card</h2>
              <p className="text-white/50 text-sm">List on the marketplace</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 flex gap-6">
          {/* Left: Card Preview */}
          <div className="w-[240px] flex-shrink-0">
            <div className="aspect-[2.5/3.5] rounded-xl overflow-hidden border-2 border-white/20 mb-4">
              <img src={card.image} alt={card.title} className="w-full h-full object-cover" />
            </div>
            
            {/* Card Stats Summary */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/60">Level</span>
                <span className="text-white font-bold">{card.level || 1}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Stars</span>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-3 h-3 ${i < (card.stars || 1) ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'}`} />
                  ))}
                </div>
              </div>
              {card.ascension > 0 && (
                <div className="flex justify-between">
                  <span className="text-white/60">Ascension</span>
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                    <Crown className="w-3 h-3 mr-1" />A{card.ascension}
                  </Badge>
                </div>
              )}
            </div>

            {/* Tradable Status */}
            <div className={`mt-4 p-3 rounded-xl ${tradeCheck.canTrade ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
              {tradeCheck.canTrade ? (
                <div className="flex items-center gap-2 text-green-400 text-sm">
                  <Check className="w-4 h-4" />
                  <span>Tradable</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-400 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{tradeCheck.reason}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Trade Options */}
          <div className="flex-1 space-y-6">
            {/* Listing Type */}
            <div>
              <label className="text-white/60 text-xs uppercase tracking-wider block mb-3">Listing Type</label>
              <div className="flex gap-2">
                {[
                  { id: 'fixed_price', label: 'Fixed Price', icon: Tag },
                  { id: 'auction', label: 'Auction', icon: Clock },
                  { id: 'trade_offer', label: 'Trade for Materials', icon: ArrowLeftRight }
                ].map(type => (
                  <button
                    key={type.id}
                    onClick={() => setListingType(type.id)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all ${
                      listingType === type.id
                        ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-300'
                        : 'bg-white/5 border border-white/10 text-white/60 hover:text-white'
                    }`}
                  >
                    <type.icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Price / Materials Selection */}
            {listingType !== 'trade_offer' ? (
              <div>
                <label className="text-white/60 text-xs uppercase tracking-wider block mb-3">
                  {listingType === 'auction' ? 'Starting Price' : 'Asking Price'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={askingPrice}
                    onChange={(e) => setAskingPrice(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-lg font-bold focus:outline-none focus:border-cyan-500/50"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl">🪙</span>
                </div>
                
                {/* Market comparison */}
                <div className="mt-3 flex items-center gap-4 text-sm">
                  <span className="text-white/50">Market Value:</span>
                  <span className="text-white font-semibold">{marketValue.toLocaleString()} 🪙</span>
                  {askingPrice > marketValue * 1.2 && (
                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Above Market
                    </Badge>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <label className="text-white/60 text-xs uppercase tracking-wider block mb-3">
                  Materials Wanted
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(MATERIAL_INFO).slice(0, 6).map(([type, info]) => (
                    <button
                      key={type}
                      onClick={() => {
                        if (selectedMaterials.find(m => m.type === type)) {
                          setSelectedMaterials(prev => prev.filter(m => m.type !== type));
                        } else {
                          setSelectedMaterials(prev => [...prev, { type, quantity: 5 }]);
                        }
                      }}
                      className={`p-3 rounded-xl transition-all ${
                        selectedMaterials.find(m => m.type === type)
                          ? 'bg-cyan-500/20 border border-cyan-500/50'
                          : 'bg-white/5 border border-white/10 hover:border-white/20'
                      }`}
                    >
                      <span className="text-2xl block mb-1">{info.icon}</span>
                      <span className="text-xs text-white/60">{info.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Fee Breakdown */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-white/60">Listing Price</span>
                <span className="text-white">{askingPrice.toLocaleString()} 🪙</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-white/60">Trade Tax ({(calculateTradeTax(card, 100) / 100 * 100).toFixed(0)}%)</span>
                <span className="text-orange-400">-{tax.toLocaleString()} 🪙</span>
              </div>
              <div className="pt-2 mt-2 border-t border-white/10 flex justify-between">
                <span className="text-white font-semibold">You Receive</span>
                <span className="text-green-400 font-bold">{netProceeds.toLocaleString()} 🪙</span>
              </div>
            </div>

            {/* Card History Toggle */}
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
            >
              <div className="flex items-center gap-2 text-white/60">
                <History className="w-4 h-4" />
                <span className="text-sm">Card History</span>
              </div>
              <span className="text-xs text-white/40">{showHistory ? 'Hide' : 'Show'}</span>
            </button>

            <AnimatePresence>
              {showHistory && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2 p-4 rounded-xl bg-black/30">
                    {cardHistory.map((entry, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm">
                        <div className={`w-2 h-2 rounded-full ${
                          entry.type === 'acquire' ? 'bg-green-400' :
                          entry.type === 'upgrade' ? 'bg-blue-400' :
                          'bg-purple-400'
                        }`} />
                        <span className="text-white/80 flex-1">{entry.action}</span>
                        <span className="text-white/40 text-xs">{entry.date}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* List Button */}
            <Button
              onClick={handleListCard}
              disabled={!tradeCheck.canTrade}
              className={`w-full py-6 text-lg font-bold ${
                tradeCheck.canTrade
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white'
                  : 'bg-white/10 text-white/30 cursor-not-allowed'
              }`}
            >
              <Shield className="w-5 h-5 mr-2" />
              List on Marketplace
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}