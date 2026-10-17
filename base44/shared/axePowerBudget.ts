// The Game 3D power budget: the one place every stat system, every enemy and every duel is
// balanced against. docs/game3d/STAT_SYSTEM_AUDIT.md. Owner decisions (2026-10-15):
// percentage defense with diminishing returns, enemies on a level curve set by zones, a
// gear-led budget, and a real hit roll. All numbers are provisional balance.
//
// Shared by the game (src/components/game3d/axe/balance/AXEPowerBudget.js re-exports it)
// and the backend (duelSystem resolves duel hits with it), so both sides use one copy.

type Stats = Record<string, any>;

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
  // hero against hero: every hit is scaled by this, so a duel lasts seconds, not two swings
  // (heroes hit hard enough to clear enemies built for the par hero; docs/game3d/BUILD_BALANCE.md)
  pvpDamageScale: 0.23,
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
// stores by `node tools/game3d/stat-report.mjs --write-par`; the power-budget test fails when
// the systems drift from it, so regenerate it after changing any system's numbers.
// [level, damage, maxHP, defense, attackSuccess, attackBlock, critChance, attributionAttack, attributionDefense,
//  criticalDamage, criticalDefense, armorPenPct, hitBonusPct, avoidPct, blockPct, damageReductionPct]
// (the whole combat sheet, so enemies are calibrated against what heroes really bring)
export const AXE_PAR_HERO_TABLE: ReadonlyArray<ReadonlyArray<number>> = Object.freeze([
  [1, 38, 182, 19.9, 5.1, 10, 6.4, 0, 0, 0, 0.009, 0, 0, 0, 0, 0],
  [5, 142, 505, 63.4, 25.3, 31.8, 9.2, 14, 13, 0.074, 0.05, 0, 0, 0, 0, 0],
  [10, 233, 756, 90.3, 45.1, 56, 10.6, 32, 28, 0.106, 0.076, 0, 0.5, 0, 0, 0],
  [15, 347, 1063, 123.7, 68.4, 85.9, 12.3, 49, 44, 0.138, 0.108, 0, 1.1, 0, 0, 0],
  [20, 478, 1496, 158.4, 90.2, 114.9, 15, 66, 59, 0.171, 0.134, 0, 1.6, 0, 0, 0],
  [25, 605, 1936, 220.2, 113.7, 145.4, 16.9, 86, 75, 0.211, 0.189, 0, 2.1, 0, 0, 0],
  [30, 714, 2234, 255.2, 134.5, 172.8, 18.4, 102.5, 91.5, 0.246, 0.22, 0, 2.6, 0, 0, 0],
  [40, 1011, 3228, 365.3, 180.3, 237.3, 20.9, 136.5, 122.5, 0.314, 0.307, 3.7, 3.7, 0, 0, 0],
  [50, 1317, 4136, 466.1, 225.1, 300.3, 24.4, 175.5, 154.5, 0.394, 0.377, 4.7, 4.7, 0, 0, 0],
  [60, 1688, 5186, 589.8, 273.3, 377.4, 28.1, 205.5, 184.5, 0.465, 0.458, 5.8, 5.8, 0, 0, 0],
  [70, 2156, 6787, 820.8, 320.7, 458.1, 33.2, 244.5, 216.5, 0.539, 0.555, 6.8, 6.8, 0, 0, 0],
  [80, 2575, 8096, 976, 368.7, 541.6, 37.3, 276, 248, 0.627, 0.6, 7.9, 7.9, 0, 0, 0],
  [90, 3346, 10397, 1247.6, 413.6, 647.6, 41.6, 315, 280, 0.749, 0.6, 8.9, 8.9, 0, 0, 0],
  [100, 4126.6, 13321, 1563.5, 491.2, 792.8, 44.8, 345, 340, 0.811, 0.6, 10, 10, 0, 0, 0],
]);

