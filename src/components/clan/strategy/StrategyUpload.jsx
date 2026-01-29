import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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

  const addStep = () => setSteps((s) => [...s, '']);
  const updateStep = (i, v) => setSteps((s) => s.map((x, idx) => idx === i ? v : x));
  const removeStep = (i) => setSteps((s) => s.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !clanId || !gameId) return;
    setLoading(true);
    try {
      const uploadsMedia = [];
      for (const f of mediaFiles) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: f });
        uploadsMedia.push(file_url);
      }
      const uploadsVoice = [];
      for (const f of voiceFiles) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: f });
        uploadsVoice.push(file_url);
      }
      await base44.entities.Strategy.create({
        clan_id: clanId,
        game_id: gameId,
        title,
        summary,
        steps: steps.filter(Boolean),
        media_urls: uploadsMedia,
        voice_urls: uploadsVoice,
        visibility: canSetVisibility ? visibility : 'clan'
      });
      setTitle(''); setSummary(''); setSteps(['']); setMediaFiles([]); setVoiceFiles([]); setVisibility('clan');
      if (onCreated) onCreated();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-left">
      <h4 className="text-white font-bold mb-3">Post Boss/Achievement Strategy</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Strategy title" className="bg-black/30 border-white/10 text-white" />
        <Input value={summary} onChange={(e)=>setSummary(e.target.value)} placeholder="Short summary (optional)" className="bg-black/30 border-white/10 text-white" />
        {canSetVisibility && (
          <div>
            <Select value={visibility} onValueChange={setVisibility}>
              <SelectTrigger className="bg-black/30 border-white/10 text-white"><SelectValue placeholder="Visibility" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="clan">Clan Only</SelectItem>
                <SelectItem value="public">Public</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="md:col-span-2 space-y-2">
          <p className="text-white/70 text-sm">Steps</p>
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input value={s} onChange={(e)=>updateStep(i, e.target.value)} placeholder={`Step ${i+1}`} className="bg-black/30 border-white/10 text-white" />
              <Button type="button" variant="outline" onClick={() => removeStep(i)}>Remove</Button>
            </div>
          ))}
          <Button type="button" size="sm" variant="outline" onClick={addStep}>Add Step</Button>
        </div>
        <div>
          <label className="text-white/70 text-sm block mb-1">Screenshots / Video</label>
          <input type="file" multiple accept="image/*,video/*" onChange={(e)=>setMediaFiles(Array.from(e.target.files||[]))} className="text-white/70" />
        </div>
        <div>
          <label className="text-white/70 text-sm block mb-1">Voice Tips (audio)</label>
          <input type="file" multiple accept="audio/*" onChange={(e)=>setVoiceFiles(Array.from(e.target.files||[]))} className="text-white/70" />
        </div>
      </div>
      <div className="flex justify-end mt-3">
        <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">{loading ? 'Uploading…' : 'Publish Strategy'}</Button>
      </div>
    </form>
  );
}