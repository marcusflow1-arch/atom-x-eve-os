import React from 'react';
import { SlidersHorizontal, Eye, History, Loader2, Box } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RIG_OPTIONS, PROP_OPTIONS, ATTACHMENT_RULES } from './aclShared';

export default function CorrectionSetupPanel({
  title, setTitle,
  characterModel, setCharacterModel,
  rigProfile, setRigProfile,
  prop, setProp,
  attachmentRule, setAttachmentRule,
  animationClip, setAnimationClip,
  modelOptions, clipOptions,
  previewImage,
  onPreviewBefore, onPreviewAfter, busy, action,
}) {
  return (
    <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
      <h2 className="text-xl font-bold flex items-center gap-2 mb-1">
        <SlidersHorizontal className="w-5 h-5 text-cyan-500" /> Setup & Preview
      </h2>
      <p className="text-slate-400 text-sm mb-4">Load a character, prop, rig profile, attachment rule, and animation clip to begin correcting.</p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Session title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={`${characterModel || 'Character'} · ${prop || 'Prop'}`} className="bg-slate-900 border-slate-700" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Character model</label>
              <Input list="acl-models" value={characterModel} onChange={(e) => setCharacterModel(e.target.value)} placeholder="e.g. Y-Bot, Warrior" className="bg-slate-900 border-slate-700" />
              <datalist id="acl-models">{modelOptions.map((o) => <option key={o} value={o} />)}</datalist>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Animation clip</label>
              <Input list="acl-clips" value={animationClip} onChange={(e) => setAnimationClip(e.target.value)} placeholder="e.g. idle, attack_01" className="bg-slate-900 border-slate-700" />
              <datalist id="acl-clips">{clipOptions.map((o) => <option key={o} value={o} />)}</datalist>
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
            <div className="md:col-span-2">
              <label className="block text-sm text-slate-400 mb-1">Attachment rule</label>
              <Select value={attachmentRule} onValueChange={setAttachmentRule}>
                <SelectTrigger className="bg-slate-900 border-slate-700"><SelectValue /></SelectTrigger>
                <SelectContent>{ATTACHMENT_RULES.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 pt-1">
            <Button onClick={onPreviewBefore} disabled={busy || !characterModel || !prop} variant="outline" className="border-slate-600 text-slate-200">
              {busy && action === 'preview-before' ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Rendering…</> : <><History className="w-4 h-4 mr-2" /> Preview Before</>}
            </Button>
            <Button onClick={onPreviewAfter} disabled={busy || !characterModel || !prop} className="bg-cyan-600 hover:bg-cyan-700">
              {busy && action === 'preview-after' ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Rendering…</> : <><Eye className="w-4 h-4 mr-2" /> Preview After</>}
            </Button>
          </div>
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Preview viewport</label>
          <div className="aspect-video bg-slate-950 border border-slate-700 rounded-xl overflow-hidden flex items-center justify-center">
            {previewImage
              ? <img src={previewImage} alt="preview" className="w-full h-full object-cover" />
              : <div className="text-slate-600 text-sm flex flex-col items-center gap-2"><Box className="w-8 h-8" /> Preview will render here</div>}
          </div>
        </div>
      </div>
    </section>
  );
}