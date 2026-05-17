// Non-host boss state receiver. Mirrors enemySyncReceiver for bosses.

import { isHost } from './hostElectionStore';
import { updateBoss } from '../bossStore';

const onSnapshot = (e) => {
  if (isHost()) return;
  if (typeof window === 'undefined') return;
  const bosses = window.__gw3dBosses;
  if (!bosses || !Array.isArray(bosses)) return;
  const payload = e.detail;
  if (!payload || !Array.isArray(payload.bosses)) return;

  for (const snap of payload.bosses) {
    const local = bosses.find((b) => b && b.id === snap.id);
    if (!local || !local.group) continue;

    // Bosses are big & slow — full lerp is fine.
    local.group.position.x += (snap.x - local.group.position.x) * 0.5;
    local.group.position.y += (snap.y - local.group.position.y) * 0.5;
    local.group.position.z += (snap.z - local.group.position.z) * 0.5;
    if (typeof snap.yaw === 'number') local.group.rotation.y = snap.yaw;

    if (typeof snap.hp === 'number') local.hp = snap.hp;
    if (typeof snap.maxHp === 'number' && snap.maxHp > 0) local.maxHp = snap.maxHp;
    if (typeof snap.alive === 'boolean') local.alive = snap.alive;

    if (snap.dying && !local.dying) {
      local.dying = true;
      local.deathTimer = 0;
      local.hp = 0;
    }

    // Keep the bossStore in sync so HUD waypoints / boss markers update.
    updateBoss(local.id, {
      x: local.group.position.x,
      z: local.group.position.z,
      hp: local.hp,
      maxHp: local.maxHp,
      alive: !!local.alive && !local.dying,
    });
  }
};

export const startBossSyncReceiver = () => {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('webrtcBossSnapshot', onSnapshot);
  return () => window.removeEventListener('webrtcBossSnapshot', onSnapshot);
};