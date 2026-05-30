// ─── WeaponUpgradePanel ───────────────────────────────────────────────────
// Weapon upgrade system — levels the weapon from 1 to 50.
// Every level increases the weapon's base damage by a flat amount.
// Max level = 50. Cost: Gold + Iron Shards (common enemy drop).

import React, { useEffect, useState } from 'react';
import { ArrowUp, Shield, Swords, Zap } from 'lucide-react';
import {
  subscribeUpgrade, getUpgrade, attemptUpgrade,
  getDamageAtLevel, getUpgradeCost, getUpgradeRarity,
  MAX_UPGRADE_LEVEL, UPGRADE_RARITY_TIERS,
} from './weaponUpgradeStore';
import { subscribeShop, addGold } from '../../shop/shopStore';

const WEAPON_ELEMENTS = {
  bow:         { name: 'Wind',      color: '#a3e635', icon: '🌪️' },
  sword:       { name: 'Fire',      color: '#fb923c', icon: '🔥' },
  dual_blades: { name: 'Lightning', color: '#fde047', icon: '⚡' },
};
const DEFAULT_ELEMENT = { name: 'Arcane', color: '#a855f7', icon: '✨' };

function LevelBar({ level, accent }) {
  const pct = ((level - 1) / (MAX_UPGRADE_LEVEL - 1)) * 100;
  // Render 50 segment ticks
  return (
    <div className="relative h-4 w-full rounded-sm overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div
        className="h-full transition-all duration-500"
        style={{
          width: `${pct}%`,
          background: `linear-gradient(90deg, ${accent}88, ${accent})`,
          boxShadow: `0 0 8px ${accent}66`,
        }}
      />
      {/* Segment dividers every 10 levels */}
      {[10, 20, 30, 40].map((l) => (
        <div
          key={l}
          className="absolute top-0 bottom-0 w-px"
          style={{
            left: `${((l - 1) / (MAX_UPGRADE_LEVEL - 1)) * 100}%`,
            background: 'rgba(255,255,255,0.15)',
          }}
        />
      ))}
    </div>
  );
}

