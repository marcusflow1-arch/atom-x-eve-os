// Slice C — overlay that projects per-remote labels (id, anim, snapshot age)
// over each network remote's head. Only renders when `networkRemoteDebug` flag is on.
//
// Lightweight: throttled to 10Hz, no React state per-remote — uses a single
// state slot with an array.

import React, { useEffect, useState } from 'react';
import * as THREE from 'three';
import { realtimeNetwork } from '@/components/network/realtimeNetworkManager';
import { getNetworkFlag, subscribeNetworkFlags } from '@/components/network/networkFeatureFlags';

const _tmp = new THREE.Vector3();

export default function NetworkRemotesDebugOverlay() {
  const [labels, setLabels] = useState([]);
  const [enabled, setEnabled] = useState(!!getNetworkFlag('networkRemoteDebug'));

  useEffect(() => {
    const unsub = subscribeNetworkFlags((f) => setEnabled(!!f.networkRemoteDebug));
    return () => { try { unsub && unsub(); } catch {} };
  }, []);

  useEffect(() => {
    if (!enabled) { setLabels([]); return; }
    let interval = null;
    function tick() {
      const camera = window.__gw3dCamera;
      const mgr = window.__networkRemotesManager;
      if (!camera || !mgr) { setLabels([]); return; }
      const w = window.innerWidth, h = window.innerHeight;
      const out = [];
      const snap = mgr.getDebugSnapshot();
      snap.forEach((e) => {
        _tmp.set(e.x, e.y + 2.9, e.z);
        _tmp.project(camera);
        if (_tmp.z < -1 || _tmp.z > 1) return;
        if (Math.abs(_tmp.x) > 1.2 || Math.abs(_tmp.y) > 1.2) return;
        out.push({
          id: e.id,
          anim: e.anim || '—',
          age: Math.round(e.snapshotAgeMs),
          x: (_tmp.x * 0.5 + 0.5) * w,
          y: (-_tmp.y * 0.5 + 0.5) * h,
        });
      });
      setLabels(out);
    }
    interval = setInterval(tick, 100);
    return () => clearInterval(interval);
  }, [enabled]);

  if (!enabled || labels.length === 0) return null;

  const rtt = realtimeNetwork.status().ping;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {labels.map((l) => (
        <div
          key={l.id}
          className="absolute select-none"
          style={{ left: l.x, top: l.y, transform: 'translate(-50%, -100%)' }}
        >
          <div
            className="px-2 py-1 rounded-md text-[10px] font-mono whitespace-nowrap"
            style={{
              background: 'rgba(0,0,0,0.75)',
              border: '1px solid rgba(34, 197, 94, 0.45)',
              color: '#bbf7d0',
              textShadow: '0 1px 2px rgba(0,0,0,0.9)',
            }}
          >
            <div className="text-green-300 font-bold">{l.id.slice(0, 8)}</div>
            <div className="text-white/60">{l.anim} · age {l.age}ms · rtt {rtt}ms</div>
          </div>
        </div>
      ))}
    </div>
  );
}