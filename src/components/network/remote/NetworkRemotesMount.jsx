// Slice C — React component that mounts the NetworkRemotesManager once
// GameWorld3D has exposed the THREE scene on window.__gw3dScene.
//
// Runs its own RAF loop, gated by the `enableNetworkRemotes` flag. When the
// flag is off, the manager is fully torn down. Safe to mount once on /GameView
// alongside the legacy RemotePlayersManager.

import { useEffect } from 'react';
import { createNetworkRemotesManager } from './NetworkRemotesManager';
import { getNetworkFlag, subscribeNetworkFlags } from '@/components/network/networkFeatureFlags';

export default function NetworkRemotesMount() {
  useEffect(() => {
    let manager = null;
    let rafId = null;
    let lastT = performance.now();
    let active = !!getNetworkFlag('enableNetworkRemotes');

    function tick(now) {
      rafId = requestAnimationFrame(tick);
      const dt = Math.min(0.1, (now - lastT) / 1000);
      lastT = now;
      try {
        if (manager) manager.update(dt);
      } catch (e) {
        console.error('[NetworkRemotesMount] update error:', e);
      }
    }

    function startWithScene(scene) {
      if (manager || !scene) return;
      manager = createNetworkRemotesManager(scene);
      lastT = performance.now();
      rafId = requestAnimationFrame(tick);
      // Expose for debug HUD
      window.__networkRemotesManager = manager;
    }

    function stop() {
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      if (manager) { try { manager.dispose(); } catch {} manager = null; }
      window.__networkRemotesManager = null;
    }

    function onSceneReady() {
      if (active && window.__gw3dScene) startWithScene(window.__gw3dScene);
    }
    function onSceneTeardown() {
      stop();
    }

    window.addEventListener('gw3dSceneReady', onSceneReady);
    window.addEventListener('gw3dSceneTeardown', onSceneTeardown);

    // If the scene is already mounted by the time we run, attach immediately.
    if (active && window.__gw3dScene) startWithScene(window.__gw3dScene);

    const unsubFlags = subscribeNetworkFlags((flags) => {
      const next = !!flags.enableNetworkRemotes;
      if (next && !active) {
        active = true;
        if (window.__gw3dScene) startWithScene(window.__gw3dScene);
      } else if (!next && active) {
        active = false;
        stop();
      }
    });

    return () => {
      window.removeEventListener('gw3dSceneReady', onSceneReady);
      window.removeEventListener('gw3dSceneTeardown', onSceneTeardown);
      try { unsubFlags && unsubFlags(); } catch {}
      stop();
    };
  }, []);

  return null;
}