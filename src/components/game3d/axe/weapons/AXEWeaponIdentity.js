// Canonical weapon identity resolver.
// One equipped weapon item determines:
//   1) weapon mastery family,
//   2) broad AXE combat role,
//   3) compatible advanced-class weapon type.
// UI is never allowed to invent a second "active weapon" disconnected from gear.

import { resolveAdvancedWeaponType } from '../../talents/advancedClassRegistry';
import {
  AXE_WEAPON_ROLES,
  getLegacyWeaponPathFromAXERole,
} from '../factions/AXEFactionWeaponConfig';

const TOKEN_RULES = Object.freeze([
  Object.freeze({ tokens: ['bow', 'crossbow', 'arrow'], masteryWeaponId: 'bow', role: AXE_WEAPON_ROLES.RANGED }),
  Object.freeze({ tokens: ['dual blade', 'dual_blade', 'dagger', 'twin blade'], masteryWeaponId: 'dual_blades', role: AXE_WEAPON_ROLES.DEFENSIVE }),
  Object.freeze({ tokens: ['fan', 'sky', 'orb', 'celestial'], masteryWeaponId: 'sky', role: AXE_WEAPON_ROLES.OFFENSIVE }),
  Object.freeze({ tokens: ['sword', 'katana', 'blade', 'saber'], masteryWeaponId: 'sword', role: AXE_WEAPON_ROLES.OFFENSIVE }),
]);

export function inferAXEMasteryWeaponId(item) {
  if (!item) return null;
  if (item.masteryWeaponId) return item.masteryWeaponId;

  const haystack = [
    item.name,
    item.type,
    item.weaponFamily,
    item.templateId,
    item.id,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const match = TOKEN_RULES.find((rule) =>
    rule.tokens.some((token) => haystack.includes(token))
  );
  return match?.masteryWeaponId || 'sword';
}

export function inferAXEWeaponRole(item, masteryWeaponId = null) {
  if (!item) return null;
  if (item.axeWeaponRole) return item.axeWeaponRole;

  const masteryId = masteryWeaponId || inferAXEMasteryWeaponId(item);
  if (masteryId === 'bow') return AXE_WEAPON_ROLES.RANGED;
  if (masteryId === 'dual_blades') return AXE_WEAPON_ROLES.DEFENSIVE;
  return AXE_WEAPON_ROLES.OFFENSIVE;
}

export function resolveAXEWeaponIdentity(item) {
  if (!item) {
    return {
      itemId: null,
      masteryWeaponId: null,
      role: null,
      legacyPath: null,
      advancedWeaponType: null,
    };
  }

  const masteryWeaponId = inferAXEMasteryWeaponId(item);
  const role = inferAXEWeaponRole(item, masteryWeaponId);
  return {
    itemId: item.instanceId || item.id || null,
    templateId: item.templateId || item.id || null,
    itemName: item.name || 'Weapon',
    masteryWeaponId,
    role,
    legacyPath: getLegacyWeaponPathFromAXERole(role),
    advancedWeaponType: resolveAdvancedWeaponType(masteryWeaponId),
  };
}
