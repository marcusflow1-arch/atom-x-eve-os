// Host-only boss state broadcaster.
//
// Identical pattern to enemySyncBroadcaster but for the bossEntities[] array
// exposed by GameWorld3D as window.__gw3dBosses. Bosses are far fewer (< 10)
// so we can sample at 10 Hz without bandwidth concerns.

import { subscribeHost, isHost } from './hostElectionStore';

const TICK_MS = 100; // 10 Hz

let intervalId = null;

const tick = () => {
  if (!isHost()) return;
  if (typeof window === 'undefined') return;
  const bosses = window.__gw3dBosses;
  const broadcast = window.webrtcBroadcast;
  if (!bosses || !broadcast || !Array.isArray(bosses) || bosses.length === 0) return;

  const list = [];
  for (const b of bosses) {
    if (!b || !b.group) continue;
    list.push({
      id: b.id,
      x: b.group.position.x,
      y: b.group.position.y,
      z: b.group.position.z,
      yaw: b.group.rotation.y,
      hp: Math.max(0, b.hp | 0),
      maxHp: b.maxHp | 0,
      dying: !!b.dying,
      alive: !!b.alive,
    });
  }
  if (list.length === 0) return;
  broadcast({ type: 'boss_snapshot', payload: { ts: Date.now(), bosses: list } });
};

export const startBossSyncBroadcaster = () => {
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