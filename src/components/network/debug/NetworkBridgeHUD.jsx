// Slice B — small debug overlay to toggle network bridge flags at runtime.
// Mount this on the GameView page (or anywhere) for live testing.
// Renders only when ?netdebug=1 query param is present, or always if alwaysShow prop is true.

import React, { useEffect, useState } from 'react';
import { realtimeNetwork } from '@/components/network/realtimeNetworkManager';
import {
  getNetworkFlags,
  setNetworkFlag,
  subscribeNetworkFlags,
} from '@/components/network/networkFeatureFlags';

function Toggle({ label, checked, onChange, disabled, hint }) {
  return (
    <label className={`flex items-center justify-between gap-2 py-1 ${disabled ? 'opacity-40' : ''}`}>
      <span className="text-[11px] text-white/80">
        {label}
        {hint && <span className="block text-[9px] text-white/40">{hint}</span>}
      </span>
      <input
        type="checkbox"
        checked={!!checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-cyan-500"
      />
    </label>
  );
}

export default function NetworkBridgeHUD({ alwaysShow = false }) {
  const [flags, setFlags] = useState(getNetworkFlags());
  const [status, setStatus] = useState(realtimeNetwork.status());
  const [collapsed, setCollapsed] = useState(false);
  const [visible, setVisible] = useState(alwaysShow);

  useEffect(() => {
    if (!alwaysShow) {
      try {
        const qp = new URLSearchParams(window.location.search);
        setVisible(qp.get('netdebug') === '1');
      } catch {}
    }
    const unsubFlags = subscribeNetworkFlags(setFlags);
    const t = setInterval(() => setStatus(realtimeNetwork.status()), 500);
    return () => {
      unsubFlags && unsubFlags();
      clearInterval(t);
    };
  }, [alwaysShow]);

  if (!visible) return null;

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="fixed bottom-3 left-3 z-[60] px-2.5 py-1 rounded bg-black/70 border border-white/15 text-xs text-white/80 hover:bg-black/85"
      >
        net bridge
      </button>
    );
  }

  const stateColor =
    status.state === 'connected' ? 'text-green-300' :
    status.state === 'reconnecting' ? 'text-orange-300' :
    status.state === 'connecting' || status.state === 'authenticating' ? 'text-yellow-300' :
    'text-slate-300';

  return (
    <div className="fixed bottom-3 left-3 z-[60] w-64 bg-black/80 backdrop-blur border border-white/15 rounded-lg p-3 text-white shadow-xl">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-bold tracking-wider">NET BRIDGE (Slice B)</div>
        <button
          onClick={() => setCollapsed(true)}
          className="text-white/50 hover:text-white/90 text-xs px-1"
          aria-label="Collapse"
        >–</button>
      </div>

      <div className="mb-2 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px]">
        <div className="text-white/40">state</div>
        <div className={`${stateColor} font-mono`}>{status.state}</div>
        <div className="text-white/40">ping</div>
        <div className="font-mono">{status.ping > 0 ? `${status.ping}ms` : '—'}</div>
        <div className="text-white/40">remotes</div>
        <div className="font-mono">{status.remoteCount}</div>
        <div className="text-white/40">pred err</div>
        <div className="font-mono">{status.predictionError.toFixed(3)} u</div>
      </div>

      <div className="border-t border-white/10 pt-2">
        <Toggle
          label="Enable network bridge"
          hint="master switch — connects to server"
          checked={flags.enableNetworkBridge}
          onChange={(v) => setNetworkFlag('enableNetworkBridge', v)}
        />
        <Toggle
          label="Send inputs to server"
          checked={flags.bridgeSendsInputs}
          disabled={!flags.enableNetworkBridge}
          onChange={(v) => setNetworkFlag('bridgeSendsInputs', v)}
        />
        <Toggle
          label="Override local position"
          hint="DANGER — drives store from prediction"
          checked={flags.bridgeOverridesLocalPos}
          disabled={!flags.enableNetworkBridge}
          onChange={(v) => setNetworkFlag('bridgeOverridesLocalPos', v)}
        />
        <Toggle
          label="Verbose logging"
          checked={flags.bridgeLogging}
          onChange={(v) => setNetworkFlag('bridgeLogging', v)}
        />
      </div>

      <div className="border-t border-white/10 pt-2 mt-2">
        <div className="text-[10px] text-white/40 mb-1 tracking-wider">SLICE C — REMOTES</div>
        <Toggle
          label="Enable network remotes"
          hint="render server-driven remote players (green ring)"
          checked={flags.enableNetworkRemotes}
          onChange={(v) => setNetworkFlag('enableNetworkRemotes', v)}
        />
        <Toggle
          label="Hide legacy remotes"
          hint="DANGER — hides existing WebRTC remotes (blue ring)"
          checked={flags.disableLegacyRemotes}
          onChange={(v) => setNetworkFlag('disableLegacyRemotes', v)}
        />
        <Toggle
          label="Remote debug labels"
          checked={flags.networkRemoteDebug}
          onChange={(v) => setNetworkFlag('networkRemoteDebug', v)}
        />
      </div>

      <div className="mt-2 pt-2 border-t border-white/10 text-[9px] text-white/40 leading-snug">
        Bridge + remotes are sibling listeners. GameWorld3D code is unchanged.
        Toggle any flag at runtime.
      </div>
    </div>
  );
}