import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, DollarSign, ArrowLeftRight, Gavel, ShoppingCart, TrendingUp,
  Star, Gamepad2, Trophy, Zap, Shield, User, Trees, Package,
  ChevronRight, ChevronLeft, Clock, Sparkles, Eye, CheckCircle2, ArrowLeft
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

export default function TradingWorkspace({ item, onClose, onBack }) {
  const [activeMode, setActiveMode] = useState(null);

  if (!item) return null;

  const owned = !!item.owned;
  const cfg = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.achievement;
  const Icon = cfg.icon;
  const rarity = RARITY_COLORS[item.rarity] || RARITY_COLORS.Common;
  const marketPrice = PRICE_MAP[item.rarity] || 10000;

  const modes = owned
    ? [
        { id: 'sell', label: 'Sell', icon: DollarSign, color: 'green', desc: 'Fixed price or auction it off' },
        { id: 'auction', label: 'Auctions', icon: Gavel, color: 'purple', desc: 'Browse active auctions' },
        { id: 'trade', label: 'Trade', icon: ArrowLeftRight, color: 'blue', desc: 'Item-for-item exchange' },
        { id: 'buy', label: 'Buy More', icon: ShoppingCart, color: 'cyan', desc: 'Stack for upgrades' },
      ]
    : [
        { id: 'buy', label: 'Buy', icon: ShoppingCart, color: 'cyan', desc: 'Purchase this card' },
        { id: 'auction', label: 'Auctions', icon: Gavel, color: 'purple', desc: 'Browse & bid on auctions' },
        { id: 'trade', label: 'Trade', icon: ArrowLeftRight, color: 'blue', desc: 'Offer a trade' },
      ];

  const colorMap = {
    green: { active: 'bg-green-500/20 border-green-400/40 text-green-300 shadow-lg shadow-green-500/10' },
    blue: { active: 'bg-blue-500/20 border-blue-400/40 text-blue-300 shadow-lg shadow-blue-500/10' },
    purple: { active: 'bg-purple-500/20 border-purple-400/40 text-purple-300 shadow-lg shadow-purple-500/10' },
    cyan: { active: 'bg-cyan-500/20 border-cyan-400/40 text-cyan-300 shadow-lg shadow-cyan-500/10' },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed left-[384px] right-0 z-[72] flex flex-col overflow-hidden"
      style={{ top: '64px', bottom: '52px', background: 'rgba(8, 12, 18, 0.92)', backdropFilter: 'blur(50px) saturate(180%)', WebkitBackdropFilter: 'blur(50px) saturate(180%)' }}

    >
      {/* ═══ TOP BAR: Item Info + Mode Tabs (horizontal, like MMO auction house) ═══ */}
      <div className="flex-shrink-0 border-b border-white/5" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)' }}>
        {/* Top row: back button + breadcrumb + close */}
        <div className="flex items-center justify-between px-6 pt-4 pb-2">
          <div className="flex items-center gap-2">
            {/* Back to Full Inventory */}
            <button
              onClick={onBack || onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white transition-all text-[11px] font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Full Inventory</span>
            </button>
            <div className="flex items-center gap-1.5 text-[10px] text-white/30 ml-2">
              <span>{item.game}</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-white/60">{item.name}</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-amber-400 font-medium">Trading Workspace</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-colors" title="Close Trading Workspace">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Item + mode tabs row */}
        <div className="flex items-center gap-6 px-6 pb-3">
          {/* Compact Item Card */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className={`w-14 h-20 rounded-lg border-2 ${cfg.border} flex items-center justify-center relative overflow-hidden flex-shrink-0`}
              style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)' }}
            >
              <Icon className={`w-7 h-7 ${cfg.color} opacity-40`} />
              {owned && (
                <div className="absolute top-1 right-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                </div>
              )}
              {!owned && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-[6px] font-bold text-white/50 uppercase">Locked</span>
                </div>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <Badge className={`text-[8px] border ${rarity}`}>{item.rarity}</Badge>
                <span className={`text-[10px] font-semibold ${owned ? 'text-emerald-400' : 'text-white/30'}`}>
                  {owned ? 'Owned ×1' : 'Not Owned'}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white leading-tight">{item.name}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-white/40 text-[11px]">{item.game} • {cfg.label}</p>
                <div className="h-3 w-px bg-white/10" />
                <div className="flex items-center gap-1 text-[11px] text-white/50">
                  <TrendingUp className="w-3 h-3" />
                  <span className="font-bold text-white">{marketPrice.toLocaleString()}</span>
                  <span className="text-cyan-400 font-bold">AGP</span>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-12 w-px bg-white/10 flex-shrink-0" />

          {/* Mode Tabs (horizontal) */}
          <div className="flex items-center gap-2 flex-1">
            {modes.map((mode) => {
              const c = colorMap[mode.color];
              const isActive = activeMode === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => setActiveMode(isActive ? null : mode.id)}
                  className={`flex items-center gap-2 py-2.5 px-4 rounded-xl border transition-all whitespace-nowrap ${
                    isActive ? c.active : 'bg-white/[0.03] border-white/5 text-white/50 hover:bg-white/[0.06] hover:text-white'
                  }`}
                >
                  <mode.icon className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">{mode.label}</span>
                </button>
              );
            })}
          </div>

          {/* Upgrade hint (compact) */}
          {owned && (
            <div className="flex items-center gap-1.5 text-[10px] text-amber-400/80 bg-amber-500/5 border border-amber-500/10 rounded-lg px-3 py-2 flex-shrink-0">
              <Sparkles className="w-3 h-3" />
              <span>Upgrade at Blacksmith</span>
            </div>
          )}
        </div>
      </div>

      {/* ═══ MAIN CONTENT AREA (full width, scrollable) ═══ */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeMode === 'sell' && owned && (
            <TradingWorkspaceSell key="sell" item={item} owned={owned} marketPrice={marketPrice} />
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
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 text-center px-8">
              <div className={`w-24 h-24 rounded-2xl ${cfg.bg} border ${cfg.border} flex items-center justify-center mb-5`}>
                <Icon className={`w-12 h-12 ${cfg.color} opacity-30`} />
              </div>
              <p className="text-white/50 text-base font-medium mb-1">Galactic Trading Workspace</p>
              <p className="text-white/25 text-sm leading-relaxed max-w-[400px]">
                {owned 
                  ? 'Select an action above to sell, auction, trade this card, or buy more copies for upgrades.'
                  : 'Select an action above to browse listings, bid on auctions, or send a trade offer to get this card.'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ═══ FOOTER: Market Ticker ═══ */}
      <div className="flex-shrink-0 border-t border-white/5 px-6 py-3 bg-black/20">
        <div className="flex items-center justify-between text-[10px]">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-white/30">
              <Eye className="w-3 h-3" />
              <span>{Math.floor(Math.random() * 50 + 10)} watching</span>
            </div>
            <div className="flex items-center gap-1 text-white/30">
              <Clock className="w-3 h-3" />
              <span>Last sold: {Math.floor(Math.random() * 24 + 1)}h ago</span>
            </div>
            <div className="flex items-center gap-1 text-white/30">
              <Gamepad2 className="w-3 h-3" />
              <span>{Math.floor(Math.random() * 200 + 50)} listed globally</span>
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