// ─── Aura Progression Data ─────────────────────────────────────────────────
// Aura is a body-outlining spiritual energy system that uses the SAME
// enhancement model and per-level multiplier as the Halo system:
//   • same attempt cost (10 kills)
//   • same success-chance bands
//   • same per-level virtual-attribute-point bonuses (PER_LEVEL_HALO_BONUSES)
// Aura is a SEPARATE progression track from Halo — it has its own level and
// its own visual tiers (a radiant outline around the body).

import {
  MAX_HALO_LEVEL,
  HALO_ATTEMPT_COST,
  getSuccessChanceForLevel,
  getHaloBonusesForLevel,
} from './haloData';

export const MAX_AURA_LEVEL = MAX_HALO_LEVEL;        // same cap as Halo
export const AURA_ATTEMPT_COST = HALO_ATTEMPT_COST;  // same cost as Halo

// Reuse Halo's success bands — "same multiplier as the halo system".
export const getAuraSuccessChance = getSuccessChanceForLevel;

// Aura grants the SAME per-level bonuses as Halo (virtual attribute points
// that pass through the statsSystem formulas).
export function getAuraBonusesForLevel(level) {
  return getHaloBonusesForLevel(level);
}

// Aura visual tiers — describe the body outline / aura intensity.
export const AURA_TIERS = [
  { id: 'flicker', label: 'Flicker Aura',  minLevel: 1,   color: '#7dd3fc', glow: 'rgba(125,211,252,0.40)', auraDesc: 'A faint body outline that shimmers with each breath.' },
  { id: 'glow',    label: 'Glow Aura',     minLevel: 31,  color: '#34d399', glow: 'rgba(52,211,153,0.50)',  auraDesc: 'A steady radiant outline tracing the whole body.' },
  { id: 'blaze',   label: 'Blaze Aura',    minLevel: 61,  color: '#fbbf24', glow: 'rgba(251,191,36,0.55)',  auraDesc: 'An outward burning aura with rising embers.' },
  { id: 'tempest', label: 'Tempest Aura',  minLevel: 101, color: '#a855f7', glow: 'rgba(168,85,247,0.60)',  auraDesc: 'Swirling energy aura that crackles around the body.' },
  { id: 'radiant', label: 'Radiant Aura',  minLevel: 141, color: '#38bdf8', glow: 'rgba(56,189,248,0.65)',  auraDesc: 'Blazing body aura radiating light rays outward.' },
  { id: 'divine',  label: 'Divine Aura',   minLevel: 171, color: '#f472b6', glow: 'rgba(244,114,182,0.75)', auraDesc: 'Reality-bending aura radiating from every limb.' },
];

export function getAuraTierForLevel(level) {
  const lvl = Math.max(0, Math.min(MAX_AURA_LEVEL, level));
  let tier = AURA_TIERS[0];
  for (const t of AURA_TIERS) if (lvl >= t.minLevel) tier = t;
  return tier;
}