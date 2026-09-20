// AXE Prompt 026 — Vanity / Costume overlay with optional stats.
// Costumes are appearance overlays. They never replace the underlying combat
// equipment or its stats. A costume definition may be cosmetic-only or carry
// a separate, explicit stat package.

export const AXE_COSTUME_SERVICE_DESCRIPTOR = Object.freeze({
  id: 'costume',
  label: 'Wardrobe',
  category: 'appearance',
  remoteAccessible: true,
});

export const AXE_COSTUME_DEFINITIONS = Object.freeze({
  axe_costume_wanderer: Object.freeze({
    id: 'axe_costume_wanderer',
    name: 'Wanderer Outfit',
    rarity: 'common',
    cosmeticOnly: true,
    appearanceAssetId: 'axe_costume_wanderer',
    statPackage: Object.freeze({}),
    source: 'starter',
    seasonalTag: null,
    dyeChannels: Object.freeze(['primary', 'secondary', 'accent']),
  }),
  axe_costume_skyguard: Object.freeze({
    id: 'axe_costume_skyguard',
    name: 'Skyguard Ceremonial Set',
    rarity: 'rare',
    cosmeticOnly: false,
    appearanceAssetId: 'axe_costume_skyguard',
    statPackage: Object.freeze({
      strength: 1,
      dexterity: 1,
      constitution: 1,
      focus: 1,
    }),
    source: 'prestige',
    seasonalTag: null,
    dyeChannels: Object.freeze(['primary', 'secondary', 'accent']),
  }),
  axe_costume_summer_festival: Object.freeze({
    id: 'axe_costume_summer_festival',
    name: 'Summer Festival Attire',
    rarity: 'elite',
    cosmeticOnly: false,
    appearanceAssetId: 'axe_costume_summer_festival',
    statPackage: Object.freeze({ maxHP: 25, critDefense: 0.75 }),
    source: 'event',
    seasonalTag: 'summer',
    dyeChannels: Object.freeze(['primary', 'secondary']),
  }),
  axe_costume_winter_guardian: Object.freeze({
    id: 'axe_costume_winter_guardian',
    name: 'Winter Guardian Attire',
    rarity: 'heroic',
    cosmeticOnly: false,
    appearanceAssetId: 'axe_costume_winter_guardian',
    statPackage: Object.freeze({ defense: 5, maxHP: 40 }),
    source: 'event',
    seasonalTag: 'winter',
    dyeChannels: Object.freeze(['primary', 'secondary', 'accent']),
  }),
});

export function getAXECostumeDefinition(costumeId) {
  return AXE_COSTUME_DEFINITIONS[costumeId] || null;
}

export function getAXECostumeBonuses(costumeId) {
  const def = getAXECostumeDefinition(costumeId);
  return def ? { ...(def.statPackage || {}) } : {};
}

export function normalizeAXECostumeAppearance(state = {}) {
  const def = getAXECostumeDefinition(state.equippedCostumeId);
  return {
    costumeId: def?.id || null,
    hidden: !!state.hidden,
    appearanceAssetId: state.hidden ? null : def?.appearanceAssetId || null,
    dyes: { ...(state.dyes?.[def?.id] || {}) },
  };
}
