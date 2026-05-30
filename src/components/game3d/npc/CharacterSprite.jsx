// CharacterSprite.jsx — CSS-based character sprite used for both player and NPC tokens

import React from 'react';
import { motion } from 'framer-motion';

/**
 * A pixelart-style humanoid sprite built entirely from CSS/divs.
 * Used for both the player token and the Stranger NPC to show they share the same model.
 *
 * Props:
 *   color       — primary accent hex (e.g. '#6366f1')
 *   label       — text below character (e.g. 'Player', 'Stranger')
 *   isNPC       — if true, adds a slight hue-shift + "rival" spin idle
 *   size        — 'sm' | 'md' (default 'md')
 *   glow        — boolean, adds outer glow ring
 */
export default function CharacterSprite({ color = '#6366f1', label = '', isNPC = false, size = 'md', glow = false }) {
  const scale = size === 'sm' ? 0.7 : 1;
  const px = (n) => `${n * scale}px`;

  // NPC version slightly shifts hue via filter so they look "same but different"
  const filterStyle = isNPC ? `hue-rotate(20deg) brightness(0.9) saturate(1.3)` : 'none';

  return (
    <div className="flex flex-col items-center gap-1 select-none" style={{ filter: filterStyle }}>
      {/* Character body */}
      <div className="relative" style={{ width: px(28), height: px(42) }}>

        {/* Glow base */}
        {glow && (
          <div className="absolute -inset-2 rounded-full pointer-events-none"
            style={{ background: `radial-gradient(circle, ${color}30 0%, transparent 70%)` }} />
        )}

        {/* Head */}
        <div className="absolute left-1/2 -translate-x-1/2"
          style={{
            top: 0,
            width: px(14),
            height: px(14),
            borderRadius: px(4),
            background: `linear-gradient(135deg, ${color}cc, ${color}66)`,
            border: `${px(1.5)} solid ${color}`,
            boxShadow: `0 0 ${px(4)} ${color}55`,
          }}>
          {/* Eyes */}
          <div className="absolute flex gap-0.5"
            style={{ top: px(4), left: px(2) }}>
            <div style={{ width: px(3), height: px(3), borderRadius: '50%', background: isNPC ? '#fff' : '#fff', opacity: 0.9 }} />
            <div style={{ width: px(3), height: px(3), borderRadius: '50%', background: '#fff', opacity: 0.9 }} />
          </div>
        </div>

        {/* Neck */}
        <div className="absolute left-1/2 -translate-x-1/2"
          style={{ top: px(13), width: px(5), height: px(3), background: `${color}88` }} />

        {/* Torso */}
        <div className="absolute left-1/2 -translate-x-1/2"
          style={{
            top: px(16),
            width: px(18),
            height: px(14),
            borderRadius: `${px(3)} ${px(3)} ${px(2)} ${px(2)}`,
            background: `linear-gradient(180deg, ${color}bb, ${color}55)`,
            border: `${px(1)} solid ${color}60`,
          }}>
          {/* Chest detail */}
          <div style={{
            position: 'absolute', top: px(3), left: px(3), right: px(3), height: px(2),
            background: `${color}cc`, borderRadius: px(1), opacity: 0.6,
          }} />
        </div>

        {/* Left arm */}
        <div className="absolute"
          style={{
            top: px(17),
            left: px(0),
            width: px(5),
            height: px(12),
            borderRadius: px(3),
            background: `${color}99`,
            border: `${px(1)} solid ${color}50`,
          }} />

        {/* Right arm */}
        <div className="absolute"
          style={{
            top: px(17),
            right: px(0),
            width: px(5),
            height: px(12),
            borderRadius: px(3),
            background: `${color}99`,
            border: `${px(1)} solid ${color}50`,
          }} />

        {/* Left leg */}
        <div className="absolute"
          style={{
            bottom: 0,
            left: px(5),
            width: px(7),
            height: px(13),
            borderRadius: `0 0 ${px(3)} ${px(3)}`,
            background: `${color}77`,
            border: `${px(1)} solid ${color}40`,
          }} />

        {/* Right leg */}
        <div className="absolute"
          style={{
            bottom: 0,
            right: px(5),
            width: px(7),
            height: px(13),
            borderRadius: `0 0 ${px(3)} ${px(3)}`,
            background: `${color}77`,
            border: `${px(1)} solid ${color}40`,
          }} />

        {/* NPC "rival" marker — small diamond on chest */}
        {isNPC && (
          <div className="absolute left-1/2 -translate-x-1/2"
            style={{
              top: px(19),
              width: px(5),
              height: px(5),
              background: color,
              transform: 'translate(-50%, 0) rotate(45deg)',
              boxShadow: `0 0 ${px(6)} ${color}`,
              opacity: 0.9,
            }} />
        )}
      </div>

      {/* Label */}
      {label && (
        <div className="text-[8px] tracking-[0.2em] uppercase font-semibold"
          style={{ color: `${color}cc` }}>
          {label}
        </div>
      )}
    </div>
  );
}