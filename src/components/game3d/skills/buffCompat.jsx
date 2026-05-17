// ─── Buff Compat Shim ─────────────────────────────────────────────────
// Bridges the new buffEngine to the old function-call surface used by
// GameWorld3D's combat math (absorbShield, rollReflect, etc.).
// This file is the ONLY place the old call-sites get rewired — combat
// code stays untouched.

import {
  absorbAegis,
  rollRiposte,
  consumeFocusHit,
  applyDeflectionToCrit,
  getCritBonus,
  tickBuffEngine,
  getBuffs,
  subscribeBuffs as subscribeBuffEngine,
} from './buffEngine';

// Damage absorption — old name: absorbShield. New impl: AEGIS only.
export function absorbShield(incoming) { return absorbAegis(incoming); }

// Reflect roll — old name: rollReflect. New impl: Heaven's Riposte.
export function rollReflect() { return rollRiposte(); }

// Damage buff consumer — old name: consumeDamageBuffMultiplier. New impl: Focus.
export function consumeDamageBuffMultiplier() { return consumeFocusHit(); }

// Power Charge — DEPRECATED in new system. Returns 1 (no-op) so old call
// sites continue to multiply by 1 with zero effect. Once GameWorld3D is
// fully migrated this can be removed.
export function consumePowerChargeMultiplier() { return 1; }

// Attack speed — DEPRECATED in new system. Returns 1 (no-op).
export function getAttackSpeedMultiplier() { return 1; }

// Dodge buff — DEPRECATED in new system. Returns false (no-op).
export function rollDodgeBuff() { return false; }

// God's Deflection helpers — new public API.
export { applyDeflectionToCrit, getCritBonus };

// Per-frame tick — replaces the old tickBuffs export.
export function tickBuffs() { tickBuffEngine(); }

// Subscribe — kept for HUDSkillSlots' existing buff-timer renderer.
// Re-shaped to match the new state so HUD can read new buff records.
export const subscribeBuffs = subscribeBuffEngine;
export { getBuffs };