import { useEffect } from 'react';
import { getActiveCharacter } from '../../characterStore';
import { getAXESpawnProfile } from './AXECharacterEntry';

const keyFor = (characterId) => `axe_first_spawn_v1::${characterId || 'unknown'}`;

export default function AXEFirstSpawnMount() {
  useEffect(() => {
    let disposed = false;
    let timer = null;

    const attempt = () => {
      if (disposed) return;
      const character = getActiveCharacter();
      if (!character || character.isDevTest) return;

      const key = keyFor(character.id);
      let completed = false;
      try { completed = localStorage.getItem(key) === '1'; } catch {}
      if (completed) return;

      // Wait until the 3D world has created its player model and registered
      // the respawn listener, otherwise an early event would be lost.
      if (!window.__gw3dScene || !window.__localPlayerPos) return;

      const profile = getAXESpawnProfile(character);
      window.dispatchEvent(new CustomEvent('playerRespawn', {
        detail: {
          x: profile.position.x,
          z: profile.position.z,
          spawnId: profile.id,
          safeZone: profile.safeZone,
          tutorialIntroId: profile.tutorialIntroId,
          source: 'axe-first-spawn',
        },
      }));
      window.dispatchEvent(new CustomEvent('axeFirstSpawnEntered', {
        detail: { characterId: character.id, profile },
      }));

      try { localStorage.setItem(key, '1'); } catch {}
      if (timer) window.clearInterval(timer);
    };

    attempt();
    timer = window.setInterval(attempt, 250);

    return () => {
      disposed = true;
      if (timer) window.clearInterval(timer);
    };
  }, []);

  return null;
}
