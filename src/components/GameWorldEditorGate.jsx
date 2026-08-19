import React, { useEffect, useState } from 'react';
import GameWorldEditorOverlay from './GameWorldEditorOverlay';

/** Mount the editor only for the real Game Viewer route and only while its live
 * Three.js scene exists. This keeps Admin and every other page untouched. */
export default function GameWorldEditorGate() {
  const [ready, setReady] = useState(() => window.location.pathname === '/GameView' && !!window.__gw3dScene);

  useEffect(() => {
    const refresh = () => setReady(window.location.pathname === '/GameView' && !!window.__gw3dScene);
    window.addEventListener('gw3dSceneReady', refresh);
    window.addEventListener('gw3dSceneTeardown', refresh);
    window.addEventListener('popstate', refresh);
    refresh();
    return () => {
      window.removeEventListener('gw3dSceneReady', refresh);
      window.removeEventListener('gw3dSceneTeardown', refresh);
      window.removeEventListener('popstate', refresh);
    };
  }, []);

  return ready ? <GameWorldEditorOverlay /> : null;
}