export default function WeaponUpgradePanel({ weaponId, weaponName, weaponIcon }) {
  const [, force] = useState(0);
  const [gold, setGold] = useState(0);
  const [ironShards, setIronShards] = useState(50); // mock inventory

  useEffect(() => subscribeUpgrade(() => force((x) => x + 1)), []);
  useEffect(() => subscribeShop((s) => setGold(s.gold)), []);

  const entry = getUpgrade(weaponId);
  const level = entry.level;
  const isMax = level >= MAX_UPGRADE_LEVEL;
  const cost = !isMax ? getUpgradeCost(level + 1) : null;
  const rarity = getUpgradeRarity(level);
  const currentDmg = getDamageAtLevel(level);
  const nextDmg = !isMax ? getDamageAtLevel(level + 1) : null;
  const element = WEAPON_ELEMENTS[weaponId] || DEFAULT_ELEMENT;
  const canAfford = cost ? gold >= cost.gold && ironShards >= cost.shards : false;

  const handleUpgrade = () => {
    if (isMax || !canAfford) return;
    addGold(-cost.gold);
    setIronShards((s) => s - cost.shards);
    attemptUpgrade(weaponId);
  };

  return (
    <div className="flex flex-col gap-4 px-2 py-2 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-4 py-3 rounded-sm"
        style={{
          background: `linear-gradient(90deg, ${rarity.color}10 0%, rgba(10,14,22,0.85) 100%)`,
          border: `1px solid ${rarity.color}33`,
        }}
      >
        <div className="flex items-center gap-3">
          <div className="text-3xl">{weaponIcon || '⚔️'}</div>
          <div>
            <div className="text-[10px] tracking-[0.3em] uppercase" style={{ color: rarity.color }}>
              {rarity.name} — Weapon Level
            </div>
            <div className="text-xl font-semibold text-white">{weaponName}</div>
          </div>
        </div>
        <div className="text-right tabular-nums">
          <div className="text-[9px] tracking-[0.25em] uppercase text-white/40">Current Level</div>
          <div className="text-4xl font-bold leading-none" style={{ color: rarity.color }}>
            {level}
            <span className="text-[14px] text-white/30 ml-1">/ {MAX_UPGRADE_LEVEL}</span>
          </div>
          {isMax && (
            <div className="text-[9px] tracking-[0.3em] uppercase mt-0.5" style={{ color: rarity.color }}>
              MAX
            </div>
          )}
        </div>
      </div>

      {/* ── Level Bar ── */}
      <div>
        <div className="flex justify-between text-[9px] text-white/40 mb-1.5 tracking-[0.2em] uppercase">
          <span>Level Progress</span>
          <span>{level} / {MAX_UPGRADE_LEVEL}</span>
        </div>
        <LevelBar level={level} accent={rarity.color} />
        <div className="flex justify-between text-[9px] text-white/25 mt-1">
          {UPGRADE_RARITY_TIERS.map((t) => (
            <span key={t.upTo} style={{ color: level >= t.upTo ? t.color : 'rgba(255,255,255,0.20)' }}>
              {t.name}
            </span>
          ))}
        </div>
      </div>

      {/* ── Damage stat card ── */}
      <div
        className="flex items-stretch gap-0 rounded-sm overflow-hidden"
        style={{ border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div
          className="flex-1 flex flex-col items-center justify-center py-4"
          style={{ background: 'rgba(255,255,255,0.02)' }}
        >
          <Swords className="w-4 h-4 mb-1.5 text-white/35" />
          <div className="text-[9px] tracking-[0.25em] uppercase text-white/40 mb-1">Base Damage</div>
          <div className="text-3xl font-bold tabular-nums text-white/90">{currentDmg}</div>
        </div>
        {!isMax && (
          <>
            <div className="w-px self-stretch" style={{ background: 'rgba(255,255,255,0.06)' }} />
            <div
              className="flex-1 flex flex-col items-center justify-center py-4"
              style={{ background: `${rarity.color}08` }}
            >
              <ArrowUp className="w-4 h-4 mb-1.5" style={{ color: rarity.color }} />
              <div className="text-[9px] tracking-[0.25em] uppercase text-white/40 mb-1">After Upgrade</div>
              <div className="text-3xl font-bold tabular-nums" style={{ color: rarity.color }}>{nextDmg}</div>
              <div className="text-[10px] text-emerald-300/80 mt-1">+{nextDmg - currentDmg} DMG</div>
            </div>
          </>
        )}
        {isMax && (
          <>
            <div className="w-px self-stretch" style={{ background: 'rgba(255,255,255,0.06)' }} />
            <div
              className="flex-1 flex flex-col items-center justify-center py-4"
              style={{ background: `${rarity.color}08` }}
            >
              <Zap className="w-4 h-4 mb-1.5" style={{ color: rarity.color }} />
              <div className="text-[9px] tracking-[0.25em] uppercase text-white/40 mb-1">Max Reached</div>
              <div className="text-sm font-semibold" style={{ color: rarity.color }}>Celestial</div>
              <div className="text-[9px] text-white/30 mt-1">Peak Power</div>
            </div>
          </>
        )}
      </div>

      {/* ── Level milestones ── */}
      <div>
        <div className="text-[10px] tracking-[0.35em] uppercase text-white/40 mb-2 flex items-center gap-1.5">
          <Shield className="w-3 h-3" />
          Tier Milestones
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {UPGRADE_RARITY_TIERS.map((t) => {
            const reached = level >= t.upTo;
            return (
              <div
                key={t.upTo}
                className="flex flex-col items-center gap-1 py-2 px-1 rounded-sm"
                style={{
                  background: reached ? `${t.color}0d` : 'rgba(255,255,255,0.02)',
                  border: reached ? `1px solid ${t.color}44` : '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div className="text-[11px] font-semibold" style={{ color: reached ? t.color : 'rgba(255,255,255,0.25)' }}>
                  {t.name}
                </div>
                <div className="text-[9px] text-white/30">Lv {t.upTo}</div>
                <div className="text-[9px]" style={{ color: reached ? t.color : 'rgba(255,255,255,0.20)' }}>
                  +{(t.upTo - 1) * 18} ATK
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Upgrade button ── */}
      {!isMax ? (
        <div className="mt-auto">
          <div
            className="flex items-center justify-between px-3 py-2 rounded-sm mb-3"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="text-[10px] tracking-[0.2em] uppercase text-white/45">Upgrade Cost</div>
            <div className="flex items-center gap-4 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-gradient-to-br from-amber-200 to-amber-500 inline-block" />
                <span className="tabular-nums text-white/80">{cost?.gold.toLocaleString()}</span>
                <span className="text-white/35">Gold</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-300">⚙</span>
                <span className="tabular-nums text-white/80">{cost?.shards}</span>
                <span className="text-white/35">Iron Shards</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleUpgrade}
            disabled={!canAfford}
            className="w-full py-3 text-[11px] tracking-[0.5em] uppercase font-semibold transition-all rounded-sm flex items-center justify-center gap-2"
            style={{
              background: canAfford
                ? `linear-gradient(180deg, ${rarity.color}cc 0%, ${rarity.color}88 100%)`
                : 'rgba(40,40,46,0.85)',
              color: canAfford ? '#000' : 'rgba(255,255,255,0.30)',
              border: canAfford
                ? `1px solid ${rarity.color}aa`
                : '1px solid rgba(255,255,255,0.08)',
              boxShadow: canAfford
                ? `0 0 20px ${rarity.color}44, inset 0 1px 0 rgba(255,255,255,0.2)`
                : 'inset 0 0 12px rgba(0,0,0,0.5)',
              cursor: canAfford ? 'pointer' : 'not-allowed',
            }}
          >
            <ArrowUp className="w-4 h-4" />
            Upgrade to Level {level + 1}
          </button>
          {!canAfford && (
            <div className="text-[9px] text-white/30 text-center mt-1.5">
              {gold < (cost?.gold || 0)
                ? `Need ${((cost?.gold || 0) - gold).toLocaleString()} more Gold`
                : `Need ${(cost?.shards || 0) - ironShards} more Iron Shards`}
            </div>
          )}
          <div className="flex items-center justify-between mt-2 text-[9px] text-white/30">
            <span>Gold: {gold.toLocaleString()}</span>
            <span>Iron Shards: {ironShards}</span>
          </div>
        </div>
      ) : (
        <div
          className="py-5 text-center rounded-sm mt-auto"
          style={{
            background: `${rarity.color}0a`,
            border: `1px solid ${rarity.color}44`,
          }}
        >
          <div className="text-[11px] tracking-[0.4em] uppercase font-semibold" style={{ color: rarity.color }}>
            Celestial Weapon ✦ Max Level Achieved
          </div>
          <div className="text-[10px] text-white/40 mt-1">
            Total Damage Bonus: +{getDamageAtLevel(MAX_UPGRADE_LEVEL) - getDamageAtLevel(1)} ATK
          </div>
        </div>
      )}
    </div>
  );
}