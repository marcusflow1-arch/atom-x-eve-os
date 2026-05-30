// ─── Weapon Mastery Configuration ────────────────────────────────────────
// Per-weapon-TYPE identity scaling and milestone passives.
//
// Weapon types are normalized to four canonical ids:
//   sword, guardian, ranged, fists
//
// The existing weaponMasteryStore stores per-weapon-INSTANCE progress
// (sword, dual_blades, bow, etc.). We map those instance ids → a weapon TYPE
// here so identity scaling and milestone unlocks remain coherent without
// duplicating per-instance config.

// Canonical weapon types used by the mastery engine.
export const WEAPON_TYPES = {
  SWORD: 'sword',
  GUARDIAN: 'guardian',
  RANGED: 'ranged',
  FISTS: 'fists',
  SKY: 'sky',
};

// Map any existing weapon instance id → canonical type.
// New instances default to 'sword' (safe melee fallback).
const WEAPON_TYPE_MAP = {
  sword: WEAPON_TYPES.SWORD,
  dual_blades: WEAPON_TYPES.SWORD, // dual blades behave as swords for identity scaling
  bow: WEAPON_TYPES.RANGED,
  shield: WEAPON_TYPES.GUARDIAN,
  guardian: WEAPON_TYPES.GUARDIAN,
  ranged: WEAPON_TYPES.RANGED,
  fists: WEAPON_TYPES.FISTS,
  brawler: WEAPON_TYPES.FISTS,
  sky: WEAPON_TYPES.SKY,
};

export function resolveWeaponType(weaponInstanceId) {
  if (!weaponInstanceId) return WEAPON_TYPES.SWORD;
  return WEAPON_TYPE_MAP[weaponInstanceId] || WEAPON_TYPES.SWORD;
}

// ─── Global Combat Training Passives ─────────────────────────────────────
// These are universal bonuses from general combat training, NOT from any
// specific weapon. They are intentionally modest — NOT a primary damage source.
// At level 100 a player gets these max values; scaled linearly before that.
export const GLOBAL_PASSIVE_CURVES = {
  // Each value is the BONUS at level 100. Level 1 = ~1% of max.
  attackSpeedPct:      15,   // +15% atk speed (moderate, capped via CombatBalanceConfig)
  cdrPct:              10,   // +10% cooldown reduction (replaces "critical thinking")
  ccResistancePct:     15,   // +15% CC/crowd-control resistance
  damageReductionPct:   5,   // +5% resilience (small damage taken reduction)
  skillTierBonus:       2,   // +2 to all skills, soft-capped (never exceeds max skill limit)
  // Carry-over utility stats (unchanged role)
  critChancePct:       10,   // +10 crit% at level 100 (soft-capped separately)
  critDamagePct:       30,   // +30% crit damage (down from 50 to avoid stacking bloat)
  hitChancePct:        10,   // +10 hit chance
  armorPenPct:         10,   // +10% armor pen (late-game)
  armorPenUnlockLevel: 35,   // armor pen starts contributing at lvl 35
};

