import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, DollarSign, ArrowLeftRight, Gavel, ShoppingCart, TrendingUp,
  Star, Gamepad2, Trophy, Zap, Shield, User, Trees, Package,
  ChevronRight, Plus, Minus, Clock, Sparkles, Eye, EyeOff, Timer,
  CheckCircle2, AlertCircle, ChevronDown
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

import TradingWorkspaceSell from './TradingWorkspaceSell';
import TradingWorkspaceAuction from './TradingWorkspaceAuction';
import TradingWorkspaceTrade from './TradingWorkspaceTrade';
import TradingWorkspaceBuy from './TradingWorkspaceBuy';

const CATEGORY_CONFIG = {
  achievement: { icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', label: 'Achievement' },
  ability: { icon: Zap, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', label: 'Ability' },
  equipment: { icon: Shield, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', label: 'Equipment' },
  companion: { icon: User, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', label: 'Companion' },
  environment: { icon: Trees, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: 'Environment' },
};

const RARITY_COLORS = {
  Mythic: 'text-red-400 bg-red-500/10 border-red-500/30',
  Legendary: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  Epic: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
  Rare: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  Uncommon: 'text-green-400 bg-green-500/10 border-green-500/30',
  Common: 'text-slate-400 bg-slate-500/10 border-slate-500/30',
};

const PRICE_MAP = {
  Mythic: 95000, Legendary: 75000, Epic: 45000, Rare: 25000, Uncommon: 12000, Common: 5000
};

export default function TradingWorkspace({ item, onClose }) {
  const [activeMode, setActiveMode] = useState(null);

  if (!item) return null;

  const owned = !!item.owned;
  const cfg = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.achievement;
  const Icon = cfg.icon;
  const rarity = RARITY_COLORS[item.rarity] || RARITY_COLORS.Common;
  const marketPrice = PRICE_MAP[item.rarity] || 10000;

  // Contextual modes based on ownership
  const modes = owned
    ? [
        { id: 'sell', label: 'Sell', icon: DollarSign, color: 'green', desc: 'List for a fixed price' },
        { id: 'auction', label: 'Auction', icon: Gavel, color: 'purple', desc: 'Competitive bidding' },
        { id: 'trade', label: 'Trade', icon: ArrowLeftRight, color: 'blue', desc: 'Item-for-item exchange' },
        { id: 'buy', label: 'Buy More', icon: ShoppingCart, color: 'cyan', desc: 'Stack for upgrades' },
      ]
    : [
        { id: 'buy', label: 'Buy', icon: ShoppingCart, color: 'cyan', desc: 'Purchase this card' },
        { id: 'auction', label: 'Bid', icon: Gavel, color: 'purple', desc: 'Bid on auctions' },
        { id: 'trade', label: 'Trade Offer', icon: ArrowLeftRight, color: 'blue', desc: 'Offer a trade' },
      ];

  const colorMap = {
    green: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400', active: 'bg-green-500/20 border-green-400/40 text-green-300 shadow-lg shadow-green-500/10' },
    blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', active: 'bg-blue-500/20 border-blue-400/40 text-blue-300 shadow-lg shadow-blue-500/10' },
    purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400', active: 'bg-purple-500/20 border-purple-400/40 text-purple-300 shadow-lg shadow-purple-500/10' },
    cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400', active: 'bg-cyan-500/20 border-cyan-400/40 text-cyan-300 shadow-lg shadow-cyan-500/10' },
  };

  return (
    <motion.div
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 40, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed top-0 right-0 bottom-0 w-[420px] xl:w-[480px] z-[70] flex flex-col overflow-hidden"
      style={{
        background: 'rgba(10, 14, 20, 0.8)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        boxShadow: '-10px 0 50px rgba(0,0,0,0.6)',
        borderLeft: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* ── HEADER: Item Info (Always Visible) ── */}
      <div className={`relative flex-shrink-0 p-5 border-b border-white/5`} style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 100%)' }}>
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-full bg-black/40 hover:bg-white/10 text-white/50 hover:text-white transition-colors backdrop-blur-md z-10">
          <X className="w-4 h-4" />
        </button>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-[10px] text-white/30 mb-3">
          <span>Inventory</span>
          <ChevronRight className="w-3 h-3" />
          <span>{item.game}</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-white/60">{item.name}</span>
        </div>

        <div className="flex items-start gap-4">
          {/* Card Preview */}
          <div className={`w-20 h-28 rounded-xl border-2 ${cfg.border} flex items-center justify-center relative overflow-hidden flex-shrink-0`}
            style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)' }}
          >
            <Icon className={`w-10 h-10 ${cfg.color} opacity-40`} />
            {!owned && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="text-[8px] font-bold text-white/60 uppercase tracking-wider">Not Owned</span>
              </div>
            )}
            {owned && (
              <div className="absolute top-1.5 right-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
            )}
          </div>

          {/* Item Details */}
          <div className="min-w-0 flex-1">
            <Badge className={`text-[9px] border mb-1.5 ${rarity}`}>{item.rarity}</Badge>
            <h3 className="text-xl font-bold text-white leading-tight mb-0.5">{item.name}</h3>
            <p className="text-white/40 text-xs">{item.game} • {cfg.label}</p>

            {/* Ownership & Market Stats */}
            <div className="flex items-center gap-3 mt-2">
              <div className={`flex items-center gap-1 text-xs ${owned ? 'text-emerald-400' : 'text-white/30'}`}>
                <Package className="w-3 h-3" />
                <span className="font-semibold">{owned ? 'Owned ×1' : 'Not Owned'}</span>
              </div>
              <div className="h-3 w-px bg-white/10" />
              <div className="flex items-center gap-1 text-xs text-white/50">
                <TrendingUp className="w-3 h-3" />
                <span className="font-bold text-white">{marketPrice.toLocaleString()}</span>
                <span className="text-cyan-400 text-[10px] font-bold">AGP</span>
              </div>
            </div>
          </div>
        </div>

        {owned && (
          <div className="mt-3 flex items-center gap-1.5 text-[10px] text-amber-400/80 bg-amber-500/5 border border-amber-500/10 rounded-lg px-3 py-1.5">
            <Sparkles className="w-3 h-3" />
            <span>Buy a 2nd copy to upgrade at the Blacksmith</span>
          </div>
        )}
      </div>

      {/* ── MODE SELECTOR (Left Nav) ── */}
      <div className="flex-shrink-0 p-4 border-b border-white/5">
        <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2.5">
          {owned ? 'What do you want to do?' : 'How do you want to get this card?'}
        </p>
        <div className="flex gap-2">
          {modes.map((mode) => {
            const c = colorMap[mode.color];
            const isActive = activeMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => setActiveMode(isActive ? null : mode.id)}
                className={`flex-1 flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl border transition-all text-center ${
                  isActive ? c.active : 'bg-white/[0.03] border-white/5 text-white/50 hover:bg-white/[0.06] hover:text-white'
                }`}
              >
                <mode.icon className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider">{mode.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── DYNAMIC CENTER CONTENT ── */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeMode === 'sell' && owned && (
            <TradingWorkspaceSell key="sell" item={item} marketPrice={marketPrice} />
          )}

          {activeMode === 'auction' && (
            <TradingWorkspaceAuction key="auction" item={item} owned={owned} marketPrice={marketPrice} />
          )}

          {activeMode === 'trade' && (
            <TradingWorkspaceTrade key="trade" item={item} owned={owned} />
          )}

          {activeMode === 'buy' && (
            <TradingWorkspaceBuy key="buy" item={item} owned={owned} marketPrice={marketPrice} />
          )}

          {!activeMode && (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16 text-center px-8">
              <div className={`w-20 h-20 rounded-2xl ${cfg.bg} border ${cfg.border} flex items-center justify-center mb-4`}>
                <Icon className={`w-10 h-10 ${cfg.color} opacity-30`} />
              </div>
              <p className="text-white/40 text-sm font-medium mb-1">Select a mode above</p>
              <p className="text-white/20 text-xs leading-relaxed max-w-[240px]">
                {owned 
                  ? 'You can sell, auction, trade this card, or buy more copies for upgrades.'
                  : 'Browse available listings, bid on auctions, or send a trade offer to get this card.'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── FOOTER: Market Data ── */}
      <div className="flex-shrink-0 border-t border-white/5 p-4 bg-black/20">
        <div className="flex items-center justify-between text-[10px]">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-white/30">
              <Eye className="w-3 h-3" />
              <span>{Math.floor(Math.random() * 50 + 10)} watching</span>
            </div>
            <div className="flex items-center gap-1 text-white/30">
              <Clock className="w-3 h-3" />
              <span>Last sold: {Math.floor(Math.random() * 24 + 1)}h ago</span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-white/30">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            <span className="text-emerald-400 font-bold">+{(Math.random() * 15 + 1).toFixed(1)}%</span>
            <span>24h</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}