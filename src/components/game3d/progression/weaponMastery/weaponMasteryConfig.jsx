// ─── Weapon Mastery Configuration ────────────────────────────────────────
// Re-exports and wires the centralized combatBalanceConfig into the mastery
// engine. All tuning should happen in combatBalanceConfig.js — not here.

import {
  WEAPON_ROLES,
  BALANCED_MILESTONE_PASSIVES,
  STAT_CAPS,
  GLOBAL_TRAINING_BONUSES,
  applyStatCap,
  resolveDeflectOverflow,
  resolveAllSkillsBonus,
} from '../combatBalanceConfig';

// Re-export utilities consumed by other parts of the mastery system
export { applyStatCap, resolveDeflectOverflow, resolveAllSkillsBonus, STAT_CAPS, GLOBAL_TRAINING_BONUSES };

// ─── Canonical Weapon Types ───────────────────────────────────────────────
export const WEAPON_TYPES = {
  SWORD:    'sword',
  GUARDIAN: 'guardian',
  RANGED:   'ranged',
  FISTS:    'fists',
  SKY:      'sky',
  DUAL:     'dual_blades',
};

// Map any weapon instance id → its combat role key (used by identity scaling)
const WEAPON_TYPE_MAP = {
  sword:       'sword',
  dual_blades: 'dual_blades',
  bow:         'ranged',
  shield:      'guardian',
  guardian:    'guardian',
  ranged:      'ranged',
  fists:       'fists',
  brawler:     'fists',
  sky:         'sky',
};

export function resolveWeaponType(weaponInstanceId) {
  if (!weaponInstanceId) return 'sword';
  return WEAPON_TYPE_MAP[weaponInstanceId] || 'sword';
}

// ─── Global Passive Curves ────────────────────────────────────────────────
// Linear scaling from level 1 → 100. These are GLOBAL (not weapon-specific)
// and are intentionally small — they are NOT a major damage source.
// All values here must stay within the caps defined in combatBalanceConfig.
export const GLOBAL_PASSIVE_CURVES = {
  critChancePct:       10,   // +10% crit at level 100 (hard cap: 30%)
  critDamagePct:       30,   // +30% crit damage multiplier
  hitChancePct:        10,   // +10% hit chance
  attackSpeedPct:      GLOBAL_TRAINING_BONUSES.attackSpeedPct,    // 12%
  cooldownReductionPct:GLOBAL_TRAINING_BONUSES.cooldownReductionPct, // 8%
  ccResistancePct:     GLOBAL_TRAINING_BONUSES.ccResistancePct,   // 15%
  damageReductionPct:  GLOBAL_TRAINING_BONUSES.damageReductionPct, // 5%
  armorPenPct:         10,   // +10% armor pen (starts at level 35)
  armorPenUnlockLevel: 35,
  // Skill bonus: soft-capped via resolveAllSkillsBonus
  allSkillsBonusMax:   GLOBAL_TRAINING_BONUSES.allSkillsBonusSoftCap, // max +2 from global
};

