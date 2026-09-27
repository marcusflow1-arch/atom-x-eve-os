/**
 * Adam XE combat rules v1. Pure: shared by previews and server combat.
 * Rates are fractions (0.003 = 0.3%). Dodge/defense are ratings, not percentages.
 */
export type StatsRow = Record<string, any>;
export const COMBAT_RULES = Object.freeze({
  version: 1, level_cap: 50, xp_per_level: 1000, points_per_level: 5,
  base_hp: 1000, hp_per_level: 100, defense_per_level: 20,
  dodge_per_level: 1, attack_speed_per_level: 0.003,
  base_attack: 100, attack_per_level: 35,
  strength_damage: 7, defense_per_point: 8, vitality_hp: 25,
  intelligence_cdr: 0.001, wisdom_damage: 0.002,
  max_defense_reduction: 0.70, max_dodge: 0.35, max_cdr: 0.40,
  max_attack_speed_bonus: 1, max_crit: 0.50, max_crit_multiplier: 2,
  max_damage_bonus: 1, max_penetration: 0.40,
});
export const ATTRIBUTE_KEYS = ['strength', 'defense', 'vitality', 'agility', 'intelligence', 'wisdom'] as const;
export const finite = (v: any, fallback = 0) => Number.isFinite(Number(v)) ? Number(v) : fallback;
export const bounded = (v: any, min: number, max: number) => Math.min(max, Math.max(min, finite(v, min)));
const whole = (v: any) => Math.floor(bounded(v, 0, 1000000));
const round = (v: number) => Math.round(v * 10000) / 10000;

