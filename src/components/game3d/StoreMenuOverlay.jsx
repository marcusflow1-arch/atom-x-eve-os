import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Grid3x3, Zap, Hammer, Coins, X } from 'lucide-react';

/**
 * StoreMenuOverlay - Recreates the SMITE 2 in-game build/shop menu.
 * Opened via TAB key. Three columns: filter sidebar, build/items, inventory + actions.
 */
const FILTERS = [
  { id: 'clear', label: 'CLEAR', icon: '✕' },
  { id: 'consumables', label: 'Consumables', icon: '🧪' },
  { id: 'starter', label: 'Starter', icon: '⭐' },
  { id: 'strength', label: 'Strength', icon: '⚡', active: true },
  { id: 'intelligence', label: 'Intelligence', icon: '🧠' },
  { id: 'attack_damage', label: 'Attack Damage', icon: '⚔️' },
  { id: 'attack_speed', label: 'Attack Speed', icon: '💨' },
  { id: 'lifesteal', label: 'Lifesteal', icon: '🩸' },
  { id: 'critical_chance', label: 'Critical Chance', icon: '✨' },
  { id: 'echo', label: 'Echo', icon: '🌀' },
  { id: 'penetration', label: 'Penetration', icon: '🏹' },
  { id: 'physical_protection', label: 'Physical Protection', icon: '🛡️' },
  { id: 'magical_protection', label: 'Magical Protection', icon: '🔮' },
  { id: 'plating', label: 'Plating', icon: '🪖' },
  { id: 'dampening', label: 'Dampening', icon: '🧊' },
  { id: 'max_health', label: 'Max Health', icon: '❤️' },
  { id: 'health_regen', label: 'Health Regen', icon: '💚' },
  { id: 'max_mana', label: 'Max Mana', icon: '💧' },
  { id: 'mana_regen', label: 'Mana Regen', icon: '💙' },
  { id: 'cooldown_rate', label: 'Cooldown Rate', icon: '⏱️' },
  { id: 'anti_heal', label: 'Anti-Heal', icon: '🚫' },
  { id: 'pathfinding', label: 'Pathfinding', icon: '🧭' },
  { id: 'tenacity', label: 'Tenacity', icon: '💪' },
  { id: 'passive', label: 'Passive', icon: '⏸️' },
  { id: 'active', label: 'Active', icon: '▶️' },
];

const STARTING_ITEMS = [
  { id: 's1', price: 2600, color: '#4caf50' },
  { id: 's2', price: 2700, color: '#d0021b' },
  { id: 's3', price: 2400, color: '#9013fe' },
];

const FINAL_BUILD = [
  { id: 'f1', price: 2700, color: '#d0021b' },
  { id: 'f2', price: 2750, color: '#4a90e2' },
];