// ─── Identity Scaling (per weapon role) ──────────────────────────────────
// Pulled directly from WEAPON_ROLES in combatBalanceConfig.
// Used by WeaponScalingPipeline and stat display tooltips.
export const WEAPON_IDENTITY_AT_MAX = {
  sword: {
    physicalDmgBonusPct:   WEAPON_ROLES.sword.physicalDmgBonusPct,
    abilityDmgBonusPct:    WEAPON_ROLES.sword.abilityDmgBonusPct,
    skillEffectivenessPct: WEAPON_ROLES.sword.skillEffectivenessPct,
    cooldownReductionPct:  WEAPON_ROLES.sword.cooldownReductionPct,
    comboDamagePct:        WEAPON_ROLES.sword.comboDmgPct,
    comboCapStacks:        WEAPON_ROLES.sword.comboCapStacks,
    executeThresholdPct:   WEAPON_ROLES.sword.executeThresholdPct,
    executeBonusPct:       WEAPON_ROLES.sword.executeBonusPct,
  },
  dual_blades: {
    dodgeChancePct:        WEAPON_ROLES.dual_blades.dodgeChancePct,
    critDefensePct:        WEAPON_ROLES.dual_blades.critDefensePct,
    deflectChancePct:      WEAPON_ROLES.dual_blades.deflectChancePct,
    deflectBaseReflectPct: WEAPON_ROLES.dual_blades.deflectBaseReflectPct,
    deflectBonusDmgPct:    WEAPON_ROLES.dual_blades.deflectScalingBonus,
    counterDmgBonusPct:    WEAPON_ROLES.dual_blades.counterDmgBonusPct,
  },
  // Bow maps to RANGED type
  ranged: {
    attackSpeedPct:        WEAPON_ROLES.bow.attackSpeedPct,
    critChancePct:         WEAPON_ROLES.bow.critChancePct,
    critDamagePct:         WEAPON_ROLES.bow.critDamagePct,
    rangedCritBonusPct:    WEAPON_ROLES.bow.rangedCritBonusPct,
    rangedCritRangeUnit:   WEAPON_ROLES.bow.rangedCritRangeUnit,
    onHitStackBonusPct:    WEAPON_ROLES.bow.onHitStackBonusPct,
    onHitCap:              WEAPON_ROLES.bow.onHitCap,
    multiHitAmpPct:        WEAPON_ROLES.bow.multiHitAmpPct,
  },
  sky: {
    elementalDmgBonusPct:  WEAPON_ROLES.sky.elementalDmgBonusPct,
    aerialBonusPct:        WEAPON_ROLES.sky.aerialBonusPct,
    cooldownReductionPct:  WEAPON_ROLES.sky.cooldownReductionPct,
    abilityDmgBonusPct:    WEAPON_ROLES.sky.abilityDmgBonusPct,
  },
  guardian: {
    damageReductionPct:    20,
    reflectChancePct:      12,
    shieldStrengthPct:     30,
  },
  fists: {
    extraAttackSpeedPct:   25,
    chainHitBonusPct:      8,
    chainCap:              5,
    momentumWindowSec:     2.5,
  },
};

// ─── Milestone Passives ───────────────────────────────────────────────────
// Sourced from combatBalanceConfig — weapon-role aligned, no flat +levels.
export const MILESTONE_LEVELS = [5, 10, 20, 35, 50, 75, 100];

export const MILESTONE_PASSIVES = {
  sword:       BALANCED_MILESTONE_PASSIVES.sword,
  dual_blades: BALANCED_MILESTONE_PASSIVES.dual_blades,
  ranged:      BALANCED_MILESTONE_PASSIVES.bow,
  guardian:    BALANCED_MILESTONE_PASSIVES.guardian,
  fists:       {
    5:   { id: 'momentum_breaker',  name: 'Momentum Breaker',  desc: '+3% stagger per chained hit',             mod: { staggerPerChain: 3 } },
    10:  { id: 'rolling_thunder',   name: 'Rolling Thunder',   desc: '+5% atk speed per chained hit (max 5)',   mod: { atkSpdPerChain: 5 } },
    20:  { id: 'flow_state',        name: 'Flow State',        desc: 'Chain cap +2',                            mod: { chainCapAdd: 2 } },
    35:  { id: 'iron_knuckles',     name: 'Iron Knuckles',     desc: '+10% armor pen',                         mod: { armorPenPct: 10 } },
    50:  { id: 'pressure_point',    name: 'Pressure Point',    desc: 'Every 5th hit is a guaranteed crit',      mod: { everyNthCrit: 5 } },
    75:  { id: 'inner_fire',        name: 'Inner Fire',        desc: 'Momentum window +1.5s',                   mod: { momentumWindowAddSec: 1.5 } },
    100: { id: 'transcendent_form', name: 'Transcendent Form', desc: '+30% damage at full chain',               mod: { fullChainDmgPct: 30 } },
  },
  sky:         BALANCED_MILESTONE_PASSIVES.sky,
};

// ─── XP Weights ───────────────────────────────────────────────────────────
export const XP_WEIGHTS = {
  perHit:         0.1,
  perCrit:        0.2,
  perDamageDealt: 0.001,
  perBossDamage:  0.002,
  perSkillCast:   0.3,
  perKill:        1.0,
};