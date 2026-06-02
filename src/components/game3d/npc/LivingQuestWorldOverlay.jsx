// LivingQuestWorldOverlay.jsx — Floating "Living Quest" head label + [E] prompt
// for the oversized in-world Living Quest NPC. Rendered over GameWorld3D.
import React from 'react';

export default function LivingQuestWorldOverlay({ labelPos, nearby, suppress }) {
  return (
    <>
      {labelPos && (
        <div className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2 px-2.5 py-1 rounded-full flex items-center gap-1 whitespace-nowrap"
          style={{ left: labelPos.x, top: labelPos.y, background: 'rgba(8,12,20,0.92)', border: '1px solid rgba(168,85,247,0.6)', boxShadow: '0 0 16px rgba(168,85,247,0.4)' }}>
          <span className="text-[10px]">✨</span>
          <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-purple-300">Living Quest</span>
        </div>
      )}
      {nearby && !suppress && (
        <div className="absolute left-1/2 bottom-32 -translate-x-1/2 px-5 py-2.5 rounded-full pointer-events-none"
          style={{ background: 'rgba(15,20,30,0.7)', backdropFilter: 'blur(14px) saturate(160%)', WebkitBackdropFilter: 'blur(14px) saturate(160%)', border: '1px solid rgba(168,85,247,0.55)', boxShadow: '0 4px 18px rgba(168,85,247,0.25)' }}>
          <div className="flex items-center gap-2 text-sm text-white">
            <span className="px-2 py-0.5 rounded bg-purple-500/25 border border-purple-400/40 font-mono text-xs text-purple-200">E</span>
            <span>Begin the <span className="text-purple-300 font-semibold">Living Quest</span></span>
          </div>
        </div>
      )}
    </>
  );
}