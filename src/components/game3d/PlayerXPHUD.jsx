import React from 'react';

/**
 * Player level + XP bar HUD (liquid-glass style).
 * Shown in the top-left, alongside Score / Enemies.
 */
export default function PlayerXPHUD({ level, xp, xpForNext }) {
  const pct = xpForNext > 0 ? Math.max(0, Math.min(1, xp / xpForNext)) : 0;

  return (
    <div
      className="px-4 py-2 rounded-lg border"
      style={{
        background: 'rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(14px) saturate(180%)',
        WebkitBackdropFilter: 'blur(14px) saturate(180%)',
        borderColor: 'rgba(168, 247, 255, 0.35)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
        minWidth: 140,
      }}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-cyan-200/70 font-bold tracking-[0.2em] uppercase">Level</span>
        <span className="text-xl font-bold text-cyan-200">{level}</span>
      </div>
      <div
        className="relative rounded-full overflow-hidden"
        style={{
          height: 6,
          background: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.4)',
        }}
      >
        <div
          className="absolute inset-y-0 left-0 transition-all duration-300"
          style={{
            width: `${pct * 100}%`,
            background: 'linear-gradient(180deg, rgba(140,230,255,0.95) 0%, rgba(60,170,230,0.9) 100%)',
            boxShadow: '0 0 8px rgba(120,220,255,0.6), inset 0 1px 0 rgba(255,255,255,0.4)',
          }}
        />
      </div>
      <div className="text-[10px] text-white/60 mt-1 text-right font-mono">
        {xp} / {xpForNext} XP
      </div>
    </div>
  );
}