// Build against build (docs/game3d/BUILD_BALANCE.md): real archetypes made through the real
// stores (powerBuild.mjs), fought with the game's own hit resolution (axeStrikeOutcomes), so
// these numbers are the game's, not a model of it.
//
//   node tools/game3d/build-matchups.mjs            the matrix, races, enemies and stat values
//   node tools/game3d/build-matchups.mjs --json     the same as JSON
import { loadAXEStores, buildAXEHero } from './powerBuild.mjs';

// Each archetype is a full build: stat points and elixirs, weapon type with its class passive and
// mastery, an advanced class, the wing and title paths, cape/cores/pet picked for its role, and a Nature.
export const AXE_ARCHETYPES = Object.freeze({
  striker: {
    label: 'Striker (all damage)',
    split: { strength: 0.7, dexterity: 0.2, constitution: 0.1, focus: 0 },
    role: 'offense', wingPath: 'strength', titlePath: 'strength', nature: 'destroyer',
    weapon: { name: 'Striker Sword', masteryWeaponId: 'sword', path: 'damage', advancedClass: 'berserker' },
  },
  bulwark: {
    label: 'Bulwark (all defense)',
    split: { strength: 0.1, dexterity: 0.3, constitution: 0.6, focus: 0 },
    role: 'defense', wingPath: 'endurance', titlePath: 'vitality', nature: 'defensive',
    weapon: { name: 'Bulwark Dual Blade', masteryWeaponId: 'dual_blades', path: 'defense', advancedClass: 'fortress_tank' },
  },
  ranger: {
    label: 'Ranger (precision)',
    split: { strength: 0.45, dexterity: 0.4, constitution: 0.15, focus: 0 },
    role: 'offense', wingPath: 'precision', titlePath: 'dexterity', nature: 'balanced',
    weapon: { name: 'Ranger Bow', masteryWeaponId: 'bow', path: 'ranged', advancedClass: 'sniper' },
  },
  balanced: {
    label: 'Balanced',
    split: { strength: 0.4, dexterity: 0.2, constitution: 0.27, focus: 0.13 },
    role: 'balanced', wingPath: null, titlePath: null, nature: 'balanced',
    weapon: { name: 'Balanced Sword', masteryWeaponId: 'sword', path: 'damage', advancedClass: null },
  },
});

export function buildArchetype(m, id, { level = 100, progress = 1 } = {}) {
  const a = AXE_ARCHETYPES[id];
  buildAXEHero(m, { level, progress, split: a.split, role: a.role, wingPath: a.wingPath, titlePath: a.titlePath, nature: a.nature, weapon: a.weapon });
  // the Nature's skill multiplier (Destroyer) lives outside the sheet; the rotation uses it
  return { id, ...m.hud.getPlayerHUD().derived, level, skillMult: m.asc.getAXEAscensionSkillMultiplier(), natureDef: m.ascSys.AXE_ASCENSION_NATURES[a.nature] };
}

// A Nature that turns part of the damage its hero deals into a shield (the Defensive) gives extra
// HP worth about one shield lifetime of its own damage, never more than its cap.
export function shieldOf(hero, damagePerSecond) {
  const n = hero.natureDef || {};
  if (!n.shieldFromDamage) return 0;
  return Math.min((n.shieldCapOfMaxHp || 0) * hero.maxHP, n.shieldFromDamage * damagePerSecond * ((n.shieldLifeMs || 8000) / 1000));
}

