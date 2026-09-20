import React, { useEffect, useMemo, useState } from 'react';
import {
  getAXECoreState,
  registerAXECore,
  subscribeAXECores,
  unregisterAXECore,
  upgradeAXECore,
} from '../../axe/progression/AXECoreStore';
import {
  AXE_CORE_CONFIG,
  getAXECoreBonuses,
  getAXECoreDefinition,
  xpForAXECoreLevel,
} from '../../axe/progression/AXECoreSystem';

const fmt = (bonuses) =>
  Object.entries(bonuses || {})
    .filter(([, value]) => Number(value))
    .map(([key, value]) => `${key} +${Number(value).toFixed(Number(value) % 1 ? 1 : 0)}`)
    .join(' · ');

export default function CoreSubTab() {
  const [state, setState] = useState(getAXECoreState());
  useEffect(() => subscribeAXECores(setState), []);

  const registered = useMemo(
    () => state.cores.filter((core) => core.registered),
    [state.cores],
  );

  return (
    <div className="h-full overflow-y-auto px-8 py-6 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-end justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.35em] text-cyan-300/70">Core Matrix</div>
            <h2 className="mt-1 text-2xl font-semibold">Registered Cores</h2>
            <p className="mt-1 text-sm text-white/45">
              {registered.length}/{AXE_CORE_CONFIG.maxRegistered} active · Core bonuses feed the live AXE stat pipeline.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-right">
            <div className="text-[9px] uppercase tracking-widest text-white/40">Core Essence</div>
            <div className="text-xl font-bold text-cyan-200">{state.essence}</div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-2">
          {state.cores.map((core) => {
            const def = getAXECoreDefinition(core.definitionId);
            const bonuses = getAXECoreBonuses(core);
            const nextXP = xpForAXECoreLevel(core.level);
            return (
              <div key={core.instanceId} className="rounded-2xl border border-white/10 bg-slate-950/55 p-4 backdrop-blur-md">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-widest text-white/35">{def?.rarity} · {def?.specialty}</div>
                    <div className="mt-1 text-lg font-semibold">{def?.name || core.definitionId}</div>
                    <div className="mt-1 text-xs text-white/45">Lv. {core.level} · Evolution {core.evolutionStage}</div>
                  </div>
                  <button
                    onClick={() => core.registered ? unregisterAXECore(core.instanceId) : registerAXECore(core.instanceId)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      core.registered ? 'bg-cyan-400/20 text-cyan-100' : 'bg-white/10 text-white/70 hover:bg-white/15'
                    }`}
                  >
                    {core.registered ? 'Registered' : 'Register'}
                  </button>
                </div>

                <div className="mt-3 text-xs leading-5 text-emerald-200/80">{fmt(bonuses)}</div>

                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full bg-cyan-300/80"
                    style={{ width: `${Math.min(100, (core.xp / Math.max(1, nextXP)) * 100)}%` }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-[10px] text-white/35">
                  <span>{core.xp} XP</span>
                  <span>{core.level >= AXE_CORE_CONFIG.maxLevel ? 'MAX' : `${nextXP} next`}</span>
                </div>

                <button
                  onClick={() => upgradeAXECore(core.instanceId, { xpAmount: 100, essencePerXP: 1 })}
                  disabled={core.level >= AXE_CORE_CONFIG.maxLevel}
                  className="mt-3 w-full rounded-lg border border-cyan-300/20 bg-cyan-300/[0.08] px-3 py-2 text-xs font-semibold text-cyan-100 hover:bg-cyan-300/[0.14] disabled:opacity-30"
                >
                  Infuse 100 XP
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
