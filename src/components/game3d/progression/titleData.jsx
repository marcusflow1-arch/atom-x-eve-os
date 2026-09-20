// AXE Prompt 029 — Title progression data.
// Five specializations, fifteen stages, contribution-based advancement.
// Exact values are AXE balance data and remain editable.

export const MAX_TITLE_LEVEL = 15;

export const TITLE_STAGE_COSTS = Object.freeze([
  0,
  100, 175, 275, 400, 550,
  750, 1000, 1300, 1650, 2050,
  2500, 3000, 3600, 4300, 5100,
]);

export function getTitleStageCost(level) {
  if (level <= 0 || level > MAX_TITLE_LEVEL) return Infinity;
  return TITLE_STAGE_COSTS[level] || Infinity;
}

// Compatibility alias retained for callers from the earlier kill-progress model.
export function killsRequiredForTitleLevel(level) {
  return getTitleStageCost(level);
}

// Activities grant contribution/title currency. Values remain data-driven.
export const TITLE_KILL_POINTS = Object.freeze({
  normal: 1,
  elite: 5,
  boss: 100,
  pvp: 10,
  raid: 25,
});

export const TITLE_RARITY_BANDS = Object.freeze([
  Object.freeze({ from: 1, to: 3, rarity: 'common', color: '#9ca3af', glow: 'rgba(156,163,175,0.45)', auraIntensity: 0.20 }),
  Object.freeze({ from: 4, to: 6, rarity: 'rare', color: '#38bdf8', glow: 'rgba(56,189,248,0.55)', auraIntensity: 0.40 }),
  Object.freeze({ from: 7, to: 9, rarity: 'epic', color: '#a855f7', glow: 'rgba(168,85,247,0.65)', auraIntensity: 0.62 }),
  Object.freeze({ from: 10, to: 12, rarity: 'legendary', color: '#f59e0b', glow: 'rgba(245,158,11,0.72)', auraIntensity: 0.82 }),
  Object.freeze({ from: 13, to: 15, rarity: 'mythic', color: '#f472b6', glow: 'rgba(244,114,182,0.88)', auraIntensity: 1.00 }),
]);

export function getTitleRarityForLevel(level) {
  const lvl = Math.max(1, Math.min(MAX_TITLE_LEVEL, Number(level) || 1));
  return TITLE_RARITY_BANDS.find((b) => lvl >= b.from && lvl <= b.to) || TITLE_RARITY_BANDS[0];
}

function lerpLevel(min, max, level) {
  const lvl = Math.max(1, Math.min(MAX_TITLE_LEVEL, level));
  const t = (lvl - 1) / Math.max(1, MAX_TITLE_LEVEL - 1);
  return min + (max - min) * t;
}

// Five AXE specializations. Attribute bonuses match the user's requested
// Strength / HP(Vitality) / Dexterity / Spirit directions; Harmony is balanced.
export const TITLE_PATHS = Object.freeze([
  Object.freeze({
    id: 'strength',
    name: 'Path of Strength',
    primaryStat: 'strength',
    description: 'Offensive title specialization focused on Strength and direct damage.',
    icon: '⚔️',
    color: '#ef4444',
    attrLv1: Object.freeze({ strength: 1 }),
    attrLv15: Object.freeze({ strength: 30 }),
    flatLv1: Object.freeze({ damage: 10 }),
    flatLv15: Object.freeze({ damage: 350, critDamage: 0.20 }),
  }),
  Object.freeze({
    id: 'vitality',
    name: 'Path of Vitality',
    primaryStat: 'vitality',
    description: 'Defensive title specialization focused on Vitality, HP, and defense.',
    icon: '🛡️',
    color: '#22c55e',
    attrLv1: Object.freeze({ constitution: 1 }),
    attrLv15: Object.freeze({ constitution: 30 }),
    flatLv1: Object.freeze({ hp: 100, defense: 8 }),
    flatLv15: Object.freeze({ hp: 5000, defense: 500, criticalDefense: 0.25 }),
  }),
  Object.freeze({
    id: 'dexterity',
    name: 'Path of Dexterity',
    primaryStat: 'dexterity',
    description: 'Precision title specialization focused on Dexterity and critical chance.',
    icon: '🏹',
    color: '#38bdf8',
    attrLv1: Object.freeze({ dexterity: 1 }),
    attrLv15: Object.freeze({ dexterity: 30 }),
    flatLv1: Object.freeze({ critChance: 0.5 }),
    flatLv15: Object.freeze({ critChance: 15, critDamage: 0.30 }),
  }),
  Object.freeze({
    id: 'spirit',
    name: 'Path of Spirit',
    primaryStat: 'spirit',
    description: 'Resource and skill title specialization focused on Spirit / Chi.',
    icon: '✨',
    color: '#a855f7',
    attrLv1: Object.freeze({ focus: 1 }),
    attrLv15: Object.freeze({ focus: 30 }),
    flatLv1: Object.freeze({ chi: 15 }),
    flatLv15: Object.freeze({ chi: 750, critDamage: 0.40 }),
  }),
  Object.freeze({
    id: 'harmony',
    name: 'Path of Harmony',
    primaryStat: 'all',
    description: 'Balanced prestige path that raises all four core attributes together.',
    icon: '☯️',
    color: '#f6c453',
    attrLv1: Object.freeze({ strength: 1, constitution: 1, dexterity: 1, focus: 1 }),
    attrLv15: Object.freeze({ strength: 15, constitution: 15, dexterity: 15, focus: 15 }),
    flatLv1: Object.freeze({ hp: 40, damage: 4, defense: 4 }),
    flatLv15: Object.freeze({ hp: 2200, damage: 180, defense: 180, critChance: 5, criticalDefense: 0.12 }),
  }),
]);

export function getTitlePathById(id) {
  return TITLE_PATHS.find((p) => p.id === id) || null;
}

const interpolateObject = (minObj = {}, maxObj = {}, level) => {
  const out = {};
  const keys = new Set([...Object.keys(minObj), ...Object.keys(maxObj)]);
  for (const key of keys) {
    const value = lerpLevel(Number(minObj[key] || 0), Number(maxObj[key] || 0), level);
    out[key] = ['hp', 'chi', 'damage', 'defense', 'strength', 'constitution', 'dexterity', 'focus'].includes(key)
      ? Math.round(value)
      : value;
  }
  return out;
};

export function getTitleAttributeBonusesForLevel(pathId, level) {
  const path = getTitlePathById(pathId);
  if (!path || level <= 0) return { strength: 0, constitution: 0, dexterity: 0, focus: 0 };
  return interpolateObject(path.attrLv1, path.attrLv15, level);
}

export function getTitleBonusesForLevel(pathId, level) {
  const path = getTitlePathById(pathId);
  if (!path || level <= 0) {
    return { hp: 0, chi: 0, damage: 0, defense: 0, critChance: 0, critDamage: 0, criticalDefense: 0 };
  }
  return interpolateObject(path.flatLv1, path.flatLv15, level);
}
