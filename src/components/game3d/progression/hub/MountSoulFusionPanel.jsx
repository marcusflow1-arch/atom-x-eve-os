// Wuxia blueprint §4 — Mount Soul Fusion in the Character Hub: the registered
// mount's combination share, its seven gear slots (Stage 0–20) and absorption.
import { useEffect, useState } from 'react';
import ProgressionReview from './ProgressionReview';
import {
  absorbAXEMount,
  previewAXEMountGearRefine,
  refineAXEMountGear,
  releaseAXEMountFusion,
  tickAXEMountFusion,
} from '../../axe/progression/AXEMountStore';
import { AXE_MOUNT_FUSION_CONFIG, AXE_MOUNT_GEAR_SLOTS } from '../../axe/progression/AXEMountFusionSystem';

const MAX_SHARE = AXE_MOUNT_FUSION_CONFIG.baseShareMax + AXE_MOUNT_GEAR_SLOTS.length * AXE_MOUNT_FUSION_CONFIG.sharePerMaxedGear;
const minutesLeft = (ms) => Math.max(0, Math.ceil(ms / 60000));

export default function MountSoulFusionPanel({ state }) {
  const [review, setReview] = useState(null);
  const [result, setResult] = useState(null);
  const [, setNow] = useState(Date.now());
  const fusion = state.fusionState || { active: false };
  useEffect(() => {
    if (!fusion.active) return undefined;
    const id = setInterval(() => { tickAXEMountFusion(); setNow(Date.now()); }, 15000);
    return () => clearInterval(id);
  }, [fusion.active]);

  const mount = state.mounts.find((m) => m.instanceId === state.registeredMountId);
  if (!mount) return null;
  const share = mount.combination || { base: 0, gear: 0, total: 0, maxedPieces: 0, growthPercent: 0 };
  const gear = mount.gear || {};
  const pills = Object.values(AXE_MOUNT_FUSION_CONFIG.pills);

  const requestRefine = (slot) => {
    const stage = gear[slot.id]?.stage || 0;
    const preview = previewAXEMountGearRefine(mount.instanceId, slot.id);
    if (!preview.ok) return setResult(preview);
    if (!preview.canAfford) return setResult({ ok: false, reason: 'INSUFFICIENT_MATERIALS' });
    setReview({
      action: 'refine', slotId: slot.id, expectedStage: stage, cost: preview.cost,
      title: `Refine ${slot.label} to Stage ${stage + 1}`,
      description: preview.nextStage === AXE_MOUNT_FUSION_CONFIG.maxGearStage
        ? `Stage 20 completes this piece: +${AXE_MOUNT_FUSION_CONFIG.sharePerMaxedGear}% combination share.`
        : `Every piece at Stage 20 adds +${AXE_MOUNT_FUSION_CONFIG.sharePerMaxedGear}% combination share.`,
    });
  };
  const requestAbsorb = (pill) => setReview({
    action: 'absorb', pillId: pill.id, cost: { [pill.label]: 1 }, confirmLabel: 'Absorb',
    title: `Absorb ${mount.definition?.name || 'your mount'} for ${pill.minutes} minutes`,
    description: `Its soul merges with your gear: equipment stats ×${(1 + share.total / 100).toFixed(2)} (+${share.total}%). `
      + 'The mount cannot be ridden while absorbed. Another pill adds its time.',
  });
  const confirm = (pending) => {
    const r = pending.action === 'refine'
      ? refineAXEMountGear(mount.instanceId, pending.slotId, { confirmed: true, expectedStage: pending.expectedStage })
      : absorbAXEMount(pending.pillId);
    setResult(r);
    setReview(null);
  };

  return (
    <section className="mt-5 rounded-2xl border border-white/10 bg-slate-950/55 p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.35em] text-amber-200/70">Mount Soul Fusion</div>
          <h3 className="mt-1 text-lg font-semibold">{mount.definition?.name || 'Registered mount'}</h3>
          <p className="mt-1 max-w-2xl text-sm text-white/60">
            Absorb the registered mount with a pill and its combination share multiplies your equipment stats.
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-semibold tabular-nums">{share.total}%</div>
          <div className="text-xs text-white/50">of {MAX_SHARE}% combination share</div>
        </div>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <div className="h-full rounded-full bg-amber-200/70" style={{ width: `${(share.total / MAX_SHARE) * 100}%` }} />
      </div>
      <div className="mt-2 flex flex-wrap gap-4 text-xs text-white/55">
        <span>Base {share.base}% <span className="text-white/35">({share.growthPercent}% growth of {AXE_MOUNT_FUSION_CONFIG.baseShareMax}%)</span></span>
        <span>Gear +{share.gear}% <span className="text-white/35">({share.maxedPieces}/{AXE_MOUNT_GEAR_SLOTS.length} pieces at Stage {AXE_MOUNT_FUSION_CONFIG.maxGearStage})</span></span>
      </div>
      {share.growthPercent < 100 && (
        <p className="mt-2 text-xs text-amber-100/70">
          Ride, hunt and duel with this mount to grow it: its base share rises with growth, up to {AXE_MOUNT_FUSION_CONFIG.baseShareMax}% at 100%.
          {share.total === 0 ? ' Until then an absorption only brings the aura and the soul strikes.' : ''}
        </p>
      )}

      <ProgressionReview review={review} onCancel={() => setReview(null)} onConfirm={confirm} />
      {result && (
        <div role="status" className="mt-3 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/80">
          {result.ok ? result.message || 'Done.' : result.reason?.replaceAll('_', ' ')}
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {AXE_MOUNT_GEAR_SLOTS.map((slot) => {
          const stage = gear[slot.id]?.stage || 0;
          const maxed = stage >= AXE_MOUNT_FUSION_CONFIG.maxGearStage;
          return (
            <div key={slot.id} className={`rounded-xl border p-3 ${maxed ? 'border-amber-200/30 bg-amber-200/[0.06]' : 'border-white/10 bg-white/[0.03]'}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-white/85">{slot.label}</span>
                <span className="text-xs tabular-nums text-white/55">{stage}/{AXE_MOUNT_FUSION_CONFIG.maxGearStage}</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                <div className="h-full rounded-full bg-cyan-200/60" style={{ width: `${(stage / AXE_MOUNT_FUSION_CONFIG.maxGearStage) * 100}%` }} />
              </div>
              <button
                type="button"
                disabled={maxed}
                onClick={() => requestRefine(slot)}
                className="mt-2 w-full rounded-lg bg-white/10 px-2 py-1.5 text-xs font-semibold text-white/75 disabled:opacity-50"
              >
                {maxed ? `+${AXE_MOUNT_FUSION_CONFIG.sharePerMaxedGear}% share` : 'Refine'}
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {fusion.active ? (
          <>
            <span className="rounded-lg border border-amber-200/30 bg-amber-200/10 px-3 py-2 text-sm text-amber-100">
              Absorbed: {fusion.mountName} · {minutesLeft(fusion.remainingMs)} min left
            </span>
            {pills.map((pill) => (
              <button key={pill.id} type="button" disabled={!state.materials?.[pill.id]} onClick={() => requestAbsorb(pill)}
                className="rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-white/75 disabled:opacity-50">
                +{pill.minutes} min ({state.materials?.[pill.id] || 0})
              </button>
            ))}
            <button type="button" onClick={() => setResult(releaseAXEMountFusion())}
              className="rounded-lg border border-white/20 px-3 py-2 text-xs text-white/70">Release</button>
          </>
        ) : pills.map((pill) => (
          <button key={pill.id} type="button" disabled={!state.materials?.[pill.id]} onClick={() => requestAbsorb(pill)}
            className="rounded-lg bg-amber-200/90 px-3 py-2 text-xs font-semibold text-slate-950 disabled:bg-white/10 disabled:text-white/40">
            Absorb · {pill.minutes} min ({state.materials?.[pill.id] || 0})
          </button>
        ))}
      </div>
    </section>
  );
}
