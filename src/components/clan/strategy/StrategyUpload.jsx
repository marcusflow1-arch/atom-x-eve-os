import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';

export default function StrategyUpload({ clanId, gameId, canSetVisibility, onCreated }) {
  const [title, setTitle] = React.useState('');
  const [summary, setSummary] = React.useState('');
  const [steps, setSteps] = React.useState(['']);
  const [mediaFiles, setMediaFiles] = React.useState([]);
  const [voiceFiles, setVoiceFiles] = React.useState([]);
  const [visibility, setVisibility] = React.useState('clan');
  const [loading, setLoading] = React.useState(false);

  const addStep = () => setSteps((items) => [...items, '']);
  const updateStep = (index, value) => setSteps((items) => items.map((item, i) => i === index ? value : item));
  const removeStep = (index) => setSteps((items) => items.filter((_, i) => i !== index));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!title.trim() || !clanId || !gameId) return;
    setLoading(true);
    try {
      const mediaUrls = [];
      for (const file of mediaFiles) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        mediaUrls.push(file_url);
      }
      const voiceUrls = [];
      for (const file of voiceFiles) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        voiceUrls.push(file_url);
      }
      await base44.entities.Strategy.create({
        clan_id: clanId,
        game_id: gameId,
        title: title.trim(),
        summary: summary.trim(),
        steps: steps.map((step) => step.trim()).filter(Boolean),
        media_urls: mediaUrls,
        voice_urls: voiceUrls,
        visibility: canSetVisibility ? visibility : 'clan',
      });
      setTitle('');
      setSummary('');
      setSteps(['']);
      setMediaFiles([]);
      setVoiceFiles([]);
      setVisibility('clan');
      onCreated?.();
    } finally {
      setLoading(false);
    }
  };

  return <form onSubmit={handleSubmit} className="w-full rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4 text-left">
    <div className="mb-4"><div className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/28">Clan tactics</div><h4 className="mt-1 text-sm font-semibold text-white/80">Publish a game plan</h4><p className="mt-1 text-[10px] text-white/30">Document farming methods, boss tactics, achievement plans or meeting strategy for this game.</p></div>
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tactic title" className="border-white/[0.07] bg-black/10 text-white" />
      <Input value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Short objective or summary" className="border-white/[0.07] bg-black/10 text-white" />
      {canSetVisibility && <Select value={visibility} onValueChange={setVisibility}><SelectTrigger className="border-white/[0.07] bg-black/10 text-white"><SelectValue placeholder="Visibility" /></SelectTrigger><SelectContent><SelectItem value="clan">Clan only</SelectItem><SelectItem value="public">Public</SelectItem></SelectContent></Select>}
      <div className="space-y-2 md:col-span-2"><div className="text-[10px] font-semibold text-white/45">Execution steps</div>{steps.map((step, index) => <div key={index} className="flex items-center gap-2"><Input value={step} onChange={(e) => updateStep(index, e.target.value)} placeholder={`Step ${index + 1}`} className="border-white/[0.07] bg-black/10 text-white" />{steps.length > 1 && <Button type="button" variant="outline" onClick={() => removeStep(index)} className="border-white/[0.07] bg-transparent text-white/45">Remove</Button>}</div>)}<Button type="button" size="sm" variant="outline" onClick={addStep} className="border-white/[0.07] bg-transparent text-white/45">Add Step</Button></div>
      <div><label className="mb-1 block text-[10px] text-white/38">Screenshots / video</label><input type="file" multiple accept="image/*,video/*" onChange={(e) => setMediaFiles(Array.from(e.target.files || []))} className="max-w-full text-[10px] text-white/38" /></div>
      <div><label className="mb-1 block text-[10px] text-white/38">Voice notes</label><input type="file" multiple accept="audio/*" onChange={(e) => setVoiceFiles(Array.from(e.target.files || []))} className="max-w-full text-[10px] text-white/38" /></div>
    </div>
    <div className="mt-4 flex justify-end"><Button type="submit" disabled={loading || !title.trim()} className="bg-cyan-100/[0.09] text-cyan-100/70 hover:bg-cyan-100/[0.14]">{loading ? 'Publishing…' : 'Publish Tactic'}</Button></div>
  </form>;
}
