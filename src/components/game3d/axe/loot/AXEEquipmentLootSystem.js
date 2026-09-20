// AXE equipment-drop adapter.
// Enemy loot can now create REAL gear that enters AXEEquipmentInventoryStore.
// Balance values are provisional and data-driven; ownership/state is the key contract.

import { INVENTORY } from '../../equipment/inventoryData';

export const AXE_EQUIPMENT_DROP_CONFIG = Object.freeze({
  chanceByTier: Object.freeze({
    normal: 0.035,
    elite: 0.12,
    champion: 0.20,
    miniBoss: 0.32,
    caveBoss: 0.55,
    gateBoss: 0.65,
    worldBoss: 0.9,
    boss: 0.9,
  }),
  qualityBands: Object.freeze([0, 5, 10, 15, 20]),
  rarityWeightsByTier: Object.freeze({
    normal: Object.freeze({ common: 62, uncommon: 26, rare: 10, elite: 2 }),
    elite: Object.freeze({ common: 25, uncommon: 38, rare: 27, elite: 9, legendary: 1 }),
    champion: Object.freeze({ uncommon: 24, rare: 42, elite: 25, legendary: 8, heroic: 1 }),
    boss: Object.freeze({ rare: 28, elite: 34, legendary: 28, heroic: 10 }),
  }),
});

const DROP_CATEGORIES = Object.freeze([
  'weapon', 'helm', 'chest', 'gloves', 'legs', 'boots', 'accessory', 'trinket',
]);

const clampRng = (value) => Math.max(0, Math.min(0.999999999, Number(value) || 0));

const weightedPick = (weights, rng) => {
  const entries = Object.entries(weights || {});
  const total = entries.reduce((sum, [, weight]) => sum + Math.max(0, Number(weight) || 0), 0);
  if (!entries.length || total <= 0) return 'common';
  let roll = clampRng(rng()) * total;
  for (const [id, weight] of entries) {
    roll -= Math.max(0, Number(weight) || 0);
    if (roll <= 0) return id;
  }
  return entries[entries.length - 1][0];
};

const normalizeTier = (tier, isBoss) => {
  if (isBoss) return 'boss';
  if (tier === 'worldBoss' || tier === 'caveBoss' || tier === 'gateBoss' || tier === 'miniBoss') return tier;
  return AXE_EQUIPMENT_DROP_CONFIG.chanceByTier[tier] != null ? tier : 'normal';
};

const rarityProfile = (tier) => {
  if (tier === 'boss' || tier === 'worldBoss' || tier === 'caveBoss' || tier === 'gateBoss' || tier === 'miniBoss') {
    return AXE_EQUIPMENT_DROP_CONFIG.rarityWeightsByTier.boss;
  }
  return AXE_EQUIPMENT_DROP_CONFIG.rarityWeightsByTier[tier]
    || AXE_EQUIPMENT_DROP_CONFIG.rarityWeightsByTier.normal;
};

const scaleForRarity = (rarity) => ({
  common: 1,
  uncommon: 1.08,
  rare: 1.18,
  elite: 1.32,
  legendary: 1.52,
  heroic: 1.8,
}[rarity] || 1);

const buildTemplatePool = () =>
  DROP_CATEGORIES.flatMap((category) =>
    (INVENTORY[category] || []).map((item) => ({
      ...item,
      sourceCategory: category,
    }))
  );

export function rollAXEEquipmentDrop(enemyTier = 'normal', isBoss = false, {
  rng = Math.random,
  playerLevel = 1,
} = {}) {
  const tier = normalizeTier(enemyTier, isBoss);
  const chance = AXE_EQUIPMENT_DROP_CONFIG.chanceByTier[tier]
    ?? (isBoss ? AXE_EQUIPMENT_DROP_CONFIG.chanceByTier.boss : AXE_EQUIPMENT_DROP_CONFIG.chanceByTier.normal);

  if (clampRng(rng()) > chance) return null;

  const pool = buildTemplatePool();
  if (!pool.length) return null;

  const template = pool[Math.floor(clampRng(rng()) * pool.length)];
  const rarity = weightedPick(rarityProfile(tier), rng);
  const qualityBands = AXE_EQUIPMENT_DROP_CONFIG.qualityBands;
  const qualityBand = qualityBands[Math.floor(clampRng(rng()) * qualityBands.length)];
  const rarityScale = scaleForRarity(rarity);
  const levelScale = 1 + Math.max(0, Number(playerLevel || 1) - 1) * 0.025;
  const qualityScale = 1 + Number(qualityBand || 0) / 100;
  const statScale = rarityScale * levelScale * qualityScale;

  const scaledBaseStats = Object.fromEntries(
    Object.entries(template.baseStats || {}).map(([key, value]) => [
      key,
      Number((Number(value || 0) * statScale).toFixed(
        Math.abs(Number(value || 0)) < 2 ? 2 : 0,
      )),
    ]),
  );

  const displayName = rarity === 'common'
    ? template.name
    : `${rarity[0].toUpperCase() + rarity.slice(1)} ${template.name}`;

  return {
    dropId: `axe_gear_drop_${Date.now()}_${Math.floor(clampRng(rng()) * 1e8).toString(36)}`,
    id: template.id,
    templateId: template.templateId || template.id,
    name: displayName,
    category: 'equipment',
    equipmentCategory: template.sourceCategory,
    rarity,
    qualityBand,
    icon: template.slot === 'weapon' ? '⚔️' : '🛡️',
    equipmentItem: {
      ...template,
      id: template.id,
      templateId: template.templateId || template.id,
      name: displayName,
      rarity,
      qualityBand,
      itemLevel: Math.max(1, Math.floor(Number(playerLevel) || 1)),
      level: Math.max(1, Math.floor(Number(playerLevel) || 1)),
      equipped: false,
      locked: false,
      baseStats: scaledBaseStats,
      rolledStats: {},
      sockets: [],
      aura: null,
      bindState: 'unbound',
      tradeable: true,
    },
  };
}
