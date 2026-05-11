// ─────────────────────────────────────────────
// Stat System — single source of truth for player/enemy combat math.
//
// 5 core stats. Each invested point converts to a derived combat value:
//   strength   → +3 physical damage
//   hp (vital) → +20 max HP
//   spirit     → +20 chi (mana/resource pool)
//   dexterity  → +2 defense (flat damage reduction)
//   elemental  → +1 elemental damage
//
// Equipment acts as a MULTIPLIER on the stats you've invested.
// e.g. a sword with { strength_mult: 0.5 } means its bonus damage =
//   floor(player.strength * 0.5 * 3)  — half your invested strength,
//   re-converted through the strength→damage rate.
// This way equipment scales WITH your character, not in isolation.
// ─────────────────────────────────────────────

export const STAT_RATES = {
  strength:  3,   // dmg per point
  hp:        20,  // HP per point
  spirit:    20,  // chi per point
  dexterity: 2,   // defense per point
  elemental: 1,   // elemental dmg per point
};

// Default player starting stats (level 1)
export const DEFAULT_PLAYER_STATS = {
  strength:  3,
  hp:        5,
  spirit:    2,
  dexterity: 2,
  elemental: 0,
};

// Compute final combat-ready stats from base stats + equipment multipliers.
// equipment = array of { strength_mult, hp_mult, spirit_mult, dexterity_mult, elemental_mult }
export function computeDerivedStats(baseStats, equipment = []) {
  const totals = {
    strength_mult:  0,
    hp_mult:        0,
    spirit_mult:    0,
    dexterity_mult: 0,
    elemental_mult: 0,
  };
  equipment.forEach((eq) => {
    if (!eq) return;
    totals.strength_mult  += eq.strength_mult  || 0;
    totals.hp_mult        += eq.hp_mult        || 0;
    totals.spirit_mult    += eq.spirit_mult    || 0;
    totals.dexterity_mult += eq.dexterity_mult || 0;
    totals.elemental_mult += eq.elemental_mult || 0;
  });

  // Equipment bonus = invested points × multiplier, re-converted through rate.
  const physDmg =
    baseStats.strength  * STAT_RATES.strength +
    Math.floor(baseStats.strength * totals.strength_mult) * STAT_RATES.strength;

  const maxHP =
    baseStats.hp * STAT_RATES.hp +
    Math.floor(baseStats.hp * totals.hp_mult) * STAT_RATES.hp;

  const chi =
    baseStats.spirit * STAT_RATES.spirit +
    Math.floor(baseStats.spirit * totals.spirit_mult) * STAT_RATES.spirit;

  const defense =
    baseStats.dexterity * STAT_RATES.dexterity +
    Math.floor(baseStats.dexterity * totals.dexterity_mult) * STAT_RATES.dexterity;

  const elemDmg =
    baseStats.elemental * STAT_RATES.elemental +
    Math.floor(baseStats.elemental * totals.elemental_mult) * STAT_RATES.elemental;

  return {
    physicalDamage: physDmg,
    elementalDamage: elemDmg,
    totalDamage: physDmg + elemDmg,
    maxHP,
    chi,
    defense,
  };
}

// Damage calc — dealt damage is reduced by defender's defense (min 1).
export function calculateHit(attackerStats, defenderStats) {
  const raw = attackerStats.totalDamage;
  const reduced = Math.max(1, raw - (defenderStats?.defense || 0));
  return reduced;
}

// Enemy stat templates by tier — scales with the same system.
// Normal mob ~ a level-1 player. Champions are like investing 5-6 points.
export const ENEMY_STAT_TEMPLATES = {
  normal:   { strength: 2, hp: 2,  spirit: 1, dexterity: 1, elemental: 0 },
  elite:    { strength: 4, hp: 4,  spirit: 2, dexterity: 2, elemental: 1 },
  champion: { strength: 6, hp: 7,  spirit: 3, dexterity: 3, elemental: 2 },
};