// The power budget guard (docs/game3d/STAT_SYSTEM_AUDIT.md, axe/balance/AXEPowerBudget.js).
// Heroes are built through the real stores (tools/game3d/powerBuild.mjs). When a system's
// numbers change, this test says whether the game still adds up: every group inside its
// budget band, the par table in step with the systems, enemies on their time-to-kill
// targets, and nobody immune.
//
// After a deliberate balance change: node tools/game3d/stat-report.mjs --write-par
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { rm } from 'node:fs/promises';
import { AXE_POWER_GROUPS, buildAXEHero, loadAXEStores, measureAXEGroupShares } from '../../tools/game3d/powerBuild.mjs';

const intervals = [];
const nativeSetInterval = globalThis.setInterval;
globalThis.setInterval = (...args) => { const timer = nativeSetInterval(...args); intervals.push(timer); return timer; };
const m = await loadAXEStores(process.cwd());
const B = m.budget;
after(async () => { intervals.forEach(clearInterval); globalThis.setInterval = nativeSetInterval; await rm(m.temp, { recursive: true, force: true }); });

const progressAt = (level) => (level - 1) / (B.AXE_LEVEL_CAP - 1);
const pct = (v) => `${(v * 100).toFixed(1)}%`;

test('every group stays inside its budget band, whichever wing path the hero takes', () => {
  for (const path of m.wingsData.WING_PATHS) {
    const { shares } = measureAXEGroupShares(m, { level: B.AXE_LEVEL_CAP, progress: 1, wingPath: path.id });
    for (const group of Object.keys(AXE_POWER_GROUPS)) {
      const band = B.AXE_POWER_BUDGET[group];
      for (const k of ['damageShare', 'hpShare']) {
        const v = shares[group][k];
        assert.ok(v >= band.min && v <= band.max, `${path.name}: ${group} ${k} ${pct(v)} is outside ${pct(band.min)}–${pct(band.max)}`);
      }
    }
  }
});

test('the par table matches what the systems give a hero at each level', () => {
  for (const [level, damage, maxHP, defense] of B.AXE_PAR_HERO_TABLE) {
    const hero = buildAXEHero(m, { level, progress: progressAt(level) });
    for (const [k, want] of [['damage', damage], ['maxHP', maxHP], ['defense', defense]]) {
      const drift = Math.abs(hero[k] - want) / Math.max(1, want);
      assert.ok(drift < 0.03, `level ${level} ${k}: systems give ${hero[k].toFixed(1)}, table says ${want} — run node tools/game3d/stat-report.mjs --write-par`);
    }
  }
});

test('a par hero kills an even-level enemy in about 5 swings and falls in about 17, at every level', () => {
  for (const level of [1, 5, 10, 25, 50, 75, 100]) {
    const hero = buildAXEHero(m, { level, progress: progressAt(level) });
    const enemy = B.getAXEEnemyStats(level, 'normal');
    const toKill = enemy.maxHP / B.getAXEExpectedHit(hero, enemy);
    const toFall = hero.maxHP / B.getAXEExpectedHit(enemy, hero);
    assert.ok(toKill >= 4 && toKill <= 6, `level ${level}: ${toKill.toFixed(1)} swings to kill`);
    assert.ok(toFall >= 14 && toFall <= 20, `level ${level}: ${toFall.toFixed(1)} enemy swings to fall`);
    const chance = B.getAXEHitChancePct(hero.attackSuccess, enemy.attackBlock);
    assert.ok(chance >= 70 && chance <= 95, `level ${level}: hero hits ${chance.toFixed(1)}% of swings`);
  }
});

test('the combat the game runs is the combat the budget assumes', () => {
  const hero = buildAXEHero(m, { level: 50, progress: progressAt(50) });
  const enemy = B.getAXEEnemyStats(50, 'elite');
  const plain = m.combat.resolveAXEHit({ attackerStats: hero, defenderStats: enemy, critical: false }).damage;
  // the hit roll includes the hero's accuracy bonus (capped) within the roll's clamp
  const R = B.AXE_COMBAT_RULES;
  const hitPct = Math.min(R.hitMaxPct, Math.max(R.hitMinPct, B.getAXEHitChancePct(hero.attackSuccess, enemy.attackBlock) + Math.min(B.AXE_BUILD_CAPS.hitBonusPct, hero.hitBonusPct || 0)));
  const expectedPlain = B.getAXEExpectedHit({ ...hero, critChance: 0 }, enemy) / (hitPct / 100);
  assert.ok(Math.abs(plain - expectedPlain) <= 1, `a plain hit: game ${plain}, budget ${expectedPlain.toFixed(1)}`);
  const crit = m.combat.resolveAXEHit({ attackerStats: hero, defenderStats: enemy, critical: true }).damage;
  const critMultiplier = B.AXE_COMBAT_RULES.critMultiplier + (hero.criticalDamage || 0);
  assert.ok(Math.abs(crit - plain * (1 + (critMultiplier - 1) * (1 - Math.min(1, enemy.criticalDefense || 0)))) <= 1.5, `a crit: ${crit} from ${plain}`);
});

