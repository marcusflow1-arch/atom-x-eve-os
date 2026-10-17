// ─── Advanced Class Passives ─────────────────────────────────────────────────
// Resolves final stat values after applying advanced class passive bonuses
// on top of base weapon mastery stats.

import { getActivePassiveBonuses } from './advancedClassStore';

// (removed) applyClassPassives: an unused second resolver with its own caps (crit 95%, dodge and
// block 90%, and a negative defense counted twice). Class passives reach combat through
// AXEAdvancedClassRuntime and AXEBuildEffects, capped in AXE_BUILD_CAPS (docs/game3d/BUILD_BALANCE.md).

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