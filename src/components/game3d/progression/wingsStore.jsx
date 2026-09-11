// Persistent TwelveSky-style Wing reinforcement for the Mines/game3d runtime.
//
// This replaces the old Halo-clone / kill-currency wing progression. Wings use
// their own 0..40 reinforcement stage (0..120%), 50 CP per attempt, dedicated
// materials, optional Improve charges and Wing Protection charges.

import {
  MAX_WING_LEVEL,
  WING_ATTEMPT_COST,
  WING_MATERIALS,
  getWingEquipmentMultiplier,
  getWingFlatBonusesForLevel,
  getWingMaterial,
  getWingMultiplierForLevel,
  getWingPathById,
  getWingPercent,
  getWingRisk,
  WING_PATHS,
} from './wingsData';
import {
  getContributionState,
  spendContribution,
  subscribeContribution,
} from './contributionStore';
import { characterScopedStorage, subscribeCharacterChange } from '../characterStorage';

const storage = characterScopedStorage('wings_progression_v2');
const legacyStorage = characterScopedStorage('wings_progression_v1');
const listeners = new Set();

const emptyMaterialStock = () => Object.fromEntries(WING_MATERIALS.map((material) => [material.itemId, 0]));

const initialPaths = () => Object.fromEntries(WING_PATHS.map((wing) => [wing.id, {
  stage: 0,
  destroyed: false,
  totalAttempts: 0,
  totalSuccesses: 0,
  totalFailures: 0,
  totalDestroyed: 0,
  lastOutcome: null,
}]));

function migrateLegacyStage(value) {
  const level = Math.max(0, Math.floor(Number(value) || 0));
  if (level <= MAX_WING_LEVEL) return level;
  const legacyMax = level > 96 ? 200 : 96;
  return Math.max(0, Math.min(MAX_WING_LEVEL, Math.round((level / legacyMax) * MAX_WING_LEVEL)));
}

function normalizePathState(input = {}) {
  return {
    stage: migrateLegacyStage(input.stage ?? input.level ?? 0),
    destroyed: !!input.destroyed,
    totalAttempts: Math.max(0, Math.floor(Number(input.totalAttempts) || 0)),
    totalSuccesses: Math.max(0, Math.floor(Number(input.totalSuccesses) || 0)),
    totalFailures: Math.max(0, Math.floor(Number(input.totalFailures) || 0)),
    totalDestroyed: Math.max(0, Math.floor(Number(input.totalDestroyed) || 0)),
    lastOutcome: input.lastOutcome || null,
  };
}

function normalizeState(parsed) {
  const paths = initialPaths();
  Object.keys(parsed?.paths || {}).forEach((id) => {
    if (paths[id]) paths[id] = normalizePathState(parsed.paths[id]);
  });
  return {
    paths,
    equippedPathId: parsed?.equippedPathId && paths[parsed.equippedPathId]
      ? parsed.equippedPathId
      : null,
    materials: { ...emptyMaterialStock(), ...(parsed?.materials || {}) },
    wingProtectionCharges: Math.max(0, Math.floor(Number(parsed?.wingProtectionCharges) || 0)),
    improveCharges: Math.max(0, Math.floor(Number(parsed?.improveCharges) || 0)),
  };
}

function loadState() {
  try {
    const raw = storage.get();
    if (raw) return normalizeState(JSON.parse(raw));
  } catch {}

  try {
    const legacyRaw = legacyStorage.get();
    if (legacyRaw) return normalizeState(JSON.parse(legacyRaw));
  } catch {}

  return normalizeState(null);
}

let state = loadState();
const save = () => storage.set(JSON.stringify(state));
const emit = () => {
  save();
  const snapshot = getWingsState();
  listeners.forEach((fn) => fn(snapshot));
};

subscribeCharacterChange(() => {
  state = loadState();
  emit();
});

// Keep CP values in the wing panel live when Contribution is earned/spent by
// wars, titles, Halo or other systems.
subscribeContribution(() => {
  if (state) emit();
});

function materialStock(materialId) {
  return Math.max(0, Math.floor(Number(state.materials[Number(materialId)]) || 0));
}

function consumeMaterial(materialId, count = 1) {
  const id = Number(materialId);
  const qty = Math.max(1, Math.floor(Number(count) || 1));
  const have = materialStock(id);
  if (have < qty) return false;
  state.materials = { ...state.materials, [id]: have - qty };
  return true;
}

