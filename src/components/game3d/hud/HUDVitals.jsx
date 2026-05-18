import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { subscribePlayerHUD } from '../playerHUDStore';
import { subscribeKillCount } from '../killCountStore';
import ActiveBuffsStrip from './ActiveBuffsStrip';
import { base44 } from '@/api/base44Client';
import { Skull } from 'lucide-react';
import { subscribeFusionState } from '../fusionStore';
import HUDVitalsRow from './HUDVitalsRow';
import { subscribeRestedXP, accrueRestedFromOfflineTime } from '../restedXPStore';

/**
 * Bottom-center HUD vitals (screenshot-style):
 *
 *   [ 1 2 3 4 ]  [ HP gauge ]  [ C-key + Weapon ]  [ Fusion gauge ]  [ 5 6 7 8 ]
 *              ────── invisible EXP bar (only the fill shows) ──────
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

  // Rested XP — accrue from offline time once on mount, then subscribe to the
  // live pool so the overlay updates after each gain/consume.
  const [restedPct, setRestedPct] = useState(0);
  useEffect(() => {
    accrueRestedFromOfflineTime();
    return subscribeRestedXP((s) => setRestedPct(s.restedPct || 0));
  }, []);

  const hp = hud.hp ?? 0;
  const maxHp = hud.maxHP ?? 1;
  // Display the XP bar on a normalized 0..100 scale regardless of the
  // underlying xpForNext curve.
  const xpPct = hud.xpForNext > 0 ? Math.max(0, Math.min(100, (hud.xp / hud.xpForNext) * 100)) : 0;
  const xpDisplay = Math.round(xpPct);
  // Rested overlay extends from the current XP fill out to (xpPct + restedPct),
  // clamped to 100. Same warm color family, slightly cooler & softer.
  const restedEnd = Math.max(0, Math.min(100, xpPct + (restedPct || 0)));
  const restedSpan = Math.max(0, restedEnd - xpPct);

  return (
    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex flex-col items-center gap-0">
      {/* Skills | HP | Center | Fusion | Skills */}
      <HUDVitalsRow
        hp={hp}
        maxHp={maxHp}
        fusion={fusionState}
        unspentPoints={hud.unspentPoints || 0}
        killCount={killCount}
        playerName={playerName}
      />

      {/* Bottom row: level + EXP value + invisible EXP bar with only fill visible */}
      <div className="flex flex-col items-center w-full mt-2">

        <div
          className="flex items-baseline gap-2 text-[12px] font-bold tracking-wider tabular-nums"
          style={{
            color: 'rgba(255, 240, 200, 0.92)',
            textShadow: '0 1px 3px rgba(0,0,0,0.95)',
          }}
        >
          <span style={{ color: 'rgba(255, 220, 150, 0.95)' }}>Lv. {hud.level}</span>
          <span className="opacity-90">{xpDisplay}</span>
          <span className="opacity-60">/ 100</span>
          <span className="opacity-80 text-[11px]">EXP</span>
          {restedPct > 0 && (
            <span
              className="ml-2 px-1.5 py-[1px] rounded-sm text-[9px] font-black tracking-wider"
              style={{
                background: 'rgba(120, 200, 255, 0.18)',
                border: '1px solid rgba(160, 220, 255, 0.55)',
                color: '#dff1ff',
                textShadow: '0 1px 2px rgba(0,0,0,0.85)',
                boxShadow: '0 0 6px rgba(120, 200, 255, 0.35)',
              }}
              title={`Rested XP — next ${Math.round(restedPct)}% of XP earns at 2×`}
            >
              REST +{Math.round(restedPct)}%
            </span>
          )}
        </div>

        <div className="relative w-[520px] h-[3px] mt-1">
          {/* Rested XP continuation — light blue section after yellow fill, inside the bar */}
          {restedSpan > 0 && (
            <motion.div
              className="absolute top-0 bottom-0 rounded-full"
              style={{
                left: `${xpPct}%`,
                background:
                  'linear-gradient(90deg, rgba(120, 200, 255, 0.6) 0%, rgba(160, 220, 255, 0.75) 100%)',
                boxShadow:
                  'inset 0 1px 0 rgba(255, 255, 255, 0.4), 0 0 4px rgba(120, 200, 255, 0.6)',
                opacity: 0.9,
              }}
              animate={{ width: `${restedSpan}%` }}
              transition={{ duration: 0.4 }}
            />
          )}
          {/* Main XP fill — yellow/gold foreground */}
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