import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { subscribePlayerHUD } from '../playerHUDStore';
import { subscribeKillCount } from '../killCountStore';
import ActiveBuffsStrip from './ActiveBuffsStrip';
import { base44 } from '@/api/base44Client';
import { Skull, User } from 'lucide-react';
import { subscribeFusionState } from '../fusionStore';

/**
 * Bottom-center HUD vitals (screenshot-style):
 *   ┌─ HP gauge (left, horizontal sweep) ─┬─ C key circle (center) ─┬─ Fusion gauge (right) ─┐
 *   └────────────────── invisible EXP bar (only the fill shows) ───────────────────────┘
 *
 * No background panel — bars / gauges float over the world.
 */
export default function HUDVitals() {
  const [hud, setHud] = useState({
    level: 1, xp: 0, xpForNext: 5,
    hp: 100, maxHP: 100, unspentPoints: 0,
  });
  useEffect(() => subscribePlayerHUD(setHud), []);

  const [killCount, setKillCount] = useState(0);
  useEffect(() => subscribeKillCount(setKillCount), []);

  const [fusionState, setFusionState] = useState({ isFused: false, points: 0, maxPoints: 100 });
  useEffect(() => subscribeFusionState(setFusionState), []);

  const [playerName, setPlayerName] = useState('');
  useEffect(() => {
    base44.auth.me()
      .then((u) => { if (u) setPlayerName(u.username || u.full_name || u.email?.split('@')[0] || 'Player'); })
      .catch(() => setPlayerName('Player'));
  }, []);

  const hp = hud.hp ?? 0;
  const maxHp = hud.maxHP ?? 1;
  const xpPct = hud.xpForNext > 0 ? Math.max(0, Math.min(100, (hud.xp / hud.xpForNext) * 100)) : 0;

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex flex-col items-center gap-2 w-[640px]">
      {/* Active self-cast buff icons — floats above the vitals row */}
      <ActiveBuffsStrip />

      {/* Vitals row: HP gauge | C-key circle | Fusion gauge */}
      <div className="relative flex items-center justify-center w-full">
        {/* HP gauge — left */}
        <HorizontalGauge
          value={hp}
          max={maxHp}
          color="#e23b3b"
          label="HP"
          align="right"
        />

        {/* Center C-key circle with character icon */}
        <CenterCharacterButton
          unspentPoints={hud.unspentPoints}
          isFused={fusionState.isFused}
        />

        {/* Fusion gauge — right */}
        <HorizontalGauge
          value={fusionState.points}
          max={fusionState.maxPoints}
          color={fusionState.isFused ? '#c084fc' : '#a78bfa'}
          label={fusionState.isFused ? 'FUSION ⚡' : 'FUSION'}
          align="left"
        />
      </div>

      {/* Bottom row: level + EXP value + invisible EXP bar with only fill visible */}
      <div className="flex flex-col items-center w-full mt-1">
        {/* Kill pill + player name */}
        {(killCount > 0 || playerName) && (
          <div className="flex items-center gap-3 mb-1">
            {killCount > 0 && (
              <div
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider whitespace-nowrap"
                style={{
                  background: 'rgba(20, 8, 8, 0.55)',
                  border: '1px solid rgba(255, 90, 90, 0.4)',
                  color: '#ffb4b4',
                  textShadow: '0 1px 2px rgba(0,0,0,0.9)',
                }}
                title="Total rogue AI kills"
              >
                <Skull className="w-2.5 h-2.5" />
                <span className="tabular-nums">{killCount} Kills</span>
              </div>
            )}
            {playerName && (
              <div
                className="text-[11px] font-bold tracking-wider whitespace-nowrap"
                style={{
                  color: '#cffafe',
                  textShadow: '0 1px 3px rgba(0,0,0,0.95), 0 0 8px rgba(34,211,238,0.5)',
                }}
              >
                {playerName}
              </div>
            )}
          </div>
        )}

        {/* "Lv. X 999 / 1850 EXP" line */}
        <div
          className="flex items-baseline gap-2 text-[12px] font-bold tracking-wider tabular-nums"
          style={{
            color: 'rgba(255, 240, 200, 0.92)',
            textShadow: '0 1px 3px rgba(0,0,0,0.95)',
          }}
        >
          <span style={{ color: 'rgba(255, 220, 150, 0.95)' }}>Lv. {hud.level}</span>
          <span className="opacity-90">{hud.xp}</span>
          <span className="opacity-60">/ {hud.xpForNext}</span>
          <span className="opacity-80 text-[11px]">EXP</span>
        </div>

        {/* Invisible-container EXP bar — only the fill is visible */}
        <div className="relative w-[460px] h-[3px] mt-1">
          <motion.div
            className="absolute left-0 top-0 bottom-0 rounded-full"
            style={{
              background:
                'linear-gradient(90deg, rgba(255,210,120,0.0) 0%, rgba(255,210,120,0.9) 30%, rgba(255,240,180,1) 60%, rgba(255,255,220,1) 100%)',
              boxShadow:
                '0 0 6px rgba(255, 220, 140, 0.85), 0 0 14px rgba(255, 210, 120, 0.55)',
            }}
            animate={{ width: `${xpPct}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Horizontal sweeping gauge (HP / Fusion). Slim, slanted, glowing — sits to
 * the side of the central C-key circle. align="right" → fill drains toward
 * the center (right edge); align="left" → fill drains toward the center (left edge).
 */
function HorizontalGauge({ value, max, color, label, align }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const isRightAligned = align === 'right'; // HP: bar grows leftward from center
  return (
    <div
      className="relative h-[14px] mx-2"
      style={{ width: 220 }}
    >
      {/* Track */}
      <div
        className="absolute inset-0 rounded-full overflow-hidden"
        style={{
          background: 'rgba(0,0,0,0.55)',
          border: '1px solid rgba(180,140,80,0.35)',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.6)',
        }}
      >
        <motion.div
          className="absolute top-0 bottom-0"
          style={{
            [isRightAligned ? 'right' : 'left']: 0,
            background: `linear-gradient(180deg, ${color} 0%, ${color}cc 100%)`,
            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.3), 0 0 8px ${color}99`,
          }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Inline label + value */}
      <div
        className="absolute inset-0 flex items-center px-2 text-[9px] font-bold tabular-nums text-white pointer-events-none"
        style={{
          justifyContent: isRightAligned ? 'space-between' : 'space-between',
          textShadow: '0 1px 2px rgba(0,0,0,0.95)',
          letterSpacing: '0.08em',
        }}
      >
        {isRightAligned ? (
          <>
            <span className="opacity-80">{label}</span>
            <span>{Math.round(value)} / {Math.round(max)}</span>
          </>
        ) : (
          <>
            <span>{Math.round(value)} / {Math.round(max)}</span>
            <span className="opacity-80">{label}</span>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Center C-key activation button — a circular ringed icon with a character
 * silhouette in the middle and a small "C" key tag at the top. Pulses when the
 * player has unspent stat points.
 */
function CenterCharacterButton({ unspentPoints, isFused }) {
  const hasPoints = unspentPoints > 0;
  return (
    <div className="relative flex items-center justify-center" style={{ width: 64, height: 64 }}>
      {/* Outer ring */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            'radial-gradient(circle at 50% 45%, rgba(40,45,60,0.85) 0%, rgba(10,12,18,0.95) 80%)',
          border: '2px solid rgba(220,200,150,0.7)',
          boxShadow: hasPoints
            ? '0 0 14px rgba(255,210,80,0.85), inset 0 0 12px rgba(255,210,80,0.35)'
            : isFused
              ? '0 0 14px rgba(192,132,252,0.8), inset 0 0 12px rgba(192,132,252,0.3)'
              : '0 2px 8px rgba(0,0,0,0.7), inset 0 0 10px rgba(0,0,0,0.5)',
        }}
      />
      {/* Inner ring */}
      <div
        className="absolute rounded-full"
        style={{
          inset: 5,
          border: '1px solid rgba(220,200,150,0.45)',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)',
        }}
      />
      {/* Character icon */}
      <User
        className="relative z-10"
        style={{
          width: 26,
          height: 26,
          color: hasPoints ? '#ffe08a' : '#e8e0c8',
          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.9))',
        }}
        strokeWidth={2.2}
      />

      {/* "C" key tag at top */}
      <div
        className="absolute -top-1 left-1/2 -translate-x-1/2 px-1.5 py-[1px] rounded-sm text-[9px] font-black tracking-wider pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(35,35,45,0.95) 0%, rgba(15,15,20,0.95) 100%)',
          border: '1px solid rgba(220,200,150,0.65)',
          color: '#fde68a',
          textShadow: '0 1px 1px rgba(0,0,0,0.9)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.7)',
        }}
      >
        C
      </div>

      {/* Unspent points badge (preserved from original) */}
      {hasPoints && (
        <div
          className="absolute -top-2 -right-1 min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center text-[10px] font-black animate-pulse z-20"
          style={{
            background: 'linear-gradient(180deg, #fff7b0 0%, #ffd24a 50%, #c98a00 100%)',
            border: '1.5px solid rgba(120,80,0,0.8)',
            color: '#3a2400',
            boxShadow: '0 0 10px rgba(255,210,70,0.8)',
          }}
          title="Press C to spend stat points"
        >
          +{unspentPoints}
        </div>
      )}
    </div>
  );
}