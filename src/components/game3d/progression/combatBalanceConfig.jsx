// ─── Combat Balance Configuration ─────────────────────────────────────────
// Single source of truth for all combat stat caps, global training bonuses,
// and per-weapon role definitions.
//
// DESIGN PRINCIPLES
//  - Every weapon has a unique, non-overlapping fantasy
//  - No single stat source dominates damage
//  - All bonuses are % based (no flat +levels to skills)
//  - Soft caps prevent infinite stacking
//  - All values are tunable here without touching logic files

// ─── Global Stat Caps ──────────────────────────────────────────────────────
export const STAT_CAPS = {
  critChancePct:        30,    // Hard cap: 30% crit chance total
  attackSpeedPct:       50,    // Hard cap: 50% attack speed increase
  dodgeChancePct:       25,    // Hard cap: 25% dodge
  deflectChancePct:     40,    // Hard cap: 40% deflect chance
  cooldownReductionPct: 40,    // Hard cap: 40% CDR total
  allSkillsBonus:        4,    // Soft cap: max +4 to all skills from any source
  armorPenPct:          45,    // Hard cap: 45% armor penetration
  damageReductionPct:   60,    // Hard cap: 60% damage reduction taken
  // Deflection reflection is always 100% base; excess converts to bonus dmg
  deflectBaseReflectPct: 100,
};

// ─── Deflection Overflow Rules ─────────────────────────────────────────────
// When a build would push deflect reflection above 100%, the overflow
// converts at the following ratio into bonus reflected damage instead.
export const DEFLECT_OVERFLOW = {
  overflowToBonusDmgRatio: 0.75, // 1% overflow → 0.75% bonus reflected damage
  maxBonusReflectDmgPct:   50,   // cap on bonus reflected damage
};

// ─── Global Combat Training ────────────────────────────────────────────────
// Provides small universal bonuses as the player levels up overall.
// These are NOT a major damage source — utility only.
// Values represent the TOTAL bonus at max training level (100).
export const GLOBAL_TRAINING_BONUSES = {
  // Movement & flow
  attackSpeedPct:       12,   // +12% atk speed (moderate, respects 50% cap)
  cooldownReductionPct:  8,   // +8% CDR (replaces "critical thinking")
  // Resilience
  ccResistancePct:      15,   // +15% crowd control resistance
  damageReductionPct:    5,   // +5% flat damage reduction (small, safety net only)
  // Skill utility — soft-capped by STAT_CAPS.allSkillsBonus
  allSkillsBonusSoftCap: 2,   // Global training contributes max +2 of the +4 soft cap
};

// ─── Per-Weapon Role Definitions ──────────────────────────────────────────
// These are the IDENTITY values at max mastery (level 100).
// Each weapon has a clear non-overlapping role.
export const WEAPON_ROLES = {

  // SWORD — High DPS + Ability scaling
  // Fantasy: execute combos, deal big ability hits, reward aggression
  sword: {
    role: 'High DPS / Ability Scaling',
    color: '#ef4444',
    primaryStats:          ['strength'],
    physicalDmgBonusPct:   30,   // +30% physical damage
    abilityDmgBonusPct:    25,   // +25% ability damage (% based, not flat levels)
    skillEffectivenessPct: 20,   // +20% skill effectiveness (range, duration, amp)
    cooldownReductionPct:  10,   // small CDR to enable more abilities
    comboDmgPct:           15,   // +15% damage per chained hit (up to comboCapStacks)
    comboCapStacks:         5,
    // NO flat +skill levels; NO atk speed focus
    executeThresholdPct:   20,
    executeBonusPct:       50,
  },

  // DUAL BLADES — Evasion / Counter / Deflect
  // Fantasy: survive through movement and counter-attack; not raw damage
  dual_blades: {
    role: 'Evasion / Counter / Deflect',
    color: '#22d3ee',
    primaryStats:          ['dexterity'],
    dodgeChancePct:        20,   // +20% dodge (capped at 25%)
    critDefensePct:        15,   // +15% resistance to incoming crits
    deflectChancePct:      25,   // +25% deflect chance
    deflectBaseReflectPct: 100,  // base: reflect 100% of incoming damage on deflect
    // Overflow above 100% reflection converts per DEFLECT_OVERFLOW rules
    deflectScalingBonus:   20,   // if already at 100% reflect, give +20% bonus dmg instead
    counterDmgBonusPct:    15,   // +15% damage immediately after a successful dodge/deflect
    // NO heavy ability scaling, NO high physical dmg
  },

  // BOW — Speed / Precision / Sustained DPS
  // Fantasy: rapid sustained fire, on-hit stacking, precision at range
  bow: {
    role: 'Speed / Precision / Sustained DPS',
    color: '#a3e635',
    primaryStats:          ['dexterity'],
    attackSpeedPct:        25,   // primary stat — fast sustained fire
    critChancePct:         12,   // low-moderate crit (respects 30% cap)
    critDamagePct:         35,   // moderate crit damage
    rangedCritBonusPct:    10,   // extra crit when target > rangedCritRangeUnit
    rangedCritRangeUnit:    8,
    onHitStackBonusPct:     3,   // +3% damage per stacked on-hit (up to onHitCap)
    onHitCap:               8,
    multiHitAmpPct:        15,   // +15% damage on subsequent hits in a multi-hit
    // NO heavy ability scaling; speed and precision are the damage engine
    pierceTargets:          0,   // unlocked at milestone
  },

  // SKY — Elemental / Aerial / Cooldown Loop
  // Fantasy: elemental ability combos, aerial advantage, CDR loop
  sky: {
    role: 'Elemental / Aerial / CDR Loop',
    color: '#818cf8',
    primaryStats:          ['focus', 'intelligence'],
    elementalDmgBonusPct:  20,   // +20% elemental damage
    aerialBonusPct:        15,   // +15% damage airborne / vs airborne
    cooldownReductionPct:  10,   // primary CDR weapon
    abilityDmgBonusPct:    18,   // moderate ability scaling
    // NO heavy physical scaling
  },
};

