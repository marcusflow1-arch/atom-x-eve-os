// ─── Buff Compat Shim ─────────────────────────────────────────────────
// Bridges the new buffEngine to the old function-call surface used by
// GameWorld3D's combat math (absorbShield, rollReflect, etc.).
// This file is the ONLY place the old call-sites get rewired — combat
// code stays untouched.

import {
  absorbAegis,
  tickBuffEngine,
  getBuffs,
  subscribeBuffs as subscribeBuffEngine,
  applyAXEReflectionProtection,
  getAXEControlResistance,
  rollAXEControlProtection,
} from './buffEngine';
import { absorbAXEAscensionShield } from '../axe/progression/AXEAscensionStore';

// Damage absorption — old name: absorbShield. Aegis first, then the Defensive Nature's shield (Ascension).
export function absorbShield(incoming) {
  const aegis = absorbAegis(incoming);
  const rest = Math.max(0, (Number(incoming) || 0) - aegis);
  return aegis + (rest > 0 ? absorbAXEAscensionShield(rest) : 0);
}

// Focus, Power Charge, Decisive Blow, God's Deflection and Heaven's Riposte act inside the one
// hit resolution (axe/combat/AXEStrikeRuntime.js), under the same caps as every other source.

// Per-frame tick — replaces the old tickBuffs export.
export function tickBuffs() { tickBuffEngine(); }

// Subscribe — kept for HUDSkillSlots' existing buff-timer renderer.
// Re-shaped to match the new state so HUD can read new buff records.
export const subscribeBuffs = subscribeBuffEngine;
export { getBuffs };
// AXE Prompt 015 divine-protection compatibility hooks.
export function applyReflectionProtection(incomingReflectedDamage) {
  return applyAXEReflectionProtection(incomingReflectedDamage);
}
export function getControlResistance() { return getAXEControlResistance(); }
export function rollControlProtection() { return rollAXEControlProtection(); }
