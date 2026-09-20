import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { allocateStat, refundStat } from '../../playerHUDStore';

const ATTRIBUTE_ROWS = [
  {
    id: 'strength',
    label: 'Strength',
    abbr: 'STR',
    description: 'Primary physical power. Raises weapon damage and physical scaling.',
    effects: ['Physical Damage', 'Weapon Damage Scaling'],
  },
  {
    id: 'dexterity',
    label: 'Dexterity',
    abbr: 'DEX',
    description: 'Precision and technique. Raises accuracy, evasion, critical chance and critical damage.',
    effects: ['Attack Success', 'Attack Block / Evasion', 'Critical Chance', 'Critical Damage'],
  },
  {
    id: 'constitution',
    label: 'Vitality',
    abbr: 'VIT',
    description: 'Survivability. Raises maximum HP, defense and critical defense.',
    effects: ['Maximum HP', 'Defense', 'Critical Defense'],
  },
  {
    id: 'focus',
    label: 'Spirit / Chi',
    abbr: 'SPI',
    description: 'Inner energy. Raises Chi, elemental power and attribute attack/defense.',
    effects: ['Maximum Chi', 'Elemental Damage', 'Attribute Attack', 'Attribute Defense'],
  },
];

function StatLine({ label, value, emphasis = false }) {
  return (
    <div className={`flex items-center justify-between gap-4 border-b border-white/[0.05] py-1.5 text-xs ${
      emphasis ? 'text-white/90' : 'text-white/55'
    }`}>
      <span>{label}</span>
      <span className={`tabular-nums ${emphasis ? 'font-semibold text-white' : 'text-white/80'}`}>
        {value}
      </span>
    </div>
  );
}

function AttributeCard({ config, value, canSpend }) {
  const canRefund = Number(value || 0) > 1;

  return (
    <div className="rounded-2xl border border-white/10 bg-black/[0.10] p-4 backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[9px] font-semibold uppercase tracking-[0.30em] text-white/35">
            {config.abbr}
          </div>
          <div className="mt-1 text-lg font-semibold text-white/90">{config.label}</div>
          <p className="mt-1 max-w-xl text-xs leading-5 text-white/40">{config.description}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refundStat(config.id)}
            disabled={!canRefund}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-white/55 transition hover:bg-white/[0.08] disabled:opacity-20"
            title={canRefund ? `Refund one ${config.label} point` : 'Cannot refund below base value'}
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <div className="min-w-[58px] text-center text-2xl font-light tabular-nums text-white">
            {value || 0}
          </div>
          <button
            onClick={() => allocateStat(config.id)}
            disabled={!canSpend}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/[0.08] text-white/80 transition hover:bg-white/[0.14] disabled:opacity-20"
            title={canSpend ? `Spend one point on ${config.label}` : 'No unspent attribute points'}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {config.effects.map((effect) => (
          <span
            key={effect}
            className="rounded-md border border-white/8 bg-white/[0.035] px-2 py-1 text-[9px] text-white/40"
          >
            {effect}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function AttributesTab({ hud }) {
  const d = hud?.derived || {};
  const base = hud?.baseStats || {};
  const canSpend = Number(hud?.unspentPoints || 0) > 0;

  return (
    <div className="grid h-full min-h-0 grid-cols-[250px_1fr] overflow-hidden">
      <aside className="min-h-0 overflow-y-auto border-r border-white/10 bg-black/[0.10] p-5">
        <div className="text-[9px] uppercase tracking-[0.35em] text-white/35">Character Foundation</div>
        <div className="mt-1 text-xl font-semibold text-white/90">Attributes</div>
        <p className="mt-2 text-xs leading-5 text-white/40">
          Attributes are permanent character stats. They are not a second class system and do not replace Weapon Mastery or Advanced Classes.
        </p>

        <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-center">
          <div className="text-5xl font-light tabular-nums text-white">{hud?.unspentPoints || 0}</div>
          <div className="mt-2 text-[9px] uppercase tracking-[0.30em] text-white/35">Unspent Points</div>
        </div>

        <div className="mt-5">
          <StatLine label="Level" value={hud?.level || 1} />
          <StatLine label="XP" value={`${hud?.xp || 0} / ${hud?.xpForNext || 0}`} />
          <StatLine label="Current HP" value={`${Math.round(hud?.hp || 0)} / ${Math.round(d.maxHP || hud?.maxHP || 0)}`} />
          <StatLine label="Maximum Chi" value={Math.round(d.chi || 0)} />
        </div>
      </aside>

      <section className="min-h-0 overflow-y-auto p-6">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            {ATTRIBUTE_ROWS.map((config) => (
              <AttributeCard
                key={config.id}
                config={config}
                value={base[config.id] || 0}
                canSpend={canSpend}
              />
            ))}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/[0.10] p-5">
              <div className="mb-2 text-[9px] uppercase tracking-[0.30em] text-white/35">Offense</div>
              <StatLine label="Total Damage" value={Math.round(d.totalDamage || d.damage || 0).toLocaleString()} emphasis />
              <StatLine label="Physical Damage" value={Math.round(d.physicalDamage || 0).toLocaleString()} />
              <StatLine label="Elemental Damage" value={Math.round(d.elementalDamage || 0).toLocaleString()} />
              <StatLine label="Attack Success" value={Number(d.attackSuccess || 0).toFixed(1)} />
              <StatLine label="Critical Chance" value={`${Number(d.critChance || 0).toFixed(1)}%`} />
              <StatLine label="Critical Damage" value={`+${Math.round(Number(d.criticalDamage || 0) * 100)}%`} />
              <StatLine label="Attribute Attack" value={Math.round(d.attributionAttack || 0)} />
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/[0.10] p-5">
              <div className="mb-2 text-[9px] uppercase tracking-[0.30em] text-white/35">Defense & Survival</div>
              <StatLine label="Maximum HP" value={Math.round(d.maxHP || 0).toLocaleString()} emphasis />
              <StatLine label="Defense" value={Math.round(d.defense || 0).toLocaleString()} />
              <StatLine label="Attack Block / Evasion" value={Number(d.attackBlock || 0).toFixed(1)} />
              <StatLine label="Critical Defense" value={`${Math.round(Number(d.criticalDefense || 0) * 100)}%`} />
              <StatLine label="Attribute Defense" value={Math.round(d.attributionDefense || 0)} />
              <StatLine label="HP Regen" value={Number(d.regenPerSecond || 0).toFixed(1)} />
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-white/8 bg-white/[0.025] p-4 text-xs leading-5 text-white/35">
            <b className="font-semibold text-white/60">System separation:</b> Attributes define your base character. Weapon Mastery grows by using the equipped weapon. Advanced Classes specialize a compatible mastered weapon. Equipment and Services modify the gear you actually own.
          </div>
        </div>
      </section>
    </div>
  );
}
