import React from 'react';
import { PERSONAL_SERVICES } from '../../twelvesky/modernizationData';

export default function SpiritServicesSubTab() {
  return (
    <div className="h-full overflow-y-auto px-8 py-7">
      <div className="max-w-3xl">
        <div className="text-[10px] tracking-[0.35em] uppercase text-violet-200/70">Field Convenience Layer</div>
        <h2 className="text-2xl text-white font-semibold mt-1">Bound Spirit Services</h2>
        <p className="text-xs text-white/55 mt-2 leading-relaxed">
          The old town NPC functions still exist in the world for atmosphere, but your bound spirit mirrors routine services into this menu. The design goal is simple: fight, farm, progress, and keep moving.
        </p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 mt-7">
        {PERSONAL_SERVICES.map((service) => (
          <div key={service.id} className="rounded-xl border border-white/10 bg-black/20 p-4 min-h-[150px]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/[0.05] border border-white/10 flex items-center justify-center text-xl">{service.icon}</div>
              <div>
                <div className="text-white font-semibold text-sm">{service.title}</div>
                <div className="text-[9px] tracking-[0.2em] uppercase text-emerald-300/70 mt-0.5">Remote Access</div>
              </div>
            </div>
            <div className="mt-4 text-[10px] text-white/35 uppercase tracking-wider">Classic</div>
            <div className="text-[11px] text-white/55 mt-1">{service.oldFlow}</div>
            <div className="mt-3 text-[10px] text-cyan-200/55 uppercase tracking-wider">Modernized</div>
            <div className="text-[11px] text-white/80 mt-1 leading-relaxed">{service.modernFlow}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-lg border border-amber-300/15 bg-amber-300/[0.04] px-4 py-3 text-[11px] text-white/55">
        NPCs become optional world flavor and tutorial anchors instead of mandatory maintenance stops. High-stakes content can still require physical locations when travel itself is part of the challenge.
      </div>
    </div>
  );
}
