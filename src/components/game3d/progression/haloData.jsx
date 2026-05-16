// ─── Halo Progression Data ─────────────────────────────────────────────────
// Halo is a permanent, account-wide PvP enhancement system. Players earn
// Halo XP from killing other players in PvP. XP converts to Halo Levels.
// Halo Levels grant permanent stat bonuses and visual tier evolution.
//
//   Bronze    → Silver  → Gold   → Mythic   → Divine   → Celestial
//   Lvl 1-30  31-60     61-100   101-140    141-170    171-200
//
// Enhancement is an ATTEMPT/RNG system (like elixir enhancement):
//   - Each attempt costs 10 PvP kills.
//   - On success, Halo Level +1.
//   - On failure, kills are consumed but level stays.
//   - Success chance DROPS as you climb the level tiers.
//
// At MAX level (100) the player gains the full bonus block defined in
// MAX_HALO_BONUSES. All lower levels scale linearly toward that cap.

// Tier definitions — purely cosmetic / display data. The actual stat math
// uses the player's halo LEVEL (0..MAX_HALO_LEVEL), not the tier.
export const HALO_TIERS = [
  { id: 'bronze',    label: 'Bronze Halo',    minLevel: 1,   color: '#cd7f32', glow: 'rgba(205, 127, 50, 0.45)', auraDesc: 'Soft white glow with a bronze undertone.' },
  { id: 'silver',    label: 'Silver Halo',    minLevel: 31,  color: '#c0c0c0', glow: 'rgba(192, 192, 192, 0.50)', auraDesc: 'Polished silver shimmer with cool highlights.' },
  { id: 'gold',      label: 'Gold Halo',      minLevel: 61,  color: '#f5b400', glow: 'rgba(245, 180, 0, 0.55)',   auraDesc: 'Radiant gold aura with warm light rays.' },
  { id: 'mythic',    label: 'Mythic Halo',    minLevel: 101, color: '#a855f7', glow: 'rgba(168, 85, 247, 0.60)',  auraDesc: 'Pulsing violet energy with arcane particles.' },
  { id: 'divine',    label: 'Divine Halo',    minLevel: 141, color: '#38bdf8', glow: 'rgba(56, 189, 248, 0.65)',  auraDesc: 'Animated cosmic rings with celestial motes.' },
  { id: 'celestial', label: 'Celestial Halo', minLevel: 171, color: '#f472b6', glow: 'rgba(244, 114, 182, 0.75)', auraDesc: 'Multi-layer energy halo with reality-bending shimmer.' },
];

export const MAX_HALO_LEVEL = 200;

// ── Enhancement Attempt Rules ──────────────────────────────────────────────
// Cost (PvP kills) per enhancement attempt, regardless of success or failure.
export const HALO_ATTEMPT_COST = 10;

// Success chance bands keyed by CURRENT level (the level you're trying to leave).
// e.g. at level 5 you're attempting 5→6 with a 50% chance.
// Bands are evaluated top-to-bottom; first match wins.
export const HALO_SUCCESS_BANDS = [
  { from: 1,   to: 10,  chance: 0.50 },
  { from: 11,  to: 35,  chance: 0.35 },
  { from: 36,  to: 70,  chance: 0.20 },
  { from: 71,  to: 120, chance: 0.15 },
  { from: 121, to: 170, chance: 0.08 },
  { from: 171, to: 190, chance: 0.05 },
  { from: 191, to: 199, chance: 0.03 },
];

// Resolve the success chance for the player's current level (the level they
// are attempting to advance FROM). Returns 0 if at max level.
export function getSuccessChanceForLevel(currentLevel) {
  if (currentLevel >= MAX_HALO_LEVEL) return 0;
  // Level 0 attempts behave like level 1 (first band).
  const lvl = Math.max(1, currentLevel);
  for (const band of HALO_SUCCESS_BANDS) {
    if (lvl >= band.from && lvl <= band.to) return band.chance;
  }
  // Fallback to the last (hardest) band if a gap appears.
  return HALO_SUCCESS_BANDS[HALO_SUCCESS_BANDS.length - 1].chance;
}

// Bonuses granted at MAX level. All lower levels scale linearly toward these.
// Critical Defense reduces incoming enemy critical damage by this %.
// Critical Chance is an ADDITIVE flat % on top of the base crit chance.
// Stat points (str/dex/vit/spr) stack INTO the base stats pipeline.
export const MAX_HALO_BONUSES = {
  strength:         200,
  dexterity:        200,
  vitality:         200, // maps to `hp` in the existing stat system
  spirit:           200,
  criticalDefense:  2.0,  // 200% (i.e. completely negates enemy crit damage)
  criticalChance:   15,   // +15% additive crit chance
};

// Kills required to perform an enhancement attempt. Constant regardless of level.
// (Difficulty scales via the success-chance bands, not the cost.)
export function killsRequiredForAttempt() {
  return HALO_ATTEMPT_COST;
}

// Resolve which tier a given level falls into.
export function getTierForLevel(level) {
  const lvl = Math.max(0, Math.min(MAX_HALO_LEVEL, level));
  let tier = HALO_TIERS[0];
  for (const t of HALO_TIERS) {
    if (lvl >= t.minLevel) tier = t;
  }
  return tier;
}

// Linear scale 0..1 → applied to MAX_HALO_BONUSES to get current bonuses.
// Level 0 = no bonus.  Level 100 = full bonus.
export function getHaloBonusesForLevel(level) {
  const lvl = Math.max(0, Math.min(MAX_HALO_LEVEL, level));
  const t = lvl / MAX_HALO_LEVEL;
  return {
    strength:        Math.round(MAX_HALO_BONUSES.strength        * t),
    dexterity:       Math.round(MAX_HALO_BONUSES.dexterity       * t),
    vitality:        Math.round(MAX_HALO_BONUSES.vitality        * t),
    spirit:          Math.round(MAX_HALO_BONUSES.spirit          * t),
    criticalDefense: MAX_HALO_BONUSES.criticalDefense * t,
    criticalChance:  MAX_HALO_BONUSES.criticalChance  * t,
  };
}