// An attack in a fight: mostly plain swings, some skills. Skills are x1.6 on average (the skill
// ladder's middle), raised by the build's skill bonus and its Nature; both sides are heroes (PvP).
export const ROTATION = Object.freeze({ skillShare: 0.3, skillMultiplier: 1.6 });
// How often the situational class bonuses apply in a duel (AXEStrikeRuntime decides them per hit):
// Power Charge hits, a ranged build's hits from beyond its range, hits from stealth, the momentum
// chain's average length, and the share of the target's HP inside the execute window.
export const UPTIME = Object.freeze({ charged: 0.15, longRange: 0.6, stealth: 0.05, comboChain: 3, executeShare: 0.3 });
const num = (v) => Number(v) || 0;
function situational(A) {
  const ranged = num(A.rangeUnit) > 0;
  const multiplier = (1 + UPTIME.charged * num(A.chargeDamagePct) / 100)
    * (1 + (ranged ? UPTIME.longRange : 0) * num(A.weakspotDamagePct) / 100)
    * (1 + UPTIME.stealth * num(A.stealthDamagePct) / 100)
    * (1 + Math.min(25, num(A.comboPctPerHit) * UPTIME.comboChain) / 100);
  return { bonusMultiplier: Math.min(2, multiplier), critBonus: ranged ? UPTIME.longRange * num(A.rangeCritPct) : 0 };
}
export function perAttack(m, A, B, { targetHpPct = 1 } = {}) {
  const s = situational(A);
  const a = { ...A, critChance: Math.min(50, num(A.critChance) + s.critBonus) };
  const opts = { pvp: true, bonusMultiplier: s.bonusMultiplier, targetHpPct };
  const plain = m.budget.expectedAXEStrike(a, B, opts);
  const skill = m.budget.expectedAXEStrike(a, B, { ...opts, isSkill: true, skillMultiplier: ROTATION.skillMultiplier * (A.skillMult || 1) });
  const mix = (k) => (1 - ROTATION.skillShare) * plain[k] + ROTATION.skillShare * skill[k];
  return { damage: mix('damage'), reflected: mix('reflected'), lifeSteal: mix('lifeSteal') };
}

// One side attacking the other through a whole fight: the average attack outside and inside the
// execute window, per second at its attack speed, swings and seconds to kill, reflect and life steal.
export function duel(m, A, B) {
  const early = perAttack(m, A, B), late = perAttack(m, A, B, { targetHpPct: 0.2 });
  const swingsPerSec = Math.max(0.25, 1 + (Number(A.attackSpeedPct) || 0) / 100);
  const swings = B.maxHP * (1 - UPTIME.executeShare) / Math.max(1e-9, early.damage) + B.maxHP * UPTIME.executeShare / Math.max(1e-9, late.damage);
  const perSwing = B.maxHP / swings;
  const e = { reflected: early.reflected * perSwing / Math.max(1e-9, early.damage), lifeSteal: early.lifeSteal * perSwing / Math.max(1e-9, early.damage) };
  // the defender's sustain: none in plain swings; the attacker's life steal heals the attacker
  return {
    perSwing, swingsToKill: B.maxHP / Math.max(1e-9, perSwing), secondsToKill: B.maxHP / Math.max(1e-9, perSwing * swingsPerSec),
    reflectedPerSwing: e.reflected, lifeStealPerSwing: e.lifeSteal, swingsPerSec,
  };
}

// The race: each attacks the other at its own speed, reflect and life steal included.
export function race(m, A, B) {
  const ab = duel(m, A, B), ba = duel(m, B, A);
  // net damage per second each side takes: the other's hits, plus what its own hits reflect back,
  // less its own life steal
  const aTakes = ba.perSwing * ba.swingsPerSec + ab.reflectedPerSwing * ab.swingsPerSec - ab.lifeStealPerSwing * ab.swingsPerSec;
  const bTakes = ab.perSwing * ab.swingsPerSec + ba.reflectedPerSwing * ba.swingsPerSec - ba.lifeStealPerSwing * ba.swingsPerSec;
  const aLasts = (A.maxHP + shieldOf(A, ab.perSwing * ab.swingsPerSec)) / Math.max(1e-9, aTakes);
  const bLasts = (B.maxHP + shieldOf(B, ba.perSwing * ba.swingsPerSec)) / Math.max(1e-9, bTakes);
  return { aLasts, bLasts, winner: aLasts > bLasts ? A.id : B.id, margin: Math.max(aLasts, bLasts) / Math.max(1e-9, Math.min(aLasts, bLasts)) };
}

