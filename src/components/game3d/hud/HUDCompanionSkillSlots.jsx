import React, { useEffect, useState } from 'react';
import { subscribeCompanion } from '../companionStore';
import { getCompanionById } from '../companionData';
import { subscribeCompanionAbilities } from '../companionAbilityStore';
import {
  subscribeCompanionLoadout,
  COMPANION_SLOT_KEYS,
} from '../skills/companionLoadoutStore';
import { getCompanionSkillById } from '../skills/companionSkillRegistry';

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
  const [loadout, setLoadout] = useState({ activeSlots: [null, null, null, null] });

  useEffect(() => subscribeCompanion(setCompState), []);
  useEffect(() => subscribeCompanionAbilities(setAbState), []);
  useEffect(() => subscribeCompanionLoadout(setLoadout), []);

  const mounted = !!compState?.isMounted;
  const companion = getCompanionById(compState?.activeCompanionId);

  // Unmounted = whatever the player has equipped in the companion loadout.
  // Mounted = visual placeholders for the mount.
  const skills = mounted
    ? MOUNTED_SKILLS
    : COMPANION_SLOT_KEYS.map((slotKey, idx) => {
        const id = loadout.activeSlots[idx];
        const sk = id ? getCompanionSkillById(id) : null;
        if (!sk) return { key: slotKey, icon: '—', name: 'Empty', color: '#6b7280', cooldown: 0, empty: true };
        return {
          id:       sk.legacy_id || sk.skill_id,
          key:      slotKey,
          icon:     sk.icon,
          name:     sk.skill_name,
          color:    sk.color,
          cooldown: sk.cooldown,
        };
      });

  return (
    <div className="absolute z-20 pointer-events-auto" style={{ left: '24px', bottom: '156px' }}>
      {/* Companion section label — a paw/dog icon to indicate this row is for the companion */}
      <div className="flex items-center gap-1.5 mb-1 ml-0.5" title="Companion Skills">
        <div
          className="flex items-center justify-center rounded-full"
          style={{
            width: 22,
            height: 22,
            background: 'rgba(0,0,0,0.55)',
            border: '1.5px solid rgba(255,255,255,0.5)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
          }}
        >
          <span className="text-[11px] leading-none">🐾</span>
        </div>
        <span className="text-[9px] font-bold tracking-[0.18em] text-white/55 uppercase">Companion</span>
      </div>
      <div className="flex gap-2">
        {skills.map((sk) => {
          const cdLeft = !mounted && sk.id ? (abState.cooldowns?.[sk.id] || 0) : 0;
          const cdPct = cdLeft > 0 && sk.cooldown ? Math.min(1, cdLeft / sk.cooldown) : 0;
          return (
            <div key={sk.key} className="relative">
              <button
                className="relative w-[58px] h-[58px] rounded-sm transition-transform hover:scale-105"
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
                <div
                  className="absolute inset-0 flex items-center justify-center text-lg"
                  style={{
                    filter: mounted ? 'saturate(0.9)' : 'none',
                    opacity: sk.empty ? 0.25 : 1,
                  }}
                >
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