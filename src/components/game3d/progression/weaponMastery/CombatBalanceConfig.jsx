// ─── CombatBalanceConfig ─────────────────────────────────────────────────
// Single source of truth for ALL combat formula constants and hard caps.
// Tune values here only — no magic numbers elsewhere in the combat pipeline.

// ─── Diminishing-return helper ────────────────────────────────────────────
// DR(stat, k) = stat / (stat + k)
// Returns a 0..1 multiplier. Never reaches 1.0 — never explodes.
export function dr(stat, k = 100) {
  return Math.max(0, stat) / (Math.max(0, stat) + k);
}

// ─── Attribute Scaling ────────────────────────────────────────────────────
// AttributeScaling = 1 + DR(stat, 100)
export function attributeScaling(stat) {
  return 1 + dr(stat, 100);
}

// ─── Critical Hit System ─────────────────────────────────────────────────
export const CRIT = {
  softCapK:      150,   // DR constant — 50 crit → 25%, 150 → 50%, 300 → 66%
  hardCapPct:    35,    // Absolute ceiling (%) after all sources
};

// Effective crit chance — apply hard cap after DR soft cap.
export function effectiveCritChance(rawCritStat) {
  const soft = dr(rawCritStat, CRIT.softCapK) * 100;
  return Math.min(soft, CRIT.hardCapPct);
}

// ─── Defense / Mitigation ────────────────────────────────────────────────
export const DEFENSE = {
  softCapK: 100,  // DR constant — 100 def → 50% reduction, 300 → 75%
};

// Returns the fraction of damage REDUCED (0..1).
export function defenseMitigation(defenseStat) {
  return dr(defenseStat, DEFENSE.softCapK);
}

// ─── Dodge System ────────────────────────────────────────────────────────
export const DODGE = {
  softCapK:   150,  // 150 dodge stat → 50% soft → hard capped
  hardCapPct:  25,  // Absolute ceiling (%)
};

export function effectiveDodgeChance(rawDodgeStat) {
  const soft = dr(rawDodgeStat, DODGE.softCapK) * 100;
  return Math.min(soft, DODGE.hardCapPct);
}

// ─── Deflection System (Dual Blades) ─────────────────────────────────────
export const DEFLECT = {
  softCapK:          120,  // DR constant
  hardCapPct:         30,  // Max deflect chance (%)
  baseReflectPct:    100,  // On deflect, always reflect 100% of incoming
  maxBonusReflectPct: 50,  // Bonus reflect is capped at +50%
  // If bonus reflect would exceed the cap, excess → increased deflect chance
  overflowToDeflect: true,
};

export function effectiveDeflectChance(rawDeflectStat) {
  const soft = dr(rawDeflectStat, DEFLECT.softCapK) * 100;
  return Math.min(soft, DEFLECT.hardCapPct);
}

// Returns { reflectPct, deflectBonusOverflow }
// reflectPct = base (100%) + bonus (capped at 50%)
// deflectBonusOverflow = any excess that converts to deflect chance bonus
export function resolveDeflectReflect(bonusReflectPct) {
  const capped = Math.min(bonusReflectPct, DEFLECT.maxBonusReflectPct);
  const overflow = Math.max(0, bonusReflectPct - DEFLECT.maxBonusReflectPct);
  return {
    reflectPct: DEFLECT.baseReflectPct + capped,
    deflectBonusOverflow: overflow,
  };
}

// ─── Attack Speed ─────────────────────────────────────────────────────────
export const ATTACK_SPEED = {
  softCapK:   100,  // DR constant
  hardCapPct:  50,  // Absolute ceiling (%)
};

// Returns a multiplier (1.0 = no bonus, 1.5 = +50%).
export function attackSpeedMult(rawAtkSpeedStat) {
  const bonus = Math.min(dr(rawAtkSpeedStat, ATTACK_SPEED.softCapK) * 100, ATTACK_SPEED.hardCapPct);
  return 1 + bonus / 100;
}

// Final attack time given a base animation time and the multiplier above.
export function finalAttackTime(baseTimeSec, rawAtkSpeedStat) {
  return baseTimeSec / attackSpeedMult(rawAtkSpeedStat);
}

// ─── HP & Regen ──────────────────────────────────────────────────────────
export const HP = {
  constitutionK: 100,
  regenK:        150,
};

export function maxHP(baseHP, constitutionStat) {
  return baseHP * (1 + dr(constitutionStat, HP.constitutionK));
}

export function hpRegen(baseRegen, constitutionStat) {
  return baseRegen * (1 + dr(constitutionStat, HP.regenK));
}

// ─── Tenacity / CC Resist ─────────────────────────────────────────────────
export const TENACITY = {
  softCapK: 100,
};

// Returns fraction of CC duration REDUCED (0..1).
export function ccReduction(tenacityStat) {
  return dr(tenacityStat, TENACITY.softCapK);
}

// ─── Random Variance ─────────────────────────────────────────────────────
export const VARIANCE = { min: 0.95, max: 1.05 };

export function rollVariance() {
  return VARIANCE.min + Math.random() * (VARIANCE.max - VARIANCE.min);
}

// ─── Skill Tier Bonus (Global Combat Training) ───────────────────────────
export const SKILL_TIER = {
  flatBonus:    2,   // +2 to all skills (soft bonus, NOT flat level add)
  softCapMult:  0.1, // Bonus contributes 10% per point at most (prevents stacking)
  hardCap:      5,   // Total +skill bonus from all sources cannot exceed 5
};

// ─── Global Combat Training Caps ─────────────────────────────────────────
export const GLOBAL_TRAINING = {
  // These are the MAXIMUM values the training system can contribute.
  // They are NOT per-weapon and should NOT be a primary damage source.
  maxAttackSpeedBonusPct:   15,  // Training caps at +15% atk speed contribution
  maxCooldownReductionPct:  10,  // Training caps at -10% CDR contribution
  maxResilienceDmgRedPct:    5,  // Training caps at -5% damage taken
  maxCCResistancePct:       15,  // Training caps at -15% CC duration
  maxSkillTierBonus:         2,  // Soft +2 to all skills, hard capped
};

// ─── Per-weapon % Ability Damage Bonuses (Sword role) ────────────────────
export const ABILITY_SCALING = {
  sword: {
    abilityDmgBonusPct:  25,  // +25% to ability damage (% based, not flat)
    skillEffectPct:      20,  // +20% skill effectiveness
    cdrPct:              10,  // Small cooldown reduction
  },
  // Bow: no heavy ability scaling — attack speed & on-hit instead
  bow: {
    onHitStackBonusPct:  5,   // Each stacking hit adds +5% (up to 5 stacks)
    onHitStackCap:       5,
  },
};

// ─── Full Final Damage Formula (reference) ───────────────────────────────
// FinalDamage =
//   (WeaponDamage × EnchantMultiplier)
//   × AttributeScaling(STR)
//   × SkillMultiplier
//   × (1 + TotalDamageBonusPct / 100)
//   × CritMultiplier
//   × (1 - defenseMitigation(DEF))
//   × rollVariance()
//
// CritMultiplier = isCrit ? (1 + critDamagePct/100) : 1
// isCrit = Math.random() * 100 < effectiveCritChance(critStat)