// What 10 more points of each attribute give a build, against the Balanced build: offense (its
// damage per second) and survival (how long it lasts against the Balanced build's attacks).
export function statValues(m, id, { level = 100 } = {}) {
  const base = buildArchetype(m, id, { level });
  const foe = buildArchetype(m, 'balanced', { level });
  const speed = (h) => Math.max(0.25, 1 + (Number(h.attackSpeedPct) || 0) / 100);
  // offense per second (Agility's attack speed counts), survival against the same foe
  const before = { off: perAttack(m, base, foe).damage * speed(base), surv: base.maxHP / perAttack(m, foe, base).damage };
  const out = {};
  for (const stat of ['strength', 'dexterity', 'constitution', 'focus']) {
    buildArchetype(m, id, { level });
    m.hud.setPlayerHUD({ unspentPoints: (m.hud.getPlayerHUD().unspentPoints || 0) + 10 });
    m.hud.applyAttributeAllocationPlan({ [stat]: 10 });
    const h = { ...m.hud.getPlayerHUD().derived, level, skillMult: base.skillMult };
    out[stat] = {
      offensePct: (perAttack(m, h, foe).damage * speed(h) / before.off - 1) * 100,
      survivalPct: ((h.maxHP / perAttack(m, foe, h).damage) / before.surv - 1) * 100,
    };
  }
  return out;
}

// Every choice inside a system, on the same Balanced hero: what it gives in offense (damage per
// second), survival (time to fall) and power (the two multiplied), against the Balanced build.
// Alternatives in one system should be worth about the same, each in its own direction.
export const AXE_CHOICES = Object.freeze({
  wing: ['strength', 'endurance', 'precision', 'spirit'].map((id) => ({ id, opts: { wingPath: id } })),
  title: ['strength', 'vitality', 'dexterity', 'spirit', 'harmony'].map((id) => ({ id, opts: { titlePath: id } })),
  nature: ['destroyer', 'balanced', 'defensive'].map((id) => ({ id, opts: { nature: id } })),
  // the weapon in hand with its class passive and mastery, no advanced class
  weapon: [['sword', 'Choice Sword', 'damage'], ['dual_blades', 'Choice Dual Blade', 'defense'], ['bow', 'Choice Bow', 'ranged']]
    .map(([id, name, path]) => ({ id, opts: { weapon: { name, masteryWeaponId: id, path, advancedClass: null } } })),
  swordClass: [null, 'berserker', 'blade_dancer', 'executioner', 'blood_knight'].map((c) => ({ id: c || 'none', opts: { weapon: { name: 'Choice Sword', masteryWeaponId: 'sword', path: 'damage', advancedClass: c } } })),
  guardianClass: [null, 'fortress_tank', 'counter_fighter', 'juggernaut', 'paladin'].map((c) => ({ id: c || 'none', opts: { weapon: { name: 'Choice Dual Blade', masteryWeaponId: 'dual_blades', path: 'defense', advancedClass: c } } })),
  rangedClass: [null, 'sniper', 'tactical_expert', 'explosive_archer', 'shadow_ranger'].map((c) => ({ id: c || 'none', opts: { weapon: { name: 'Choice Bow', masteryWeaponId: 'bow', path: 'ranged', advancedClass: c } } })),
});

export function choiceValues(m, { level = 100 } = {}) {
  const a = AXE_ARCHETYPES.balanced;
  const foe = buildArchetype(m, 'balanced', { level });
  // a whole fight (execute window included), per second; survival counts the Nature's shield
  const measure = (h) => {
    const out = duel(m, h, foe), into = duel(m, foe, h);
    const dps = out.perSwing * out.swingsPerSec;
    // life steal heals while fighting: it takes off the damage taken per second
    const taken = Math.max(1e-9, into.perSwing * into.swingsPerSec - out.lifeStealPerSwing * out.swingsPerSec);
    return { off: dps, surv: (h.maxHP + shieldOf(h, dps)) / taken };
  };
  const out = {};
  for (const [system, list] of Object.entries(AXE_CHOICES)) {
    const rows = list.map(({ id, opts }) => {
      buildAXEHero(m, { level, progress: 1, split: a.split, role: a.role, wingPath: a.wingPath, titlePath: a.titlePath, nature: a.nature, weapon: a.weapon, ...opts });
      return { id, ...measure({ ...m.hud.getPlayerHUD().derived, level, skillMult: m.asc.getAXEAscensionSkillMultiplier(), natureDef: m.ascSys.AXE_ASCENSION_NATURES[opts.nature || a.nature] }) };
    });
    const base = rows[0];
    out[system] = rows.map((r) => ({ id: r.id, offensePct: (r.off / base.off - 1) * 100, survivalPct: (r.surv / base.surv - 1) * 100, powerPct: ((r.off * r.surv) / (base.off * base.surv) - 1) * 100 }));
  }
  return out;
}

