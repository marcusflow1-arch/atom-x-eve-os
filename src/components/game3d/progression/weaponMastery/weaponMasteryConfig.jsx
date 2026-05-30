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

// ─── Global Passives ─────────────────────────────────────────────────────
// Linear scaling from level 1 → 100. Returned per-level by the resolver.
// Keep numbers tight — these stack with stats AND weapon-class buffs.
export const GLOBAL_PASSIVE_CURVES = {
  // Each value is the BONUS at level 100. Level 1 = ~1% of max.
  critChancePct:       15,   // +15 crit% at level 100
  critDamagePct:       50,   // +50% crit damage multiplier
  hitChancePct:        10,   // +10 hit chance
  attackSpeedPct:      20,   // +20% attack speed
  damageMultPct:       25,   // +25% damage
  armorPenPct:         15,   // +15% armor pen (late-game)
  armorPenUnlockLevel: 35,   // armor pen starts contributing at lvl 35
};

// ─── Identity Scaling (per weapon TYPE) ──────────────────────────────────
// Each weapon type focuses on a different fantasy. Values at level 100.
// "perHitBonus" entries are stacking bonuses applied by the combat pipeline
// (momentum / combo) — read by WeaponScalingPipeline.
export const WEAPON_IDENTITY_AT_MAX = {
  [WEAPON_TYPES.SWORD]: {
    extraCritChancePct:     10,   // +10 crit chance on top of global
    comboDamagePct:         15,   // +15% damage on chained hits
    executeThresholdPct:    20,   // enemies under 20% HP take +50% damage
    executeBonusPct:        50,
  },
  [WEAPON_TYPES.GUARDIAN]: {
    damageReductionPct:     20,   // -20% damage taken
    reflectChancePct:       12,   // +12% reflect chance
    shieldStrengthPct:      30,   // +30% to any shield-buff absorb amount
  },
  [WEAPON_TYPES.RANGED]: {
    extraHitChancePct:      15,   // +15 hit chance on top of global
    multiHitAmpPct:         20,   // +20% damage to all subsequent hits in a multi-hit skill
    critRangeBonusPct:      25,   // +25% crit chance when target is far (>8 units)
    critRangeUnit:          8,
  },
  [WEAPON_TYPES.FISTS]: {
    extraAttackSpeedPct:    25,   // +25 atk speed on top of global
    chainHitBonusPct:       8,    // +8% damage per recent hit, up to chainCap
    chainCap:               5,
    momentumWindowSec:      2.5,  // recent hits expire after this window
  },
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
  [WEAPON_TYPES.SWORD]: {
    5:   { id: 'precision_killer',  name: 'Precision Killer',  desc: '+8% crit chance when HP > 70%', mod: { critOnHighHP: 8 } },
    10:  { id: 'execution_flow',    name: 'Execution Flow',    desc: '+5% damage per chained hit (sword combo)', mod: { comboBonusPct: 5 } },
    20:  { id: 'blade_focus',       name: 'Blade Focus',       desc: '+10% damage to single-target hits', mod: { singleTargetDmgPct: 10 } },
    35:  { id: 'soulcleaver',       name: 'Soulcleaver',       desc: 'Crits restore 3% max HP', mod: { critHealPct: 3 } },
    50:  { id: 'edge_perfected',    name: 'Edge Perfected',    desc: '+12% crit damage', mod: { critDamagePct: 12 } },
    75:  { id: 'mortal_resolve',    name: 'Mortal Resolve',    desc: 'Execute threshold raised to 30%', mod: { executeThresholdAddPct: 10 } },
    100: { id: 'legendary_swordsman', name: 'Legendary Swordsman', desc: '+15% damage permanently', mod: { damageMultPct: 15 } },
  },
  [WEAPON_TYPES.GUARDIAN]: {
    5:   { id: 'unshaken_guard',    name: 'Unshaken Guard',    desc: '-5% damage when blocking', mod: { blockReductionPct: 5 } },
    10:  { id: 'iron_will',         name: 'Iron Will',         desc: '+15% defense', mod: { defenseBonusPct: 15 } },
    20:  { id: 'aegis_call',        name: 'Aegis Call',        desc: '+10% reflect chance', mod: { reflectChancePct: 10 } },
    35:  { id: 'fortress_stance',   name: 'Fortress Stance',   desc: 'Take 8% less damage from bosses', mod: { bossDmgTakenPct: -8 } },
    50:  { id: 'lifebound_bulwark', name: 'Lifebound Bulwark', desc: '+10% max HP', mod: { maxHPBonusPct: 10 } },
    75:  { id: 'thornbreaker',      name: 'Thornbreaker',      desc: 'Reflect deals +50% extra damage', mod: { reflectDmgPct: 50 } },
    100: { id: 'immortal_guardian',name: 'Immortal Guardian', desc: 'Revive once per fight at 25% HP', mod: { reviveOnce: true } },
  },
  [WEAPON_TYPES.RANGED]: {
    5:   { id: 'deadeye_focus',     name: 'Deadeye Focus',     desc: '+10% crit when target is > 8 units away', mod: { rangedCritFar: 10 } },
    10:  { id: 'piercing_aim',      name: 'Piercing Aim',      desc: '+5% armor penetration', mod: { armorPenPct: 5 } },
    20:  { id: 'volley_master',     name: 'Volley Master',     desc: 'Multi-hit skills gain +10% damage per hit', mod: { multiHitAmpPct: 10 } },
    35:  { id: 'sniper_calm',       name: 'Sniper Calm',       desc: 'Crit damage +20%', mod: { critDamagePct: 20 } },
    50:  { id: 'hawkeye',           name: 'Hawkeye',           desc: 'Cannot miss when target is > 6 units away', mod: { rangedCannotMissFar: 6 } },
    75:  { id: 'phantom_arrow',     name: 'Phantom Arrow',     desc: 'Ranged attacks pierce 1 extra target', mod: { pierceTargets: 1 } },
    100: { id: 'legendary_marksman', name: 'Legendary Marksman', desc: '+25% ranged damage permanently', mod: { rangedDmgPct: 25 } },
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