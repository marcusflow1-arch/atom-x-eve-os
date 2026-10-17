// Every permanent build effect of the weapon in hand, as stat-sheet fields
// (docs/game3d/BUILD_BALANCE.md): its native class passive (Brutal Force, Swift Marksman,
// Iron Stance), weapon mastery (global, identity, milestones, tree) and the advanced class.
// playerHUDStore puts them on the sheet; AXE_BUILD_CAPS (AXEPowerBudget) caps each one, and
// the one hit resolution (axeStrikeOutcomes) is the only place they act. Before this, each of
// these systems ran its own crit, dodge, block, deflect and damage-reduction rolls on top of
// the sheet, outside every cap.
import { getActiveBuffValues } from '../../weaponClassBuffStore';
import { resolveWeaponPassives } from '../../progression/weaponMastery/WeaponPassiveResolver';
import { WEAPON_TYPES } from '../../progression/weaponMastery/weaponMasteryConfig';
import { getActiveWeaponId } from '../../progression/weaponMastery/WeaponScalingPipeline';
import { getAXEAdvancedClassCombatModifiers } from '../../talents/AXEAdvancedClassRuntime';

import { AXE_BUILD_CAPS, AXE_COMBAT_RULES } from './AXEPowerBudget';

const n = (v) => Number(v) || 0;
const cap = (v, max) => Math.max(0, Math.min(max, n(v)));

// The sheet's combat fields from the build effects (after the stat pool), each at its cap.
// Damage % and defense % go into the stat pool instead (playerHUDStore), so they add to the
// other percentage systems rather than multiplying them.
export function applyAXEBuildEffectsToDerived(derived, effects = {}) {
  if (!derived) return derived;
  const C = AXE_BUILD_CAPS;
  return {
    ...derived,
    critChance: Math.min(AXE_COMBAT_RULES.critChanceCapPct, n(derived.critChance) + n(effects.critChance)),
    criticalDamage: cap(n(derived.criticalDamage) + n(effects.critDamage), C.critDamage),
    criticalDefense: cap(n(derived.criticalDefense) + n(effects.criticalDefense), C.criticalDefense),
    hitBonusPct: cap(effects.hitBonusPct, C.hitBonusPct),
    armorPenPct: cap(effects.armorPenPct, C.armorPenPct),
    skillDamagePct: cap(n(derived.skillPowerPct) + n(effects.skillDamagePct), C.skillDamagePct), // Spirit's skill power included
    avoidPct: cap(n(derived.avoidPct) + n(effects.avoidPct), C.avoidPct),
    deflectPct: cap(effects.deflectPct, C.deflectPct),
    blockPct: cap(effects.blockPct, C.blockPct),
    damageReductionPct: cap(effects.damageReductionPct, C.damageReductionPct),
    reflectPct: cap(effects.reflectPct, C.reflectPct),
    lifeStealPct: cap(effects.lifeStealPct, C.lifeStealPct),
    executeThresholdPct: cap(effects.executeThresholdPct, C.executeThresholdPct),
    executeDamagePct: cap(effects.executeDamagePct, C.executeDamagePct),
    // negative for slow, heavy specializations (Sniper)
    attackSpeedPct: Math.max(-50, Math.min(C.attackSpeedPct, n(derived.attackSpeedPct) + n(effects.attackSpeedPct))), // Agility's share included
    lethalBlowPct: Math.max(0, n(effects.lethalBlowPct)),
    comboPctPerHit: Math.max(0, n(effects.comboPctPerHit)),
    chargeDamagePct: cap(effects.chargeDamagePct, C.conditionalDamagePct),
    weakspotDamagePct: cap(effects.weakspotDamagePct, C.conditionalDamagePct),
    stealthDamagePct: cap(effects.stealthDamagePct, C.conditionalDamagePct),
    rangeCritPct: cap(effects.rangeCritPct, C.conditionalCritPct),
    rangeUnit: Math.max(0, n(effects.rangeUnit)),
  };
}

