import React, { useEffect, useState } from 'react';
import { X, Sparkles, ChevronLeft, ChevronRight, Gem } from 'lucide-react';
import {
  subscribeEnchantments,
  getItemEnchantments,
  getCostForNextLevel,
  enchantSlot,
  MAX_ENCH_LEVEL,
  ENCH_SLOTS,
  MATERIALS,
  PER_LEVEL_BONUS,
} from './enchantmentStore';

/**
 * Wide enchantment overlay anchored between the equipment slot column and the
 * right edge of the screen. Persists per-slot enchant levels and material
 * counts via enchantmentStore so progress is retained across sessions.
 */
export default function EnchantmentPanel({ item, onClose }) {
  const [slotIndex, setSlotIndex] = useState(0);
  const [ench, setEnch] = useState({ enchantments: {}, materials: {} });
  const [flash, setFlash] = useState(null); // 'ok' | 'err' | null

  useEffect(() => subscribeEnchantments(setEnch), []);

  if (!item) return null;

  const slots = ['I', 'II', 'III', 'IV'];

  const itemName = item.name || 'Equipment';
  const itemType = item.type || item.categoryLabel || 'Weapon';
  const itemId = item.id;

  // Live data
  const levels = itemId ? getItemEnchantments(itemId) : new Array(ENCH_SLOTS).fill(0);
  const currentLevel = levels[slotIndex] || 0;
  const isMaxed = currentLevel >= MAX_ENCH_LEVEL;
  const cost = getCostForNextLevel(currentLevel);
  const mats = ench.materials || {};
  const canAfford = Object.entries(cost).every(([k, v]) => (mats[k] || 0) >= v);

  // Display values
  const baseMinAtk = item.stats?.minAttack ?? item.stats?.physicalAttack ?? 12;
  const baseMaxAtk = item.stats?.maxAttack ?? (baseMinAtk + 6);
  const baseMastery = item.mastery || 1;
  const baseDurability = item.stats?.durability ?? 50;
  const baseCrit = item.stats?.crit ?? 3;

  const totalLevel = levels.reduce((a, b) => a + b, 0);
  const curBonus = {
    min: totalLevel * PER_LEVEL_BONUS.minAtk,
    max: totalLevel * PER_LEVEL_BONUS.maxAtk,
    mas: totalLevel * PER_LEVEL_BONUS.mastery,
    dur: totalLevel * PER_LEVEL_BONUS.durability,
    crt: totalLevel * PER_LEVEL_BONUS.crit,
  };
  // Preview = what the totals would be after this enchant succeeds
  const nextBonus = isMaxed ? curBonus : {
    min: curBonus.min + PER_LEVEL_BONUS.minAtk,
    max: curBonus.max + PER_LEVEL_BONUS.maxAtk,
    mas: curBonus.mas + PER_LEVEL_BONUS.mastery,
    dur: curBonus.dur + PER_LEVEL_BONUS.durability,
    crt: curBonus.crt + PER_LEVEL_BONUS.crit,
  };

  const handleEnchant = () => {
    if (!itemId) return;
    const res = enchantSlot(itemId, slotIndex);
    setFlash(res.ok ? 'ok' : 'err');
    setTimeout(() => setFlash(null), 700);
  };

  return (
    <div
      className="absolute pointer-events-auto select-none flex flex-col"
      style={{
        left: 930,
        top: 96,
        right: 24,
        bottom: 80,
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
          {totalLevel > 0 && (
            <span className="ml-2 text-[10px] tracking-widest text-white/40">
              +{totalLevel} TOTAL
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-sm flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4 text-white/60" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 flex gap-5 p-5 overflow-y-auto">
        {/* LEFT: Mini preview + meta */}
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
            {totalLevel > 0 && (
              <span className="absolute top-2 right-2 px-1.5 py-0.5 text-[10px] tracking-widest text-amber-300 font-semibold rounded-sm"
                style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.35)' }}>
                +{totalLevel}
              </span>
            )}
          </div>

          <div>
            <div className="text-[11px] tracking-widest text-amber-400/90 font-semibold">
              {itemType.toUpperCase()}
            </div>
            <div className="text-lg font-semibold text-white truncate">
              {itemName}
            </div>
            <div className="text-[11px] text-white/40 mt-1">
              Slot {slots[slotIndex]} · Level {currentLevel}/{MAX_ENCH_LEVEL}
            </div>
          </div>
        </div>

        {/* RIGHT: Stat changes + materials */}
        <div className="flex-1 min-w-0 flex flex-col gap-5">
          {/* Stat changes — show base + current bonus, with preview delta */}
          <div>
            <div className="text-[11px] tracking-widest text-white/40 mb-2">
              STAT CHANGES
            </div>
            <div className="space-y-1.5">
              <StatRow label="Min Physical Atk" base={baseMinAtk} cur={curBonus.min} next={nextBonus.min} isMaxed={isMaxed} />
              <StatRow label="Max Physical Atk" base={baseMaxAtk} cur={curBonus.max} next={nextBonus.max} isMaxed={isMaxed} />
              <StatRow label="Mastery" base={baseMastery} cur={curBonus.mas} next={nextBonus.mas} isMaxed={isMaxed} />
              <StatRow label="Durability" base={baseDurability} cur={curBonus.dur} next={nextBonus.dur} isMaxed={isMaxed} />
              <StatRow label="Crit Rate" base={baseCrit} cur={curBonus.crt} next={nextBonus.crt} isMaxed={isMaxed} suffix="%" />
            </div>
          </div>

          {/* Materials required */}
          <div>
            <div className="text-[11px] tracking-widest text-white/40 mb-2">
              MATERIALS REQUIRED
            </div>
            <div className="grid grid-cols-3 gap-2">
              {MATERIALS.map((mat) => {
                const need = cost[mat.id] || 0;
                const have = mats[mat.id] || 0;
                const ok = have >= need;
                return (
                  <div
                    key={mat.id}
                    className="h-20 rounded-sm flex flex-col items-center justify-center relative px-2"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: `1px solid ${ok ? 'rgba(255,255,255,0.08)' : 'rgba(239,68,68,0.35)'}`,
                    }}
                    title={mat.name}
                  >
                    <Gem className="w-6 h-6" style={{ color: mat.color, opacity: 0.85 }} />
                    <span className={`mt-1 text-[10px] tracking-wider ${ok ? 'text-white/70' : 'text-red-400'}`}>
                      {have}/{need}
                    </span>
                    <span className="absolute top-1 left-1 text-[8px] tracking-widest text-white/30 uppercase truncate max-w-[80%]">
                      {mat.name.split(' ')[0]}
                    </span>
                  </div>
                );
              })}
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
              onClick={handleEnchant}
              disabled={isMaxed || !canAfford}
              className="flex-1 py-2.5 text-xs tracking-wider rounded-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: flash === 'err'
                  ? 'linear-gradient(180deg, rgba(239,68,68,0.95), rgba(185,28,28,0.9))'
                  : 'linear-gradient(180deg, rgba(251,191,36,0.95), rgba(217,119,6,0.9))',
                color: '#1a1208',
                boxShadow: flash === 'ok'
                  ? '0 0 22px rgba(251,191,36,0.65)'
                  : '0 4px 14px rgba(251,191,36,0.25)',
              }}
            >
              {isMaxed ? 'MAX LEVEL' : !canAfford ? 'NOT ENOUGH' : `ENCHANT → LV ${currentLevel + 1}`}
            </button>
          </div>
        </div>
      </div>

      {/* Footer — slot switcher with per-slot level pips */}
      <div className="flex items-center justify-between px-5 py-2.5 border-t border-white/10 shrink-0">
        <button
          onClick={() => setSlotIndex((i) => Math.max(0, i - 1))}
          className="w-7 h-7 rounded-sm flex items-center justify-center hover:bg-white/10 disabled:opacity-30"
          disabled={slotIndex === 0}
        >
          <ChevronLeft className="w-4 h-4 text-white/60" />
        </button>
        <div className="flex gap-2">
          {slots.map((s, i) => {
            const lv = levels[i] || 0;
            const active = slotIndex === i;
            return (
              <button
                key={s}
                onClick={() => setSlotIndex(i)}
                className={`relative w-12 h-9 rounded-sm text-[11px] tracking-wider transition-all flex items-center justify-center gap-1 ${
                  active
                    ? 'text-amber-400 border border-amber-400/60'
                    : 'text-white/40 border border-white/10 hover:text-white/70'
                }`}
                style={
                  active
                    ? { background: 'rgba(251,191,36,0.08)' }
                    : { background: 'rgba(255,255,255,0.03)' }
                }
              >
                {s}
                {lv > 0 && (
                  <span className="text-[9px] text-amber-300/90 font-bold">+{lv}</span>
                )}
              </button>
            );
          })}
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

function StatRow({ label, base, cur, next, isMaxed, suffix = '' }) {
  const showDelta = !isMaxed && next > cur;
  return (
    <div className="flex items-center justify-between text-[11px]">
      <span className="text-white/50">{label}</span>
      <span className="flex items-center gap-1.5">
        <span className="text-white/70">{base}{suffix}</span>
        {cur > 0 && (
          <span className="text-amber-300/90 font-semibold">+{cur}{suffix}</span>
        )}
        {showDelta && (
          <span className="text-emerald-400/90 font-semibold">→ +{next}{suffix}</span>
        )}
      </span>
    </div>
  );
}