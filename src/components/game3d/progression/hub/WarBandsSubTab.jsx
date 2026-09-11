import React from 'react';
import { VERIFIED_WAR_BANDS } from '../../twelvesky/modernizationData';

export default function WarBandsSubTab() {
  return (
    <div className="h-full overflow-y-auto px-8 py-7">
      <div className="max-w-3xl">
        <div className="text-[10px] tracking-[0.35em] uppercase text-red-200/70">Structured PvP / PvE Wars</div>
        <h2 className="text-2xl text-white font-semibold mt-1">War Bands</h2>
        <p className="text-xs text-white/55 mt-2 leading-relaxed">
          Match players into narrow progression bands so wars stay competitive. These are the currently verified higher-tier bands; older legacy brackets can be added as selectable rule sets once their exact version is confirmed.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mt-7">
        {VERIFIED_WAR_BANDS.map((band, index) => (
          <div key={band.id} className="rounded-xl border border-red-200/15 bg-red-500/[0.04] p-5">
            <div className="text-[9px] tracking-[0.25em] uppercase text-red-200/50">Division {index + 1}</div>
            <div className="text-lg font-semibold text-white mt-1">{band.label}</div>
            <div className="mt-4 h-px bg-gradient-to-r from-red-300/30 to-transparent" />
            <div className="mt-3 text-[11px] text-white/55">
              Matchmaking, rewards, CP and event rules can be attached to this band without changing the combat scene.
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 text-[10px] text-white/35 leading-relaxed">
        Design note: TwelveSky2 changed war brackets across eras. The game can support multiple presets instead of baking one historical patch into the engine.
      </div>
    </div>
  );
}
