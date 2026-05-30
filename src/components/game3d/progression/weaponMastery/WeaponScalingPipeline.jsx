// ─── WeaponScalingPipeline ──────────────────────────────────────────────
// The single integration surface for weapon mastery → combat math.
// All formulas use CombatBalanceConfig — tune constants there, not here.
//
// Exports:
//   applyMasteryToHit(rawDamage, ctx) → { damage, isCrit, execute, armorPenPct, chain }
//   applyMasteryToIncomingDamage(rawDamage, ctx) → { damage, reflect, reflectedDamage }
//   applyMasteryToSkillMultiplier(baseMult, weaponId) → number
//   getMasteryAttackSpeedMult(weaponId) → number
//   getMasteryCritChanceBonus(weaponId, ctx) → number (percentage points)
//   getMasteryHitChanceBonus(weaponId) → number
//   getCurrentMomentum() → { count, weaponId, lastHitAt }
//   resetMomentum()

import { resolveWeaponPassives } from './WeaponPassiveResolver';
import { resolveWeaponType, WEAPON_TYPES } from './weaponMasteryConfig';
import { getActiveWeaponPath } from '../../weaponClassBuffStore';
import { getMasteryState } from '../weaponMasteryStore';
import {
  effectiveCritChance,
  defenseMitigation,
  effectiveDodgeChance,
  effectiveDeflectChance,
  resolveDeflectReflect,
  attackSpeedMult,
  rollVariance,
  CRIT,
  ATTACK_SPEED,
  GLOBAL_TRAINING,
  SKILL_TIER,
} from './CombatBalanceConfig';

// ─── Momentum / Combo Tracker (in-memory) ────────────────────────────────
const momentum = {
  weaponId: null,
  count: 0,
  lastHitAt: 0,
};

function refreshMomentum(weaponId, windowSec) {
  const now = performance.now() / 1000;
  if (momentum.weaponId !== weaponId || now - momentum.lastHitAt > windowSec) {
    momentum.count = 0;
  }
  momentum.weaponId = weaponId;
  momentum.count += 1;
  momentum.lastHitAt = now;
}

function readMomentum(weaponId, windowSec) {
  const now = performance.now() / 1000;
  if (momentum.weaponId !== weaponId || now - momentum.lastHitAt > windowSec) return 0;
  return momentum.count;
}

// ─── On-Hit Stack Tracker (Bow) ──────────────────────────────────────────
const onHitStacks = { weaponId: null, count: 0, lastHitAt: 0, windowSec: 4 };

function refreshOnHitStack(weaponId, cap) {
  const now = performance.now() / 1000;
  if (onHitStacks.weaponId !== weaponId || now - onHitStacks.lastHitAt > onHitStacks.windowSec) {
    onHitStacks.count = 0;
  }
  onHitStacks.weaponId = weaponId;
  onHitStacks.count = Math.min(cap, onHitStacks.count + 1);
  onHitStacks.lastHitAt = now;
  return onHitStacks.count;
}

// ─── Resolve the active weaponId ────────────────────────────────────────
export function getActiveWeaponId() {
  const ms = getMasteryState();
  if (ms.activeWeaponId) return ms.activeWeaponId;
  const path = getActiveWeaponPath();
  const classToType = { damage: 'sword', ranged: 'ranged', defense: 'guardian' };
  const wantType = classToType[path] || 'sword';
  let best = null;
  let bestLevel = -1;
  Object.keys(ms.weapons || {}).forEach((id) => {
    if (resolveWeaponType(id) === wantType && ms.weapons[id].level > bestLevel) {
      best = id;
      bestLevel = ms.weapons[id].level;
    }
  });
  return best || Object.keys(ms.weapons || {})[0] || null;
}

