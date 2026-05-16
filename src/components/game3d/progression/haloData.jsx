// ─── Halo Progression Data ─────────────────────────────────────────────────
// Halo is a permanent, account-wide PvP enhancement system. Players earn
// Halo XP from killing other players in PvP. XP converts to Halo Levels.
// Halo Levels grant permanent stat bonuses and visual tier evolution.
//
//   Bronze    → Silver → Gold → Mythic → Divine → Celestial
//   Lvl 1-15  16-30    31-50  51-70    71-90    91-100
//
// At MAX level (100) the player gains the full bonus block defined in
// MAX_HALO_BONUSES. All lower levels scale linearly toward that cap.

// Tier definitions — purely cosmetic / display data. The actual stat math
// uses the player's halo LEVEL (0..MAX_HALO_LEVEL), not the tier.
export const HALO_TIERS = [
  { id: 'bronze',    label: 'Bronze Halo',    minLevel: 1,  color: '#cd7f32', glow: 'rgba(205, 127, 50, 0.45)', auraDesc: 'Soft white glow with a bronze undertone.' },
  { id: 'silver',    label: 'Silver Halo',    minLevel: 16, color: '#c0c0c0', glow: 'rgba(192, 192, 192, 0.50)', auraDesc: 'Polished silver shimmer with cool highlights.' },
  { id: 'gold',      label: 'Gold Halo',      minLevel: 31, color: '#f5b400', glow: 'rgba(245, 180, 0, 0.55)',   auraDesc: 'Radiant gold aura with warm light rays.' },
  { id: 'mythic',    label: 'Mythic Halo',    minLevel: 51, color: '#a855f7', glow: 'rgba(168, 85, 247, 0.60)',  auraDesc: 'Pulsing violet energy with arcane particles.' },
  { id: 'divine',    label: 'Divine Halo',    minLevel: 71, color: '#38bdf8', glow: 'rgba(56, 189, 248, 0.65)',  auraDesc: 'Animated cosmic rings with celestial motes.' },
  { id: 'celestial', label: 'Celestial Halo', minLevel: 91, color: '#f472b6', glow: 'rgba(244, 114, 182, 0.75)', auraDesc: 'Multi-layer energy halo with reality-bending shimmer.' },
];

export const MAX_HALO_LEVEL = 100;

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

// PvP kills required to reach each level. Curve gets steeper over time.
// kills(L→L+1) = round(BASE * (1 + L * STEEPNESS))
// At lvl 1→2: 3 kills.  At lvl 99→100: ~165 kills.
const BASE_KILLS = 3;
const KILL_STEEPNESS = 0.055;

export function killsRequiredForNextLevel(currentLevel) {
  if (currentLevel >= MAX_HALO_LEVEL) return Infinity;
  return Math.round(BASE_KILLS * (1 + currentLevel * KILL_STEEPNESS));
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