export function getAXEBuildCombatEffects() {
  const native = getActiveBuffValues() || {};
  const { global = {}, identity = {}, milestones = {}, weaponType } = resolveWeaponPassives(getActiveWeaponId());
  const advanced = getAXEAdvancedClassCombatModifiers() || {};
  const isType = (t) => weaponType === t;
  const guardian = isType(WEAPON_TYPES.GUARDIAN);
  const ranged = isType(WEAPON_TYPES.RANGED);
  const sword = isType(WEAPON_TYPES.SWORD);

  return {
    // into the stat pool (permanent % of the sheet)
    damagePct: n(native.damageBonusPct) * 100 + n(global.damageMultPct)
      + n(milestones.singleTargetDmgPct) + n(milestones.rangedDmgPct),
    defensePct: n(native.defenseBonusPct) * 100, // Iron Stance (it was never applied before)
    // onto the sheet
    critChance: n(global.critChancePct) + n(native.critChanceBonusPct) * 100 + (ranged ? n(identity.critChancePct) : 0),
    critDamage: (n(global.critDamagePct) + n(milestones.critDamagePct) + (ranged ? n(identity.critDamagePct) : 0)) / 100,
    // "hit chance" bonuses are accuracy: added to the hit roll (Swift Marksman's used to make the
    // archer harder to hit instead)
    hitBonusPct: n(global.hitChancePct) + n(native.hitChanceBonusPct) * 100 + (ranged ? n(identity.extraHitChancePct) : 0)
      + n(advanced.hitBonusPct),
    armorPenPct: n(global.armorPenPct) + n(milestones.armorPenPct),
    // ability bonuses (sword) and explosive skills (the Explosive Archer)
    skillDamagePct: (sword ? n(identity.abilityDmgBonusPct) + n(milestones.abilityDmgBonusPct) + (n(identity.skillEffectPct) + n(milestones.skillEffectPct)) / 2 : 0)
      + n(advanced.explosiveDamagePct),
    // avoidance: every dodge and guard, one roll
    avoidPct: (n(native.dodgeChancePct) + n(native.guardChancePct)) * 100
      + (guardian ? n(identity.dodgeBonusPct) + n(milestones.dodgeBonusPct) : 0)
      + n(advanced.dodgeChancePct),
    deflectPct: guardian ? n(identity.deflectBonusPct) + n(milestones.deflectBonusPct) + n(milestones.overflowToDeflectBonus) : 0,
    blockPct: n(advanced.blockChancePct),
    damageReductionPct: (guardian ? n(identity.damageReductionPct) + n(milestones.defenseBonusPct) / 2 : 0),
    criticalDefense: guardian ? n(identity.critDefensePct) / 100 : 0,
    reflectPct: n(advanced.reflectDamagePct) + n(advanced.counterDamagePct) * n(advanced.blockChancePct) / 100,
    lifeStealPct: n(advanced.lifeStealPct),
    executeThresholdPct: Math.max(
      sword ? n(identity.executeThresholdPct) + n(milestones.executeThresholdAddPct) : 0,
      n(advanced.executeThresholdPct),
    ),
    executeDamagePct: (sword ? n(identity.executeBonusPct) : 0) + n(advanced.executeDamagePct),
    attackSpeedPct: n(global.attackSpeedPct) + n(milestones.attackSpeedPct) + n(advanced.attackSpeedPct)
      + ((ranged || isType(WEAPON_TYPES.FISTS)) ? n(identity.extraAttackSpeedPct) : 0),
    // PvE only: a finishing blow on ordinary enemies (never bosses or players)
    lethalBlowPct: n(native.lethalBlowPct) * 100,
    // per-hit, conditional (AXEStrikeRuntime; capped with the other temporary bonuses):
    // momentum chains, Power Charge hits, long-range hits, the first hit from out of combat
    // (a bow's on-hit stacks are its chain: +5% a consecutive hit, its main damage scaling)
    comboPctPerHit: (sword ? (n(identity.comboDamagePct) + n(milestones.comboBonusPct)) / 5
      : isType(WEAPON_TYPES.FISTS) ? n(identity.chainHitBonusPct)
        : ranged ? n(identity.onHitStackBonusPct) + n(milestones.onHitStackBonusPct) : 0) + n(advanced.comboPct) / 5,
    chargeDamagePct: n(advanced.chargeDamagePct),
    weakspotDamagePct: n(advanced.weakspotDamagePct),
    stealthDamagePct: n(advanced.stealthDamagePct),
    rangeCritPct: ranged ? n(identity.critRangeBonusPct) : 0,
    rangeUnit: ranged ? n(identity.critRangeUnit) || 8 : 0,
    weaponType: weaponType || null,
  };
}
