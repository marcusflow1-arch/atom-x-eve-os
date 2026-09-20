// AXE Prompt 012 — factions, weapon families and combat identity.
// Exact legacy faction/weapon names remain intentionally unresolved. AXE uses
// original placeholders and maps the existing browser weapon paths into the
// three required combat identities.

export const AXE_WEAPON_ROLES = Object.freeze({
  OFFENSIVE: 'offensive',
  DEFENSIVE: 'defensive',
  RANGED: 'ranged',
});

export const AXE_LEGACY_WEAPON_PATH_TO_ROLE = Object.freeze({
  damage: AXE_WEAPON_ROLES.OFFENSIVE,
  defense: AXE_WEAPON_ROLES.DEFENSIVE,
  ranged: AXE_WEAPON_ROLES.RANGED,
});

export const AXE_ROLE_TO_LEGACY_WEAPON_PATH = Object.freeze({
  [AXE_WEAPON_ROLES.OFFENSIVE]: 'damage',
  [AXE_WEAPON_ROLES.DEFENSIVE]: 'defense',
  [AXE_WEAPON_ROLES.RANGED]: 'ranged',
});

export const AXE_WEAPON_FAMILIES = Object.freeze({
  blade: Object.freeze({
    id: 'AXE_WeaponFamily_Blade',
    role: AXE_WEAPON_ROLES.OFFENSIVE,
    handedness: 'one-or-two',
    ranged: false,
  }),
  polearm: Object.freeze({
    id: 'AXE_WeaponFamily_Polearm',
    role: AXE_WEAPON_ROLES.DEFENSIVE,
    handedness: 'two',
    ranged: false,
  }),
  bow: Object.freeze({
    id: 'AXE_WeaponFamily_Bow',
    role: AXE_WEAPON_ROLES.RANGED,
    handedness: 'two',
    ranged: true,
    projectile: true,
  }),
});

const makeFaction = (index) => Object.freeze({
  id: `AXE_Faction_${index}`,
  displayName: `Faction ${index}`,
  index,
  capitalId: `AXE_City_Faction${index}_Capital`,
  godRealmId: `AXE_DivineRealm_Faction${index}`,
  hostilityGroup: 'faction-war',
  weaponFamilies: Object.freeze({
    offensive: AXE_WEAPON_FAMILIES.blade.id,
    defensive: AXE_WEAPON_FAMILIES.polearm.id,
    ranged: AXE_WEAPON_FAMILIES.bow.id,
  }),
  visualIdentity: Object.freeze({
    colorToken: `faction-${index}`,
    emblemId: `AXE_Emblem_Faction${index}`,
  }),
});

export const AXE_FACTIONS = Object.freeze([
  makeFaction(1),
  makeFaction(2),
  makeFaction(3),
]);

export function getAXEFaction(id) {
  return AXE_FACTIONS.find((f) => f.id === id) || null;
}

export function getAXEWeaponRoleFromLegacyPath(path) {
  return AXE_LEGACY_WEAPON_PATH_TO_ROLE[path] || AXE_WEAPON_ROLES.OFFENSIVE;
}

export function getLegacyWeaponPathFromAXERole(role) {
  return AXE_ROLE_TO_LEGACY_WEAPON_PATH[role] || 'damage';
}

export function canAXEFactionUseWeaponRole(factionId, role) {
  const faction = getAXEFaction(factionId);
  if (!faction) return factionId === 'AXE_Faction_Unassigned';
  return Boolean(faction.weaponFamilies?.[role]);
}
