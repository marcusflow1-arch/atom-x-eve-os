// ─── Wings Progression Data ────────────────────────────────────────────────
// Angel Wings are a spiritual-wing system that combines TWO bonus layers:
//
//   1. HALO-STYLE MULTIPLIER (same as Halo): each Wing level grants the same
//      per-level virtual-attribute-point bonuses as Halo (PER_LEVEL_HALO_BONUSES).
//      This is the "multiplier" the player gets for leveling wings.
//
//   2. PATH SPECIALIZATION (flat final stats): each Wing TYPE (path) adds
//      specialized flat combat stats on top of the multiplier — e.g. Wings
//      of Endurance specialize in HP/defense, Wings of Strength in damage.
//
// Wings are like the Title system in that there are MULTIPLE wing types you
// can level SEPARATELY (each has its own level), and you EQUIP one at a time.
// They are like the Halo system in that leveling is an attempt/RNG spend of
// kills with the same success bands and the same per-level multiplier.

import {
  MAX_HALO_LEVEL,
  HALO_ATTEMPT_COST,
  getSuccessChanceForLevel,
} from './haloData';

export const MAX_WING_LEVEL = MAX_HALO_LEVEL;        // same cap as Halo
export const WING_ATTEMPT_COST = HALO_ATTEMPT_COST;  // same cost as Halo

// Reuse Halo's success bands — wings share the Halo enhancement curve.
export const getWingSuccessChance = getSuccessChanceForLevel;

// The wing level's virtual attribute points: +0.1 to each attribute per level (20 at 200).
// It used to be the Halo's whole bonus again (docs/game3d/STAT_SYSTEM_AUDIT.md).
export function getWingMultiplierForLevel(level) {
  const a = 0.1 * Math.max(0, Math.min(MAX_WING_LEVEL, Number(level) || 0));
  return { strength: a, constitution: a, vitality: a, dexterity: a, focus: a, spirit: a };
}

// ── Wing Path Definitions ─────────────────────────────────────────────────
// Each path defines a flat-final-stat specialization envelope from Lv1 → Lv200.
// These stack ON TOP of the halo-style multiplier for that path's level.
// Flat final stats do NOT pass through attribute formulas (same rule as Titles).
//
//   hp              — flat max HP
//   damage          — flat damage added to totalDamage
//   defense         — flat defense
//   critChance      — additive % crit chance (0..100 scale)
//   critDamage      — additive crit damage multiplier (0..1 scale)
//   criticalDefense — additive crit damage reduction (0..1 scale)
export const WING_PATHS = [
  {
    id: 'endurance',
    name: 'Wings of Endurance',
    icon: '🛡️',
    color: '#22c55e',
    primaryStat: 'hp',
    description: 'Spiritual wings that fortify the body. Massive HP and defense specialization atop the halo multiplier.',
    lv1:   { hp: 9,    damage: 0,   defense: 1.3, critChance: 0,    critDamage: 0,     criticalDefense: 0.001 },
    lv200: { hp: 1100, damage: 40,  defense: 180, critChance: 0,    critDamage: 0.05,  criticalDefense: 0.15 },
  },
  {
    id: 'strength',
    name: 'Wings of Strength',
    icon: '⚔️',
    color: '#ef4444',
    primaryStat: 'damage',
    description: 'Spiritual wings that channel raw power. Huge flat damage specialization atop the halo multiplier.',
    lv1:   { hp: 4,    damage: 1.3, defense: 0.5, critChance: 0.01, critDamage: 0.001, criticalDefense: 0.001 },
    lv200: { hp: 700,  damage: 140, defense: 90,  critChance: 2,    critDamage: 0.10,  criticalDefense: 0.05 },
  },
  {
    id: 'precision',
    name: 'Wings of Precision',
    icon: '🏹',
    color: '#38bdf8',
    primaryStat: 'critChance',
    description: 'Spiritual wings of lethal focus. Critical chance and damage specialization atop the halo multiplier.',
    lv1:   { hp: 3,    damage: 0.9, defense: 0.5, critChance: 0.04, critDamage: 0.001, criticalDefense: 0.001 },
    lv200: { hp: 600,  damage: 120, defense: 100, critChance: 8,    critDamage: 0.15,  criticalDefense: 0.05 },
  },
  {
    id: 'spirit',
    name: 'Wings of Spirit',
    icon: '✨',
    color: '#a855f7',
    primaryStat: 'critDamage',
    description: 'Spiritual wings of arcane devastation. Critical damage and resistance specialization atop the halo multiplier.',
    lv1:   { hp: 3,    damage: 0.8, defense: 0.6, critChance: 0.02, critDamage: 0.002, criticalDefense: 0.001 },
    lv200: { hp: 650,  damage: 110, defense: 110, critChance: 3,    critDamage: 0.30,  criticalDefense: 0.10 },
  },
];

export function getWingPathById(id) {
  return WING_PATHS.find((p) => p.id === id) || null;
}

function lerpLevel(min, max, level) {
  const lvl = Math.max(1, Math.min(MAX_WING_LEVEL, level));
  const t = (lvl - 1) / (MAX_WING_LEVEL - 1);
  return min + (max - min) * t;
}

// Compute the FLAT FINAL specialization bonuses for a wing path at a level.
// Returns zeros at level 0 (un-leveled wing).
export function getWingFlatBonusesForLevel(pathId, level) {
  const path = getWingPathById(pathId);
  const zero = { hp: 0, damage: 0, defense: 0, critChance: 0, critDamage: 0, criticalDefense: 0 };
  if (!path || level <= 0) return zero;
  const keys = ['hp', 'damage', 'defense', 'critChance', 'critDamage', 'criticalDefense'];
  const out = {};
  keys.forEach((k) => {
    const v = lerpLevel(path.lv1[k] || 0, path.lv200[k] || 0, level);
    out[k] = (k === 'hp' || k === 'damage' || k === 'defense') ? Math.round(v) : v;
  });
  return out;
}