export function getWingsState() {
  const contribution = getContributionState();
  const paths = {};

  WING_PATHS.forEach((definition) => {
    const progress = state.paths[definition.id] || normalizePathState();
    const defaultRisk = getWingRisk(progress.stage, 695, 0, false);
    paths[definition.id] = {
      ...definition,
      ...progress,
      // Legacy UI compatibility while the rest of the game migrates.
      level: progress.stage,
      isMaxLevel: progress.stage >= MAX_WING_LEVEL,
      reinforcementPercent: getWingPercent(progress.stage),
      equipmentMultiplier: getWingEquipmentMultiplier(progress.stage),
      successChance: defaultRisk.successPercent / 100,
      destroyChance: defaultRisk.destroyPercent / 100,
      multiplierBonuses: getWingMultiplierForLevel(progress.stage),
      flatBonuses: getWingFlatBonusesForLevel(definition.id, progress.stage),
      nextFlatBonuses: progress.stage < MAX_WING_LEVEL
        ? getWingFlatBonusesForLevel(definition.id, progress.stage + 1)
        : null,
    };
  });

  return {
    paths,
    equippedPathId: state.equippedPathId,
    equippedWing: state.equippedPathId ? paths[state.equippedPathId] : null,
    attemptCost: WING_ATTEMPT_COST,
    cp: contribution.cp,
    materials: WING_MATERIALS.map((material) => ({
      ...material,
      stock: materialStock(material.itemId),
    })),
    wingProtectionCharges: state.wingProtectionCharges,
    improveCharges: state.improveCharges,
    // Legacy field retained so an older mounted panel does not crash during HMR.
    kills: 0,
  };
}

export function subscribeWings(fn) {
  listeners.add(fn);
  fn(getWingsState());
  return () => listeners.delete(fn);
}

export function equipWings(pathId) {
  const definition = getWingPathById(pathId);
  const progress = state.paths[pathId];
  if (!definition || !progress || progress.destroyed) return false;
  state = { ...state, equippedPathId: pathId };
  emit();
  return true;
}

export function unequipWings() {
  state = { ...state, equippedPathId: null };
  emit();
}

export function grantWingMaterial(materialId, count = 1) {
  const material = getWingMaterial(materialId);
  if (!material || Number(material.itemId) !== Number(materialId)) return { ok: false, reason: 'unknown_material' };
  const qty = Math.max(0, Math.floor(Number(count) || 0));
  if (!qty) return { ok: false, reason: 'invalid_amount' };
  state = {
    ...state,
    materials: { ...state.materials, [material.itemId]: materialStock(material.itemId) + qty },
  };
  emit();
  return { ok: true, itemId: material.itemId, count: qty };
}

export function grantWingProtection(count = 1) {
  const qty = Math.max(0, Math.floor(Number(count) || 0));
  if (!qty) return 0;
  state = { ...state, wingProtectionCharges: state.wingProtectionCharges + qty };
  emit();
  return qty;
}

export function grantWingImproveCharges(count = 1) {
  const qty = Math.max(0, Math.floor(Number(count) || 0));
  if (!qty) return 0;
  state = { ...state, improveCharges: state.improveCharges + qty };
  emit();
  return qty;
}

export function restoreWing(pathId) {
  const progress = state.paths[pathId];
  if (!progress) return false;
  state.paths[pathId] = { ...progress, stage: 0, destroyed: false, lastOutcome: { outcome: 'restored', at: Date.now() } };
  emit();
  return true;
}

