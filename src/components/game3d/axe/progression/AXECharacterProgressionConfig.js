// AXE Prompt 011 — character level, stats and power progression.
// Exact legacy caps/formulas intentionally remain configurable until verified.

export const AXE_PRIMARY_STATS = Object.freeze({
  Strength: 'strength',
  Agility: 'dexterity',
  Vitality: 'constitution',
  Spirit: 'focus',
});

export const AXE_POWER_TIERS = Object.freeze([
  Object.freeze({ id: 'AXE_Power_Normal', name: 'Normal', order: 0 }),
  Object.freeze({ id: 'AXE_Power_Master', name: 'Master', order: 1 }),
  Object.freeze({ id: 'AXE_Power_Adept', name: 'Adept Master', order: 2 }),
  Object.freeze({ id: 'AXE_Power_God', name: 'God', order: 3 }),
  Object.freeze({ id: 'AXE_Power_Rebirth', name: 'Rebirth', order: 4 }),
  Object.freeze({ id: 'AXE_Power_Palace', name: 'Palace Rank', order: 5 }),
  Object.freeze({ id: 'AXE_Power_Ascension', name: 'Ascension', order: 6 }),
]);

export const AXE_CHARACTER_PROGRESSION_CONFIG = Object.freeze({
  statPointsPerLevel: 3,
  normalLevelCap: null, // unresolved: leave uncapped until verified/balanced.
  godRealmUnlock: Object.freeze({
    tierId: 'AXE_Power_God',
    minimumTierLevel: 1,
  }),
  primaryStats: AXE_PRIMARY_STATS,
  powerTiers: AXE_POWER_TIERS,
});

export function createDefaultAXEPowerProgression() {
  return {
    tierId: 'AXE_Power_Normal',
    tierLevel: 0,
    masterLevel: 0,
    adeptLevel: 0,
    godLevel: 0,
    rebirthCount: 0,
    palaceRank: 0,
    ascensionLevel: 0,
  };
}

export function normalizeAXEPowerProgression(input = {}) {
  return {
    ...createDefaultAXEPowerProgression(),
    ...input,
    tierLevel: Math.max(0, Number(input.tierLevel || 0)),
    masterLevel: Math.max(0, Number(input.masterLevel || 0)),
    adeptLevel: Math.max(0, Number(input.adeptLevel || 0)),
    godLevel: Math.max(0, Number(input.godLevel || 0)),
    rebirthCount: Math.max(0, Number(input.rebirthCount || 0)),
    palaceRank: Math.max(0, Number(input.palaceRank || 0)),
    ascensionLevel: Math.max(0, Number(input.ascensionLevel || 0)),
  };
}

export function canEnterAXEGodRealm(powerProgression) {
  const p = normalizeAXEPowerProgression(powerProgression);
  return p.godLevel >= AXE_CHARACTER_PROGRESSION_CONFIG.godRealmUnlock.minimumTierLevel;
}
