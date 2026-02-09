import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ArrowLeft, Trophy, Zap, Shield, User, Trees, Star,
  DollarSign, ArrowLeftRight, Gavel, ShoppingCart, Sparkles,
  ChevronRight, Gamepad2, Crown, Swords, Eye, TrendingUp, Package
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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

// Mock achievement cards for a given game
function getMockAchievementCards(gameName) {
  const cards = {
    'Elden Ring': [
      { id: 'er1', name: 'Dragon Slayer', rarity: 'Legendary', category: 'achievement', icon: '🐉', progress: 100, unlocked: true },
      { id: 'er2', name: 'Void Walker Set', rarity: 'Epic', category: 'equipment', icon: '🛡️', progress: 100, unlocked: true },
      { id: 'er3', name: 'Shadow Blade', rarity: 'Legendary', category: 'equipment', icon: '⚔️', progress: 100, unlocked: true },
      { id: 'er4', name: 'Ring of the Ancients', rarity: 'Mythic', category: 'equipment', icon: '💍', progress: 65, unlocked: false },
      { id: 'er5', name: 'Elden Lord', rarity: 'Legendary', category: 'achievement', icon: '👑', progress: 40, unlocked: false },
      { id: 'er6', name: 'Tree Sentinel', rarity: 'Rare', category: 'achievement', icon: '🌲', progress: 100, unlocked: true },
    ],
    'Cyberpunk 2088': [
      { id: 'cp1', name: 'Neural Shock', rarity: 'Legendary', category: 'ability', icon: '⚡', progress: 100, unlocked: true },
      { id: 'cp2', name: 'Phoenix Companion', rarity: 'Epic', category: 'companion', icon: '🔥', progress: 100, unlocked: true },
      { id: 'cp3', name: 'Night City Legend', rarity: 'Mythic', category: 'achievement', icon: '🌃', progress: 30, unlocked: false },
      { id: 'cp4', name: 'Mantis Blades', rarity: 'Epic', category: 'equipment', icon: '🔪', progress: 100, unlocked: true },
      { id: 'cp5', name: 'Netrunner Elite', rarity: 'Rare', category: 'achievement', icon: '💻', progress: 80, unlocked: false },
    ],
    'Valorant': [
      { id: 'v1', name: 'First Blood', rarity: 'Rare', category: 'achievement', icon: '🎯', progress: 100, unlocked: true },
      { id: 'v2', name: 'Ace Master', rarity: 'Epic', category: 'achievement', icon: '♠️', progress: 55, unlocked: false },
      { id: 'v3', name: 'Clutch King', rarity: 'Legendary', category: 'achievement', icon: '👊', progress: 20, unlocked: false },
    ],
  };
  return cards[gameName] || [
    { id: 'gen1', name: 'Explorer', rarity: 'Common', category: 'achievement', icon: '🗺️', progress: 100, unlocked: true },
    { id: 'gen2', name: 'Collector', rarity: 'Rare', category: 'achievement', icon: '📦', progress: 50, unlocked: false },
  ];
}

