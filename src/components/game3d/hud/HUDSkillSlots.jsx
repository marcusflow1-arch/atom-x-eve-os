import React, { useEffect, useState } from 'react';
import { BookOpen } from 'lucide-react';
import { subscribeAbilities, ABILITY_DEFINITIONS } from '../abilityStore';
import HUDSkillsBookPanel from './HUDSkillsBookPanel';

const SLOT_KEYS_BOTTOM = ['1', '2', '3', '4'];
const SLOT_KEYS_TOP    = ['5', '6', '7', '8'];

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

function SlotButton({ slotKey, abId, cooldown }) {
  const ab    = ABILITY_DEFINITIONS.find((a) => a.id === abId);
  const cd    = cooldown || 0;
  const maxCd = ab?.cooldown || 1;
  const cdPct = Math.min(1, cd / maxCd);
  const color = ab ? (ELEMENT_COLORS[ab.element] || '#4a90e2') : '#4a90e2';
  const icon  = ab ? (ELEMENT_ICONS[ab.element]  || '')        : '';
  const onCooldown = cd > 0;

  return (
    <div className="relative">
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
        <div className="absolute inset-1 rounded-[2px] bg-black/35" />
        {ab && (
          <div className="absolute inset-0 flex items-center justify-center text-xl">{icon}</div>
        )}
        {onCooldown && (
          <div className="absolute inset-0 rounded-sm flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.55)' }}>
            <span className="text-white font-bold text-sm tabular-nums">{Math.ceil(cd)}</span>
          </div>
        )}
        <div
          className="absolute bottom-0 right-0 px-1.5 py-0.5 text-[10px] font-bold text-white"
          style={{ background: 'rgba(0,0,0,0.75)', borderTopLeftRadius: 3 }}
        >
          {slotKey}
        </div>
      </button>

      {onCooldown && (
        <div
          className="absolute -bottom-1.5 left-0 right-0 h-1 rounded-full overflow-hidden"
          style={{ background: 'rgba(0,0,0,0.5)' }}
        >
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${(1 - cdPct) * 100}%`, background: color, boxShadow: `0 0 4px ${color}` }}
          />
        </div>
      )}
    </div>
  );
}

export default function HUDSkillSlots() {
  const [abilityState, setAbilityState] = useState({ equipped: [null, null, null, null, null, null, null, null], cooldowns: [0,0,0,0,0,0,0,0] });
  const [bookOpen, setBookOpen] = useState(false);

  useEffect(() => subscribeAbilities(setAbilityState), []);

  const { equipped, cooldowns } = abilityState;
  // top row = slots 5-8 (indices 4-7), bottom row = slots 1-4 (indices 0-3)

  return (
    <>
      <div className="absolute bottom-6 left-6 z-20 pointer-events-auto flex flex-col gap-2">

        {/* ── Row 2: Player Character Slots 5–8 + SKILLS book ── */}
        <div className="flex items-center gap-2">
          {SLOT_KEYS_TOP.map((key, i) => (
            <SlotButton
              key={key}
              slotKey={key}
              abId={equipped[4 + i]}
              cooldown={cooldowns[4 + i]}
            />
          ))}

          {/* SKILLS book button */}
          <button
            onClick={() => setBookOpen((v) => !v)}
            className="ml-1 flex flex-col items-center justify-center gap-0.5 rounded-sm transition-all hover:scale-105"
            style={{
              width: 46,
              height: 58,
              background: bookOpen
                ? 'linear-gradient(135deg, rgba(167,139,250,0.35) 0%, rgba(167,139,250,0.18) 100%)'
                : 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)',
              border: bookOpen
                ? '1.5px solid rgba(167,139,250,0.6)'
                : '1.5px solid rgba(255,255,255,0.18)',
              boxShadow: bookOpen
                ? '0 3px 12px rgba(0,0,0,0.55), 0 0 10px rgba(167,139,250,0.35)'
                : '0 3px 10px rgba(0,0,0,0.45)',
            }}
            title="Skills Book"
          >
            <BookOpen
              className="w-4 h-4"
              style={{ color: bookOpen ? '#c4b5fd' : 'rgba(255,255,255,0.55)' }}
            />
            <span
              className="text-[8px] font-bold tracking-wider leading-none"
              style={{ color: bookOpen ? '#c4b5fd' : 'rgba(255,255,255,0.45)' }}
            >
              SKILLS
            </span>
          </button>
        </div>

        {/* ── Row 1: Ability Slots 1–4 ── */}
        <div className="flex gap-2">
          {SLOT_KEYS_BOTTOM.map((key, i) => (
            <SlotButton
              key={key}
              slotKey={key}
              abId={equipped[i]}
              cooldown={cooldowns[i]}
            />
          ))}
        </div>
      </div>

      <HUDSkillsBookPanel open={bookOpen} onClose={() => setBookOpen(false)} />
    </>
  );
}