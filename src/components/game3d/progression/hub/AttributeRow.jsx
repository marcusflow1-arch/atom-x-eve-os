import React, { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { WEAPONS, getWeaponName } from '../weaponSynergyData';

// One row of the Attributes panel: name, +/- buttons, value, weapon synergy strip.
// Hovering the (?) reveals the S/A/B/C/E tier list popover.
export default function AttributeRow({ label, value, synergy, canSpend, onAlloc, onRefund }) {
  const [hover, setHover] = useState(false);

  // Group synergy entries by tier for the tooltip.
  const tiers = synergy.reduce((acc, s) => {
    (acc[s.tier] = acc[s.tier] || []).push(s.weaponId);
    return acc;
  }, {});

  return (
    <div className="flex items-center gap-4 py-3 border-b border-white/5">
      {/* -/+ controls */}
      <button
        onClick={onRefund}
        className="w-8 h-8 rounded-sm bg-white/[0.04] border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/[0.08] transition"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>
      <div className="w-12 text-center text-2xl font-semibold tracking-tight text-white tabular-nums">
        {value}
      </div>
      <button
        onClick={onAlloc}
        disabled={!canSpend}
        className="w-8 h-8 rounded-sm bg-white/[0.04] border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>

      {/* Label */}
      <div className="w-44 ml-2">
        <div className="text-[12px] tracking-[0.25em] font-semibold uppercase text-white/85">
          {label}
        </div>
      </div>

      {/* Weapon synergy strip with hover tooltip */}
      <div
        className="flex-1 relative flex items-center gap-2 min-h-[28px]"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <div className="flex items-center gap-1.5 flex-wrap">
          {synergy.slice(0, 8).map((s) => {
            const w = WEAPONS.find((x) => x.id === s.weaponId);
            return (
              <span
                key={s.weaponId}
                className="w-6 h-6 rounded-sm flex items-center justify-center text-sm grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition"
                title={`${w?.name} — ${s.tier} Tier`}
              >
                {w?.icon}
              </span>
            );
          })}
        </div>
        <span className="ml-1 text-amber-400/70 text-xs">⓵</span>

        {/* Hover tooltip — tier breakdown */}
        {hover && (
          <div
            className="absolute right-0 top-full mt-2 z-20 w-56 p-3 rounded-lg text-xs space-y-2"
            style={{
              background: 'rgba(8,12,18,0.95)',
              border: '1px solid rgba(255,216,107,0.25)',
              boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
            }}
          >
            {['S', 'A', 'B', 'C', 'D', 'E'].map((tier) =>
              tiers[tier] ? (
                <div key={tier}>
                  <div className="text-amber-300 font-semibold tracking-wider">{tier} Tier:</div>
                  <div className="text-white/70">
                    {tiers[tier].map(getWeaponName).join(', ')}
                  </div>
                </div>
              ) : null
            )}
          </div>
        )}
      </div>
    </div>
  );
}