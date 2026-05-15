// Slice C — hides/shows legacy WebRTC remote-player meshes based on the
// `disableLegacyRemotes` flag. Pure visual toggle — does NOT dispose the
// legacy manager (so reverting the flag instantly restores visibility).
// Used during validation so testers can A/B the two pipelines.
//
// VALIDATION FIX: previously used a continuous RAF loop. Now event-driven:
// the legacy manager spawns/despawns on bus events ('multiplayerPlayersUpdate',
// 'webrtcMovementUpdate'), so we re-apply visibility on the same events plus
// on flag changes. Zero per-frame work.

import { useEffect } from 'react';
import { getNetworkFlag, subscribeNetworkFlags } from '@/components/network/networkFeatureFlags';

function applyVisibility(hide) {
  const mgr = window.__gw3dLegacyRemoteManager;
  const remotes = mgr?.getRemotes?.();
  if (!remotes) return;
  remotes.forEach((r) => {
    if (r.group && r.group.visible === hide) r.group.visible = !hide;
  });
}

export default function LegacyRemotesVisibilityToggle() {
  useEffect(() => {
    let current = !!getNetworkFlag('disableLegacyRemotes');
    applyVisibility(current);

    // Re-apply whenever the legacy manager fires events that could spawn new meshes.
    const onLegacyEvent = () => applyVisibility(current);
    window.addEventListener('multiplayerPlayersUpdate', onLegacyEvent);
    window.addEventListener('webrtcMovementUpdate', onLegacyEvent);

    const unsubFlags = subscribeNetworkFlags((flags) => {
      const next = !!flags.disableLegacyRemotes;
      if (next !== current) {
        current = next;
        applyVisibility(current);
      }
    });

    return () => {
      window.removeEventListener('multiplayerPlayersUpdate', onLegacyEvent);
      window.removeEventListener('webrtcMovementUpdate', onLegacyEvent);
      try { unsubFlags && unsubFlags(); } catch {}
      // Restore visibility on unmount.
      applyVisibility(false);
    };
  }, []);

  return null;
}