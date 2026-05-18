// ─── Death Flow Controller ─────────────────────────────────────────────
// Watches the player's HP. When it hits 0:
//   1. Fires `playerDeathAnimation` so the world can play the death anim.
//   2. After the animation window (1.8 s), shows the DeathTipsOverlay.
//   3. The tips overlay auto-advances to RespawnMapOverlay after 5 s.
//   4. The map overlay teleports + revives the player on selection.

import React, { useEffect, useState } from 'react';
import { subscribePlayerHUD } from '../playerHUDStore';
import { getPlayerPosition } from '../playerPositionStore';
import { subscribeDeath, setDeathPhase, getDeathState } from './deathStore';
import DeathTipsOverlay from './DeathTipsOverlay';
import RespawnMapOverlay from './RespawnMapOverlay';

const DEATH_ANIM_MS = 3000; // play death animation for 3 s before tips overlay appears

export default function DeathFlowController() {
  const [phase, setPhase] = useState(getDeathState().phase);

  // Watch HP — trigger death when hp hits 0 (only if currently alive)
  useEffect(() => {
    return subscribePlayerHUD((hud) => {
      if (hud.hp <= 0 && getDeathState().phase === 'alive') {
        const pos = getPlayerPosition();
        setDeathPhase('dying', { deathPosition: { x: pos.x, z: pos.z } });
        // Signal the world / player model to play the death animation
        window.dispatchEvent(new CustomEvent('playerDeathAnimation'));
        // After the animation window, show the tips overlay
        setTimeout(() => {
          if (getDeathState().phase === 'dying') setDeathPhase('tips');
        }, DEATH_ANIM_MS);
      }
    });
  }, []);

  // Mirror death-store phase into local state for rendering
  useEffect(() => subscribeDeath((s) => setPhase(s.phase)), []);

  if (phase === 'tips')    return <DeathTipsOverlay />;
  if (phase === 'respawn') return <RespawnMapOverlay />;
  return null;
}