// ─── WeaponEnchantmentPanel ───────────────────────────────────────────────
// Annulus-style circular enchantment UI.
//
//   • Big ring of dots around the weapon preview — one dot per milestone
//     (every 20 levels). Filled / glowing dots = milestones reached.
//   • Right-hand stat panel shows current rarity tier, ATK before → after,
//     gold + material requirement, and an Enhance / Refine button.
//   • 0–120 = Normal Enchantment. 121–200 = Over-Enchantment (red tint,
//     "Refine" instead of "Enhance", different material requirement).
//
// Pure UI — all data flows through enchantmentStore.

import React, { useEffect, useMemo, useState } from 'react';
import { Hammer, Sparkles, ShieldAlert } from 'lucide-react';
import {
  subscribeEnchantment,
  getEnchantment,
  getNextStepPreview,
  attemptEnhance,
  MILESTONES,
  MAX_LEVEL,
  MAX_NORMAL_LEVEL,
  isOverEnchant,
  getRarityForLevel,
  getMilestoneColor,
  getMilestoneIndex,
} from './enchantmentStore';

const RING_SIZE = 360;            // outer ring diameter (px)
const RING_RADIUS = RING_SIZE / 2;
const DOT_RADIUS = 9;             // milestone dot size

function MilestoneDot({ index, total, level, currentLevel }) {
  // Place around the circle starting from top (12 o'clock), clockwise.
  const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
  const r = RING_RADIUS - 4;
  const x = RING_RADIUS + Math.cos(angle) * r;
  const y = RING_RADIUS + Math.sin(angle) * r;

  const reached = currentLevel >= level;
  const isNext = !reached && currentLevel < level && level - currentLevel <= 20 && currentLevel >= level - 20;
  const color = getMilestoneColor(level);

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: x - DOT_RADIUS,
        top: y - DOT_RADIUS,
        width: DOT_RADIUS * 2,
        height: DOT_RADIUS * 2,
      }}
    >
      <div
        className="w-full h-full rounded-full transition-all"
        style={{
          background: reached
            ? `radial-gradient(circle at 35% 30%, ${color} 0%, rgba(8,8,12,0.95) 75%)`
            : 'rgba(12,10,14,0.95)',
          border: reached
            ? `1.5px solid ${color}`
            : isNext
              ? '1.5px solid rgba(220,200,150,0.5)'
              : '1.5px solid rgba(180,160,130,0.25)',
          boxShadow: reached
            ? `0 0 10px ${color}, 0 0 18px ${color}55, inset 0 0 6px rgba(0,0,0,0.6)`
            : 'inset 0 0 4px rgba(0,0,0,0.7)',
        }}
      />
      {/* Outer halo ring when reached (the milestone marker that "broke through") */}
      {reached && (
        <div
          className="absolute -inset-2 rounded-full pointer-events-none"
          style={{
            border: `1px solid ${color}77`,
            boxShadow: `0 0 14px ${color}55`,
          }}
        />
      )}
    </div>
  );
}

