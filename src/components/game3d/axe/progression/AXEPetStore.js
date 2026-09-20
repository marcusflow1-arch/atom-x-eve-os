// AXE Prompt 032 — character-scoped Pet progression/store.

import { characterScopedStorage, subscribeCharacterChange } from '../../characterStorage';
import { setActiveCompanion, setMounted } from '../../companionStore';
import {
  AXE_PET_CONFIG,
  addAXEPetXP,
  createAXEPetInstance,
  getAXEPetDefinition,
  getAXEPetStatBonuses,
  increaseAXEPetOverEnchant,
  normalizeAXEPetInstance,
} from './AXEPetSystem';
import { previewAXEPetFusion } from './AXEPetTierSystem';

const storage = characterScopedStorage('axe_pet_progression_v1');

const starter = () => ({
  pets: [createAXEPetInstance('shadow_wolf', 'axe_pet_shadow_wolf_starter')],
  activeRegisteredPetId: null,
  summonedPetId: null,
  materials: { pet_feed: 12, pet_catalyst: 8, pet_soul: 8, god_essence: 1 },
});

const load = () => {
  try {
    const raw = storage.get();
    if (!raw) return starter();
    const parsed = JSON.parse(raw);
    return {
      ...starter(),
      ...parsed,
      pets: (parsed.pets || []).map(normalizeAXEPetInstance).filter(Boolean),
      materials: { ...starter().materials, ...(parsed.materials || {}) },
    };
  } catch {
    return starter();
  }
};

let state = load();
const listeners = new Set();

const emit = () => {
  storage.set(JSON.stringify(state));
  const snapshot = getAXEPetState();
  listeners.forEach((fn) => fn(snapshot));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('axePetChanged', { detail: snapshot }));
  }
};

subscribeCharacterChange(() => {
  state = load();
  listeners.forEach((fn) => fn(getAXEPetState()));
});

export function getAXEPetState() {
  return {
    ...state,
    pets: state.pets.map((p) => ({ ...p, bonuses: getAXEPetStatBonuses(p) })),
    materials: { ...state.materials },
  };
}

export function subscribeAXEPets(fn) {
  listeners.add(fn);
  fn(getAXEPetState());
  return () => listeners.delete(fn);
}

export function getRegisteredAXEPet() {
  return state.pets.find((p) => p.instanceId === state.activeRegisteredPetId) || null;
}

export function getRegisteredAXEPetBonuses() {
  const pet = getRegisteredAXEPet();
  return pet ? getAXEPetStatBonuses(pet) : { hp: 0, chi: 0, defense: 0, damage: 0 };
}

export function registerAXEPet(instanceId) {
  const pet = state.pets.find((p) => p.instanceId === instanceId);
  if (!pet) return { ok: false, reason: 'PET_MISSING' };
  state = {
    ...state,
    activeRegisteredPetId: instanceId,
    pets: state.pets.map((p) => ({ ...p, registered: p.instanceId === instanceId })),
  };
  emit();
  return { ok: true };
}

export function summonAXEPet(instanceId) {
  const pet = state.pets.find((p) => p.instanceId === instanceId);
  if (!pet) return { ok: false, reason: 'PET_MISSING' };
  const def = getAXEPetDefinition(pet.definitionId);
  state = {
    ...state,
    summonedPetId: instanceId,
    pets: state.pets.map((p) => ({ ...p, summoned: p.instanceId === instanceId })),
  };
  if (def?.modelRef) {
    setActiveCompanion(def.modelRef);
    setMounted(false);
  }
  emit();
  return { ok: true };
}

export function unsummonAXEPet() {
  state = {
    ...state,
    summonedPetId: null,
    pets: state.pets.map((p) => ({ ...p, summoned: false })),
  };
  emit();
  return { ok: true };
}

export function awardAXEPetXP(instanceId, amount, source = 'pve') {
  const index = state.pets.findIndex((p) => p.instanceId === instanceId);
  if (index < 0) return { ok: false, reason: 'PET_MISSING' };
  const result = addAXEPetXP(state.pets[index], amount, source);
  if (!result.ok) return result;
  state = {
    ...state,
    pets: state.pets.map((p, i) => i === index ? result.pet : p),
  };
  emit();
  return result;
}

export function feedAXEPet(instanceId, count = 1) {
  const n = Math.max(1, Math.floor(Number(count) || 1));
  if ((state.materials.pet_feed || 0) < n) return { ok: false, reason: 'INSUFFICIENT_FEED' };
  state = {
    ...state,
    materials: { ...state.materials, pet_feed: state.materials.pet_feed - n },
  };
  return awardAXEPetXP(instanceId, 25 * n, 'feeding');
}

