import React from 'react';
import { ShieldCheck, Package, Layers, Loader2, Box } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { RIG_OPTIONS, PROP_OPTIONS, ATTACHMENT_RULES, FRAME_SAMPLING_MODES } from './avvShared';

export default function ValidationSetupPanel({
  title, setTitle,
  characterModel, setCharacterModel,
  rigProfile, setRigProfile,
  prop, setProp,
  attachmentRule, setAttachmentRule,
  animationClip, setAnimationClip,
  options, setOptions,
  modelOptions, clipOptions,
  onRun, onPackage, onFull, busy, action, hasSession,
}) {
  const set = (k, v) => setOptions((o) => ({ ...o, [k]: v }));
  return (
    <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
      <h2 className="text-xl font-bold flex items-center gap-2 mb-1">
        <ShieldCheck className="w-5 h-5 text-cyan-500" /> Validation Setup
      </h2>
      <p className="text-slate-400 text-sm mb-4">Choose the character, prop, attachment rule, and animation to validate across sampled frames.</p>
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-slate-400 mb-1">Session title</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={`${characterModel || 'Character'} · ${prop || 'Prop'}`} className="bg-slate-900 border-slate-700" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Character model</label>
            <Input list="avv-models" value={characterModel} onChange={(e) => setCharacterModel(e.target.value)} placeholder="e.g. Y-Bot, Warrior" className="bg-slate-900 border-slate-700" />
            <datalist id="avv-models">{modelOptions.map((o) => <option key={o} value={o} />)}</datalist>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Animation clip</label>
            <Input list="avv-clips" value={animationClip} onChange={(e) => setAnimationClip(e.target.value)} placeholder="e.g. idle, attack_01" className="bg-slate-900 border-slate-700" />
            <datalist id="avv-clips">{clipOptions.map((o) => <option key={o} value={o} />)}</datalist>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Rig profile</label>
            <Select value={rigProfile} onValueChange={setRigProfile}>
              <SelectTrigger className="bg-slate-900 border-slate-700"><SelectValue /></SelectTrigger>
              <SelectContent>{RIG_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Prop / weapon</label>
            <Select value={prop} onValueChange={setProp}>
              <SelectTrigger className="bg-slate-900 border-slate-700"><SelectValue /></SelectTrigger>
              <SelectContent>{PROP_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Attachment rule</label>
            <Select value={attachmentRule} onValueChange={setAttachmentRule}>
              <SelectTrigger className="bg-slate-900 border-slate-700"><SelectValue /></SelectTrigger>
              <SelectContent>{ATTACHMENT_RULES.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Frame sampling mode</label>
            <Select value={options.frame_sampling_mode} onValueChange={(v) => set('frame_sampling_mode', v)}>
              <SelectTrigger className="bg-slate-900 border-slate-700"><SelectValue /></SelectTrigger>
              <SelectContent>{FRAME_SAMPLING_MODES.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Frame interval (seconds)</label>
            <Input type="number" min={0.05} step={0.05} value={options.frame_interval_seconds} onChange={(e) => set('frame_interval_seconds', Math.max(0.05, +e.target.value || 0.05))} className="bg-slate-900 border-slate-700" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Max frames</label>
            <Input type="number" min={1} max={60} value={options.max_frames} onChange={(e) => set('max_frames', Math.max(1, Math.min(60, +e.target.value || 1)))} className="bg-slate-900 border-slate-700" />
          </div>
        </div>
        <div className="flex items-center justify-between py-1.5">
          <span className="text-sm text-slate-300 flex items-center gap-2"><Box className="w-4 h-4 text-slate-500" /> AI issue detection (vision pass per frame)</span>
          <Switch checked={options.ai_issue_detection} onCheckedChange={(v) => set('ai_issue_detection', v)} />
        </div>
        <div className="flex flex-wrap gap-3 pt-2">
          <Button onClick={onRun} disabled={busy || !characterModel || !prop} className="bg-cyan-600 hover:bg-cyan-700">
            {busy && action === 'validation' ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Validating…</> : <><ShieldCheck className="w-4 h-4 mr-2" /> Run Validation</>}
          </Button>
          <Button onClick={onPackage} disabled={busy || !hasSession} variant="outline" className="border-slate-600 text-slate-200">
            {busy && action === 'package' ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Packaging…</> : <><Package className="w-4 h-4 mr-2" /> Generate Frame Package</>}
          </Button>
          <Button onClick={onFull} disabled={busy || !characterModel || !prop} className="bg-violet-600 hover:bg-violet-700">
            {busy ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Running…</> : <><Layers className="w-4 h-4 mr-2" /> Run Validation + Package</>}
          </Button>
        </div>
      </div>
    </section>
  );
}