import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { subscribePlayerHUD } from '../playerHUDStore';
import HUDPortrait3D from './HUDPortrait3D';
import ActiveBuffsStrip from './ActiveBuffsStrip';
import { base44 } from '@/api/base44Client';

/**
 * Bottom-center HUD: live 3D character portrait + HP / Mana / XP bars.
 * No background panel — bars float over the world cleanly.
 */
export default function HUDVitals() {
  const [hud, setHud] = useState({
    level: 1, xp: 0, xpForNext: 5,
    hp: 100, maxHP: 100, unspentPoints: 0,
    derived: { chi: 0 },
  });
  useEffect(() => subscribePlayerHUD(setHud), []);

  // Fetch current player display name to show above the portrait box
  const [playerName, setPlayerName] = useState('');
  useEffect(() => {
    base44.auth.me()
      .then((u) => { if (u) setPlayerName(u.username || u.full_name || u.email?.split('@')[0] || 'Player'); })
      .catch(() => setPlayerName('Player'));
  }, []);

  const hp = hud.hp ?? 0;
  const maxHp = hud.maxHP ?? 1;
  const mana = hud.derived?.chi ?? 0;
  const maxMana = hud.derived?.chi || 1;

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
      <div className="flex items-end gap-3">
        {/* Live 3D portrait + player name */}
        <div className="relative flex flex-col items-center gap-1">
          {playerName && (
            <div
              className="text-[11px] font-bold tracking-wider whitespace-nowrap"
              style={{
                color: '#cffafe',
                textShadow: '0 1px 3px rgba(0,0,0,0.95), 0 0 8px rgba(34,211,238,0.6)',
              }}
            >
              {playerName}
            </div>
          )}
          <div className="relative">
          <HUDPortrait3D size={86} />
          {/* Level badge */}
          <div
            className="absolute -bottom-1 -left-1 w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px] font-black"
            style={{
              background: 'radial-gradient(circle, #c0392b 0%, #6b1a14 100%)',
              border: '1.5px solid rgba(255,200,100,0.85)',
              boxShadow: '0 2px 6px rgba(0,0,0,0.6)',
            }}
          >
            {hud.level}
          </div>
          {hud.unspentPoints > 0 && (
            <div
              className="absolute -top-2 -right-2 min-w-[22px] h-5 px-1.5 rounded-full flex items-center justify-center text-[10px] font-black animate-pulse"
              style={{
                background: 'linear-gradient(180deg, #fff7b0 0%, #ffd24a 50%, #c98a00 100%)',
                border: '1.5px solid rgba(120,80,0,0.8)',
                color: '#3a2400',
                boxShadow: '0 0 10px rgba(255,210,70,0.8)',
              }}
              title="Press C to spend stat points"
            >
              +{hud.unspentPoints}
            </div>
          )}
          </div>
        </div>

        {/* Bars stack */}
        <div className="flex flex-col gap-1 w-[380px]">
          {/* Active self-cast buff icons — float above the HP bar */}
          <ActiveBuffsStrip />
          <Bar value={hp} max={maxHp} color="#4caf50" label="HP" />
          <Bar value={mana} max={maxMana} color="#3a9ee6" label="MP" />
          <XPBar level={hud.level} xp={hud.xp} xpForNext={hud.xpForNext} />
        </div>
      </div>
    </div>
  );
}

function Bar({ value, max, color, label }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div
      className="relative w-full h-3.5 rounded-sm overflow-hidden"
      style={{
        background: 'rgba(0,0,0,0.55)',
        border: '1px solid rgba(180,140,80,0.4)',
        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)',
      }}
    >
      <motion.div
        className="absolute inset-y-0 left-0"
        style={{
          background: `linear-gradient(180deg, ${color} 0%, ${color}cc 100%)`,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.3), 0 0 6px ${color}80`,
        }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.3 }}
      />
      <div className="absolute inset-0 flex items-center justify-between px-2 text-[10px] font-bold tabular-nums text-white drop-shadow-md">
        <span className="opacity-80">{label}</span>
        <span>{Math.round(value)}/{Math.round(max)}</span>
      </div>
    </div>
  );
}

function XPBar({ level, xp, xpForNext }) {
  const pct = xpForNext > 0 ? Math.max(0, Math.min(100, (xp / xpForNext) * 100)) : 0;
  return (
    <div
      className="relative w-full h-2.5 rounded-sm overflow-hidden"
      style={{
        background: 'rgba(40,28,0,0.7)',
        border: '1px solid rgba(180,140,80,0.5)',
        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.6)',
      }}
    >
      <motion.div
        className="absolute inset-y-0 left-0"
        style={{
          background: 'linear-gradient(180deg, #6ec1ff 0%, #4a9ee6 50%, #2a6fb0 100%)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), 0 0 8px rgba(80,180,255,0.6)',
        }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.3 }}
      />
      <div className="absolute inset-0 flex items-center justify-between px-2 text-[9px] font-bold tabular-nums text-white/95 drop-shadow-md">
        <span>LVL {level}</span>
        <span>{xp}/{xpForNext} XP</span>
      </div>
    </div>
  );
}