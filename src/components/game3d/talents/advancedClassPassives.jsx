// ─── Advanced Class Passives ─────────────────────────────────────────────────
// Resolves final stat values after applying advanced class passive bonuses
// on top of base weapon mastery stats.

import { getActivePassiveBonuses } from './advancedClassStore';

/**
 * Apply advanced class passive bonuses on top of base stats.
 * @param {string} weaponType - Active weapon type key
 * @param {object} baseStats  - Base stats from weapon mastery / equipment
 * @returns {object} - Final stats after class modifiers
 */
export const applyClassPassives = (weaponType, baseStats = {}) => {
  const bonuses = getActivePassiveBonuses(weaponType);
  if (!bonuses || Object.keys(bonuses).length === 0) return baseStats;

  const out = { ...baseStats };

  // Additive bonuses
  const additive = [
    'crit_chance', 'crit_damage', 'dodge_chance', 'block_chance',
    'attack_speed', 'projectile_speed', 'hit_chance', 'cooldown_reduction',
    'defense', 'life_steal', 'bleed_chance', 'elemental_scaling',
    'explosive_damage', 'trap_damage', 'summon_strength', 'hp_scaling',
    'shield_scaling', 'stamina_regen', 'range_bonus', 'knockback_power',
    'utility_range', 'cc_resistance', 'combo_multiplier',
    'charge_damage', 'counter_damage', 'stealth_damage_bonus',
    'weakspot_damage', 'reflect_damage', 'aoe_radius',
  ];

  additive.forEach((key) => {
    if (bonuses[key] !== undefined) {
      out[key] = (out[key] || 0) + bonuses[key];
    }
  });

  // Negative modifiers (penalties)
  const penalties = ['stamina_cost', 'stamina_use', 'defense'];
  penalties.forEach((key) => {
    if (bonuses[key] !== undefined && bonuses[key] < 0) {
      out[key] = (out[key] || 0) + bonuses[key]; // Already negative, adds as reduction
    }
  });

  // Clamp common values
  out.crit_chance  = Math.min(0.95, Math.max(0, out.crit_chance  || 0));
  out.dodge_chance = Math.min(0.90, Math.max(0, out.dodge_chance || 0));
  out.block_chance = Math.min(0.90, Math.max(0, out.block_chance || 0));

  return out;
};

/**
 * Get a human-readable summary of active passive bonuses for a weapon type.
 * Used by the UI to preview class benefits.
 */
export const getPassiveSummary = (weaponType) => {
  const bonuses = getActivePassiveBonuses(weaponType);
  if (!bonuses || Object.keys(bonuses).length === 0) return [];

  const LABELS = {
    crit_chance:          'Critical Chance',
    crit_damage:          'Critical Damage',
    dodge_chance:         'Dodge Chance',
    block_chance:         'Block Chance',
    attack_speed:         'Attack Speed',
    projectile_speed:     'Projectile Speed',
    hit_chance:           'Hit Chance',
    cooldown_reduction:   'Cooldown Reduction',
    defense:              'Defense',
    life_steal:           'Life Steal',
    bleed_chance:         'Bleed Chance',
    elemental_scaling:    'Elemental Damage',
    explosive_damage:     'Explosive Damage',
    trap_damage:          'Trap Damage',
    summon_strength:      'Summon Strength',
    hp_scaling:           'HP Bonus',
    shield_scaling:       'Shield Bonus',
    stamina_regen:        'Stamina Regen',
    range_bonus:          'Range Bonus',
    cc_resistance:        'CC Resistance',
    combo_multiplier:     'Combo Damage',
    charge_damage:        'Charge Damage',
    counter_damage:       'Counter Damage',
    stealth_damage_bonus: 'Stealth Damage',
    weakspot_damage:      'Weakspot Damage',
    reflect_damage:       'Damage Reflect',
    aoe_radius:           'AoE Radius',
    stamina_cost:         'Stamina Cost',
    stamina_use:          'Stamina Usage',
    knockback_power:      'Knockback Power',
    rage_gain:            'Rage Generation',
    utility_range:        'Utility Range',
    execute_threshold:    'Execute Threshold',
    execute_damage:       'Execute Damage',
    hp_to_damage_ratio:   'HP → Damage Ratio',
    fire_rate_penalty:    'Fire Rate',
  };

  return Object.entries(bonuses)
    .filter(([, v]) => v !== 0 && v !== undefined)
    .map(([key, value]) => ({
      key,
      label: LABELS[key] || key.replace(/_/g, ' '),
      value,
      isPositive: value > 0,
      display: `${value > 0 ? '+' : ''}${Math.round(value * 100)}%`,
    }));
};