// Mount Soul Fusion timer chip: which mount is absorbed, its combination share and
// the time left, in the ink-and-seal style of the Wuxia HUD notices. The 1 s tick
// also ends an expired fusion if the browser slept through the store's timer.
import { useEffect, useState } from 'react';
import { getAXEMountFusionState, subscribeAXEMounts, tickAXEMountFusion } from './AXEMountStore';

const clock = (ms) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}` : `${m}:${String(r).padStart(2, '0')}`;
};

export default function AXEMountFusionHUD() {
  const [fusion, setFusion] = useState(() => getAXEMountFusionState());
  useEffect(() => subscribeAXEMounts(() => setFusion(getAXEMountFusionState())), []);
  useEffect(() => {
    if (!fusion.active) return undefined;
    const id = setInterval(() => { tickAXEMountFusion(); setFusion(getAXEMountFusionState()); }, 1000);
    return () => clearInterval(id);
  }, [fusion.active]);

  if (!fusion.active) return null;
  return (
    <div
      className="pointer-events-none fixed left-1/2 top-24 z-[55] -translate-x-1/2 flex items-center gap-3 rounded-sm px-3 py-1.5"
      style={{ background: 'rgba(17,16,15,0.82)', boxShadow: `0 0 0 1px ${fusion.palette.primary}55, 0 0 18px ${fusion.palette.primary}40` }}
      role="status"
      aria-label={`Mount Soul Fusion: ${fusion.mountName}, ${fusion.share}% share, ${clock(fusion.remainingMs)} left`}
    >
      <span className="h-3 w-3 rounded-full" style={{ background: fusion.palette.primary, boxShadow: `0 0 10px ${fusion.palette.primary}` }} />
      <span className="text-xs tracking-wide" style={{ color: '#efe6d2', fontFamily: 'Georgia, "Noto Serif", serif' }}>
        Soul Fusion · {fusion.mountName} · +{fusion.share}% gear
      </span>
      <span className="text-xs font-semibold tabular-nums" style={{ color: fusion.palette.secondary === '#0b0d1a' ? '#c7d0ff' : fusion.palette.secondary }}>
        {clock(fusion.remainingMs)}
      </span>
    </div>
  );
}
