// AXE Prompt 014 — reusable martial skill ladder.
// One data generator creates the ten attack patterns for every weapon identity;
// adding another faction/weapon family does not require rewriting the executor.

import { SKILL_TYPE, WEAPON_TYPE, CAST_TYPE } from '../../skills/skillTypes';

export const AXE_SKILL_PATTERNS = Object.freeze([
  { number: 1, pattern: 'multi', hitCount: 2, castType: CAST_TYPE.MULTI_HIT_SEQUENTIAL, hitDelay: 0.18, damageMin: 0.70, damageMax: 0.95, critAllowed: true },
  { number: 2, pattern: 'single', hitCount: 1, castType: CAST_TYPE.SINGLE_HIT, hitDelay: 0, damageMin: 1.20, damageMax: 1.60, critAllowed: true },
  { number: 3, pattern: 'aoe', hitCount: 1, castType: CAST_TYPE.SINGLE_HIT, hitDelay: 0, damageMin: 0.95, damageMax: 1.30, critAllowed: false, aoeRadius: 5 },
  { number: 4, pattern: 'single', hitCount: 1, castType: CAST_TYPE.SINGLE_HIT, hitDelay: 0, damageMin: 1.45, damageMax: 1.95, critAllowed: true },
  { number: 5, pattern: 'multi', hitCount: 3, castType: CAST_TYPE.MULTI_HIT_SEQUENTIAL, hitDelay: 0.17, damageMin: 0.72, damageMax: 1.02, critAllowed: true },
  { number: 6, pattern: 'single', hitCount: 1, castType: CAST_TYPE.SINGLE_HIT, hitDelay: 0, damageMin: 1.70, damageMax: 2.25, critAllowed: true },
  { number: 7, pattern: 'multi', hitCount: 4, castType: CAST_TYPE.MULTI_HIT_SEQUENTIAL, hitDelay: 0.15, damageMin: 0.68, damageMax: 1.00, critAllowed: true },
  { number: 8, pattern: 'strong_aoe', hitCount: 1, castType: CAST_TYPE.SINGLE_HIT, hitDelay: 0, damageMin: 1.65, damageMax: 2.25, critAllowed: true, aoeRadius: 7.5 },
  { number: 9, pattern: 'divine_single', hitCount: 1, castType: CAST_TYPE.SINGLE_HIT, hitDelay: 0, damageMin: 2.15, damageMax: 3.00, critAllowed: true, divine: true },
  { number: 10, pattern: 'divine_three_hit', hitCount: 3, castType: CAST_TYPE.MULTI_HIT_SEQUENTIAL, hitDelay: 0.22, damageMin: 1.05, damageMax: 1.55, critAllowed: true, divine: true },
]);

const ROLE_CONFIG = Object.freeze([
  { role: 'offensive', weaponType: WEAPON_TYPE.SWORD, icon: '⚔️', prefix: 'Blade' },
  { role: 'defensive', weaponType: WEAPON_TYPE.GUARDIAN, icon: '🛡️', prefix: 'Guardian' },
  { role: 'ranged', weaponType: WEAPON_TYPE.RANGED, icon: '🏹', prefix: 'Ranged' },
]);

function createSkill(roleCfg, pattern) {
  const n = pattern.number;
  const cooldown = n <= 2 ? 3 + n : n <= 7 ? 4 + n * 0.8 : 10 + n;
  return Object.freeze({
    skill_id: `axe_${roleCfg.role}_skill_${n}`,
    skill_name: `${roleCfg.prefix} Art ${n}`,
    skill_type: SKILL_TYPE.ACTIVE_ATTACK,
    weapon_type: roleCfg.weaponType,
    cast_type: pattern.castType,
    hit_count: pattern.hitCount,
    hit_delay: pattern.hitDelay,
    cooldown,
    duration: 0,
    max_level: 30,
    scaling: {
      damage_pct: { min: pattern.damageMin, max: pattern.damageMax },
    },
    icon: roleCfg.icon,
    description: `AXE ${roleCfg.role} Skill ${n}: ${pattern.pattern.replaceAll('_', ' ')}.`,
    animation_ref: `axe_${roleCfg.role}_skill_${n}`,
    vfx_ref: `axe_${roleCfg.role}_skill_${n}_vfx`,
    axe_skill_number: n,
    axe_role: roleCfg.role,
    axe_pattern: pattern.pattern,
    aoe_radius: pattern.aoeRadius || 0,
    critical_allowed: pattern.critAllowed !== false,
    divine: Boolean(pattern.divine),
  });
}

export const AXE_CORE_SKILLS = Object.freeze(
  ROLE_CONFIG.flatMap((role) => AXE_SKILL_PATTERNS.map((pattern) => createSkill(role, pattern))),
);

export function getAXECoreSkillsForRole(role) {
  return AXE_CORE_SKILLS.filter((skill) => skill.axe_role === role);
}

export function getAXECoreSkill(role, number) {
  return AXE_CORE_SKILLS.find(
    (skill) => skill.axe_role === role && skill.axe_skill_number === Number(number),
  ) || null;
}
