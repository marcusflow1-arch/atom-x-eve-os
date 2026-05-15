import React, { useEffect, useState } from 'react';
import { subscribeAbilities } from '../abilityStore';
import { ABILITY_DEFINITIONS } from '../abilityStore';

const SLOT_KEYS = ['1', '2', '3', '4'];

const ELEMENT_COLORS = {
  lightning: '#ffe066',
  fire:      '#ff6b35',
  ice:       '#7dd3fc',
  shadow:    '#a855f7',
};

const ELEMENT_ICONS = {
  lightning: '⚡',
  fire:      '🔥',
  ice:       '❄️',
  shadow:    '🌑',
};

export default function HUDSkillSlots() {
  const [abilityState, setAbilityState] = useState({ equipped: [null, null, null, null], cooldowns: [0, 0, 0, 0] });

  useEffect(() => subscribeAbilities(setAbilityState), []);

  const { equipped, cooldowns } = abilityState;

  return (
    <div className="absolute bottom-6 left-6 z-20 pointer-events-auto">
      <div className="flex gap-2">
        {SLOT_KEYS.map((key, i) => {
          const abId = equipped[i];
          const ab = ABILITY_DEFINITIONS.find((a) => a.id === abId);
          const cd = cooldowns[i] || 0;
          const maxCd = ab?.cooldown || 1;
          const cdPct = Math.min(1, cd / maxCd);
          const color = ab ? (ELEMENT_COLORS[ab.element] || '#4a90e2') : '#4a90e2';
          const icon = ab ? (ELEMENT_ICONS[ab.element] || '') : '';
          const onCooldown = cd > 0;

          return (
            <div key={key} className="relative">
              <button
                className="relative w-[58px] h-[58px] rounded-sm transition-transform hover:scale-105"
                style={{
                  background: ab
                    ? `linear-gradient(135deg, ${color}55 0%, ${color}22 100%)`
                    : 'linear-gradient(135deg, rgba(74,144,226,0.33) 0%, rgba(74,144,226,0.13) 100%)',
                  border: `1.5px solid ${ab ? color + '88' : 'rgba(180,140,80,0.55)'}`,
                  boxShadow: ab
                    ? `0 3px 12px rgba(0,0,0,0.55), 0 0 8px ${color}44, inset 0 1px 0 rgba(255,255,255,0.1)`
                    : '0 3px 10px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.1)',
                  opacity: onCooldown ? 0.6 : 1,
                }}
              >
                {/* Inner bg */}
                <div className="absolute inset-1 rounded-[2px] bg-black/35" />

                {/* Ability icon */}
                {ab && (
                  <div className="absolute inset-0 flex items-center justify-center text-xl">
                    {icon}
                  </div>
                )}

                {/* Cooldown sweep overlay */}
                {onCooldown && (
                  <div
                    className="absolute inset-0 rounded-sm flex items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.55)' }}
                  >
                    <span className="text-white font-bold text-sm tabular-nums">
                      {Math.ceil(cd)}
                    </span>
                  </div>
                )}

                {/* Key badge */}
                <div
                  className="absolute bottom-0 right-0 px-1.5 py-0.5 text-[10px] font-bold text-white"
                  style={{ background: 'rgba(0,0,0,0.75)', borderTopLeftRadius: 3 }}
                >
                  {key}
                </div>
              </button>

              {/* Cooldown bar under slot */}
              {onCooldown && (
                <div
                  className="absolute -bottom-1.5 left-0 right-0 h-1 rounded-full overflow-hidden"
                  style={{ background: 'rgba(0,0,0,0.5)' }}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(1 - cdPct) * 100}%`,
                      background: color,
                      boxShadow: `0 0 4px ${color}`,
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}