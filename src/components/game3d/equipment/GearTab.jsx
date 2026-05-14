import React from 'react';
import { GEAR_CATEGORIES, setSelected } from './equipmentStore';

// Left: equipped slots grid (top) + selected-category inventory grid (bottom)
// Center: detail panel for the selected equipped item — info text blank
export default function GearTab({ state }) {
  const selectedCat = GEAR_CATEGORIES.find((c) => c.id === state.selectedGearCategory)
    || GEAR_CATEGORIES[0];

  return (
    <>
      {/* LEFT — equipped slots grid */}
      <div className="absolute left-6 top-24 bottom-20 w-[380px] pointer-events-auto">
        <div className="grid grid-cols-5 gap-2 mb-6">
          {GEAR_CATEGORIES.flatMap((cat) =>
            Array.from({ length: cat.slots }).map((_, i) => {
              const isSelected = cat.id === selectedCat.id && i === 0;
              return (
                <button
                  key={`${cat.id}-${i}`}
                  onClick={() => setSelected('selectedGearCategory', cat.id)}
                  className={`aspect-square rounded-sm border transition-all relative ${
                    isSelected
                      ? 'border-white/80 bg-white/[0.08]'
                      : 'border-white/10 bg-white/[0.04] hover:bg-white/[0.07]'
                  }`}
                  title={cat.label}
                >
                  <span className="absolute bottom-1 left-1.5 w-1 h-1 rounded-full bg-white/40" />
                </button>
              );
            })
          )}
        </div>

        {/* Inventory grid for selected category */}
        <div className="text-center text-white/40 text-[11px] tracking-[0.25em] uppercase mb-2">
          ─ {selectedCat.label} ─
        </div>
        <div className="grid grid-cols-7 gap-1.5 overflow-y-auto max-h-[360px] pr-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-sm border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/25 transition-all cursor-pointer relative"
            >
              <span className="absolute bottom-0.5 left-1 w-1 h-1 rounded-full bg-white/30" />
            </div>
          ))}
        </div>
      </div>

      {/* CENTER — detail panel for selected gear (left of 3D preview) */}
      <div
        className="absolute top-24 bottom-32 pointer-events-auto"
        style={{ left: 420, width: 280 }}
      >
        <div className="h-full flex flex-col">
          <div className="inline-flex items-center self-start gap-2 px-3 py-1 mb-3 rounded-sm border-l-2 border-amber-500/80 bg-amber-900/30">
            <span className="text-amber-200 text-[11px] tracking-[0.2em] uppercase font-medium">Equipped</span>
          </div>

          <div className="text-white text-xl font-medium mb-1">&nbsp;</div>
          <div className="text-white/40 text-xs mb-5">{selectedCat.label} — —</div>

          <div className="text-white/60 text-[11px] tracking-[0.2em] uppercase mb-1">Mastery</div>
          <div className="text-white text-4xl font-light mb-5">—</div>

          {/* Stat rows */}
          {[
            { l: 'Gear Tier', r: 'Tier —' },
            { l: 'Physical Attack', r: '— ~ —' },
            { l: 'Min Stonesplit Attack', r: '—' },
          ].map((row, i) => (
            <div key={i} className="flex justify-between py-1.5 text-sm">
              <span className="text-white/55">• {row.l}</span>
              <span className="text-white/80">{row.r}</span>
            </div>
          ))}

          <div className="mt-4 mb-2 text-white/80 text-sm font-medium flex items-center gap-2">
            Set —/—
            <span className="inline-block w-2 h-2 rounded-full bg-cyan-300/60" />
          </div>
          <div className="text-white/45 text-xs space-y-2 leading-relaxed">
            <div>• 2 Pieces<br /><span className="ml-3 text-white/55">—</span></div>
            <div>• 4 Pieces<br /><span className="ml-3 text-white/55">—</span></div>
          </div>

          <div className="mt-auto pt-4 space-y-1 text-sm text-white/70 border-t border-white/10">
            <div className="flex justify-between"><span className="text-white/50">Durability</span><span>—/—</span></div>
            <div className="flex justify-between"><span className="text-white/50">Gear Level</span><span>Level —</span></div>
            <div className="flex justify-between"><span className="text-white/50">Constitution required</span><span>—</span></div>
          </div>
        </div>
      </div>

      {/* Bottom-right — Tune prompt */}
      <div className="absolute right-6 bottom-20 flex items-stretch gap-3 pointer-events-auto">
        <div
          className="px-5 py-2.5 rounded-sm border border-white/15 flex items-center"
          style={{ background: 'rgba(40,42,48,0.85)' }}
        >
          <span className="text-white/80 text-sm">Tune the selected Gear.</span>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2.5 rounded-sm transition-all"
          style={{ background: 'rgba(180,120,40,0.85)' }}
        >
          <span className="text-amber-100 text-[11px] tracking-[0.2em] uppercase font-bold border border-amber-200/30 px-1.5 py-0.5">Space</span>
          <span className="text-white text-sm font-medium">Tune</span>
        </button>
      </div>
    </>
  );
}