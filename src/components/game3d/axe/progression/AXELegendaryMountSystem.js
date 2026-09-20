// AXE Prompt 035 — Legendary / high-end Mount crafting and random abilities.
// Ability rolls are recorded on the mount instance so a rolled mount preserves
// its exact identity across reloads and trade/export boundaries.

export const AXE_LEGENDARY_MOUNT_CONFIG = Object.freeze({
  minimumGrowthPercent: 15,
  baseAbilityCount: 3,
  maximumAbilityCount: 4,
  craftCost: Object.freeze({
    legendary_mount_soul: 1,
    ascension_core: 2,
    gold: 12000,
  }),
  extraAbilityCost: Object.freeze({
    mount_ability_seal: 1,
    gold: 5000,
  }),
  rerollAbilityCost: Object.freeze({
    mount_ability_seal: 1,
    gold: 2500,
  }),
});

export const AXE_LEGENDARY_MOUNT_ABILITY_POOL = Object.freeze([
  Object.freeze({ id: 'mount_hp', label: 'Titan Vitality', stat: 'hp', min: 120, max: 450, unit: 'flat' }),
  Object.freeze({ id: 'mount_attack', label: 'War Instinct', stat: 'damage', min: 20, max: 70, unit: 'flat' }),
  Object.freeze({ id: 'mount_defense', label: 'Iron Hide', stat: 'defense', min: 20, max: 80, unit: 'flat' }),
  Object.freeze({ id: 'mount_attr_attack', label: 'Elemental Fury', stat: 'attributionAttack', min: 15, max: 65, unit: 'flat' }),
  Object.freeze({ id: 'mount_attr_defense', label: 'Elemental Ward', stat: 'attributionDefense', min: 15, max: 65, unit: 'flat' }),
  Object.freeze({ id: 'mount_crit', label: 'Predator Focus', stat: 'critChance', min: 0.75, max: 3.5, unit: 'percent' }),
  Object.freeze({ id: 'mount_crit_defense', label: 'Battle Awareness', stat: 'criticalDefense', min: 0.01, max: 0.08, unit: 'ratio' }),
  Object.freeze({ id: 'mount_speed', label: 'Storm Stride', stat: 'mountSpeedBonus', min: 0.03, max: 0.16, unit: 'multiplier' }),
]);

export const AXE_LEGENDARY_MOUNT_PASSIVES = Object.freeze([
  Object.freeze({
    id: 'survival_instinct',
    label: 'Survival Instinct',
    description: 'High-end survival profile emphasizing HP and critical defense.',
    bonus: Object.freeze({ hp: 200, criticalDefense: 0.03 }),
    cooldownSeconds: 0,
    trigger: 'passive',
  }),
  Object.freeze({
    id: 'war_resonance',
    label: 'War Resonance',
    description: 'High-end combat profile that amplifies direct attack.',
    bonus: Object.freeze({ damage: 35 }),
    cooldownSeconds: 0,
    trigger: 'passive',
  }),
  Object.freeze({
    id: 'storm_stride',
    label: 'Storm Stride',
    description: 'High-end utility profile that increases mounted travel speed.',
    bonus: Object.freeze({ mountSpeedBonus: 0.08 }),
    cooldownSeconds: 0,
    trigger: 'passive',
  }),
  Object.freeze({
    id: 'elemental_resonance',
    label: 'Elemental Resonance',
    description: 'High-end attribute profile for elemental offense and defense.',
    bonus: Object.freeze({ attributionAttack: 30, attributionDefense: 25 }),
    cooldownSeconds: 0,
    trigger: 'passive',
  }),
]);

const clampRng = (v) => Math.max(0, Math.min(0.999999999, Number(v) || 0));

const rollRange = (min, max, rng) => {
  const raw = min + (max - min) * clampRng(rng());
  return Number(raw.toFixed(max <= 10 ? 3 : 0));
};

export function validateAXELegendaryMountCraft(mount) {
  if (!mount) return { ok: false, reason: 'MOUNT_MISSING' };
  if (mount.legendary?.isLegendary) return { ok: false, reason: 'ALREADY_LEGENDARY' };
  if (Number(mount.growthPercent || 0) < AXE_LEGENDARY_MOUNT_CONFIG.minimumGrowthPercent) {
    return {
      ok: false,
      reason: 'GROWTH_REQUIRED',
      required: AXE_LEGENDARY_MOUNT_CONFIG.minimumGrowthPercent,
      have: Number(mount.growthPercent || 0),
    };
  }
  return { ok: true };
}

