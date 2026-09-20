// AXE Prompt 033 — Pet tiers, Master Pets, God Pets and specialization.
// This is AXE's data-driven tier/fusion layer. The exact legacy recipe counts
// were not locked by the user, so recipe counts remain configurable here.

export const AXE_PET_TIER_ORDER = Object.freeze([
  'base',
  'master',
  'adept_master',
  'grand_master',
  'god',
]);

export const AXE_PET_TIERS = Object.freeze({
  base: Object.freeze({
    id: 'base',
    label: 'Pet',
    rank: 0,
    majorStatCount: 1,
    tierScale: 1,
    godSpecialtyMultiplier: 1,
    visualEvolution: 'base',
  }),
  master: Object.freeze({
    id: 'master',
    label: 'Master Pet',
    rank: 1,
    majorStatCount: 2,
    tierScale: 1.15,
    godSpecialtyMultiplier: 1,
    visualEvolution: 'master',
  }),
  adept_master: Object.freeze({
    id: 'adept_master',
    label: 'Adept Master Pet',
    rank: 2,
    majorStatCount: 3,
    tierScale: 1.35,
    godSpecialtyMultiplier: 1,
    visualEvolution: 'adept',
  }),
  grand_master: Object.freeze({
    id: 'grand_master',
    label: 'Grand Master Pet',
    rank: 3,
    majorStatCount: 4,
    tierScale: 1.6,
    godSpecialtyMultiplier: 1,
    visualEvolution: 'grand',
  }),
  god: Object.freeze({
    id: 'god',
    label: 'God Pet',
    rank: 4,
    majorStatCount: 4,
    tierScale: 2,
    // USER-REQUIRED: a God pet emphasizes its specialty at twice the
    // otherwise-normal value for that specialty.
    godSpecialtyMultiplier: 2,
    visualEvolution: 'god',
  }),
});

export const AXE_PET_SPECIALTIES = Object.freeze({
  hp: Object.freeze({ id: 'hp', label: 'HP', primaryStat: 'hp' }),
  attack: Object.freeze({ id: 'attack', label: 'Attack', primaryStat: 'attack' }),
  defense: Object.freeze({ id: 'defense', label: 'Defense', primaryStat: 'defense' }),
  chi: Object.freeze({ id: 'chi', label: 'Chi', primaryStat: 'chi' }),
  balanced: Object.freeze({ id: 'balanced', label: 'Balanced', primaryStat: 'hp' }),
  attribute: Object.freeze({ id: 'attribute', label: 'Attribute', primaryStat: 'attack' }),
});

export const AXE_PET_FUSION_RECIPES = Object.freeze({
  base: Object.freeze({
    sourceTier: 'base',
    resultTier: 'master',
    requiredPetCount: 3,
    sameTierRequired: true,
    sameSpecialtyRequired: false,
    successChance: 1,
  }),
  master: Object.freeze({
    sourceTier: 'master',
    resultTier: 'adept_master',
    requiredPetCount: 3,
    sameTierRequired: true,
    sameSpecialtyRequired: false,
    successChance: 1,
  }),
  adept_master: Object.freeze({
    sourceTier: 'adept_master',
    resultTier: 'grand_master',
    requiredPetCount: 2,
    sameTierRequired: true,
    sameSpecialtyRequired: false,
    successChance: 1,
  }),
  grand_master: Object.freeze({
    sourceTier: 'grand_master',
    resultTier: 'god',
    requiredPetCount: 2,
    sameTierRequired: true,
    sameSpecialtyRequired: false,
    successChance: 1,
  }),
});

const MAJOR_STATS = Object.freeze(['hp', 'chi', 'defense', 'attack']);

function statPriorityForSpecialty(specialtyId) {
  switch (specialtyId) {
    case 'attack': return ['attack', 'hp', 'defense', 'chi'];
    case 'defense': return ['defense', 'hp', 'attack', 'chi'];
    case 'chi': return ['chi', 'hp', 'defense', 'attack'];
    case 'balanced': return ['hp', 'attack', 'defense', 'chi'];
    case 'attribute': return ['attack', 'chi', 'defense', 'hp'];
    case 'hp':
    default:
      return ['hp', 'defense', 'attack', 'chi'];
  }
}

export function getAXEPetTier(tierId) {
  return AXE_PET_TIERS[tierId] || AXE_PET_TIERS.base;
}

