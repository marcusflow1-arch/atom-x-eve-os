// TwelveSky2 title progression.
// Source model: five title types, ranks 1-12 purchased with Contribution Points.
// Each rank also grants +1% Attribution ATK and +1% Attribution DEF.
// Ranks 13-15 are intentionally kept outside the core table because they are
// later-version ticket extensions; the classic Mines ruleset uses 1-12.

export const MAX_TITLE_LEVEL = 12;

export const TITLE_STAGE_CP_COSTS = Object.freeze([
  0,
  800,
  1700,
  2500,
  3400,
  4200,
  5100,
  5900,
  6800,
  7600,
  8500,
  9300,
  10000,
]);

const BASIC = [
  [0, 0, 0, 0],
  [1, 1, 1, 1],
  [2, 2, 2, 2],
  [3, 3, 3, 3],
  [4, 4, 4, 4],
  [5, 5, 5, 5],
  [6, 6, 6, 6],
  [7, 7, 7, 7],
  [8, 8, 8, 8],
  [9, 9, 9, 9],
  [10, 10, 10, 10],
  [12, 12, 12, 12],
  [15, 15, 15, 15],
];

const STRENGTH = [
  [0, 0, 0, 0],
  [2, 1, 0, 1],
  [4, 1, 1, 2],
  [6, 1, 2, 3],
  [8, 2, 2, 4],
  [10, 2, 3, 5],
  [12, 3, 3, 6],
  [14, 4, 3, 7],
  [16, 4, 4, 8],
  [18, 4, 5, 9],
  [20, 5, 5, 10],
  [24, 6, 6, 12],
  [30, 8, 7, 15],
];

const AGILITY = [
  [0, 0, 0, 0],
  [1, 3, 0, 0],
  [1, 5, 1, 1],
  [1, 7, 2, 2],
  [2, 10, 2, 2],
  [2, 12, 3, 3],
  [3, 15, 3, 3],
  [4, 18, 3, 3],
  [4, 20, 4, 4],
  [4, 22, 5, 5],
  [5, 25, 5, 5],
  [6, 30, 6, 6],
  [8, 38, 7, 7],
];

const VITALITY = [
  [0, 0, 0, 0],
  [0, 1, 2, 1],
  [1, 1, 4, 2],
  [2, 1, 6, 3],
  [2, 2, 8, 4],
  [3, 2, 10, 5],
  [3, 3, 12, 6],
  [3, 4, 14, 7],
  [4, 4, 16, 8],
  [5, 4, 18, 9],
  [5, 5, 20, 10],
  [6, 6, 24, 12],
  [7, 8, 30, 15],
];

const SPIRIT = [
  [0, 0, 0, 0],
  [1, 1, 0, 2],
  [2, 1, 1, 4],
  [3, 1, 2, 6],
  [4, 2, 2, 8],
  [5, 2, 3, 10],
  [6, 3, 3, 12],
  [7, 4, 3, 14],
  [8, 4, 4, 16],
  [9, 4, 5, 18],
  [10, 5, 5, 20],
  [12, 6, 6, 24],
  [15, 8, 7, 30],
];

export const TITLE_PATHS = Object.freeze([
  { id: 'basic', name: 'Basic', icon: '◇', color: '#dbeafe', description: 'Balanced title. Raises Strength, Agility, Vitality and Spirit evenly.', rows: BASIC },
  { id: 'strength', name: 'Strength', icon: '⚔', color: '#fb7185', description: 'Offensive title with the largest Strength gain.', rows: STRENGTH },
  { id: 'agility', name: 'Agility', icon: '✦', color: '#67e8f9', description: 'Precision title with the largest Agility gain.', rows: AGILITY },
  { id: 'vitality', name: 'Vitality', icon: '⬡', color: '#86efac', description: 'Survival title with the largest Vitality gain.', rows: VITALITY },
  { id: 'spirit', name: 'Spirit', icon: '◈', color: '#c4b5fd', description: 'Chi title with the largest Spirit gain.', rows: SPIRIT },
]);

export function getTitlePathById(id) {
  return TITLE_PATHS.find((path) => path.id === id) || TITLE_PATHS[0];
}

export function getTitleBonusesForLevel(pathId, level) {
  const path = getTitlePathById(pathId);
  const stage = Math.max(0, Math.min(MAX_TITLE_LEVEL, Math.floor(Number(level) || 0)));
  const [strength = 0, agility = 0, vitality = 0, spirit = 0] = path.rows[stage] || path.rows[0];
  return {
    strength,
    agility,
    dexterity: agility,
    vitality,
    constitution: vitality,
    spirit,
    focus: spirit,
    attributionAttackPct: stage,
    attributionDefensePct: stage,
  };
}

export function getTitleStageCost(stage) {
  const rank = Math.max(1, Math.min(MAX_TITLE_LEVEL, Math.floor(Number(stage) || 1)));
  return TITLE_STAGE_CP_COSTS[rank] || 0;
}

export function getTotalTitleCpSpent(stage) {
  const rank = Math.max(0, Math.min(MAX_TITLE_LEVEL, Math.floor(Number(stage) || 0)));
  return TITLE_STAGE_CP_COSTS.slice(1, rank + 1).reduce((sum, value) => sum + value, 0);
}

export function getTitleRarityForLevel(level) {
  const stage = Math.max(1, Math.min(MAX_TITLE_LEVEL, Math.floor(Number(level) || 1)));
  if (stage >= 12) return { rarity: 'hero', color: '#fbbf24', glow: 'rgba(251,191,36,0.35)', auraIntensity: 1 };
  if (stage >= 9) return { rarity: 'master', color: '#c084fc', glow: 'rgba(192,132,252,0.3)', auraIntensity: 0.8 };
  if (stage >= 5) return { rarity: 'veteran', color: '#67e8f9', glow: 'rgba(103,232,249,0.28)', auraIntensity: 0.55 };
  return { rarity: 'rank', color: '#d1d5db', glow: 'rgba(209,213,219,0.18)', auraIntensity: 0.3 };
}
