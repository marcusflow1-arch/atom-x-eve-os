// Slice A — top bar with server URL input, connect/disconnect, status pill.
import React, { useEffect, useState } from 'react';
import { realtimeNetwork } from '@/components/network/realtimeNetworkManager';

const STATE_STYLES = {
  connected:       'bg-green-500/20 text-green-300 border-green-400/40',
  authenticating:  'bg-yellow-500/20 text-yellow-200 border-yellow-400/40',
  connecting:      'bg-yellow-500/20 text-yellow-200 border-yellow-400/40',
  reconnecting:    'bg-orange-500/20 text-orange-200 border-orange-400/40',
  closed:          'bg-red-500/20 text-red-300 border-red-400/40',
  idle:            'bg-slate-500/20 text-slate-300 border-slate-400/40',
};

export default function NetworkTestControls({ status, onStatusChange }) {
  const [url, setUrl] = useState(realtimeNetwork.getServerUrl());

  useEffect(() => {
    const unsub = realtimeNetwork.on('state', (s) => onStatusChange?.(s));
    return () => unsub && unsub();
  }, [onStatusChange]);

  const handleConnect = async () => {
    realtimeNetwork.setServerUrl(url);
    try { await realtimeNetwork.connect(url); } catch (e) { console.error(e); }
  };
  const handleDisconnect = () => realtimeNetwork.disconnect();

  const stateLabel = status || realtimeNetwork.status().state || 'idle';
  const pillCls = STATE_STYLES[stateLabel] || STATE_STYLES.idle;

  return (
    <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-900/80 backdrop-blur border-b border-white/10">
      <div className="text-sm font-semibold text-white/90 tracking-wider">NETWORK TEST · SLICE A</div>
      <div className={`px-2.5 py-0.5 rounded-full text-xs font-mono border ${pillCls}`}>
        {stateLabel}
      </div>
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="ws://localhost:2567"
        className="flex-1 min-w-[240px] bg-black/40 border border-white/10 rounded px-3 py-1.5 text-xs font-mono text-white"
      />
      <button
        onClick={handleConnect}
        disabled={stateLabel === 'connected' || stateLabel === 'connecting'}
        className="px-3 py-1.5 text-xs rounded bg-cyan-500/30 hover:bg-cyan-500/50 disabled:opacity-40 disabled:cursor-not-allowed text-white"
      >Connect</button>
      <button
        onClick={handleDisconnect}
        disabled={stateLabel === 'closed' || stateLabel === 'idle'}
        className="px-3 py-1.5 text-xs rounded bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-white"
      >Disconnect</button>
    </div>
  );
}