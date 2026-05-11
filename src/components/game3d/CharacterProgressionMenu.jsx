import React, { useEffect, useState } from 'react';
import { X, Plus, Sword, Heart, Sparkles, Shield, Flame } from 'lucide-react';
import { subscribePlayerHUD, allocateStat } from './playerHUDStore';
import { STAT_RATES } from './statsSystem';

const STAT_DEFS = [
  { key: 'strength',  label: 'Strength',  icon: Sword,    color: '#e25555', desc: `+${STAT_RATES.strength} Physical Damage`,   derivedKey: 'physicalDamage' },
  { key: 'hp',        label: 'Vitality',  icon: Heart,    color: '#4caf50', desc: `+${STAT_RATES.hp} Max HP`,                  derivedKey: 'maxHP' },
  { key: 'spirit',    label: 'Spirit',    icon: Sparkles, color: '#3a9ee6', desc: `+${STAT_RATES.spirit} Chi (Mana)`,          derivedKey: 'chi' },
  { key: 'dexterity', label: 'Dexterity', icon: Shield,   color: '#c0a060', desc: `+${STAT_RATES.dexterity} Defense`,          derivedKey: 'defense' },
  { key: 'elemental', label: 'Elemental', icon: Flame,    color: '#b755e2', desc: `+${STAT_RATES.elemental} Elemental Damage`, derivedKey: 'elementalDamage' },
];

export default function CharacterProgressionMenu({ isOpen, onClose }) {
  const [hud, setHud] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    return subscribePlayerHUD(setHud);
  }, [isOpen]);

  if (!isOpen || !hud) return null;

  const { level, unspentPoints, baseStats, derived, hp, maxHP, xp, xpForNext } = hud;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-[760px] max-w-[95vw] max-h-[85vh] overflow-y-auto rounded-xl p-6"
        style={{
          background: 'linear-gradient(135deg, rgba(20,28,42,0.96) 0%, rgba(12,18,28,0.96) 100%)',
          border: '1px solid rgba(180,140,80,0.45)',
          boxShadow: '0 20px 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="text-[10px] text-yellow-300/70 font-bold tracking-[0.25em] uppercase">Character Progression</div>
            <div className="text-2xl font-bold text-white mt-1">Erika the Archer</div>
            <div className="text-sm text-white/60">Level <span className="text-yellow-300 font-bold">{level}</span> · {xp}/{xpForNext} XP</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Unspent points banner */}
        <div
          className="mb-5 p-3 rounded-lg flex items-center justify-between"
          style={{
            background: unspentPoints > 0
              ? 'linear-gradient(90deg, rgba(255,210,70,0.18) 0%, rgba(255,180,40,0.08) 100%)'
              : 'rgba(255,255,255,0.04)',
            border: `1px solid ${unspentPoints > 0 ? 'rgba(255,210,70,0.5)' : 'rgba(255,255,255,0.1)'}`,
          }}
        >
          <div className="text-sm text-white/80">Unspent Stat Points</div>
          <div className="text-2xl font-bold tabular-nums" style={{ color: unspentPoints > 0 ? '#ffd24a' : 'rgba(255,255,255,0.4)' }}>
            {unspentPoints}
          </div>
        </div>

        {/* Stat allocation list */}
        <div className="space-y-2 mb-5">
          {STAT_DEFS.map((s) => {
            const Icon = s.icon;
            const invested = baseStats[s.key] ?? 0;
            const derivedVal = derived?.[s.derivedKey] ?? 0;
            const canAlloc = unspentPoints > 0;
            return (
              <div
                key={s.key}
                className="flex items-center gap-3 p-3 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div
                  className="w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0"
                  style={{ background: `${s.color}22`, border: `1px solid ${s.color}66` }}
                >
                  <Icon className="w-5 h-5" style={{ color: s.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-bold text-sm">{s.label}</span>
                    <span className="text-white/50 text-xs tabular-nums">{invested} pts</span>
                  </div>
                  <div className="text-[11px] text-white/50">{s.desc} · Current: <span className="text-white/80 font-bold tabular-nums">{derivedVal}</span></div>
                </div>
                <button
                  onClick={() => allocateStat(s.key)}
                  disabled={!canAlloc}
                  className="w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0 transition-all"
                  style={{
                    background: canAlloc ? 'rgba(255,210,70,0.18)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${canAlloc ? 'rgba(255,210,70,0.6)' : 'rgba(255,255,255,0.1)'}`,
                    color: canAlloc ? '#ffd24a' : 'rgba(255,255,255,0.25)',
                    cursor: canAlloc ? 'pointer' : 'not-allowed',
                  }}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Derived stats summary */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          <SummaryTile label="Max HP" value={maxHP} sub={`Now: ${hp}`} color="#4caf50" />
          <SummaryTile label="Damage" value={derived.totalDamage} sub={`Phys ${derived.physicalDamage} · Elem ${derived.elementalDamage}`} color="#e25555" />
          <SummaryTile label="Defense" value={derived.defense} sub="Flat reduction" color="#c0a060" />
        </div>

        {/* Simple skill tree (visual placeholder — unlocks scale with level) */}
        <div>
          <div className="text-[10px] text-white/40 font-bold tracking-[0.25em] uppercase mb-2">Skill Tree</div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { name: 'Quick Shot',   unlockLvl: 1 },
              { name: 'Power Draw',   unlockLvl: 3 },
              { name: 'Eagle Eye',    unlockLvl: 5 },
              { name: 'Multi-Shot',   unlockLvl: 7 },
              { name: 'Piercing',     unlockLvl: 9 },
              { name: 'Storm Volley', unlockLvl: 12 },
              { name: 'Phantom Step', unlockLvl: 15 },
              { name: 'Star Arrow',   unlockLvl: 20 },
            ].map((skill) => {
              const unlocked = level >= skill.unlockLvl;
              return (
                <div
                  key={skill.name}
                  className="p-2 rounded-md text-center"
                  style={{
                    background: unlocked ? 'rgba(255,210,70,0.12)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${unlocked ? 'rgba(255,210,70,0.45)' : 'rgba(255,255,255,0.08)'}`,
                    opacity: unlocked ? 1 : 0.45,
                  }}
                >
                  <div className="text-[11px] font-bold text-white truncate">{skill.name}</div>
                  <div className="text-[9px] mt-0.5" style={{ color: unlocked ? '#ffd24a' : 'rgba(255,255,255,0.4)' }}>
                    {unlocked ? 'Unlocked' : `Lvl ${skill.unlockLvl}`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-center text-[10px] text-white/30 mt-5 tracking-wider">Press <span className="text-yellow-300 font-bold">C</span> to close</div>
      </div>
    </div>
  );
}

function SummaryTile({ label, value, sub, color }) {
  return (
    <div className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${color}33` }}>
      <div className="text-[9px] font-bold tracking-[0.2em] uppercase" style={{ color: `${color}cc` }}>{label}</div>
      <div className="text-xl font-bold text-white tabular-nums mt-0.5">{value}</div>
      <div className="text-[10px] text-white/45 mt-0.5">{sub}</div>
    </div>
  );
}