import React, { useEffect, useState } from 'react';
import { subscribeAura, attemptAuraEnhancement, attemptAuraEnhancementBatch, setAuraLevel } from '../auraStore';
import { MAX_AURA_LEVEL } from '../auraData';
import MaxOutButton from './devMaxOut';

const BATCH_PRESETS = [10, 15, 25, 35];

export default function AuraSubTab() {
  const [aura, setAura] = useState(null);
  const [lastResult, setLastResult] = useState(null);
  const [customAttempts, setCustomAttempts] = useState('');

  useEffect(() => subscribeAura(setAura), []);
  if (!aura) return null;

  const maxAttempts = aura.attemptCost > 0 ? Math.floor(aura.kills / aura.attemptCost) : 0;

  const handleAttempt = () => {
    const r = attemptAuraEnhancement();
    setLastResult(r);
    if (r.ok) window.setTimeout(() => setLastResult(null), 2500);
  };

  const handleBatch = (count) => {
    if (!aura.canAttempt || aura.isMaxLevel) return;
    const safe = Math.min(count, maxAttempts);
    if (safe < 1) return;
    const summary = attemptAuraEnhancementBatch(safe);
    setLastResult({ ok: true, success: summary.successes > 0, batch: summary });
    window.setTimeout(() => setLastResult(null), 3000);
  };

  const handleCustomBatch = () => {
    const n = parseInt(customAttempts, 10);
    if (!Number.isFinite(n) || n < 1) return;
    handleBatch(n);
    setCustomAttempts('');
  };

  const onCustomChange = (e) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    if (raw === '') return setCustomAttempts('');
    const n = parseInt(raw, 10);
    setCustomAttempts(n > maxAttempts ? String(maxAttempts) : raw);
  };

  const tier = aura.tier;
  const chancePct = Math.round((aura.successChance || 0) * 100);

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
              {aura.level}
            </div>
            <div className="text-[10px] tracking-[0.35em] uppercase text-white/60 mt-2">
              / {MAX_AURA_LEVEL}
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
          <Stat label="Banked Kills" value={aura.kills} />
          <Stat label="Attempt Cost" value={aura.attemptCost} />
          <Stat label="Success Chance" value={`${chancePct}%`} accent={chancePct >= 35 ? '#a3e635' : chancePct >= 15 ? '#ffd86b' : '#fb7185'} />
          <Stat label="Total Attempts" value={aura.totalAttempts} />
          <div className="col-span-2 flex items-end justify-end">
            <MaxOutButton
              accent="#7dd3fc"
              label="Max Aura"
              onClick={() => setAuraLevel(MAX_AURA_LEVEL)}
              title="Editor only — set Aura to max level"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleAttempt}
            disabled={!aura.canAttempt}
            className="py-2 px-3 rounded-sm text-[10px] tracking-[0.2em] uppercase font-semibold transition-all"
            style={{
              width: '25%',
              minWidth: 120,
              background: aura.canAttempt ? 'rgba(125,211,252,0.10)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${aura.canAttempt ? 'rgba(125,211,252,0.45)' : 'rgba(255,255,255,0.08)'}`,
              color: aura.canAttempt ? '#7dd3fc' : 'rgba(255,255,255,0.3)',
              cursor: aura.canAttempt ? 'pointer' : 'not-allowed',
            }}
          >
            {aura.isMaxLevel
              ? 'Aura Maxed'
              : aura.canAttempt
                ? `Attempt — ${chancePct}%`
                : `Need ${aura.attemptCost - aura.kills}`}
          </button>

          {BATCH_PRESETS.map((n) => {
            const affordable = n <= maxAttempts && !aura.isMaxLevel;
            return (
              <button
                key={n}
                onClick={() => handleBatch(n)}
                disabled={!affordable}
                className="py-2 px-3 rounded-sm text-[10px] tracking-[0.15em] uppercase font-semibold transition-all"
                style={{
                  background: affordable ? 'rgba(125,211,252,0.08)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${affordable ? 'rgba(125,211,252,0.35)' : 'rgba(255,255,255,0.08)'}`,
                  color: affordable ? '#7dd3fc' : 'rgba(255,255,255,0.25)',
                  cursor: affordable ? 'pointer' : 'not-allowed',
                }}
                title={affordable ? `Run ${n} attempts` : `Need ${n * aura.attemptCost} kills`}
              >
                {n}×
              </button>
            );
          })}

          <div className="flex items-center gap-1 ml-auto">
            <input
              type="text"
              inputMode="numeric"
              value={customAttempts}
              onChange={onCustomChange}
              placeholder={`Max ${maxAttempts}`}
              disabled={aura.isMaxLevel || maxAttempts < 1}
              className="py-2 px-2 rounded-sm text-[11px] tabular-nums text-white tracking-wider bg-white/[0.04] border border-white/10 focus:border-sky-400/50 outline-none w-24"
            />
            <button
              onClick={handleCustomBatch}
              disabled={
                aura.isMaxLevel ||
                !customAttempts ||
                parseInt(customAttempts, 10) < 1 ||
                parseInt(customAttempts, 10) > maxAttempts
              }
              className="py-2 px-3 rounded-sm text-[10px] tracking-[0.15em] uppercase font-semibold transition-all"
              style={{
                background: 'rgba(125,211,252,0.10)',
                border: '1px solid rgba(125,211,252,0.45)',
                color: '#7dd3fc',
              }}
            >
              Run
            </button>
          </div>
        </div>

        <div className="mt-2 text-[9px] tracking-[0.2em] uppercase text-white/40">
          Max possible attempts: <span className="text-sky-200/80 tabular-nums">{maxAttempts}</span>
          {' · '}
          {aura.attemptCost} kills per attempt
        </div>

        {lastResult?.ok && (
          <div
            className="mt-4 text-center py-2 rounded-sm text-xs tracking-[0.3em] uppercase"
            style={{
              background: lastResult.success ? 'rgba(163,230,53,0.10)' : 'rgba(251,113,133,0.10)',
              color: lastResult.success ? '#a3e635' : '#fb7185',
            }}
          >
            {lastResult.batch
              ? `${lastResult.batch.attempts} attempts — ${lastResult.batch.successes} success · Aura Lv ${lastResult.batch.finalLevel}`
              : lastResult.success
                ? `Success — Now Aura Lv ${lastResult.level}`
                : 'Failure — kills consumed'}
          </div>
        )}

        <div className="mt-10">
          <div className="text-[10px] tracking-[0.3em] uppercase text-sky-300/80 mb-3">
            Current Bonuses
          </div>
          <div className="grid grid-cols-2 gap-3">
            <BonusRow label="Strength" value={`+${aura.bonuses.strength}`} />
            <BonusRow label="Constitution" value={`+${aura.bonuses.vitality}`} />
            <BonusRow label="Dexterity" value={`+${aura.bonuses.dexterity}`} />
            <BonusRow label="Focus" value={`+${aura.bonuses.spirit}`} />
            <BonusRow label="Crit Chance" value={`+${aura.bonuses.criticalChance.toFixed(1)}%`} />
            <BonusRow label="Crit Defense" value={`+${Math.round(aura.bonuses.criticalDefense * 100)}%`} />
          </div>
          <div className="text-[9px] tracking-[0.25em] uppercase text-white/30 mt-3">
            Same per-level multiplier as Halo · stacks with Halo
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
    <span className="text-sm text-sky-200 font-semibold tabular-nums">{value}</span>
  </div>
);