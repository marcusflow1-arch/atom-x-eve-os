// Runtime resolver for the Advanced Class attached to the ACTUALLY equipped weapon.
// Advanced Classes specialize mastery; they do not replace Attributes or Equipment.

import { getActiveEquippedAXEWeapon } from '../axe/equipment/AXEEquipmentInventoryStore';
import { resolveAXEWeaponIdentity } from '../axe/weapons/AXEWeaponIdentity';
import {
  getActivePassiveBonuses,
  getActiveSkillModifiers,
  getSelectedClass,
} from './advancedClassStore';

const empty = () => ({
  classDef: null,
  identity: resolveAXEWeaponIdentity(null),
  flat: {
    critChance: 0,
    critDamage: 0,
    attackSuccess: 0,
    attackBlock: 0,
  },
  multipliers: {
    hpPct: 0,
    defensePct: 0,
    elementalDamagePct: 0,
  },
  combat: {
    attackSpeedPct: 0,
    cooldownReductionPct: 0,
    lifeStealPct: 0,
    dodgeChancePct: 0,
    blockChancePct: 0,
    ccResistancePct: 0,
    executeThresholdPct: 0,
    executeDamagePct: 0,
    counterDamagePct: 0,
    chargeDamagePct: 0,
    weakspotDamagePct: 0,
    stealthDamagePct: 0,
    bleedChancePct: 0,
    reflectDamagePct: 0,
  },
  skillModifiers: {},
});

const pct = (value) => Number(value || 0) * 100;

export function getActiveAXEAdvancedClassRuntime() {
  const weapon = getActiveEquippedAXEWeapon();
  if (!weapon) return empty();

  const identity = resolveAXEWeaponIdentity(weapon);
  if (!identity.advancedWeaponType) return { ...empty(), identity };

  const classDef = getSelectedClass(identity.advancedWeaponType);
  if (!classDef) return { ...empty(), identity };

  const passives = getActivePassiveBonuses(identity.advancedWeaponType);
  const skillModifiers = getActiveSkillModifiers(identity.advancedWeaponType);

  const out = empty();
  out.classDef = classDef;
  out.identity = identity;
  out.skillModifiers = skillModifiers;

  // Derived character stats.
  out.flat.critChance += pct(passives.crit_chance);
  out.flat.critDamage += pct(passives.crit_damage);
  out.flat.attackSuccess += pct(passives.hit_chance);
  out.flat.attackBlock += pct(passives.dodge_chance) + pct(passives.block_chance);

  out.multipliers.hpPct += pct(passives.hp_scaling);
  out.multipliers.defensePct += pct(passives.defense);
  out.multipliers.elementalDamagePct += pct(passives.elemental_scaling);

  // Runtime combat mechanics.
  out.combat.attackSpeedPct += pct(passives.attack_speed);
  out.combat.cooldownReductionPct += pct(passives.cooldown_reduction);
  out.combat.lifeStealPct += pct(passives.life_steal);
  out.combat.dodgeChancePct += pct(passives.dodge_chance);
  out.combat.blockChancePct += pct(passives.block_chance);
  out.combat.ccResistancePct += pct(passives.cc_resistance);
  out.combat.executeThresholdPct += pct(passives.execute_threshold);
  out.combat.executeDamagePct += pct(passives.execute_damage);
  out.combat.counterDamagePct += pct(passives.counter_damage);
  out.combat.chargeDamagePct += pct(passives.charge_damage);
  out.combat.weakspotDamagePct += pct(passives.weakspot_damage);
  out.combat.stealthDamagePct += pct(passives.stealth_damage_bonus);
  out.combat.bleedChancePct += pct(passives.bleed_chance);
  out.combat.reflectDamagePct += pct(passives.reflect_damage);

  return out;
}

export function applyAXEAdvancedClassDerivedMultipliers(derived, multipliers = {}) {
  if (!derived) return derived;

  const hpMult = 1 + Number(multipliers.hpPct || 0) / 100;
  const defenseMult = 1 + Number(multipliers.defensePct || 0) / 100;
  const elementalMult = 1 + Number(multipliers.elementalDamagePct || 0) / 100;

  const elementalDamage = Math.max(
    0,
    Math.round(Number(derived.elementalDamage || 0) * Math.max(0.05, elementalMult)),
  );
  const physicalDamage = Math.max(1, Number(derived.physicalDamage || 1));
  const totalDamage = Math.max(1, Math.round(physicalDamage + elementalDamage));

  return {
    ...derived,
    maxHP: Math.max(1, Math.round(Number(derived.maxHP || 1) * Math.max(0.05, hpMult))),
    defense: Math.max(0, Number(derived.defense || 0) * Math.max(0.05, defenseMult)),
    elementalDamage,
    totalDamage,
    damage: totalDamage,
    advancedClass: {
      classId: getActiveAXEAdvancedClassRuntime().classDef?.class_id || null,
      hpPct: Number(multipliers.hpPct || 0),
      defensePct: Number(multipliers.defensePct || 0),
      elementalDamagePct: Number(multipliers.elementalDamagePct || 0),
    },
  };
}

export function getAXEAdvancedClassCombatModifiers() {
  return { ...getActiveAXEAdvancedClassRuntime().combat };
}
