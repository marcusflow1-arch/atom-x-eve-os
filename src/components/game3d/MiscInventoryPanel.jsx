import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Package, Sword, Sparkles } from 'lucide-react';
import { getLootInventory, subscribeLootInventory, LOOT_RARITIES } from './lootStore';

const TABS = [
  { id: 'skills', label: '⚔️ Skills',     key: 'skill'     },
  { id: 'misc',   label: '🪙 Items',      key: null         }, // all non-skill
];

const MISC_CATEGORIES = [
  { id: 'all',       label: 'All'           },
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

function ItemGrid({ items, selected, onSelect, emptyMsg }) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-44 gap-3">
        <Package className="w-10 h-10 text-white/10" />
        <div className="text-white/25 text-xs text-center leading-relaxed whitespace-pre-line">{emptyMsg}</div>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-5 gap-2">
      {items.map((item, idx) => {
        const r = LOOT_RARITIES[item.rarity] || LOOT_RARITIES.common;
        const isSel = selected?.dropId === item.dropId && selected?.collectedAt === item.collectedAt;
        return (
          <button
            key={`${item.dropId}-${idx}`}
            onClick={() => onSelect(isSel ? null : item)}
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
  );
}

function DetailPanel({ item, onClose }) {
  const r = LOOT_RARITIES[item.rarity] || LOOT_RARITIES.common;
  const desc = {
    skill:     'A skill scroll dropped by an enemy. Once learned, it will appear in your Skills Book.',
    material:  'An upgrade material used for skill evolution, enchanting, and upgrades.',
    crafting:  'A raw crafting resource used to forge equipment or consumables.',
    evolution: 'A rare evolution material required to push skills beyond their base rank.',
    companion: 'A companion resource. Use it to level up and strengthen your companion.',
    misc:      'A miscellaneous item obtained during your adventure.',
  }[item.category] || 'An item from your travels.';

  return (
    <motion.div
      key={`${item.dropId}-${item.collectedAt}`}
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0 }}
      className="w-[172px] flex-shrink-0 border-l border-white/[0.06] px-4 py-4 flex flex-col gap-3 overflow-y-auto"
      style={{ scrollbarWidth: 'none' }}
    >
      <div
        className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl border self-center"
        style={{ background: `${r.color}18`, borderColor: `${r.color}44` }}
      >
        {item.icon}
      </div>
      <div className="text-white text-sm font-bold text-center leading-tight">{item.name}</div>
      <div className="flex justify-center"><RarityBadge rarity={item.rarity} /></div>
      <div
        className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded border text-center capitalize"
        style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}
      >
        {item.category}
      </div>
      <div className="text-white/40 text-[10px] leading-relaxed">{desc}</div>
      {item.category === 'skill' && (
        <div
          className="text-[9px] text-center px-2 py-1.5 rounded-lg border leading-snug"
          style={{ background: 'rgba(167,139,250,0.1)', borderColor: 'rgba(167,139,250,0.3)', color: '#a78bfa' }}
        >
          ✨ Open Skills Book to view learned skills
        </div>
      )}
      <div className="text-white/20 text-[9px] mt-auto">
        Collected {new Date(item.collectedAt).toLocaleTimeString()}
      </div>
    </motion.div>
  );
}

export default function MiscInventoryPanel({ open, onClose }) {
  const [inv, setInv] = useState(getLootInventory());
  const [tab, setTab] = useState('skills');
  const [miscCat, setMiscCat] = useState('all');
  const [selected, setSelected] = useState(null);

  useEffect(() => subscribeLootInventory(setInv), []);

  const skillItems = inv['skill'] || [];
  const miscItems = tab === 'misc'
    ? (miscCat === 'all'
        ? Object.entries(inv).filter(([k]) => k !== 'skill').flatMap(([, v]) => v)
        : (inv[miscCat] || []))
    : [];

  const displayItems = tab === 'skills' ? skillItems : miscItems;
  const totalItems = Object.values(inv).flat().length;

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
              width: 560,
              maxHeight: '74vh',
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
                <span className="text-sm font-bold uppercase tracking-widest text-white/85">Inventory</span>
                <span className="text-[10px] text-white/30 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                  {totalItems} items
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-white/25 border border-white/10 px-2 py-0.5 rounded">I — close</span>
                <button onClick={onClose} className="text-white/30 hover:text-white transition-colors ml-1">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Main tabs: Skills / Items */}
            <div className="flex border-b border-white/[0.06] flex-shrink-0">
              {TABS.map((t) => {
                const count = t.id === 'skills' ? skillItems.length : Object.entries(inv).filter(([k]) => k !== 'skill').flatMap(([, v]) => v).length;
                return (
                  <button
                    key={t.id}
                    onClick={() => { setTab(t.id); setSelected(null); }}
                    className="flex-1 py-2.5 text-[11px] font-bold tracking-wide transition-all flex items-center justify-center gap-1.5 border-b-2"
                    style={tab === t.id ? {
                      color: '#fff',
                      borderBottomColor: '#a78bfa',
                      background: 'rgba(167,139,250,0.08)',
                    } : {
                      color: 'rgba(255,255,255,0.35)',
                      borderBottomColor: 'transparent',
                    }}
                  >
                    {t.label}
                    {count > 0 && (
                      <span
                        className="text-[9px] px-1.5 py-0.5 rounded-full font-black"
                        style={tab === t.id
                          ? { background: 'rgba(167,139,250,0.3)', color: '#c4b5fd' }
                          : { background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.3)' }}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Sub-category filter (only for misc tab) */}
            {tab === 'misc' && (
              <div className="flex gap-1 px-4 pt-3 pb-2 flex-shrink-0 flex-wrap">
                {MISC_CATEGORIES.map((c) => {
                  const count = c.id === 'all'
                    ? Object.entries(inv).filter(([k]) => k !== 'skill').flatMap(([, v]) => v).length
                    : (inv[c.id]?.length ?? 0);
                  return (
                    <button
                      key={c.id}
                      onClick={() => { setMiscCat(c.id); setSelected(null); }}
                      className="px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all"
                      style={miscCat === c.id ? {
                        background: 'rgba(255,255,255,0.14)', borderColor: 'rgba(255,255,255,0.28)', color: '#fff',
                      } : {
                        background: 'transparent', borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)',
                      }}
                    >
                      {c.label}
                      {count > 0 && <span className="ml-1 text-white/30">{count}</span>}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Skills hint banner */}
            {tab === 'skills' && skillItems.length > 0 && (
              <div
                className="mx-4 mt-3 mb-1 px-3 py-2 rounded-lg border text-[9px] flex items-center gap-2 flex-shrink-0"
                style={{ background: 'rgba(167,139,250,0.08)', borderColor: 'rgba(167,139,250,0.2)', color: '#c4b5fd' }}
              >
                <Sparkles className="w-3 h-3 flex-shrink-0" />
                Skills collected here will appear in your Skills Book. Open Equipment → Skills to equip them.
              </div>
            )}

            {/* Body */}
            <div className="flex flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-4 py-3" style={{ scrollbarWidth: 'none' }}>
                <ItemGrid
                  items={displayItems}
                  selected={selected}
                  onSelect={setSelected}
                  emptyMsg={
                    tab === 'skills'
                      ? 'No skills yet.\nDefeat enemies to find skill scrolls!'
                      : 'Nothing in this category.\nDefeat enemies to find loot!'
                  }
                />
              </div>

              <AnimatePresence mode="wait">
                {selected && <DetailPanel key={`${selected.dropId}-${selected.collectedAt}`} item={selected} />}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}