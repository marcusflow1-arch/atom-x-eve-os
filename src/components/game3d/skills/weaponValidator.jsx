// ─── Weapon-Lock Validation ────────────────────────────────────────────
// Before casting a skill, validate the player's currently equipped weapon
// type matches the skill's weapon_type. Universal skills (weapon_type=null)
// are always allowed.

import { getSkillById } from './skillRegistry';
import { getActiveWeaponPath } from '../weaponClassBuffStore';

// Legacy weapon path names → new WEAPON_TYPE.
// The old code uses 'damage' / 'defense' / 'ranged'. New skills declare
// 'sword' / 'guardian' / 'ranged'. Map them here so we don't need to
// rewrite the equipment switcher.
const LEGACY_TO_WEAPON = {
  damage:  'sword',
  defense: 'guardian',
  ranged:  'ranged',
};

export function getEquippedWeaponType() {
  const legacy = getActiveWeaponPath();
  return LEGACY_TO_WEAPON[legacy] || legacy || null;
}

/**
 * Returns { ok: true } if the skill can cast with the currently equipped weapon,
 * { ok: false, reason, required } otherwise.
 */
export function canCastWithEquippedWeapon(skillIdOrObj) {
  const id = typeof skillIdOrObj === 'string' ? skillIdOrObj : skillIdOrObj?.skill_id;
  const skill = getSkillById(id);
  if (!skill) return { ok: false, reason: 'unknown_skill' };

  // Universal — any weapon works.
  if (!skill.weapon_type) return { ok: true };

  const equipped = getEquippedWeaponType();
  if (!equipped) return { ok: false, reason: 'no_weapon_equipped', required: skill.weapon_type };
  if (equipped !== skill.weapon_type) {
    return { ok: false, reason: 'wrong_weapon', required: skill.weapon_type, equipped };
  }
  return { ok: true };
}

// Friendly message for the toast layer.
export function describeWeaponMismatch(check) {
  if (!check || check.ok) return null;
  if (check.reason === 'wrong_weapon')   return `⛔ Requires a ${check.required} weapon equipped`;
  if (check.reason === 'no_weapon_equipped') return `⛔ Requires a ${check.required} weapon equipped`;
  return '⛔ Cannot cast this skill';
}