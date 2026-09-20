// AXE Prompt 005 — account/character entry contracts and first-spawn data.

export const AXE_DEFAULT_FACTION_ID = 'AXE_Faction_Unassigned';
export const AXE_DEFAULT_WEAPON_STYLE_ID = 'AXE_WeaponStyle_Unassigned';

export const AXE_SPAWN_PROFILES = Object.freeze({
  AXE_Spawn_StarterCapitalApproach: Object.freeze({
    id: 'AXE_Spawn_StarterCapitalApproach',
    name: 'Starter Capital Approach',
    regionId: 'AXE_Region_FirstTerritory',
    position: Object.freeze({ x: 0, y: 0, z: -35 }),
    yaw: 0,
    safeZone: true,
    tutorialIntroId: 'AXE_Tutorial_FirstArrival',
  }),
});

export function validateAXECharacterName(name) {
  const value = String(name || '').trim();
  if (value.length < 2) return { ok: false, reason: 'too-short' };
  if (value.length > 24) return { ok: false, reason: 'too-long' };
  if (!/^[A-Za-z0-9 _'-]+$/.test(value)) return { ok: false, reason: 'invalid-characters' };
  return { ok: true, value };
}

export function makeAXECharacterEntryFields(overrides = {}) {
  return {
    factionId: overrides.factionId || AXE_DEFAULT_FACTION_ID,
    startingWeaponStyleId: overrides.startingWeaponStyleId || AXE_DEFAULT_WEAPON_STYLE_ID,
    firstSpawnProfileId: overrides.firstSpawnProfileId || 'AXE_Spawn_StarterCapitalApproach',
    axeEntryVersion: 1,
    firstSpawnCompleted: Boolean(overrides.firstSpawnCompleted),
  };
}

export function getAXESpawnProfile(character) {
  const id = character?.firstSpawnProfileId || 'AXE_Spawn_StarterCapitalApproach';
  return AXE_SPAWN_PROFILES[id] || AXE_SPAWN_PROFILES.AXE_Spawn_StarterCapitalApproach;
}
