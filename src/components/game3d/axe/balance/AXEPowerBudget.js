// The Game 3D power budget: the one place every stat system and every enemy is balanced
// against. docs/game3d/STAT_SYSTEM_AUDIT.md. Owner decisions (2026-10-15): percentage
// defense with diminishing returns, enemies on a level curve set by zones, a gear-led
// budget, and a real hit roll. All numbers are provisional balance.

export const AXE_LEVEL_CAP = 100;

export const AXE_COMBAT_RULES = Object.freeze({
  critChanceCapPct: 50,
  critMultiplier: 2, // base; crit damage adds to it, crit defense takes from the bonus part
  // reduction = DEF / (DEF + defenseParRatio x the par hero's defense at the ATTACKER's level),
  // capped: a par defender takes 40% less, and no amount of defense makes anyone immune
  defenseParRatio: 1.5,
  mitigationCapPct: 75,
  // attribute (elemental) attack is extra damage that only attribute defense reduces, the same way
  attributeParRatio: 1.5,
  // hit chance = hitBase + hitSpread x (ACC - BLK) / (ACC + BLK), clamped
  hitBasePct: 85,
  hitSpreadPct: 50,
  hitMinPct: 50,
  hitMaxPct: 98,
  // damage x (1 + levelGapPerLevel x (attacker level - defender level)), clamped
  levelGapPerLevel: 0.08,
  levelGapMin: 0.5,
  levelGapMax: 1.5,
});

// Each group's share of a fully built level-100 hero's damage and HP: what the hero loses
// without the group (tools/game3d/powerBuild.mjs measureAXEGroupShares). The power-budget
// test holds every group inside its band.
export const AXE_POWER_BUDGET = Object.freeze({
  character: Object.freeze({ target: 0.20, min: 0.13, max: 0.28 }),
  gear: Object.freeze({ target: 0.35, min: 0.27, max: 0.43 }),
  prestige: Object.freeze({ target: 0.20, min: 0.13, max: 0.27 }),
  companions: Object.freeze({ target: 0.12, min: 0.06, max: 0.18 }),
  appearance: Object.freeze({ target: 0.05, min: 0.02, max: 0.09 }),
  ascension: Object.freeze({ target: 0.08, min: 0.04, max: 0.12 }),
});

// The par hero: the live stats of a hero whose systems have advanced in step with their
// level (progress = (level - 1) / (cap - 1); see buildAXEHero). Generated from the real
// stores by `node tools/game3d/stat-report.mjs --par`; the power-budget test fails when the
// systems drift from it, so regenerate it after changing any system's numbers.
// [level, damage, maxHP, defense, attackSuccess, attackBlock, critChance, attributionAttack, attributionDefense]
export const AXE_PAR_HERO_TABLE = Object.freeze([
  [1, 30, 207, 19.9, 5.1, 10, 6.4, 0, 0],
  [5, 118, 574, 63.4, 25.3, 31.8, 9.8, 14, 13],
  [10, 190, 873, 90.3, 45.1, 56, 11.5, 32, 28],
  [15, 278, 1238, 123.7, 68.4, 85.9, 13.6, 49, 44],
  [20, 385, 1725, 158.4, 90.2, 114.9, 16.7, 66, 59],
  [25, 484, 2224, 220.2, 113.7, 145.4, 19, 86, 75],
  [30, 567, 2573, 255.2, 134.5, 172.8, 20.9, 102.5, 91.5],
  [40, 794, 3702, 365.3, 180.3, 237.3, 24.2, 136.5, 122.5],
  [50, 1030, 4727, 466.1, 225.1, 300.3, 28.5, 175.5, 154.5],
  [60, 1312, 5904, 589.8, 273.3, 377.4, 33.1, 205.5, 184.5],
  [70, 1678, 7624, 820.8, 320.7, 458.1, 39, 244.5, 216.5],
  [80, 1989, 9059, 976, 368.7, 541.6, 43.9, 276, 248],
  [90, 2597, 11488, 1247.6, 413.6, 647.6, 49, 315, 280],
  [100, 3174.7, 14618.5, 1563.5, 491.2, 792.8, 50, 345, 340],
]);

const PAR_KEYS = ['level', 'damage', 'maxHP', 'defense', 'attackSuccess', 'attackBlock', 'critChance', 'attributionAttack', 'attributionDefense'];
const lerp = (a, b, t) => a + (b - a) * t;

export function getAXEParHero(level = 1) {
  const L = Math.max(1, Math.min(AXE_LEVEL_CAP, Number(level) || 1));
  const rows = AXE_PAR_HERO_TABLE;
  let i = 0;
  while (i < rows.length - 2 && rows[i + 1][0] < L) i++;
  const [a, b] = [rows[i], rows[Math.min(rows.length - 1, i + 1)]];
  const t = b[0] === a[0] ? 0 : Math.max(0, Math.min(1, (L - a[0]) / (b[0] - a[0])));
  return Object.fromEntries(PAR_KEYS.map((k, j) => [k, j === 0 ? L : lerp(a[j], b[j], t)]));
}

