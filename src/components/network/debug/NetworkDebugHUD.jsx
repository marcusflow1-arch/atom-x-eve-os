// Slice A — Network Debug HUD.
// Bottom-right overlay showing live metrics: state, ping, jitter, FPS,
// snapshot rate, server tick rate, prediction error, remote player count.

import React, { useEffect, useRef, useState } from 'react';
import { realtimeNetwork } from '@/components/network/realtimeNetworkManager';

const ROW_HEADER_CLS = 'text-[10px] uppercase tracking-wider text-white/40';
const ROW_VAL_CLS = 'text-xs font-mono text-white';

function pillForState(state) {
  switch (state) {
    case 'connected': return 'bg-green-500/30 text-green-200 border-green-400/40';
    case 'authenticating':
    case 'connecting': return 'bg-yellow-500/30 text-yellow-200 border-yellow-400/40';
    case 'reconnecting': return 'bg-orange-500/30 text-orange-200 border-orange-400/40';
    case 'closed': return 'bg-red-500/30 text-red-200 border-red-400/40';
    default: return 'bg-slate-500/30 text-slate-200 border-slate-400/40';
  }
}
function pingColor(ping) {
  if (ping <= 0) return 'text-white/50';
  if (ping < 80) return 'text-green-300';
  if (ping < 160) return 'text-yellow-300';
  return 'text-red-300';
}
function predictionColor(err) {
  if (err < 0.1) return 'text-green-300';
  if (err < 0.5) return 'text-yellow-300';
  return 'text-red-300';
}

export default function NetworkDebugHUD({ defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  const [snap, setSnap] = useState(() => realtimeNetwork.status());
  const [fps, setFps] = useState(0);
  const frameTimes = useRef([]);
  const rafRef = useRef(null);

  // Poll status + measure FPS each animation frame
  useEffect(() => {
    let last = performance.now();
    const loop = (now) => {
      const dt = now - last;
      last = now;
      const ft = frameTimes.current;
      ft.push(dt);
      if (ft.length > 60) ft.shift();
      const avg = ft.reduce((a, b) => a + b, 0) / ft.length;
      setFps(avg > 0 ? Math.round(1000 / avg) : 0);
      setSnap(realtimeNetwork.status());
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="absolute bottom-3 right-3 z-30 px-2.5 py-1 rounded bg-black/70 border border-white/15 text-xs text-white/80 hover:bg-black/85"
      >
        debug
      </button>
    );
  }

  const fpsColor = fps >= 50 ? 'text-green-300' : fps >= 30 ? 'text-yellow-300' : 'text-red-300';

  return (
    <div className="absolute bottom-3 right-3 z-30 w-64 bg-black/75 backdrop-blur border border-white/15 rounded-lg p-3 text-white shadow-xl">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-bold tracking-wider text-white/90">NET DEBUG</div>
        <div className="flex items-center gap-1.5">
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${pillForState(snap.state)}`}>
            {snap.state}
          </span>
          <button
            onClick={() => setOpen(false)}
            className="text-white/50 hover:text-white/90 text-xs px-1"
            aria-label="Close"
          >×</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
        <div>
          <div className={ROW_HEADER_CLS}>ping</div>
          <div className={`${ROW_VAL_CLS} ${pingColor(snap.ping)}`}>
            {snap.ping > 0 ? `${snap.ping}ms` : '—'}
          </div>
        </div>
        <div>
          <div className={ROW_HEADER_CLS}>jitter</div>
          <div className={ROW_VAL_CLS}>
            {snap.jitter > 0 ? `${snap.jitter}ms` : '—'}
          </div>
        </div>

        <div>
          <div className={ROW_HEADER_CLS}>fps</div>
          <div className={`${ROW_VAL_CLS} ${fpsColor}`}>{fps}</div>
        </div>
        <div>
          <div className={ROW_HEADER_CLS}>remotes</div>
          <div className={ROW_VAL_CLS}>{snap.remoteCount}</div>
        </div>

        <div>
          <div className={ROW_HEADER_CLS}>snap rate</div>
          <div className={ROW_VAL_CLS}>{snap.snapshotRate > 0 ? `${snap.snapshotRate} Hz` : '—'}</div>
        </div>
        <div>
          <div className={ROW_HEADER_CLS}>tick rate</div>
          <div className={ROW_VAL_CLS}>{snap.serverTickRate > 0 ? `${snap.serverTickRate} Hz` : '—'}</div>
        </div>

        <div className="col-span-2">
          <div className={ROW_HEADER_CLS}>pred error</div>
          <div className={`${ROW_VAL_CLS} ${predictionColor(snap.predictionError)}`}>
            {snap.predictionError.toFixed(3)} u
          </div>
        </div>

        <div className="col-span-2">
          <div className={ROW_HEADER_CLS}>id</div>
          <div className={`${ROW_VAL_CLS} truncate`}>{snap.id || '—'}</div>
        </div>
      </div>
    </div>
  );
}