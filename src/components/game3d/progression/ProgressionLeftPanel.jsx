import React from 'react';
import { Plus, Sword, Heart, Sparkles, Shield, Flame, Trophy } from 'lucide-react';
import { allocateStat } from '../playerHUDStore';
import { STAT_RATES } from '../statsSystem';

const STAT_DEFS = [
  { key: 'strength',  label: 'Strength',  icon: Sword,    color: '#e25555',
    desc: `+${STAT_RATES.strength} Phys Dmg · +Hit Chance · +Dmg Roll`, derivedKey: 'physicalDamage' },
  { key: 'hp',        label: 'Vitality',  icon: Heart,    color: '#4caf50',
    desc: `+${STAT_RATES.hp} Max HP · +HP Regen · +Hit Chance`,         derivedKey: 'maxHP' },
  { key: 'spirit',    label: 'Spirit',    icon: Sparkles, color: '#3a9ee6',
    desc: `+${STAT_RATES.spirit} Mana · +Mana Regen · +Spell Dmg %`,    derivedKey: 'chi' },
  { key: 'dexterity', label: 'Dexterity', icon: Shield,   color: '#c0a060',
    desc: `+${STAT_RATES.dexterity} Defense · +Crit Chance · +Range`,   derivedKey: 'defense' },
  { key: 'elemental', label: 'Elemental', icon: Flame,    color: '#b755e2',
    desc: `+${STAT_RATES.elemental} Elem Dmg · +DoT Dmg % · +Elem Def`, derivedKey: 'elementalDamage' },
];

export default function ProgressionLeftPanel({ hud }) {
  const { level, unspentPoints, baseStats, derived, hp, maxHP, xp, xpForNext } = hud;
  const xpPct = Math.min(100, Math.round((xp / Math.max(1, xpForNext)) * 100));

  return (
    <div className="h-full flex flex-col p-8 overflow-y-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="text-[10px] text-yellow-300/80 font-bold tracking-[0.3em] uppercase mb-1">Character Progression</div>
        <div className="flex items-end gap-3">
          <div className="text-3xl font-bold text-white">Erika the Archer</div>
          <div className="text-sm text-white/50 pb-1">Lv. <span className="text-yellow-300 font-bold">{level}</span></div>
        </div>
        {/* XP bar */}
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 h-2 rounded-full bg-white/[0.06] overflow-hidden border border-white/10">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${xpPct}%`,
                background: 'linear-gradient(90deg, #ffd24a 0%, #ff9d3a 100%)',
                boxShadow: '0 0 10px rgba(255,210,70,0.5)',
              }}
            />
          </div>
          <span className="text-[10px] text-white/50 tabular-nums">{xp}/{xpForNext} XP</span>
        </div>
      </div>

      {/* Unspent points banner */}
      <div
        className="mb-5 p-4 rounded-lg flex items-center justify-between"
        style={{
          background: unspentPoints > 0
            ? 'linear-gradient(90deg, rgba(255,210,70,0.2) 0%, rgba(255,180,40,0.06) 100%)'
            : 'rgba(255,255,255,0.04)',
          border: `1px solid ${unspentPoints > 0 ? 'rgba(255,210,70,0.55)' : 'rgba(255,255,255,0.1)'}`,
        }}
      >
        <div>
          <div className="text-xs text-white/70 font-medium">Unspent Stat Points</div>
          <div className="text-[10px] text-white/40">Allocate to upgrade your character</div>
        </div>
        <div className="text-3xl font-bold tabular-nums" style={{ color: unspentPoints > 0 ? '#ffd24a' : 'rgba(255,255,255,0.4)' }}>
          {unspentPoints}
        </div>
      </div>

      {/* Stat list */}
      <div className="space-y-2 mb-6">
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
                className="w-11 h-11 rounded-md flex items-center justify-center flex-shrink-0"
                style={{ background: `${s.color}22`, border: `1px solid ${s.color}66` }}
              >
                <Icon className="w-5 h-5" style={{ color: s.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-white font-bold text-sm">{s.label}</span>
                  <span className="text-white/50 text-xs tabular-nums">{invested} pts</span>
                </div>
                <div className="text-[11px] text-white/50">
                  {s.desc} · Current: <span className="text-white/80 font-bold tabular-nums">{derivedVal}</span>
                </div>
              </div>
              <button
                onClick={() => allocateStat(s.key)}
                disabled={!canAlloc}
                className="w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0 transition-all"
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

      {/* Derived summary — primary + secondary combat stats */}
      <div className="grid grid-cols-3 gap-2 mt-auto">
        <SummaryTile label="Max HP"   value={maxHP}                sub={`Now: ${hp} · +${derived.hpRegen?.toFixed(1) ?? 0}/s regen`}     color="#4caf50" />
        <SummaryTile label="Damage"   value={derived.totalDamage}  sub={`Phys ${derived.physicalDamage} · Elem ${derived.elementalDamage}`} color="#e25555" />
        <SummaryTile label="Defense"  value={derived.defense}      sub={`Elem Def ${(derived.elementalDefense ?? 0).toFixed(0)}`}        color="#c0a060" />
        <SummaryTile label="Hit %"    value={`${(derived.hitChance ?? 0).toFixed(0)}%`} sub={`Crit ${(derived.critChance ?? 0).toFixed(0)}%`} color="#fbbf24" />
        <SummaryTile label="Range"    value={`${(derived.attackRange ?? 0).toFixed(1)}m`} sub={`Mana ${derived.chi} · +${(derived.manaRegen ?? 0).toFixed(1)}/s`}  color="#3a9ee6" />
        <SummaryTile label="Spell+"   value={`+${(derived.spellDamagePct ?? 0).toFixed(0)}%`} sub={`DoT +${(derived.dotDamagePct ?? 0).toFixed(0)}%`}                 color="#b755e2" />
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