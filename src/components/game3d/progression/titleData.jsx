// ─── Title Progression — Data Definitions ─────────────────────────────────
// IMPORTANT DESIGN RULE:
//   Titles inject FLAT, FINAL combat stats. They do NOT pass through the
//   attribute system. (That's Halo's job.)
//
//   So a title bonus of +500 Damage adds exactly +500 to the player's final
//   damage total — it is NOT +500 strength being converted to +1500 phys dmg.
//   Same for HP, defense, crit. This keeps title power predictable and
//   prevents the attribute formulas from massively inflating title stats.
//
// Progression:
//   • Max title level: 20
//   • One title slot equipped at a time
//   • ONLY the equipped title accumulates kill progress
//   • Kills can be point-valued (e.g. boss kill = 100 points)
//
// Bonus schema (FLAT FINAL STATS — applied directly to derived totals):
//   hp              — flat max HP
//   damage          — flat damage added to totalDamage
//   defense         — flat defense added to defense total
//   critChance      — additive % crit chance (0..100 scale)
//   critDamage      — additive crit damage multiplier (0..1 scale, e.g. 0.10 = +10%)
//   criticalDefense — additive crit damage reduction (0..1 scale)

export const MAX_TITLE_LEVEL = 20;

// Points required per title level. Each "kill" can be worth N points
// (normal = 1, elite = 5, boss = 100, etc — see TITLE_KILL_POINTS below).
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

// Point value of each kill type — fed into the equipped title's progress bar.
// e.g. a boss kill grants 100 progress points; a normal kill grants 1.
export const TITLE_KILL_POINTS = {
  normal: 1,
  elite:  5,
  boss:   100,
  pvp:    10,
  raid:   25,
};

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

// ── Scaling helper — linear lerp from Lv1 to Lv20 ─────────────────────────
function lerpLevel(min, max, level) {
  const lvl = Math.max(1, Math.min(MAX_TITLE_LEVEL, level));
  const t = (lvl - 1) / (MAX_TITLE_LEVEL - 1);
  return min + (max - min) * t;
}

// ── Title Path Definitions ────────────────────────────────────────────────
// Each path defines its FLAT FINAL bonus envelope from Lv1 → Lv20.
// Damage / HP / Defense scale into the thousands. Crit values are %.
export const TITLE_PATHS = [
  {
    id: 'strength',
    name: 'Path of Strength',
    primaryStat: 'damage',
    description: 'Offensive specialization. Massive flat damage with supporting HP and defense.',
    icon: '⚔️',
    color: '#ef4444',
    lv1:  { hp: 200,   damage: 30,   defense: 20,  critChance: 0.5, critDamage: 0.01, criticalDefense: 0.01 },
    lv20: { hp: 4000,  damage: 800,  defense: 400, critChance: 8,   critDamage: 0.30, criticalDefense: 0.15 },
  },
  {
    id: 'vitality',
    name: 'Path of Vitality',
    primaryStat: 'hp',
    description: 'Survivability specialization. Huge HP and defense; moderate offense.',
    icon: '🛡️',
    color: '#22c55e',
    lv1:  { hp: 500,   damage: 10,   defense: 40,  critChance: 0.2, critDamage: 0.005, criticalDefense: 0.02 },
    lv20: { hp: 12000, damage: 300,  defense: 900, critChance: 3,   critDamage: 0.10,  criticalDefense: 0.45 },
  },
  {
    id: 'dexterity',
    name: 'Path of Dexterity',
    primaryStat: 'critChance',
    description: 'Precision specialization. High crit chance and damage with balanced offense.',
    icon: '🏹',
    color: '#38bdf8',
    lv1:  { hp: 250,   damage: 18,   defense: 22,  critChance: 1,   critDamage: 0.02, criticalDefense: 0.01 },
    lv20: { hp: 5000,  damage: 500,  defense: 450, critChance: 25,  critDamage: 0.60, criticalDefense: 0.15 },
  },
  {
    id: 'spirit',
    name: 'Path of Spirit',
    primaryStat: 'critDamage',
    description: 'Devastation specialization. Massive crit damage multipliers and resistance.',
    icon: '✨',
    color: '#a855f7',
    lv1:  { hp: 250,   damage: 15,   defense: 20,  critChance: 0.5, critDamage: 0.03, criticalDefense: 0.015 },
    lv20: { hp: 4500,  damage: 400,  defense: 400, critChance: 10,  critDamage: 1.00, criticalDefense: 0.25 },
  },
];

export function getTitlePathById(id) {
  return TITLE_PATHS.find((p) => p.id === id) || null;
}

// Compute interpolated FLAT FINAL bonuses for a path at a given level.
// All values are returned in their final-stat scale — NOT attribute points.
// Returns zeros at level 0 (un-leveled title).
export function getTitleBonusesForLevel(pathId, level) {
  const path = getTitlePathById(pathId);
  const zero = { hp: 0, damage: 0, defense: 0, critChance: 0, critDamage: 0, criticalDefense: 0 };
  if (!path || level <= 0) return zero;

  const keys = ['hp', 'damage', 'defense', 'critChance', 'critDamage', 'criticalDefense'];
  const out = {};
  keys.forEach((k) => {
    const v = lerpLevel(path.lv1[k] || 0, path.lv20[k] || 0, level);
    // Integer values for hp/damage/defense; precise floats for crit ratios/percent.
    out[k] = (k === 'hp' || k === 'damage' || k === 'defense') ? Math.round(v) : v;
  });
  return out;
}