// ─── Full Damage Pipeline ────────────────────────────────────────────────
/**
 * Apply the full weapon-mastery damage formula to an outgoing hit.
 *
 * FinalDamage =
 *   (rawDamage × enchantMult)
 *   × AttributeScaling(STR)   [applied by caller — ctx.attrScaling]
 *   × SkillMultiplier         [applied by caller — ctx.skillMult]
 *   × (1 + totalDamageBonusPct / 100)
 *   × CritMultiplier
 *   × (1 - defenseMitigation(DEF))
 *   × rollVariance()
 *
 * @param {number} rawDamage  — pre-mastery, pre-crit base damage
 * @param {object} ctx
 *   weaponId, enchantMult, attrScaling, skillMult, damageBonusPct,
 *   critStat, critDamagePct, defenseStat, targetHPPct, playerHPPct,
 *   distance, isCrit, isSkill, isMultiHit
 * @returns {{ damage, isCrit, execute, armorPenPct, chain }}
 */
export function applyMasteryToHit(rawDamage, ctx = {}) {
  const weaponId = ctx.weaponId || getActiveWeaponId();
  const passives = resolveWeaponPassives(weaponId);
  const { global, identity, milestones, weaponType, enchantAtkBonus, enchantElemBonus } = passives;

  let dmg = rawDamage;
  let isCrit = !!ctx.isCrit;
  let execute = false;

  // ── Enchantment bonuses ────────────────────────────────────────────────
  if (enchantAtkBonus > 0) dmg += enchantAtkBonus;
  if (enchantElemBonus > 0) dmg += enchantElemBonus * 0.5;

  // ── Global damage multiplier (mastery-level-based, small) ────────────
  dmg *= 1 + (global.damageMultPct || 0) / 100;

  // ── % Damage bonuses (gear + mastery, summed before applying) ────────
  const totalDamageBonusPct = (ctx.damageBonusPct || 0);
  if (totalDamageBonusPct > 0) dmg *= 1 + totalDamageBonusPct / 100;

  // ── Critical Hit (soft-capped + hard-capped via CombatBalanceConfig) ──
  if (!isCrit) {
    const baseCritPct = (ctx.critStat != null)
      ? effectiveCritChance(ctx.critStat)
      : Math.min((global.critChancePct || 0), CRIT.hardCapPct);
    const masteryBonus = getMasteryCritChanceBonus(weaponId, ctx);
    const finalCritChance = Math.min(baseCritPct + masteryBonus, CRIT.hardCapPct);
    if (Math.random() * 100 < finalCritChance) isCrit = true;
  }

  if (isCrit) {
    const critDmgPct = (ctx.critDamagePct || 50)
      + (global.critDamagePct || 0)
      + (milestones.critDamagePct || 0);
    dmg *= 1 + critDmgPct / 100;
  }

  // ── Defense Mitigation ────────────────────────────────────────────────
  if (ctx.defenseStat != null) {
    const armorPenPct = (global.armorPenPct || 0) + (milestones.armorPenPct || 0);
    const effectiveDef = Math.max(0, ctx.defenseStat * (1 - armorPenPct / 100));
    dmg *= 1 - defenseMitigation(effectiveDef);
  }

  // ── Random Variance (feel factor ±5%) ────────────────────────────────
  dmg *= rollVariance();

  // ── Weapon-type identity (role specialization) ────────────────────────

  if (weaponType === WEAPON_TYPES.SWORD) {
    // Ability damage bonus (% based — NOT flat level add)
    const abilityBonus = (identity.abilityDmgBonusPct || 0) + (milestones.abilityDmgBonusPct || 0);
    if (ctx.isSkill && abilityBonus > 0) dmg *= 1 + abilityBonus / 100;

    // Combo damage
    refreshMomentum(weaponId, 2.5);
    const chain = momentum.count;
    if (chain > 1) {
      const comboPct = (identity.comboDamagePct || 0) + (milestones.comboBonusPct || 0);
      dmg *= 1 + (comboPct * (chain - 1) / 5) / 100;
    }

    // Execute (% threshold → bonus damage)
    const thresh = (identity.executeThresholdPct || 0) + (milestones.executeThresholdAddPct || 0);
    if (typeof ctx.targetHPPct === 'number' && ctx.targetHPPct * 100 <= thresh) {
      execute = true;
      dmg *= 1 + (identity.executeBonusPct || 0) / 100;
    }

    // Single-target bonus from milestones
    if (milestones.singleTargetDmgPct) dmg *= 1 + milestones.singleTargetDmgPct / 100;

  } else if (weaponType === WEAPON_TYPES.RANGED) {
    // On-hit stacking bonus (replaces heavy ability scaling for bow)
    const stackCap = (identity.onHitStackCap || 5) + (milestones.onHitStackCapAdd || 0);
    const stacks = refreshOnHitStack(weaponId, stackCap);
    const perStackPct = (identity.onHitStackBonusPct || 0) + (milestones.onHitStackBonusPct || 0);
    if (stacks > 0 && perStackPct > 0) dmg *= 1 + (perStackPct * stacks) / 100;

    // Distance crit (bonus crit chance — handled below in getMasteryCritChanceBonus)
    if (ctx.isMultiHit) {
      // Multi-hit is no longer the main scaling — kept but reduced
      dmg *= 1 + (5) / 100; // flat 5% on multi-hit for bow (down from 20%)
    }
    if (milestones.rangedDmgPct) dmg *= 1 + milestones.rangedDmgPct / 100;

  } else if (weaponType === WEAPON_TYPES.FISTS) {
    const window = (identity.momentumWindowSec || 2.5) + (milestones.momentumWindowAddSec || 0);
    refreshMomentum(weaponId, window);
    const cap = (identity.chainCap || 5) + (milestones.chainCapAdd || 0);
    const chain = Math.min(cap, momentum.count);
    if (chain > 1) {
      dmg *= 1 + ((identity.chainHitBonusPct || 0) * (chain - 1)) / 100;
    }
    if (milestones.everyNthCrit && momentum.count > 0 && momentum.count % milestones.everyNthCrit === 0) {
      isCrit = true;
    }
    if (milestones.fullChainDmgPct && chain >= cap) {
      dmg *= 1 + milestones.fullChainDmgPct / 100;
    }

  } else if (weaponType === WEAPON_TYPES.SKY) {
    if (identity.extraElementalDmgPct) dmg *= 1 + (identity.extraElementalDmgPct + (milestones.elementalDmgPct || 0)) / 100;
    if (ctx.isAirborne && identity.aerialBonusPct) dmg *= 1 + identity.aerialBonusPct / 100;
    if (milestones.skyCritDmgPct && isCrit) dmg *= 1 + milestones.skyCritDmgPct / 100;
  }

  const armorPenPct = (global.armorPenPct || 0) + (milestones.armorPenPct || 0);

  return {
    damage: Math.max(1, Math.round(dmg)),
    isCrit,
    execute,
    armorPenPct,
    chain: momentum.count,
  };
}

