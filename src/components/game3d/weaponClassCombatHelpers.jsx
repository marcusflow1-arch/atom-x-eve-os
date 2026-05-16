// Small pure helpers that read the weapon-class native buff store and produce
// the multipliers / chances the combat code in GameWorld3D needs. Kept tiny so
// GameWorld3D can stay under its line cap.
import { getActiveBuffValues } from './weaponClassBuffStore';

// Movement-speed multiplier from Swift Marksman (Ranged).
export function getWeaponMoveSpeedMult() {
  return 1 + (getActiveBuffValues().moveSpeedBonusPct || 0);
}

// Outgoing damage multiplier — all three paths add some % damage.
export function getWeaponDamageMult() {
  return 1 + (getActiveBuffValues().damageBonusPct || 0);
}

// Roll Lethal Blow (Brutal Force / Damage path). Returns true on instant-kill.
export function rollLethalBlow() {
  const pct = getActiveBuffValues().lethalBlowPct || 0;
  return pct > 0 && Math.random() < pct;
}

// Roll dodge (Iron Stance / Defense). Returns true when an incoming hit is dodged.
export function rollDodge() {
  const pct = getActiveBuffValues().dodgeChancePct || 0;
  return pct > 0 && Math.random() < pct;
}

// Roll guard (Iron Stance / Defense). Enemy misses the player.
export function rollGuard() {
  const pct = getActiveBuffValues().guardChancePct || 0;
  return pct > 0 && Math.random() < pct;
}

// Roll an extra "Swift Marksman hit-chance check" — when a ranged user is
// being attacked, their evasion improves. Treat their +hit% as a passive miss
// chance for incoming melee. Returns true if the incoming hit MISSES.
export function rollRangedEvade() {
  const pct = getActiveBuffValues().hitChanceBonusPct || 0;
  return pct > 0 && Math.random() < pct;
}

// Defense multiplier (Iron Stance) — applied as a bonus on top of derived defense.
export function getWeaponDefenseBonusMult() {
  return 1 + (getActiveBuffValues().defenseBonusPct || 0);
}

// Crit-chance bonus in percentage points (Swift Marksman adds +5% at max).
export function getWeaponCritChanceBonusPct() {
  return (getActiveBuffValues().critChanceBonusPct || 0) * 100;
}