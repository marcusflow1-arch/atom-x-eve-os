// ─── MasteryArtPanel ─────────────────────────────────────────────────────────
// Right-side panel for the "Mastery Art" tab — shows a visual level ladder
// (1–20), artwork unlock milestones, and the Advanced Class gate at Level 10.
// Pure presentation. Receives masteryEntry, weaponId, weaponType, weaponName.

import React from 'react';
import { Unlock, Lock, RotateCcw, Star, Zap } from 'lucide-react';
import { MASTERY_MAX_LEVEL } from '../weaponSynergyData';
import { MILESTONE_PASSIVES } from './weaponMasteryConfig';

const MASTERY_ART_LEVELS = Array.from({ length: 20 }, (_, i) => i + 1);

// What unlocks at each level milestone
const ART_UNLOCK_MAP = {
  1:  { label: 'Stance Initiate',      desc: 'Basic combat stance unlocked.',             icon: '🌱' },
  3:  { label: 'Flow Form I',           desc: '+5% movement speed during combos.',         icon: '💨' },
  5:  { label: 'Weapon Echo',           desc: 'Attacks leave a trailing afterimage.',      icon: '🌀' },
  7:  { label: 'Combo Extension',       desc: 'Combo window extended by 0.3s.',            icon: '⚔️' },
  10: { label: 'Weapon Efficiency',     desc: 'Advanced Class unlock. Reset to Prestige.', icon: '✦', isGate: true },
  12: { label: 'Precision Aura',        desc: '+8% crit rate while this weapon is active.', icon: '🎯' },
  15: { label: 'Flow Form II',          desc: '+10% attack speed and -15% stamina cost.',  icon: '🔥' },
  17: { label: 'Resonance Pulse',       desc: 'Every 5th hit triggers an elemental burst.', icon: '⚡' },
  20: { label: 'Grand Mastery',         desc: 'Full mastery achieved. Eternal prestige mark unlocked.', icon: '👑', isMax: true },
};

