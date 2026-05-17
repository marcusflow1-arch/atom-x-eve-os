// Companion auto-combat — runs once per frame from the GameWorld3D loop.
//
// Rules (kept intentionally simple):
//   1) If the player has a targeted enemy AND the companion ability is off
//      cooldown, the companion casts an offensive ability on that target.
//      Priority: teleport_dash > bite > life_drain (life_drain is held back
//      when player HP is fine to avoid wasting it).
//   2) If the player's HP drops below HEAL_THRESHOLD (45%) and `heal` is
//      ready, the companion auto-heals.
//   3) If the player took damage recently (within REACTIVE_HEAL_WINDOW) and
//      is below REACTIVE_HEAL_PCT (75%), it'll also heal — feels reactive.
//   4) All casts use the existing processCompanionAbilityPress() pipeline,
//      so cooldowns, VFX, XP, kill credit, etc. all behave identically to
//      manual Z/X/V/B presses.
//
// Decision tick runs at ~6Hz (every 0.16s) so the AI feels alive but doesn't
// hammer the cooldown check every frame.

import { getCompanionAbilityState } from './companionAbilityStore';
import { getAbilityState } from './abilityStore';
import { getPlayerHUD } from './playerHUDStore';
import { processCompanionAbilityPress } from './companionAbilityHandler';

const TICK_INTERVAL = 0.16;          // ~6Hz decisions
const HEAL_THRESHOLD = 0.45;         // auto-heal under 45% HP
const REACTIVE_HEAL_PCT = 0.75;      // reactive heal under 75% if recently hit
const REACTIVE_HEAL_WINDOW = 1.5;    // seconds after last damage

let tickTimer = 0;
let lastHP = null;
let lastDamageAt = 0;

/**
 * Drive companion combat AI for one frame.
 *
 * @param {object} ctx — everything processCompanionAbilityPress() needs:
 *   { delta, scene, model, enemies, cachedDeathClip, companionDefId,
 *     playerXPRef, playerLevelRef, setScore, setPlayerXP, setPlayerLevel,
 *     spawnXPFloat, spawnDamageFloat, xpForLevel, awardXP, activeEffectsRef,
 *     isMounted }
 */
export function tickCompanionAutoCombat(ctx) {
  const { delta, model, enemies, isMounted } = ctx;
  if (!model) return;

  // Track HP-drop events to feed reactive-heal logic
  const hud = getPlayerHUD();
  const now = performance.now() / 1000;
  if (lastHP === null) lastHP = hud.hp;
  if (hud.hp < lastHP) lastDamageAt = now;
  lastHP = hud.hp;

  // Throttle decisions
  tickTimer -= delta;
  if (tickTimer > 0) return;
  tickTimer = TICK_INTERVAL;

  // While mounted the companion is the mount — don't fire offensive moves,
  // but DO still auto-heal the rider when in danger.
  const cd = getCompanionAbilityState().cooldowns;
  const hpPct = hud.maxHP > 0 ? hud.hp / hud.maxHP : 1;
  const recentlyHit = (now - lastDamageAt) < REACTIVE_HEAL_WINDOW;

  // ── Healing decisions ───────────────────────────────────────────────
  if (hud.hp > 0 && hud.hp < hud.maxHP) {
    // Hard heal: critically low HP
    if (hpPct < HEAL_THRESHOLD && (cd.heal || 0) <= 0) {
      processCompanionAbilityPress({ ...ctx, abilityId: 'heal' });
      return;
    }
    // Reactive heal: recently took damage and somewhat hurt
    if (recentlyHit && hpPct < REACTIVE_HEAL_PCT && (cd.heal || 0) <= 0) {
      processCompanionAbilityPress({ ...ctx, abilityId: 'heal' });
      return;
    }
    // Life-drain doubles as healing — use it if heal is on CD and we have a target
    if (hpPct < REACTIVE_HEAL_PCT && (cd.life_drain || 0) <= 0 && !isMounted) {
      const tgt = getAbilityState().target;
      if (tgt && enemies?.some((e) => e.id === tgt.id && e.alive && !e.dying)) {
        processCompanionAbilityPress({ ...ctx, abilityId: 'life_drain' });
        return;
      }
    }
  }

  // While mounted we stop here — no offensive companion abilities.
  if (isMounted) return;

  // ── Offensive decisions: only if player has a target ────────────────
  const tgt = getAbilityState().target;
  if (!tgt) return;
  const targetEnemy = enemies?.find((e) => e.id === tgt.id && e.alive && !e.dying);
  if (!targetEnemy) return;

  // Priority: teleport_dash (highest dmg) → bite → life_drain
  if ((cd.teleport_dash || 0) <= 0) {
    processCompanionAbilityPress({ ...ctx, abilityId: 'teleport_dash' });
    return;
  }
  if ((cd.bite || 0) <= 0) {
    processCompanionAbilityPress({ ...ctx, abilityId: 'bite' });
    return;
  }
  if ((cd.life_drain || 0) <= 0) {
    processCompanionAbilityPress({ ...ctx, abilityId: 'life_drain' });
  }
}

/** Reset internal state on scene teardown / companion swap. */
export function resetCompanionAutoCombat() {
  tickTimer = 0;
  lastHP = null;
  lastDamageAt = 0;
}