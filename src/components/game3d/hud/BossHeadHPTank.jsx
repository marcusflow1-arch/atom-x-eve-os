import React from 'react';

// BossHeadHPTank — a compact segmented "HP tank" bar rendered at a screen
// position projected above the world boss's head. Mirrors the top-center
// RogueBossHPTank styling (segmented tanks + ×N badge) but follows the boss
// in screen space so the player can read the boss's health while locked on.
export default function BossHeadHPTank({ x, y, name, level, hp, maxHp, hpTanks, hpTankSize }) {
  if (x == null || y == null) return null;
  const tankSize = hpTankSize || maxHp;
  const totalTanks = hpTanks || 1;
  const remainingTanks = tankSize > 0 ? Math.min(totalTanks, Math.max(0, Math.ceil(hp / tankSize))) : 0;
  const currentTankHp = hp > 0 ? ((hp - 1) % tankSize) + 1 : 0;
  const pct = tankSize > 0 ? Math.max(0, Math.min(1, currentTankHp / tankSize)) : 0;

  return (
    <div
      className="absolute z-30 pointer-events-none select-none"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform: 'translate(-50%, -100%)',
        width: 'min(240px, 32vw)',
      }}
    >
      <div className="text-center mb-1">
        <div className="text-[8px] font-bold tracking-[0.3em] uppercase text-red-200/80 drop-shadow">Lv {level}</div>
        <div className="text-[11px] font-black tracking-[0.12em] uppercase text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] truncate">{name}</div>
      </div>
      <div
        className="relative rounded-lg border px-2 py-1.5"
        style={{
          background: 'rgba(255,255,255,0.08)',
          backdropFilter: 'blur(10px) saturate(160%)',
          WebkitBackdropFilter: 'blur(10px) saturate(160%)',
          borderColor: 'rgba(255,100,100,0.38)',
          boxShadow: '0 6px 18px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.18)',
        }}
      >
        <div className="absolute -right-2 -top-2 rounded-full border border-red-200/40 bg-red-950/80 px-1.5 py-0.5 text-[10px] font-black tracking-wider text-red-100 shadow-[0_0_12px_rgba(255,60,80,0.45)]">
          ×{remainingTanks}
        </div>
        <div
          className="relative h-3 rounded-full overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.18)',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.45)',
          }}
        >
          <div
            className="absolute inset-y-0 left-0 transition-all duration-300"
            style={{
              width: `${pct * 100}%`,
              background: 'linear-gradient(180deg, rgba(255,145,145,0.98) 0%, rgba(235,45,65,0.92) 55%, rgba(140,18,30,0.94) 100%)',
              boxShadow: '0 0 12px rgba(255,70,85,0.65), inset 0 1px 0 rgba(255,255,255,0.45)',
            }}
          />
          <div className="absolute inset-x-0 top-0 h-1/2 rounded-t-full bg-white/25" />
        </div>
      </div>
    </div>
  );
}