import React, { useEffect, useState } from 'react';
import { subscribeCompanion } from '../companionStore';
import { getCompanionById } from '../companionData';
import { COMPANION_ABILITIES, subscribeCompanionAbilities } from '../companionAbilityStore';

// Skills shown when MOUNTED — you control the mount's combat moves.
// (Not yet wired to abilities — purely visual for now.)
const MOUNTED_SKILLS = [
  { key: 'Z', icon: '⚔️', name: 'Charge',  color: '#f87171' },
  { key: 'X', icon: '🦷', name: 'Maul',    color: '#fb923c' },
  { key: 'V', icon: '💨', name: 'Dash',    color: '#22d3ee' },
  { key: 'B', icon: '🔥', name: 'War Cry', color: '#facc15' },
];

/**
 * Companion / mount skill row.
 * Sits directly above the player's HUDSkillSlots.
 * - Unmounted → light glass finish. Shows the 4 real companion abilities
 *   (Bite / Life Drain / Teleport Dash / Heal) with live cooldown overlays.
 * - Mounted   → darker box + dark-gray outline (mount's combat skills, visual only).
 */
export default function HUDCompanionSkillSlots() {
  const [compState, setCompState] = useState(null);
  const [abState, setAbState] = useState({ cooldowns: {} });

  useEffect(() => subscribeCompanion(setCompState), []);
  useEffect(() => subscribeCompanionAbilities(setAbState), []);

  const mounted = !!compState?.isMounted;
  const companion = getCompanionById(compState?.activeCompanionId);

  // Unmounted = real companion abilities. Mounted = visual placeholders.
  const skills = mounted
    ? MOUNTED_SKILLS
    : COMPANION_ABILITIES.map((a) => ({
        id: a.id, key: a.key, icon: a.icon, name: a.name, color: a.color, cooldown: a.cooldown,
      }));

  return (
    <div className="absolute z-20 pointer-events-auto" style={{ left: '24px', bottom: '118px' }}>
      <div className="flex gap-2">
        {skills.map((sk) => {
          const cdLeft = !mounted && sk.id ? (abState.cooldowns?.[sk.id] || 0) : 0;
          const cdPct = cdLeft > 0 && sk.cooldown ? Math.min(1, cdLeft / sk.cooldown) : 0;
          return (
            <div key={sk.key} className="relative">
              <button
                className="relative w-[52px] h-[52px] rounded-sm transition-transform hover:scale-105"
                style={
                  mounted
                    ? {
                        background: 'linear-gradient(135deg, rgba(20,22,28,0.85) 0%, rgba(10,12,16,0.9) 100%)',
                        border: '1.5px solid rgba(90,95,105,0.85)',
                        boxShadow: '0 3px 12px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)',
                      }
                    : {
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

                {/* Cooldown overlay (unmounted only, when on cooldown) */}
                {cdLeft > 0 && (
                  <>
                    <div
                      className="absolute inset-1 rounded-[2px] bg-black/65 flex items-center justify-center"
                      style={{
                        clipPath: `inset(0 0 ${(1 - cdPct) * 100}% 0)`,
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-[11px] font-black text-white drop-shadow-md tabular-nums">
                      {cdLeft.toFixed(1)}
                    </div>
                  </>
                )}

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
          );
        })}
      </div>
    </div>
  );
}