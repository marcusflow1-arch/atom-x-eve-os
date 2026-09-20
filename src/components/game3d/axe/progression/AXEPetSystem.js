// AXE Prompt 032 — Pet / Companion foundation.
// Pets are stat companions and long-term progression. They are separate from
// mount progression even when an existing 3D creature model can also be ridden.

export const AXE_PET_CONFIG = Object.freeze({
  maxLevel: 200,
  maxOverEnchantPercent: 200,
  overEnchantStepPercent: 5,
  overEnchantBonusAt100PctFraction: 0.25,
});

export const AXE_PET_DEFINITIONS = Object.freeze({
  shadow_wolf: Object.freeze({
    id: 'shadow_wolf',
    name: 'Baby Wolf',
    species: 'wolf',
    tier: 'base',
    specialty: 'balanced',
    modelRef: 'shadow_wolf',
    tradeable: true,
    bindOnRegister: false,
    level200Stats: Object.freeze({ hp: 1200, chi: 350, defense: 140, attack: 170 }),
  }),
});

export function getAXEPetDefinition(id) {
  return AXE_PET_DEFINITIONS[id] || null;
}

export function xpForAXEPetLevel(level = 1) {
  const l = Math.max(1, Number(level) || 1);
  return Math.round(25 + 18 * Math.pow(l, 1.35));
}

export function createAXEPetInstance(definitionId, instanceId = null) {
  const def = getAXEPetDefinition(definitionId);
  if (!def) throw new Error(`Unknown AXE pet definition: ${definitionId}`);
  return {
    instanceId: instanceId || `${definitionId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    definitionId,
    level: 1,
    xp: 0,
    overEnchantPercent: 0,
    evolutionStage: 0,
    registered: false,
    summoned: false,
    bound: !!def.bindOnRegister,
    sourceStats: { pveXp: 0, pvpXp: 0, feedingXp: 0, itemXp: 0 },
  };
}

export function normalizeAXEPetInstance(pet = {}) {
  const def = getAXEPetDefinition(pet.definitionId);
  if (!def) return null;
  return {
    ...pet,
    level: Math.max(1, Math.min(AXE_PET_CONFIG.maxLevel, Number(pet.level) || 1)),
    xp: Math.max(0, Number(pet.xp) || 0),
    overEnchantPercent: Math.max(0, Math.min(
      AXE_PET_CONFIG.maxOverEnchantPercent,
      Number(pet.overEnchantPercent) || 0,
    )),
    evolutionStage: Math.max(0, Number(pet.evolutionStage) || 0),
    registered: !!pet.registered,
    summoned: !!pet.summoned,
    bound: !!pet.bound,
    sourceStats: {
      pveXp: 0, pvpXp: 0, feedingXp: 0, itemXp: 0,
      ...(pet.sourceStats || {}),
    },
  };
}

export function getAXEPetStatBonuses(pet) {
  const p = normalizeAXEPetInstance(pet);
  if (!p) return { hp: 0, chi: 0, defense: 0, damage: 0 };
  const def = getAXEPetDefinition(p.definitionId);
  const levelT = Math.max(0.01, p.level / AXE_PET_CONFIG.maxLevel);
  const overFraction =
    (p.overEnchantPercent / 100) * AXE_PET_CONFIG.overEnchantBonusAt100PctFraction;
  const scale = levelT * (1 + overFraction);

  return {
    hp: Math.round(def.level200Stats.hp * scale),
    chi: Math.round(def.level200Stats.chi * scale),
    defense: Math.round(def.level200Stats.defense * scale),
    damage: Math.round(def.level200Stats.attack * scale),
  };
}

export function addAXEPetXP(pet, amount, source = 'pve') {
  let next = normalizeAXEPetInstance(pet);
  if (!next) return { ok: false, reason: 'PET_INVALID', pet };
  const gain = Math.max(0, Number(amount) || 0);
  next = {
    ...next,
    xp: next.xp + gain,
    sourceStats: {
      ...next.sourceStats,
      [`${source}Xp`]: (next.sourceStats?.[`${source}Xp`] || 0) + gain,
    },
  };

  let levelsGained = 0;
  while (next.level < AXE_PET_CONFIG.maxLevel) {
    const need = xpForAXEPetLevel(next.level);
    if (next.xp < need) break;
    next = { ...next, xp: next.xp - need, level: next.level + 1 };
    levelsGained += 1;
  }
  return { ok: true, pet: normalizeAXEPetInstance(next), levelsGained, gain };
}

export function increaseAXEPetOverEnchant(pet, step = AXE_PET_CONFIG.overEnchantStepPercent) {
  const p = normalizeAXEPetInstance(pet);
  if (!p) return { ok: false, reason: 'PET_INVALID', pet };
  if (p.overEnchantPercent >= AXE_PET_CONFIG.maxOverEnchantPercent) {
    return { ok: false, reason: 'MAX_OVER_ENCHANT', pet: p };
  }
  return {
    ok: true,
    pet: {
      ...p,
      overEnchantPercent: Math.min(
        AXE_PET_CONFIG.maxOverEnchantPercent,
        p.overEnchantPercent + Math.max(1, Number(step) || 1),
      ),
    },
  };
}