export function getAXEPetSpecialty(specialtyId) {
  return AXE_PET_SPECIALTIES[specialtyId] || AXE_PET_SPECIALTIES.balanced;
}

export function getAXEPetTierVisualProfile(tierId, specialtyId = 'balanced') {
  const tier = getAXEPetTier(tierId);
  const specialty = getAXEPetSpecialty(specialtyId);
  return {
    tierId: tier.id,
    evolution: tier.visualEvolution,
    auraIntensity: 0.15 + tier.rank * 0.2,
    scaleMultiplier: 1 + tier.rank * 0.05,
    specialty: specialty.id,
    prestigeParticles: tier.id === 'god',
  };
}

export function applyAXEPetTierProfile(baseStats = {}, tierId = 'base', specialtyId = 'balanced') {
  const tier = getAXEPetTier(tierId);
  const specialty = getAXEPetSpecialty(specialtyId);
  const priority = statPriorityForSpecialty(specialty.id);
  const active = new Set(priority.slice(0, tier.majorStatCount));
  const out = { hp: 0, chi: 0, defense: 0, attack: 0, attributeAttack: 0, attributeDefense: 0 };

  for (const stat of MAJOR_STATS) {
    if (!active.has(stat)) continue;
    const specialtyMult = tier.id === 'god' && specialty.primaryStat === stat
      ? tier.godSpecialtyMultiplier
      : 1;
    out[stat] = Number(baseStats[stat] || 0) * tier.tierScale * specialtyMult;
  }

  if (specialty.id === 'attribute') {
    const attributeBase = Number(baseStats.attributeAttack || baseStats.attack || 0);
    const attributeDefenseBase = Number(baseStats.attributeDefense || baseStats.defense || 0);
    const godMult = tier.id === 'god' ? tier.godSpecialtyMultiplier : 1;
    out.attributeAttack = attributeBase * tier.tierScale * 0.35 * godMult;
    out.attributeDefense = attributeDefenseBase * tier.tierScale * 0.35;
  }

  return out;
}

export function getAXEPetFusionRecipe(sourceTier) {
  return AXE_PET_FUSION_RECIPES[sourceTier] || null;
}

export function validateAXEPetFusion(pets = []) {
  if (!Array.isArray(pets) || pets.length < 1) return { ok: false, reason: 'NO_PETS' };
  const tierId = pets[0]?.tierId || 'base';
  const recipe = getAXEPetFusionRecipe(tierId);
  if (!recipe) return { ok: false, reason: 'MAX_TIER' };

  if (pets.length !== recipe.requiredPetCount) {
    return { ok: false, reason: 'PET_COUNT', need: recipe.requiredPetCount, have: pets.length };
  }
  if (recipe.sameTierRequired && pets.some((pet) => (pet?.tierId || 'base') !== tierId)) {
    return { ok: false, reason: 'TIER_MISMATCH' };
  }
  if (recipe.sameSpecialtyRequired) {
    const specialty = pets[0]?.specialty || 'balanced';
    if (pets.some((pet) => (pet?.specialty || 'balanced') !== specialty)) {
      return { ok: false, reason: 'SPECIALTY_MISMATCH' };
    }
  }
  if (pets.some((pet) => pet?.registered || pet?.summoned || pet?.locked)) {
    return { ok: false, reason: 'PET_IN_USE_OR_LOCKED' };
  }

  return { ok: true, recipe };
}

export function previewAXEPetFusion(pets = [], resultSpecialty = null) {
  const validation = validateAXEPetFusion(pets);
  if (!validation.ok) return validation;
  const { recipe } = validation;
  const specialties = pets.map((pet) => pet.specialty || 'balanced');
  const fallbackSpecialty = specialties.every((id) => id === specialties[0])
    ? specialties[0]
    : 'balanced';
  const specialty = AXE_PET_SPECIALTIES[resultSpecialty] ? resultSpecialty : fallbackSpecialty;

  return {
    ok: true,
    sourceTier: recipe.sourceTier,
    resultTier: recipe.resultTier,
    resultSpecialty: specialty,
    requiredPetCount: recipe.requiredPetCount,
    successChance: recipe.successChance,
    retainedLevel: Math.max(...pets.map((pet) => Number(pet.level) || 1)),
    retainedOverEnchantPercent: Math.max(...pets.map((pet) => Number(pet.overEnchantPercent) || 0)),
    donorIds: pets.map((pet) => pet.instanceId),
    visualProfile: getAXEPetTierVisualProfile(recipe.resultTier, specialty),
  };
}
