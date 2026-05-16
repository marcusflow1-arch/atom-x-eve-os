import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package } from 'lucide-react';
import { getLootInventory, subscribeLootInventory, LOOT_RARITIES } from '../lootStore';

const CATEGORIES = [
  { id: 'all',       label: 'All'        },
  { id: 'skill',     label: '⚔️ Skills'   },
  { id: 'material',  label: '💠 Materials' },
  { id: 'crafting',  label: '🦴 Crafting'  },
  { id: 'evolution', label: '🏺 Evolution' },
  { id: 'companion', label: '🐾 Companion' },
  { id: 'misc',      label: '🪙 Misc'      },
];

function RarityBadge({ rarity }) {
  const r = LOOT_RARITIES[rarity] || LOOT_RARITIES.common;
  return (
    <span
      className="text-[9px] px-1.5 py-0.5 rounded font-bold tracking-widest border"
      style={{ color: r.color, borderColor: `${r.color}55`, background: `${r.color}18` }}
    >
      {r.label.toUpperCase()}
    </span>
  );
}

export default function MiscTab() {
  const [inv, setInv] = useState(getLootInventory());
  const [catFilter, setCatFilter] = useState('all');
  const [selected, setSelected] = useState(null);

  useEffect(() => subscribeLootInventory(setInv), []);

  // Flatten all categories into a single list
  const all = Object.values(inv).flat();
  const filtered = catFilter === 'all' ? all : (inv[catFilter] || []);

  return (
    <div className="absolute left-6 top-24 right-6 bottom-20 flex gap-4 pointer-events-auto overflow-hidden">

      {/* ── Left: filters + grid ── */}
      <div className="w-[300px] shrink-0 flex flex-col gap-3 overflow-hidden">

        {/* Category filter */}
        <div className="flex flex-wrap gap-1">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCatFilter(c.id)}
              className="px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all"
              style={catFilter === c.id ? {
                background: 'rgba(255,255,255,0.15)',
                borderColor: 'rgba(255,255,255,0.35)',
                color: '#fff',
              } : {
                background: 'rgba(255,255,255,0.04)',
                borderColor: 'rgba(255,255,255,0.10)',
                color: 'rgba(255,255,255,0.5)',
              }}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Count badge */}
        <div className="text-[10px] text-white/40 tracking-wider">
          {filtered.length} item{filtered.length !== 1 ? 's' : ''} collected
        </div>

        {/* Item grid */}
        <div className="flex-1 overflow-y-auto pr-1">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2">
              <Package className="w-8 h-8 text-white/15" />
              <div className="text-white/30 text-xs text-center">
                {all.length === 0 ? 'No loot collected yet.\nDefeat enemies to find drops!' : 'No items in this category.'}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {filtered.map((item, idx) => {
                const r = LOOT_RARITIES[item.rarity] || LOOT_RARITIES.common;
                const isSelected = selected?.dropId === item.dropId && selected?.collectedAt === item.collectedAt;
                return (
                  <button
                    key={`${item.dropId}-${idx}`}
                    onClick={() => setSelected(isSelected ? null : item)}
                    className="aspect-square rounded-lg flex flex-col items-center justify-center text-xl border transition-all p-1.5 gap-0.5"
                    style={isSelected ? {
                      background: `${r.color}20`,
                      borderColor: `${r.color}60`,
                      boxShadow: `0 0 14px ${r.color}35`,
                    } : {
                      background: 'rgba(255,255,255,0.04)',
                      borderColor: 'rgba(255,255,255,0.10)',
                    }}
                    title={item.name}
                  >
                    <span>{item.icon}</span>
                    <span className="text-[7px] text-white/50 leading-tight truncate w-full text-center">{item.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Right: detail panel ── */}
      <div className="flex-1 min-w-0 overflow-hidden">
        <AnimatePresence mode="wait">
          {selected ? (
            <motion.div
              key={`${selected.dropId}-${selected.collectedAt}`}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col gap-4"
            >
              {(() => {
                const r = LOOT_RARITIES[selected.rarity] || LOOT_RARITIES.common;
                return (
                  <div
                    className="p-5 rounded-xl border flex flex-col gap-3"
                    style={{ background: `${r.color}0e`, borderColor: `${r.color}45`, boxShadow: `0 0 22px ${r.color}20` }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-16 h-16 rounded-xl flex items-center justify-center text-4xl border"
                        style={{ background: `${r.color}20`, borderColor: `${r.color}50` }}
                      >
                        {selected.icon}
                      </div>
                      <div>
                        <div className="text-white font-bold text-base">{selected.name}</div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <RarityBadge rarity={selected.rarity} />
                          <span className="text-[9px] text-white/35 border border-white/10 px-1 py-0.5 rounded capitalize">{selected.category}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-white/50 text-xs">
                      Collected {new Date(selected.collectedAt).toLocaleTimeString()}
                    </div>
                    <div className="text-white/40 text-[11px] leading-relaxed">
                      {selected.category === 'skill' && 'A collectible skill dropped from a defeated enemy. Open the Skills tab to equip it.'}
                      {selected.category === 'material' && 'An upgrade material. Used for skill evolution, enchanting, and ability upgrades.'}
                      {selected.category === 'crafting' && 'A raw crafting resource. Can be used to forge equipment or create consumables.'}
                      {selected.category === 'evolution' && 'A rare evolution material. Required to push skills and items beyond their base rank.'}
                      {selected.category === 'companion' && 'A companion resource. Use it to level up and strengthen your companion.'}
                      {selected.category === 'misc' && 'A miscellaneous item obtained during your adventure.'}
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full flex flex-col items-center justify-center gap-3 text-center"
            >
              <Package className="w-10 h-10 text-white/15" />
              <div className="text-white/30 text-sm">Click an item to inspect</div>
              <div className="text-white/20 text-xs max-w-[200px]">
                All loot dropped from enemies appears here
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}