// ─── Identity Scaling (per weapon TYPE) ──────────────────────────────────
// Each weapon type focuses on a different fantasy. Values at level 100.
// "perHitBonus" entries are stacking bonuses applied by the combat pipeline
// (momentum / combo) — read by WeaponScalingPipeline.
// ─── Identity Scaling (per weapon TYPE) ──────────────────────────────────
// Each weapon type has a UNIQUE role. Values are at max mastery level (100).
// These do NOT stack infinitely — they feed into DR formulas in the pipeline.
export const WEAPON_IDENTITY_AT_MAX = {
  // ── Sword: High DPS & Ability Scaling ────────────────────────────────
  // Primary role: physical damage + ability amplification.
  // Uses % bonuses — NO flat "+skill levels".
  [WEAPON_TYPES.SWORD]: {
    abilityDmgBonusPct:     25,   // +25% to ability/skill damage output (% based)
    skillEffectPct:         20,   // +20% skill effectiveness (AoE size, duration, etc.)
    cdrPct:                 10,   // -10% cooldown reduction (small utility)
    executeThresholdPct:    20,   // enemies under 20% HP take execute bonus
    executeBonusPct:        50,   // +50% damage in execute window
    comboDamagePct:         15,   // +15% on chained hits (secondary)
  },

  // ── Dual Blades (GUARDIAN type): Evasion & Deflection / Counter ───────
  // Primary role: dodge, deflect, and counter-attack. NOT a damage weapon.
  [WEAPON_TYPES.GUARDIAN]: {
    dodgeBonusPct:          15,   // +15 dodge chance (stacks via DR in pipeline)
    critDefensePct:         20,   // +20% reduction to crit damage taken
    deflectBonusPct:        12,   // +12 deflection chance bonus
    bonusReflectPct:        20,   // +20% extra damage reflected on deflect
    damageReductionPct:     10,   // -10% base damage taken (down from 20 — deflect is main tank)
    shieldStrengthPct:      25,   // +25% to shield-buff absorb
  },

  // ── Bow (RANGED type): Fast Sustained DPS + On-Hit ────────────────────
  // Primary role: attack speed and on-hit stacking. NOT ability-heavy.
  [WEAPON_TYPES.RANGED]: {
    extraAttackSpeedPct:    20,   // +20% attack speed (primary stat for bow)
    critChancePct:          10,   // Low-to-moderate crit chance bonus
    critDamagePct:          25,   // Moderate crit damage (not the highest)
    onHitStackBonusPct:      5,   // Each stacking hit adds +5% (up to 5 stacks)
    onHitStackCap:           5,
    extraHitChancePct:      15,   // +15 hit chance on top of global
    critRangeBonusPct:      15,   // +15% crit at range (reduced from 25 — atk spd is the fantasy)
    critRangeUnit:           8,
  },

  // ── Fists: Chain Momentum ─────────────────────────────────────────────
  [WEAPON_TYPES.FISTS]: {
    extraAttackSpeedPct:    25,   // +25 atk speed on top of global
    chainHitBonusPct:        8,   // +8% damage per recent hit, up to chainCap
    chainCap:                5,
    momentumWindowSec:       2.5, // recent hits expire after this window
  },

  // ── Sky: Elemental + Cooldown Mastery ─────────────────────────────────
  [WEAPON_TYPES.SKY]: {
    extraElementalDmgPct:   20,   // +20% elemental damage on top of global
    aerialBonusPct:         15,   // +15% damage when airborne / vs airborne
    cooldownReductionPct:   10,   // -10% ability cooldowns
  },
};

// ─── Milestone Passives ──────────────────────────────────────────────────
// Unlock at specific levels. Each milestone has an id + display name + brief
// description + applied modifier(s). Engine emits ON_MILESTONE_UNLOCK when
// the player reaches one of these levels for a weapon.
export const MILESTONE_LEVELS = [5, 10, 20, 35, 50, 75, 100];

