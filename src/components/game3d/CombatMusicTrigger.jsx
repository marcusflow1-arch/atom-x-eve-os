// ─── CombatMusicTrigger ──────────────────────────────────────────────
// Headless component. Listens to combat events on the window and tells
// the combatMusicController to enter/exit combat.
//
// Combat is considered ACTIVE when the player attacks an enemy OR takes
// damage from one. A 5-second idle timer ends combat once no new events
// have fired — that way short attack lulls don't drop the music.
//
// Events we listen to (already dispatched elsewhere in the game):
//   - rogueAITakeDamage   → player attacked a hostile player AI
//   - bossTakeDamage      → player attacked a world boss
//   - combatXPReward      → kill confirmed (keeps combat alive briefly)
//   - playerTookDamage    → player was hit (we dispatch this from setHP wrap)
//
// We also subscribe to the player HUD's HP — any drop triggers combat.

import { useEffect, useRef } from 'react';
import { enterCombat, exitCombat } from './combatMusicController';
import { subscribePlayerHUD } from './playerHUDStore';

const COMBAT_IDLE_TIMEOUT_MS = 5000;

export default function CombatMusicTrigger() {
  const idleTimerRef = useRef(null);
  const lastHpRef = useRef(null);

  useEffect(() => {
    const bump = () => {
      enterCombat();
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        idleTimerRef.current = null;
        exitCombat();
      }, COMBAT_IDLE_TIMEOUT_MS);
    };

    // Window event hooks — any of these means active combat.
    const events = [
      'rogueAITakeDamage',
      'bossTakeDamage',
      'enemyTakeDamage',
      'combatXPReward',
      'playerTookDamage',
    ];
    events.forEach((ev) => window.addEventListener(ev, bump));

    // HP-drop detection — if HP decreased, the player just took damage.
    const unsubHud = subscribePlayerHUD((s) => {
      const prev = lastHpRef.current;
      if (prev != null && s.hp < prev) bump();
      lastHpRef.current = s.hp;
    });

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, bump));
      unsubHud();
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
    };
  }, []);

  return null;
}