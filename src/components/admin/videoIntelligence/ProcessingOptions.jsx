import React from 'react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SAMPLING_MODES, ANALYSIS_DEPTH } from './viShared';

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm text-slate-400 mb-1">{label}</label>
      {children}
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-slate-300">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

export default function ProcessingOptions({ options, setOptions }) {
  const set = (k, v) => setOptions((o) => ({ ...o, [k]: v }));
  return (
    <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
      <h2 className="text-xl font-bold mb-1">Processing Options</h2>
      <p className="text-slate-400 text-sm mb-4">Configure how frames are sampled and how deep the analysis runs.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Frame sampling mode">
          <Select value={options.sampling_mode} onValueChange={(v) => set('sampling_mode', v)}>
            <SelectTrigger className="bg-slate-900 border-slate-700"><SelectValue /></SelectTrigger>
            <SelectContent>
              {SAMPLING_MODES.map((m) => (<SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Analysis depth">
          <Select value={options.analysis_depth} onValueChange={(v) => set('analysis_depth', v)}>
            <SelectTrigger className="bg-slate-900 border-slate-700"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ANALYSIS_DEPTH.map((m) => (<SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Sample interval (seconds)">
          <Input
            type="number"
            min={1}
            value={options.sample_interval_seconds}
            onChange={(e) => set('sample_interval_seconds', Math.max(1, +e.target.value || 1))}
            disabled={options.sampling_mode === 'scene'}
            className="bg-slate-900 border-slate-700"
          />
        </Field>
        <Field label="Max frames to extract">
          <Input
            type="number"
            min={1}
            value={options.max_frames}
            onChange={(e) => set('max_frames', Math.max(1, +e.target.value || 1))}
            className="bg-slate-900 border-slate-700"
          />
        </Field>
      </div>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
        <Toggle label="Include transcript / captions" checked={options.include_transcript} onChange={(v) => set('include_transcript', v)} />
        <Toggle label="Run OCR on visible text" checked={options.run_ocr} onChange={(v) => set('run_ocr', v)} />
        <Toggle label="Detect objects / entities" checked={options.detect_objects} onChange={(v) => set('detect_objects', v)} />
        <Toggle label="Auto-generate fallback package" checked={options.auto_fallback_package} onChange={(v) => set('auto_fallback_package', v)} />
        <Toggle label="Save results to database" checked={options.save_to_database} onChange={(v) => set('save_to_database', v)} />
      </div>
    </section>
  );
}