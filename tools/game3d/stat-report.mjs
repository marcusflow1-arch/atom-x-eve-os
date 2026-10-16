// Game 3D power report, built from the REAL stores (tools/game3d/powerBuild.mjs).
//
//   node tools/game3d/stat-report.mjs          each group's share of a level-100 hero, against
//                                               the budget, and par heroes against even-level enemies
//   node tools/game3d/stat-report.mjs --par    the AXE_PAR_HERO_TABLE rows for AXEPowerBudget.js
//   node tools/game3d/stat-report.mjs --write-par   regenerate that table in AXEPowerBudget.js
//
// docs/game3d/STAT_SYSTEM_AUDIT.md explains the budget and the par hero.
import { readFile, rm, writeFile } from 'node:fs/promises';
import { AXE_POWER_GROUPS, buildAXEHero, loadAXEStores, measureAXEGroupShares } from './powerBuild.mjs';

const m = await loadAXEStores();
const B = m.budget;
const PAR_LEVELS = [1, 5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100];
const progressAt = (level) => (level - 1) / (B.AXE_LEVEL_CAP - 1);
const n0 = (v) => (Math.abs(v) >= 100 ? Math.round(v).toLocaleString('en-US') : String(Number(Number(v).toFixed(1))));
const pct = (v) => `${(v * 100).toFixed(1)}%`;

if (process.argv.includes('--par') || process.argv.includes('--write-par')) {
  const lines = ['export const AXE_PAR_HERO_TABLE = Object.freeze(['];
  for (const level of PAR_LEVELS) {
    const h = buildAXEHero(m, { level, progress: progressAt(level) });
    const row = [level, h.damage, h.maxHP, h.defense, h.attackSuccess, h.attackBlock, h.critChance, h.attributionAttack || 0, h.attributionDefense || 0]
      .map((v, i) => (i === 0 ? v : Math.round(v * 10) / 10));
    lines.push(`  [${row.join(', ')}],`);
  }
  lines.push(']);');
  if (process.argv.includes('--write-par')) {
    const file = 'src/components/game3d/axe/balance/AXEPowerBudget.js';
    const src = await readFile(file, 'utf8');
    const a = src.indexOf('export const AXE_PAR_HERO_TABLE = Object.freeze([');
    const b = src.indexOf(']);', a) + 3;
    if (a < 0 || b < 3) throw new Error('AXE_PAR_HERO_TABLE not found in ' + file);
    const eol = src.includes('\r\n') ? '\r\n' : '\n';
    await writeFile(file, src.slice(0, a) + lines.join(eol) + src.slice(b));
    console.log(`AXE_PAR_HERO_TABLE regenerated in ${file}`);
  } else console.log(lines.join('\n'));
} else {
  const { full, shares } = measureAXEGroupShares(m, { level: B.AXE_LEVEL_CAP, progress: 1 });
  console.log(`**Fully built level-${B.AXE_LEVEL_CAP} hero:** ${n0(full.damage)} damage, ${n0(full.maxHP)} HP, ${n0(full.defense)} defense, ${n0(full.critChance)}% crit.\n`);
  console.log('| Group | Systems | Damage | HP | Offense | Survival | Budget band | |');
  console.log('|---|---|---|---|---|---|---|---|');
  for (const [group, label] of Object.entries(AXE_POWER_GROUPS)) {
    const band = B.AXE_POWER_BUDGET[group]; const s = shares[group];
    const ok = [s.damageShare, s.hpShare].every((v) => v >= band.min && v <= band.max); // the budget is on damage and HP
    console.log(`| ${group} | ${label} | ${pct(s.damageShare)} | ${pct(s.hpShare)} | ${pct(s.offenseShare)} | ${pct(s.survivalShare)} | ${pct(band.min)}–${pct(band.max)} (target ${pct(band.target)}) | ${ok ? 'in band' : '**out of band**'} |`);
  }
  console.log('\n**Par hero against an even-level enemy** (average swings, misses and crits included)\n');
  console.log('| Level | Hero damage | Hero HP | Hero defense | Enemy HP | Enemy attack | Hero hits to kill | Enemy hits to kill the hero | Hero hit chance |');
  console.log('|---|---|---|---|---|---|---|---|---|');
  for (const level of PAR_LEVELS) {
    const hero = buildAXEHero(m, { level, progress: progressAt(level) });
    const enemy = B.getAXEEnemyStats(level, 'normal');
    const heroSwing = B.getAXEExpectedHit(hero, enemy), enemySwing = B.getAXEExpectedHit(enemy, hero);
    console.log(`| ${level} | ${n0(hero.damage)} | ${n0(hero.maxHP)} | ${n0(hero.defense)} | ${n0(enemy.maxHP)} | ${n0(enemy.damage)} | ${n0(enemy.maxHP / heroSwing)} | ${n0(hero.maxHP / enemySwing)} | ${n0(B.getAXEHitChancePct(hero.attackSuccess, enemy.attackBlock))}% |`);
  }
  const max = buildAXEHero(m, { level: B.AXE_LEVEL_CAP, progress: 1 });
  console.log('\n**Fully built level-100 hero against every tier at level 100, and a level-1 normal enemy**\n');
  console.log('| Enemy | HP | Attack | Hero hits to kill | Enemy hits to kill the hero |');
  console.log('|---|---|---|---|---|');
  for (const tier of Object.keys(B.AXE_ENEMY_TIERS)) {
    const e = B.getAXEEnemyStats(100, tier);
    console.log(`| ${tier} Lv100 | ${n0(e.maxHP)} | ${n0(e.damage)} | ${n0(e.maxHP / B.getAXEExpectedHit(max, e))} | ${n0(max.maxHP / B.getAXEExpectedHit(e, max))} |`);
  }
  const low = B.getAXEEnemyStats(1, 'normal');
  console.log(`| normal Lv1 | ${n0(low.maxHP)} | ${n0(low.damage)} | ${n0(low.maxHP / B.getAXEExpectedHit(max, low))} | ${n0(max.maxHP / B.getAXEExpectedHit(low, max))} |`);
}
await rm(m.temp, { recursive: true, force: true });
process.exit(0);
