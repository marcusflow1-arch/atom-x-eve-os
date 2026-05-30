// TrustMeter.jsx — Visual trust bar for a single NPC

import React from 'react';

export default function TrustMeter({ npc, trust }) {
  const pct = ((trust + 100) / 200) * 100; // map -100..100 → 0..100%
  const color = trust >= 50 ? '#34d399' : trust < 0 ? '#ef4444' : '#fbbf24';
  const label = trust >= 50 ? 'Ally' : trust < 0 ? 'Hostile' : 'Neutral';

  return (
    <div className="flex items-center gap-2">
      <span className="text-base">{npc.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between text-[9px] mb-0.5">
          <span className="text-white/40 truncate">{npc.name}</span>
          <span className="tabular-nums" style={{ color }}>{trust > 0 ? '+' : ''}{trust} · {label}</span>
        </div>
        <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}88, ${color})` }} />
        </div>
      </div>
    </div>
  );
}