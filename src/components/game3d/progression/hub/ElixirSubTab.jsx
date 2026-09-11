import React, { useEffect, useState } from 'react';
import { FlaskConical, Sparkles } from 'lucide-react';
import { consumeElixir, setElixirDoses, subscribeElixirs } from '../elixirStore';
import MaxOutButton from './devMaxOut';

export default function ElixirSubTab() {
  const [state, setState] = useState(null);
  const [notice, setNotice] = useState('');

  useEffect(() => subscribeElixirs(setState), []);
  if (!state) return null;

  const flash = (text) => {
    setNotice(text);
    window.setTimeout(() => setNotice(''), 1600);
  };

  const use = (typeId, amount) => {
    const result = consumeElixir(typeId, amount);
    if (result.ok) flash(`Applied ${result.used} elixir${result.used === 1 ? '' : 's'}`);
    else if (result.reason === 'insufficient_stock') flash('Not enough elixirs in inventory');
    else if (result.reason === 'cap_reached') flash('Elixir cap reached');
    else flash('Unable to apply elixir');
  };

  return (
    <div className="h-full overflow-y-auto px-8 py-6">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-[10px] tracking-[0.34em] uppercase text-emerald-100/40">Permanent Growth</div>
            <div className="text-2xl font-semibold text-white mt-1">Elixirs</div>
            <p className="text-xs text-white/40 mt-1 max-w-2xl">
              Standard growth runs to 100 doses, Over-Elixir growth continues to 200, and a complete Vanity set extends every line by another 50.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 backdrop-blur-xl px-4 py-3 text-right">
            <div className="text-[9px] tracking-[0.2em] uppercase text-white/30">Vanity Set</div>
            <div className="text-sm text-white mt-1">{state.vanityPieces} / 5 pieces</div>
            <div className={`text-[10px] mt-1 ${state.vanityComplete ? 'text-emerald-200' : 'text-white/25'}`}>{state.vanityComplete ? '+50 capacity active' : '+50 capacity when complete'}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {state.types.map((type) => {
            const standardPct = Math.min(100, (Math.min(type.doses, state.standardCap) / state.standardCap) * 100);
            const overPct = type.doses <= state.standardCap ? 0 : Math.min(100, ((Math.min(type.doses, state.overCap) - state.standardCap) / (state.overCap - state.standardCap)) * 100);
            const vanityPct = type.doses <= state.overCap ? 0 : Math.min(100, ((type.doses - state.overCap) / Math.max(1, state.vanityBonus)) * 100);
            return (
              <div key={type.id} className="rounded-2xl border border-white/10 bg-black/20 backdrop-blur-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl border border-emerald-200/10 bg-emerald-200/[0.04] flex items-center justify-center"><FlaskConical className="w-4 h-4 text-emerald-100/70" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2"><span className="text-sm font-semibold text-white">{type.name}</span><span className="text-xs text-white/35 tabular-nums">{type.doses} / {state.cap}</span></div>
                    <div className="text-[10px] text-emerald-100/50 mt-1">{type.effect}</div>
                  </div>
                </div>

                <div className="space-y-1.5 mt-4">
                  <Track label="Standard" value={standardPct} text={`0–${state.standardCap}`} />
                  <Track label="Over" value={overPct} text={`${state.standardCap + 1}–${state.overCap}`} />
                  <Track label="Vanity" value={vanityPct} text={state.vanityComplete ? `${state.overCap + 1}–${state.cap}` : 'Locked'} disabled={!state.vanityComplete} />
                </div>

                <div className="flex items-center gap-2 mt-4">
                  <span className="text-[10px] text-white/30 mr-auto">Inventory {type.stock}</span>
                  <button onClick={() => use(type.id, 1)} disabled={type.stock < 1} className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[10px] text-white/55 disabled:opacity-20">Use 1</button>
                  <button onClick={() => use(type.id, 10)} disabled={type.stock < 10} className="rounded-lg border border-emerald-200/15 bg-emerald-200/[0.05] px-2.5 py-1.5 text-[10px] text-emerald-50 disabled:opacity-20">Use 10</button>
                  <MaxOutButton accent="#86efac" label="Max" onClick={() => setElixirDoses(type.id, state.cap)} title="Editor only — set this elixir line to current cap" />
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl border border-white/7 bg-white/[0.02] p-4">
          <div className="flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase text-white/30"><Sparkles className="w-3.5 h-3.5" /> Live Permanent Bonuses</div>
          <div className="grid grid-cols-6 gap-2 mt-3 text-center">
            <Bonus label="HP" value={state.bonuses.hp} />
            <Bonus label="ATK" value={state.bonuses.damage} />
            <Bonus label="HIT" value={state.bonuses.attackSuccess} />
            <Bonus label="Dodge" value={state.bonuses.attackBlock} />
            <Bonus label="Chi" value={state.bonuses.chi} />
            <Bonus label="A.ATK / DEF" value={`${state.bonuses.attributionAttack} / ${state.bonuses.attributionDefense}`} raw />
          </div>
        </div>

        <div className="text-[10px] text-white/25 px-1">This Mines preset intentionally uses the classic 100 → 200 → +50 Vanity capacity model. The later live-game 200 + 200 expansion cap remains a separate rules preset, not mixed into this one.</div>
      </div>

      {notice && <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[120] rounded-full border border-white/10 bg-black/80 backdrop-blur-xl px-5 py-2 text-xs text-white shadow-2xl">{notice}</div>}
    </div>
  );
}

function Track({ label, value, text, disabled = false }) {
  return <div className={disabled ? 'opacity-25' : ''}><div className="flex justify-between text-[9px] text-white/30"><span>{label}</span><span>{text}</span></div><div className="h-1.5 rounded-full bg-white/5 mt-1 overflow-hidden"><div className="h-full bg-emerald-200/60" style={{ width: `${value}%` }} /></div></div>;
}
function Bonus({ label, value, raw = false }) {
  return <div className="rounded-xl border border-white/7 bg-white/[0.02] px-2 py-2.5"><div className="text-[9px] text-white/25">{label}</div><div className="text-xs text-white mt-1 tabular-nums">{raw ? value : `+${value || 0}`}</div></div>;
}