export default function WeaponEnchantmentPanel({ weaponId, weaponName, weaponIcon }) {
  const [, force] = useState(0);
  useEffect(() => subscribeEnchantment(() => force((x) => x + 1)), []);

  // Owned materials would normally come from an economy store. Until that
  // wiring is requested, surface a deterministic local count so the UI feels
  // alive (e.g. 7.213M / 4000). These are placeholders only.
  const [stash] = useState({ iron_ore: 7213000, refined_stone: 181, gold: 522700 });

  const entry = getEnchantment(weaponId);
  const preview = useMemo(() => getNextStepPreview(weaponId), [weaponId, entry.level]);

  const rarity = getRarityForLevel(entry.level);
  const overEnchant = isOverEnchant(entry.level);
  const accent = getMilestoneColor(entry.level || 1);

  // Progress arc from start to current level
  const pctOfMax = Math.min(1, entry.level / MAX_LEVEL);
  const arcLength = 2 * Math.PI * (RING_RADIUS - 4);
  const filled = arcLength * pctOfMax;

  const canAfford = preview.atMax
    ? false
    : (stash[preview.material.key] >= preview.material.count) && (stash.gold >= preview.gold);

  const onEnhance = () => {
    if (preview.atMax) return;
    // NOTE: We do not actually deduct from `stash` here because materials live
    // in the user's larger economy. Wiring that in is a follow-up step. The
    // enchantment level itself persists immediately.
    attemptEnhance(weaponId);
  };

  return (
    <div className="relative w-full flex items-stretch gap-10 px-6 py-6">
      {/* ── LEFT: weapon ring with milestone dots ─────────────────────────── */}
      <div className="relative flex-shrink-0" style={{ width: RING_SIZE, height: RING_SIZE }}>
        {/* Backdrop ring */}
        <svg
          width={RING_SIZE}
          height={RING_SIZE}
          className="absolute inset-0"
          style={{ overflow: 'visible' }}
        >
          {/* Base circle */}
          <circle
            cx={RING_RADIUS}
            cy={RING_RADIUS}
            r={RING_RADIUS - 4}
            fill="none"
            stroke="rgba(180,160,130,0.25)"
            strokeWidth={1}
          />
          {/* Progress arc */}
          {entry.level > 0 && (
            <circle
              cx={RING_RADIUS}
              cy={RING_RADIUS}
              r={RING_RADIUS - 4}
              fill="none"
              stroke={accent}
              strokeWidth={2}
              strokeLinecap="round"
              strokeDasharray={`${filled} ${arcLength}`}
              transform={`rotate(-90 ${RING_RADIUS} ${RING_RADIUS})`}
              style={{ filter: `drop-shadow(0 0 6px ${accent}99)` }}
            />
          )}
        </svg>

        {/* Weapon image / glyph centered in the ring */}
        <div
          className="absolute rounded-full flex items-center justify-center"
          style={{
            left: 36,
            top: 36,
            width: RING_SIZE - 72,
            height: RING_SIZE - 72,
            background:
              'radial-gradient(circle at 50% 35%, rgba(50,40,32,0.85) 0%, rgba(10,8,10,0.95) 75%)',
            boxShadow: entry.level > 0
              ? `inset 0 0 60px ${accent}33, 0 0 30px ${accent}22`
              : 'inset 0 0 60px rgba(0,0,0,0.7)',
          }}
        >
          <div
            className="text-8xl select-none"
            style={{
              filter: entry.level > 0
                ? `drop-shadow(0 0 12px ${accent}aa) drop-shadow(0 4px 12px rgba(0,0,0,0.8))`
                : 'drop-shadow(0 4px 12px rgba(0,0,0,0.8))',
            }}
          >
            {weaponIcon || '⚔️'}
          </div>
        </div>

        {/* Milestone dots */}
        {MILESTONES.map((lvl, i) => (
          <MilestoneDot
            key={lvl}
            index={i}
            total={MILESTONES.length}
            level={lvl}
            currentLevel={entry.level}
          />
        ))}

        {/* Bottom emblem — current rarity tier */}
        <div
          className="absolute left-1/2 -translate-x-1/2 px-3 py-1 rounded-sm flex items-center gap-1.5"
          style={{
            bottom: -10,
            background: 'rgba(8,6,6,0.95)',
            border: `1px solid ${rarity.color}55`,
            boxShadow: `0 0 14px ${rarity.color}33`,
          }}
        >
          <div
            className="w-2 h-2 rotate-45"
            style={{ background: rarity.color, boxShadow: `0 0 6px ${rarity.color}` }}
          />
          <span
            className="text-[10px] tracking-[0.4em] uppercase font-semibold"
            style={{ color: rarity.color }}
          >
            {rarity.name}
          </span>
        </div>
      </div>

      {/* ── RIGHT: stat panel + enhance button ────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Header — weapon name + tier */}
        <div
          className="px-4 py-3 mb-4 rounded-sm"
          style={{
            background:
              'linear-gradient(90deg, rgba(20,30,42,0.85) 0%, rgba(10,14,22,0.85) 100%)',
            border: '1px solid rgba(180,160,130,0.25)',
            boxShadow: 'inset 0 0 18px rgba(0,0,0,0.6)',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 flex items-center justify-center rounded-sm"
              style={{
                background: `${accent}1a`,
                border: `1px solid ${accent}55`,
              }}
            >
              <Hammer className="w-4 h-4" style={{ color: accent }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs tracking-[0.3em] uppercase" style={{ color: rarity.color }}>
                {rarity.name}
                {overEnchant && <span className="ml-2 text-rose-300">· Over-Enchant</span>}
              </div>
              <div className="text-xl font-semibold tracking-[0.05em] text-white truncate">
                {weaponName || 'Weapon'}
              </div>
            </div>
          </div>

          {/* Enhance bar — current level → next level */}
          <div className="mt-3 flex items-center gap-2 text-sm">
            <span className="text-white/55 tracking-[0.15em] uppercase text-[10px]">
              Enhance
            </span>
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

        {/* Base stats preview */}
        <div className="mb-5">
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3 h-3 text-white/45" />
            <span className="text-[10px] tracking-[0.35em] uppercase text-white/55">
              Base Stats
            </span>
          </div>
          <div className="flex items-center gap-3 pl-5 text-sm">
            <span className="text-white/55 tracking-[0.15em] uppercase text-[10px]">
              ATK
            </span>
            <span className="tabular-nums text-white/85">
              {preview.atMax ? entry.level : preview.fromAtk}
            </span>
            {!preview.atMax && (
              <>
                <span className="text-white/30">›</span>
                <span className="tabular-nums font-semibold" style={{ color: accent }}>
                  {preview.toAtk}
                </span>
                <span className="text-emerald-300/85 text-[10px] tabular-nums ml-1">
                  +{preview.toAtk - preview.fromAtk}
                </span>
              </>
            )}
          </div>

          {/* Crossing a milestone — call it out */}
          {!preview.atMax && preview.crossesMilestone && (
            <div
              className="mt-3 px-3 py-2 text-[10px] tracking-[0.15em] uppercase flex items-center gap-2"
              style={{
                background: `${accent}10`,
                border: `1px solid ${accent}55`,
                color: accent,
              }}
            >
              <ShieldAlert className="w-3 h-3" />
              Milestone Tier Up · Weapon Aura Evolves
            </div>
          )}

          {/* Crossing into over-enchant */}
          {!preview.atMax && preview.toLevel === MAX_NORMAL_LEVEL + 1 && (
            <div
              className="mt-3 px-3 py-2 text-[10px] tracking-[0.15em] uppercase flex items-center gap-2"
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

        {/* Material + Cost + Button row */}
        {!preview.atMax ? (
          <div className="mt-auto flex items-end justify-between gap-4">
            {/* Material requirement card */}
            <div
              className="flex flex-col items-center px-4 py-2 rounded-sm"
              style={{
                background: 'rgba(20,20,24,0.85)',
                border: '1px solid rgba(180,160,130,0.30)',
                minWidth: 110,
              }}
            >
              <div
                className="w-14 h-14 rounded-sm flex items-center justify-center text-2xl mb-1"
                style={{
                  background: preview.isOver
                    ? 'radial-gradient(circle, rgba(150,40,40,0.45), rgba(10,8,8,0.95))'
                    : 'radial-gradient(circle, rgba(80,70,60,0.45), rgba(10,8,8,0.95))',
                  border: '1px solid rgba(180,160,130,0.4)',
                }}
              >
                {preview.isOver ? '💎' : '🪨'}
              </div>
              <div className="tabular-nums text-[11px] text-white/85">
                {(stash[preview.material.key] >= 1e6
                  ? `${(stash[preview.material.key] / 1e6).toFixed(3)}M`
                  : stash[preview.material.key])}/{preview.material.count}
              </div>
              <div className="text-[9px] tracking-[0.2em] uppercase text-white/45 mt-0.5">
                {preview.material.label}
              </div>
            </div>

            {/* Cost + Enhance button */}
            <div className="flex flex-col items-stretch gap-2">
              <div className="flex items-center justify-end gap-1.5 text-[11px]">
                <span className="text-white/55 tracking-[0.15em] uppercase text-[10px]">
                  Cost
                </span>
                <span className="w-3 h-3 rounded-full bg-gradient-to-br from-amber-200 to-amber-500" />
                <span className="tabular-nums text-white/90">{preview.gold.toLocaleString()}</span>
              </div>

              <button
                onClick={onEnhance}
                disabled={!canAfford}
                className="px-8 py-2.5 text-[12px] tracking-[0.4em] uppercase font-semibold transition-all"
                style={{
                  background: canAfford
                    ? (preview.isOver
                        ? 'linear-gradient(180deg, rgba(244,63,94,0.85) 0%, rgba(159,18,57,0.85) 100%)'
                        : 'linear-gradient(180deg, rgba(45,212,191,0.85) 0%, rgba(13,148,136,0.85) 100%)')
                    : 'rgba(40,40,46,0.85)',
                  color: canAfford ? '#fff' : 'rgba(255,255,255,0.35)',
                  border: canAfford
                    ? (preview.isOver
                        ? '1px solid rgba(244,63,94,0.7)'
                        : '1px solid rgba(45,212,191,0.7)')
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
            className="mt-auto px-6 py-4 text-center"
            style={{
              background: 'rgba(245,210,122,0.06)',
              border: '1px solid rgba(245,210,122,0.45)',
            }}
          >
            <div className="text-[11px] tracking-[0.4em] uppercase text-amber-200">
              Maximum Enchantment Reached
            </div>
            <div className="text-[10px] text-white/55 mt-1">
              All milestones unlocked · Aura at Divine tier
            </div>
          </div>
        )}
      </div>
    </div>
  );
}