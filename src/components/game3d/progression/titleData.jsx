// ─── Title Progression — Data Definitions ─────────────────────────────────
// Specialization paths that grow primarily ONE stat while granting smaller
// balanced bonuses to the others. Levels 1..20. Bonuses scale with curves
// defined here; the store applies them via getTitleBonusesForLevel().
//
// Design summary (from spec):
//   • Max title level: 20
//   • One title slot equipped at a time
//   • Primary stat gets the biggest growth
//   • Secondary stats get smaller but meaningful bonuses
//   • Kill requirements grow steeply for prestige

export const MAX_TITLE_LEVEL = 20;

// Kill requirements per level. Index = level (1..20). 0 is unused.
// Spec gives Lv 1..10; we extend curve through Lv 20.
export const TITLE_KILLS_PER_LEVEL = [
  0,
  800,    // Lv 1
  1500,   // Lv 2
  2500,   // Lv 3
  4000,   // Lv 4
  6000,   // Lv 5
  8500,   // Lv 6
  11500,  // Lv 7
  15000,  // Lv 8
  19000,  // Lv 9
  24000,  // Lv 10
  30000,  // Lv 11
  37000,  // Lv 12
  45000,  // Lv 13
  54000,  // Lv 14
  64000,  // Lv 15
  76000,  // Lv 16
  90000,  // Lv 17
  106000, // Lv 18
  125000, // Lv 19
  150000, // Lv 20
];

export function killsRequiredForTitleLevel(level) {
  if (level <= 0 || level > MAX_TITLE_LEVEL) return Infinity;
  return TITLE_KILLS_PER_LEVEL[level] || Infinity;
}

// Rarity progression keyed by level — used for UI tint + aura intensity.
export const TITLE_RARITY_BANDS = [
  { from: 1,  to: 4,  rarity: 'common',    color: '#9ca3af', glow: 'rgba(156,163,175,0.45)', auraIntensity: 0.20 },
  { from: 5,  to: 9,  rarity: 'rare',      color: '#38bdf8', glow: 'rgba(56,189,248,0.55)',  auraIntensity: 0.40 },
  { from: 10, to: 14, rarity: 'epic',      color: '#a855f7', glow: 'rgba(168,85,247,0.65)',  auraIntensity: 0.65 },
  { from: 15, to: 19, rarity: 'legendary', color: '#f59e0b', glow: 'rgba(245,158,11,0.70)',  auraIntensity: 0.85 },
  { from: 20, to: 20, rarity: 'mythic',    color: '#f472b6', glow: 'rgba(244,114,182,0.85)', auraIntensity: 1.00 },
];

export function getTitleRarityForLevel(level) {
  const band = TITLE_RARITY_BANDS.find((b) => level >= b.from && level <= b.to);
  return band || TITLE_RARITY_BANDS[0];
}

// ── Scaling helper ────────────────────────────────────────────────────────
// Linear interpolation from a Level-1 bonus to a Level-20 bonus.
function lerpLevel(min, max, level) {
  const lvl = Math.max(1, Math.min(MAX_TITLE_LEVEL, level));
  const t = (lvl - 1) / (MAX_TITLE_LEVEL - 1);
  return Math.round(min + (max - min) * t);
}

// ── Title Path Definitions ────────────────────────────────────────────────
// Each path declares its Level-1 and Level-20 bonus envelope. The store
// linearly interpolates intermediate levels via getTitleBonusesForLevel().
//
// Bonus keys map onto statsSystem inputs:
//   strength, vitality, dexterity, spirit  → flat stat-point additions
//   defense                                 → flat derived defense
//   criticalDefense                         → % crit damage reduction (0..1, e.g. 0.10 = 10%)
//   hp                                      → flat max HP
//
// Note: `criticalDefense` here is expressed in *percent-points*, then
// converted to the 0..1 scale by getTitleBonusesForLevel().
export const TITLE_PATHS = [
  {
    id: 'strength',
    name: 'Path of Strength',
    primaryStat: 'strength',
    description: 'Offensive specialization. Primarily scales attack power and physical damage with smaller defensive support.',
    icon: '⚔️',
    color: '#ef4444',
    lv1:  { strength: 15,  vitality: 5,  dexterity: 3,  spirit: 3,  defense: 10, criticalDefense: 10, hp: 50  },
    lv20: { strength: 200, vitality: 50, dexterity: 30, spirit: 30, defense: 80, criticalDefense: 70, hp: 800 },
  },
  {
    id: 'vitality',
    name: 'Path of Vitality',
    primaryStat: 'vitality',
    description: 'Survivability specialization. Massive HP, defense, and crit resistance with moderate offensive bonuses.',
    icon: '🛡️',
    color: '#22c55e',
    lv1:  { vitality: 20,  strength: 6,  dexterity: 3,  spirit: 3,  defense: 15,  criticalDefense: 10, hp: 100  },
    lv20: { vitality: 220, strength: 45, dexterity: 25, spirit: 25, defense: 120, criticalDefense: 90, hp: 1500 },
  },
  {
    id: 'dexterity',
    name: 'Path of Dexterity',
    primaryStat: 'dexterity',
    description: 'Mobility specialization. Attack speed, evasion, and crit chance with balanced offense and defense.',
    icon: '🏹',
    color: '#38bdf8',
    lv1:  { dexterity: 18,  strength: 5,  vitality: 4,  spirit: 3,  defense: 12,  criticalDefense: 10, hp: 60  },
    lv20: { dexterity: 210, strength: 35, vitality: 35, spirit: 25, defense: 100, criticalDefense: 75, hp: 900 },
  },
  {
    id: 'spirit',
    name: 'Path of Spirit',
    primaryStat: 'spirit',
    description: 'Skill power specialization. Energy, ability damage, and aura strength with utility bonuses.',
    icon: '✨',
    color: '#a855f7',
    lv1:  { spirit: 18,  strength: 4,  vitality: 4,  dexterity: 3,  defense: 10, criticalDefense: 10, hp: 60  },
    lv20: { spirit: 220, strength: 30, vitality: 35, dexterity: 25, defense: 85, criticalDefense: 75, hp: 900 },
  },
];

export function getTitlePathById(id) {
  return TITLE_PATHS.find((p) => p.id === id) || null;
}

// Compute the interpolated bonuses for a specific title path at a given level.
// Returns the same shape used by statsSystem (criticalDefense as 0..1 fraction).
export function getTitleBonusesForLevel(pathId, level) {
  const path = getTitlePathById(pathId);
  if (!path || level <= 0) {
    return { strength: 0, vitality: 0, dexterity: 0, spirit: 0, defense: 0, criticalDefense: 0, hp: 0 };
  }
  const keys = ['strength', 'vitality', 'dexterity', 'spirit', 'defense', 'criticalDefense', 'hp'];
  const out = {};
  keys.forEach((k) => {
    out[k] = lerpLevel(path.lv1[k] || 0, path.lv20[k] || 0, level);
  });
  // Convert criticalDefense from percent-points to 0..1 scale for statsSystem.
  out.criticalDefense = out.criticalDefense / 100;
  return out;
}