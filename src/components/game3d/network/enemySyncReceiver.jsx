// Non-host enemy state receiver.
//
// Listens for `webrtcEnemySnapshot` events (relayed by MultiplayerSystem) and
// overwrites local enemy positions / HP / dying state so every client renders
// the same world the host is simulating.
//
// On the host itself, snapshots are ignored — the host IS the source of truth.

import { isHost } from './hostElectionStore';

const onSnapshot = (e) => {
  if (isHost()) return; // host already runs the simulation
  if (typeof window === 'undefined') return;
  const enemies = window.__gw3dEnemies;
  if (!enemies || !Array.isArray(enemies)) return;
  const payload = e.detail;
  if (!payload || !Array.isArray(payload.enemies)) return;

  for (const snap of payload.enemies) {
    const local = enemies.find((en) => en && en.id === snap.id);
    if (!local || !local.group) continue;

    // Smooth-lerp the position so we don't snap visibly on every snapshot.
    // 0.5 gives a comfortable feel at 5Hz; raw teleport feels jittery.
    local.group.position.x += (snap.x - local.group.position.x) * 0.5;
    local.group.position.y += (snap.y - local.group.position.y) * 0.5;
    local.group.position.z += (snap.z - local.group.position.z) * 0.5;
    if (typeof snap.yaw === 'number') local.group.rotation.y = snap.yaw;

    // HP / max HP — authoritative.
    if (typeof snap.hp === 'number') local.hp = snap.hp;
    if (typeof snap.maxHp === 'number' && snap.maxHp > 0) local.maxHp = snap.maxHp;

    // Death sync — if host says dying and we still think alive, kill it.
    if (snap.dying && !local.dying && local.alive) {
      local.dying = true;
      local.deathTimer = 0;
      local.hp = 0;
      local.respawnAt = performance.now() + 10000;
    }
  }
};

export const startEnemySyncReceiver = () => {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('webrtcEnemySnapshot', onSnapshot);
  return () => window.removeEventListener('webrtcEnemySnapshot', onSnapshot);
};