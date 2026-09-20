// AXE Prompt 024 — Core progression layer.
// Core is a character-registered power system, separate from equipment gems,
// Aura, Titles, Halo, pets and set bonuses.

export const AXE_CORE_SERVICE_DESCRIPTOR = Object.freeze({
  id: 'core',
  label: 'Core',
  category: 'progression',
  remoteAccessible: true,
});

export const AXE_CORE_CONFIG = Object.freeze({
  maxRegistered: 2,
  maxLevel: 20,
  evolutionLevels: Object.freeze([5, 10, 15, 20]),
  xpPerLevelBase: 100,
});

export const AXE_CORE_RARITY_MULTIPLIER = Object.freeze({
  common: 1,
  uncommon: 1.12,
  rare: 1.28,
  elite: 1.48,
  legendary: 1.75,
  heroic: 2.05,
});

export const AXE_CORE_DEFINITIONS = Object.freeze({
  axe_core_assault: Object.freeze({
    id: 'axe_core_assault',
    name: 'Assault Core',
    rarity: 'rare',
    specialty: 'attack',
    baseBonuses: Object.freeze({ damage: 8, critDamage: 2 }),
    perLevel: Object.freeze({ damage: 1.4, critDamage: 0.25 }),
  }),
  axe_core_bastion: Object.freeze({
    id: 'axe_core_bastion',
    name: 'Bastion Core',
    rarity: 'rare',
    specialty: 'defense',
    baseBonuses: Object.freeze({ defense: 10, hp: 35, criticalDefense: 1 }),
    perLevel: Object.freeze({ defense: 1.5, hp: 6, criticalDefense: 0.12 }),
  }),
  axe_core_precision: Object.freeze({
    id: 'axe_core_precision',
    name: 'Precision Core',
    rarity: 'elite',
    specialty: 'critical',
    baseBonuses: Object.freeze({ critChance: 1.5, critDamage: 4 }),
    perLevel: Object.freeze({ critChance: 0.15, critDamage: 0.45 }),
  }),
  axe_core_spirit: Object.freeze({
    id: 'axe_core_spirit',
    name: 'Spirit Core',
    rarity: 'elite',
    specialty: 'resource',
    baseBonuses: Object.freeze({ hp: 20, chi: 25, attributeDefense: 2 }),
    perLevel: Object.freeze({ hp: 4, chi: 5, attributeDefense: 0.25 }),
  }),
  axe_core_divine_balance: Object.freeze({
    id: 'axe_core_divine_balance',
    name: 'Divine Balance Core',
    rarity: 'heroic',
    specialty: 'balanced',
    baseBonuses: Object.freeze({
      damage: 10,
      defense: 10,
      hp: 50,
      critChance: 1,
      critDamage: 3,
      criticalDefense: 1,
    }),
    perLevel: Object.freeze({
      damage: 1.25,
      defense: 1.25,
      hp: 5,
      critChance: 0.1,
      critDamage: 0.3,
      criticalDefense: 0.1,
    }),
  }),
});

export function getAXECoreDefinition(coreId) {
  return AXE_CORE_DEFINITIONS[coreId] || null;
}

export function xpForAXECoreLevel(level = 1) {
  const l = Math.max(1, Number(level) || 1);
  return Math.round(AXE_CORE_CONFIG.xpPerLevelBase * Math.pow(l, 1.22));
}

export function createAXECoreInstance(definitionId, instanceId = null) {
  const def = getAXECoreDefinition(definitionId);
  if (!def) throw new Error(`Unknown AXE Core definition: ${definitionId}`);
  return {
    instanceId: instanceId || `${definitionId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    definitionId,
    level: 1,
    xp: 0,
    evolutionStage: 0,
    locked: false,
    registered: false,
  };
}

export function normalizeAXECoreInstance(core = {}) {
  const def = getAXECoreDefinition(core.definitionId);
  if (!def) return null;
  const level = Math.max(1, Math.min(AXE_CORE_CONFIG.maxLevel, Number(core.level) || 1));
  return {
    ...core,
    level,
    xp: Math.max(0, Number(core.xp) || 0),
    evolutionStage: AXE_CORE_CONFIG.evolutionLevels.filter((n) => level >= n).length,
    locked: !!core.locked,
    registered: !!core.registered,
  };
}

export function getAXECoreBonuses(core) {
  const normalized = normalizeAXECoreInstance(core);
  if (!normalized) return {};
  const def = getAXECoreDefinition(normalized.definitionId);
  const rarityScale = AXE_CORE_RARITY_MULTIPLIER[def.rarity] || 1;
  const levelSteps = Math.max(0, normalized.level - 1);
  const evolutionScale = 1 + normalized.evolutionStage * 0.08;

  const out = {};
  const keys = new Set([
    ...Object.keys(def.baseBonuses || {}),
    ...Object.keys(def.perLevel || {}),
  ]);
  for (const key of keys) {
    const base = Number(def.baseBonuses?.[key] || 0);
    const growth = Number(def.perLevel?.[key] || 0) * levelSteps;
    out[key] = Number(((base + growth) * rarityScale * evolutionScale).toFixed(3));
  }
  return out;
}

export function combineAXECoreBonuses(cores = []) {
  const out = {
    hp: 0,
    chi: 0,
    damage: 0,
    defense: 0,
    critChance: 0,
    critDamage: 0,
    criticalDefense: 0,
    attributeAttack: 0,
    attributeDefense: 0,
  };

  for (const core of cores) {
    if (!core?.registered) continue;
    const bonus = getAXECoreBonuses(core);
    for (const key of Object.keys(out)) out[key] += Number(bonus[key] || 0);
  }
  return out;
}

export function addAXECoreXP(core, amount) {
  let next = normalizeAXECoreInstance(core);
  if (!next) return { ok: false, reason: 'CORE_INVALID', core };
  let gained = Math.max(0, Number(amount) || 0);
  let levelsGained = 0;
  next = { ...next, xp: next.xp + gained };

  while (next.level < AXE_CORE_CONFIG.maxLevel) {
    const needed = xpForAXECoreLevel(next.level);
    if (next.xp < needed) break;
    next = { ...next, xp: next.xp - needed, level: next.level + 1 };
    levelsGained += 1;
  }

  next = normalizeAXECoreInstance(next);
  return { ok: true, core: next, levelsGained };
}
