import React, { useState } from 'react';
import { X, Sparkles, ChevronLeft, ChevronRight, Gem } from 'lucide-react';

/**
 * Compact enchantment overlay that appears over the 3D character preview,
 * positioned just right of the EquipmentSlotsColumn. Liquid-glass styled,
 * no opaque card backdrop so the character remains visible behind it.
 *
 * Layout (left → right within the panel):
 *  - Tiny 3D-style preview tile of the equipment
 *  - Item meta + stat changes
 *  - Required materials
 *  - Enchant / Cancel actions
 *  - Footer: enchantable slot switcher
 */
export default function EnchantmentPanel({ item, onClose }) {
  const [slotIndex, setSlotIndex] = useState(0);

  if (!item) return null;

  const slots = ['I', 'II', 'III', 'IV'];

  // Derive display values from the inspected item (fallbacks for missing data)
  const itemName = item.name || 'Equipment';
  const itemType = item.type || item.categoryLabel || 'Weapon';
  const minAtk = item.stats?.minAttack ?? item.stats?.physicalAttack ?? 12;
  const maxAtk = item.stats?.maxAttack ?? (minAtk + 6);

  return (
    <div
      className="absolute pointer-events-auto select-none flex flex-col"
      style={{
        left: 930,
        top: 96,
        right: 24,
        bottom: 80,
        // Liquid glass — translucent, blurred, no solid card
        background: 'rgba(15,17,22,0.42)',
        backdropFilter: 'blur(18px) saturate(140%)',
        WebkitBackdropFilter: 'blur(18px) saturate(140%)',
        border: '1px solid rgba(255,255,255,0.10)',
        boxShadow:
          '0 10px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)',
        borderRadius: 6,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <span className="text-sm tracking-[0.25em] text-amber-400 font-semibold">
            ENCHANTMENT
          </span>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-sm flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4 text-white/60" />
        </button>
      </div>

      {/* Body — two columns to use the wider space */}
      <div className="flex-1 min-h-0 flex gap-5 p-5 overflow-y-auto">
        {/* LEFT: Mini preview + meta + stats */}
        <div className="flex flex-col gap-4 w-[240px] shrink-0">
          <div
            className="w-full h-[200px] rounded-sm flex items-center justify-center relative overflow-hidden"
            style={{
              background:
                'linear-gradient(160deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div
              className="absolute inset-0 opacity-40"
              style={{
                background:
                  'radial-gradient(circle at 50% 40%, rgba(251,191,36,0.25), transparent 60%)',
              }}
            />
            <Gem className="w-16 h-16 text-amber-300/80 relative" />
            <span className="absolute bottom-2 left-2 text-[10px] tracking-widest text-white/40">
              T{item.tier || 1}
            </span>
          </div>

          <div>
            <div className="text-[11px] tracking-widest text-amber-400/90 font-semibold">
              {itemType.toUpperCase()}
            </div>
            <div className="text-lg font-semibold text-white truncate">
              {itemName}
            </div>
            <div className="text-[11px] text-white/40 mt-1">
              A piece of {itemType.toLowerCase()} equipment.
            </div>
          </div>
        </div>

        {/* RIGHT: Stat changes + materials, stretching to fill */}
        <div className="flex-1 min-w-0 flex flex-col gap-5">
          {/* Stat changes */}
          <div>
            <div className="text-[11px] tracking-widest text-white/40 mb-2">
              STAT CHANGES
            </div>
            <div className="space-y-1.5">
              <Row label="Min Physical Atk" value={`+${minAtk}`} />
              <Row label="Max Physical Atk" value={`+${maxAtk}`} />
              <Row label="Mastery" value={`+${item.mastery || 1}`} />
              <Row label="Durability" value={`+${item.stats?.durability || 50}`} />
              <Row label="Crit Rate" value={`+${item.stats?.crit || 3}%`} />
            </div>
          </div>

          {/* Materials required */}
          <div>
            <div className="text-[11px] tracking-widest text-white/40 mb-2">
              MATERIALS REQUIRED
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-20 rounded-sm flex flex-col items-center justify-center relative"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <Gem className="w-6 h-6 text-cyan-300/70" />
                  <span className="mt-1 text-[10px] text-white/50">
                    {i === 1 ? '3' : i === 2 ? '1' : '0'}/2
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-auto">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 text-xs tracking-wider rounded-sm border border-white/12 text-white/70 hover:bg-white/5 transition-colors"
            >
              CANCEL
            </button>
            <button
              className="flex-1 py-2.5 text-xs tracking-wider rounded-sm font-semibold transition-all"
              style={{
                background:
                  'linear-gradient(180deg, rgba(251,191,36,0.95), rgba(217,119,6,0.9))',
                color: '#1a1208',
                boxShadow: '0 4px 14px rgba(251,191,36,0.25)',
              }}
            >
              ENCHANT
            </button>
          </div>
        </div>
      </div>

      {/* Footer — slot switcher */}
      <div className="flex items-center justify-between px-5 py-2.5 border-t border-white/10 shrink-0">
        <button
          onClick={() => setSlotIndex((i) => Math.max(0, i - 1))}
          className="w-7 h-7 rounded-sm flex items-center justify-center hover:bg-white/10 disabled:opacity-30"
          disabled={slotIndex === 0}
        >
          <ChevronLeft className="w-4 h-4 text-white/60" />
        </button>
        <div className="flex gap-2">
          {slots.map((s, i) => (
            <button
              key={s}
              onClick={() => setSlotIndex(i)}
              className={`w-9 h-9 rounded-sm text-[11px] tracking-wider transition-all ${
                slotIndex === i
                  ? 'text-amber-400 border border-amber-400/60'
                  : 'text-white/40 border border-white/10 hover:text-white/70'
              }`}
              style={
                slotIndex === i
                  ? { background: 'rgba(251,191,36,0.08)' }
                  : { background: 'rgba(255,255,255,0.03)' }
              }
            >
              {s}
            </button>
          ))}
        </div>
        <button
          onClick={() => setSlotIndex((i) => Math.min(slots.length - 1, i + 1))}
          className="w-7 h-7 rounded-sm flex items-center justify-center hover:bg-white/10 disabled:opacity-30"
          disabled={slotIndex === slots.length - 1}
        >
          <ChevronRight className="w-4 h-4 text-white/60" />
        </button>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between text-[11px]">
      <span className="text-white/50">{label}</span>
      <span className="text-amber-300/90 font-semibold">{value}</span>
    </div>
  );
}