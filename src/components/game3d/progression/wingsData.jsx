// TwelveSky-style Wing reinforcement rules for the Mines/game3d runtime.
//
// Wings are intentionally independent from Halo. Fenrir's server models wing
// reinforcement as 0..40 internal enchant stages. Each stage represents 3%,
// which gives the familiar 0..120% presentation used by the client.
//
// Verified Fenrir behavior mirrored here:
//   • max stage 40 => 120%
//   • every attempt costs 50 Contribution Points
//   • standard materials add +1 / +2 / +3 / +4 stages
//   • a guaranteed material fills the wing to stage 40
//   • success = max(5, 103 - targetStage*3 + floor(luck/100))
//   • Improve charge adds +5 success chance
//   • failures normally reduce reinforcement by one stage
//   • above stage 20 (60%), a second roll can destroy the wing
//   • Wing Protection converts destruction into a one-stage loss
//   • the protected +1 material never loses/destroys the wing on failure
//
// The actual wing item's base combat stats belong to the equipment/item data
// pipeline. This module only owns reinforcement. Compatibility helpers return
// zero direct stat bonuses so the old Halo-clone bonuses cannot leak back in.

export const MAX_WING_LEVEL = 40;
export const MAX_WING_STAGE = MAX_WING_LEVEL;
export const WING_PERCENT_PER_STAGE = 3;
export const MAX_WING_PERCENT = MAX_WING_STAGE * WING_PERCENT_PER_STAGE;
export const WING_SAFE_STAGE = 20;
export const WING_SAFE_PERCENT = WING_SAFE_STAGE * WING_PERCENT_PER_STAGE;
export const WING_CP_COST = 50;
// Compatibility alias for older UI/store imports. It is CP, never kills.
export const WING_ATTEMPT_COST = WING_CP_COST;
export const WING_IMPROVE_CHANCE_BONUS = 5;

export const WING_MATERIALS = Object.freeze([
  {
    itemId: 695,
    id: 'wing_stone_1',
    label: '+3%',
    shortLabel: '+1 Stage',
    stageValue: 1,
    guaranteed: false,
    protectedFailure: false,
  },
  {
    itemId: 696,
    id: 'wing_stone_2',
    label: '+6%',
    shortLabel: '+2 Stages',
    stageValue: 2,
    guaranteed: false,
    protectedFailure: false,
  },
  {
    itemId: 698,
    id: 'wing_stone_3',
    label: '+9%',
    shortLabel: '+3 Stages',
    stageValue: 3,
    guaranteed: false,
    protectedFailure: false,
  },
  {
    itemId: 2397,
    id: 'wing_stone_4',
    label: '+12%',
    shortLabel: '+4 Stages',
    stageValue: 4,
    guaranteed: false,
    protectedFailure: false,
  },
  {
    itemId: 826,
    id: 'wing_guaranteed',
    label: 'Guaranteed',
    shortLabel: 'Fill to 120%',
    stageValue: MAX_WING_STAGE,
    guaranteed: true,
    protectedFailure: false,
  },
  {
    itemId: 8106,
    id: 'wing_protected_material',
    label: 'Protected +3%',
    shortLabel: '+1 Stage · No Loss',
    stageValue: 1,
    guaranteed: false,
    protectedFailure: true,
  },
]);

export const WING_MATERIAL_BY_ITEM_ID = Object.freeze(
  Object.fromEntries(WING_MATERIALS.map((material) => [material.itemId, material])),
);

// Atom X Eve keeps multiple original wing appearances. They are cosmetic/item
// identities; reinforcement mechanics are shared and no longer invent separate
// Halo-style progression paths.
export const WING_PATHS = Object.freeze([
  {
    id: 'endurance',
    name: 'Wings of Endurance',
    icon: '🛡️',
    color: '#22c55e',
    primaryStat: 'equipment',
    description: 'Defensive wing appearance. Combat values come from the equipped wing item; reinforcement scales that item.',
  },
  {
    id: 'strength',
    name: 'Wings of Strength',
    icon: '⚔️',
    color: '#ef4444',
    primaryStat: 'equipment',
    description: 'Offensive wing appearance. Combat values come from the equipped wing item; reinforcement scales that item.',
  },
  {
    id: 'precision',
    name: 'Wings of Precision',
    icon: '🏹',
    color: '#38bdf8',
    primaryStat: 'equipment',
    description: 'Precision wing appearance. Combat values come from the equipped wing item; reinforcement scales that item.',
  },
  {
    id: 'spirit',
    name: 'Wings of Spirit',
    icon: '✨',
    color: '#a855f7',
    primaryStat: 'equipment',
    description: 'Spirit wing appearance. Combat values come from the equipped wing item; reinforcement scales that item.',
  },
]);

