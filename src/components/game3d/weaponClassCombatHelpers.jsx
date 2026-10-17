// The weapon-class native passive's movement effect. Its combat effects (Brutal Force's
// damage and Lethal Blow, Swift Marksman's accuracy and crit, Iron Stance's defense, dodge
// and guard) are stat-sheet fields now (axe/balance/AXEBuildEffects.js), resolved once per
// hit by axe/combat/AXEStrikeRuntime.js (docs/game3d/BUILD_BALANCE.md). The separate rolls
// and multipliers that used to live here (and stacked outside every cap) are gone.
import { getActiveBuffValues } from './weaponClassBuffStore';
import { getAXEAffinityMoveSpeedMult } from './axe/weapons/AXEWeaponAffinityStore';
import { getAXEAscensionMoveSpeedMult } from './axe/progression/AXEAscensionStore';

// Movement-speed multiplier from Swift Marksman (Ranged).
export function getWeaponMoveSpeedMult() {
  return (1 + (getActiveBuffValues().moveSpeedBonusPct || 0)) * getAXEAffinityMoveSpeedMult() * getAXEAscensionMoveSpeedMult(); // + the ranged archetype passive (Weapon Affinity) and levitation (Ascension)
}