export default function MasteryArtPanel({ masteryEntry, weaponId, weaponType, weaponName }) {
  const currentLevel = masteryEntry?.level || 1;
  const xpPct = masteryEntry?.isMaxLevel
    ? 100
    : ((masteryEntry?.killsIntoLevel || 0) / Math.max(1, masteryEntry?.killsForNextLevel || 1)) * 100;

  const hasAdvancedClass = currentLevel >= 10;
  const milestonePassives = MILESTONE_PASSIVES[weaponType] || {};

  return (
    <div className="w-full h-full flex flex-col gap-4 overflow-y-auto pr-1" style={{ scrollbarWidth: 'none' }}>

      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <div className="text-[10px] tracking-[0.35em] uppercase text-amber-300/70">Mastery Art</div>
          <div className="text-lg font-semibold text-white tracking-wide">{weaponName}</div>
        </div>
        <div
          className="px-3 py-1 rounded text-[10px] tracking-[0.25em] uppercase font-semibold"
          style={{
            background: hasAdvancedClass ? 'rgba(251,191,36,0.12)' : 'rgba(255,255,255,0.04)',
            border: hasAdvancedClass ? '1px solid rgba(251,191,36,0.45)' : '1px solid rgba(255,255,255,0.10)',
            color: hasAdvancedClass ? '#fbbf24' : 'rgba(255,255,255,0.35)',
          }}
        >
          {hasAdvancedClass ? '✦ Advanced Unlocked' : `Reach Lv 10 to Unlock`}
        </div>
      </div>

      {/* Level ladder */}
      <div className="flex flex-col gap-1 flex-shrink-0">
        {MASTERY_ART_LEVELS.map((lvl) => {
          const isUnlocked = currentLevel >= lvl;
          const isCurrent = currentLevel === lvl;
          const artUnlock = ART_UNLOCK_MAP[lvl];
          const milestonePassive = milestonePassives[lvl];

          const isGate = artUnlock?.isGate;
          const isMax  = artUnlock?.isMax;

          let rowBg = 'rgba(255,255,255,0.02)';
          let rowBorder = 'rgba(255,255,255,0.07)';
          let rowColor = 'rgba(255,255,255,0.30)';

          if (isMax && isUnlocked) {
            rowBg = 'rgba(251,191,36,0.08)';
            rowBorder = 'rgba(251,191,36,0.40)';
            rowColor = '#fbbf24';
          } else if (isGate && isUnlocked) {
            rowBg = 'rgba(167,243,208,0.07)';
            rowBorder = 'rgba(52,211,153,0.40)';
            rowColor = '#6ee7b7';
          } else if (isCurrent) {
            rowBg = 'rgba(110,195,255,0.07)';
            rowBorder = 'rgba(110,195,255,0.40)';
            rowColor = '#93c5fd';
          } else if (isUnlocked) {
            rowBg = 'rgba(255,255,255,0.03)';
            rowBorder = 'rgba(255,255,255,0.12)';
            rowColor = 'rgba(255,255,255,0.65)';
          }

          return (
            <div
              key={lvl}
              className="flex items-center gap-3 px-3 py-2 rounded transition-all"
              style={{ background: rowBg, border: `1px solid ${rowBorder}` }}
            >
              {/* Level badge */}
              <div
                className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0 text-[11px] font-bold tabular-nums"
                style={{
                  background: isUnlocked
                    ? (isGate ? 'rgba(52,211,153,0.18)' : isMax ? 'rgba(251,191,36,0.18)' : 'rgba(110,195,255,0.14)')
                    : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${isUnlocked ? rowBorder : 'rgba(255,255,255,0.08)'}`,
                  color: rowColor,
                }}
              >
                {lvl}
              </div>

              {/* Unlock icon + label */}
              <div className="flex-1 min-w-0">
                {artUnlock ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base leading-none">{artUnlock.icon}</span>
                    <span className="text-[11px] font-semibold" style={{ color: rowColor }}>
                      {artUnlock.label}
                    </span>
                    {isGate && (
                      <span
                        className="text-[9px] tracking-[0.2em] uppercase px-1.5 py-0.5 rounded"
                        style={{ background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.35)', color: '#6ee7b7' }}
                      >
                        Class Gate
                      </span>
                    )}
                  </div>
                ) : milestonePassive ? (
                  <span className="text-[11px] text-white/50">
                    ✦ {milestonePassive.name}
                  </span>
                ) : (
                  <span className="text-[11px] text-white/25 italic">Training level</span>
                )}
                {artUnlock?.desc && isUnlocked && (
                  <div className="text-[9px] text-white/40 mt-0.5">{artUnlock.desc}</div>
                )}
              </div>

              {/* Lock / unlock state */}
              <div className="flex-shrink-0">
                {isUnlocked
                  ? <Unlock className="w-3.5 h-3.5" style={{ color: isMax ? '#fbbf24' : isGate ? '#6ee7b7' : '#6ec3ff' }} />
                  : <Lock className="w-3.5 h-3.5 text-white/20" />
                }
              </div>
            </div>
          );
        })}
      </div>

      {/* Advanced Class gate callout */}
      {hasAdvancedClass && (
        <div
          className="flex-shrink-0 px-4 py-3 rounded flex items-start gap-3"
          style={{
            background: 'linear-gradient(135deg, rgba(52,211,153,0.08) 0%, rgba(16,185,129,0.06) 100%)',
            border: '1px solid rgba(52,211,153,0.30)',
          }}
        >
          <Star className="w-4 h-4 text-emerald-300 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-[11px] font-semibold text-emerald-300 tracking-wide">Weapon Efficiency Unlocked</div>
            <div className="text-[10px] text-white/50 mt-0.5 leading-relaxed">
              You may now choose an Advanced Class for this weapon. Selecting a class resets your Mastery Art level back to 1 (Prestige) — your Advanced Class perks carry forward permanently.
            </div>
            <button
              className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] tracking-[0.2em] uppercase font-semibold transition-all hover:opacity-90"
              style={{
                background: 'rgba(52,211,153,0.15)',
                border: '1px solid rgba(52,211,153,0.45)',
                color: '#6ee7b7',
              }}
              onClick={() => window.dispatchEvent(new CustomEvent('openAdvancedClassPanel'))}
            >
              <RotateCcw className="w-3 h-3" />
              Prestige & Choose Class
            </button>
          </div>
        </div>
      )}

      {/* Next milestone hint */}
      {!masteryEntry?.isMaxLevel && (
        <div
          className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.10)' }}
        >
          <Zap className="w-3 h-3 text-white/25 flex-shrink-0" />
          <span className="text-[9px] text-white/35">
            {masteryEntry?.killsForNextLevel - masteryEntry?.killsIntoLevel || '?'} kills to Level {currentLevel + 1}
            {ART_UNLOCK_MAP[currentLevel + 1] ? ` — unlocks ${ART_UNLOCK_MAP[currentLevel + 1].label}` : ''}
          </span>
        </div>
      )}
    </div>
  );
}