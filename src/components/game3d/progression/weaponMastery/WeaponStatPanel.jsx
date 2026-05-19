// ─── WeaponStatPanel ──────────────────────────────────────────────────────
// Detailed right-side stat panel for the Enchantment screen. Shows:
//   • Header — weapon name, rarity tier, current enchant level + combine stage
//   • Detailed stat rows with before → after deltas (ATK, Element Dmg,
//     Crit Rate, Crit Dmg, Durability)
//   • Element type indicator that flares brighter at higher levels/stages
//   • Material cost card + gold cost + Enhance / Refine button
//
// Pure presentation. Receives a `preview` object (next step), current entry,
// rarity, accent color, and the Enhance handler from the parent panel.

import React from 'react';
import { Hammer, Sparkles, Zap, ShieldAlert, Star } from 'lucide-react';

// Display label, element color, and matching emoji for each weapon type.
// (Falls back to neutral arcane if the weapon id is unrecognized.)
const ELEMENT_BY_WEAPON = {
  bow:          { name: 'Wind',    color: '#a3e635', icon: '🌪️' },
  sword:        { name: 'Fire',    color: '#fb923c', icon: '🔥' },
  dual_blades:  { name: 'Lightning', color: '#fde047', icon: '⚡' },
};
const DEFAULT_ELEMENT = { name: 'Arcane', color: '#a855f7', icon: '✨' };

