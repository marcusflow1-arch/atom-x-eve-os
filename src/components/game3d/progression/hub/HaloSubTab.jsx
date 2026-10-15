import { useEffect, useState } from 'react';
import { subscribeHalo, attemptEnhancement, attemptEnhancementBatch, setHaloHidden, setHaloLevel, setHaloLowEffects } from '../haloStore';
import { MAX_HALO_LEVEL } from '../haloData';
import MaxOutButton from './devMaxOut';
import { subscribeCharacterChange } from '../../characterStorage';
import ProgressionReview from './ProgressionReview';

const BATCH_PRESETS = [10, 15, 25, 35];

export default function HaloSubTab() {
  const [halo, setHalo] = useState(null);
  const [lastResult, setLastResult] = useState(null);
  const [customAttempts, setCustomAttempts] = useState('');
  const [review, setReview] = useState(null);

  useEffect(() => subscribeHalo(setHalo), []);
  useEffect(() => subscribeCharacterChange(() => { setReview(null); setLastResult(null); }), []);
  if (!halo) return null;

  // Max attempts the player can afford right now
  const maxAttempts = halo.attemptCost > 0
    ? Math.floor(halo.kills / halo.attemptCost)
    : 0;

  const handleAttempt = () => {
    const r = attemptEnhancement();
    setLastResult(r);

  };

  const handleBatch = (count) => {
    if (!halo.canAttempt || halo.isMaxLevel) return;
    const safe = Math.min(count, maxAttempts);
    if (safe < 1) return;
    setReview({ title: `Review ${safe} halo attempts`, count: safe,
      description: 'Each attempt spends kills, including failed attempts. The batch stops if you reach the level cap or run out of kills. Success is not guaranteed.',
      cost: { 'maximum kills spent': safe * halo.attemptCost } });
  };

  const handleCustomBatch = () => {
    const n = parseInt(customAttempts, 10);
    if (!Number.isFinite(n) || n < 1) return;
    handleBatch(n);
    setCustomAttempts('');
  };

  // Cap custom input to maxAttempts as the user types
  const onCustomChange = (e) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    if (raw === '') return setCustomAttempts('');
    const n = parseInt(raw, 10);
    if (n > maxAttempts) {
      setCustomAttempts(String(maxAttempts));
    } else {
      setCustomAttempts(raw);
    }
  };

  const tier = halo.tier;
  const chancePct = Math.round((halo.successChance || 0) * 100);

  return (
    <div className="flex h-full flex-col overflow-y-auto md:flex-row">
      {/* LEFT — tier display */}
      <div className="w-full shrink-0 border-b border-white/10 px-4 py-6 flex flex-col items-center md:w-64 md:border-b-0 md:border-r">
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
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => setHaloHidden(!halo.hidden)}
            className="rounded-sm border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[9px] uppercase tracking-widest text-white/60"
          >
            {halo.hidden ? 'Show Halo' : 'Hide Halo'}
          </button>
          <button
            onClick={() => setHaloLowEffects(!halo.lowEffects)}
            className="rounded-sm border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[9px] uppercase tracking-widest text-white/60"
          >
            {halo.lowEffects ? 'Full FX' : 'Low FX'}
          </button>
        </div>
        <div className="text-[10px] text-white/50 text-center mt-2 px-2">
          {tier?.auraDesc}
        </div>
      </div>

      {/* RIGHT — attempt + bonuses */}
      <div className="flex-1 min-w-0 px-4 py-6 md:px-8 md:overflow-y-auto">
        <h2 className="mb-4 text-2xl font-semibold text-white">Halo progression</h2>
        <ProgressionReview review={review} onCancel={() => setReview(null)} onConfirm={(pending) => {
          const summary = attemptEnhancementBatch(pending.count);
          setLastResult(summary.attempts > 0
            ? { ok: true, success: summary.successes > 0, batch: summary }
            : { ok: false, reason: 'No attempts available. Check your kills and halo level.' });
          setReview(null);
        }} />
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Stat label="Banked Kills"     value={halo.kills} />
          <Stat label="Attempt Cost"     value={halo.attemptCost} />
          <Stat label="Success Chance"   value={`${chancePct}%`} accent={chancePct >= 35 ? '#a3e635' : chancePct >= 15 ? '#ffd86b' : '#fb7185'} />
          <Stat label="Total Attempts"   value={halo.totalAttempts} />
          <Stat label="Elixir Capacity"   value={`+${halo.elixirCapacityBonus}`} accent={tier?.color} />
          <Stat label="World FX"          value={halo.hidden ? 'Hidden' : (halo.lowEffects ? 'Low' : 'Full')} accent={tier?.color} />
          <div className="col-span-2 flex items-end justify-end">
            <MaxOutButton
              accent="#ffd86b"
              label="Max Halo"
              onClick={() => setHaloLevel(MAX_HALO_LEVEL)}
              title="Editor only — set Halo to max level"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Single attempt — shrunk to ~25% of previous width */}
          <button
            onClick={handleAttempt}
            disabled={!halo.canAttempt}
            className="py-2 px-3 rounded-sm text-[10px] tracking-[0.2em] uppercase font-semibold transition-all"
            style={{
              width: '25%',
              minWidth: 120,
              background: halo.canAttempt ? 'rgba(255,216,107,0.10)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${halo.canAttempt ? 'rgba(255,216,107,0.45)' : 'rgba(255,255,255,0.08)'}`,
              color: halo.canAttempt ? '#ffd86b' : 'rgba(255,255,255,0.3)',
              cursor: halo.canAttempt ? 'pointer' : 'not-allowed',
            }}
          >
            {halo.isMaxLevel
              ? 'Halo Maxed'
              : halo.canAttempt
                ? `Attempt — ${chancePct}%`
                : `Need ${halo.attemptCost - halo.kills}`}
          </button>

          {/* Preset batch buttons */}
          {BATCH_PRESETS.map((n) => {
            const affordable = n <= maxAttempts && !halo.isMaxLevel;
            return (
              <button
                key={n}
                onClick={() => handleBatch(n)}
                disabled={!affordable}
                className="py-2 px-3 rounded-sm text-[10px] tracking-[0.15em] uppercase font-semibold transition-all"
                style={{
                  background: affordable ? 'rgba(255,216,107,0.08)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${affordable ? 'rgba(255,216,107,0.35)' : 'rgba(255,255,255,0.08)'}`,
                  color: affordable ? '#ffd86b' : 'rgba(255,255,255,0.25)',
                  cursor: affordable ? 'pointer' : 'not-allowed',
                }}
                title={affordable ? `Run ${n} attempts` : `Need ${n * halo.attemptCost} kills`}
              >
                {n}×
              </button>
            );
          })}

          {/* Custom amount input + run button */}
          <div className="flex items-center gap-1 ml-auto">
            <input
              type="text"
              inputMode="numeric"
              value={customAttempts}
              onChange={onCustomChange}
              aria-label="Number of halo attempts"
              placeholder={`Max ${maxAttempts}`}
              disabled={halo.isMaxLevel || maxAttempts < 1}
              className="py-2 px-2 rounded-sm text-[11px] tabular-nums text-white tracking-wider bg-white/[0.04] border border-white/10 focus:border-amber-400/50 outline-none w-24"
            />
            <button
              onClick={handleCustomBatch}
              disabled={
                halo.isMaxLevel ||
                !customAttempts ||
                parseInt(customAttempts, 10) < 1 ||
                parseInt(customAttempts, 10) > maxAttempts
              }
              className="py-2 px-3 rounded-sm text-[10px] tracking-[0.15em] uppercase font-semibold transition-all"
              style={{
                background: 'rgba(255,216,107,0.10)',
                border: '1px solid rgba(255,216,107,0.45)',
                color: '#ffd86b',
              }}
            >
              Run
            </button>
          </div>
        </div>

        <div className="mt-2 text-[9px] tracking-[0.2em] uppercase text-white/40">
          Max possible attempts: <span className="text-amber-200/80 tabular-nums">{maxAttempts}</span>
          {' · '}
          {halo.attemptCost} kills per attempt
        </div>

        {lastResult && !lastResult.ok && <p role="status" className="mt-4 text-sm text-amber-100">{lastResult.reason?.replaceAll('_', ' ')}</p>}
        {lastResult?.ok && (
          <div
            role="status"
            className="mt-4 text-center py-2 rounded-sm text-xs tracking-[0.3em] uppercase"
            style={{
              background: lastResult.success ? 'rgba(163,230,53,0.10)' : 'rgba(251,113,133,0.10)',
              color: lastResult.success ? '#a3e635' : '#fb7185',
            }}
          >
            {lastResult.batch
              ? `${lastResult.batch.attempts} attempts — ${lastResult.batch.successes} success · Halo Lv ${lastResult.batch.finalLevel}`
              : lastResult.success
                ? `Success — Now Halo Lv ${lastResult.level}`
                : 'Failure — kills consumed'}
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