// ─── Milestone Level Milestones ────────────────────────────────────────────
// Tunable level thresholds at which passive milestones unlock.
export const MILESTONE_LEVELS = [5, 10, 20, 35, 50, 75, 100];

// ─── Balanced Milestone Passives ──────────────────────────────────────────
// Each weapon type's milestone passives now align with its ROLE.
// No flat +skill levels. Uses % bonuses only.
export const BALANCED_MILESTONE_PASSIVES = {

  sword: {
    5:   { id: 'precision_killer',     name: 'Precision Killer',     desc: '+8% ability damage when HP > 70%',         mod: { abilityDmgOnHighHPPct: 8 } },
    10:  { id: 'execution_flow',       name: 'Execution Flow',       desc: '+5% combo damage per chained hit (max 5)', mod: { comboBonusPct: 5, comboCapAdd: 0 } },
    20:  { id: 'blade_focus',          name: 'Blade Focus',          desc: '+10% physical damage to single targets',   mod: { singleTargetPhysDmgPct: 10 } },
    35:  { id: 'soulcleaver',          name: 'Soulcleaver',          desc: 'Crits restore 3% max HP',                 mod: { critHealPct: 3 } },
    50:  { id: 'edge_perfected',       name: 'Edge Perfected',       desc: '+15% ability damage',                     mod: { abilityDmgBonusPct: 15 } },
    75:  { id: 'mortal_resolve',       name: 'Mortal Resolve',       desc: 'Execute threshold raised to 30%',         mod: { executeThresholdAddPct: 10 } },
    100: { id: 'legendary_swordsman',  name: 'Legendary Swordsman',  desc: '+20% physical & ability damage',          mod: { physAndAbilDmgPct: 20 } },
  },

  dual_blades: {
    5:   { id: 'ghost_step',           name: 'Ghost Step',           desc: '+5% dodge chance',                        mod: { dodgeChancePct: 5 } },
    10:  { id: 'crit_shield',          name: 'Crit Shield',          desc: '+10% critical hit resistance',            mod: { critDefensePct: 10 } },
    20:  { id: 'ricochet_guard',       name: 'Ricochet Guard',       desc: '+8% deflect chance',                      mod: { deflectChancePct: 8 } },
    35:  { id: 'mirror_edge',          name: 'Mirror Edge',          desc: '+15% counter damage after deflect',       mod: { counterDmgPct: 15 } },
    50:  { id: 'phantom_weave',        name: 'Phantom Weave',        desc: 'Dodge resets deflect window (+0.5s)',     mod: { deflectWindowAddSec: 0.5 } },
    75:  { id: 'veil_dancer',          name: 'Veil Dancer',          desc: '+10% dodge; successful dodge = +20% spd for 2s', mod: { dodgeChancePct: 10, dodgeSpeedBurstPct: 20, spdBurstSec: 2 } },
    100: { id: 'perfect_counter',      name: 'Perfect Counter',      desc: 'Deflect always reflects 100% + 25% bonus damage', mod: { deflectBonusReflectPct: 25 } },
  },

  bow: {
    5:   { id: 'swift_nock',           name: 'Swift Nock',           desc: '+8% attack speed',                        mod: { attackSpeedPct: 8 } },
    10:  { id: 'deadeye_focus',        name: 'Deadeye Focus',        desc: '+5% crit vs targets > 8 units away',     mod: { rangedCritFar: 5 } },
    20:  { id: 'volley_rhythm',        name: 'Volley Rhythm',        desc: 'On-hit stacks +1 cap',                   mod: { onHitCapAdd: 1 } },
    35:  { id: 'piercing_aim',         name: 'Piercing Aim',         desc: '+8% armor penetration',                  mod: { armorPenPct: 8 } },
    50:  { id: 'rapid_cadence',        name: 'Rapid Cadence',        desc: '+10% attack speed; on-hit stacks decay slower', mod: { attackSpeedPct: 10, onHitDecaySlowPct: 20 } },
    75:  { id: 'phantom_arrow',        name: 'Phantom Arrow',        desc: 'Attacks pierce 1 extra target',          mod: { pierceTargets: 1 } },
    100: { id: 'legendary_marksman',   name: 'Legendary Marksman',   desc: '+15% atk speed; +15% crit damage',       mod: { attackSpeedPct: 15, critDamagePct: 15 } },
  },

  sky: {
    5:   { id: 'sky_flow',             name: 'Sky Flow',             desc: '+8% elemental damage',                   mod: { elementalDmgPct: 8 } },
    10:  { id: 'aerial_grace',         name: 'Aerial Grace',         desc: '-8% ability cooldowns',                  mod: { cdrPct: 8 } },
    20:  { id: 'celestial_edge',       name: 'Celestial Edge',       desc: '+12% damage vs airborne enemies',        mod: { aerialDmgPct: 12 } },
    35:  { id: 'void_resonance',       name: 'Void Resonance',       desc: 'Abilities leave 3s lingering damage',    mod: { lingerDmgSec: 3 } },
    50:  { id: 'star_touched',         name: 'Star Touched',         desc: '+15% elemental ability crit damage',     mod: { elemCritDmgPct: 15 } },
    75:  { id: 'cosmic_will',          name: 'Cosmic Will',          desc: 'Cooldowns reset on kill',                mod: { cdrOnKill: true } },
    100: { id: 'ascendant',            name: 'Ascendant',            desc: '+20% elemental & ability damage',        mod: { elemAndAbilDmgPct: 20 } },
  },

  // Guardian kept as-is (defensive tank role, already balanced)
  guardian: {
    5:   { id: 'unshaken_guard',       name: 'Unshaken Guard',       desc: '-5% damage taken when blocking',         mod: { blockReductionPct: 5 } },
    10:  { id: 'iron_will',            name: 'Iron Will',            desc: '+15% defense',                          mod: { defenseBonusPct: 15 } },
    20:  { id: 'aegis_call',           name: 'Aegis Call',           desc: '+10% deflect chance',                   mod: { reflectChancePct: 10 } },
    35:  { id: 'fortress_stance',      name: 'Fortress Stance',      desc: '-8% damage from bosses',                mod: { bossDmgTakenPct: -8 } },
    50:  { id: 'lifebound_bulwark',    name: 'Lifebound Bulwark',    desc: '+10% max HP',                           mod: { maxHPBonusPct: 10 } },
    75:  { id: 'thornbreaker',         name: 'Thornbreaker',         desc: 'Reflect deals +50% bonus damage',       mod: { reflectDmgPct: 50 } },
    100: { id: 'immortal_guardian',    name: 'Immortal Guardian',    desc: 'Revive once per fight at 25% HP',       mod: { reviveOnce: true } },
  },
};