export function overEnchantAXEPet(instanceId) {
  const index = state.pets.findIndex((p) => p.instanceId === instanceId);
  if (index < 0) return { ok: false, reason: 'PET_MISSING' };
  if ((state.materials.pet_catalyst || 0) < 1) return { ok: false, reason: 'CATALYST_REQUIRED' };

  const result = increaseAXEPetOverEnchant(state.pets[index]);
  if (!result.ok) return result;

  state = {
    ...state,
    materials: { ...state.materials, pet_catalyst: state.materials.pet_catalyst - 1 },
    pets: state.pets.map((p, i) => i === index ? result.pet : p),
  };
  emit();
  return result;
}

export function grantAXEPet(definitionId, overrides = {}) {
  if (!getAXEPetDefinition(definitionId)) return { ok: false, reason: 'PET_DEFINITION_MISSING' };
  const pet = normalizeAXEPetInstance({
    ...createAXEPetInstance(definitionId),
    ...overrides,
  });
  state = { ...state, pets: [...state.pets, pet] };
  emit();
  return { ok: true, pet };
}

export function previewAXEPetFusionByIds(instanceIds = [], resultSpecialty = null) {
  const uniqueIds = [...new Set(instanceIds)];
  const pets = uniqueIds
    .map((id) => state.pets.find((pet) => pet.instanceId === id))
    .filter(Boolean);
  if (pets.length !== uniqueIds.length) return { ok: false, reason: 'PET_MISSING' };

  const preview = previewAXEPetFusion(pets, resultSpecialty);
  if (!preview.ok) return preview;

  const canAfford = Object.entries(preview.materialCost || {})
    .every(([id, amount]) => Number(state.materials[id] || 0) >= Number(amount || 0));
  return {
    ...preview,
    canAfford,
    materials: { ...state.materials },
  };
}

export function fuseAXEPets(instanceIds = [], {
  resultSpecialty = null,
  confirmed = false,
  roll = Math.random(),
} = {}) {
  const preview = previewAXEPetFusionByIds(instanceIds, resultSpecialty);
  if (!preview.ok) return preview;
  if (!confirmed) return { ...preview, ok: false, reason: 'CONFIRMATION_REQUIRED' };
  if (!preview.canAfford) return { ...preview, ok: false, reason: 'INSUFFICIENT_MATERIALS' };

  const donors = preview.donorIds
    .map((id) => state.pets.find((pet) => pet.instanceId === id))
    .filter(Boolean);
  if (donors.length !== preview.requiredPetCount) return { ok: false, reason: 'DONOR_STATE_CHANGED' };

  if (roll > preview.successChance) {
    // Default AXE recipes are currently safe/100%; this branch exists so future
    // recipes can introduce risk without rewriting the transaction.
    return { ...preview, ok: false, reason: 'FUSION_FAILED', donorsConsumed: false };
  }

  const source = donors[0];
  const result = normalizeAXEPetInstance({
    ...createAXEPetInstance(source.definitionId),
    tierId: preview.resultTier,
    specialty: preview.resultSpecialty,
    level: preview.retainedLevel,
    overEnchantPercent: preview.retainedOverEnchantPercent,
    evolutionStage: (source.evolutionStage || 0) + 1,
    registered: false,
    summoned: false,
    bound: donors.some((pet) => pet.bound),
  });

  const donorSet = new Set(preview.donorIds);
  const nextMaterials = { ...state.materials };
  for (const [id, amount] of Object.entries(preview.materialCost || {})) {
    nextMaterials[id] = Math.max(0, Number(nextMaterials[id] || 0) - Number(amount || 0));
  }

  state = {
    ...state,
    materials: nextMaterials,
    pets: [...state.pets.filter((pet) => !donorSet.has(pet.instanceId)), result],
  };
  emit();
  return {
    ok: true,
    result,
    donorsConsumed: true,
    donorIds: preview.donorIds,
    materialCost: preview.materialCost,
  };
}

export function grantAXEPetMaterials(delta = {}) {
  state = {
    ...state,
    materials: {
      pet_feed: Number(state.materials.pet_feed || 0) + Math.max(0, Number(delta.pet_feed || 0)),
      pet_catalyst: Number(state.materials.pet_catalyst || 0) + Math.max(0, Number(delta.pet_catalyst || 0)),
      pet_soul: Number(state.materials.pet_soul || 0) + Math.max(0, Number(delta.pet_soul || 0)),
      god_essence: Number(state.materials.god_essence || 0) + Math.max(0, Number(delta.god_essence || 0)),
    },
  };
  emit();
}
