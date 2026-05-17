// ─── Weapon Mastery Tree Data ────────────────────────────────────────────
// Per-weapon-TYPE node tree. Each node is a PASSIVE stat modifier — no
// active abilities. Nodes have prerequisites, an unlock level requirement,
// a point cost, a max rank, and a stat modifier bag that the
// WeaponPassiveResolver merges into the combat pipeline.
//
// Three trees: sword, guardian, ranged.
// Layout grid: { col: 0..3, row: 0..N } — purely for UI positioning.
//
// Node modifier keys MUST match keys already understood by the resolver
// (damageMultPct, critChancePct, critDamagePct, hitChancePct,
// attackSpeedPct, armorPenPct, defenseBonusPct, reflectChancePct,
// blockReductionPct, maxHPBonusPct, bossDmgTakenPct, rangedDmgPct,
// multiHitAmpPct, rangedCritFar, comboBonusPct, singleTargetDmgPct,
// executeThresholdAddPct, critHealPct).

import { WEAPON_TYPES } from './weaponMasteryConfig';

// Helper to declare a node concisely.
const N = (id, name, col, row, unlockLevel, cost, maxRank, mod, prereq = []) =>
  ({ id, name, col, row, unlockLevel, cost, maxRank, mod, prereq });

export const WEAPON_MASTERY_TREES = {
  [WEAPON_TYPES.SWORD]: {
    color: '#ef4444',
    icon: '🗡',
    name: 'Sword Mastery',
    description: 'Offensive melee scaling — crit, combo, execute.',
    nodes: [
      N('sw_dmg_1',   'Honed Edge',        1, 0, 1,  1, 5, { damageMultPct: 2 }),
      N('sw_crit_1',  'Keen Strikes',      0, 1, 2,  1, 5, { critChancePct: 2 }, ['sw_dmg_1']),
      N('sw_combo_1', 'Combo Flow',        2, 1, 3,  1, 5, { comboBonusPct: 2 }, ['sw_dmg_1']),
      N('sw_critd_1', 'Vicious Edge',      0, 2, 5,  1, 5, { critDamagePct: 5 }, ['sw_crit_1']),
      N('sw_st_1',    'Focused Strike',    2, 2, 6,  1, 5, { singleTargetDmgPct: 3 }, ['sw_combo_1']),
      N('sw_dmg_2',   'Bladework',         1, 3, 8,  2, 3, { damageMultPct: 4 }, ['sw_critd_1', 'sw_st_1']),
      N('sw_exec_1',  'Killing Blow',      0, 4, 12, 2, 3, { executeThresholdAddPct: 3 }, ['sw_dmg_2']),
      N('sw_pen_1',   'Armor Cleaver',     2, 4, 14, 2, 3, { armorPenPct: 3 }, ['sw_dmg_2']),
      N('sw_heal_1',  'Bloodthirst',       1, 5, 18, 3, 1, { critHealPct: 2 }, ['sw_exec_1', 'sw_pen_1']),
    ],
  },

  [WEAPON_TYPES.GUARDIAN]: {
    color: '#3b82f6',
    icon: '🛡',
    name: 'Guardian Mastery',
    description: 'Survivability and counter-damage.',
    nodes: [
      N('gd_def_1',   'Stoneform',         1, 0, 1,  1, 5, { defenseBonusPct: 3 }),
      N('gd_hp_1',    'Iron Body',         0, 1, 2,  1, 5, { maxHPBonusPct: 2 }, ['gd_def_1']),
      N('gd_block_1', 'Steady Guard',      2, 1, 3,  1, 5, { blockReductionPct: 2 }, ['gd_def_1']),
      N('gd_refl_1',  'Thorned Plate',     0, 2, 5,  1, 5, { reflectChancePct: 2 }, ['gd_hp_1']),
      N('gd_boss_1',  'Boss Slayer',       2, 2, 6,  1, 5, { bossDmgTakenPct: -1 }, ['gd_block_1']),
      N('gd_def_2',   'Bastion',           1, 3, 8,  2, 3, { defenseBonusPct: 5 }, ['gd_refl_1', 'gd_boss_1']),
      N('gd_hp_2',    'Unyielding',        0, 4, 12, 2, 3, { maxHPBonusPct: 4 }, ['gd_def_2']),
      N('gd_refl_2',  'Spiked Aegis',      2, 4, 14, 2, 3, { reflectDmgPct: 10 }, ['gd_def_2']),
      N('gd_rev',     'Last Stand',        1, 5, 18, 3, 1, { reviveOnce: true }, ['gd_hp_2', 'gd_refl_2']),
    ],
  },

  [WEAPON_TYPES.RANGED]: {
    color: '#10b981',
    icon: '🏹',
    name: 'Ranged Mastery',
    description: 'Precision, fire-rate, distance scaling.',
    nodes: [
      N('rg_acc_1',   'Steady Aim',        1, 0, 1,  1, 5, { hitChancePct: 2 }),
      N('rg_crit_1',  'Sharp Eye',         0, 1, 2,  1, 5, { critChancePct: 2 }, ['rg_acc_1']),
      N('rg_spd_1',   'Quick Draw',        2, 1, 3,  1, 5, { attackSpeedPct: 3 }, ['rg_acc_1']),
      N('rg_far_1',   'Long Shot',         0, 2, 5,  1, 5, { rangedCritFar: 3 }, ['rg_crit_1']),
      N('rg_multi_1', 'Volley Master',     2, 2, 6,  1, 5, { multiHitAmpPct: 3 }, ['rg_spd_1']),
      N('rg_dmg_1',   'Marksman',          1, 3, 8,  2, 3, { rangedDmgPct: 4 }, ['rg_far_1', 'rg_multi_1']),
      N('rg_critd_1', 'Lethal Aim',        0, 4, 12, 2, 3, { critDamagePct: 5 }, ['rg_dmg_1']),
      N('rg_pen_1',   'Piercing Arrow',    2, 4, 14, 2, 3, { armorPenPct: 3 }, ['rg_dmg_1']),
      N('rg_pierce',  'Phantom Arrow',     1, 5, 18, 3, 1, { pierceTargets: 1 }, ['rg_critd_1', 'rg_pen_1']),
    ],
  },
};

export function getTreeForType(weaponType) {
  return WEAPON_MASTERY_TREES[weaponType] || null;
}

export function getNodeById(weaponType, nodeId) {
  const tree = getTreeForType(weaponType);
  return tree ? tree.nodes.find((n) => n.id === nodeId) : null;
}