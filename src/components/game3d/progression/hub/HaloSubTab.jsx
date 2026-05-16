import React, { useEffect, useState } from 'react';
import { subscribeHalo, attemptEnhancement } from '../haloStore';
import { MAX_HALO_LEVEL } from '../haloData';

export default function HaloSubTab() {
  const [halo, setHalo] = useState(null);
  const [lastResult, setLastResult] = useState(null);

  useEffect(() => subscribeHalo(setHalo), []);
  if (!halo) return null;

  const handleAttempt = () => {
    const r = attemptEnhancement();
    setLastResult(r);
    if (r.ok) {
      window.setTimeout(() => setLastResult(null), 2500);
    }
  };

  const tier = halo.tier;
  const chancePct = Math.round((halo.successChance || 0) * 100);

  return (
    <div className="flex h-full">
      {/* LEFT — tier display */}
      <div className="w-72 border-r border-white/5 px-6 pt-10 flex flex-col items-center">
        <div
          className="w-44 h-44 rounded-full flex items-center justify-center"
          style={{
            background: `radial-gradient(circle, ${tier?.glow || 'rgba(255,255,255,0.15)'} 0%, transparent 70%)`,
            border: `1px solid ${tier?.color || '#fff'}55`,
          }}
        >
          <div className="text-center">
            <div className="text-6xl font-light tabular-nums" style={{ color: tier?.color || '#fff' }}>
              {halo.level}
            </div>
            <div className="text-[10px] tracking-[0.35em] uppercase text-white/60 mt-2">
              / {MAX_HALO_LEVEL}
            </div>
          </div>
        </div>

        <div
          className="mt-6 text-sm tracking-[0.3em] uppercase font-semibold"
          style={{ color: tier?.color || '#fff' }}
        >
          {tier?.label}
        </div>
        <div className="text-[10px] text-white/50 text-center mt-2 px-2">
          {tier?.auraDesc}
        </div>
      </div>

      {/* RIGHT — attempt + bonuses */}
      <div className="flex-1 min-w-0 px-10 pt-8 overflow-y-auto">
        <div className="grid grid-cols-2 gap-6 mb-8">
          <Stat label="Banked Kills"     value={halo.kills} />
          <Stat label="Attempt Cost"     value={halo.attemptCost} />
          <Stat label="Success Chance"   value={`${chancePct}%`} accent={chancePct >= 35 ? '#a3e635' : chancePct >= 15 ? '#ffd86b' : '#fb7185'} />
          <Stat label="Total Attempts"   value={halo.totalAttempts} />
        </div>

        <button
          onClick={handleAttempt}
          disabled={!halo.canAttempt}
          className="w-full py-4 rounded-sm text-sm tracking-[0.4em] uppercase font-semibold transition-all"
          style={{
            background: halo.canAttempt ? 'rgba(255,216,107,0.10)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${halo.canAttempt ? 'rgba(255,216,107,0.45)' : 'rgba(255,255,255,0.08)'}`,
            color: halo.canAttempt ? '#ffd86b' : 'rgba(255,255,255,0.3)',
            cursor: halo.canAttempt ? 'pointer' : 'not-allowed',
          }}
        >
          {halo.isMaxLevel
            ? 'Halo Maxed'
            : halo.canAttempt
              ? `Attempt Enhancement — ${chancePct}%`
              : `Need ${halo.attemptCost - halo.kills} more kills`}
        </button>

        {lastResult?.ok && (
          <div
            className="mt-4 text-center py-2 rounded-sm text-xs tracking-[0.3em] uppercase"
            style={{
              background: lastResult.success ? 'rgba(163,230,53,0.10)' : 'rgba(251,113,133,0.10)',
              color: lastResult.success ? '#a3e635' : '#fb7185',
            }}
          >
            {lastResult.success ? `Success — Now Halo Lv ${lastResult.level}` : 'Failure — kills consumed'}
          </div>
        )}

        <div className="mt-10">
          <div className="text-[10px] tracking-[0.3em] uppercase text-amber-300/80 mb-3">
            Current Bonuses
          </div>
          <div className="grid grid-cols-2 gap-3">
            <BonusRow label="Strength"        value={`+${halo.bonuses.strength}`} />
            <BonusRow label="Constitution"    value={`+${halo.bonuses.vitality}`} />
            <BonusRow label="Dexterity"       value={`+${halo.bonuses.dexterity}`} />
            <BonusRow label="Focus"           value={`+${halo.bonuses.spirit}`} />
            <BonusRow label="Crit Chance"     value={`+${halo.bonuses.criticalChance.toFixed(1)}%`} />
            <BonusRow label="Crit Defense"    value={`+${Math.round(halo.bonuses.criticalDefense * 100)}%`} />
          </div>
        </div>
      </div>
    </div>
  );
}

const Stat = ({ label, value, accent }) => (
  <div className="px-4 py-3 rounded-sm bg-white/[0.03] border border-white/5">
    <div className="text-[10px] tracking-[0.25em] uppercase text-white/50">{label}</div>
    <div className="text-2xl font-light mt-1 tabular-nums" style={{ color: accent || '#fff' }}>{value}</div>
  </div>
);

const BonusRow = ({ label, value }) => (
  <div className="flex justify-between items-center py-2 px-3 rounded-sm bg-white/[0.02] border border-white/5">
    <span className="text-xs text-white/70">{label}</span>
    <span className="text-sm text-amber-200 font-semibold tabular-nums">{value}</span>
  </div>
);