export const MILESTONE_PASSIVES = {
  // Sword — ability/DPS milestones (% based, no flat +skill levels)
  [WEAPON_TYPES.SWORD]: {
    5:   { id: 'ability_surge',      name: 'Ability Surge',      desc: '+10% ability damage', mod: { abilityDmgBonusPct: 10 } },
    10:  { id: 'execution_flow',     name: 'Execution Flow',     desc: '+5% damage per chained hit', mod: { comboBonusPct: 5 } },
    20:  { id: 'skill_amplifier',    name: 'Skill Amplifier',    desc: '+15% skill effectiveness', mod: { skillEffectPct: 15 } },
    35:  { id: 'soulcleaver',        name: 'Soulcleaver',        desc: 'Crits restore 3% max HP', mod: { critHealPct: 3 } },
    50:  { id: 'blade_mastery',      name: 'Blade Mastery',      desc: '+20% ability damage & -8% cooldowns', mod: { abilityDmgBonusPct: 20, cdrPct: 8 } },
    75:  { id: 'mortal_resolve',     name: 'Mortal Resolve',     desc: 'Execute threshold raised to 30%', mod: { executeThresholdAddPct: 10 } },
    100: { id: 'legendary_swordsman',name: 'Legendary Swordsman',desc: '+20% ability & skill damage permanently', mod: { abilityDmgBonusPct: 20, skillEffectPct: 10 } },
  },

  // Guardian (Dual Blades) — deflect, dodge, counter milestones
  [WEAPON_TYPES.GUARDIAN]: {
    5:   { id: 'swift_reflex',       name: 'Swift Reflex',       desc: '+8% dodge chance', mod: { dodgeBonusPct: 8 } },
    10:  { id: 'counter_edge',       name: 'Counter Edge',       desc: '+10% deflection chance', mod: { deflectBonusPct: 10 } },
    20:  { id: 'mirror_guard',       name: 'Mirror Guard',       desc: 'Deflect reflects +20% bonus damage (capped at 50% total)', mod: { bonusReflectPct: 20 } },
    35:  { id: 'fortress_stance',    name: 'Fortress Stance',    desc: 'Take 8% less damage from bosses', mod: { bossDmgTakenPct: -8 } },
    50:  { id: 'phantom_body',       name: 'Phantom Body',       desc: '+10% dodge & +5% crit defense', mod: { dodgeBonusPct: 10, critDefensePct: 5 } },
    75:  { id: 'thornbreaker',       name: 'Thornbreaker',       desc: 'Overcap reflect converts to +5% deflect chance', mod: { overflowToDeflectBonus: 5 } },
    100: { id: 'immortal_guardian',  name: 'Immortal Guardian',  desc: 'Revive once per fight at 25% HP', mod: { reviveOnce: true } },
  },

  // Ranged — attack speed, on-hit stacking, moderate crit (NO heavy ability scaling)
  [WEAPON_TYPES.RANGED]: {
    5:   { id: 'swift_nock',         name: 'Swift Nock',         desc: '+10% attack speed', mod: { attackSpeedPct: 10 } },
    10:  { id: 'piercing_aim',       name: 'Piercing Aim',       desc: '+5% armor penetration', mod: { armorPenPct: 5 } },
    20:  { id: 'on_hit_tempo',       name: 'On-Hit Tempo',       desc: '+1 on-hit stack cap & +5% per stack', mod: { onHitStackCapAdd: 1, onHitStackBonusPct: 5 } },
    35:  { id: 'rapid_cadence',      name: 'Rapid Cadence',      desc: '+8% attack speed', mod: { attackSpeedPct: 8 } },
    50:  { id: 'hawkeye',            name: 'Hawkeye',            desc: 'Cannot miss when target is > 6 units away', mod: { rangedCannotMissFar: 6 } },
    75:  { id: 'phantom_arrow',      name: 'Phantom Arrow',      desc: 'Ranged attacks pierce 1 extra target', mod: { pierceTargets: 1 } },
    100: { id: 'legendary_marksman', name: 'Legendary Marksman', desc: '+12% attack speed & +3 on-hit stacks', mod: { attackSpeedPct: 12, onHitStackCapAdd: 3 } },
  },
  [WEAPON_TYPES.FISTS]: {
    5:   { id: 'momentum_breaker',  name: 'Momentum Breaker',  desc: '+3% stagger chance per chained hit', mod: { staggerPerChain: 3 } },
    10:  { id: 'rolling_thunder',   name: 'Rolling Thunder',   desc: '+5% atk speed per chained hit (max 5)', mod: { atkSpdPerChain: 5 } },
    20:  { id: 'flow_state',        name: 'Flow State',        desc: 'Chain cap +2', mod: { chainCapAdd: 2 } },
    35:  { id: 'iron_knuckles',     name: 'Iron Knuckles',     desc: '+10% armor pen', mod: { armorPenPct: 10 } },
    50:  { id: 'pressure_point',    name: 'Pressure Point',    desc: 'Every 5th hit is a guaranteed crit', mod: { everyNthCrit: 5 } },
    75:  { id: 'inner_fire',        name: 'Inner Fire',        desc: 'Momentum window +1.5s', mod: { momentumWindowAddSec: 1.5 } },
    100: { id: 'transcendent_form', name: 'Transcendent Form', desc: '+30% damage at full chain', mod: { fullChainDmgPct: 30 } },
  },
  [WEAPON_TYPES.SKY]: {
    5:   { id: 'sky_flow',          name: 'Sky Flow',          desc: '+8% elemental damage', mod: { elementalDmgPct: 8 } },
    10:  { id: 'aerial_grace',      name: 'Aerial Grace',      desc: '-10% ability cooldowns', mod: { cdrPct: 10 } },
    20:  { id: 'celestial_edge',    name: 'Celestial Edge',    desc: '+15% damage vs airborne enemies', mod: { aerialDmgPct: 15 } },
    35:  { id: 'void_resonance',    name: 'Void Resonance',    desc: 'Abilities leave a 3s lingering damage field', mod: { lingerDmgSec: 3 } },
    50:  { id: 'star_touched',      name: 'Star Touched',      desc: '+20% crit damage for sky abilities', mod: { skyCritDmgPct: 20 } },
    75:  { id: 'cosmic_will',       name: 'Cosmic Will',       desc: 'Cooldowns reset on kill', mod: { cdrOnKill: true } },
    100: { id: 'ascendant',         name: 'Ascendant',         desc: '+25% all damage permanently', mod: { damageMultPct: 25 } },
  },
};

// ─── XP weights for non-kill actions ─────────────────────────────────────
// All weapon usage advances mastery — kills are just the heaviest source.
// Values feed killsForMasteryLevel() in fractional kill-equivalents.
export const XP_WEIGHTS = {
  perHit:          0.1,     // each landed hit counts as 0.1 of a kill
  perCrit:         0.2,     // crits double-count
  perDamageDealt:  0.001,   // 1000 damage ≈ 1 kill of mastery xp
  perBossDamage:   0.002,   // boss damage worth 2× normal damage
  perSkillCast:    0.3,     // each successful skill cast
  perKill:         1.0,     // baseline (matches legacy)
};