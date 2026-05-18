// ─── WeaponEnchantmentPanel ───────────────────────────────────────────────
// Annulus-style circular enchantment UI.
//
//   • LEFT  : weapon preview in a circular ring of milestone dots (0..200).
//   • RIGHT : detailed stat panel (WeaponStatPanel) + Combine Stage merge UI
//             (WeaponCombineStagePanel).
//
// Pure UI — all data flows through enchantmentStore.

import React, { useEffect, useMemo, useState } from 'react';
import {
  subscribeEnchantment,
  getEnchantment,
  getNextStepPreview,
  attemptEnhance,
  MILESTONES,
  MAX_LEVEL,
  MAX_NORMAL_LEVEL,
  getRarityForLevel,
  getMilestoneColor,
} from './enchantmentStore';
import WeaponStatPanel from './WeaponStatPanel';
import WeaponCombineStagePanel from './WeaponCombineStagePanel';

const RING_SIZE = 340;
const RING_RADIUS = RING_SIZE / 2;
const DOT_RADIUS = 9;

function MilestoneDot({ index, total, level, currentLevel }) {
  // Place around the circle starting from top (12 o'clock), clockwise.
  const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
  const r = RING_RADIUS - 4;
  const x = RING_RADIUS + Math.cos(angle) * r;
  const y = RING_RADIUS + Math.sin(angle) * r;

  const reached = currentLevel >= level;
  const isNext = !reached && level - currentLevel <= 20 && currentLevel >= level - 20;
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

  // Placeholder economy. Real wiring lives in a separate inventory store —
  // until then, surface deterministic numbers so the UI feels alive.
  const [stash] = useState({
    iron_ore: 7213000,
    refined_stone: 181,
    astral_core: 3,
    gold: 522700,
    duplicates: { bow: 2, sword: 2, dual_blades: 1 },
  });

  const entry = getEnchantment(weaponId);
  const preview = useMemo(
    () => getNextStepPreview(weaponId),
    [weaponId, entry.level, entry.combineStage]
  );

  const rarity = getRarityForLevel(entry.level);
  const accent = getMilestoneColor(entry.level || 1);

  // Progress arc from start to current level
  const pctOfMax = Math.min(1, entry.level / MAX_LEVEL);
  const arcLength = 2 * Math.PI * (RING_RADIUS - 4);
  const filled = arcLength * pctOfMax;

  const onEnhance = () => {
    if (preview.atMax) return;
    attemptEnhance(weaponId);
  };

  return (
    <div className="relative w-full flex items-stretch gap-6 px-4 py-4">
      {/* ── LEFT: weapon ring with milestone dots ─────────────────────────── */}
      <div className="relative flex-shrink-0" style={{ width: RING_SIZE, height: RING_SIZE }}>
        <svg
          width={RING_SIZE}
          height={RING_SIZE}
          className="absolute inset-0"
          style={{ overflow: 'visible' }}
        >
          <circle
            cx={RING_RADIUS}
            cy={RING_RADIUS}
            r={RING_RADIUS - 4}
            fill="none"
            stroke="rgba(180,160,130,0.25)"
            strokeWidth={1}
          />
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

      {/* ── VERTICAL DIVIDER ─────────────────────────────────────────────── */}
      <div
        className="w-px flex-shrink-0 self-stretch"
        style={{
          background:
            'linear-gradient(180deg, transparent 0%, rgba(180,160,130,0.45) 15%, rgba(180,160,130,0.45) 85%, transparent 100%)',
        }}
      />

      {/* ── RIGHT: detailed stat panel + combine stage ───────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col">
        <WeaponStatPanel
          weaponId={weaponId}
          weaponName={weaponName}
          entry={entry}
          preview={preview}
          rarity={rarity}
          accent={accent}
          stash={stash}
          onEnhance={onEnhance}
          MAX_LEVEL={MAX_LEVEL}
          MAX_NORMAL_LEVEL={MAX_NORMAL_LEVEL}
        />

        <WeaponCombineStagePanel
          weaponId={weaponId}
          weaponName={weaponName}
          entry={entry}
          accent={accent}
          stash={stash}
        />
      </div>
    </div>
  );
}