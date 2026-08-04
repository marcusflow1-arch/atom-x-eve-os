import React, { useEffect, useState } from 'react';

const PHASE_LABEL = {
  forming: 'Tornado forming — winds rising',
  active: 'Tornado on the ground',
  lifted: 'Caught in the funnel',
  levitating: 'Above the storm — look up',
  landing: 'Drifting back down',
  dissipating: 'Storm winding down',
};

/** Live tornado readout + test spawn control (T). */
export default function TornadoHUD({ system }) {
  const [s, setS] = useState(null);

  useEffect(() => {
    if (!system) return;
    const id = setInterval(() => setS(system.getState()), 120);
    return () => clearInterval(id);
  }, [system]);

  if (!system) return null;
  const active = s?.active;

  return (
    <div className="absolute top-24 left-4 z-[60] flex flex-col gap-2 pointer-events-none">
      <button
        onClick={() => (active ? system.stop() : system.spawn({ x: 14, z: 10 }))}
        className="pointer-events-auto px-3 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase text-white transition-all"
        style={{
          background: 'rgba(10, 14, 20, 0.72)',
          backdropFilter: 'blur(14px) saturate(160%)',
          border: '1px solid rgba(148, 163, 184, 0.45)',
          boxShadow: '0 4px 18px rgba(0, 0, 0, 0.4)',
        }}
      >
        {active ? 'Stop Tornado' : 'Spawn Tornado (T)'}
      </button>

      {active && (
        <div
          className="px-3 py-2 rounded-xl min-w-[190px]"
          style={{
            background: 'rgba(10, 14, 20, 0.62)',
            backdropFilter: 'blur(14px) saturate(160%)',
            border: '1px solid rgba(148, 163, 184, 0.35)',
          }}
        >
          <div className="text-[11px] font-bold tracking-wider uppercase text-slate-200">
            {PHASE_LABEL[s.phase] || s.phase}
          </div>
          {s.distance != null && !s.captured && (
            <div className="text-[10px] text-slate-400 mt-0.5">{s.distance}m from the core</div>
          )}
          <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-slate-300 transition-all"
              style={{ width: `${Math.round((s.captured ? 1 : s.pull) * 100)}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {s.captured ? `Lift ${s.liftY}m` : `Pull ${Math.round(s.pull * 100)}%`}
          </div>
        </div>
      )}
    </div>
  );
}