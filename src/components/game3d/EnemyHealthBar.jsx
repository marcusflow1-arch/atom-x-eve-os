import React from 'react';

/**
 * Liquid-glass translucent HP bar that floats above an enemy's head.
 * Positioned in screen-space via parent-supplied (x, y) pixel coordinates.
 * Shows the enemy's level centered above the bar.
 */
export default function EnemyHealthBar({ x, y, hp, maxHp, level, name, visible }) {
  if (!visible) return null;
  const pct = Math.max(0, Math.min(1, hp / maxHp));
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
      {/* Level pill */}
      <div className="flex justify-center mb-1">
        <div
          className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider text-white"
          style={{
            background: 'rgba(255, 255, 255, 0.12)',
            backdropFilter: 'blur(10px) saturate(180%)',
            WebkitBackdropFilter: 'blur(10px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.3)',
            textShadow: '0 1px 2px rgba(0,0,0,0.8)',
          }}
        >
          LV {level}
        </div>
      </div>

      {/* Enemy name — sits between the level pill and HP bar */}
      {name && (
        <div className="flex justify-center mb-1">
          <div
            className="px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider text-white/95 whitespace-nowrap"
            style={{
              background: 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,80,80,0.35)',
              textShadow: '0 1px 2px rgba(0,0,0,0.9)',
            }}
          >
            {name}
          </div>
        </div>
      )}

      {/* Liquid-glass HP bar */}
      <div
        className="relative rounded-full overflow-hidden"
        style={{
          width: barWidth,
          height: 10,
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(12px) saturate(180%)',
          WebkitBackdropFilter: 'blur(12px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -1px 2px rgba(0,0,0,0.25)',
        }}
      >
        {/* HP fill — translucent red with gloss */}
        <div
          className="absolute inset-y-0 left-0 transition-all duration-200"
          style={{
            width: `${pct * 100}%`,
            background: 'linear-gradient(180deg, rgba(255,90,90,0.95) 0%, rgba(220,40,40,0.85) 50%, rgba(160,20,20,0.9) 100%)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), 0 0 10px rgba(255,60,60,0.5)',
          }}
        />
        {/* Glossy highlight */}
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