// ---- enemies ---------------------------------------------------------------------------
// An even-level normal enemy takes a par hero about `hitsToKill` average hits (misses and
// crits included) and kills a par hero in about `hitsToKillHero`. Tiers scale from there.
export const AXE_ENEMY_TARGETS = Object.freeze({
  hitsToKill: 5,
  hitsToKillHero: 17,
  defenseOfPar: 0.6, // enemies are softer than heroes
  accuracyOfPar: 0.9,
  blockOfPar: 0.8,
  attributeDefenseOfPar: 0.6,
  critChancePct: 5,
});

export const AXE_ENEMY_TIERS = Object.freeze({
  normal: Object.freeze({ hp: 1, damage: 1, defense: 1 }),
  champion: Object.freeze({ hp: 2.5, damage: 1.25, defense: 1.1 }),
  elite: Object.freeze({ hp: 5, damage: 1.5, defense: 1.25 }),
  miniBoss: Object.freeze({ hp: 15, damage: 2, defense: 1.4 }),
  caveBoss: Object.freeze({ hp: 30, damage: 2.4, defense: 1.5 }),
  gateBoss: Object.freeze({ hp: 50, damage: 2.8, defense: 1.6 }),
  worldBoss: Object.freeze({ hp: 120, damage: 3.2, defense: 1.8 }),
});

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export function getAXEDamageReduction(defense, attackerLevel = 1) {
  const R = AXE_COMBAT_RULES;
  const def = Math.max(0, Number(defense) || 0);
  const par = Math.max(1, getAXEParHero(attackerLevel).defense);
  return Math.min(R.mitigationCapPct / 100, def / (def + R.defenseParRatio * par));
}

export function getAXEAttributeReduction(attributeDefense, attackerLevel = 1) {
  const R = AXE_COMBAT_RULES;
  const def = Math.max(0, Number(attributeDefense) || 0);
  const par = Math.max(1, getAXEParHero(attackerLevel).attributionDefense);
  return Math.min(R.mitigationCapPct / 100, def / (def + R.attributeParRatio * par));
}

export function getAXEHitChancePct(accuracy, block) {
  const R = AXE_COMBAT_RULES;
  const a = Math.max(0, Number(accuracy) || 0), b = Math.max(0, Number(block) || 0);
  const edge = a + b > 0 ? (a - b) / (a + b) : 0;
  return clamp(R.hitBasePct + R.hitSpreadPct * edge, R.hitMinPct, R.hitMaxPct);
}

export function getAXELevelGapMultiplier(attackerLevel = 1, defenderLevel = 1) {
  const R = AXE_COMBAT_RULES;
  return clamp(1 + R.levelGapPerLevel * ((Number(attackerLevel) || 1) - (Number(defenderLevel) || 1)), R.levelGapMin, R.levelGapMax);
}

// Average damage of one swing (misses and crits included), for the curve and the budget test.
export function getAXEExpectedHit(attacker, defender) {
  const R = AXE_COMBAT_RULES;
  const aL = attacker.level || 1, dL = defender.level || 1;
  const crit = clamp(Number(attacker.critChance) || 0, 0, R.critChanceCapPct) / 100;
  const critFactor = 1 + crit * (R.critMultiplier - 1);
  const physical = (attacker.damage || 0) * (1 - getAXEDamageReduction(defender.defense, aL));
  const attribute = (attacker.attributionAttack || 0) * (1 - getAXEAttributeReduction(defender.attributionDefense, aL));
  return (physical + attribute) * critFactor * getAXELevelGapMultiplier(aL, dL)
    * (getAXEHitChancePct(attacker.attackSuccess, defender.attackBlock) / 100);
}

// The stats of an enemy of `level` and `tier`, in the shape computeDerivedStats returns.
export function getAXEEnemyStats(level = 1, tier = 'normal') {
  const T = AXE_ENEMY_TARGETS;
  const scale = AXE_ENEMY_TIERS[tier] || AXE_ENEMY_TIERS.normal;
  const L = Math.max(1, Math.min(AXE_LEVEL_CAP, Math.round(Number(level) || 1)));
  const par = getAXEParHero(L);
  const defense = par.defense * T.defenseOfPar * scale.defense;
  const base = {
    level: L, critChance: T.critChancePct, criticalDefense: 0, criticalDamage: 0,
    attackSuccess: par.attackSuccess * T.accuracyOfPar, attackBlock: par.attackBlock * T.blockOfPar,
    defense, attributionAttack: 0, attributionDefense: par.attributionDefense * T.attributeDefenseOfPar,
  };
  // HP: hitsToKill of the par hero's average swing against this enemy
  const heroSwing = getAXEExpectedHit(par, { ...base, level: L });
  // attack: the par hero dies in hitsToKillHero of this enemy's average swings
  const perPointOfAttack = getAXEExpectedHit({ ...base, damage: 1, attributionAttack: 0 }, { ...par, level: L });
  const damage = Math.max(1, Math.round((par.maxHP / T.hitsToKillHero / Math.max(1e-6, perPointOfAttack)) * scale.damage));
  return {
    ...base,
    defense,
    maxHP: Math.max(1, Math.round(heroSwing * T.hitsToKill * scale.hp)),
    damage, totalDamage: damage, physicalDamage: damage, elementalDamage: 0,
    hitChance: getAXEHitChancePct(base.attackSuccess, par.attackBlock),
    tier: AXE_ENEMY_TIERS[tier] ? tier : 'normal',
  };
}