// ─── Incoming Damage Pipeline (Defense / Dodge / Deflect) ────────────────
/**
 * Apply mastery modifiers to INCOMING damage taken by the player.
 * Handles: damage reduction, dodge roll, deflection (Dual Blades / Guardian).
 *
 * @param {number} rawDamage
 * @param {object} ctx { weaponId, fromBoss, isBlocking, dodgeStat, deflectStat, bonusReflectPct }
 * @returns {{ damage, dodged, reflect, reflectedDamage }}
 */
export function applyMasteryToIncomingDamage(rawDamage, ctx = {}) {
  const weaponId = ctx.weaponId || getActiveWeaponId();
  const { identity, milestones, weaponType } = resolveWeaponPassives(weaponId);
  let dmg = rawDamage;
  let dodged = false;
  let reflect = false;
  let reflectedDamage = 0;

  // ── Dodge Roll (soft + hard capped via CombatBalanceConfig) ───────────
  if (ctx.dodgeStat != null || weaponType === WEAPON_TYPES.GUARDIAN) {
    const dodgeStatBonus = (identity.dodgeBonusPct || 0) + (milestones.dodgeBonusPct || 0);
    const rawDodgeStat = (ctx.dodgeStat || 0) + dodgeStatBonus;
    const dodgeChance = effectiveDodgeChance(rawDodgeStat);
    if (Math.random() * 100 < dodgeChance) {
      dodged = true;
      return { damage: 0, dodged: true, reflect: false, reflectedDamage: 0 };
    }
  }

  // ── Deflection Roll (Guardian / Dual Blades — unique counter mechanic) ─
  if (weaponType === WEAPON_TYPES.GUARDIAN) {
    const deflectStatBonus = (identity.deflectBonusPct || 0) + (milestones.deflectBonusPct || 0);
    const rawDeflectStat = (ctx.deflectStat || 0) + deflectStatBonus;
    // Overflow from milestones.overflowToDeflectBonus converts to deflect chance
    const overflowBonus = milestones.overflowToDeflectBonus || 0;
    const deflectChance = Math.min(
      effectiveDeflectChance(rawDeflectStat) + overflowBonus,
      30 // absolute cap enforced here too
    );

    if (Math.random() * 100 < deflectChance) {
      reflect = true;
      const bonusReflect = (identity.bonusReflectPct || 0) + (milestones.bonusReflectPct || 0) + (ctx.bonusReflectPct || 0);
      const { reflectPct } = resolveDeflectReflect(bonusReflect);
      reflectedDamage = Math.round(rawDamage * reflectPct / 100);
      return { damage: 0, dodged: false, reflect: true, reflectedDamage };
    }

    // Non-deflected hit — apply guardian passive mitigation
    dmg *= 1 - (identity.damageReductionPct || 0) / 100;
    if (ctx.isBlocking && milestones.blockReductionPct) dmg *= 1 - milestones.blockReductionPct / 100;
    if (milestones.defenseBonusPct) dmg *= 1 - milestones.defenseBonusPct / 200;

    // Reduce incoming crit damage (critical defense)
    if (ctx.isCrit && identity.critDefensePct) dmg *= 1 - identity.critDefensePct / 100;
  }

  if (ctx.fromBoss && milestones.bossDmgTakenPct) {
    dmg *= 1 + milestones.bossDmgTakenPct / 100; // negative = less damage
  }

  return { damage: Math.max(0, Math.round(dmg)), dodged, reflect, reflectedDamage };
}

