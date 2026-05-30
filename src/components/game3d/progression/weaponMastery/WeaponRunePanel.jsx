// ─── WeaponRunePanel ──────────────────────────────────────────────────────
// Rune system — the foundational layer of weapon power.
// Each weapon has 4 rune slots. Socketing runes increases the weapon's
// base ATK permanently. Runes range from Tier I (common) to Tier V (divine).
// This panel shows all 4 slots, total bonus, and upgrade/insert controls.

import React, { useEffect, useState } from 'react';
import { Gem, Plus, ArrowUp, X, Sparkles, Lock } from 'lucide-react';
import {
  subscribeRune, getRuneData, insertRune, removeRune, upgradeRune,
  RUNE_TIERS, MAX_RUNE_SLOTS, MAX_RUNE_TIER, getRuneTier, getTotalRuneBonus,
  RUNE_SLOT_UNLOCK_LEVELS,
} from './weaponRuneStore';
import { subscribeShop, addGold } from '../../shop/shopStore';

const WEAPON_ELEMENTS = {
  bow:         { name: 'Wind',      color: '#a3e635', icon: '🌪️' },
  sword:       { name: 'Fire',      color: '#fb923c', icon: '🔥' },
  dual_blades: { name: 'Lightning', color: '#fde047', icon: '⚡' },
};
const DEFAULT_ELEMENT = { name: 'Arcane', color: '#a855f7', icon: '✨' };

