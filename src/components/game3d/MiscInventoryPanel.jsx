import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Package } from 'lucide-react';
import { getLootInventory, subscribeLootInventory, LOOT_RARITIES } from './lootStore';

const CATEGORIES = [
  { id: 'all',       label: 'All'          },
  { id: 'skill',     label: '⚔️ Skills'    },
  { id: 'material',  label: '💠 Materials'  },
  { id: 'crafting',  label: '🦴 Crafting'   },
  { id: 'evolution', label: '🏺 Evolution'  },
  { id: 'companion', label: '🐾 Companion'  },
  { id: 'misc',      label: '🪙 Misc'       },
];

function RarityBadge({ rarity }) {
  const r = LOOT_RARITIES[rarity] || LOOT_RARITIES.common;
  return (
    <span
      className="text-[9px] px-1.5 py-0.5 rounded font-bold tracking-widest border flex-shrink-0"
      style={{ color: r.color, borderColor: `${r.color}55`, background: `${r.color}18` }}
    >
      {r.label.toUpperCase()}
    </span>
  );
}

export default function MiscInventoryPanel({ open, onClose }) {
  const [inv, setInv] = useState(getLootInventory());
  const [cat, setCat] = useState('all');
  const [selected, setSelected] = useState(null);

  useEffect(() => subscribeLootInventory(setInv), []);

  const allItems = Object.values(inv).flat();
  const filtered = cat === 'all' ? allItems : (inv[cat] || []);

  // Descriptions per category
  const getDesc = (item) => {
    switch (item.category) {
      case 'skill':     return 'A skill dropped from a defeated enemy. Open the Skills book to learn more.';
      case 'material':  return 'An upgrade material used for skill evolution, enchanting, and upgrades.';
      case 'crafting':  return 'A raw crafting resource used to forge equipment or consumables.';
      case 'evolution': return 'A rare evolution material required to push skills beyond their base rank.';
      case 'companion': return 'A companion resource. Use it to level up and strengthen your companion.';
      default:          return 'A miscellaneous item obtained during your adventure.';
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70]"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="fixed z-[71] flex flex-col overflow-hidden pointer-events-auto"
            style={{
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 540,
              maxHeight: '72vh',
              background: 'rgba(6, 8, 16, 0.97)',
              backdropFilter: 'blur(36px) saturate(180%)',
              WebkitBackdropFilter: 'blur(36px) saturate(180%)',
              border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: 16,
              boxShadow: '0 24px 80px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.04)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.07] flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <Package className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-bold uppercase tracking-widest text-white/85">Miscellaneous Inventory</span>
                <span className="text-[10px] text-white/30 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                  {allItems.length} items
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-white/25 border border-white/10 px-2 py-0.5 rounded">I — close</span>
                <button onClick={onClose} className="text-white/30 hover:text-white transition-colors ml-1">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Category tabs */}
            <div className="flex gap-1 px-4 pt-3 pb-2 flex-shrink-0 flex-wrap">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { setCat(c.id); setSelected(null); }}
                  className="px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all"
                  style={cat === c.id ? {
                    background: 'rgba(255,255,255,0.14)', borderColor: 'rgba(255,255,255,0.28)', color: '#fff',
                  } : {
                    background: 'transparent', borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)',
                  }}
                >
                  {c.label}
                  {c.id !== 'all' && (inv[c.id]?.length ?? 0) > 0 && (
                    <span className="ml-1 text-white/30">{inv[c.id].length}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Body: grid + detail side by side */}
            <div className="flex flex-1 min-h-0 overflow-hidden gap-0">

              {/* Item grid */}
              <div className="flex-1 overflow-y-auto px-4 pb-4" style={{ scrollbarWidth: 'none' }}>
                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 gap-3">
                    <Package className="w-10 h-10 text-white/10" />
                    <div className="text-white/25 text-sm text-center">
                      {allItems.length === 0
                        ? 'No loot yet.\nDefeat enemies to find drops!'
                        : 'Nothing in this category.'}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-5 gap-2">
                    {filtered.map((item, idx) => {
                      const r = LOOT_RARITIES[item.rarity] || LOOT_RARITIES.common;
                      const isSel = selected?.dropId === item.dropId && selected?.collectedAt === item.collectedAt;
                      return (
                        <button
                          key={`${item.dropId}-${idx}`}
                          onClick={() => setSelected(isSel ? null : item)}
                          className="aspect-square rounded-xl flex flex-col items-center justify-center border transition-all p-2 gap-1"
                          style={isSel ? {
                            background: `${r.color}20`,
                            borderColor: `${r.color}55`,
                            boxShadow: `0 0 14px ${r.color}30`,
                          } : {
                            background: 'rgba(255,255,255,0.04)',
                            borderColor: 'rgba(255,255,255,0.09)',
                          }}
                          title={item.name}
                        >
                          <span className="text-2xl leading-none">{item.icon}</span>
                          <span className="text-[8px] text-white/50 leading-tight truncate w-full text-center">{item.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Detail panel */}
              <AnimatePresence mode="wait">
                {selected && (() => {
                  const r = LOOT_RARITIES[selected.rarity] || LOOT_RARITIES.common;
                  return (
                    <motion.div
                      key={`${selected.dropId}-${selected.collectedAt}`}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      className="w-[180px] flex-shrink-0 border-l border-white/[0.06] px-4 py-4 flex flex-col gap-3 overflow-y-auto"
                      style={{ scrollbarWidth: 'none' }}
                    >
                      <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl border self-center"
                        style={{ background: `${r.color}18`, borderColor: `${r.color}44` }}
                      >
                        {selected.icon}
                      </div>
                      <div className="text-white text-sm font-bold text-center leading-tight">{selected.name}</div>
                      <RarityBadge rarity={selected.rarity} />
                      <div
                        className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded border text-center capitalize"
                        style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}
                      >
                        {selected.category}
                      </div>
                      <div className="text-white/40 text-[10px] leading-relaxed">{getDesc(selected)}</div>
                      <div className="text-white/20 text-[9px] mt-auto">
                        Collected {new Date(selected.collectedAt).toLocaleTimeString()}
                      </div>
                    </motion.div>
                  );
                })()}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}