function StatRow({ label, fromValue, toValue, suffix, accent, highlight }) {
  const delta = toValue != null ? toValue - fromValue : null;
  return (
    <div
      className="flex items-center justify-between px-3 py-2"
      style={{
        background: highlight ? `${accent}0d` : 'rgba(255,255,255,0.02)',
        borderLeft: highlight ? `2px solid ${accent}` : '2px solid transparent',
      }}
    >
      <span className="text-[10px] tracking-[0.2em] uppercase text-white/55">{label}</span>
      <div className="flex items-baseline gap-2 tabular-nums">
        <span className="text-white/75 text-sm">
          {fromValue}{suffix || ''}
        </span>
        {toValue != null && (
          <>
            <span className="text-white/30">›</span>
            <span className="font-semibold text-sm" style={{ color: accent }}>
              {toValue}{suffix || ''}
            </span>
            {delta > 0 && (
              <span className="text-[10px] text-emerald-300/85 ml-1">
                +{Number.isInteger(delta) ? delta : delta.toFixed(2)}{suffix || ''}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function WeaponStatPanel({
  weaponId,
  weaponName,
  entry,
  preview,
  rarity,
  accent,
  stash,
  onEnhance,
  MAX_LEVEL,
  MAX_NORMAL_LEVEL,
}) {
  const overEnchant = entry.level > MAX_NORMAL_LEVEL;
  const element = ELEMENT_BY_WEAPON[weaponId] || DEFAULT_ELEMENT;

  const canAfford = preview.atMax
    ? false
    : (stash[preview.material.key] >= preview.material.count) && (stash.gold >= preview.gold);

  return (
    <div className="flex flex-col h-full">
      {/* ── Header card — name, rarity, level + stage ─────────────────── */}
      <div
        className="px-4 py-3 mb-3 rounded-sm"
        style={{
          background: 'linear-gradient(90deg, rgba(20,30,42,0.85) 0%, rgba(10,14,22,0.85) 100%)',
          border: '1px solid rgba(180,160,130,0.25)',
          boxShadow: 'inset 0 0 18px rgba(0,0,0,0.6)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 flex items-center justify-center rounded-sm"
            style={{ background: `${accent}1a`, border: `1px solid ${accent}55` }}
          >
            <Hammer className="w-4 h-4" style={{ color: accent }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-[10px] tracking-[0.3em] uppercase" style={{ color: rarity.color }}>
              {rarity.name}
              {overEnchant && <span className="text-rose-300">· Over-Enchant</span>}
              {entry.combineStage > 0 && (
                <span className="flex items-center gap-0.5 text-amber-200">
                  <Star className="w-2.5 h-2.5 fill-amber-200" />
                  Stage {entry.combineStage}
                </span>
              )}
            </div>
            <div className="text-xl font-semibold tracking-[0.05em] text-white truncate">
              {weaponName || 'Weapon'}
            </div>
          </div>
        </div>

        {/* Enhance bar — current level → next level */}
        <div className="mt-3 flex items-center gap-2 text-sm">
          <span className="text-white/55 tracking-[0.15em] uppercase text-[10px]">Enhance</span>
          <span className="tabular-nums text-white/85">{entry.level}</span>
          <span className="text-white/30">›</span>
          <span
            className="tabular-nums font-semibold"
            style={{ color: preview.atMax ? '#f5d27a' : accent }}
          >
            {preview.atMax ? `${MAX_LEVEL} MAX` : preview.toLevel}
            <span className="text-white/45 ml-1 text-[10px]">/{MAX_LEVEL}</span>
          </span>
        </div>
      </div>

      {/* ── Element badge — flares more vividly as level + stage rise ──── */}
      <div
        className="mb-3 px-3 py-2 rounded-sm flex items-center justify-between"
        style={{
          background: `linear-gradient(90deg, ${element.color}1a 0%, transparent 100%)`,
          border: `1px solid ${element.color}55`,
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-sm flex items-center justify-center text-base"
            style={{
              background: `${element.color}22`,
              border: `1px solid ${element.color}88`,
              boxShadow: `0 0 ${8 + entry.level * 0.05 + entry.combineStage * 4}px ${element.color}66`,
            }}
          >
            {element.icon}
          </div>
          <div>
            <div className="text-[9px] tracking-[0.3em] uppercase text-white/55">Element</div>
            <div className="text-sm font-semibold" style={{ color: element.color }}>
              {element.name}
            </div>
          </div>
        </div>
        <div className="text-right tabular-nums">
          <div className="text-[9px] tracking-[0.2em] uppercase text-white/45">Element Dmg</div>
          <div className="text-sm font-semibold" style={{ color: element.color }}>
            {preview.atMax ? entry.level && preview.fromStats?.elementDmg : preview.fromStats.elementDmg}
            {!preview.atMax && (
              <>
                <span className="text-white/30 mx-1">›</span>
                {preview.toStats.elementDmg}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Detailed stat rows ─────────────────────────────────────────── */}
      <div className="mb-3">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Sparkles className="w-3 h-3 text-white/45" />
          <span className="text-[10px] tracking-[0.35em] uppercase text-white/55">Base Stats</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <StatRow
            label="Attack"
            fromValue={preview.fromStats.atk}
            toValue={!preview.atMax ? preview.toStats.atk : null}
            accent={accent}
            highlight
          />
          <StatRow
            label="Crit Rate"
            fromValue={preview.fromStats.critRatePct}
            toValue={!preview.atMax ? preview.toStats.critRatePct : null}
            suffix="%"
            accent={accent}
          />
          <StatRow
            label="Crit Damage"
            fromValue={preview.fromStats.critDmgPct}
            toValue={!preview.atMax ? preview.toStats.critDmgPct : null}
            suffix="%"
            accent={accent}
          />
          <StatRow
            label="Durability"
            fromValue={preview.fromStats.durability}
            toValue={!preview.atMax ? preview.toStats.durability : null}
            accent={accent}
          />
        </div>

        {/* Milestone callout */}
        {!preview.atMax && preview.crossesMilestone && (
          <div
            className="mt-2 px-3 py-2 text-[10px] tracking-[0.15em] uppercase flex items-center gap-2"
            style={{
              background: `${accent}10`,
              border: `1px solid ${accent}55`,
              color: accent,
            }}
          >
            <Zap className="w-3 h-3" />
            Milestone Tier Up · Weapon Aura Evolves
          </div>
        )}

        {!preview.atMax && preview.toLevel === MAX_NORMAL_LEVEL + 1 && (
          <div
            className="mt-2 px-3 py-2 text-[10px] tracking-[0.15em] uppercase flex items-center gap-2"
            style={{
              background: 'rgba(244,63,94,0.12)',
              border: '1px solid rgba(244,63,94,0.5)',
              color: '#fda4af',
            }}
          >
            <ShieldAlert className="w-3 h-3" />
            Entering Over-Enchantment · Special Materials Required
          </div>
        )}
      </div>

      {/* ── Material + Gold + Enhance button ───────────────────────────── */}
      {!preview.atMax ? (
        <div className="mt-auto flex items-end justify-between gap-3">
          <div
            className="flex flex-col items-center px-3 py-2 rounded-sm"
            style={{
              background: 'rgba(20,20,24,0.85)',
              border: '1px solid rgba(180,160,130,0.30)',
              minWidth: 100,
            }}
          >
            <div
              className="w-12 h-12 rounded-sm flex items-center justify-center text-xl mb-1"
              style={{
                background: preview.isOver
                  ? 'radial-gradient(circle, rgba(168,85,247,0.55), rgba(10,8,16,0.95))'
                  : 'radial-gradient(circle, rgba(96,165,250,0.45), rgba(8,10,18,0.95))',
                border: '1px solid rgba(168,140,220,0.5)',
                boxShadow: `0 0 12px ${preview.isOver ? 'rgba(168,85,247,0.5)' : 'rgba(96,165,250,0.4)'}`,
              }}
            >
              👻
            </div>
            <div className="tabular-nums text-[11px] text-white/85">
              {stash[preview.material.key] >= 1e6
                ? `${(stash[preview.material.key] / 1e6).toFixed(2)}M`
                : stash[preview.material.key]}
              /{preview.material.count}
            </div>
            <div className="text-[9px] tracking-[0.2em] uppercase text-white/45 mt-0.5 text-center">
              {preview.material.label}
            </div>
          </div>

          <div className="flex flex-col items-stretch gap-2 flex-1">
            <div className="flex items-center justify-end gap-1.5 text-[11px]">
              <span className="text-white/55 tracking-[0.15em] uppercase text-[10px]">Cost</span>
              <span className="w-3 h-3 rounded-full bg-gradient-to-br from-amber-200 to-amber-500" />
              <span className="tabular-nums text-white/90">{preview.gold.toLocaleString()}</span>
            </div>
            <button
              onClick={onEnhance}
              disabled={!canAfford}
              className="px-6 py-2.5 text-[12px] tracking-[0.4em] uppercase font-semibold transition-all"
              style={{
                background: canAfford
                  ? (preview.isOver
                      ? 'linear-gradient(180deg, rgba(244,63,94,0.85) 0%, rgba(159,18,57,0.85) 100%)'
                      : 'linear-gradient(180deg, rgba(45,212,191,0.85) 0%, rgba(13,148,136,0.85) 100%)')
                  : 'rgba(40,40,46,0.85)',
                color: canAfford ? '#fff' : 'rgba(255,255,255,0.35)',
                border: canAfford
                  ? (preview.isOver ? '1px solid rgba(244,63,94,0.7)' : '1px solid rgba(45,212,191,0.7)')
                  : '1px solid rgba(255,255,255,0.10)',
                boxShadow: canAfford
                  ? (preview.isOver
                      ? '0 0 18px rgba(244,63,94,0.35), inset 0 1px 0 rgba(255,255,255,0.15)'
                      : '0 0 18px rgba(45,212,191,0.35), inset 0 1px 0 rgba(255,255,255,0.15)')
                  : 'inset 0 0 12px rgba(0,0,0,0.6)',
                cursor: canAfford ? 'pointer' : 'not-allowed',
              }}
            >
              {preview.isOver ? 'Refine' : 'Enhance'}
            </button>
          </div>
        </div>
      ) : (
        <div
          className="px-6 py-4 text-center"
          style={{
            background: 'rgba(245,210,122,0.06)',
            border: '1px solid rgba(245,210,122,0.45)',
          }}
        >
          <div className="text-[11px] tracking-[0.4em] uppercase text-amber-200">
            Maximum Enchantment Reached
          </div>
          <div className="text-[10px] text-white/55 mt-1">
            Combine duplicate weapons below to push the power ceiling further.
          </div>
        </div>
      )}
    </div>
  );
}