export default function WeaponRunePanel({ weaponId, weaponName, weaponIcon, masteryLevel = 1 }) {
  const [, force] = useState(0);
  const [gold, setGold] = useState(0);
  const [runeDust, setRuneDust] = useState(30); // mock — in a real game this comes from inventory

  useEffect(() => subscribeRune(() => force((x) => x + 1)), []);
  useEffect(() => subscribeShop((s) => setGold(s.gold)), []);

  const runeData = getRuneData(weaponId);
  const totalBonus = getTotalRuneBonus(runeData.slots);
  const element = WEAPON_ELEMENTS[weaponId] || DEFAULT_ELEMENT;

  const handleInsert = (slotIndex, tier) => {
    const cost = RUNE_TIERS.find((r) => r.tier === tier);
    if (!cost) return;
    if (gold < cost.cost.gold || runeDust < cost.cost.dust) return;
    addGold(-cost.cost.gold);
    setRuneDust((d) => d - cost.cost.dust);
    insertRune(weaponId, slotIndex, tier);
  };

  const handleUpgrade = (slotIndex) => {
    const slot = runeData.slots[slotIndex];
    if (!slot) return;
    const nextTier = RUNE_TIERS.find((r) => r.tier === slot.tier + 1);
    if (!nextTier) return;
    if (gold < nextTier.cost.gold || runeDust < nextTier.cost.dust) return;
    addGold(-nextTier.cost.gold);
    setRuneDust((d) => d - nextTier.cost.dust);
    upgradeRune(weaponId, slotIndex);
  };

  const handleRemove = (slotIndex) => {
    removeRune(weaponId, slotIndex);
  };

  return (
    <div className="flex flex-col gap-4 px-2 py-2 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-4 py-3 rounded-sm"
        style={{
          background: `linear-gradient(90deg, ${element.color}12 0%, rgba(10,14,22,0.85) 100%)`,
          border: `1px solid ${element.color}33`,
        }}
      >
        <div className="flex items-center gap-3">
          <div className="text-3xl">{weaponIcon || '⚔️'}</div>
          <div>
            <div className="text-[10px] tracking-[0.3em] uppercase text-white/50">Rune Socket</div>
            <div className="text-lg font-semibold text-white">{weaponName}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[9px] tracking-[0.25em] uppercase text-white/40">Total Rune ATK</div>
          <div className="text-2xl font-bold tabular-nums" style={{ color: element.color }}>
            +{totalBonus}
          </div>
        </div>
      </div>

      {/* ── Description ── */}
      <div
        className="px-3 py-2 rounded-sm text-[11px] text-white/50 leading-relaxed"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <Sparkles className="w-3 h-3 inline mr-1.5 text-white/30" />
        Runes are the <span className="text-white/75">foundation of your weapon's power</span>. Each socket permanently increases base ATK. Higher tier runes require more resources but provide exponentially greater damage.
      </div>

      {/* ── Rune Slots ── */}
      <div>
        <div className="text-[10px] tracking-[0.35em] uppercase text-white/45 mb-2 flex items-center gap-1.5">
          <Gem className="w-3 h-3" />
          Rune Slots
        </div>
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: MAX_RUNE_SLOTS }, (_, i) => {
            const unlockLevel = RUNE_SLOT_UNLOCK_LEVELS[i];
            const unlocked = masteryLevel >= unlockLevel;
            const slot = runeData.slots[i];
            const runeTier = slot ? getRuneTier(slot.tier) : null;
            const canUpgrade = slot && slot.tier < MAX_RUNE_TIER;
            const nextTierData = canUpgrade ? RUNE_TIERS.find((r) => r.tier === slot.tier + 1) : null;
            const canAffordUpgrade = nextTierData
              ? gold >= nextTierData.cost.gold && runeDust >= nextTierData.cost.dust
              : false;

            return (
              <div
                key={i}
                className="relative rounded-sm overflow-hidden"
                style={{
                  background: unlocked
                    ? (slot ? `${runeTier.color}0d` : 'rgba(255,255,255,0.02)')
                    : 'rgba(0,0,0,0.3)',
                  border: unlocked
                    ? (slot ? `1px solid ${runeTier.color}55` : '1px dashed rgba(255,255,255,0.15)')
                    : '1px solid rgba(255,255,255,0.06)',
                }}
              >
                {!unlocked ? (
                  /* Locked slot */
                  <div className="flex flex-col items-center justify-center gap-1.5 py-5 px-3">
                    <Lock className="w-4 h-4 text-white/20" />
                    <div className="text-[9px] tracking-[0.2em] uppercase text-white/25 text-center">
                      Mastery Lv {unlockLevel} required
                    </div>
                  </div>
                ) : slot ? (
                  /* Filled slot */
                  <div className="p-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-sm flex items-center justify-center text-base"
                          style={{
                            background: `${runeTier.color}1a`,
                            border: `1px solid ${runeTier.color}88`,
                            boxShadow: `0 0 8px ${runeTier.color}44`,
                          }}
                        >
                          💎
                        </div>
                        <div>
                          <div className="text-[11px] font-semibold" style={{ color: runeTier.color }}>
                            {runeTier.name}
                          </div>
                          <div className="text-[9px] text-white/40">+{runeTier.atkBonus} ATK</div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemove(i)}
                        className="w-5 h-5 rounded flex items-center justify-center hover:bg-white/10 transition-all"
                        title="Remove rune"
                      >
                        <X className="w-3 h-3 text-white/40" />
                      </button>
                    </div>
                    {canUpgrade && (
                      <button
                        onClick={() => handleUpgrade(i)}
                        disabled={!canAffordUpgrade}
                        className="w-full py-1.5 text-[9px] tracking-[0.25em] uppercase flex items-center justify-center gap-1 transition-all rounded-sm"
                        style={{
                          background: canAffordUpgrade ? `${runeTier.color}22` : 'rgba(255,255,255,0.03)',
                          border: canAffordUpgrade ? `1px solid ${runeTier.color}55` : '1px solid rgba(255,255,255,0.08)',
                          color: canAffordUpgrade ? runeTier.color : 'rgba(255,255,255,0.25)',
                          cursor: canAffordUpgrade ? 'pointer' : 'not-allowed',
                        }}
                      >
                        <ArrowUp className="w-2.5 h-2.5" />
                        Upgrade → {nextTierData?.name}
                        <span className="ml-1 text-white/40">({nextTierData?.cost.gold.toLocaleString()}g)</span>
                      </button>
                    )}
                    {!canUpgrade && (
                      <div className="text-[9px] text-center tracking-[0.2em] uppercase" style={{ color: runeTier.color }}>
                        Max Tier ✦
                      </div>
                    )}
                  </div>
                ) : (
                  /* Empty slot — insert options */
                  <div className="p-3">
                    <div className="text-[9px] text-white/35 tracking-[0.2em] uppercase mb-2">
                      Slot {i + 1} — Insert Rune
                    </div>
                    <div className="flex flex-col gap-1">
                      {RUNE_TIERS.map((rt) => {
                        const canAfford = gold >= rt.cost.gold && runeDust >= rt.cost.dust;
                        return (
                          <button
                            key={rt.tier}
                            onClick={() => handleInsert(i, rt.tier)}
                            disabled={!canAfford}
                            className="flex items-center justify-between px-2 py-1 rounded-sm text-[9px] transition-all"
                            style={{
                              background: canAfford ? `${rt.color}0d` : 'transparent',
                              border: canAfford ? `1px solid ${rt.color}44` : '1px solid rgba(255,255,255,0.05)',
                              color: canAfford ? rt.color : 'rgba(255,255,255,0.20)',
                              cursor: canAfford ? 'pointer' : 'not-allowed',
                            }}
                          >
                            <span>{rt.name} (+{rt.atkBonus} ATK)</span>
                            <span style={{ color: canAfford ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.15)' }}>
                              {rt.cost.gold.toLocaleString()}g
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Resource Bar ── */}
      <div
        className="flex items-center justify-between px-3 py-2 rounded-sm"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-3 text-[10px]">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-gradient-to-br from-amber-200 to-amber-500 inline-block" />
            <span className="text-white/55">Gold:</span>
            <span className="text-white/80 tabular-nums">{gold.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-purple-300">✦</span>
            <span className="text-white/55">Rune Dust:</span>
            <span className="text-white/80 tabular-nums">{runeDust}</span>
          </div>
        </div>
        <div className="text-[9px] text-white/30 tracking-[0.15em] uppercase">
          Resources
        </div>
      </div>
    </div>
  );
}