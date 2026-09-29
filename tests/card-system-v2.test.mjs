import assert from 'node:assert/strict';
import Module from 'node:module';
import { buildSync } from 'esbuild';

function bundle(entry) {
  const filename = process.cwd() + '/tests/__card_system_v2_bundle.cjs';
  const result = buildSync({
    entryPoints: [entry],
    bundle: true,
    write: false,
    format: 'cjs',
    platform: 'node',
    target: 'node20',
    external: ['npm:*'],
  });
  const mod = new Module(filename);
  mod.paths = Module._nodeModulePaths(process.cwd());
  mod._compile(result.outputFiles[0].text, filename);
  return mod.exports;
}

const system = bundle('./base44/shared/cardSystem.ts');
const stats = bundle('./base44/shared/cardStats.ts');

assert.equal(system.ENHANCEMENT_CAP, 120);
assert.equal(system.ASCENSION_CAP, 5);
assert.equal(system.STACK_CAP, 4);
assert.deepEqual(system.PLAYABLE_TIERS, ['Rare', 'Epic', 'Legendary', 'Demigod', 'Mythical', 'Deity', 'Chosen']);

assert.equal(system.enhancementMaterialValue({ rarity: 'Common', use_category: 'enhancement' }), 4);
assert.equal(system.enhancementMaterialValue({ rarity: 'Uncommon', use_category: 'enhancement' }), 8);
assert.equal(system.enhancementMaterialValue({ rarity: 'Unique', use_category: 'enhancement' }), 16);
assert.equal(system.enhancementMaterialValue({ rarity: 'Common', use_category: 'leveling' }), 0, 'non-enhancement legacy material must not feed cards');

const base = { attack: 100, defense: 80, magic: 60, vitality: 90, speed: 40 };
const cycle = system.cycleStatGain(base, 120);
const beforeAscension = {
  system_version: 2,
  base_stats: base,
  enhancement_percent: 120,
  ascension: 0,
  stack_level: 1,
  permanent_stats: {},
  current_cycle_stats: cycle,
  migration_power_multiplier: 1,
};
const before = stats.effectiveCardStats(beforeAscension, base);
const after = stats.effectiveCardStats({
  ...beforeAscension,
  enhancement_percent: 0,
  ascension: 1,
  permanent_stats: cycle,
  current_cycle_stats: {},
}, base);
assert.deepEqual(after.stats, before.stats, 'Ascension must preserve every earned stat when 120% resets to 0%');
assert.equal(after.power_score, before.power_score, 'Ascension must not reduce card power');

const legacy = system.normalizeProgression({
  level: 10,
  stage: 3,
  ascension: 2,
  over_enchant_rank: 2,
  enhanced_stats: { attack: 12 },
  enchantments: [{ modifiers: { attack: 3, magic: 5 } }],
  unlocked_skill_nodes: ['core_calibration', 'avatar_sync'],
});
assert.equal(legacy.system_version, 2);
assert.equal(legacy.permanent_stats.attack, 15, 'legacy enhancement and enchantment stats are preserved');
assert.equal(legacy.permanent_stats.magic, 5);
assert.ok(legacy.migration_power_multiplier > 1, 'legacy level/stage/ascension investment is frozen into migration power');
assert.equal(legacy.stack_level, 3, 'legacy stage migrates to Stack Level');

const stackOne = stats.effectiveCardStats({ system_version: 2, base_stats: base, stack_level: 1 }, base);
const stackFour = stats.effectiveCardStats({ system_version: 2, base_stats: base, stack_level: 4 }, base);
assert.ok(stackFour.power_score > stackOne.power_score, 'Stack Level must make the card stronger');
assert.equal(system.cardMasteryState({ system_version: 2, ascension: 5 }).holographic, true);
assert.equal(system.cardMasteryState({ system_version: 2, enhancement_percent: 120, ascension: 4 }).can_ascend, true);
assert.equal(system.cardMasteryState({ system_version: 2, enhancement_percent: 120, ascension: 5 }).can_ascend, false);

// Syntax/bundle gate for every authoritative v2 server path. Build each entry
// independently so esbuild can emit in-memory output without an outdir.
for (const entry of [
  './base44/functions/cardProgression/entry.ts',
  './base44/shared/cardProvenance.ts',
  './base44/shared/rewardEngine.ts',
  './base44/functions/cardCollection/entry.ts',
  './base44/functions/cardSystemSkillState/entry.ts',
  './base44/functions/tradePostMarket/entry.ts',
  './base44/functions/friendCardTrade/entry.ts',
  './base44/functions/finalizeTradeSession/entry.ts',
]) {
  buildSync({
    entryPoints: [entry],
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'neutral',
    external: ['npm:*'],
  });
}

console.log('PASS: Card System v2 enhancement, Ascension preservation, stacking, migration, mastery and backend syntax.');