// ─── Skill / Buff Scaling ────────────────────────────────────────────────
/**
 * Multiplier applied to skill base multipliers.
 * Sword gets ability scaling bonus; Bow does NOT (on-hit is its scaling).
 */
export function applyMasteryToSkillMultiplier(baseMult, weaponId = null) {
  const { global, milestones, weaponType, identity } = resolveWeaponPassives(weaponId || getActiveWeaponId());
  let mult = baseMult * (1 + (global.damageMultPct || 0) / 100);

  if (weaponType === WEAPON_TYPES.SWORD) {
    const abilityBonus = (identity.abilityDmgBonusPct || 0) + (milestones.abilityDmgBonusPct || 0);
    if (abilityBonus > 0) mult *= 1 + abilityBonus / 100;
    const skillEff = (identity.skillEffectPct || 0) + (milestones.skillEffectPct || 0);
    if (skillEff > 0) mult *= 1 + skillEff / 200; // half-weight on skill multiplier
  }
  // Ranged: no ability scaling multiplier — on-hit stacks handled in applyMasteryToHit
  return mult;
}

/** Attack speed multiplier from mastery (≥ 1), hard-capped via CombatBalanceConfig. */
export function getMasteryAttackSpeedMult(weaponId = null) {
  const { global, identity, weaponType, milestones } = resolveWeaponPassives(weaponId || getActiveWeaponId());
  // Global training contribution (capped)
  let bonusPct = Math.min(global.attackSpeedPct || 0, GLOBAL_TRAINING.maxAttackSpeedBonusPct);

  // Weapon identity bonus
  if (weaponType === WEAPON_TYPES.FISTS) bonusPct += identity.extraAttackSpeedPct || 0;
  if (weaponType === WEAPON_TYPES.RANGED) bonusPct += identity.extraAttackSpeedPct || 0;

  // Milestone contributions
  bonusPct += milestones.attackSpeedPct || 0;
  if (milestones.atkSpdPerChain) bonusPct += milestones.atkSpdPerChain * Math.min(5, momentum.count);

  // Apply DR + hard cap from CombatBalanceConfig
  bonusPct = Math.min(bonusPct, ATTACK_SPEED.hardCapPct);
  return 1 + bonusPct / 100;
}