test('the duel server resolves a swing exactly as the game does (computeAXESwing = resolveAXEHit)', () => {
  for (const [aL, dL, tier] of [[10, 10, 'normal'], [50, 45, 'elite'], [100, 100, 'worldBoss'], [5, 20, 'champion']]) {
    const hero = buildAXEHero(m, { level: aL, progress: progressAt(aL) });
    const foe = { ...B.getAXEEnemyStats(dL, tier), criticalDefense: 0.2 };
    for (const critical of [false, true]) {
      for (const skillMultiplier of [1, 2.5]) {
        const game = m.combat.resolveAXEHit({ attackerStats: hero, defenderStats: foe, critical, skillCoefficient: skillMultiplier }).damage;
        const server = B.computeAXESwing(hero, foe, { critical, skillMultiplier });
        assert.ok(Math.abs(game - server) <= 1, `L${aL} vs ${tier} L${dL}, crit ${critical}, x${skillMultiplier}: game ${game}, server ${server}`);
      }
    }
  }
});

test('nobody is immune: defense always leaves real damage through, in both directions', () => {
  const maxHero = buildAXEHero(m, { level: 100, progress: 1 });
  const freshHero = buildAXEHero(m, { level: 1, progress: 0 });
  for (const tier of Object.keys(B.AXE_ENEMY_TIERS)) {
    const strong = B.getAXEEnemyStats(100, tier);
    const reduction = B.getAXEDamageReduction(maxHero.defense, 100);
    assert.ok(reduction <= B.AXE_COMBAT_RULES.mitigationCapPct / 100 + 1e-9, 'reduction never passes the cap');
    assert.ok(m.combat.resolveAXEHit({ attackerStats: strong, defenderStats: maxHero }).damage > strong.damage * 0.2, `a level-100 ${tier} still hurts a fully built hero`);
  }
  const boss = B.getAXEEnemyStats(25, 'worldBoss');
  assert.ok(m.combat.resolveAXEHit({ attackerStats: freshHero, defenderStats: boss }).damage > 1, 'a new hero still scratches a world boss');
  // and out-levelled content is easy, not free: a level-100 hero needs a swing per level-1 enemy
  const low = B.getAXEEnemyStats(1, 'normal');
  assert.ok(B.getAXEExpectedHit(maxHero, low) >= low.maxHP, 'a level-100 hero one-shots a level-1 enemy');
  assert.ok(B.getAXEExpectedHit(low, maxHero) >= 1, '…which still lands its hits');
});

test('levelling stops at the cap', () => {
  assert.equal(m.world.xpForLevel(B.AXE_LEVEL_CAP), Infinity);
  assert.ok(Number.isFinite(m.world.xpForLevel(B.AXE_LEVEL_CAP - 1)));
});

test('rate stats on loot grow with rarity only, never with level or quality', () => {
  // the drop pool in the loot system's own order (its DROP_CATEGORIES); pick the crit ring
  const pool = ['weapon', 'helm', 'chest', 'gloves', 'legs', 'boots', 'accessory', 'trinket'].flatMap((c) => m.invData.INVENTORY[c] || []);
  const ring = pool.findIndex((t) => t.baseStats?.critChance > 0);
  assert.ok(ring >= 0, 'a crit ring in the drop pool');
  // the rolls, in the order the loot system asks: drop chance, template, rarity, quality band
  const rolls = [0, (ring + 0.5) / pool.length, 0.999, 0.999];
  let i = 0; const rng = () => rolls[i++];
  const drop = m.loot.rollAXEEquipmentDrop('boss', true, { rng, playerLevel: 100 });
  assert.equal(drop?.equipmentItem.templateId, pool[ring].id, 'the ring dropped');
  const rarityScale = { common: 1, uncommon: 1.08, rare: 1.18, elite: 1.32, legendary: 1.52, heroic: 1.8 }[drop.rarity];
  assert.equal(drop.rarity, 'heroic');
  const crit = drop.equipmentItem.baseStats.critChance;
  assert.ok(Math.abs(crit - pool[ring].baseStats.critChance * rarityScale) < 0.011, `crit ${crit} from ${pool[ring].baseStats.critChance} at heroic, level 100, top quality`);
});