const PAR_KEYS = ['level', 'damage', 'maxHP', 'defense', 'attackSuccess', 'attackBlock', 'critChance', 'attributionAttack', 'attributionDefense',
  'criticalDamage', 'criticalDefense', 'armorPenPct', 'hitBonusPct', 'avoidPct', 'blockPct', 'damageReductionPct'];
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function getAXEParHero(level: number = 1): Stats {
  const L = Math.max(1, Math.min(AXE_LEVEL_CAP, Number(level) || 1));
  const rows = AXE_PAR_HERO_TABLE;
  let i = 0;
  while (i < rows.length - 2 && rows[i + 1][0] < L) i++;
  const a = rows[i], b = rows[Math.min(rows.length - 1, i + 1)];
  const t = b[0] === a[0] ? 0 : clamp((L - a[0]) / (b[0] - a[0]), 0, 1);
  return Object.fromEntries(PAR_KEYS.map((k, j) => [k, j === 0 ? L : lerp(a[j] ?? 0, b[j] ?? 0, t)]));
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

export const AXE_ENEMY_TIERS: Readonly<Record<string, Readonly<{ hp: number; damage: number; defense: number }>>> = Object.freeze({
  normal: Object.freeze({ hp: 1, damage: 1, defense: 1 }),
  champion: Object.freeze({ hp: 2.5, damage: 1.25, defense: 1.1 }),
  elite: Object.freeze({ hp: 5, damage: 1.5, defense: 1.25 }),
  miniBoss: Object.freeze({ hp: 15, damage: 2, defense: 1.4 }),
  caveBoss: Object.freeze({ hp: 30, damage: 2.4, defense: 1.5 }),
  gateBoss: Object.freeze({ hp: 50, damage: 2.8, defense: 1.6 }),
  worldBoss: Object.freeze({ hp: 120, damage: 3.2, defense: 1.8 }),
});

export function getAXEDamageReduction(defense: number, attackerLevel: number = 1): number {
  const R = AXE_COMBAT_RULES;
  const def = Math.max(0, Number(defense) || 0);
  const par = Math.max(1, getAXEParHero(attackerLevel).defense);
  return Math.min(R.mitigationCapPct / 100, def / (def + R.defenseParRatio * par));
}

export function getAXEAttributeReduction(attributeDefense: number, attackerLevel: number = 1): number {
  const R = AXE_COMBAT_RULES;
  const def = Math.max(0, Number(attributeDefense) || 0);
  const par = Math.max(1, getAXEParHero(attackerLevel).attributionDefense);
  return Math.min(R.mitigationCapPct / 100, def / (def + R.attributeParRatio * par));
}

export function getAXEHitChancePct(accuracy: number, block: number): number {
  const R = AXE_COMBAT_RULES;
  const a = Math.max(0, Number(accuracy) || 0), b = Math.max(0, Number(block) || 0);
  const edge = a + b > 0 ? (a - b) / (a + b) : 0;
  return clamp(R.hitBasePct + R.hitSpreadPct * edge, R.hitMinPct, R.hitMaxPct);
}

export function getAXELevelGapMultiplier(attackerLevel: number = 1, defenderLevel: number = 1): number {
  const R = AXE_COMBAT_RULES;
  return clamp(1 + R.levelGapPerLevel * ((Number(attackerLevel) || 1) - (Number(defenderLevel) || 1)), R.levelGapMin, R.levelGapMax);
}

// ---- one sheet, one hit (docs/game3d/BUILD_BALANCE.md) ---------------------------------
// Every build effect (weapon class, weapon mastery, advanced class, affinity) is a stat on the
// sheet, capped here, and every hit (the hero's, an enemy's, a duel's) is resolved by the
// outcomes below. Nothing multiplies outside them, so a defense build can't stack itself out
// of reach and a damage build can't stack itself past every defense.
export const AXE_BUILD_CAPS = Object.freeze({
  damagePct: 60, // permanent % damage from every build system, in the stat pool
  defensePct: 60,
  critDamage: 1, // a crit is at most x(2 + 1)
  criticalDefense: 0.6,
  critDodgePct: 40, // the attacker's crit chance is cut by at most this share
  armorPenPct: 20, // the share of the defender's defense ignored
  hitBonusPct: 10, // accuracy bonuses, added to the hit roll (within its 50–98% clamp)
  avoidPct: 20, // dodge, guard, evade from every system: one roll after the hit roll
  deflectPct: 8, // part of avoidance: the hit is turned back instead
  deflectReflect: 0.3, // a deflected hit returns this share to the attacker
  totalAvoidPct: 50, // missed + avoided never above half: every attacker lands at least half
  blockPct: 25, // a blocked hit is halved
  blockReduction: 0.5,
  damageReductionPct: 20, // reduction from systems, on top of defense
  totalMitigationPct: 75, // defense and every reduction together
  reflectPct: 10, // of the damage taken, back to the attacker
  lifeStealPct: 10,
  skillDamagePct: 50, // extra damage on skills (ability bonuses)
  executeThresholdPct: 30,
  executeDamagePct: 60,
  attackSpeedPct: 40,
  conditionalDamagePct: 50, // each situational bonus: Power Charge hits, weak spots, from stealth
  conditionalCritPct: 15, // crit chance on long-range hits
});

const capped = (v: unknown, cap: number) => clamp(Number(v) || 0, 0, cap);

// What the defender's defense and every damage reduction take off, together, capped.
export function getAXETotalMitigation(attacker: Stats, defender: Stats): number {
  const C = AXE_BUILD_CAPS;
  const pen = capped(attacker.armorPenPct, C.armorPenPct) / 100;
  const fromDefense = getAXEDamageReduction(Math.max(0, Number(defender.defense) || 0) * (1 - pen), Number(attacker.level) || 1);
  const extra = capped(defender.damageReductionPct, C.damageReductionPct) / 100;
  return Math.min(C.totalMitigationPct / 100, 1 - (1 - fromDefense) * (1 - extra));
}

// The attacker's crit chance after the defender's crit dodge, capped (percentage points).
export function getAXEStrikeCritChance(attacker: Stats, defender: Stats): number {
  const C = AXE_BUILD_CAPS;
  const dodge = capped(defender.critChanceReductionPct ?? defender.critDodgePct, C.critDodgePct) / 100;
  return capped(attacker.critChance, AXE_COMBAT_RULES.critChanceCapPct) * (1 - dodge);
}

type StrikeOptions = {
  critical?: boolean; skillMultiplier?: number; isSkill?: boolean; blocked?: boolean;
  bonusMultiplier?: number; targetHpPct?: number; round?: boolean; pvp?: boolean;
};

// One landed swing (no hit roll), crit and block decided by the caller. The duel server, the
// game's resolveAXEHit and the outcomes below all use it.
export function computeAXESwing(attacker: Stats, defender: Stats, {
  critical = false, skillMultiplier = 1, isSkill = false, blocked = false, bonusMultiplier = 1, targetHpPct = 1, round = true, pvp = false,
}: StrikeOptions = {}): number {
  const R = AXE_COMBAT_RULES, C = AXE_BUILD_CAPS;
  const aL = Number(attacker.level) || 1, dL = Number(defender.level) || 1;
  const skill = Math.max(0, Number(skillMultiplier) || 0) * Math.max(0, Number(bonusMultiplier) || 0)
    * (isSkill ? 1 + capped(attacker.skillDamagePct, C.skillDamagePct) / 100 : 1);
  const executing = capped(attacker.executeThresholdPct, C.executeThresholdPct) > 0
    && (Number(targetHpPct) || 0) * 100 <= capped(attacker.executeThresholdPct, C.executeThresholdPct);
  const execute = executing ? 1 + capped(attacker.executeDamagePct, C.executeDamagePct) / 100 : 1;
  const critScale = critical
    ? 1 + Math.max(0, R.critMultiplier + capped(attacker.criticalDamage, C.critDamage) - 1) * (1 - capped(defender.criticalDefense, C.criticalDefense))
    : 1;
  const physical = Math.max(1, Number(attacker.totalDamage ?? attacker.damage ?? 1) || 1) * (1 - getAXETotalMitigation(attacker, defender));
  const attribute = Math.max(0, Number(attacker.attributionAttack) || 0) * (1 - getAXEAttributeReduction(defender.attributionDefense, aL));
  const raw = (physical + attribute) * skill * execute * critScale * getAXELevelGapMultiplier(aL, dL)
    * (blocked ? 1 - C.blockReduction : 1) * (pvp ? R.pvpDamageScale : 1);
  return round ? Math.max(1, Math.round(raw)) : Math.max(0, raw);
}

export type StrikeOutcome = {
  kind: 'miss' | 'avoid' | 'deflect' | 'hit'; p: number; damage: number; critical: boolean; blocked: boolean;
  reflected: number; lifeSteal: number;
};

// Every way one swing can end, with its chance. The hit roll (Accuracy against Block) first;
// then the defender's avoidance and deflect (together never more than totalAvoidPct with the
// misses); then crit and block. Reflect returns part of the damage taken; life steal heals
// part of the damage dealt. A forced critical (Critical Focus) never misses.
export function axeStrikeOutcomes(attacker: Stats, defender: Stats, opts: StrikeOptions & { forcedCritical?: boolean } = {}): StrikeOutcome[] {
  const C = AXE_BUILD_CAPS;
  const forced = !!opts.forcedCritical;
  const R = AXE_COMBAT_RULES;
  const hit = forced ? 1 : clamp(getAXEHitChancePct(attacker.attackSuccess, defender.attackBlock) + capped(attacker.hitBonusPct, C.hitBonusPct), R.hitMinPct, R.hitMaxPct) / 100;
  let avoid = forced ? 0 : capped(defender.avoidPct, C.avoidPct) / 100;
  let deflect = forced ? 0 : capped(defender.deflectPct, C.deflectPct) / 100;
  // missed + avoided + deflected stays within the cap: avoidance shrinks first
  const room = Math.max(0, C.totalAvoidPct / 100 - (1 - hit));
  if (hit * (avoid + deflect) > room) {
    const scale = room / Math.max(1e-9, hit * (avoid + deflect));
    avoid *= scale; deflect *= scale;
  }
  const crit = forced || opts.critical === true ? 1 : opts.critical === false ? 0 : getAXEStrikeCritChance(attacker, defender) / 100;
  const block = capped(defender.blockPct, C.blockPct) / 100;
  const reflect = capped(defender.reflectPct, C.reflectPct) / 100;
  const steal = capped(attacker.lifeStealPct, C.lifeStealPct) / 100;
  const swing = (critical: boolean, blocked: boolean) => computeAXESwing(attacker, defender, { ...opts, critical, blocked });
  const out: StrikeOutcome[] = [];
  if (hit < 1) out.push({ kind: 'miss', p: 1 - hit, damage: 0, critical: false, blocked: false, reflected: 0, lifeSteal: 0 });
  if (avoid > 0) out.push({ kind: 'avoid', p: hit * avoid, damage: 0, critical: false, blocked: false, reflected: 0, lifeSteal: 0 });
  if (deflect > 0) {
    const turned = swing(false, false);
    out.push({ kind: 'deflect', p: hit * deflect, damage: 0, critical: false, blocked: false, reflected: Math.round(turned * C.deflectReflect), lifeSteal: 0 });
  }
  const landed = hit * (1 - avoid - deflect);
  for (const [critical, pc] of [[true, crit], [false, 1 - crit]] as const) {
    for (const [blocked, pb] of [[true, block], [false, 1 - block]] as const) {
      const p = landed * pc * pb;
      if (p <= 0) continue;
      const damage = swing(critical, blocked);
      out.push({ kind: 'hit', p, damage, critical, blocked, reflected: Math.round(damage * reflect), lifeSteal: Math.round(damage * steal) });
    }
  }
  return out;
}

// One swing resolved with a roll in [0, 1).
export function rollAXEStrike(outcomes: StrikeOutcome[], roll: number = Math.random()): StrikeOutcome {
  let r = Math.max(0, Math.min(0.999999, Number(roll) || 0));
  for (const o of outcomes) { if (r < o.p) return o; r -= o.p; }
  return outcomes[outcomes.length - 1];
}

// The average of one swing: damage, damage turned back, healing.
export function expectedAXEStrike(attacker: Stats, defender: Stats, opts: StrikeOptions = {}) {
  const outcomes = axeStrikeOutcomes(attacker, defender, { ...opts, round: false });
  return outcomes.reduce((sum, o) => ({ damage: sum.damage + o.p * o.damage, reflected: sum.reflected + o.p * o.reflected, lifeSteal: sum.lifeSteal + o.p * o.lifeSteal }), { damage: 0, reflected: 0, lifeSteal: 0 });
}

// Average damage of one swing (misses and crits included), for the curve and the budget test.
export function getAXEExpectedHit(attacker: Stats, defender: Stats): number {
  return expectedAXEStrike({ ...attacker, totalDamage: attacker.totalDamage ?? attacker.damage ?? 0 }, defender).damage;
}

// The stats of an enemy of `level` and `tier`, in the shape computeDerivedStats returns.
export function getAXEEnemyStats(level: number = 1, tier: string = 'normal'): Stats {
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

// ---- duels -----------------------------------------------------------------------------
// The combat stats a duelist brings, as the server keeps them. Progression still lives in
// each player's browser, so these are reported by the client; every field is clamped to
// what a fully built level-100 hero can have (with headroom), so a tampered client cannot
// bring absurd numbers. Making progression server-owned is what makes them trustworthy.
const MAX_HERO = AXE_PAR_HERO_TABLE[AXE_PAR_HERO_TABLE.length - 1];
export const AXE_DUEL_STAT_LIMITS: Readonly<Record<string, number>> = Object.freeze({
  level: AXE_LEVEL_CAP,
  damage: MAX_HERO[1] * 1.5,
  maxHP: MAX_HERO[2] * 1.5,
  defense: MAX_HERO[3] * 1.5,
  attackSuccess: MAX_HERO[4] * 1.5,
  attackBlock: MAX_HERO[5] * 1.5,
  critChance: AXE_COMBAT_RULES.critChanceCapPct,
  attributionAttack: MAX_HERO[7] * 1.5,
  attributionDefense: MAX_HERO[8] * 1.5,
  criticalDamage: 1,
  criticalDefense: 0.6,
  // the build effects (docs/game3d/BUILD_BALANCE.md), each at its cap
  avoidPct: 20, deflectPct: 8, blockPct: 25, damageReductionPct: 20, reflectPct: 10, lifeStealPct: 10,
  armorPenPct: 20, hitBonusPct: 10, critChanceReductionPct: 40, skillDamagePct: 50,
  executeThresholdPct: 30, executeDamagePct: 60,
});

export function clampAXEDuelStats(stats: Stats = {}): Stats {
  const out: Stats = {};
  for (const [k, max] of Object.entries(AXE_DUEL_STAT_LIMITS)) {
    const v = Number(stats?.[k]);
    out[k] = clamp(Number.isFinite(v) ? v : 0, 0, max);
  }
  out.level = Math.max(1, Math.round(out.level || 1));
  out.maxHP = Math.max(1, Math.round(out.maxHP || 1));
  out.damage = Math.max(1, out.damage || 1);
  return out;
}
