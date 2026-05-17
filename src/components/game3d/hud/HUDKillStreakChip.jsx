// ─── HUDKillStreakChip ────────────────────────────────────────────────────
// Small top-left HUD chip placed directly above the minimap. Shows the
// player's current consecutive kill streak and the active XP / point
// multiplier. Resets visually whenever the streak resets (player death).

import React, { useEffect, useState } from 'react';
import { Swords, Flame } from 'lucide-react';
import { subscribeKillStreak } from '../killStreakStore';

export default function HUDKillStreakChip() {
  const [snap, setSnap] = useState({ streak: 0, multiplier: 1, nextMultiplier: 1 });

  useEffect(() => subscribeKillStreak(setSnap), []);

  const { streak, multiplier, nextMultiplier } = snap;
  const active = streak > 0;
  const hot = multiplier >= 2;

  // Color ramps with the multiplier so the player can read intensity at a glance.
  const accent = !active
    ? 'rgba(255,255,255,0.35)'
    : hot
      ? '#fb923c' // orange — high streak
      : '#facc15'; // gold — building streak

  return (
    <div
      className="absolute top-4 left-4 z-20 pointer-events-none flex items-center gap-2 px-3 py-1.5 rounded-sm"
      style={{
        background: 'linear-gradient(180deg, rgba(15,20,28,0.85), rgba(10,14,20,0.85))',
        borderLeft: `2px solid ${accent}`,
        backdropFilter: 'blur(6px)',
        boxShadow: active ? `0 0 12px ${accent}55` : 'none',
        minWidth: 150,
      }}
    >
      {hot ? (
        <Flame className="w-3.5 h-3.5" style={{ color: accent }} />
      ) : (
        <Swords className="w-3.5 h-3.5" style={{ color: accent }} />
      )}

      <div className="flex flex-col leading-tight">
        <span
          className="text-[9px] font-bold tracking-[0.2em] uppercase"
          style={{ color: accent }}
        >
          Kill Multiplier
        </span>
        <div className="flex items-baseline gap-1.5">
          <span
            className="text-base font-light tabular-nums"
            style={{ color: active ? '#fff' : 'rgba(255,255,255,0.55)' }}
          >
            ×{multiplier.toFixed(1)}
          </span>
          <span className="text-[9px] text-white/45 tabular-nums">
            · {streak} kill{streak === 1 ? '' : 's'}
          </span>
        </div>
        <span className="text-[8px] text-white/35 tabular-nums tracking-wider">
          Next: ×{nextMultiplier.toFixed(1)}
        </span>
      </div>
    </div>
  );
}