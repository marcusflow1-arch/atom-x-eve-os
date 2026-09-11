import React, { useEffect, useState } from 'react';
import { Coins, ShieldCheck, Sparkles } from 'lucide-react';
import { attemptPalaceRank, setPalaceRank, subscribePalace } from '../palaceStore';
import { MAX_PALACE_RANK } from '../palaceData';
import MaxOutButton from './devMaxOut';

export default function PalaceSubTab() {
  const [palace, setPalace] = useState(null);
  const [usePardon, setUsePardon] = useState(true);
  const [result, setResult] = useState(null);

  useEffect(() => subscribePalace(setPalace), []);
  if (!palace) return null;

  const successPct = Math.round((palace.successChance || 0) * 100);
  const reinforce = () => {
    const next = attemptPalaceRank({ usePardon });
    setResult(next);
    window.setTimeout(() => setResult(null), 2200);
  };

  return (
    <div className="h-full overflow-y-auto px-8 py-6">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-[10px] tracking-[0.34em] uppercase text-violet-100/40">Palace Progression</div>
            <div className="text-2xl font-semibold text-white mt-1">Palace Rank {palace.rank}</div>
            <p className="text-xs text-white/40 mt-1 max-w-2xl">
              Rank remotely through the spirit. Every successful rank grants +1 Strength, Agility, Vitality and Spirit; higher bands add Critical Defense.
            </p>
          </div>
          <div className="text-right text-xs text-white/35">
            <div>Tier {palace.tier || 0} / 12</div>
            <div className="mt-1 text-violet-100">Crit DEF +{Math.round((palace.criticalDefense || 0) * 100)}%</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Metric icon={Coins} label="Contribution" value={`${palace.cp.toLocaleString()} CP`} sub={`${palace.cpCost} per attempt`} />
          <Metric icon={Coins} label="Silver" value={palace.silver.toLocaleString()} sub={`${palace.silverCost.toLocaleString()} per attempt`} />
          <Metric icon={ShieldCheck} label="Success" value={`${successPct}%`} sub="Failure drops 1 rank without Pardon" />
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 backdrop-blur-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] tracking-[0.22em] uppercase text-white/30">Rank Track</div>
              <div className="text-xs text-white/35 mt-1">Color/visual tier advances every 8 ranks.</div>
            </div>
            <div className="text-xs text-white/30 tabular-nums">{palace.rank} / {MAX_PALACE_RANK}</div>
          </div>
          <div className="grid grid-cols-12 gap-1.5 mt-4">
            {Array.from({ length: 12 }, (_, i) => {
              const tier = i + 1;
              const min = i * 8 + 1;
              const max = Math.min(96, tier * 8);
              const active = palace.rank >= min && palace.rank <= max;
              const done = palace.rank >= max;
              return (
                <div key={tier} className={`h-12 rounded-lg border flex flex-col items-center justify-center ${active ? 'border-violet-200/40 bg-violet-200/10' : done ? 'border-violet-200/15 bg-violet-200/[0.04]' : 'border-white/5 bg-white/[0.015]'}`}>
                  <span className={`text-[10px] font-semibold ${active || done ? 'text-violet-100' : 'text-white/20'}`}>{tier}</span>
                  <span className="text-[8px] text-white/20 mt-0.5">{min}-{max}</span>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-5 gap-2 mt-5">
            <Bonus label="STR" value={palace.bonuses.strength} />
            <Bonus label="AGI" value={palace.bonuses.agility} />
            <Bonus label="VIT" value={palace.bonuses.vitality} />
            <Bonus label="SPI" value={palace.bonuses.spirit} />
            <Bonus label="Crit DEF" value={`${Math.round((palace.criticalDefense || 0) * 100)}%`} raw />
          </div>

          <div className="flex items-center gap-3 mt-5">
            <button onClick={reinforce} disabled={!palace.canAttempt}
              className="rounded-xl border border-violet-200/20 bg-violet-200/[0.07] px-5 py-2.5 text-xs font-semibold text-violet-50 hover:bg-violet-200/[0.12] disabled:opacity-25 transition">
              Rank Up · {palace.cpCost} CP + {(palace.silverCost / 1_000_000).toFixed(0)}M Silver
            </button>
            <label className={`flex items-center gap-2 text-[10px] ${palace.imperialPardons > 0 ? 'text-white/50' : 'text-white/20'}`}>
              <input type="checkbox" checked={usePardon && palace.imperialPardons > 0} disabled={palace.imperialPardons <= 0}
                onChange={(e) => setUsePardon(e.target.checked)} />
              Imperial Pardon ({palace.imperialPardons})
            </label>
            <div className="ml-auto"><MaxOutButton accent="#c4b5fd" label="Max Palace" onClick={() => setPalaceRank(MAX_PALACE_RANK)} title="Editor only — set Palace Rank 96" /></div>
          </div>
        </div>

        <div className="text-[10px] text-white/25 px-1">Exact historical success probability table is still isolated as a tuning value; cost, rank loss, Pardon behavior and stat rewards use the documented rules.</div>

        {result?.ok && (
          <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[120] rounded-full border border-white/10 bg-black/80 backdrop-blur-xl px-5 py-2.5 text-xs text-white shadow-2xl">
            {result.outcome === 'success' ? `Success · Palace Rank ${result.rank}` : result.outcome === 'protected_failure' ? 'Failed · Imperial Pardon prevented rank loss' : `Failed · Palace Rank fell to ${result.rank}`}
          </div>
        )}
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value, sub }) {
  return <div className="rounded-2xl border border-white/10 bg-black/20 backdrop-blur-xl p-4"><div className="flex items-center gap-2 text-[9px] tracking-[0.2em] uppercase text-white/30"><Icon className="w-3.5 h-3.5" />{label}</div><div className="text-xl text-white mt-2 tabular-nums">{value}</div><div className="text-[10px] text-white/25 mt-1">{sub}</div></div>;
}
function Bonus({ label, value, raw = false }) {
  return <div className="rounded-xl border border-white/7 bg-white/[0.02] px-3 py-2.5 text-center"><div className="text-[9px] text-white/30">{label}</div><div className="text-sm text-white mt-1 tabular-nums">{raw ? value : `+${value || 0}`}</div></div>;
}
