// Slice A — Network Test page.
// Completely isolated. Renders no Layout, touches no gameplay systems.
// Visit at /NetworkTest

import React, { useEffect, useState } from 'react';
import NetworkTestScene from '@/components/network/test/NetworkTestScene';
import NetworkTestControls from '@/components/network/test/NetworkTestControls';
import NetworkDebugHUD from '@/components/network/debug/NetworkDebugHUD.jsx';
import { realtimeNetwork } from '@/components/network/realtimeNetworkManager';

export default function NetworkTest() {
  const [status, setStatus] = useState(realtimeNetwork.status().state);
  const [errorMsg, setErrorMsg] = useState(null);
  const [autoConnectTried, setAutoConnectTried] = useState(false);

  useEffect(() => {
    const unsubState = realtimeNetwork.on('state', (s) => setStatus(s));
    const unsubKick = realtimeNetwork.on('kick', (d) =>
      setErrorMsg(`Kicked: ${d?.reason || 'unknown'}`));
    const unsubAuthOk = realtimeNetwork.on('auth_ok', () => setErrorMsg(null));

    // Try auto-connect once on mount
    if (!autoConnectTried) {
      setAutoConnectTried(true);
      realtimeNetwork.connect().catch((e) => setErrorMsg(e?.message || 'Connect failed'));
    }

    return () => {
      unsubState && unsubState();
      unsubKick && unsubKick();
      unsubAuthOk && unsubAuthOk();
      // Disconnect on unmount so other pages aren't affected
      realtimeNetwork.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 flex flex-col bg-slate-950 text-white">
      <NetworkTestControls status={status} onStatusChange={setStatus} />

      {errorMsg && (
        <div className="px-3 py-2 bg-red-500/20 border-b border-red-400/40 text-red-200 text-xs">
          {errorMsg}
        </div>
      )}

      <div className="relative flex-1 overflow-hidden">
        <NetworkTestScene />

        {/* On-screen controls hint */}
        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur rounded-lg p-3 text-xs space-y-1 pointer-events-none border border-white/10">
          <div className="font-semibold text-white/80 mb-1">Controls</div>
          <div className="text-white/70">WASD — move</div>
          <div className="text-white/70">Shift — sprint</div>
          <div className="text-white/70">Space — jump</div>
        </div>

        {/* Status overlay when not connected */}
        {status !== 'connected' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 pointer-events-none">
            <div className="text-center">
              <div className="text-2xl font-bold mb-2 capitalize">{status || 'disconnected'}</div>
              <div className="text-sm text-white/60 max-w-md">
                {status === 'reconnecting' && 'Trying to reach the server…'}
                {status === 'closed' && 'Press Connect, or start atomxe-server and refresh.'}
                {status === 'idle' && 'Press Connect to begin.'}
                {(status === 'connecting' || status === 'authenticating') && 'Establishing connection…'}
              </div>
            </div>
          </div>
        )}

        <NetworkDebugHUD defaultOpen />
      </div>
    </div>
  );
}