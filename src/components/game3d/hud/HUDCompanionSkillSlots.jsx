import React, { useEffect, useState } from 'react';
import { subscribeCompanion } from '../companionStore';
import { getCompanionById } from '../companionData';

// Skills shown when NOT mounted — companion fights alongside you
const UNMOUNTED_SKILLS = [
  { key: 'Z', icon: '🐾', name: 'Pounce',    color: '#fbbf24' },
  { key: 'X', icon: '🛡️', name: 'Guard',     color: '#60a5fa' },
  { key: 'V', icon: '💢', name: 'Howl',      color: '#a78bfa' },
  { key: 'B', icon: '✨', name: 'Heal Bond', color: '#34d399' },
];

// Skills shown when MOUNTED — you control the mount's combat moves
const MOUNTED_SKILLS = [
  { key: 'Z', icon: '⚔️', name: 'Charge',    color: '#f87171' },
  { key: 'X', icon: '🦷', name: 'Maul',      color: '#fb923c' },
  { key: 'V', icon: '💨', name: 'Dash',      color: '#22d3ee' },
  { key: 'B', icon: '🔥', name: 'War Cry',   color: '#facc15' },
];

/**
 * Companion / mount skill row.
 * Sits directly above the player's HUDSkillSlots.
 * - Unmounted → light glass finish (companion assists in combat).
 * - Mounted   → darker box + dark-gray outline (mount's combat skills).
 */
export default function HUDCompanionSkillSlots() {
  const [compState, setCompState] = useState(null);

  useEffect(() => subscribeCompanion(setCompState), []);

  const mounted = !!compState?.isMounted;
  const companion = getCompanionById(compState?.activeCompanionId);
  const skills = mounted ? MOUNTED_SKILLS : UNMOUNTED_SKILLS;

  return (
    <div className="absolute z-20 pointer-events-auto" style={{ left: '24px', bottom: '118px' }}>
      <div className={`text-[10px] font-bold tracking-[0.25em] uppercase mb-1.5 ${mounted ? 'text-slate-300/90' : 'text-cyan-200/70'}`}>
        {mounted ? 'Mount Skills' : 'Companion Skills'}
        <span className="text-white/30 normal-case tracking-normal font-normal ml-1">
          · {companion?.name || 'Pet'}
        </span>
      </div>
      <div className="flex gap-2">
        {skills.map((sk) => (
          <div key={sk.key} className="relative">
            <button
              className="relative w-[52px] h-[52px] rounded-sm transition-transform hover:scale-105"
              style={
                mounted
                  ? {
                      // Mounted: darkened box + dark gray outline
                      background: 'linear-gradient(135deg, rgba(20,22,28,0.85) 0%, rgba(10,12,16,0.9) 100%)',
                      border: '1.5px solid rgba(90,95,105,0.85)',
                      boxShadow: '0 3px 12px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)',
                    }
                  : {
                      // Unmounted: clear glass finish
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.03) 100%)',
                      border: '1.5px solid rgba(255,255,255,0.22)',
                      backdropFilter: 'blur(8px) saturate(140%)',
                      WebkitBackdropFilter: 'blur(8px) saturate(140%)',
                      boxShadow: '0 3px 10px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
                    }
              }
              title={sk.name}
            >
              <div className={`absolute inset-1 rounded-[2px] ${mounted ? 'bg-black/40' : 'bg-white/[0.03]'}`} />
              <div className="absolute inset-0 flex items-center justify-center text-lg" style={{ filter: mounted ? 'saturate(0.9)' : 'none' }}>
                {sk.icon}
              </div>
              <div
                className="absolute bottom-0 right-0 px-1.5 py-0.5 text-[10px] font-bold text-white"
                style={{
                  background: mounted ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.65)',
                  borderTopLeftRadius: 3,
                }}
              >
                {sk.key}
              </div>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}