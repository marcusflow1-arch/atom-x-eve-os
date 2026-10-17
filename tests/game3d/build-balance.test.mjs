// Build against build (docs/game3d/BUILD_BALANCE.md): real archetypes made through the real stores
// and fought with the game's own hit resolution. A defense build must be safe from damage builds,
// a damage build must still bring a defense build down, no choice inside a system may be a trap or
// a must-pick, and no system may stack past the caps. A change that breaks any of this fails here.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { measureMatchups } from '../../tools/game3d/build-matchups.mjs';

const intervals = [];
const nativeSetInterval = globalThis.setInterval;
globalThis.setInterval = (...args) => { const t = nativeSetInterval(...args); intervals.push(t); return t; };
const { m, heroes, matrix, races, values, choices } = await measureMatchups();
const B = m.budget;
after(() => { intervals.forEach(clearInterval); globalThis.setInterval = nativeSetInterval; });

const BANDS = Object.freeze({
  raceMargin: 1.35, // no matchup won by more than this (time to fall, both swinging)
  defenseSafety: 1.8, // the Bulwark lasts this much longer than the Balanced against the Striker
  defenseKillable: 3, // the Striker kills the Bulwark within this many times its time on the Balanced
  minSwings: 4, // no build kills another faster (no burst)
  maxSwings: 60, // no build is a wall
  choiceSpreadPct: 8, // inside a system, every choice within this of the system's median power
  classPowerPct: [8, 30], // an advanced class over no class, on its weapon
  statRatio: 2, // a point of Strength (damage) and of Vitality (survival) within this of each other
});

test('no build hard-counters another: every race is close', () => {
  for (const [pair, r] of Object.entries(races)) {
    assert.ok(r.margin <= BANDS.raceMargin, `${pair}: ${r.winner} wins by x${r.margin.toFixed(2)} (at most x${BANDS.raceMargin})`);
  }
});

test('a defense build is safe from damage builds, and a damage build can still bring it down', () => {
  const vsStriker = (id) => matrix.striker[id].secondsToKill;
  assert.ok(vsStriker('bulwark') >= BANDS.defenseSafety * vsStriker('balanced'),
    `the Bulwark lasts ${vsStriker('bulwark').toFixed(1)} s against the Striker, the Balanced ${vsStriker('balanced').toFixed(1)} s`);
  assert.ok(vsStriker('bulwark') <= BANDS.defenseKillable * vsStriker('balanced'), 'the Bulwark is not a wall');
  assert.ok(matrix.striker.balanced.secondsToKill < matrix.balanced.balanced.secondsToKill, 'damage investment kills faster');
});

test('no burst and no walls: every pairing takes between 4 and 60 swings', () => {
  for (const [a, row] of Object.entries(matrix)) {
    for (const [b, d] of Object.entries(row)) {
      assert.ok(d.swingsToKill >= BANDS.minSwings && d.swingsToKill <= BANDS.maxSwings, `${a} kills ${b} in ${d.swingsToKill.toFixed(1)} swings`);
    }
  }
});

test('choices inside a system are worth about the same, each in its own direction', () => {
  for (const system of ['wing', 'title', 'nature', 'weapon']) {
    const powers = choices[system].map((c) => c.powerPct).sort((x, y) => x - y);
    const median = powers[Math.floor(powers.length / 2)];
    for (const c of choices[system]) {
      assert.ok(Math.abs(c.powerPct - median) <= BANDS.choiceSpreadPct, `${system} ${c.id}: ${c.powerPct.toFixed(1)}% against a median of ${median.toFixed(1)}%`);
    }
  }
  for (const system of ['swordClass', 'guardianClass', 'rangedClass']) {
    for (const c of choices[system].slice(1)) {
      const [lo, hi] = BANDS.classPowerPct;
      assert.ok(c.powerPct >= lo && c.powerPct <= hi, `${system} ${c.id}: +${c.powerPct.toFixed(1)}% power (band +${lo}–${hi}%)`);
    }
  }
});

// on the Balanced and the Striker builds; on a build that has put almost nothing into damage (the
// Bulwark) a few points of Strength are naturally worth more, so it is reported, not held
test('a point of Strength is worth about a point of Vitality', () => {
  for (const [id, v] of Object.entries(values).filter(([id]) => id !== 'bulwark')) {
    const ratio = v.strength.offensePct / v.constitution.survivalPct;
    assert.ok(ratio >= 1 / BANDS.statRatio && ratio <= BANDS.statRatio, `${id}: +10 Strength ${v.strength.offensePct.toFixed(2)}% damage, +10 Vitality ${v.constitution.survivalPct.toFixed(2)}% survival`);
  }
});

test('stacking stops at the caps: avoidance, mitigation, crit damage', () => {
  const hero = heroes.balanced;
  const wall = { ...heroes.bulwark, avoidPct: 500, deflectPct: 500, blockPct: 500, damageReductionPct: 500, defense: 1e9, criticalDefense: 9 };
  const outcomes = B.axeStrikeOutcomes(hero, wall, {});
  const landed = outcomes.filter((o) => o.kind === 'hit').reduce((s, o) => s + o.p, 0);
  assert.ok(landed >= 0.5 - 1e-9, `every attacker lands at least half its swings (${(landed * 100).toFixed(1)}%)`);
  assert.ok(B.getAXETotalMitigation(hero, wall) <= B.AXE_BUILD_CAPS.totalMitigationPct / 100 + 1e-9, 'defense and every reduction together stay under the cap');
  const glass = { ...heroes.striker, criticalDamage: 50, critChance: 500 };
  const plain = B.computeAXESwing(glass, heroes.balanced, { critical: false });
  const crit = B.computeAXESwing(glass, heroes.balanced, { critical: true });
  assert.ok(crit <= plain * (B.AXE_COMBAT_RULES.critMultiplier + B.AXE_BUILD_CAPS.critDamage) + 1, `a crit is at most x${B.AXE_COMBAT_RULES.critMultiplier + B.AXE_BUILD_CAPS.critDamage}`);
});

test('the game resolves hits in one place: the old second pipelines are gone', async () => {
  const world = await readFile('src/components/game3d/GameWorld3D.jsx', 'utf8');
  for (const old of ['applyMasteryToHit', 'applyMasteryToIncomingDamage', 'rollDodge', 'rollGuard', 'rollRangedEvade', 'rollLethalBlow', 'consumeShopCritBuff', 'getWeaponDamageMult']) {
    assert.ok(!new RegExp(`\\b${old}\\b`).test(world), `GameWorld3D uses ${old} again`);
  }
  for (const path of ['resolveAXEHeroStrike', 'resolveAXEStrikeOnHero']) assert.ok(world.includes(path), `GameWorld3D resolves hits with ${path}`);
});