export async function measureMatchups({ level = 100 } = {}) {
  const m = await loadAXEStores();
  const ids = Object.keys(AXE_ARCHETYPES);
  const heroes = Object.fromEntries(ids.map((id) => [id, buildArchetype(m, id, { level })]));
  const matrix = {}, races = {};
  for (const a of ids) {
    matrix[a] = {};
    for (const b of ids) matrix[a][b] = duel(m, heroes[a], heroes[b]);
  }
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) races[`${ids[i]}-${ids[j]}`] = race(m, heroes[ids[i]], heroes[ids[j]]);
  const enemies = {};
  for (const id of ids) {
    enemies[id] = {};
    for (const tier of ['normal', 'elite', 'worldBoss']) {
      const foe = m.budget.getAXEEnemyStats(level, tier);
      enemies[id][tier] = { swingsToKill: foe.maxHP / m.budget.expectedAXEStrike(heroes[id], foe).damage, swingsToFall: heroes[id].maxHP / m.budget.expectedAXEStrike(foe, heroes[id]).damage };
    }
  }
  const values = Object.fromEntries(['balanced', 'striker', 'bulwark'].map((id) => [id, statValues(m, id, { level })]));
  const choices = choiceValues(m, { level });
  return { m, heroes, matrix, races, enemies, values, choices };
}

const SHEET = ['damage', 'maxHP', 'defense', 'critChance', 'criticalDamage', 'attackSuccess', 'attackBlock', 'avoidPct', 'blockPct', 'deflectPct', 'damageReductionPct', 'reflectPct', 'lifeStealPct', 'armorPenPct', 'attackSpeedPct'];

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}` || process.argv[1]?.endsWith('build-matchups.mjs')) {
  const { heroes, matrix, races, enemies, values, choices } = await measureMatchups();
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify({ heroes: Object.fromEntries(Object.entries(heroes).map(([k, h]) => [k, Object.fromEntries(SHEET.map((s) => [s, h[s]]))])), matrix, races, enemies, values, choices }, null, 1));
  } else {
    const r = (v, d = 0) => (Number(v) || 0).toFixed(d);
    console.log('Level-100 archetypes (live sheets):');
    for (const [id, h] of Object.entries(heroes)) console.log(`  ${id.padEnd(9)} ${SHEET.map((s) => `${s}=${r(h[s], s.endsWith('Pct') || s === 'criticalDamage' ? 2 : 0)}`).join(' ')}`);
    console.log('\nSwings for the ROW to kill the COLUMN (plain swings; seconds in brackets):');
    const ids = Object.keys(matrix);
    console.log('           ' + ids.map((b) => b.padStart(16)).join(''));
    for (const a of ids) console.log(a.padEnd(11) + ids.map((b) => `${r(matrix[a][b].swingsToKill, 1)} (${r(matrix[a][b].secondsToKill, 1)}s)`.padStart(16)).join(''));
    console.log('\nRaces (who falls first, both swinging):');
    for (const [k, v] of Object.entries(races)) console.log(`  ${k.padEnd(18)} winner ${v.winner.padEnd(9)} by x${r(v.margin, 2)}`);
    console.log('\nAgainst level-100 enemies (swings to kill / swings to fall):');
    for (const [id, t] of Object.entries(enemies)) console.log(`  ${id.padEnd(9)} ${Object.entries(t).map(([k, v]) => `${k} ${r(v.swingsToKill, 1)}/${r(v.swingsToFall, 1)}`).join('   ')}`);
    console.log('\n+10 points, against the Balanced build (offense % / survival %):');
    for (const [id, v] of Object.entries(values)) console.log(`  ${id.padEnd(9)} ${Object.entries(v).map(([k, x]) => `${k} +${r(x.offensePct, 2)}/+${r(x.survivalPct, 2)}`).join('   ')}`);
    console.log('\nChoices within each system, on the Balanced hero, against the first option (offense % / survival % / power %):');
    for (const [system, rows] of Object.entries(choices)) console.log(`  ${system.padEnd(14)} ${rows.map((x) => `${x.id} ${r(x.offensePct, 1)}/${r(x.survivalPct, 1)}/${r(x.powerPct, 1)}`).join('   ')}`);
  }
  process.exit(0);
}