export function attemptWingEnhancement(pathId, options = {}) {
  const progress = state.paths[pathId];
  if (!progress) return { ok: false, reason: 'no_path' };
  if (progress.destroyed) return { ok: false, reason: 'wing_destroyed' };
  if (progress.stage >= MAX_WING_LEVEL) return { ok: false, reason: 'max_level' };

  const material = getWingMaterial(options.materialId ?? 695);
  const materialId = material.itemId;
  const stock = materialStock(materialId);
  if (stock < 1) return { ok: false, reason: 'insufficient_material', materialId, have: stock, need: 1 };

  const contribution = getContributionState();
  if (contribution.cp < WING_ATTEMPT_COST) {
    return { ok: false, reason: 'insufficient_cp', have: contribution.cp, need: WING_ATTEMPT_COST };
  }

  const useImproveCharge = options.useImproveCharge !== false && state.improveCharges > 0;
  const useWingProtection = options.useWingProtection !== false && state.wingProtectionCharges > 0;
  const luck = Math.max(0, Number(options.luck) || 0);
  const risk = getWingRisk(progress.stage, materialId, luck, useImproveCharge);

  const spent = spendContribution(WING_ATTEMPT_COST);
  if (!spent.ok) return spent;
  if (!consumeMaterial(materialId, 1)) return { ok: false, reason: 'material_race' };

  let improveCharges = state.improveCharges;
  if (useImproveCharge) improveCharges -= 1;

  const success = Math.random() * 100 < risk.successPercent;
  let stage = progress.stage;
  let destroyed = false;
  let outcome = 'success';
  let protectionConsumed = false;

  if (success) {
    stage = risk.targetStage;
  } else if (material.protectedFailure) {
    outcome = 'no_change';
  } else {
    const destroyRoll = risk.destroyPercent > 0 && Math.random() * 100 < risk.destroyPercent;
    if (destroyRoll && useWingProtection) {
      outcome = 'protected_failure';
      protectionConsumed = true;
      stage = Math.max(0, progress.stage - 1);
    } else if (destroyRoll) {
      outcome = 'destroyed';
      destroyed = true;
      stage = 0;
    } else {
      outcome = 'failed';
      stage = Math.max(0, progress.stage - 1);
    }
  }

  const wingProtectionCharges = protectionConsumed
    ? Math.max(0, state.wingProtectionCharges - 1)
    : state.wingProtectionCharges;

  const nextProgress = {
    ...progress,
    stage,
    destroyed,
    totalAttempts: progress.totalAttempts + 1,
    totalSuccesses: progress.totalSuccesses + (success ? 1 : 0),
    totalFailures: progress.totalFailures + (success ? 0 : 1),
    totalDestroyed: progress.totalDestroyed + (outcome === 'destroyed' ? 1 : 0),
    lastOutcome: {
      outcome,
      success,
      previousStage: progress.stage,
      stage,
      previousPercent: getWingPercent(progress.stage),
      percent: getWingPercent(stage),
      materialId,
      successPercent: risk.successPercent,
      destroyPercent: risk.destroyPercent,
      protectionConsumed,
      improveChargeConsumed: useImproveCharge,
      at: Date.now(),
    },
  };

  state = {
    ...state,
    paths: { ...state.paths, [pathId]: nextProgress },
    equippedPathId: destroyed && state.equippedPathId === pathId ? null : state.equippedPathId,
    wingProtectionCharges,
    improveCharges,
  };
  emit();

  return {
    ok: true,
    success,
    outcome,
    stage,
    level: stage,
    percent: getWingPercent(stage),
    materialId,
    successPercent: risk.successPercent,
    destroyPercent: risk.destroyPercent,
    protectionConsumed,
    improveChargeConsumed: useImproveCharge,
  };
}

export function attemptWingEnhancementBatch(pathId, count, options = {}) {
  const total = Math.max(1, Math.floor(Number(count) || 1));
  let attempts = 0;
  let successes = 0;
  let destroyed = false;
  let last = null;

  for (let i = 0; i < total; i += 1) {
    last = attemptWingEnhancement(pathId, options);
    if (!last.ok) break;
    attempts += 1;
    if (last.success) successes += 1;
    if (last.outcome === 'destroyed') {
      destroyed = true;
      break;
    }
    if ((state.paths[pathId]?.stage || 0) >= MAX_WING_LEVEL) break;
  }

  return {
    attempts,
    successes,
    destroyed,
    finalLevel: state.paths[pathId]?.stage || 0,
    finalStage: state.paths[pathId]?.stage || 0,
    finalPercent: getWingPercent(state.paths[pathId]?.stage || 0),
    last,
  };
}

// Player HUD compatibility. Reinforcement no longer injects Halo attributes;
// real wing base stats will be multiplied in the equipment pipeline.
export function getEquippedWingsMultiplierBonuses() {
  if (!state.equippedPathId) return getWingMultiplierForLevel(0);
  const progress = state.paths[state.equippedPathId];
  if (!progress || progress.destroyed) return getWingMultiplierForLevel(0);
  return getWingMultiplierForLevel(progress.stage);
}

export function getEquippedWingReinforcement() {
  if (!state.equippedPathId) return { stage: 0, percent: 0, multiplier: 1 };
  const progress = state.paths[state.equippedPathId];
  if (!progress || progress.destroyed) return { stage: 0, percent: 0, multiplier: 1 };
  return {
    stage: progress.stage,
    percent: getWingPercent(progress.stage),
    multiplier: getWingEquipmentMultiplier(progress.stage),
  };
}

export function getEquippedWingsFlatBonuses() {
  if (!state.equippedPathId) return getWingFlatBonusesForLevel(null, 0);
  const progress = state.paths[state.equippedPathId];
  if (!progress || progress.destroyed) return getWingFlatBonusesForLevel(null, 0);
  return getWingFlatBonusesForLevel(state.equippedPathId, progress.stage);
}

export function setWingLevel(pathId, level) {
  const progress = state.paths[pathId];
  if (!progress) return;
  state.paths[pathId] = {
    ...progress,
    stage: Math.max(0, Math.min(MAX_WING_LEVEL, Math.round(Number(level) || 0))),
    destroyed: false,
  };
  emit();
}

export function resetWings() {
  state = normalizeState(null);
  emit();
}
