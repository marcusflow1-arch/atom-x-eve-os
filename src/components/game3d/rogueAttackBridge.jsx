// ─── Rogue Attack Bridge ─────────────────────────────────────────────
// Bridges player melee attacks from GameWorld3D → hostile rogue-AIs that
// live in EnemyPlayerSpawner (window.__gw3dRogues, listening for the
// 'rogueAITakeDamage' event).
//
// This file exists so GameWorld3D doesn't grow past its 2000-line cap.
// It computes the player's outgoing damage against an undefended target
// and dispatches the event. Rogue-AIs do their own range check + closest
// pick, so we don't need to know about specific rogues here.

import { getPlayerHUD } from './playerHUDStore';
import { calculateHit } from './statsSystem';
import { getWeaponDamageMult, getWeaponCritChanceBonusPct } from './weaponClassCombatHelpers';

/**
 * Fire a rogue-damage event on the current attack click.
 * Safe to call on every left-click — no-ops if no rogues are in range
 * (the listener filters by distance).
 */
export function dispatchRogueAttack(playerDerivedRef, skillStrikeMult = 1.0) {
  const liveDerived = getPlayerHUD().derived || playerDerivedRef.current;
  const boosted = { ...liveDerived, critChance: (liveDerived.critChance || 0) + getWeaponCritChanceBonusPct() };
  const dmg = Math.max(
    1,
    Math.round(
      calculateHit(boosted, { defense: 0 }) * getWeaponDamageMult() * skillStrikeMult,
    ),
  );
  window.dispatchEvent(new CustomEvent('rogueAITakeDamage', { detail: { damage: dmg } }));
}