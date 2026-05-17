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

// Per-level Halo bonuses. Each Halo level grants:
//   +1 strength, +1 constitution, +1 dexterity, +1 intelligence, +1 focus
//   +0.2% additive critical chance
//   +0.3% critical defense (reduces incoming crit bonus damage)
//   +0.1% critical damage (added to crit multiplier)
//
// IMPORTANT: Halo NEVER bypasses the attribute system. Each +1 stat is a
// VIRTUAL ATTRIBUTE POINT — fed into computeDerivedStats() the same way
// allocated points are — so e.g. +1 STR yields +3 physical damage via
// STAT_RATES.strength, +0.5% hit chance, +0.3% damage variance, etc.
//
// At MAX_HALO_LEVEL (200) the totals are:
//   200 STR / CON / DEX / INT / FOC, +40% crit, +60% crit defense, +20 crit dmg.
export const PER_LEVEL_HALO_BONUSES = {
  strength:         1,
  constitution:     1,
  dexterity:        1,
  intelligence:     1,
  focus:            1,
  criticalChance:   0.2,   // +0.2% per Halo level (additive crit chance)
  criticalDefense:  0.003, // +0.3% per Halo level (stored as 0..1 multiplier)
  criticalDamage:   0.001, // +0.1% per Halo level (stored as 0..1 multiplier added to crit)
};

// Legacy export — kept for any UI that imports MAX_HALO_BONUSES. Reflects the
// totals at MAX_HALO_LEVEL given the per-level values above.
export const MAX_HALO_BONUSES = {
  strength:        PER_LEVEL_HALO_BONUSES.strength        * MAX_HALO_LEVEL,
  constitution:    PER_LEVEL_HALO_BONUSES.constitution    * MAX_HALO_LEVEL,
  dexterity:       PER_LEVEL_HALO_BONUSES.dexterity       * MAX_HALO_LEVEL,
  intelligence:    PER_LEVEL_HALO_BONUSES.intelligence    * MAX_HALO_LEVEL,
  focus:           PER_LEVEL_HALO_BONUSES.focus           * MAX_HALO_LEVEL,
  // Legacy aliases — some older UI reads these names.
  vitality:        PER_LEVEL_HALO_BONUSES.constitution    * MAX_HALO_LEVEL,
  spirit:          PER_LEVEL_HALO_BONUSES.focus           * MAX_HALO_LEVEL,
  criticalChance:  PER_LEVEL_HALO_BONUSES.criticalChance  * MAX_HALO_LEVEL,
  criticalDefense: PER_LEVEL_HALO_BONUSES.criticalDefense * MAX_HALO_LEVEL,
  criticalDamage:  PER_LEVEL_HALO_BONUSES.criticalDamage  * MAX_HALO_LEVEL,
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

// Per-level multiplication — every Halo level grants the PER_LEVEL bonuses.
// Returns ALL five attribute keys (strength / constitution / dexterity /
// intelligence / focus) plus crit chance & crit defense. statsSystem's
// computeDerivedStats consumes these as flat stat-point additions and runs
// them through STAT_RATES, so they feed into both offense and defense the
// same way Attribute points do.
export function getHaloBonusesForLevel(level) {
  const lvl = Math.max(0, Math.min(MAX_HALO_LEVEL, level));
  return {
    strength:        PER_LEVEL_HALO_BONUSES.strength        * lvl,
    constitution:    PER_LEVEL_HALO_BONUSES.constitution    * lvl,
    dexterity:       PER_LEVEL_HALO_BONUSES.dexterity       * lvl,
    intelligence:    PER_LEVEL_HALO_BONUSES.intelligence    * lvl,
    focus:           PER_LEVEL_HALO_BONUSES.focus           * lvl,
    // Legacy aliases — some older UI reads these. statsSystem also accepts them.
    vitality:        PER_LEVEL_HALO_BONUSES.constitution    * lvl,
    spirit:          PER_LEVEL_HALO_BONUSES.focus           * lvl,
    criticalChance:  PER_LEVEL_HALO_BONUSES.criticalChance  * lvl,
    criticalDefense: PER_LEVEL_HALO_BONUSES.criticalDefense * lvl,
    criticalDamage:  PER_LEVEL_HALO_BONUSES.criticalDamage  * lvl,
  };
}