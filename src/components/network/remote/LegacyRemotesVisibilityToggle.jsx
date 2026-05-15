// Slice C — hides/shows legacy WebRTC remote-player meshes based on the
// `disableLegacyRemotes` flag. Pure visual toggle — does NOT dispose the
// legacy manager (so reverting the flag instantly restores visibility).
// Used during validation so testers can A/B the two pipelines.

import { useEffect } from 'react';
import { getNetworkFlag, subscribeNetworkFlags } from '@/components/network/networkFeatureFlags';

export default function LegacyRemotesVisibilityToggle() {
  useEffect(() => {
    let rafId = null;

    function tick() {
      rafId = requestAnimationFrame(tick);
      const hide = !!getNetworkFlag('disableLegacyRemotes');
      const mgr = window.__gw3dLegacyRemoteManager;
      const remotes = mgr?.getRemotes?.();
      if (!remotes) return;
      remotes.forEach((r) => {
        if (r.group && r.group.visible === hide) r.group.visible = !hide;
      });
    }

    const unsubFlags = subscribeNetworkFlags(() => { /* re-evaluated on next tick */ });
    rafId = requestAnimationFrame(tick);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      try { unsubFlags && unsubFlags(); } catch {}
      // Restore visibility on unmount.
      const mgr = window.__gw3dLegacyRemoteManager;
      mgr?.getRemotes?.()?.forEach((r) => { if (r.group) r.group.visible = true; });
    };
  }, []);

  return null;
}