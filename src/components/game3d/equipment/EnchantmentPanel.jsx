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
      className="absolute pointer-events-auto select-none"
      style={{
        left: 860,
        top: 96,
        width: 460,
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
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-[11px] tracking-[0.2em] text-amber-400 font-semibold">
            ENCHANTMENT
          </span>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 rounded-sm flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <X className="w-3.5 h-3.5 text-white/60" />
        </button>
      </div>

      {/* Body */}
      <div className="flex gap-3 p-3">
        {/* Mini equipment preview tile */}
        <div
          className="shrink-0 w-[110px] h-[140px] rounded-sm flex items-center justify-center relative overflow-hidden"
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
          <Gem className="w-10 h-10 text-amber-300/80 relative" />
          <span className="absolute bottom-1.5 left-1.5 text-[9px] tracking-widest text-white/40">
            T{item.tier || 1}
          </span>
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="text-[10px] tracking-widest text-amber-400/90 font-semibold">
            {itemType.toUpperCase()}
          </div>
          <div className="text-base font-semibold text-white truncate">
            {itemName}
          </div>
          <div className="text-[10px] text-white/40 mt-0.5">
            A piece of {itemType.toLowerCase()} equipment.
          </div>

          {/* Stat changes */}
          <div className="mt-2.5 space-y-1">
            <Row label="Min Physical Atk" value={`+${minAtk}`} />
            <Row label="Max Physical Atk" value={`+${maxAtk}`} />
            <Row label="Mastery" value={`+${item.mastery || 1}`} />
          </div>
        </div>
      </div>

      {/* Materials required */}
      <div className="px-3 pb-3">
        <div className="text-[10px] tracking-widest text-white/40 mb-1.5">
          MATERIALS REQUIRED
        </div>
        <div className="flex gap-1.5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex-1 h-12 rounded-sm flex items-center justify-center relative"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <Gem className="w-4 h-4 text-cyan-300/70" />
              <span className="absolute bottom-0.5 right-1 text-[9px] text-white/50">
                {i === 1 ? '3' : i === 2 ? '1' : '0'}/2
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 px-3 pb-3">
        <button
          onClick={onClose}
          className="flex-1 py-1.5 text-xs tracking-wider rounded-sm border border-white/12 text-white/70 hover:bg-white/5 transition-colors"
        >
          CANCEL
        </button>
        <button
          className="flex-1 py-1.5 text-xs tracking-wider rounded-sm font-semibold transition-all"
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

      {/* Footer — slot switcher */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-white/10">
        <button
          onClick={() => setSlotIndex((i) => Math.max(0, i - 1))}
          className="w-6 h-6 rounded-sm flex items-center justify-center hover:bg-white/10 disabled:opacity-30"
          disabled={slotIndex === 0}
        >
          <ChevronLeft className="w-3.5 h-3.5 text-white/60" />
        </button>
        <div className="flex gap-1.5">
          {slots.map((s, i) => (
            <button
              key={s}
              onClick={() => setSlotIndex(i)}
              className={`w-7 h-7 rounded-sm text-[10px] tracking-wider transition-all ${
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
          className="w-6 h-6 rounded-sm flex items-center justify-center hover:bg-white/10 disabled:opacity-30"
          disabled={slotIndex === slots.length - 1}
        >
          <ChevronRight className="w-3.5 h-3.5 text-white/60" />
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