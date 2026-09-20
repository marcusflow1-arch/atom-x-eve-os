import React, { useEffect, useState } from 'react';
import {
  equipAXECape,
  getAXECapeState,
  setAXECapeHidden,
  subscribeAXECapes,
  unequipAXECape,
  upgradeAXECape,
} from '../../axe/progression/AXECapeStore';
import {
  AXE_CAPE_DEFINITIONS,
  getAXECapeBonuses,
  getAXECapeModifiers,
  previewAXECapeUpgrade,
} from '../../axe/progression/AXECapeSystem';

const fmt = (obj) =>
  Object.entries(obj || {})
    .filter(([, value]) => Number(value))
    .map(([key, value]) => `${key} +${value}`)
    .join(' · ');

export default function CapeSubTab() {
  const [state, setState] = useState(getAXECapeState());
  const [lastResult, setLastResult] = useState(null);
  useEffect(() => subscribeAXECapes(setState), []);

  return (
    <div className="h-full overflow-y-auto px-8 py-6 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-end justify-between border-b border-white/10 pb-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.35em] text-amber-200/70">Prestige Equipment</div>
            <h2 className="mt-1 text-2xl font-semibold">Capes</h2>
            <p className="mt-1 text-sm text-white/45">Warlord, divine, and seasonal capes use their own upgrade path.</p>
          </div>
          <button
            onClick={() => setAXECapeHidden(!state.hidden)}
            className="rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-xs text-white/70"
          >
            {state.hidden ? 'Show Cape' : 'Hide Cape'}
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-white/45">
          {Object.entries(state.materials).map(([id, value]) => (
            <span key={id} className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1">
              {id.replaceAll('_', ' ')}: <b className="text-white/80">{value}</b>
            </span>
          ))}
        </div>

        {lastResult && (
          <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-white/70">
            {lastResult.ok ? 'Cape upgrade succeeded.' : `Cape upgrade: ${lastResult.reason || lastResult.outcome || 'failed'}`}
          </div>
        )}

        <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-2">
          {state.owned.map((id) => {
            const def = AXE_CAPE_DEFINITIONS[id];
            if (!def) return null;
            const equipped = state.equippedCapeId === id;
            const preview = previewAXECapeUpgrade(id);
            return (
              <div key={id} className="rounded-2xl border border-white/10 bg-slate-950/55 p-4 backdrop-blur-md">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-white/35">
                      {def.rarity} · {def.grade}{def.eventTag ? ` · ${def.eventTag}` : ''}
                    </div>
                    <div className="mt-1 text-lg font-semibold">{def.name}</div>
                    <div className="mt-2 text-xs text-emerald-200/80">{fmt(getAXECapeBonuses(id))}</div>
                    {Object.keys(getAXECapeModifiers(id)).length > 0 && (
                      <div className="mt-1 text-[10px] text-cyan-200/60">{fmt(getAXECapeModifiers(id))}</div>
                    )}
                  </div>
                  <button
                    onClick={() => equipped ? unequipAXECape() : equipAXECape(id)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                      equipped ? 'bg-amber-300/20 text-amber-100' : 'bg-white/10 text-white/70'
                    }`}
                  >
                    {equipped ? 'Equipped' : 'Equip'}
                  </button>
                </div>

                {preview.ok && (
                  <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <div className="text-[10px] uppercase tracking-widest text-white/40">Upgrade</div>
                    <div className="mt-1 text-sm text-white/80">{preview.target.name}</div>
                    <div className="mt-1 text-[10px] text-white/40">
                      Chance {Math.round(preview.successChance * 100)}% · preserves {preview.preserve.join(', ')}
                    </div>
                    <button
                      onClick={() => {
                        const result = upgradeAXECape(id);
                        setLastResult(result);
                      }}
                      className="mt-3 w-full rounded-lg border border-amber-300/20 bg-amber-300/[0.08] px-3 py-2 text-xs font-semibold text-amber-100"
                    >
                      Attempt Upgrade
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
