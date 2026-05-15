import React from 'react';

/**
 * Floating HP bar that sits above the companion's head.
 * Same layout as EnemyHealthBar but uses ally (amber/green) tones so the
 * player can instantly tell friend from foe. Shows companion level + HP fill.
 */
export default function CompanionHealthBar({ x, y, hp, maxHp, level, name, visible }) {
  if (!visible) return null;
  const pct = Math.max(0, Math.min(1, hp / Math.max(1, maxHp)));
  const barWidth = 90;

  return (
    <div
      className="pointer-events-none absolute select-none"
      style={{
        left: x,
        top: y,
        transform: 'translate(-50%, -100%)',
        willChange: 'transform',
      }}
    >
      {/* Level pill — amber to match ally/companion theme */}
      <div className="flex justify-center mb-1">
        <div
          className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider"
          style={{
            color: '#fde68a',
            background: 'rgba(251, 191, 36, 0.18)',
            backdropFilter: 'blur(10px) saturate(180%)',
            WebkitBackdropFilter: 'blur(10px) saturate(180%)',
            border: '1px solid rgba(251, 191, 36, 0.5)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.25)',
            textShadow: '0 1px 2px rgba(0,0,0,0.8)',
          }}
        >
          LV {level}
        </div>
      </div>

      {/* Companion name — between level and HP bar */}
      {name && (
        <div className="flex justify-center mb-1">
          <div
            className="px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider text-amber-100 whitespace-nowrap"
            style={{
              background: 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              border: '1px solid rgba(251,191,36,0.4)',
              textShadow: '0 1px 2px rgba(0,0,0,0.9)',
            }}
          >
            {name}
          </div>
        </div>
      )}

      {/* HP bar — green gradient for ally */}
      <div
        className="relative rounded-full overflow-hidden"
        style={{
          width: barWidth,
          height: 10,
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(12px) saturate(180%)',
          WebkitBackdropFilter: 'blur(12px) saturate(180%)',
          border: '1px solid rgba(251, 191, 36, 0.35)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -1px 2px rgba(0,0,0,0.25)',
        }}
      >
        <div
          className="absolute inset-y-0 left-0 transition-all duration-200"
          style={{
            width: `${pct * 100}%`,
            background: 'linear-gradient(180deg, rgba(110,231,130,0.95) 0%, rgba(34,197,94,0.9) 50%, rgba(21,128,61,0.95) 100%)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), 0 0 10px rgba(34,197,94,0.5)',
          }}
        />
        <div
          className="absolute inset-x-0 top-0 h-1/2 rounded-t-full pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 100%)',
          }}
        />
      </div>
    </div>
  );
}