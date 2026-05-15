// Slice B — invisible component that mounts/unmounts the network bridge
// alongside the existing GameWorld3D. Place it once on the GameView page.
//
// The bridge is fully inert unless the `enableNetworkBridge` flag is set
// (see networkFeatureFlags.js). Default = OFF.

import { useEffect } from 'react';
import { mountNetworkBridge } from './networkBridge';

export default function NetworkBridgeMount() {
  useEffect(() => {
    const teardown = mountNetworkBridge();
    return () => { try { teardown && teardown(); } catch {} };
  }, []);
  return null;
}