// ─── Utility: Apply Stat Cap ───────────────────────────────────────────────
// Call this whenever accumulating a capped stat.
// Returns the clamped value and how much was clipped (for overflow logic).
export function applyStatCap(statKey, rawValue) {
  const cap = STAT_CAPS[statKey];
  if (cap === undefined) return { value: rawValue, overflow: 0 };
  const clamped = Math.min(rawValue, cap);
  return { value: clamped, overflow: Math.max(0, rawValue - cap) };
}

// ─── Utility: Resolve Deflect Overflow ────────────────────────────────────
// Given a raw total reflect%, returns { reflectPct, bonusReflectDmgPct }.
export function resolveDeflectOverflow(rawReflectPct) {
  const base = Math.min(rawReflectPct, STAT_CAPS.deflectBaseReflectPct);
  const overflow = Math.max(0, rawReflectPct - STAT_CAPS.deflectBaseReflectPct);
  const bonusRaw = overflow * DEFLECT_OVERFLOW.overflowToBonusDmgRatio;
  const bonusReflectDmgPct = Math.min(bonusRaw, DEFLECT_OVERFLOW.maxBonusReflectDmgPct);
  return { reflectPct: base, bonusReflectDmgPct };
}

// ─── Utility: Soft-cap All-Skills Bonus ───────────────────────────────────
// Aggregates all sources of +allSkills and clamps to STAT_CAPS.allSkillsBonus.
export function resolveAllSkillsBonus(...sources) {
  const raw = sources.reduce((acc, v) => acc + (v || 0), 0);
  return Math.min(raw, STAT_CAPS.allSkillsBonus);
}