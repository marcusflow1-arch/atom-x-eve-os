// Slice B — non-invasive bridge between GameWorld3D and realtimeNetworkManager.
// Listens to the 'multiplayerLocalUpdate' event that GameWorld3D already dispatches
// every frame, converts it into input deltas, and (optionally) forwards to the server.
//
// CRITICAL DESIGN GOAL:
//   GameWorld3D code is NOT modified. The bridge runs purely as a sibling listener.
//   When the master flag `enableNetworkBridge` is off, the bridge is fully inert.
//
// Lifecycle: mountNetworkBridge() returns a teardown function. Safe to call/teardown
// repeatedly. Safe to mount even if no server is reachable — connect failures are caught.

import { realtimeNetwork } from './realtimeNetworkManager';
import { getNetworkFlag, subscribeNetworkFlags } from './networkFeatureFlags';
import { setPlayerPosition } from '@/components/game3d/playerPositionStore';

const log = (...args) => {
  if (getNetworkFlag('bridgeLogging')) console.log('[netBridge]', ...args);
};

export function mountNetworkBridge() {
  // Track previous frame's world position so we can compute per-frame deltas.
  let prev = null; // { x, y, z, yaw, anim, t }
  let lastSendT = 0;
  let connected = false;
  let connectAttempted = false;
  let active = !!getNetworkFlag('enableNetworkBridge');

  const onMultiplayerUpdate = (e) => {
    if (!active) return;
    const d = e?.detail;
    if (!d || typeof d.x !== 'number') return;

    const now = performance.now();
    if (!prev) {
      prev = { x: d.x, y: d.y || 0, z: d.z, yaw: d.yaw || 0, anim: d.anim || 'idle', t: now };
      return;
    }

    const dt = Math.min(0.1, (now - prev.t) / 1000);
    if (dt <= 0) return;

    const dx = d.x - prev.x;
    const dy = (d.y || 0) - prev.y;
    const dz = d.z - prev.z;

    // 1) Send inputs to server (if enabled and connected)
    if (getNetworkFlag('bridgeSendsInputs') && connected) {
      // Throttle to ~30Hz to match server tick rate
      if (now - lastSendT >= 33) {
        lastSendT = now;
        realtimeNetwork.sendInput({
          dt,
          dx, dy, dz,
          rotY: d.yaw || 0,
          anim: d.anim || 'idle',
        });
      }
    }

    // 2) Optionally override playerPositionStore with predicted/reconciled state
    //    Default OFF — the existing GameWorld3D update path remains authoritative.
    if (getNetworkFlag('bridgeOverridesLocalPos') && connected) {
      const local = realtimeNetwork.getLocalState();
      if (local && local.pos) {
        setPlayerPosition({ x: local.pos.x, z: local.pos.z, yaw: local.rot?.y || 0 });
      }
    }

    prev = { x: d.x, y: d.y || 0, z: d.z, yaw: d.yaw || 0, anim: d.anim || 'idle', t: now };
  };

  const unsubState = realtimeNetwork.on('state', (s) => {
    connected = s === 'connected';
    log('state =', s);
  });

  const unsubFlags = subscribeNetworkFlags((flags) => {
    const wasActive = active;
    active = !!flags.enableNetworkBridge;
    if (active && !wasActive) {
      log('bridge enabled — connecting…');
      ensureConnected();
    } else if (!active && wasActive) {
      log('bridge disabled — disconnecting');
      try { realtimeNetwork.disconnect(); } catch {}
      connectAttempted = false;
      prev = null;
    }
  });

  function ensureConnected() {
    if (connectAttempted) return;
    connectAttempted = true;
    Promise.resolve()
      .then(() => realtimeNetwork.connect())
      .catch((e) => log('connect failed (non-fatal):', e?.message || e));
  }

  // If the flag is already on at mount time, connect immediately.
  if (active) ensureConnected();

  window.addEventListener('multiplayerLocalUpdate', onMultiplayerUpdate);
  log('mounted (active =', active, ')');

  return function teardown() {
    window.removeEventListener('multiplayerLocalUpdate', onMultiplayerUpdate);
    try { unsubState && unsubState(); } catch {}
    try { unsubFlags && unsubFlags(); } catch {}
    // Disconnect on teardown so we don't leak a socket when leaving the page.
    try { realtimeNetwork.disconnect(); } catch {}
    prev = null;
    log('torn down');
  };
}