import React, { useEffect, useState } from 'react';
import {
  subscribeWings,
  equipWings,
  unequipWings,
  attemptWingEnhancement,
  attemptWingEnhancementBatch,
  setWingLevel,
} from '../wingsStore';
import { MAX_WING_LEVEL } from '../wingsData';
import MaxOutButton from './devMaxOut';

const BATCH_PRESETS = [10, 15, 25, 35];

export default function WingsSubTab() {
  const [wings, setWings] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [lastResult, setLastResult] = useState(null);
  const [customAttempts, setCustomAttempts] = useState('');

  useEffect(() => subscribeWings((s) => {
    setWings(s);
    if (!selectedId && s.equippedPathId) setSelectedId(s.equippedPathId);
    else if (!selectedId) setSelectedId(Object.keys(s.paths)[0]);
  }), []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!wings || !selectedId) return null;
  const path = wings.paths[selectedId];
  const isEquipped = wings.equippedPathId === selectedId;

  const maxAttempts = wings.attemptCost > 0 ? Math.floor(wings.kills / wings.attemptCost) : 0;
  const canAttempt = wings.kills >= wings.attemptCost && !path.isMaxLevel;
  const chancePct = Math.round((path.successChance || 0) * 100);

  const handleAttempt = () => {
    const r = attemptWingEnhancement(selectedId);
    setLastResult(r);
    if (r.ok) window.setTimeout(() => setLastResult(null), 2500);
  };

  const handleBatch = (count) => {
    if (!canAttempt || path.isMaxLevel) return;
    const safe = Math.min(count, maxAttempts);
    if (safe < 1) return;
    const summary = attemptWingEnhancementBatch(selectedId, safe);
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

  const mb = path.multiplierBonuses;
  const fb = path.flatBonuses;

  return (
    <div className="flex h-full">
      {/* LEFT — wing path list */}
      <div className="w-72 border-r border-white/5 px-4 pt-6 overflow-y-auto">
        <div className="text-[10px] tracking-[0.3em] uppercase text-white/40 px-2 mb-3">
          Wing Types
        </div>
        {Object.values(wings.paths).map((p) => {
          const active = p.id === selectedId;
          return (
            <button
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              className="w-full text-left p-3 mb-2 rounded-md border transition-all"
              style={{
                background: active ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
                borderColor: active ? `${p.color}66` : 'rgba(255,255,255,0.05)',
              }}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-xl">{p.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white truncate">{p.name}</div>
                  <div className="text-[10px] tracking-[0.2em] uppercase text-white/50 mt-0.5">
                    Lv {p.level} · {p.primaryStat}
                  </div>
                </div>
                {wings.equippedPathId === p.id && (
                  <span className="text-[9px] tracking-[0.2em] uppercase" style={{ color: p.color }}>Eq</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* RIGHT — detail + enhancement */}
      <div className="flex-1 min-w-0 px-10 pt-8 overflow-y-auto">
        <div className="flex items-start gap-4">
          <div
            className="w-20 h-20 rounded-md flex items-center justify-center text-4xl"
            style={{ background: `${path.color}22`, border: `1px solid ${path.color}66` }}
          >
            {path.icon}
          </div>
          <div className="flex-1">
            <div className="text-xl font-semibold text-white tracking-wide">{path.name}</div>
            <div className="text-[10px] tracking-[0.3em] uppercase mt-1" style={{ color: path.color }}>
              {path.primaryStat} · Level {path.level} / {MAX_WING_LEVEL}
            </div>
            <div className="text-xs text-white/60 mt-3 max-w-lg">{path.description}</div>
          </div>
          <button
            onClick={() => (isEquipped ? unequipWings() : equipWings(path.id))}
            className="px-4 py-2 rounded-sm text-[11px] tracking-[0.3em] uppercase font-semibold"
            style={{
              background: isEquipped ? 'rgba(251,113,133,0.10)' : `${path.color}1a`,
              border: `1px solid ${isEquipped ? 'rgba(251,113,133,0.4)' : `${path.color}80`}`,
              color: isEquipped ? '#fb7185' : path.color,
            }}
          >
            {isEquipped ? 'Unequip' : 'Equip Wings'}
          </button>
        </div>

        {/* Enhancement controls — spend kills to level THIS wing separately */}
        <div className="mt-8 grid grid-cols-2 gap-6 mb-6">
          <Stat label="Banked Kills" value={wings.kills} />
          <Stat label="Attempt Cost" value={wings.attemptCost} />
          <Stat label="Success Chance" value={`${chancePct}%`} accent={chancePct >= 35 ? '#a3e635' : chancePct >= 15 ? '#ffd86b' : '#fb7185'} />
          <Stat label="Total Attempts" value={path.totalAttempts} />
          <div className="col-span-2 flex items-end justify-end gap-2">
            <MaxOutButton
              accent={path.color}
              label={`Max ${path.name}`}
              onClick={() => {
                setWingLevel(selectedId, MAX_WING_LEVEL);
                if (!isEquipped) equipWings(path.id);
              }}
              title="Editor only — max out this wing type + equip it"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleAttempt}
            disabled={!canAttempt}
            className="py-2 px-3 rounded-sm text-[10px] tracking-[0.2em] uppercase font-semibold transition-all"
            style={{
              width: '25%',
              minWidth: 120,
              background: canAttempt ? `${path.color}1a` : 'rgba(255,255,255,0.03)',
              border: `1px solid ${canAttempt ? `${path.color}80` : 'rgba(255,255,255,0.08)'}`,
              color: canAttempt ? path.color : 'rgba(255,255,255,0.3)',
              cursor: canAttempt ? 'pointer' : 'not-allowed',
            }}
          >
            {path.isMaxLevel
              ? 'Wings Maxed'
              : canAttempt
                ? `Attempt — ${chancePct}%`
                : `Need ${wings.attemptCost - wings.kills}`}
          </button>

          {BATCH_PRESETS.map((n) => {
            const affordable = n <= maxAttempts && !path.isMaxLevel;
            return (
              <button
                key={n}
                onClick={() => handleBatch(n)}
                disabled={!affordable}
                className="py-2 px-3 rounded-sm text-[10px] tracking-[0.15em] uppercase font-semibold transition-all"
                style={{
                  background: affordable ? `${path.color}14` : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${affordable ? `${path.color}59` : 'rgba(255,255,255,0.08)'}`,
                  color: affordable ? path.color : 'rgba(255,255,255,0.25)',
                  cursor: affordable ? 'pointer' : 'not-allowed',
                }}
                title={affordable ? `Run ${n} attempts` : `Need ${n * wings.attemptCost} kills`}
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
              disabled={path.isMaxLevel || maxAttempts < 1}
              className="py-2 px-2 rounded-sm text-[11px] tabular-nums text-white tracking-wider bg-white/[0.04] border border-white/10 focus:border-white/40 outline-none w-24"
            />
            <button
              onClick={handleCustomBatch}
              disabled={
                path.isMaxLevel ||
                !customAttempts ||
                parseInt(customAttempts, 10) < 1 ||
                parseInt(customAttempts, 10) > maxAttempts
              }
              className="py-2 px-3 rounded-sm text-[10px] tracking-[0.15em] uppercase font-semibold transition-all"
              style={{
                background: `${path.color}1a`,
                border: `1px solid ${path.color}80`,
                color: path.color,
              }}
            >
              Run
            </button>
          </div>
        </div>

        <div className="mt-2 text-[9px] tracking-[0.2em] uppercase text-white/40">
          Max possible attempts: <span className="tabular-nums" style={{ color: path.color }}>{maxAttempts}</span>
          {' · '}
          {wings.attemptCost} kills per attempt · leveled separately per wing type
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
              ? `${lastResult.batch.attempts} attempts — ${lastResult.batch.successes} success · ${path.name} Lv ${lastResult.batch.finalLevel}`
              : lastResult.success
                ? `Success — ${path.name} Lv ${lastResult.level}`
                : 'Failure — kills consumed'}
          </div>
        )}

        {/* Multiplier (halo-style) + Specialization (flat) */}
        <div className="grid grid-cols-2 gap-6 mt-8">
          <div>
            <div className="text-[10px] tracking-[0.3em] uppercase mb-3" style={{ color: path.color }}>
              Halo-Style Multiplier
            </div>
            <div className="space-y-1.5 text-xs text-white/75">
              <Row k="Strength" v={`+${mb.strength}`} />
              <Row k="Constitution" v={`+${mb.constitution}`} />
              <Row k="Dexterity" v={`+${mb.dexterity}`} />
              <Row k="Focus" v={`+${mb.focus}`} />
              <Row k="Crit Chance" v={`+${mb.criticalChance.toFixed(1)}%`} />
              <Row k="Crit Defense" v={`+${Math.round(mb.criticalDefense * 100)}%`} />
            </div>
            <div className="text-[9px] tracking-[0.25em] uppercase text-white/30 mt-3">
              Virtual attribute points · stacks with Halo + Aura
            </div>
          </div>
          <div>
            <div className="text-[10px] tracking-[0.3em] uppercase mb-3" style={{ color: path.color }}>
              Specialization (Flat)
            </div>
            <div className="space-y-1.5 text-xs text-white/75">
              <Row k="Max HP" v={`+${(fb.hp || 0).toLocaleString()}`} />
              <Row k="Damage" v={`+${(fb.damage || 0).toLocaleString()}`} />
              <Row k="Defense" v={`+${(fb.defense || 0).toLocaleString()}`} />
              <Row k="Crit Chance" v={`+${(fb.critChance || 0).toFixed(1)}%`} />
              <Row k="Crit Damage" v={`+${Math.round((fb.critDamage || 0) * 100)}%`} />
              <Row k="Crit Defense" v={`+${Math.round((fb.criticalDefense || 0) * 100)}%`} />
            </div>
            <div className="text-[9px] tracking-[0.25em] uppercase text-white/30 mt-3">
              Flat final stats · applied on top of the multiplier
            </div>
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

const Row = ({ k, v }) => (
  <div className="flex justify-between border-b border-white/5 py-1.5">
    <span>{k}</span>
    <span className="text-white tabular-nums">{v}</span>
  </div>
);