/** Crit chance bonus in percentage points (hard-capped to not exceed CRIT.hardCapPct). */
export function getMasteryCritChanceBonus(weaponId = null, ctx = {}) {
  const { global, identity, weaponType } = resolveWeaponPassives(weaponId || getActiveWeaponId());
  let bonus = global.critChancePct || 0;

  if (weaponType === WEAPON_TYPES.RANGED) {
    // Bow: low-moderate crit (not the primary scaling path)
    bonus += identity.critChancePct || 0;
    if (typeof ctx.distance === 'number' && ctx.distance > (identity.critRangeUnit || 8)) {
      bonus += identity.critRangeBonusPct || 0;
    }
  }
  // Sword no longer gets an extra raw crit bonus (ability scaling is its niche)
  return bonus;
}

/** Hit chance bonus in percentage points. */
export function getMasteryHitChanceBonus(weaponId = null) {
  const { global, identity, weaponType } = resolveWeaponPassives(weaponId || getActiveWeaponId());
  let bonus = global.hitChancePct || 0;
  if (weaponType === WEAPON_TYPES.RANGED) bonus += identity.extraHitChancePct || 0;
  return bonus;
}

/**
 * Cooldown reduction from mastery (as a fraction, 0..1).
 * Sword identity + Sky identity each contribute; capped via GLOBAL_TRAINING.
 */
export function getMasteryCDR(weaponId = null) {
  const { identity, milestones, weaponType, global } = resolveWeaponPassives(weaponId || getActiveWeaponId());
  let cdrPct = Math.min(global.cdrPct || 0, GLOBAL_TRAINING.maxCooldownReductionPct);
  if (weaponType === WEAPON_TYPES.SWORD) cdrPct += (identity.cdrPct || 0) + (milestones.cdrPct || 0);
  if (weaponType === WEAPON_TYPES.SKY)   cdrPct += (identity.cooldownReductionPct || 0) + (milestones.cdrPct || 0);
  return Math.min(cdrPct, 35) / 100; // absolute CDR ceiling 35%
}

/**
 * Skill tier bonus — soft +2, hard capped, never stacks infinitely.
 * Returns flat bonus to add to skill level (capped at SKILL_TIER.hardCap).
 */
export function getMasterySkillTierBonus(weaponId = null) {
  const { global } = resolveWeaponPassives(weaponId || getActiveWeaponId());
  const raw = Math.min(global.skillTierBonus || 0, GLOBAL_TRAINING.maxSkillTierBonus);
  return Math.min(raw, SKILL_TIER.hardCap);
}

/** Current combo/momentum count for HUD display. */
export function getCurrentMomentum() {
  return { count: momentum.count, weaponId: momentum.weaponId, lastHitAt: momentum.lastHitAt };
}

export function resetMomentum() {
  momentum.weaponId = null;
  momentum.count = 0;
  momentum.lastHitAt = 0;
}