// Host-only enemy state broadcaster.
//
// When this client is the elected host, samples every enemy in
// window.__gw3dEnemies (exposed by GameWorld3D) at 5 Hz and broadcasts
// position / HP / state via the existing WebRTC channel as
// type:'enemy_snapshot'.
//
// Non-hosts run a no-op until they become host.
//
// SAFE: if window.__gw3dEnemies or window.webrtcBroadcast are missing,
// the broadcaster silently does nothing. No invasive changes to GameWorld3D.

import { subscribeHost, isHost } from './hostElectionStore';

const TICK_HZ = 5;
const TICK_MS = 1000 / TICK_HZ;

let intervalId = null;

const tick = () => {
  if (!isHost()) return;
  if (typeof window === 'undefined') return;
  const enemies = window.__gw3dEnemies;
  const broadcast = window.webrtcBroadcast;
  if (!enemies || !broadcast || !Array.isArray(enemies) || enemies.length === 0) return;

  // Compact payload — only non-boss, alive-or-dying enemies. Position + HP
  // is all non-hosts need to render the same world state.
  const list = [];
  for (const e of enemies) {
    if (!e || !e.group || e.isBoss) continue;
    list.push({
      id: e.id,
      x: e.group.position.x,
      y: e.group.position.y,
      z: e.group.position.z,
      yaw: e.group.rotation.y,
      hp: Math.max(0, e.hp | 0),
      maxHp: e.maxHp | 0,
      dying: !!e.dying,
      state: e.state || 'idle',
    });
  }
  if (list.length === 0) return;
  broadcast({ type: 'enemy_snapshot', payload: { ts: Date.now(), enemies: list } });
};

export const startEnemySyncBroadcaster = () => {
  // Drive activation by host status changes — only run the interval when host.
  const unsub = subscribeHost((s) => {
    if (s.isHost && !intervalId) {
      intervalId = setInterval(tick, TICK_MS);
    } else if (!s.isHost && intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  });
  return () => {
    unsub && unsub();
    if (intervalId) { clearInterval(intervalId); intervalId = null; }
  };
};