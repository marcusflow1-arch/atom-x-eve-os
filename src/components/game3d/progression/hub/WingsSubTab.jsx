import React, { useEffect, useMemo, useState } from 'react';
import {
  attemptWingEnhancement,
  equipWings,
  grantWingImproveCharges,
  grantWingMaterial,
  grantWingProtection,
  setWingLevel,
  subscribeWings,
  unequipWings,
} from '../wingsStore';
import {
  MAX_WING_LEVEL,
  MAX_WING_PERCENT,
  WING_MATERIALS,
  WING_SAFE_PERCENT,
  getWingRisk,
} from '../wingsData';
import MaxOutButton from './devMaxOut';

const DEFAULT_MATERIAL_ID = 695;

export default function WingsSubTab() {
  const [wings, setWings] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [materialId, setMaterialId] = useState(DEFAULT_MATERIAL_ID);
  const [useProtection, setUseProtection] = useState(true);
  const [useImprove, setUseImprove] = useState(true);
  const [lastResult, setLastResult] = useState(null);

  useEffect(() => subscribeWings((snapshot) => {
    setWings(snapshot);
    setSelectedId((current) => current || snapshot.equippedPathId || Object.keys(snapshot.paths)[0]);
  }), []);

  const path = wings && selectedId ? wings.paths[selectedId] : null;
  const selectedMaterial = wings?.materials?.find((material) => material.itemId === materialId)
    || WING_MATERIALS.find((material) => material.itemId === materialId)
    || WING_MATERIALS[0];
  const improveActive = !!useImprove && (wings?.improveCharges || 0) > 0;
  const protectionActive = !!useProtection && (wings?.wingProtectionCharges || 0) > 0;
  const risk = useMemo(() => {
    if (!path) return null;
    return getWingRisk(path.stage, materialId, 0, improveActive);
  }, [path, materialId, improveActive]);

  if (!wings || !path || !risk) return null;

  const isEquipped = wings.equippedPathId === path.id;
  const materialStock = selectedMaterial?.stock || 0;
  const canAttempt = !path.destroyed
    && !path.isMaxLevel
    && wings.cp >= wings.attemptCost
    && materialStock > 0;

  const attempt = () => {
    const result = attemptWingEnhancement(path.id, {
      materialId,
      useWingProtection: protectionActive,
      useImproveCharge: improveActive,
    });
    setLastResult(result);
    window.setTimeout(() => setLastResult(null), 3500);
  };

  const seedDevMaterials = () => {
    [695, 696, 698, 2397].forEach((id) => grantWingMaterial(id, 25));
    grantWingMaterial(8106, 10);
    grantWingMaterial(826, 2);
    grantWingProtection(10);
    grantWingImproveCharges(10);
  };

  return (
    <div className="flex h-full text-white">
      <aside className="w-72 shrink-0 border-r border-white/[0.06] px-4 py-6 overflow-y-auto bg-black/10 backdrop-blur-xl">
        <div className="px-2 mb-4">
          <div className="text-[10px] tracking-[0.32em] uppercase text-white/35">Wing Arsenal</div>
          <div className="text-xs text-white/55 mt-2 leading-relaxed">
            Reinforce each wing independently from 0–120%. Halo no longer affects Wing progression.
          </div>
        </div>

        <div className="space-y-2">
          {Object.values(wings.paths).map((wing) => {
            const active = wing.id === path.id;
            return (
              <button
                key={wing.id}
                onClick={() => setSelectedId(wing.id)}
                className="w-full text-left rounded-xl px-3 py-3 transition-all"
                style={{
                  background: active ? `${wing.color}12` : 'rgba(255,255,255,0.025)',
                  border: `1px solid ${active ? `${wing.color}55` : 'rgba(255,255,255,0.06)'}`,
                  boxShadow: active ? `0 0 24px ${wing.color}12 inset` : 'none',
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{wing.icon}</div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold truncate">{wing.name}</div>
                    <div className="text-[10px] tracking-[0.18em] uppercase text-white/45 mt-1">
                      {wing.destroyed ? 'Destroyed' : `+${wing.reinforcementPercent}% · Stage ${wing.stage}/40`}
                    </div>
                  </div>
                  {wings.equippedPathId === wing.id && !wing.destroyed && (
                    <span className="text-[9px] tracking-[0.18em] uppercase" style={{ color: wing.color }}>Equipped</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-y-auto px-8 py-7">
        <section className="rounded-2xl border border-white/[0.07] bg-white/[0.025] backdrop-blur-2xl p-5">
          <div className="flex items-start gap-4">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shrink-0"
              style={{ background: `${path.color}12`, border: `1px solid ${path.color}55`, boxShadow: `0 0 36px ${path.color}18 inset` }}
            >
              {path.icon}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl font-semibold tracking-wide">{path.name}</h2>
                <span className="text-[10px] tracking-[0.2em] uppercase px-2 py-1 rounded-full bg-white/[0.05] text-white/55">
                  Reinforcement +{path.reinforcementPercent}%
                </span>
              </div>
              <div className="text-xs text-white/55 mt-2 max-w-2xl leading-relaxed">{path.description}</div>
              <div className="mt-3 text-[10px] tracking-[0.18em] uppercase text-white/35">
                Equipment multiplier <span className="text-white/80">×{path.equipmentMultiplier.toFixed(2)}</span>
                {' · '}Safe zone through <span className="text-white/80">+{WING_SAFE_PERCENT}%</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <MaxOutButton
                accent={path.color}
                label="Max Wing"
                onClick={() => {
                  setWingLevel(path.id, MAX_WING_LEVEL);
                  equipWings(path.id);
                }}
              />
              <MaxOutButton
                accent="#67e8f9"
                label="Seed Mats"
                onClick={seedDevMaterials}
                title="Editor only — seed Wing reinforcement materials and protection charges"
              />
              <button
                onClick={() => (isEquipped ? unequipWings() : equipWings(path.id))}
                disabled={path.destroyed}
                className="px-4 py-2 rounded-lg text-[10px] tracking-[0.2em] uppercase font-semibold disabled:opacity-30"
                style={{
                  background: isEquipped ? 'rgba(251,113,133,0.08)' : `${path.color}12`,
                  border: `1px solid ${isEquipped ? 'rgba(251,113,133,0.35)' : `${path.color}55`}`,
                  color: isEquipped ? '#fb7185' : path.color,
                }}
              >
                {path.destroyed ? 'Destroyed' : isEquipped ? 'Unequip' : 'Equip'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 mt-6">
            <Metric label="Contribution" value={wings.cp.toLocaleString()} sub={`${wings.attemptCost} CP / attempt`} />
            <Metric label="Reinforcement" value={`+${path.reinforcementPercent}%`} sub={`Stage ${path.stage}/${MAX_WING_LEVEL}`} accent={path.color} />
            <Metric label="Success" value={`${risk.successPercent}%`} sub={improveActive ? '+5% Improve charge active' : 'Current material roll'} accent={risk.successPercent >= 50 ? '#86efac' : '#fde68a'} />
            <Metric label="Destruction" value={`${risk.destroyPercent}%`} sub={risk.safe ? 'No destruction on this roll' : protectionActive ? 'Wing Protection armed' : 'Protection recommended'} accent={risk.destroyPercent > 0 ? '#fb7185' : '#86efac'} />
          </div>
        </section>

        {path.destroyed && (
          <section className="mt-4 rounded-xl border border-rose-400/30 bg-rose-500/[0.07] px-5 py-4">
            <div className="text-xs tracking-[0.2em] uppercase text-rose-300 font-semibold">Wing Destroyed</div>
            <div className="text-xs text-white/55 mt-2">
              This wing was lost on a failed reinforcement above the safe threshold. Reacquire the wing through loot or the market before reinforcing it again.
            </div>
          </section>
        )}

        <section className="mt-4 rounded-2xl border border-white/[0.07] bg-white/[0.02] backdrop-blur-2xl p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-[10px] tracking-[0.3em] uppercase text-white/40">Reinforcement Material</div>
              <div className="text-xs text-white/55 mt-1">Choose the material that controls the stage jump and failure behavior.</div>
            </div>
            <div className="text-[10px] tracking-[0.18em] uppercase text-white/35">
              Target <span className="text-white/80">+{risk.targetPercent}%</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4">
            {wings.materials.map((material) => {
              const active = material.itemId === materialId;
              return (
                <button
                  key={material.itemId}
                  onClick={() => setMaterialId(material.itemId)}
                  className="rounded-xl p-3 text-left transition-all"
                  style={{
                    background: active ? `${path.color}12` : 'rgba(255,255,255,0.025)',
                    border: `1px solid ${active ? `${path.color}55` : 'rgba(255,255,255,0.07)'}`,
                  }}
                >
                  <div className="flex justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold text-white">{material.label}</div>
                      <div className="text-[10px] text-white/40 mt-1">Item {material.itemId} · {material.shortLabel}</div>
                    </div>
                    <div className="text-sm tabular-nums" style={{ color: active ? path.color : 'rgba(255,255,255,0.55)' }}>
                      ×{material.stock}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <ToggleCard
              label="Wing Protection"
              detail={`${wings.wingProtectionCharges} charges · converts destruction into -3%`}
              active={protectionActive}
              disabled={wings.wingProtectionCharges <= 0 || risk.destroyPercent <= 0}
              onClick={() => setUseProtection((value) => !value)}
              accent="#fb7185"
            />
            <ToggleCard
              label="Improve Charge"
              detail={`${wings.improveCharges} charges · +5% success chance`}
              active={improveActive}
              disabled={wings.improveCharges <= 0 || selectedMaterial.guaranteed}
              onClick={() => setUseImprove((value) => !value)}
              accent="#67e8f9"
            />
          </div>

          <div className="flex items-center gap-3 mt-5">
            <button
              onClick={attempt}
              disabled={!canAttempt}
              className="min-w-52 px-5 py-3 rounded-xl text-[11px] tracking-[0.22em] uppercase font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: `${path.color}18`, border: `1px solid ${path.color}66`, color: path.color }}
            >
              {path.isMaxLevel
                ? `Max +${MAX_WING_PERCENT}%`
                : path.destroyed
                  ? 'Wing Destroyed'
                  : wings.cp < wings.attemptCost
                    ? `Need ${wings.attemptCost - wings.cp} CP`
                    : materialStock <= 0
                      ? `Need Item ${selectedMaterial.itemId}`
                      : `Reinforce → +${risk.targetPercent}%`}
            </button>
            <div className="text-[10px] leading-relaxed text-white/40">
              Costs <span className="text-white/75">{wings.attemptCost} CP</span> and one selected material. Failure normally drops one stage.
              Above +{WING_SAFE_PERCENT}%, the destruction roll is evaluated after a failed success roll.
            </div>
          </div>

          {lastResult && (
            <OutcomeBanner result={lastResult} path={path} />
          )}
        </section>

        <section className="mt-4 grid grid-cols-3 gap-3 pb-8">
          <Rule title="0–60%" value="Safe Reinforcement" detail="A failed roll drops one 3% stage, but does not destroy the wing." />
          <Rule title="63–120%" value="High-Risk Reinforcement" detail="Failed rolls can trigger a separate destruction check. Wing Protection can absorb that destruction." />
          <Rule title="Protected Material" value="No-Loss Failure" detail="Item 8106 attempts +3%. If it misses, reinforcement stays exactly where it was." />
        </section>
      </main>
    </div>
  );
}

function Metric({ label, value, sub, accent = '#fff' }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-black/15 px-4 py-3">
      <div className="text-[9px] tracking-[0.22em] uppercase text-white/35">{label}</div>
      <div className="text-xl font-light tabular-nums mt-1" style={{ color: accent }}>{value}</div>
      <div className="text-[9px] text-white/35 mt-1">{sub}</div>
    </div>
  );
}

function ToggleCard({ label, detail, active, disabled, onClick, accent }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded-xl p-3 text-left disabled:opacity-30"
      style={{
        background: active ? `${accent}10` : 'rgba(255,255,255,0.02)',
        border: `1px solid ${active ? `${accent}55` : 'rgba(255,255,255,0.07)'}`,
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold">{label}</div>
          <div className="text-[10px] text-white/40 mt-1">{detail}</div>
        </div>
        <div className="text-[9px] tracking-[0.16em] uppercase" style={{ color: active ? accent : 'rgba(255,255,255,0.3)' }}>
          {active ? 'Armed' : 'Off'}
        </div>
      </div>
    </button>
  );
}

function OutcomeBanner({ result, path }) {
  if (!result.ok) {
    return (
      <div className="mt-4 rounded-xl border border-rose-400/25 bg-rose-500/[0.06] px-4 py-3 text-xs text-rose-200">
        Reinforcement blocked: {String(result.reason || 'requirements not met').replaceAll('_', ' ')}.
      </div>
    );
  }

  const labels = {
    success: `Success — ${path.name} is now +${result.percent}%`,
    failed: `Failure — reinforcement fell to +${result.percent}%`,
    protected_failure: `Protection consumed — destruction prevented, reinforcement fell to +${result.percent}%`,
    destroyed: 'Wing destroyed — reacquire it before reinforcing again',
    no_change: `Protected material failed — ${path.name} remained unchanged`,
  };
  const good = result.outcome === 'success' || result.outcome === 'no_change' || result.outcome === 'protected_failure';

  return (
    <div
      className="mt-4 rounded-xl px-4 py-3 text-xs tracking-[0.12em] uppercase"
      style={{
        background: good ? 'rgba(134,239,172,0.07)' : 'rgba(251,113,133,0.07)',
        border: `1px solid ${good ? 'rgba(134,239,172,0.25)' : 'rgba(251,113,133,0.25)'}`,
        color: good ? '#bbf7d0' : '#fecdd3',
      }}
    >
      {labels[result.outcome] || result.outcome}
    </div>
  );
}

function Rule({ title, value, detail }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="text-[9px] tracking-[0.22em] uppercase text-white/35">{title}</div>
      <div className="text-sm font-semibold mt-1">{value}</div>
      <div className="text-[10px] leading-relaxed text-white/40 mt-2">{detail}</div>
    </div>
  );
}