export default function StoreMenuOverlay({ isOpen, onClose, gold = 100000 }) {
  const [activeFilter, setActiveFilter] = useState('strength');
  const [activeTab, setActiveTab] = useState('builds');
  const [search, setSearch] = useState('');
  const [inventory, setInventory] = useState(Array(8).fill(null));

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none"
        >
          {/* Backdrop (transparent — game still visible) */}
          <div className="absolute inset-0 bg-black/30 pointer-events-auto" onClick={onClose} />

          {/* Three-panel layout */}
          <div className="relative flex gap-3 pointer-events-auto">
            {/* LEFT: Filter sidebar */}
            <motion.div
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.05 }}
              className="w-[220px] h-[600px] rounded-lg overflow-hidden flex flex-col"
              style={{
                background: 'rgba(30, 25, 20, 0.95)',
                border: '1px solid rgba(180, 140, 80, 0.4)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
              }}
            >
              <div className="p-3 border-b border-white/10 flex items-center gap-2">
                <span className="text-white/60 text-xs font-bold">✕</span>
                <span className="text-white font-bold text-sm tracking-wider">CLEAR</span>
              </div>
              <div className="flex-1 overflow-y-auto py-2">
                {FILTERS.slice(1).map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setActiveFilter(f.id)}
                    className={`w-full flex items-center justify-between px-3 py-1.5 text-xs transition-all ${
                      activeFilter === f.id
                        ? 'bg-yellow-700/30 text-yellow-200 border-l-2 border-yellow-500'
                        : 'text-white/70 hover:bg-white/5 border-l-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{f.icon}</span>
                      <span className="font-medium">{f.label}</span>
                    </div>
                    <div className={`w-3 h-3 rounded-sm border ${activeFilter === f.id ? 'bg-yellow-500 border-yellow-300' : 'border-white/30'}`} />
                  </button>
                ))}
              </div>
            </motion.div>

            {/* MIDDLE: Search + Build */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="w-[400px] h-[600px] rounded-lg overflow-hidden flex flex-col"
              style={{
                background: 'rgba(30, 25, 20, 0.95)',
                border: '1px solid rgba(180, 140, 80, 0.4)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
              }}
            >
              {/* Search bar */}
              <div className="p-3 border-b border-white/10 flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded bg-black/40 border border-white/10">
                  <Search className="w-3.5 h-3.5 text-white/40" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search for an Item"
                    className="flex-1 bg-transparent text-white text-xs placeholder-white/40 outline-none"
                  />
                </div>
                <button
                  onClick={() => setActiveTab('grid')}
                  className={`w-8 h-8 rounded flex items-center justify-center transition-all ${
                    activeTab === 'grid' ? 'bg-yellow-700/40 text-yellow-200' : 'bg-black/30 text-white/60 hover:bg-black/50'
                  }`}
                >
                  <Grid3x3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setActiveTab('flash')}
                  className={`w-8 h-8 rounded flex items-center justify-center transition-all ${
                    activeTab === 'flash' ? 'bg-yellow-700/40 text-yellow-200' : 'bg-black/30 text-white/60 hover:bg-black/50'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setActiveTab('builds')}
                  className={`px-3 h-8 rounded text-xs font-bold transition-all ${
                    activeTab === 'builds'
                      ? 'bg-yellow-700/40 text-yellow-200 border border-yellow-500/40'
                      : 'bg-black/30 text-white/60 hover:bg-black/50'
                  }`}
                >
                  Builds
                </button>
              </div>

              {/* Stat description */}
              <div className="px-4 py-3 border-b border-white/5">
                <div className="text-white font-bold text-base mb-0.5">Strength</div>
                <div className="text-white/60 text-xs">Increases damage of Strength Scaling Abilities and Attacks</div>
              </div>

              {/* Build content */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Hammer className="w-4 h-4 text-yellow-400" />
                  <span className="text-white font-bold text-sm">New Artemis Build</span>
                </div>

                {/* Starting items */}
                <div className="mb-5">
                  <div className="text-white/50 text-[10px] font-bold tracking-widest uppercase mb-2">Starting Items</div>
                  <div className="flex gap-2">
                    {STARTING_ITEMS.map((item) => (
                      <ItemTile key={item.id} item={item} onClick={() => addToInventory(item, setInventory)} />
                    ))}
                  </div>
                </div>

                {/* Final build */}
                <div>
                  <div className="text-white/50 text-[10px] font-bold tracking-widest uppercase mb-2">Final Build</div>
                  <div className="flex gap-2">
                    {FINAL_BUILD.map((item) => (
                      <ItemTile key={item.id} item={item} onClick={() => addToInventory(item, setInventory)} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom ability slot row */}
              <div className="p-3 border-t border-white/10 flex gap-1 justify-center">
                {[...Array(11)].map((_, i) => (
                  <div
                    key={i}
                    className="w-7 h-7 rounded-sm flex items-center justify-center"
                    style={{
                      background: 'rgba(50, 40, 30, 0.8)',
                      border: '1px solid rgba(120, 90, 50, 0.4)',
                    }}
                  >
                    <Zap className="w-3 h-3 text-yellow-500/40" />
                  </div>
                ))}
              </div>
            </motion.div>

            {/* RIGHT: Inventory + Actions */}
            <motion.div
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="w-[260px] h-[600px] rounded-lg overflow-hidden flex flex-col"
              style={{
                background: 'rgba(30, 25, 20, 0.95)',
                border: '1px solid rgba(180, 140, 80, 0.4)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
              }}
            >
              {/* Inventory grid */}
              <div className="p-3 grid grid-cols-2 gap-2 flex-1 content-start">
                {inventory.map((item, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-sm flex items-center justify-center"
                    style={{
                      background: 'rgba(20, 15, 10, 0.8)',
                      border: '1px solid rgba(120, 90, 50, 0.3)',
                      boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)',
                    }}
                  >
                    {item && (
                      <div
                        className="w-3/4 h-3/4 rounded-sm"
                        style={{ background: item.color, boxShadow: `0 0 8px ${item.color}80` }}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div className="p-3 border-t border-white/10 flex gap-2">
                <button className="flex-1 py-2 rounded text-white text-xs font-bold tracking-wider hover:brightness-110 transition-all"
                  style={{ background: 'linear-gradient(180deg, rgba(80,90,100,0.8), rgba(50,60,70,0.9))', border: '1px solid rgba(180,140,80,0.4)' }}
                >
                  Buy
                </button>
                <button className="flex-1 py-2 rounded text-white text-xs font-bold tracking-wider hover:brightness-110 transition-all"
                  style={{ background: 'linear-gradient(180deg, rgba(80,90,100,0.8), rgba(50,60,70,0.9))', border: '1px solid rgba(180,140,80,0.4)' }}
                >
                  Undo
                </button>
                <button className="flex-1 py-2 rounded text-white text-xs font-bold tracking-wider hover:brightness-110 transition-all"
                  style={{ background: 'linear-gradient(180deg, rgba(80,90,100,0.8), rgba(50,60,70,0.9))', border: '1px solid rgba(180,140,80,0.4)' }}
                >
                  Sell
                </button>
              </div>

              {/* Gold display */}
              <div className="px-3 py-2 border-t border-white/10 flex items-center justify-end gap-2"
                style={{ background: 'rgba(20, 15, 10, 0.6)' }}>
                <Coins className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-300 text-sm font-bold tabular-nums">{gold.toLocaleString()}</span>
              </div>
            </motion.div>

            {/* Close hint */}
            <button
              onClick={onClose}
              className="absolute -top-10 right-0 flex items-center gap-2 px-3 py-1.5 rounded bg-black/60 border border-white/15 text-white/70 text-xs hover:text-white transition-all"
            >
              <X className="w-3.5 h-3.5" />
              <span>TAB or ESC to close</span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function addToInventory(item, setInventory) {
  setInventory((inv) => {
    const idx = inv.findIndex((s) => s === null);
    if (idx === -1) return inv;
    const next = [...inv];
    next[idx] = item;
    return next;
  });
}

function ItemTile({ item, onClick }) {
  return (
    <button
      onClick={onClick}
      className="relative w-16 h-20 flex flex-col items-center group hover:scale-105 transition-transform"
    >
      <div
        className="w-16 h-16 rounded-sm flex items-center justify-center"
        style={{
          background: `linear-gradient(135deg, ${item.color}cc 0%, ${item.color}55 100%)`,
          border: '2px solid rgba(180, 140, 80, 0.5)',
          boxShadow: `0 2px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15), 0 0 12px ${item.color}40`,
        }}
      >
        <div className="w-8 h-8 rounded-sm bg-black/30" />
      </div>
      <span className="mt-1 text-yellow-300 text-[10px] font-bold tabular-nums">{item.price}</span>
    </button>
  );
}