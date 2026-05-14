import React from 'react';
import { ChevronRight } from 'lucide-react';
import { ABILITY_GROUPS } from './equipmentStore';

// Left rail: Martial Arts list + Inner Way + Mystic Skills grids
// Right rail: Current Build summary card
// Information text left blank by design.
export default function AbilitiesTab({ state }) {
  return (
    <>
      {/* LEFT COLUMN */}
      <div className="absolute left-6 top-24 bottom-20 w-[340px] flex flex-col gap-5 pointer-events-auto">
        {ABILITY_GROUPS.map((g) => (
          <div key={g.id}>
            <div className="text-white/50 text-[11px] tracking-[0.2em] uppercase mb-2">
              {g.label}
            </div>

            {g.id === 'martial_arts' ? (
              <div className="space-y-2">
                {Array.from({ length: g.slots }).map((_, i) => (
                  <button
                    key={i}
                    className="w-full flex items-center gap-3 p-3 rounded-md transition-all hover:bg-white/[0.06] border border-transparent hover:border-white/10 text-left"
                    style={{ background: 'rgba(20,22,28,0.55)' }}
                  >
                    <div className="w-12 h-12 rounded-sm bg-white/[0.06] border border-white/10 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm font-medium">&nbsp;</div>
                      <div className="text-white/40 text-xs mt-0.5">Lv. —/—</div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex gap-2">
                {Array.from({ length: g.slots }).map((_, i) => (
                  <div
                    key={i}
                    className="w-12 h-12 rounded-sm border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] transition-all cursor-pointer relative"
                  >
                    {/* small × marker like the screenshot for empty slots */}
                    {state.abilities[g.id]?.[i] == null && (
                      <span className="absolute inset-0 flex items-center justify-center text-white/30 text-xs">×</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* RIGHT COLUMN — Current Build */}
      <div className="absolute right-6 top-24 w-[200px] pointer-events-auto">
        <div className="text-white/50 text-[11px] tracking-[0.2em] uppercase mb-2 text-right">
          Current Build
        </div>
        <div className="flex items-center justify-end gap-2 mb-4">
          <div className="w-5 h-5 rounded-sm bg-white/10 border border-white/15" />
          <div className="text-white text-2xl font-light">—</div>
        </div>
        <button className="w-full flex items-center justify-between px-3 py-2 rounded-sm bg-amber-700/40 hover:bg-amber-700/55 border border-amber-600/40 text-amber-100 text-xs tracking-wider transition-all mb-2">
          <span>Details</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
        <button className="w-full flex items-center justify-between px-3 py-2 rounded-sm bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-white/80 text-xs tracking-wider transition-all">
          <span>Improvement Guide</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </>
  );
}