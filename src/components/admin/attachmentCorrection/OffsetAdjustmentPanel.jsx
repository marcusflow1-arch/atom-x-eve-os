import React from 'react';
import { RotateCcw, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function NumField({ label, value, onChange, step, base }) {
  return (
    <div>
      <label className="block text-xs text-slate-400 mb-1">{label}{base !== undefined && <span className="text-slate-600 ml-1">(base {base})</span>}</label>
      <Input type="number" step={step} value={value} onChange={(e) => onChange(+e.target.value || 0)} className="bg-slate-900 border-slate-700" />
    </div>
  );
}

export default function OffsetAdjustmentPanel({ base, corrected, setCorrected, onReset, onApply, onSetBase, busy, action }) {
  const set = (k, v) => setCorrected((c) => ({ ...c, [k]: v }));
  return (
    <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
      <h2 className="text-xl font-bold mb-1">Offset Adjustment</h2>
      <p className="text-slate-400 text-sm mb-4">Edit position, rotation, scale, and off-hand offsets. Apply to regenerate the preview.</p>
      <div className="space-y-4">
        <div>
          <div className="text-sm font-semibold text-slate-300 mb-2">Position</div>
          <div className="grid grid-cols-3 gap-3">
            <NumField label="X" value={corrected.posX} onChange={(v) => set('posX', v)} step={0.01} base={base.posX} />
            <NumField label="Y" value={corrected.posY} onChange={(v) => set('posY', v)} step={0.01} base={base.posY} />
            <NumField label="Z" value={corrected.posZ} onChange={(v) => set('posZ', v)} step={0.01} base={base.posZ} />
          </div>
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-300 mb-2">Rotation (degrees)</div>
          <div className="grid grid-cols-3 gap-3">
            <NumField label="X" value={corrected.rotX} onChange={(v) => set('rotX', v)} step={1} base={base.rotX} />
            <NumField label="Y" value={corrected.rotY} onChange={(v) => set('rotY', v)} step={1} base={base.rotY} />
            <NumField label="Z" value={corrected.rotZ} onChange={(v) => set('rotZ', v)} step={1} base={base.rotZ} />
          </div>
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-300 mb-2">Scale</div>
          <div className="grid grid-cols-3 gap-3">
            <NumField label="X" value={corrected.scaleX} onChange={(v) => set('scaleX', v)} step={0.05} base={base.scaleX} />
            <NumField label="Y" value={corrected.scaleY} onChange={(v) => set('scaleY', v)} step={0.05} base={base.scaleY} />
            <NumField label="Z" value={corrected.scaleZ} onChange={(v) => set('scaleZ', v)} step={0.05} base={base.scaleZ} />
          </div>
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-300 mb-2">Off-hand support position</div>
          <div className="grid grid-cols-3 gap-3">
            <NumField label="X" value={corrected.offPosX} onChange={(v) => set('offPosX', v)} step={0.01} base={base.offPosX} />
            <NumField label="Y" value={corrected.offPosY} onChange={(v) => set('offPosY', v)} step={0.01} base={base.offPosY} />
            <NumField label="Z" value={corrected.offPosZ} onChange={(v) => set('offPosZ', v)} step={0.01} base={base.offPosZ} />
          </div>
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-300 mb-2">Off-hand support rotation (degrees)</div>
          <div className="grid grid-cols-3 gap-3">
            <NumField label="X" value={corrected.offRotX} onChange={(v) => set('offRotX', v)} step={1} base={base.offRotX} />
            <NumField label="Y" value={corrected.offRotY} onChange={(v) => set('offRotY', v)} step={1} base={base.offRotY} />
            <NumField label="Z" value={corrected.offRotZ} onChange={(v) => set('offRotZ', v)} step={1} base={base.offRotZ} />
          </div>
        </div>
        <div className="flex flex-wrap gap-3 pt-2">
          <Button onClick={onApply} disabled={busy} className="bg-cyan-600 hover:bg-cyan-700">
            {busy && action === 'preview-after' ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Applying…</> : <><Check className="w-4 h-4 mr-2" /> Apply & Preview</>}
          </Button>
          <Button onClick={onReset} variant="outline" className="border-slate-600 text-slate-200"><RotateCcw className="w-4 h-4 mr-2" /> Reset to base</Button>
          <Button onClick={onSetBase} variant="outline" className="border-slate-600 text-slate-200"><Check className="w-4 h-4 mr-2" /> Set base from current</Button>
        </div>
      </div>
    </section>
  );
}