import { useEffect, useState } from 'react';

// Return true only when a real peer data channel is open for the matched
// opponent in the expected dashboard channel. Not a social presence guess.
export function useBattlePeerLink(match, opponent) {
  const [connected, setConnected] = useState(false);
  const peerId = String(opponent?.id || opponent?.player_id || '');
  const roomId = String(match?.dashboard_channel || ('dashboard_' + (match?.host_id || '')));
  useEffect(() => {
    const check = (event) => {
      if (event && String(event.detail?.roomId || '') !== roomId) return;
      const state = window.__atomxeWebRTCPeerState;
      setConnected(Boolean(peerId && state?.roomId === roomId && state.peers?.[peerId]));
    };
    check();
    window.addEventListener('atomxeWebRTCPeerState', check);
    return () => window.removeEventListener('atomxeWebRTCPeerState', check);
  }, [roomId, peerId]);
  return connected;
}
