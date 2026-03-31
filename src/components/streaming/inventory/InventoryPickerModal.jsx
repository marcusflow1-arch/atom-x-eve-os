import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Zap, Shield, Trophy, User, Trees, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const MOCK_INVENTORY = [
  { id: 'inv1', name: 'Neural Shock', category: 'ability', rarity: 'Legendary', game: 'Cyberpunk 2088', icon: Zap, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30' },
  { id: 'inv2', name: 'Void Walker Set', category: 'equipment', rarity: 'Epic', game: 'Elden Ring', icon: Shield, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
  { id: 'inv3', name: 'First Blood', category: 'achievement', rarity: 'Rare', game: 'Valorant', icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
  { id: 'inv4', name: 'Shadow Blade', category: 'equipment', rarity: 'Legendary', game: 'Elden Ring', icon: Shield, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
  { id: 'inv5', name: 'Phoenix Companion', category: 'companion', rarity: 'Epic', game: 'Cyberpunk 2088', icon: User, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' },
  { id: 'inv6', name: 'Crystal Forest', category: 'environment', rarity: 'Rare', game: 'Fantasy Realm', icon: Trees, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  { id: 'inv7', name: 'Storm Strike', category: 'ability', rarity: 'Uncommon', game: 'Arena Wars', icon: Zap, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30' },
  { id: 'inv8', name: 'Iron Gauntlets', category: 'equipment', rarity: 'Common', game: 'Dungeon Run', icon: Shield, color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/30' },
  { id: 'inv9', name: 'Dragon Slayer', category: 'achievement', rarity: 'Mythic', game: 'Dragon Age IX', icon: Trophy, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
  { id: 'inv10', name: 'Shadow Fox', category: 'companion', rarity: 'Legendary', game: 'Elden Ring', icon: User, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' },
];

const RARITY_ORDER = { Mythic: 0, Legendary: 1, Epic: 2, Rare: 3, Uncommon: 4, Common: 5 };

export default function InventoryPickerModal({ onSelect, onClose, excludeIds = [] }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const filtered = MOCK_INVENTORY
    .filter(i => !excludeIds.includes(i.id))
    .filter(i => filter === 'all' || i.category === filter)
    .filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || i.game.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity]);

  const categories = ['all', 'ability', 'equipment', 'achievement', 'companion', 'environment'];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ top: '64px', bottom: '52px' }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative z-10 w-full max-w-xl mx-4 flex flex-col rounded-2xl overflow-hidden"
        style={{
          maxHeight: 'calc(100% - 40px)',
          background: 'rgba(10, 14, 22, 0.96)',
          backdropFilter: 'blur(40px)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-bold text-white">Select from Inventory</span>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pt-4 pb-2 flex-shrink-0">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search cards..."
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-white text-xs outline-none focus:border-amber-500/40 transition-colors"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`flex-shrink-0 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border transition-all ${
                  filter === cat
                    ? 'bg-amber-500/20 border-amber-500/30 text-amber-300'
                    : 'bg-white/5 border-white/10 text-white/40 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Items Grid */}
        <div className="flex-1 overflow-y-auto px-5 pb-5" style={{ scrollbarWidth: 'none' }}>
          <div className="grid grid-cols-2 gap-2">
            {filtered.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelect(item)}
                  className={`flex items-center gap-3 p-3 rounded-xl border ${item.border} ${item.bg} hover:brightness-125 transition-all text-left group`}
                >
                  <div className={`w-10 h-10 rounded-lg ${item.bg} border ${item.border} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${item.color}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-white text-xs font-semibold truncate">{item.name}</p>
                    <p className="text-white/40 text-[9px] truncate">{item.game}</p>
                    <Badge className={`text-[8px] mt-0.5 px-1.5 py-0 border ${item.border} ${item.bg} ${item.color}`}>{item.rarity}</Badge>
                  </div>
                </button>
              );
            })}
          </div>
          {filtered.length === 0 && (
            <p className="text-white/30 text-xs text-center py-10">No items found</p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}