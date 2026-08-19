import React, { useEffect, useState } from 'react';
import GameWorldEditorOverlay from './GameWorldEditorOverlay';

export default function GameWorldEditorGate() {
  const isGameRoute = () => /gameview|game-view|game/i.test(window.location.pathname);
  const [ready, setReady] = useState(() => isGameRoute() && !!window.__gw3dScene);
  useEffect(() => {
    const refresh = () => setReady(isGameRoute() && !!window.__gw3dScene);
    window.addEventListener('gw3dSceneReady', refresh);
    window.addEventListener('gw3dSceneTeardown', refresh);
    window.addEventListener('popstate', refresh);
    const timer = setInterval(refresh, 500);
    return () => { clearInterval(timer); window.removeEventListener('gw3dSceneReady', refresh); window.removeEventListener('gw3dSceneTeardown', refresh); window.removeEventListener('popstate', refresh); };
  }, []);
  return ready ? <GameWorldEditorOverlay /> : null;
}
