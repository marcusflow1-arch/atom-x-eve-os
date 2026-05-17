// ─── WeaponPassiveResolver ──────────────────────────────────────────────
// Pure-function resolver — given a weaponId + its current level, returns
// the aggregated passive modifiers (global + identity + unlocked milestones).
//
// All math here is read-only. The combat pipeline calls this and applies
// the result; it never mutates store state.

import { getWeaponLevel } from '../weaponMasteryStore';
import { MASTERY_MAX_LEVEL } from '../weaponSynergyData';
import {
  GLOBAL_PASSIVE_CURVES,
  WEAPON_IDENTITY_AT_MAX,
  MILESTONE_PASSIVES,
  resolveWeaponType,
  WEAPON_TYPES,
} from './weaponMasteryConfig';
import { getAllocatedModifiers } from './weaponMasteryTreeStore';

// Linear progress 0..1 based on current level vs max.
function progress(level) {
  if (!level || level <= 1) return 0;
  if (level >= MASTERY_MAX_LEVEL) return 1;
  return (level - 1) / (MASTERY_MAX_LEVEL - 1);
}

// Resolve global passives at current level.
function globalPassives(level) {
  const p = progress(level);
  const armorPen = level >= GLOBAL_PASSIVE_CURVES.armorPenUnlockLevel
    ? GLOBAL_PASSIVE_CURVES.armorPenPct * p
    : 0;
  return {
    critChancePct:  GLOBAL_PASSIVE_CURVES.critChancePct  * p,
    critDamagePct:  GLOBAL_PASSIVE_CURVES.critDamagePct  * p,
    hitChancePct:   GLOBAL_PASSIVE_CURVES.hitChancePct   * p,
    attackSpeedPct: GLOBAL_PASSIVE_CURVES.attackSpeedPct * p,
    damageMultPct:  GLOBAL_PASSIVE_CURVES.damageMultPct  * p,
    armorPenPct:    armorPen,
  };
}

// Identity passives — type-specific bonuses linearly scaled to level.
function identityPassives(weaponType, level) {
  const cfg = WEAPON_IDENTITY_AT_MAX[weaponType];
  if (!cfg) return {};
  const p = progress(level);
  const out = {};
  for (const k of Object.keys(cfg)) {
    const v = cfg[k];
    // Numeric fields scale; non-numeric (like unit caps) pass through.
    if (typeof v === 'number') {
      // Cap/threshold values that aren't percentages are passed through verbatim.
      const isStructural = ['executeThresholdPct', 'critRangeUnit', 'chainCap', 'momentumWindowSec'].includes(k);
      out[k] = isStructural ? v : v * p;
    } else {
      out[k] = v;
    }
  }
  return out;
}

// Aggregate unlocked milestone modifiers (level ≥ milestoneLevel).
function milestonePassives(weaponType, level) {
  const table = MILESTONE_PASSIVES[weaponType] || {};
  const merged = {};
  Object.keys(table)
    .map(Number)
    .filter((l) => level >= l)
    .forEach((l) => {
      const mod = table[l].mod || {};
      Object.keys(mod).forEach((k) => {
        const v = mod[k];
        if (typeof v === 'number') {
          merged[k] = (merged[k] || 0) + v;
        } else {
          merged[k] = v; // booleans / flags overwrite
        }
      });
    });
  return merged;
}

/**
 * Aggregate all mastery passives for the currently-equipped weapon.
 * @param {string} weaponId — instance id (sword/dual_blades/bow/...)
 * @returns {object} merged modifier bag
 */
export function resolveWeaponPassives(weaponId) {
  if (!weaponId) return { weaponType: WEAPON_TYPES.SWORD, level: 1, global: {}, identity: {}, milestones: {} };
  const level = getWeaponLevel(weaponId);
  const weaponType = resolveWeaponType(weaponId);
  // Tree-allocated nodes contribute additional modifiers that stack
  // additively with milestone passives (same key namespace).
  const treeMods = getAllocatedModifiers(weaponType);
  const milestones = milestonePassives(weaponType, level);
  for (const k of Object.keys(treeMods)) {
    const v = treeMods[k];
    if (typeof v === 'number') milestones[k] = (milestones[k] || 0) + v;
    else milestones[k] = v;
  }

  return {
    weaponType,
    level,
    global:     globalPassives(level),
    identity:   identityPassives(weaponType, level),
    milestones,
    tree:       treeMods,
  };
}