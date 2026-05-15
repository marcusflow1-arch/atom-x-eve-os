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
        className="text-[12px] font-bold tracking-wider whitespace-nowrap"
        style={{
          color: '#cffafe',
          textShadow: '0 1px 3px rgba(0,0,0,0.95), 0 0 8px rgba(34,211,238,0.6)',
        }}
      >
        {name}
      </div>
    </div>
  );
}