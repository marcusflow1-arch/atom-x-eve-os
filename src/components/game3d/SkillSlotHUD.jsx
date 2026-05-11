import React from 'react';
import { motion } from 'framer-motion';
import { Coins } from 'lucide-react';

/**
 * SkillSlotHUD - Recreates the SMITE 2 bottom hotbar:
 * - Inventory slots (top row)
 * - Hero portrait + HP/Mana bars + 4 ability slots + Summon slot
 * - Empty bottom inventory slots on right
 * - Gold counter on the far left
 */
export default function SkillSlotHUD({
  characterName = 'Erika',
  hp = 570,
  maxHp = 570,
  mana = 296,
  maxMana = 296,
  gold = 100000,
  onAbility,
}) {
  const abilities = [
    { key: '1', label: 'BOOT', color: '#4a90e2' },
    { key: '2', label: 'BUFF', color: '#7ed321' },
    { key: '3', label: 'DAMAGE', color: '#d0021b' },
    { key: '4', label: 'SUMMON', color: '#9013fe' },
  ];

  return (
    <div className="absolute bottom-0 left-0 right-0 pointer-events-none z-30">
      {/* Hint banner above HUD */}
      <div className="flex justify-center mb-3">
        <div
          className="px-6 py-1.5 flex items-center gap-3"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(20,30,40,0.85) 20%, rgba(20,30,40,0.85) 80%, transparent 100%)',
            borderTop: '1px solid rgba(180, 140, 80, 0.4)',
            borderBottom: '1px solid rgba(180, 140, 80, 0.4)',
          }}
        >
          <span className="px-2 py-0.5 rounded bg-black/60 border border-white/20 text-white text-[10px] font-bold">TAB</span>
          <span className="text-white/90 text-xs font-bold tracking-wider uppercase">Open the Practice Menu</span>
        </div>
      </div>

      <div className="flex items-end justify-between px-6 pb-3">
        {/* LEFT: Gold counter + empty inventory slots */}
        <div className="flex flex-col gap-2 pointer-events-auto">
          <div className="flex gap-1">
            {[...Array(6)].map((_, i) => (
              <InventorySlot key={i} empty />
            ))}
          </div>
          <div className="flex items-center gap-1.5 px-2">
            <Coins className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-yellow-300 text-sm font-bold tabular-nums">{gold.toLocaleString()}</span>
          </div>
        </div>

        {/* CENTER: Hero portrait + bars + abilities */}
        <div className="flex items-end gap-2 pointer-events-auto">
          {/* Hero portrait */}
          <HeroPortrait name={characterName} />

          {/* Bars + ability slots */}
          <div className="flex flex-col gap-1.5">
            {/* HP/Mana bars */}
            <div className="flex flex-col gap-1 w-[440px]">
              <ResourceBar value={hp} max={maxHp} color="#4caf50" />
              <ResourceBar value={mana} max={maxMana} color="#3a9ee6" />
            </div>

            {/* Ability slot row */}
            <div className="flex gap-1">
              {abilities.map((ab) => (
                <AbilitySlot key={ab.key} ability={ab} onClick={() => onAbility?.(ab.key)} />
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: Empty inventory slots */}
        <div className="flex flex-col gap-2 pointer-events-auto">
          <div className="flex gap-1">
            {[...Array(6)].map((_, i) => (
              <InventorySlot key={i} empty />
            ))}
          </div>
          {/* Keybind hints */}
          <div className="flex justify-end gap-2.5 pr-1 text-[10px] text-white/60">
            {['CTRL', 'TAB', 'V', 'ALT', 'ESC', 'B'].map((k) => (
              <span key={k} className="font-bold">{k}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function InventorySlot({ empty }) {
  return (
    <div
      className="w-9 h-9 rounded-sm"
      style={{
        background: empty ? 'rgba(40, 50, 60, 0.7)' : 'rgba(80, 60, 40, 0.8)',
        border: '1px solid rgba(120, 90, 50, 0.5)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), inset 0 -1px 2px rgba(0,0,0,0.4)',
      }}
    />
  );
}

function HeroPortrait({ name }) {
  return (
    <div className="relative w-[72px] h-[72px] flex-shrink-0">
      <div
        className="w-full h-full rounded-sm overflow-hidden relative"
        style={{
          background: 'linear-gradient(135deg, #6b4226 0%, #3a2414 100%)',
          border: '2px solid rgba(180, 140, 80, 0.7)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.6), inset 0 0 20px rgba(0,0,0,0.4)',
        }}
      >
        {/* Stylized character portrait — red-haired archer */}
        <div className="absolute inset-0 flex items-end justify-center">
          <svg viewBox="0 0 72 72" className="w-full h-full">
            <defs>
              <radialGradient id="bg-port" cx="50%" cy="40%">
                <stop offset="0%" stopColor="#5a8fb5" />
                <stop offset="100%" stopColor="#1a2438" />
              </radialGradient>
            </defs>
            <rect width="72" height="72" fill="url(#bg-port)" />
            {/* Hair */}
            <ellipse cx="36" cy="28" rx="22" ry="20" fill="#a83817" />
            {/* Face */}
            <ellipse cx="36" cy="34" rx="14" ry="17" fill="#ffd9b8" />
            {/* Hair front */}
            <path d="M 18 28 Q 20 18 36 16 Q 52 18 54 28 Q 50 22 36 22 Q 22 22 18 28" fill="#8a2a10" />
            {/* Eyes */}
            <ellipse cx="30" cy="33" rx="1.5" ry="2" fill="#2a3a4a" />
            <ellipse cx="42" cy="33" rx="1.5" ry="2" fill="#2a3a4a" />
            {/* Mouth */}
            <ellipse cx="36" cy="42" rx="2" ry="1" fill="#b85a4a" />
            {/* Shoulder armor */}
            <path d="M 12 60 L 18 50 L 30 48 L 42 48 L 54 50 L 60 60 L 60 72 L 12 72 Z" fill="#3a2814" />
          </svg>
        </div>
      </div>
      {/* Level badge */}
      <div
        className="absolute -bottom-1 -left-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-black"
        style={{
          background: 'radial-gradient(circle, #c0392b 0%, #6b1a14 100%)',
          border: '1.5px solid rgba(255, 200, 100, 0.8)',
        }}
      >
        1
      </div>
      {/* Status dot */}
      <div className="absolute top-1 left-1 w-2 h-2 rounded-full bg-red-500 border border-black/40" />
    </div>
  );
}

function ResourceBar({ value, max, color }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div
      className="relative w-full h-4 rounded-sm overflow-hidden"
      style={{
        background: 'rgba(0,0,0,0.6)',
        border: '1px solid rgba(180, 140, 80, 0.4)',
        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)',
      }}
    >
      <motion.div
        className="absolute inset-y-0 left-0"
        style={{
          background: `linear-gradient(180deg, ${color} 0%, ${color}cc 100%)`,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.3), 0 0 8px ${color}80`,
        }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.3 }}
      />
      <div className="absolute inset-0 flex items-center justify-center text-white text-[11px] font-bold tabular-nums drop-shadow-md">
        {value}/{max}
      </div>
      <div className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-white/70 font-bold">
        +1.7s
      </div>
    </div>
  );
}

function AbilitySlot({ ability, onClick }) {
  return (
    <button
      onClick={onClick}
      className="relative w-[60px] h-[60px] rounded-sm overflow-hidden group transition-transform hover:scale-105"
      style={{
        background: `linear-gradient(135deg, ${ability.color}aa 0%, ${ability.color}55 100%)`,
        border: '2px solid rgba(180, 140, 80, 0.7)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15)',
      }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-white font-black text-[9px] tracking-wider uppercase drop-shadow-md">
          {ability.label}
        </span>
      </div>
      <div
        className="absolute bottom-0 left-0 right-0 text-center text-white text-[10px] font-bold py-0.5"
        style={{ background: 'rgba(0,0,0,0.7)' }}
      >
        {ability.key}
      </div>
    </button>
  );
}