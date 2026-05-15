import React from 'react';

/**
 * Floating name tag positioned above the player's head in screen-space.
 * Mirrors the visual language of EnemyHealthBar/CompanionHealthBar but
 * uses cyan/blue tones to reinforce that this is the player character.
 */
export default function PlayerNameTag({ x, y, name, visible }) {
  if (!visible || !name) return null;

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
      <div
        className="px-3 py-1 rounded text-[11px] font-bold tracking-wider whitespace-nowrap"
        style={{
          color: '#cffafe',
          background: 'rgba(8, 20, 32, 0.55)',
          backdropFilter: 'blur(10px) saturate(180%)',
          WebkitBackdropFilter: 'blur(10px) saturate(180%)',
          border: '1px solid rgba(103, 232, 249, 0.5)',
          boxShadow: '0 2px 10px rgba(0,0,0,0.5), 0 0 12px rgba(34,211,238,0.25)',
          textShadow: '0 1px 2px rgba(0,0,0,0.9)',
        }}
      >
        {name}
      </div>
    </div>
  );
}