import React, { useEffect, useState } from 'react';
import { X, Plus, Sword, Heart, Sparkles, Shield, Flame } from 'lucide-react';
import {
  getCompanionProgression,
  subscribeCompanionProgression,
  allocateCompanionStat,
} from '../companionProgressionStore';
import { computeDerivedStats } from '../statsSystem';

const STAT_DEFS = [
  { key: 'strength',  label: 'Strength',  icon: Sword,    color: '#e25555',
    desc: '+Physical Damage · +Hit Chance' },
  { key: 'hp',        label: 'Vitality',  icon: Heart,    color: '#4caf50',
    desc: '+Max HP · +HP Regen · +Hit Chance' },
  { key: 'spirit',    label: 'Spirit',    icon: Sparkles, color: '#3a9ee6',
    desc: '+Mana · +Mana Regen · +Spell Damage' },
  { key: 'dexterity', label: 'Dexterity', icon: Shield,   color: '#c0a060',
    desc: '+Defense · +Crit Chance · +Range' },
  { key: 'elemental', label: 'Elemental', icon: Flame,    color: '#b755e2',
    desc: '+Elemental Dmg · +DoT Spell Dmg · +Elem Defense' },
];

/**
 * Right-side overlay box for the companion skill tree.
 * Opens from CompanionTab → "Skill Tree" button. Per-companion stat allocation.
 */
export default function CompanionSkillTreeOverlay({ companion, onClose }) {
  const [, force] = useState(0);

  useEffect(() => {
    return subscribeCompanionProgression(() => force((v) => v + 1));
  }, []);

  if (!companion) return null;

  const prog = getCompanionProgression(companion.id);
  const derived = computeDerivedStats(prog.baseStats, []);
  const xpPct = Math.min(100, Math.round((prog.xp / Math.max(1, prog.xpForNext)) * 100));

  return (
    <div
      className="absolute top-24 bottom-20 pointer-events-auto overflow-y-auto rounded-xl"
      style={{
        right: 24,
        width: 380,
        background: 'linear-gradient(180deg, rgba(20,18,30,0.92) 0%, rgba(12,12,18,0.92) 100%)',
        border: '1px solid rgba(251,191,36,0.35)',
        boxShadow: '0 8px 30px rgba(0,0,0,0.5), 0 0 18px rgba(251,191,36,0.12)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div>
          <div className="text-[10px] text-amber-400 tracking-[0.3em] uppercase font-bold">
            Companion Skill Tree
          </div>
          <div className="text-lg font-bold text-white mt-0.5">{companion.name}</div>
          <div className="text-xs text-white/50">Lv. <span className="text-amber-300 font-bold">{prog.level}</span></div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* XP bar */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 rounded-full bg-white/[0.06] overflow-hidden border border-white/10">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${xpPct}%`,
                background: 'linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)',
                boxShadow: '0 0 8px rgba(251,191,36,0.5)',
              }}
            />
          </div>
          <span className="text-[10px] text-white/50 tabular-nums">{prog.xp}/{prog.xpForNext}</span>
        </div>
      </div>

      {/* Unspent points */}
      <div
        className="mx-4 my-3 px-3 py-2 rounded-lg flex items-center justify-between"
        style={{
          background: prog.unspentPoints > 0
            ? 'linear-gradient(90deg, rgba(251,191,36,0.2) 0%, rgba(245,158,11,0.06) 100%)'
            : 'rgba(255,255,255,0.04)',
          border: `1px solid ${prog.unspentPoints > 0 ? 'rgba(251,191,36,0.55)' : 'rgba(255,255,255,0.1)'}`,
        }}
      >
        <div className="text-xs text-white/70 font-medium">Unspent Points</div>
        <div className="text-2xl font-bold tabular-nums" style={{ color: prog.unspentPoints > 0 ? '#fbbf24' : 'rgba(255,255,255,0.4)' }}>
          {prog.unspentPoints}
        </div>
      </div>

      {/* Stat allocations */}
      <div className="px-4 space-y-2 pb-3">
        {STAT_DEFS.map((s) => {
          const Icon = s.icon;
          const invested = prog.baseStats[s.key] ?? 0;
          const canAlloc = prog.unspentPoints > 0;
          return (
            <div
              key={s.key}
              className="flex items-center gap-2.5 p-2.5 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div
                className="w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0"
                style={{ background: `${s.color}22`, border: `1px solid ${s.color}66` }}
              >
                <Icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-white font-bold text-xs">{s.label}</span>
                  <span className="text-white/50 text-[10px] tabular-nums">{invested} pts</span>
                </div>
                <div className="text-[10px] text-white/45 leading-tight">{s.desc}</div>
              </div>
              <button
                onClick={() => allocateCompanionStat(companion.id, s.key)}
                disabled={!canAlloc}
                className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 transition-all"
                style={{
                  background: canAlloc ? 'rgba(251,191,36,0.18)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${canAlloc ? 'rgba(251,191,36,0.6)' : 'rgba(255,255,255,0.1)'}`,
                  color: canAlloc ? '#fbbf24' : 'rgba(255,255,255,0.25)',
                  cursor: canAlloc ? 'pointer' : 'not-allowed',
                }}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Derived stats summary */}
      <div className="mx-4 mb-4 p-3 rounded-lg bg-black/30 border border-white/10">
        <div className="text-[9px] tracking-[0.25em] uppercase text-white/50 mb-2 font-bold">
          Combat Stats
        </div>
        <div className="grid grid-cols-2 gap-y-1.5 text-[11px]">
          <StatRow label="Max HP"        value={derived.maxHP} />
          <StatRow label="HP Regen"      value={`${derived.hpRegen.toFixed(1)}/s`} />
          <StatRow label="Phys Dmg"      value={derived.physicalDamage} />
          <StatRow label="Elem Dmg"      value={derived.elementalDamage} />
          <StatRow label="Defense"       value={derived.defense} />
          <StatRow label="Elem Defense"  value={derived.elementalDefense.toFixed(0)} />
          <StatRow label="Hit Chance"    value={`${derived.hitChance.toFixed(0)}%`} />
          <StatRow label="Crit Chance"   value={`${derived.critChance.toFixed(0)}%`} />
          <StatRow label="Range"         value={`${derived.attackRange.toFixed(1)}m`} />
          <StatRow label="Spell Dmg"     value={`+${derived.spellDamagePct.toFixed(0)}%`} />
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value }) {
  return (
    <>
      <div className="text-white/50">{label}</div>
      <div className="text-right text-white/90 font-mono tabular-nums">{value}</div>
    </>
  );
}