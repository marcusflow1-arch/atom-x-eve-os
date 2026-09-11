import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { subscribeAura, attemptAuraEnhancement, setAuraLevel } from '../auraStore';
import { MAX_AURA_LEVEL } from '../auraData';
import MaxOutButton from './devMaxOut';

export default function AuraSubTab() {
  const [aura, setAura] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => subscribeAura(setAura), []);
  if (!aura) return null;

  const chancePct = Math.round((aura.successChance || 0) * 100);
  const attempt = () => {
    const next = attemptAuraEnhancement();
    setResult(next);
    window.setTimeout(() => setResult(null), 1800);
  };

  return (
    <div className="h-full overflow-y-auto px-8 py-6">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-[10px] tracking-[0.34em] uppercase text-sky-100/40">Atom XE Extension</div>
            <div className="text-2xl font-semibold text-white mt-1">Aura · Level {aura.level}</div>
            <p className="text-xs text-white/40 mt-1 max-w-2xl">
              Aura remains an Atom XE progression layer. It is intentionally separate from TwelveSky Halo reinforcement.
            </p>
          </div>
          <div className="text-right">
            <div className="text-[9px] tracking-[0.22em] uppercase text-white/30">Visual Tier</div>
            <div className="text-sm font-semibold mt-1" style={{ color: aura.tier?.color || '#fff' }}>{aura.tier?.label}</div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 backdrop-blur-xl p-5">
          <div className="grid grid-cols-4 gap-3">
            <Metric label="Level" value={`${aura.level} / ${MAX_AURA_LEVEL}`} />
            <Metric label="Banked Kills" value={aura.kills.toLocaleString()} />
            <Metric label="Attempt Cost" value={`${aura.attemptCost} kills`} />
            <Metric label="Success" value={`${chancePct}%`} />
          </div>

          <div className="grid grid-cols-4 gap-2 mt-5">
            <Bonus label="Strength" value={aura.bonuses.strength} />
            <Bonus label="Agility" value={aura.bonuses.agility} />
            <Bonus label="Vitality" value={aura.bonuses.vitality} />
            <Bonus label="Spirit" value={aura.bonuses.spirit} />
          </div>

          <div className="flex items-center gap-3 mt-5">
            <button
              onClick={attempt}
              disabled={!aura.canAttempt}
              className="rounded-xl border border-sky-200/20 bg-sky-200/[0.07] px-5 py-2.5 text-xs font-semibold text-sky-50 hover:bg-sky-200/[0.12] disabled:opacity-25 transition"
            >
              <Sparkles className="inline w-3.5 h-3.5 mr-1.5" /> Enhance Aura
            </button>
            <span className="text-[10px] text-white/35">
              {aura.isMaxLevel ? 'Aura complete' : aura.canAttempt ? 'Enhancement available' : `Need ${Math.max(0, aura.attemptCost - aura.kills)} more kills`}
            </span>
            <div className="ml-auto">
              <MaxOutButton accent="#7dd3fc" label="Max Aura" onClick={() => setAuraLevel(MAX_AURA_LEVEL)} title="Editor only — max Aura" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/7 bg-white/[0.02] p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full" style={{ background: `radial-gradient(circle, ${aura.tier?.glow || 'rgba(255,255,255,.15)'}, transparent 72%)` }} />
          <div>
            <div className="text-sm text-white">{aura.tier?.label} Aura</div>
            <div className="text-[11px] text-white/35 mt-1">{aura.tier?.auraDesc}</div>
          </div>
        </div>

        {result?.ok && (
          <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[120] rounded-full border border-white/10 bg-black/80 backdrop-blur-xl px-5 py-2 text-xs text-white shadow-2xl">
            {result.success ? `Aura enhanced · Level ${result.level}` : 'Aura enhancement failed'}
          </div>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-xl border border-white/7 bg-white/[0.025] p-3">
      <div className="text-[9px] tracking-[0.2em] uppercase text-white/30">{label}</div>
      <div className="text-lg text-white mt-1 tabular-nums">{value}</div>
    </div>
  );
}

function Bonus({ label, value }) {
  return (
    <div className="rounded-xl border border-white/7 bg-white/[0.02] px-3 py-2.5 flex items-center justify-between">
      <span className="text-[11px] text-white/40">{label}</span>
      <span className="text-sm text-sky-100 tabular-nums">+{value || 0}</span>
    </div>
  );
}
