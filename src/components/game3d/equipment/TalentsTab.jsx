import React from 'react';
import { TALENT_TREES, setSelected } from './equipmentStore';

// Simple talent tree placeholder — 3 trees, hex grid of nodes.
// Info & names blank by design.
export default function TalentsTab({ state }) {
  const activeTreeId = state.selectedTalentTree;
  return (
    <>
      {/* Tree picker */}
      <div className="absolute left-6 top-24 w-[200px] pointer-events-auto space-y-1.5">
        {TALENT_TREES.map((t) => {
          const active = activeTreeId === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setSelected('selectedTalentTree', t.id)}
              className={`w-full text-left px-3 py-2.5 rounded-sm text-sm transition-all border ${
                active
                  ? 'bg-amber-900/35 border-amber-600/40 text-amber-200'
                  : 'bg-white/[0.04] border-white/10 text-white/70 hover:bg-white/[0.08]'
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Node grid */}
      <div className="absolute left-[240px] right-[360px] top-24 bottom-20 pointer-events-auto">
        <div className="text-white/50 text-[11px] tracking-[0.2em] uppercase mb-3">
          Talent Tree
        </div>
        <div className="grid grid-cols-6 gap-3">
          {Array.from({ length: 30 }).map((_, i) => {
            const allocated = (state.talents[activeTreeId] || []).includes(`n_${i}`);
            return (
              <div
                key={i}
                className={`aspect-square rounded-md border transition-all cursor-pointer flex items-center justify-center ${
                  allocated
                    ? 'bg-amber-500/25 border-amber-400/60'
                    : 'bg-white/[0.04] border-white/10 hover:bg-white/[0.08]'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${allocated ? 'bg-amber-300' : 'bg-white/25'}`} />
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}