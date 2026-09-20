import React, { useEffect, useState } from 'react';
import {
  getAXEElixirState,
  resetAXEElixirs,
  subscribeAXEElixirs,
  useAXEElixir,
} from '../../axe/progression/AXEElixirStore';
import { AXE_ELIXIR_TYPES } from '../../axe/progression/AXEElixirSystem';

export default function ElixirSubTab() {
  const [state, setState] = useState(getAXEElixirState());
  const [lastResult, setLastResult] = useState(null);
  useEffect(() => subscribeAXEElixirs(setState), []);

  return (
    <div className="h-full overflow-y-auto px-8 py-6 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="border-b border-white/10 pb-4">
          <div className="text-[10px] uppercase tracking-[0.35em] text-emerald-200/70">Permanent Growth</div>
          <h2 className="mt-1 text-2xl font-semibold">Elixirs</h2>
          <p className="mt-1 text-sm text-white/45">Permanent stat consumption with a configurable base cap and Halo/title/event capacity extensions.</p>
        </div>

        <div className="mt-5 grid grid-cols-4 gap-3">
          <Stat label="Used" value={state.usedCapacity} />
          <Stat label="Capacity" value={state.capacity.total} />
          <Stat label="Halo Bonus" value={`+${state.capacity.halo}`} />
          <Stat label="Remaining" value={state.remainingCapacity} />
        </div>

        {lastResult && (
          <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-white/65">
            {lastResult.ok ? 'Elixir action completed.' : lastResult.reason}
          </div>
        )}

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
          {Object.values(AXE_ELIXIR_TYPES).map((type) => {
            const used = state.allocations[type.id] || 0;
            const owned = state.inventory[type.id] || 0;
            return (
              <div key={type.id} className="rounded-2xl border border-white/10 bg-slate-950/55 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-lg font-semibold">{type.label}</div>
                    <div className="mt-1 text-xs text-emerald-200/70">
                      +{type.valuePerUse} {type.stat} permanently per use
                    </div>
                  </div>
                  <div className="text-right text-xs text-white/45">
                    <div>Owned {owned}</div>
                    <div>Used {used}</div>
                  </div>
                </div>
                <button
                  onClick={() => setLastResult(useAXEElixir(type.id, 1))}
                  disabled={owned < 1 || state.remainingCapacity < 1}
                  className="mt-4 w-full rounded-lg border border-emerald-300/20 bg-emerald-300/[0.07] px-3 py-2 text-xs font-semibold text-emerald-100 disabled:opacity-30"
                >
                  Consume Elixir
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div>
            <div className="text-sm font-semibold">Reset Permanent Allocation</div>
            <div className="text-xs text-white/40">Reset tokens: {state.resetTokens}. Refund behavior is controlled by AXE balance data.</div>
          </div>
          <button
            onClick={() => setLastResult(resetAXEElixirs())}
            disabled={state.resetTokens < 1 || state.usedCapacity < 1}
            className="rounded-lg border border-rose-300/20 bg-rose-300/[0.06] px-4 py-2 text-xs font-semibold text-rose-100 disabled:opacity-30"
          >
            Reset Elixirs
          </button>
        </div>
      </div>
    </div>
  );
}

const Stat = ({ label, value }) => (
  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
    <div className="text-[9px] uppercase tracking-widest text-white/35">{label}</div>
    <div className="mt-1 text-xl font-light tabular-nums text-white">{value}</div>
  </div>
);
