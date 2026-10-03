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

const legacyInput = {
  level: 10,
  stage: 3,
  ascension: 2,
  over_enchant_rank: 2,
  enhanced_stats: { attack: 12 },
  enchantments: [{ modifiers: { attack: 3, magic: 5 } }],
  unlocked_skill_nodes: ['core_calibration', 'avatar_sync'],
};
const legacyMultiplier = system.legacyPowerMultiplier(legacyInput);
const legacy = system.normalizeProgression(legacyInput);
assert.equal(legacy.system_version, 2);
assert.equal(legacy.permanent_stats.attack, 15, 'legacy enhancement and enchantment stats are preserved');
assert.equal(legacy.permanent_stats.magic, 5);
assert.equal(legacy.migration_power_multiplier, legacyMultiplier, 'legacy level/stage/Ascension investment is frozen into migration power');
assert.equal(legacy.stack_level, 3, 'legacy stage migrates to Stack Level');
assert.equal(legacy.ascension, 0, 'legacy Ascension power is preserved but the new V2 Ascension journey starts at 0');
assert.equal(system.cardMasteryState(legacy).mastered, false, 'legacy Ascension must not pre-complete V2 mastery');
assert.equal(system.cardMasteryState({ ...legacy, enhancement_percent: 120 }).can_ascend, true, 'migrated cards can participate in the V2 0→120→Ascend loop');

const legacyA5Input = {
  level: 20,
  stage: 4,
  ascension: 5,
  over_enchant_rank: 3,
  enhanced_stats: { attack: 10 },
  unlocked_skill_nodes: ['core_calibration'],
};
const migratedA5 = system.normalizeProgression(legacyA5Input);
assert.equal(migratedA5.ascension, 0, 'old Ascension 5 does not become V2 Ascension 5');
assert.equal(migratedA5.stack_level, 4, 'legacy Stage still seeds the V2 Stack Level');
assert.equal(migratedA5.migration_power_multiplier, system.legacyPowerMultiplier(legacyA5Input), 'old A5 combat power remains preserved exactly once');
assert.equal(system.cardMasteryState(migratedA5).holographic, false, 'old A5 does not incorrectly receive V2 holographic mastery');

const trueV2A5 = system.normalizeProgression({ system_version: 2, ascension: 5, enhancement_percent: 0, stack_level: 1 });
assert.equal(trueV2A5.ascension, 5, 'a true V2 Ascension 5 record remains mastered');
assert.equal(system.cardMasteryState(trueV2A5).holographic, true);
assert.equal(system.normalizeProgression(null).migrated_from_legacy, false, 'a blank/new progression is not reported as a legacy migration');

// Migration must preserve the exact four-decimal multiplier used by the old
// cardStats implementation. Rounding 1.055 to 1.06 would silently buff a card
// simply because it crossed the V2 migration boundary.
assert.equal(system.legacyPowerMultiplier({ level: 2, stage: 1, ascension: 0, over_enchant_rank: 0 }), 1.055);
const exactLegacy = stats.effectiveCardStats({
  level: 2,
  stage: 1,
  ascension: 0,
  over_enchant_rank: 0,
  base_stats: { attack: 20, defense: 8 },
  enhanced_stats: { attack: 3 },
  enchantments: [{ modifiers: { attack: 2 } }],
}, { attack: 20, defense: 8 });
assert.equal(exactLegacy.stats.attack, 26.38, 'legacy migration preserves the pre-V2 card stat exactly');

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

console.log('PASS: Card System v2 enhancement, Ascension preservation, exact legacy migration, stacking, mastery and backend syntax.');
