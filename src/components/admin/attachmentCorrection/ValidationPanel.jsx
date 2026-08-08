import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ShieldCheck, Camera, GitCompare, Save, Loader2, ScanSearch } from 'lucide-react';

export default function ValidationPanel({
  correctionType, setCorrectionType, correctionTypes,
  notes, setNotes, approved, setApproved,
  issueNotes, keyframes,
  onValidate, onCapture, onCompare, onSave, busy, action,
}) {
  return (
    <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
      <h2 className="text-xl font-bold flex items-center gap-2 mb-1"><ScanSearch className="w-5 h-5 text-cyan-500" /> Validation & Save</h2>
      <p className="text-slate-400 text-sm mb-4">Validate the corrected preview, capture keyframes, generate a comparison, and commit the fix.</p>
      <div className="flex flex-wrap gap-3 mb-4">
        <Button onClick={onValidate} disabled={busy} className="bg-cyan-600 hover:bg-cyan-700">
          {busy && action === 'validate' ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Validating…</> : <><ShieldCheck className="w-4 h-4 mr-2" /> Run quick validation</>}
        </Button>
        <Button onClick={onCapture} disabled={busy} variant="outline" className="border-slate-600 text-slate-200">
          {busy && action === 'capture' ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Capturing…</> : <><Camera className="w-4 h-4 mr-2" /> Capture keyframes</>}
        </Button>
        <Button onClick={onCompare} disabled={busy} variant="outline" className="border-slate-600 text-slate-200">
          {busy && action === 'compare' ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Comparing…</> : <><GitCompare className="w-4 h-4 mr-2" /> Generate before/after comparison</>}
        </Button>
      </div>

      {issueNotes && (
        <div className="bg-slate-800/40 border border-slate-700 rounded-lg p-3 mb-4 text-sm text-slate-200">
          <div className="text-xs text-slate-400 mb-1">Issue notes (from validation)</div>
          {issueNotes}
        </div>
      )}

      {keyframes.length > 0 && (
        <div className="mb-4">
          <div className="text-xs text-slate-400 mb-1">Captured keyframes</div>
          <div className="flex gap-2">
            {keyframes.map((k, i) => (<img key={i} src={k} alt="" className="w-24 aspect-video object-cover rounded border border-slate-700" />))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm text-slate-400 mb-1">Save as</label>
          <Select value={correctionType} onValueChange={setCorrectionType}>
            <SelectTrigger className="bg-slate-900 border-slate-700"><SelectValue /></SelectTrigger>
            <SelectContent>{correctionTypes.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between py-2">
          <span className="text-sm text-slate-300">Mark as approved</span>
          <Switch checked={approved} onCheckedChange={setApproved} />
        </div>
      </div>
      <div className="mb-4">
        <label className="block text-sm text-slate-400 mb-1">Admin notes / comments</label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Describe the issue and the correction applied…" className="bg-slate-900 border-slate-700" />
      </div>
      <Button onClick={onSave} disabled={busy} className="bg-violet-600 hover:bg-violet-700">
        {busy && action === 'save' ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</> : <><Save className="w-4 h-4 mr-2" /> Save correction</>}
      </Button>
    </section>
  );
}