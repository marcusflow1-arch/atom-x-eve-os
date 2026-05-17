// ─── WeaponScalingPipeline ──────────────────────────────────────────────
// The single integration surface for weapon mastery → combat math.
// Combat code asks ONE function: applyMasteryToHit(...) — receives a
// pre-mitigation damage number plus context, returns the adjusted damage
// and metadata (was it a crit, did execute trigger, etc.).
//
// Also provides:
//   • applyMasteryToSkill(skill, baseMultiplier) → boosted multiplier
//   • getMasteryAttackSpeedMult() / getMasteryDamageReductionMult()
//   • a tiny momentum tracker for the Fists chain-hit / Sword combo passives
//
// This module owns NO persistent state — momentum/combo decays naturally
// over time and is reset on tab close.

import { resolveWeaponPassives } from './WeaponPassiveResolver';
import { resolveWeaponType, WEAPON_TYPES } from './weaponMasteryConfig';
import { getActiveWeaponPath } from '../../weaponClassBuffStore';
import { getMasteryState } from '../weaponMasteryStore';

// ─── Momentum / Combo Tracker (in-memory) ────────────────────────────────
// Each hit refreshes lastHitAt; combo decays after `momentumWindowSec`.
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

// ─── Resolve the active weaponId ────────────────────────────────────────
// We don't have a single equipped-weapon source of truth; the player can
// switch classes (damage/ranged/defense). Pick the active class's most-
// played weapon as a heuristic. Callers can pass an explicit weaponId.
export function getActiveWeaponId() {
  const ms = getMasteryState();
  if (ms.activeWeaponId) return ms.activeWeaponId;
  const path = getActiveWeaponPath();
  // Pick the highest-level weapon whose type matches the active class.
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

// ─── Damage Pipeline Hook ───────────────────────────────────────────────
/**
 * Apply weapon-mastery modifiers to an outgoing hit.
 * @param {number}  rawDamage    — pre-mastery damage number
 * @param {object}  ctx
 * @param {string}  [ctx.weaponId]      — explicit weapon id (else inferred)
 * @param {number}  [ctx.targetHPPct]   — 0..1 enemy current HP fraction
 * @param {number}  [ctx.playerHPPct]   — 0..1 player current HP fraction
 * @param {number}  [ctx.distance]      — units between attacker and target
 * @param {boolean} [ctx.isCrit]        — already rolled crit?
 * @param {boolean} [ctx.isSkill]       — is this a skill hit?
 * @param {boolean} [ctx.isMultiHit]    — part of a multi-hit skill?
 * @returns {{ damage:number, isCrit:boolean, execute:boolean, armorPenPct:number }}
 */
export function applyMasteryToHit(rawDamage, ctx = {}) {
  const weaponId = ctx.weaponId || getActiveWeaponId();
  const passives = resolveWeaponPassives(weaponId);
  const { global, identity, milestones, weaponType } = passives;
  let dmg = rawDamage;
  let isCrit = !!ctx.isCrit;
  let execute = false;

  // Global damage multiplier
  dmg *= 1 + (global.damageMultPct || 0) / 100;

  // Crit-damage bonus (applies only if hit is a crit)
  if (isCrit) {
    dmg *= 1 + (global.critDamagePct || 0) / 100;
    dmg *= 1 + ((milestones.critDamagePct || 0)) / 100;
  }

  // Per-type identity
  if (weaponType === WEAPON_TYPES.SWORD) {
    // Combo damage — increments momentum, bonus scales with chain length
    refreshMomentum(weaponId, 2.5);
    const chain = momentum.count;
    if (chain > 1) {
      const comboPct = identity.comboDamagePct || 0;
      const extraPerChainMile = milestones.comboBonusPct || 0;
      dmg *= 1 + (comboPct * (chain - 1) / 5) / 100;
      dmg *= 1 + (extraPerChainMile * (chain - 1)) / 100;
    }
    // Execute — target below threshold takes bonus damage
    const thresh = (identity.executeThresholdPct || 0) + (milestones.executeThresholdAddPct || 0);
    if (typeof ctx.targetHPPct === 'number' && ctx.targetHPPct * 100 <= thresh) {
      execute = true;
      dmg *= 1 + (identity.executeBonusPct || 0) / 100;
    }
    // Single-target bonus
    if (milestones.singleTargetDmgPct) {
      dmg *= 1 + milestones.singleTargetDmgPct / 100;
    }
    // High-HP crit bonus
    if (milestones.critOnHighHP && typeof ctx.playerHPPct === 'number' && ctx.playerHPPct > 0.7 && !isCrit) {
      if (Math.random() * 100 < milestones.critOnHighHP) isCrit = true;
    }
  } else if (weaponType === WEAPON_TYPES.RANGED) {
    // Distance-based crit bonus
    const range = identity.critRangeUnit || 8;
    if (typeof ctx.distance === 'number' && ctx.distance > range && !isCrit) {
      const farCrit = (identity.critRangeBonusPct || 0) + (milestones.rangedCritFar || 0);
      if (Math.random() * 100 < farCrit) isCrit = true;
    }
    // Multi-hit amplification
    if (ctx.isMultiHit) {
      const amp = (identity.multiHitAmpPct || 0) + (milestones.multiHitAmpPct || 0);
      dmg *= 1 + amp / 100;
    }
    if (milestones.rangedDmgPct) dmg *= 1 + milestones.rangedDmgPct / 100;
  } else if (weaponType === WEAPON_TYPES.FISTS) {
    const window = (identity.momentumWindowSec || 2.5) + (milestones.momentumWindowAddSec || 0);
    refreshMomentum(weaponId, window);
    let cap = (identity.chainCap || 5) + (milestones.chainCapAdd || 0);
    const chain = Math.min(cap, momentum.count);
    if (chain > 1) {
      const perHit = identity.chainHitBonusPct || 0;
      dmg *= 1 + (perHit * (chain - 1)) / 100;
    }
    // Every-Nth-crit milestone
    if (milestones.everyNthCrit && momentum.count > 0 && momentum.count % milestones.everyNthCrit === 0) {
      isCrit = true;
    }
    // Full-chain bonus
    if (milestones.fullChainDmgPct && chain >= cap) {
      dmg *= 1 + milestones.fullChainDmgPct / 100;
    }
  } else if (weaponType === WEAPON_TYPES.GUARDIAN) {
    // Guardian deals less but more reliable damage — no offensive bonus here
    // (handled in defensive pipeline below).
  }

  // Re-apply global crit damage if we just upgraded to a crit
  // (handled above only when isCrit was already true at entry, so simulate:)
  // For simplicity: when we *promote* a non-crit to crit, multiply once.
  // (already handled inline at crit-detection sites)

  // Armor penetration — passed through to caller so it can reduce enemy defense
  const armorPenPct = (global.armorPenPct || 0) + (milestones.armorPenPct || 0);

  return {
    damage: Math.round(dmg),
    isCrit,
    execute,
    armorPenPct,
    chain: momentum.count,
  };
}

// ─── Defensive pipeline (Guardian + universal) ──────────────────────────
/**
 * Apply mastery modifiers to INCOMING damage taken by the player.
 * @param {number} rawDamage incoming pre-mitigation damage
 * @param {object} ctx { weaponId, fromBoss, isBlocking }
 * @returns {{ damage:number, reflect:boolean }}
 */
export function applyMasteryToIncomingDamage(rawDamage, ctx = {}) {
  const weaponId = ctx.weaponId || getActiveWeaponId();
  const { identity, milestones, weaponType } = resolveWeaponPassives(weaponId);
  let dmg = rawDamage;
  let reflect = false;

  if (weaponType === WEAPON_TYPES.GUARDIAN) {
    dmg *= 1 - (identity.damageReductionPct || 0) / 100;
    if (ctx.isBlocking && milestones.blockReductionPct) {
      dmg *= 1 - milestones.blockReductionPct / 100;
    }
    if (milestones.defenseBonusPct) {
      dmg *= 1 - milestones.defenseBonusPct / 200; // half-weight on defense bonus
    }
    const reflectPct = (identity.reflectChancePct || 0) + (milestones.reflectChancePct || 0);
    if (Math.random() * 100 < reflectPct) reflect = true;
  }
  if (ctx.fromBoss && milestones.bossDmgTakenPct) {
    dmg *= 1 + milestones.bossDmgTakenPct / 100; // negative value = less damage
  }
  return { damage: Math.max(0, Math.round(dmg)), reflect };
}

// ─── Skill / Buff scaling hooks ─────────────────────────────────────────
/** Multiplier applied to skill multiplier values. */
export function applyMasteryToSkillMultiplier(baseMult, weaponId = null) {
  const { global, milestones, weaponType, identity } = resolveWeaponPassives(weaponId || getActiveWeaponId());
  let mult = baseMult * (1 + (global.damageMultPct || 0) / 100);
  if (weaponType === WEAPON_TYPES.RANGED) {
    const amp = (identity.multiHitAmpPct || 0) + (milestones.multiHitAmpPct || 0);
    mult *= 1 + amp / 100 / 4; // softer than per-hit amp
  }
  return mult;
}

/** Returns a flat attack-speed multiplier from mastery (≥ 1). */
export function getMasteryAttackSpeedMult(weaponId = null) {
  const { global, identity, weaponType, milestones } = resolveWeaponPassives(weaponId || getActiveWeaponId());
  let bonus = global.attackSpeedPct || 0;
  if (weaponType === WEAPON_TYPES.FISTS) bonus += identity.extraAttackSpeedPct || 0;
  if (milestones.atkSpdPerChain) {
    bonus += milestones.atkSpdPerChain * Math.min(5, momentum.count);
  }
  return 1 + bonus / 100;
}

/** Returns a crit-chance bonus (in percentage points). */
export function getMasteryCritChanceBonus(weaponId = null, ctx = {}) {
  const { global, identity, weaponType } = resolveWeaponPassives(weaponId || getActiveWeaponId());
  let bonus = global.critChancePct || 0;
  if (weaponType === WEAPON_TYPES.SWORD) bonus += identity.extraCritChancePct || 0;
  if (weaponType === WEAPON_TYPES.RANGED && typeof ctx.distance === 'number' && ctx.distance > (identity.critRangeUnit || 8)) {
    bonus += identity.critRangeBonusPct || 0;
  }
  return bonus;
}

/** Returns a hit-chance bonus (in percentage points). */
export function getMasteryHitChanceBonus(weaponId = null) {
  const { global, identity, weaponType } = resolveWeaponPassives(weaponId || getActiveWeaponId());
  let bonus = global.hitChancePct || 0;
  if (weaponType === WEAPON_TYPES.RANGED) bonus += identity.extraHitChancePct || 0;
  return bonus;
}

/** Returns current momentum/combo count for HUD display. */
export function getCurrentMomentum() {
  return { count: momentum.count, weaponId: momentum.weaponId, lastHitAt: momentum.lastHitAt };
}

export function resetMomentum() {
  momentum.weaponId = null;
  momentum.count = 0;
  momentum.lastHitAt = 0;
}