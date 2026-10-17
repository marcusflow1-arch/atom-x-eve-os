// ─── WeaponScalingPipeline ──────────────────────────────────────────────
// Weapon mastery's link to combat. Its passives (global, identity, milestones, tree) are
// stat-sheet fields now (axe/balance/AXEBuildEffects.js), and every hit is resolved once by
// axe/combat/AXEStrikeRuntime.js under the caps in AXEPowerBudget (docs/game3d/BUILD_BALANCE.md).
// The second damage pipeline that used to live here (its own crit roll, defense formula,
// dodge, deflect and reduction, outside every cap) is gone.
//
// Exports:
//   getActiveWeaponId() → the mastery weapon id of the weapon in hand
//   getMasteryCDR(weaponId) → cooldown reduction (0..0.35)

import { resolveWeaponPassives } from './WeaponPassiveResolver';
import { resolveWeaponType, WEAPON_TYPES } from './weaponMasteryConfig';
import { getActiveWeaponPath } from '../../weaponClassBuffStore';
import { getMasteryState } from '../weaponMasteryStore';
import { getActiveEquippedAXEWeapon } from '../../axe/equipment/AXEEquipmentInventoryStore';
import { resolveAXEWeaponIdentity } from '../../axe/weapons/AXEWeaponIdentity';
import { getAXEAdvancedClassCombatModifiers } from '../../talents/AXEAdvancedClassRuntime';

const MAX_TRAINING_CDR_PCT = 10; // weapon training's share of cooldown reduction
const MAX_CDR_PCT = 35; // every source together

// ─── Resolve the active weaponId ────────────────────────────────────────
export function getActiveWeaponId() {
  // Inventory is authoritative for the active weapon. The mastery store mirrors
  // it for persistence/UI, but can no longer override the equipped loadout.
  const activeItem = getActiveEquippedAXEWeapon();
  if (activeItem) {
    const identity = resolveAXEWeaponIdentity(activeItem);
    if (identity.masteryWeaponId) return identity.masteryWeaponId;
  }

  const ms = getMasteryState();
  if (ms.activeWeaponId) return ms.activeWeaponId;
  const path = getActiveWeaponPath();
  const classToType = { damage: 'sword', ranged: 'ranged', defense: 'guardian' };
  const wantType = classToType[path] || 'sword';
  let best = null;
  let bestLevel = -1;
  Object.keys(ms.weapons || {}).forEach((id) => {
    if (resolveWeaponType(id) === wantType && ms.weapons[id].level > bestLevel) {
      best = id;
      bestLevel = ms.weapons[id].level;
    }
  });
  return best || Object.keys(ms.weapons || {})[0] || null;
}

/**
 * Cooldown reduction from mastery (as a fraction, 0..1).
 * Sword identity + Sky identity each contribute; training's share is capped.
 */
export function getMasteryCDR(weaponId = null) {
  const { identity, milestones, weaponType, global } = resolveWeaponPassives(weaponId || getActiveWeaponId());
  let cdrPct = Math.min(global.cdrPct || 0, MAX_TRAINING_CDR_PCT);
  if (weaponType === WEAPON_TYPES.SWORD) cdrPct += (identity.cdrPct || 0) + (milestones.cdrPct || 0);
  if (weaponType === WEAPON_TYPES.SKY)   cdrPct += (identity.cooldownReductionPct || 0) + (milestones.cdrPct || 0);
  cdrPct += Number(getAXEAdvancedClassCombatModifiers().cooldownReductionPct || 0);
  return Math.min(Math.max(0, cdrPct), MAX_CDR_PCT) / 100;
}