export function rollAXELegendaryMountAbility(rng = Math.random, excludedIds = []) {
  const available = AXE_LEGENDARY_MOUNT_ABILITY_POOL.filter((entry) => !excludedIds.includes(entry.id));
  if (!available.length) return null;
  const def = available[Math.floor(clampRng(rng()) * available.length)];
  return {
    id: def.id,
    label: def.label,
    stat: def.stat,
    value: rollRange(def.min, def.max, rng),
    unit: def.unit,
  };
}

export function rollAXELegendaryMountAbilities(count = AXE_LEGENDARY_MOUNT_CONFIG.baseAbilityCount, rng = Math.random) {
  const out = [];
  while (out.length < count) {
    const roll = rollAXELegendaryMountAbility(rng, out.map((entry) => entry.id));
    if (!roll) break;
    out.push(roll);
  }
  return out;
}

export function rollAXELegendaryMountPassive(rng = Math.random) {
  const index = Math.floor(clampRng(rng()) * AXE_LEGENDARY_MOUNT_PASSIVES.length);
  return AXE_LEGENDARY_MOUNT_PASSIVES[index];
}

export function createAXELegendaryMountState(mount, rng = Math.random) {
  const valid = validateAXELegendaryMountCraft(mount);
  if (!valid.ok) return valid;

  return {
    ok: true,
    legendary: {
      isLegendary: true,
      craftedAt: Date.now(),
      abilities: rollAXELegendaryMountAbilities(AXE_LEGENDARY_MOUNT_CONFIG.baseAbilityCount, rng),
      passiveId: rollAXELegendaryMountPassive(rng).id,
      extraAbilityUnlocked: false,
      rerollCount: 0,
    },
  };
}

export function collectAXELegendaryMountBonuses(legendary = null) {
  const out = {
    hp: 0,
    damage: 0,
    defense: 0,
    critChance: 0,
    criticalDefense: 0,
    attributionAttack: 0,
    attributionDefense: 0,
    mountSpeedBonus: 0,
  };
  if (!legendary?.isLegendary) return out;

  for (const ability of legendary.abilities || []) {
    if (!(ability?.stat in out)) continue;
    out[ability.stat] += Number(ability.value || 0);
  }

  const passive = AXE_LEGENDARY_MOUNT_PASSIVES.find((entry) => entry.id === legendary.passiveId);
  for (const [key, value] of Object.entries(passive?.bonus || {})) {
    if (!(key in out)) continue;
    out[key] += Number(value || 0);
  }
  return out;
}

export function addAXELegendaryMountExtraAbility(legendary, rng = Math.random) {
  if (!legendary?.isLegendary) return { ok: false, reason: 'NOT_LEGENDARY', legendary };
  if (legendary.extraAbilityUnlocked) return { ok: false, reason: 'EXTRA_ABILITY_ALREADY_UNLOCKED', legendary };
  if ((legendary.abilities || []).length >= AXE_LEGENDARY_MOUNT_CONFIG.maximumAbilityCount) {
    return { ok: false, reason: 'ABILITY_CAP', legendary };
  }

  const ability = rollAXELegendaryMountAbility(rng, (legendary.abilities || []).map((entry) => entry.id));
  if (!ability) return { ok: false, reason: 'NO_ABILITY_AVAILABLE', legendary };

  return {
    ok: true,
    legendary: {
      ...legendary,
      extraAbilityUnlocked: true,
      abilities: [...(legendary.abilities || []), ability],
    },
    ability,
  };
}

export function rerollAXELegendaryMountAbility(legendary, abilityIndex, rng = Math.random) {
  if (!legendary?.isLegendary) return { ok: false, reason: 'NOT_LEGENDARY', legendary };
  const abilities = [...(legendary.abilities || [])];
  if (!abilities[abilityIndex]) return { ok: false, reason: 'ABILITY_MISSING', legendary };

  const excluded = abilities.filter((_, index) => index !== abilityIndex).map((entry) => entry.id);
  const ability = rollAXELegendaryMountAbility(rng, excluded);
  if (!ability) return { ok: false, reason: 'NO_ABILITY_AVAILABLE', legendary };

  abilities[abilityIndex] = ability;
  return {
    ok: true,
    legendary: {
      ...legendary,
      abilities,
      rerollCount: Number(legendary.rerollCount || 0) + 1,
    },
    ability,
  };
}