export default function RewardActionPanel({ item, onClose, onOpenFullInventory }) {
  const [selectedCard, setSelectedCard] = useState(null);
  const [quickAction, setQuickAction] = useState(null);

  if (!item) return null;

  const cfg = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.achievement;
  const Icon = cfg.icon;
  const rarity = RARITY_COLORS[item.rarity] || RARITY_COLORS.Common;
  const gameCards = getMockAchievementCards(item.game);
  const unlockedCards = gameCards.filter(c => c.unlocked);
  const lockedCards = gameCards.filter(c => !c.unlocked);
  const activeCard = selectedCard || { ...item, icon: '🏆', unlocked: true, progress: 100 };

  const quickActions = [
    { id: 'sell', label: 'Sell', icon: DollarSign, color: 'text-green-400 bg-green-500/10 border-green-500/20 hover:bg-green-500/20' },
    { id: 'trade', label: 'Trade', icon: ArrowLeftRight, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20' },
    { id: 'auction', label: 'Auction', icon: Gavel, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/20' },
    { id: 'upgrade', label: 'Upgrade', icon: Sparkles, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20' },
  ];

  return (
    <motion.div
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 20, opacity: 0 }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed top-0 bottom-0 left-80 sm:left-96 right-0 z-[70] flex flex-col overflow-hidden"
      style={{
        background: 'rgba(8, 10, 16, 0.88)',
        backdropFilter: 'blur(40px) saturate(160%)',
        WebkitBackdropFilter: 'blur(40px) saturate(160%)',
        boxShadow: 'inset 0 0 0 1px rgba(165, 243, 252, 0.06)',
        borderLeft: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* ── HEADER ── */}
      <div className="flex-shrink-0 px-5 py-3 border-b border-white/[0.06] bg-white/[0.02]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/8 text-white/50 hover:text-white text-[10px] font-medium transition-all">
              <ArrowLeft className="w-3 h-3" />
              Back
            </button>
            <div className="flex items-center gap-1.5 text-[10px] text-white/25">
              <span>Rewards</span>
              <ChevronRight className="w-2.5 h-2.5" />
              <span className="text-white/50">{item.game}</span>
              <ChevronRight className="w-2.5 h-2.5" />
              <span className="text-amber-400">{item.name}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Item summary bar */}
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg ${cfg.bg} border ${cfg.border} flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-5 h-5 ${cfg.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-white font-bold text-sm">{item.name}</h3>
              <Badge className={`text-[8px] border ${rarity}`}>{item.rarity}</Badge>
              <Badge className="text-[8px] bg-white/5 border-white/8 text-white/40">{cfg.label}</Badge>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-white/35 mt-0.5">
              <Gamepad2 className="w-3 h-3" />
              <span>{item.game}</span>
              <span>•</span>
              <span className="text-white/50">{item.time}</span>
            </div>
          </div>
          <button
            onClick={onOpenFullInventory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 text-[10px] font-bold transition-all flex-shrink-0"
          >
            <Package className="w-3 h-3" />
            Full Inventory
          </button>
        </div>
      </div>

      {/* ── BODY: Two columns ── */}
      <div className="flex-1 flex min-h-0 overflow-hidden">

        {/* LEFT: Game Achievement Cards */}
        <div className="flex-1 overflow-y-auto p-4" style={{ scrollbarWidth: 'none' }}>
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-bold text-white/50 uppercase tracking-widest">{item.game} — Achievement Cards</h4>
            <span className="text-[10px] text-white/25 ml-auto">{unlockedCards.length}/{gameCards.length} unlocked</span>
          </div>

          {/* Progress bar for game */}
          <div className="h-1 bg-white/5 rounded-full overflow-hidden mb-4">
            <div className="h-full bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full" style={{ width: `${(unlockedCards.length / gameCards.length) * 100}%` }} />
          </div>

          {/* Unlocked cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-4">
            {unlockedCards.map(card => {
              const cr = RARITY_COLORS[card.rarity] || RARITY_COLORS.Common;
              const cardCfg = CATEGORY_CONFIG[card.category] || CATEGORY_CONFIG.achievement;
              const isActive = selectedCard?.id === card.id;
              return (
                <div
                  key={card.id}
                  onClick={() => setSelectedCard(isActive ? null : card)}
                  className={`relative aspect-[3/4] rounded-xl overflow-hidden border cursor-pointer group transition-all ${
                    isActive ? `${cardCfg.border} ring-1 ring-offset-0 shadow-lg` : 'border-white/8 hover:border-white/15'
                  }`}
                  style={{ background: 'rgba(255,255,255,0.03)' }}
                >
                  <div className={`absolute inset-0 ${cardCfg.bg} opacity-20`} />
                  <div className="relative flex flex-col items-center justify-center h-full p-2">
                    <span className="text-2xl mb-1">{card.icon}</span>
                    <p className="text-white font-bold text-[10px] text-center leading-tight truncate w-full">{card.name}</p>
                    <Badge className={`mt-1 text-[7px] border ${cr}`}>{card.rarity}</Badge>
                  </div>
                  {isActive && (
                    <div className="absolute inset-0 border-2 border-amber-400/50 rounded-xl pointer-events-none" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Locked cards */}
          {lockedCards.length > 0 && (
            <>
              <p className="text-[9px] text-white/20 uppercase tracking-widest font-bold mb-2">Locked</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {lockedCards.map(card => {
                  const cr = RARITY_COLORS[card.rarity] || RARITY_COLORS.Common;
                  return (
                    <div key={card.id} className="relative aspect-[3/4] rounded-xl overflow-hidden border border-white/5 opacity-40" style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <div className="flex flex-col items-center justify-center h-full p-2">
                        <span className="text-xl mb-1 grayscale">{card.icon}</span>
                        <p className="text-white/40 font-medium text-[10px] text-center leading-tight truncate w-full">{card.name}</p>
                        <Badge className={`mt-1 text-[7px] border ${cr}`}>{card.rarity}</Badge>
                        <div className="w-full mt-1.5 h-1 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-white/20 rounded-full" style={{ width: `${card.progress}%` }} />
                        </div>
                        <span className="text-[7px] text-white/20 mt-0.5">{card.progress}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* RIGHT: Quick Actions Panel */}
        <div className="w-64 xl:w-72 flex-shrink-0 border-l border-white/[0.06] overflow-y-auto p-4" style={{ scrollbarWidth: 'none' }}>
          <h4 className="text-[10px] text-white/30 font-bold uppercase tracking-widest mb-3">Quick Actions</h4>

          <div className="space-y-1.5 mb-5">
            {quickActions.map(a => (
              <button
                key={a.id}
                onClick={() => setQuickAction(quickAction === a.id ? null : a.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg border transition-all text-left ${
                  quickAction === a.id ? a.color.replace('hover:', '') + ' border-opacity-50' : 'bg-white/[0.03] border-white/[0.06] text-white/50 hover:bg-white/[0.06]'
                }`}
              >
                <a.icon className="w-4 h-4 flex-shrink-0" />
                <span className="text-xs font-bold">{a.label}</span>
                <ChevronRight className={`w-3 h-3 ml-auto transition-transform ${quickAction === a.id ? 'rotate-90' : ''}`} />
              </button>
            ))}
          </div>

          {/* Action detail */}
          <AnimatePresence mode="wait">
            {quickAction && (
              <motion.div key={quickAction} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="space-y-3">
                {quickAction === 'sell' && (
                  <div className="p-3 rounded-xl bg-green-500/5 border border-green-500/15">
                    <p className="text-green-400 text-xs font-bold mb-1">Sell {selectedCard?.name || item.name}</p>
                    <p className="text-[10px] text-white/30 mb-3">Set a price and list on the marketplace instantly.</p>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-bold">75,000</div>
                      <span className="text-cyan-400 text-xs font-bold">AGP</span>
                    </div>
                    <button className="w-full py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-400 text-xs font-bold rounded-lg transition-all">
                      List for Sale
                    </button>
                  </div>
                )}
                {quickAction === 'trade' && (
                  <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/15">
                    <p className="text-blue-400 text-xs font-bold mb-1">Trade {selectedCard?.name || item.name}</p>
                    <p className="text-[10px] text-white/30 mb-3">Item-for-item exchange with another player.</p>
                    <button className="w-full py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 text-xs font-bold rounded-lg transition-all">
                      Create Trade Offer
                    </button>
                  </div>
                )}
                {quickAction === 'auction' && (
                  <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/15">
                    <p className="text-purple-400 text-xs font-bold mb-1">Auction {selectedCard?.name || item.name}</p>
                    <p className="text-[10px] text-white/30 mb-3">Let buyers bid. Highest bid wins after timer ends.</p>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-bold">50,000</div>
                      <span className="text-[10px] text-white/30">starting bid</span>
                    </div>
                    <button className="w-full py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-400 text-xs font-bold rounded-lg transition-all">
                      Start Auction
                    </button>
                  </div>
                )}
                {quickAction === 'upgrade' && (
                  <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
                    <p className="text-amber-400 text-xs font-bold mb-1">Upgrade {selectedCard?.name || item.name}</p>
                    <p className="text-[10px] text-white/30 mb-3">Take this to the Blacksmith to enhance or evolve it.</p>
                    <button className="w-full py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-400 text-xs font-bold rounded-lg transition-all">
                      Open Blacksmith
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Divider */}
          <div className="my-4 border-t border-white/[0.05]" />

          {/* Selected card info */}
          <div>
            <h4 className="text-[10px] text-white/30 font-bold uppercase tracking-widest mb-2">
              {selectedCard ? 'Selected Card' : 'Reward Info'}
            </h4>
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{activeCard.icon || '🏆'}</span>
                <div className="min-w-0">
                  <p className="text-white font-bold text-xs truncate">{activeCard.name}</p>
                  <p className="text-[9px] text-white/30">{activeCard.rarity} • {activeCard.category || cfg.label}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-[9px] text-white/25">
                <span className="flex items-center gap-1"><TrendingUp className="w-2.5 h-2.5 text-emerald-400" /> Market Active</span>
                <span className="flex items-center gap-1"><Eye className="w-2.5 h-2.5" /> {Math.floor(Math.random() * 40 + 5)} watching</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}