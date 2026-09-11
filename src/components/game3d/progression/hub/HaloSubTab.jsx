import React, { useEffect, useMemo, useState } from 'react';
import { Coins, ShieldCheck, Sparkles, TrendingDown } from 'lucide-react';
import { subscribeHalo, attemptEnhancement, setHaloLevel } from '../haloStore';
import { HALO_TIERS, MAX_HALO_LEVEL } from '../haloData';
import MaxOutButton from './devMaxOut';

const Glass = ({ children, className = '' }) => (
  <div className={`rounded-2xl border border-white/10 bg-black/20 backdrop-blur-xl ${className}`}>{children}</div>
);

export default function HaloSubTab() {
  const [halo, setHalo] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => subscribeHalo(setHalo), []);

  const tierCells = useMemo(() => HALO_TIERS, []);
  if (!halo) return null;

  const successPct = Math.round((halo.successChance || 0) * 100);
  const delevelPct = Math.round((halo.delevelChance || 0) * 100);

  const reinforce = () => {
    const next = attemptEnhancement();
    setResult(next);
    window.setTimeout(() => setResult(null), 2200);
  };

  const reasonText = () => {
    if (halo.isMaxLevel) return 'Bonus Level +96 complete';
    if (halo.cp < halo.cpCost) return `Need ${(halo.cpCost - halo.cp).toLocaleString()} more CP`;
    if (halo.silver < halo.silverCost) return `Need ${(halo.silverCost - halo.silver).toLocaleString()} more Silver`;
    return 'Reinforcement available';
  };

  return (
    <div className="h-full overflow-y-auto px-8 py-6">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-[10px] tracking-[0.34em] uppercase text-cyan-100/40">CP Reinforcement</div>
            <div className="text-2xl font-semibold text-white mt-1">Bonus Level +{halo.level}</div>
            <p className="text-xs text-white/40 mt-1 max-w-2xl">
              Reinforce from the Character menu instead of visiting the Elder. Each successful level adds +1 Strength, Agility, Vitality and Spirit.
            </p>
          </div>
          <div className="text-right">
            <div className="text-[9px] tracking-[0.25em] uppercase text-white/30">Current Halo</div>
            <div className="text-sm font-semibold mt-1" style={{ color: halo.tier?.color || '#fff' }}>{halo.tier?.label}</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Glass className="p-4">
            <div className="flex items-center gap-2 text-[9px] tracking-[0.2em] uppercase text-white/35"><Coins className="w-3.5 h-3.5 text-amber-300" /> Contribution</div>
            <div className="text-xl text-white tabular-nums mt-2">{halo.cp.toLocaleString()} CP</div>
            <div className="text-[10px] text-white/30 mt-1">{halo.cpCost.toLocaleString()} per attempt</div>
          </Glass>
          <Glass className="p-4">
            <div className="flex items-center gap-2 text-[9px] tracking-[0.2em] uppercase text-white/35"><Coins className="w-3.5 h-3.5 text-slate-200" /> Silver</div>
            <div className="text-xl text-white tabular-nums mt-2">{halo.silver.toLocaleString()}</div>
            <div className="text-[10px] text-white/30 mt-1">{halo.silverCost.toLocaleString()} per attempt</div>
          </Glass>
          <Glass className="p-4">
            <div className="flex items-center gap-2 text-[9px] tracking-[0.2em] uppercase text-white/35"><ShieldCheck className="w-3.5 h-3.5 text-cyan-200" /> Outcome</div>
            <div className="flex items-baseline gap-3 mt-2">
              <span className="text-xl text-emerald-200">{successPct}%</span>
              <span className="text-xs text-white/30">success</span>
            </div>
            <div className="text-[10px] text-white/30 mt-1">{delevelPct}% de-level chance after a failed roll</div>
          </Glass>
        </div>

        <Glass className="p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-[10px] tracking-[0.25em] uppercase text-white/35">12 Visual Halo Tiers</div>
              <div className="text-xs text-white/35 mt-1">The appearance advances every eight bonus levels.</div>
            </div>
            <div className="text-xs text-white/30 tabular-nums">+{halo.level} / +{MAX_HALO_LEVEL}</div>
          </div>

          <div className="grid grid-cols-12 gap-1.5 mt-4">
            {tierCells.map((tier) => {
              const complete = halo.level >= tier.maxLevel;
              const active = halo.level >= tier.minLevel && halo.level <= tier.maxLevel;
              return (
                <div
                  key={tier.id}
                  title={`${tier.label}: +${tier.minLevel}–+${tier.maxLevel}`}
                  className={`h-12 rounded-lg border flex flex-col items-center justify-center ${complete || active ? 'bg-white/[0.055]' : 'bg-white/[0.018]'}`}
                  style={{
                    borderColor: active ? `${tier.color}80` : complete ? `${tier.color}35` : 'rgba(255,255,255,0.05)',
                    boxShadow: active ? `0 0 18px ${tier.glow}` : 'none',
                    color: complete || active ? tier.color : 'rgba(255,255,255,0.22)',
                  }}
                >
                  <div className="text-[10px] font-semibold">{tier.label.replace('Halo ', '')}</div>
                  <div className="text-[8px] opacity-60 mt-0.5">{tier.minLevel}-{tier.maxLevel}</div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-4 gap-2 mt-5">
            <Bonus label="Strength" value={halo.bonuses.strength} />
            <Bonus label="Agility" value={halo.bonuses.agility} />
            <Bonus label="Vitality" value={halo.bonuses.vitality} />
            <Bonus label="Spirit" value={halo.bonuses.spirit} />
          </div>

          <div className="flex items-center gap-3 mt-5">
            <button
              onClick={reinforce}
              disabled={!halo.canAttempt}
              className="rounded-xl border border-cyan-200/25 bg-cyan-200/[0.08] px-5 py-2.5 text-xs font-semibold text-cyan-50 hover:bg-cyan-200/[0.13] disabled:opacity-25 disabled:hover:bg-cyan-200/[0.08] transition"
            >
              Reinforce · {halo.cpCost} CP + {(halo.silverCost / 1_000_000).toFixed(0)}M Silver
            </button>
            <span className="text-[10px] text-white/35">{reasonText()}</span>
            <div className="ml-auto">
              <MaxOutButton accent="#67e8f9" label="Max Halo" onClick={() => setHaloLevel(MAX_HALO_LEVEL)} title="Editor only — set Bonus Level to +96" />
            </div>
          </div>
        </Glass>

        <div className="flex items-center justify-between text-[10px] text-white/25 px-1">
          <span>{halo.totalAttempts.toLocaleString()} attempts · {halo.totalSuccesses.toLocaleString()} successes · {halo.totalDelevels.toLocaleString()} de-levels</span>
          <span>Exact historical probability table: pending authoritative data</span>
        </div>

        {result?.ok && (
          <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[120] rounded-full border border-white/10 bg-black/80 backdrop-blur-xl px-5 py-2.5 text-xs shadow-2xl flex items-center gap-2">
            {result.outcome === 'success' && <><Sparkles className="w-4 h-4 text-emerald-300" /><span className="text-emerald-100">Success · Bonus Level +{result.level}</span></>}
            {result.outcome === 'failure' && <><ShieldCheck className="w-4 h-4 text-white/50" /><span className="text-white/70">Failed · level unchanged</span></>}
            {result.outcome === 'delevel' && <><TrendingDown className="w-4 h-4 text-rose-300" /><span className="text-rose-100">De-level · Bonus Level +{result.level}</span></>}
          </div>
        )}

        {result && !result.ok && (
          <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[120] rounded-full border border-rose-300/15 bg-black/80 backdrop-blur-xl px-5 py-2.5 text-xs text-rose-100 shadow-2xl">
            {result.reason === 'insufficient_cp' ? 'Not enough Contribution Points' : result.reason === 'insufficient_silver' ? 'Not enough Silver' : 'Reinforcement unavailable'}
          </div>
        )}
      </div>
    </div>
  );
}

function Bonus({ label, value }) {
  return (
    <div className="rounded-xl border border-white/7 bg-white/[0.025] px-3 py-3 flex items-center justify-between">
      <span className="text-[11px] text-white/40">{label}</span>
      <span className="text-sm text-white tabular-nums">+{value || 0}</span>
    </div>
  );
}
