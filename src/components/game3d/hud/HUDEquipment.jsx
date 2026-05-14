import React, { useState } from 'react';
import { Sword, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Bottom-right HUD: "EQUIPMENT" label with weapon switcher (◄ weapon ►)
 * plus two paired skill slots above it — inspired by the reference image.
 */
const WEAPONS = ['Dual Blades', 'Bow', 'Spear', 'Fan'];

export default function HUDEquipment() {
  const [idx, setIdx] = useState(0);
  const cycle = (dir) => setIdx((i) => (i + dir + WEAPONS.length) % WEAPONS.length);

  return (
    <div className="absolute bottom-6 right-6 z-20 pointer-events-auto flex flex-col items-end gap-2">
      <div className="text-[10px] font-bold tracking-[0.25em] uppercase text-amber-200/80">
        Equipment
      </div>

      {/* Two parallel skill slots */}
      <div className="flex gap-2">
        <PairSlot keyLabel="1" />
        <PairSlot keyLabel="2" />
      </div>

      {/* Weapon switcher */}
      <div
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-sm"
        style={{
          background: 'linear-gradient(180deg, rgba(15,20,28,0.85), rgba(10,14,20,0.85))',
          border: '1px solid rgba(180,140,80,0.5)',
          boxShadow: '0 3px 10px rgba(0,0,0,0.55)',
        }}
      >
        <button
          onClick={() => cycle(-1)}
          className="w-6 h-6 rounded-sm bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 flex items-center justify-center"
        >
          <ChevronLeft className="w-3.5 h-3.5 text-white/80" />
        </button>

        <div className="flex items-center gap-2 min-w-[120px] justify-center">
          <Sword className="w-4 h-4 text-amber-300" />
          <span className="text-white text-xs font-medium tracking-wider">{WEAPONS[idx]}</span>
        </div>

        <button
          onClick={() => cycle(1)}
          className="w-6 h-6 rounded-sm bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 flex items-center justify-center"
        >
          <ChevronRight className="w-3.5 h-3.5 text-white/80" />
        </button>
      </div>
    </div>
  );
}

function PairSlot({ keyLabel }) {
  return (
    <div
      className="relative w-[48px] h-[48px] rounded-sm"
      style={{
        background: 'linear-gradient(135deg, rgba(40,50,60,0.75), rgba(15,20,28,0.85))',
        border: '1.5px solid rgba(180,140,80,0.5)',
        boxShadow: '0 3px 8px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08)',
      }}
    >
      <div className="absolute inset-1 rounded-[2px] bg-black/30" />
      <div
        className="absolute bottom-0 right-0 px-1 py-0.5 text-[9px] font-bold text-white"
        style={{ background: 'rgba(0,0,0,0.75)', borderTopLeftRadius: 3 }}
      >
        {keyLabel}
      </div>
    </div>
  );
}