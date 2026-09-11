import React from 'react';
import { HeartPulse, Sparkles, Swords, Wind } from 'lucide-react';
import { allocateStat } from '../../playerHUDStore';

const ATTRIBUTES = [
  {
    key: 'strength',
    label: 'Strength',
    abbr: 'STR',
    icon: Swords,
    tint: '#fb7185',
    description: 'Weapon attack and attack success.',
    effects: (d) => [`ATK ${Math.round(d.totalDamage || 0)}`, `Success ${Math.round(d.attackSuccess || 0)}`],
  },
  {
    key: 'dexterity',
    label: 'Agility',
    abbr: 'AGI',
    icon: Wind,
    tint: '#67e8f9',
    description: 'Defense, evasion and attack tempo.',
    effects: (d) => [`DEF ${Math.round(d.defense || 0)}`, `Evade ${(d.evasionPct || 0).toFixed(1)}%`],
  },
  {
    key: 'constitution',
    label: 'Vitality',
    abbr: 'VIT',
    icon: HeartPulse,
    tint: '#86efac',
    description: 'Maximum life and survivability.',
    effects: (d) => [`HP ${Math.round(d.maxHP || 0)}`, `Regen ${(d.hpRegen || 0).toFixed(1)}/s`],
  },
  {
    key: 'focus',
    label: 'Spirit',
    abbr: 'SPI',
    icon: Sparkles,
    tint: '#c4b5fd',
    description: 'Chi reserve and spiritual attack power.',
    effects: (d) => [`CHI ${Math.round(d.chi || 0)}`, `Regen ${(d.manaRegen || 0).toFixed(1)}/s`],
  },
];

export default function AttributesTab({ hud }) {
  const d = hud.derived || {};
  const canSpend = (hud.unspentPoints || 0) > 0;

  return (
    <div className="h-full overflow-y-auto px-8 py-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-end justify-between gap-6 mb-5">
          <div>
            <div className="text-[10px] tracking-[0.34em] uppercase text-cyan-100/40">Character Foundation</div>
            <div className="text-2xl font-semibold text-white mt-1">Four Attributes</div>
            <p className="mt-1 text-xs text-white/40 max-w-2xl">
              No secondary specialization tree here. Spend points, fight, and let equipment, titles, halo, elixirs and sets build on these four stats.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 backdrop-blur-xl px-5 py-3 text-right">
            <div className="text-[9px] tracking-[0.25em] uppercase text-white/35">Available</div>
            <div className="text-3xl font-light text-cyan-100 tabular-nums">{hud.unspentPoints || 0}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {ATTRIBUTES.map(({ key, label, abbr, icon: Icon, tint, description, effects }) => {
            const value = hud.baseStats?.[key] ?? 0;
            return (
              <div
                key={key}
                className="rounded-2xl border border-white/10 bg-black/20 backdrop-blur-xl p-5 relative overflow-hidden"
              >
                <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${tint}80, transparent)` }} />
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl border border-white/10 bg-white/[0.035] flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" style={{ color: tint }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-base font-semibold text-white">{label}</span>
                      <span className="text-[9px] tracking-[0.2em] text-white/30">{abbr}</span>
                    </div>
                    <div className="text-[11px] text-white/35 mt-1">{description}</div>
                    <div className="flex gap-3 mt-3 text-[10px] text-white/50">
                      {effects(d).map((effect) => <span key={effect}>{effect}</span>)}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-3xl font-light text-white tabular-nums">{value}</div>
                    <button
                      disabled={!canSpend}
                      onClick={() => allocateStat(key)}
                      className="mt-2 min-w-16 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/65 hover:bg-white/10 hover:text-white disabled:opacity-20 transition"
                    >
                      + Add
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-3 gap-3 mt-4">
          <Summary label="Combat" rows={[
            ['Attack', Math.round(d.totalDamage || 0)],
            ['Hit', `${(d.hitChance || 0).toFixed(1)}%`],
            ['Critical', `${(d.critChance || 0).toFixed(1)}%`],
          ]} />
          <Summary label="Defense" rows={[
            ['Defense', Math.round(d.defense || 0)],
            ['Evasion', `${(d.evasionPct || 0).toFixed(1)}%`],
            ['Crit Defense', `${Math.round((d.criticalDefense || 0) * 100)}%`],
          ]} />
          <Summary label="Resources" rows={[
            ['HP', Math.round(d.maxHP || 0)],
            ['Chi', Math.round(d.chi || 0)],
            ['Level', hud.level || 1],
          ]} />
        </div>
      </div>
    </div>
  );
}

function Summary({ label, rows }) {
  return (
    <div className="rounded-xl border border-white/7 bg-white/[0.02] p-4">
      <div className="text-[9px] tracking-[0.25em] uppercase text-white/30 mb-2">{label}</div>
      <div className="space-y-1.5 text-xs">
        {rows.map(([name, value]) => (
          <div key={name} className="flex justify-between border-b border-white/5 pb-1.5">
            <span className="text-white/40">{name}</span>
            <span className="text-white tabular-nums">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