export function getWingPathById(id) {
  return WING_PATHS.find((path) => path.id === id) || null;
}

export function getWingMaterial(materialId = 695) {
  if (typeof materialId === 'object' && materialId?.itemId) return getWingMaterial(materialId.itemId);
  const numericId = Number(materialId);
  return WING_MATERIAL_BY_ITEM_ID[numericId] || WING_MATERIALS[0];
}

export function clampWingStage(stage) {
  return Math.max(0, Math.min(MAX_WING_STAGE, Math.floor(Number(stage) || 0)));
}

export function getWingPercent(stage) {
  return clampWingStage(stage) * WING_PERCENT_PER_STAGE;
}

export function getWingEquipmentMultiplier(stage) {
  return 1 + getWingPercent(stage) / 100;
}

export function getWingTargetStage(currentStage, materialId = 695) {
  const current = clampWingStage(currentStage);
  const material = getWingMaterial(materialId);
  if (material.guaranteed) return MAX_WING_STAGE;
  return Math.min(MAX_WING_STAGE, current + material.stageValue);
}

export function getWingSuccessPercent(currentStage, materialId = 695, luck = 0, improveCharge = false) {
  const current = clampWingStage(currentStage);
  if (current >= MAX_WING_STAGE) return 0;
  const material = getWingMaterial(materialId);
  if (material.guaranteed) return 100;
  const target = getWingTargetStage(current, material.itemId);
  const luckBonus = Math.floor(Math.max(0, Number(luck) || 0) / 100);
  const improveBonus = improveCharge ? WING_IMPROVE_CHANCE_BONUS : 0;
  return Math.max(5, Math.min(100, 103 - target * 3 + luckBonus + improveBonus));
}

export function getWingSuccessChance(currentStage, options = {}) {
  const materialId = typeof options === 'number' ? options : options.materialId ?? 695;
  const luck = typeof options === 'object' ? options.luck ?? 0 : 0;
  const improveCharge = typeof options === 'object' ? !!options.improveCharge : false;
  return getWingSuccessPercent(currentStage, materialId, luck, improveCharge) / 100;
}

export function getWingDestroyPercent(currentStage, materialId = 695, luck = 0) {
  const current = clampWingStage(currentStage);
  const material = getWingMaterial(materialId);
  if (material.protectedFailure || material.guaranteed) return 0;
  const target = getWingTargetStage(current, material.itemId);
  if (target <= WING_SAFE_STAGE) return 0;

  const luckBonus = Math.floor(Math.max(0, Number(luck) || 0) / 100);
  let chance = -57 + target * 3 - luckBonus;
  if (chance <= 5) chance -= 5;
  return Math.max(0, Math.min(100, chance));
}

export function getWingRisk(currentStage, materialId = 695, luck = 0, improveCharge = false) {
  const material = getWingMaterial(materialId);
  const targetStage = getWingTargetStage(currentStage, material.itemId);
  return {
    currentStage: clampWingStage(currentStage),
    currentPercent: getWingPercent(currentStage),
    targetStage,
    targetPercent: getWingPercent(targetStage),
    successPercent: getWingSuccessPercent(currentStage, material.itemId, luck, improveCharge),
    destroyPercent: getWingDestroyPercent(currentStage, material.itemId, luck),
    safe: targetStage <= WING_SAFE_STAGE || material.protectedFailure || material.guaranteed,
    material,
  };
}

// Compatibility hook for playerHUDStore. Wing reinforcement must not inject
// Halo attribute points. The equipment pipeline consumes reinforcementPct /
// equipmentMultiplier when real wing items are wired into derived stats.
export function getWingMultiplierForLevel(stage) {
  return {
    strength: 0,
    agility: 0,
    dexterity: 0,
    vitality: 0,
    constitution: 0,
    spirit: 0,
    focus: 0,
    criticalChance: 0,
    criticalDefense: 0,
    reinforcementPct: getWingPercent(stage),
    equipmentMultiplier: getWingEquipmentMultiplier(stage),
  };
}

// Legacy flat-bonus hook retained until the Fenrir wing item rows are consumed
// by the equipment system. Returning zero removes the previous invented Lv200
// specialization curve without breaking current playerHUDStore imports.
export function getWingFlatBonusesForLevel() {
  return {
    hp: 0,
    damage: 0,
    defense: 0,
    critChance: 0,
    critDamage: 0,
    criticalDefense: 0,
  };
}