export function avatarLevel(record: StatsRow = {}) {
  return Math.floor(bounded(Math.max(finite(record.global_level, 1), Math.floor(finite(record.global_xp) / COMBAT_RULES.xp_per_level) + 1), 1, COMBAT_RULES.level_cap));
}
export function allocationState(record: StatsRow = {}) {
  const migrated = record.stat_schema_version === COMBAT_RULES.version;
  const old = record.stats || {};
  // Preserve purchased legacy increments; baseline 10s were not purchased.
  const source = migrated ? record.stat_allocations || {} : {
    strength: Math.max(0, finite(old.strength, 10) - 10),
    defense: Math.max(0, finite(old.tenacity, 10) - 10),
    vitality: Math.max(0, Math.floor((finite(old.hp, 100) - 100) / 10)),
    agility: 0,
    intelligence: Math.max(0, finite(old.intelligence, 10) - 10),
    wisdom: Math.max(0, finite(old.will, 10) - 10),
  };
  const allocations = Object.fromEntries(ATTRIBUTE_KEYS.map(key => [key, whole(source[key])]));
  const spent = Object.values(allocations).reduce((a, b) => a + b, 0);
  const level = avatarLevel(record);
  const earned = (level - 1) * COMBAT_RULES.points_per_level;
  const credit = migrated ? whole(record.stat_point_credit) : Math.max(0, spent + whole(record.available_stat_points) - earned);
  return { allocations, spent, earned, credit, budget: earned + credit, available: Math.max(0, earned + credit - spent) };
}
export function deriveCombatStats(record: StatsRow = {}, equipment: StatsRow = {}) {
  const level = avatarLevel(record), gained = level - 1;
  const { allocations: a } = allocationState(record);
  const gear = (key: string) => bounded(equipment[key], 0, 100000);
  const armorBonus = Math.min(1, gear('defense_percent') / 100);
  const damageBonus = Math.min(COMBAT_RULES.max_damage_bonus, gear('damage_percent') / 100);
  const weaponScale = 1 + Math.min(1, a.strength * 0.002);
  const defense = Math.round((gained * 20 + a.defense * 8 + gear('defense')) * (1 + armorBonus));
  const maxHp = Math.round(1000 + gained * 100 + a.vitality * 25 + gear('vitality'));
  const attack = Math.round((100 + gained * 35 + a.strength * 7 + gear('attack') * weaponScale) * (1 + damageBonus));
  const dodgeRating = gained + a.agility * 3 + gear('dodge');
  const accuracy = gear('accuracy');
  const defenseK = 200 + gained * 20;
  const dodgeK = 100 + level * 3;
  const cdr = Math.min(COMBAT_RULES.max_cdr, a.intelligence * 0.001 + gear('cooldown_reduction') / 100);
  const abilityBonus = Math.min(1, a.wisdom * 0.002 + gear('ability_damage_percent') / 100);
  return {
    rules_version: COMBAT_RULES.version, level, max_hp: maxHp, attack,
    defense, defense_constant: defenseK, damage_reduction: round(Math.min(0.70, defense / (defense + defenseK))),
    dodge_rating: dodgeRating, accuracy_rating: accuracy, dodge_constant: dodgeK,
    dodge_chance: round(0.35 * dodgeRating / (dodgeRating + dodgeK)),
    attack_speed: round(1 + Math.min(1, gained * 0.003 + a.agility * 0.002 + gear('speed') * 0.001)),
    cooldown_reduction: round(cdr), ability_damage_bonus: round(abilityBonus),
    ability_level_multiplier: round(1 + gained * 0.10),
    magic: gear('magic'), damage_bonus: damageBonus, weapon_multiplier: round(weaponScale),
    crit_chance: round(Math.min(0.50, 0.05 + gear('crit_chance') / 100)),
    crit_multiplier: round(Math.min(2, 1.5 + gear('crit_damage') / 100)),
    armor_penetration: round(Math.min(0.40, gear('armor_penetration') / 100)),
    // Status duration multiplier is available to encounter effects; not a mana/chi bar.
    tenacity: round(Math.min(0.50, gear('tenacity') / 100)),
  };
}
export function abilityOutput(avatar: StatsRow, skill: StatsRow, card: StatsRow = {}) {
  const factor = bounded(card.growth_multiplier ?? 1, 1, 4);
  const stats = card.stats || {};
  // Offensive card enhancements only strengthen their own cast, never the entire inventory.
  const cardOffense = finite(stats.attack) * 0.5 + finite(stats.magic);
  const raw = (finite(skill.base_damage) * factor * avatar.ability_level_multiplier + avatar.attack * 0.5 + avatar.magic + cardOffense) * (1 + avatar.ability_damage_bonus);
  const cardHaste = bounded(stats.speed, 0, 500) * 0.0005;
  const cdr = Math.min(0.40, avatar.cooldown_reduction + cardHaste);
  return {
    base_damage: Math.max(1, Math.round(raw)),
    cooldown_ms: Math.max(400, Math.round(finite(skill.cooldown_ms, 3000) * (1 - cdr))),
    cooldown_reduction: round(cdr),
    card_multiplier: factor, avatar_level: avatar.level, rules_version: COMBAT_RULES.version,
  };
}
export function resolveCombatHit(attacker: StatsRow, defender: StatsRow, rawDamage: number, rolls: StatsRow = {}) {
  const dodgeRoll = bounded(rolls.dodge ?? 1, 0, 1);
  const critRoll = bounded(rolls.crit ?? 1, 0, 1);
  const variance = bounded(rolls.variance ?? 1, 0.95, 1.05);
  const dodgeRating = Math.max(0, finite(defender.dodge_rating) - finite(attacker.accuracy_rating));
  const dodgeChance = Math.min(0.35, 0.35 * dodgeRating / (dodgeRating + Math.max(1, finite(defender.dodge_constant, 100))));
  if (dodgeRoll < dodgeChance) return { damage: 0, crit: false, missed: true, result: 'miss', dodge_chance: dodgeChance, mitigation: 0 };
  const armor = Math.max(0, finite(defender.defense)) * (1 - bounded(attacker.armor_penetration, 0, 0.40));
  // The attacker's level sets the denominator: high-level armor cannot trivialize equal-level attackers.
  const constant = 200 + (bounded(attacker.level, 1, 50) - 1) * 20;
  const mitigation = Math.min(0.70, armor / (armor + constant));
  const crit = critRoll < bounded(attacker.crit_chance, 0, 0.50);
  const damage = Math.max(1, Math.round(Math.max(0, finite(rawDamage)) * variance * (crit ? bounded(attacker.crit_multiplier, 1, 2) : 1) * (1 - mitigation)));
  return { damage, crit, missed: false, result: 'hit', dodge_chance: dodgeChance, mitigation };
}
