// AXE Prompt 028 — Cape system.
// Capes are a dedicated prestige equipment layer with their own upgrade recipes,
// event identities, and stat/modifier packages.

export const AXE_CAPE_SERVICE_DESCRIPTOR = Object.freeze({
  id: 'cape',
  label: 'Capes',
  category: 'progression',
  remoteAccessible: true,
});

export const AXE_CAPE_DEFINITIONS = Object.freeze({
  axe_cape_trainee: Object.freeze({
    id: 'axe_cape_trainee',
    name: 'Trainee Cape',
    grade: 'starter',
    rarity: 'common',
    appearanceAssetId: 'axe_cape_trainee',
    eventTag: null,
    stats: Object.freeze({ defense: 2, criticalDefense: 0.5 }),
    modifiers: Object.freeze({}),
    upgradeTo: 'axe_cape_warlord',
  }),
  axe_cape_warlord: Object.freeze({
    id: 'axe_cape_warlord',
    name: 'Warlord Mantle',
    grade: 'prestige',
    rarity: 'elite',
    appearanceAssetId: 'axe_cape_warlord',
    eventTag: null,
    stats: Object.freeze({ hp: 120, damage: 18, defense: 26, criticalDefense: 3 }),
    modifiers: Object.freeze({ resourceCostReductionPct: 2, skillLevelBonus: 1 }),
    upgradeTo: 'axe_cape_sovereign',
  }),
  axe_cape_sovereign: Object.freeze({
    id: 'axe_cape_sovereign',
    name: 'Sovereign War Mantle',
    grade: 'endgame',
    rarity: 'legendary',
    appearanceAssetId: 'axe_cape_sovereign',
    eventTag: null,
    stats: Object.freeze({ hp: 350, damage: 55, defense: 70, critChance: 1.5, criticalDefense: 6 }),
    modifiers: Object.freeze({ resourceCostReductionPct: 4, skillLevelBonus: 2 }),
    upgradeTo: 'axe_cape_gods',
  }),
  axe_cape_gods: Object.freeze({
    id: 'axe_cape_gods',
    name: 'Mantle of the Gods',
    grade: 'divine',
    rarity: 'heroic',
    appearanceAssetId: 'axe_cape_gods',
    eventTag: null,
    stats: Object.freeze({ hp: 650, damage: 100, defense: 120, critChance: 2.5, critDamage: 6, criticalDefense: 10 }),
    modifiers: Object.freeze({ resourceCostReductionPct: 6, skillLevelBonus: 3 }),
    upgradeTo: null,
  }),
  axe_cape_summer: Object.freeze({
    id: 'axe_cape_summer',
    name: 'Summer Festival Cape',
    grade: 'event',
    rarity: 'rare',
    appearanceAssetId: 'axe_cape_summer',
    eventTag: 'summer',
    stats: Object.freeze({ hp: 100, damage: 15, critChance: 1 }),
    modifiers: Object.freeze({}),
    upgradeTo: null,
  }),
  axe_cape_winter: Object.freeze({
    id: 'axe_cape_winter',
    name: 'Winter Festival Cape',
    grade: 'event',
    rarity: 'rare',
    appearanceAssetId: 'axe_cape_winter',
    eventTag: 'winter',
    stats: Object.freeze({ hp: 140, defense: 20, criticalDefense: 2 }),
    modifiers: Object.freeze({}),
    upgradeTo: null,
  }),
});

export const AXE_CAPE_UPGRADE_RECIPES = Object.freeze({
  axe_cape_trainee: Object.freeze({
    targetId: 'axe_cape_warlord',
    cost: Object.freeze({ cape_thread: 8, war_crest: 3, gold: 2500 }),
    successChance: 0.9,
    preserve: Object.freeze(['reinforcement', 'sockets', 'gems', 'refine']),
  }),
  axe_cape_warlord: Object.freeze({
    targetId: 'axe_cape_sovereign',
    cost: Object.freeze({ cape_thread: 18, war_crest: 8, divine_fragment: 2, gold: 10000 }),
    successChance: 0.72,
    preserve: Object.freeze(['reinforcement', 'sockets', 'gems', 'refine']),
  }),
  axe_cape_sovereign: Object.freeze({
    targetId: 'axe_cape_gods',
    cost: Object.freeze({ cape_thread: 30, war_crest: 15, divine_fragment: 8, gold: 30000 }),
    successChance: 0.5,
    preserve: Object.freeze(['reinforcement', 'sockets', 'gems', 'refine']),
  }),
});

export function getAXECapeDefinition(capeId) {
  return AXE_CAPE_DEFINITIONS[capeId] || null;
}

export function getAXECapeUpgradeRecipe(capeId) {
  return AXE_CAPE_UPGRADE_RECIPES[capeId] || null;
}

export function getAXECapeBonuses(capeId) {
  const def = getAXECapeDefinition(capeId);
  return def ? { ...(def.stats || {}) } : {};
}

export function getAXECapeModifiers(capeId) {
  const def = getAXECapeDefinition(capeId);
  return def ? { ...(def.modifiers || {}) } : {};
}

export function previewAXECapeUpgrade(capeId) {
  const source = getAXECapeDefinition(capeId);
  const recipe = getAXECapeUpgradeRecipe(capeId);
  if (!source || !recipe) return { ok: false, reason: 'NO_UPGRADE' };
  const target = getAXECapeDefinition(recipe.targetId);
  if (!target) return { ok: false, reason: 'TARGET_MISSING' };
  return {
    ok: true,
    source,
    target,
    cost: { ...recipe.cost },
    successChance: recipe.successChance,
    preserve: [...recipe.preserve],
  };
}
