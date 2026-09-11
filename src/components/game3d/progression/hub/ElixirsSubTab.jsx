import React, { useEffect, useState } from 'react';
import { subscribeElixirs, consumeElixir, consumeElixirMax } from '../elixirStore';

export default function ElixirsSubTab() {
  const [state, setState] = useState(null);
  useEffect(() => subscribeElixirs(setState), []);
  if (!state) return null;

  const rows = Object.values(state.rows);
  const b = state.bonuses;

  return (
    <div className="h-full overflow-y-auto px-8 py-7">
      <div className="flex items-start justify-between gap-8 mb-7">
        <div>
          <div className="text-[10px] tracking-[0.35em] uppercase text-cyan-200/70">Permanent Growth</div>
          <h2 className="text-2xl text-white font-semibold mt-1">Elixir Matrix</h2>
          <p className="text-xs text-white/55 mt-2 max-w-2xl leading-relaxed">
            Your spirit consumes permanent elixirs remotely. Normal capacity fills first, then Expansion capacity unlocks automatically — no NPC trip required.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[11px] min-w-[300px]">
          <Summary label="Max HP" value={`+${b.hp.toLocaleString()}`} />
          <Summary label="Force" value={`+${b.force.toLocaleString()}`} />
          <Summary label="ATK" value={`+${b.damage.toLocaleString()}`} />
          <Summary label="HIT" value={`+${b.hit.toLocaleString()}`} />
          <Summary label="Dodge" value={`+${b.dodge.toLocaleString()}`} />
          <Summary label="A.ATK / A.DEF" value={`+${b.attributeAttack} / +${b.attributeDefense}`} />
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
        {rows.map((row) => {
          const normalPct = (row.normal / state.caps.normal) * 100;
          const expansionPct = (row.expansion / state.caps.expansion) * 100;
          const canUse = row.banked > 0 && !row.isMaxed;
          return (
            <div key={row.id} className="rounded-lg border border-white/10 bg-black/20 p-4">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-md border border-white/10 bg-white/[0.04] flex items-center justify-center text-2xl">{row.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-semibold">{row.name}</div>
                  <div className="text-[10px] text-cyan-100/60 mt-0.5">{row.summary}</div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] uppercase tracking-widest text-white/35">Banked</div>
                  <div className="text-lg text-white tabular-nums">{row.banked}</div>
                </div>
              </div>

              <Meter label="Normal" value={row.normal} max={state.caps.normal} pct={normalPct} />
              <Meter label="Expansion" value={row.expansion} max={state.caps.expansion} pct={expansionPct} locked={row.normal < state.caps.normal} />

              <div className="flex gap-2 mt-4">
                <UseButton disabled={!canUse} onClick={() => consumeElixir(row.id, 1)}>Use 1</UseButton>
                <UseButton disabled={!canUse || row.banked < 10} onClick={() => consumeElixir(row.id, 10)}>Use 10</UseButton>
                <UseButton disabled={!canUse} onClick={() => consumeElixirMax(row.id)}>Use Max</UseButton>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 text-[10px] text-white/35 tracking-wide">
        Documented baseline: 200 normal + 200 expansion doses per type. Balance caps remain centralized so Atom X Eve can tune them later.
      </div>
    </div>
  );
}

function Meter({ label, value, max, pct, locked = false }) {
  return (
    <div className={`mt-3 ${locked ? 'opacity-35' : ''}`}>
      <div className="flex justify-between text-[9px] tracking-[0.18em] uppercase text-white/45 mb-1">
        <span>{label}{locked ? ' · Locked' : ''}</span>
        <span className="tabular-nums">{value} / {max}</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        <div className="h-full bg-cyan-300/70" style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
    </div>
  );
}

function UseButton({ children, disabled, onClick }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="flex-1 py-2 rounded-md border border-cyan-300/25 bg-cyan-300/[0.07] text-[9px] tracking-[0.15em] uppercase text-cyan-100 disabled:opacity-25 disabled:cursor-not-allowed hover:bg-cyan-300/[0.12] transition-all"
    >
      {children}
    </button>
  );
}

function Summary({ label, value }) {
  return <><span className="text-white/40">{label}</span><span className="text-white text-right tabular-nums">{value}</span></>;
}
