// ─── Sandbox Inspector ────────────────────────────────────────────────────
// Numeric controls for the selected placement: position, rotation (deg),
// scale, collision toggle + radius.

import React from 'react';
import { useSandboxStore, useSelectedPlacement } from './sandboxStore';

const Row = ({ label, children }) => (
  <div className="flex items-center gap-2">
    <label className="w-14 text-xs text-slate-400">{label}</label>
    <div className="flex-1 grid grid-cols-3 gap-1">{children}</div>
  </div>
);

const NumInput = ({ value, onChange, step = 0.1, disabled }) => (
  <input
    type="number"
    step={step}
    value={Number.isFinite(value) ? Number(value.toFixed(3)) : 0}
    onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
    disabled={disabled}
    className="bg-slate-800 border border-slate-700 rounded px-1.5 py-1 text-xs text-slate-200 disabled:opacity-50"
  />
);

const RAD2DEG = 180 / Math.PI;
const DEG2RAD = Math.PI / 180;

export default function SandboxInspector() {
  const p = useSelectedPlacement();
  const update = useSandboxStore((s) => s.updatePlacement);

  if (!p) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
        <h3 className="text-sm font-semibold text-slate-200 mb-2">Inspector</h3>
        <p className="text-xs text-slate-500">Select an object to edit its transform.</p>
      </div>
    );
  }

  const disabled = !!p.locked;

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200">Inspector</h3>
        {p.locked && <span className="text-[10px] uppercase tracking-wider text-amber-400">Locked</span>}
      </div>

      <Row label="Position">
        <NumInput value={p.x} onChange={(v) => update(p.id, { x: v })} disabled={disabled} />
        <NumInput value={p.y} onChange={(v) => update(p.id, { y: v })} disabled={disabled} />
        <NumInput value={p.z} onChange={(v) => update(p.id, { z: v })} disabled={disabled} />
      </Row>

      <Row label="Rotation°">
        <NumInput
          value={(p.rotX || 0) * RAD2DEG}
          onChange={(v) => update(p.id, { rotX: v * DEG2RAD })}
          step={1}
          disabled={disabled}
        />
        <NumInput
          value={(p.rotY || 0) * RAD2DEG}
          onChange={(v) => update(p.id, { rotY: v * DEG2RAD })}
          step={1}
          disabled={disabled}
        />
        <NumInput
          value={(p.rotZ || 0) * RAD2DEG}
          onChange={(v) => update(p.id, { rotZ: v * DEG2RAD })}
          step={1}
          disabled={disabled}
        />
      </Row>

      <Row label="Scale">
        <NumInput value={p.scaleX} onChange={(v) => update(p.id, { scaleX: Math.max(0.01, v) })} disabled={disabled} />
        <NumInput value={p.scaleY} onChange={(v) => update(p.id, { scaleY: Math.max(0.01, v) })} disabled={disabled} />
        <NumInput value={p.scaleZ} onChange={(v) => update(p.id, { scaleZ: Math.max(0.01, v) })} disabled={disabled} />
      </Row>

      <div className="pt-2 border-t border-slate-800 space-y-2">
        <label className="flex items-center gap-2 text-xs text-slate-300">
          <input
            type="checkbox"
            checked={p.collides}
            onChange={(e) => update(p.id, { collides: e.target.checked })}
            disabled={disabled}
          />
          Has collision
        </label>
        <div className="flex items-center gap-2">
          <label className="w-20 text-xs text-slate-400">Collider R</label>
          <NumInput
            value={p.colliderRadius}
            onChange={(v) => update(p.id, { colliderRadius: Math.max(0, v) })}
            disabled={disabled || !p.collides}
            step={0.05}
          />
        </div>
      </div>
    </div>
  );
}