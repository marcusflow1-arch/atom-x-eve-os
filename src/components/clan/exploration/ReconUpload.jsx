import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';

export default function ReconUpload({ clanId, gameId, onCreated }) {
  const [title, setTitle] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [location, setLocation] = React.useState('');
  const [status, setStatus] = React.useState('scouted');
  const [files, setFiles] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !clanId || !gameId) return;
    setLoading(true);
    try {
      const uploads = [];
      for (const f of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: f });
        uploads.push(file_url);
      }
      await base44.entities.ExplorationIntel.create({
        clan_id: clanId,
        game_id: gameId,
        title,
        notes,
        location,
        status,
        media_urls: uploads,
      });
      setTitle(''); setNotes(''); setLocation(''); setStatus('scouted'); setFiles([]);
      if (onCreated) onCreated();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-left">
      <h4 className="text-white font-bold mb-3">Upload Recon</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Title (e.g., Hidden chest by the waterfall)" className="bg-black/30 border-white/10 text-white" />
        <Input value={location} onChange={(e)=>setLocation(e.target.value)} placeholder="Location / Coords (optional)" className="bg-black/30 border-white/10 text-white" />
        <div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="bg-black/30 border-white/10 text-white"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="scouted">Scouted</SelectItem>
              <SelectItem value="found">Found</SelectItem>
              <SelectItem value="cleared">Cleared</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <input type="file" multiple accept="image/*,video/*" onChange={(e)=>setFiles(Array.from(e.target.files||[]))} className="text-white/70" />
        <div className="md:col-span-2">
          <Textarea value={notes} onChange={(e)=>setNotes(e.target.value)} placeholder="Notes: how to unlock, enemy tips, etc." className="bg-black/30 border-white/10 text-white min-h-[80px]" />
        </div>
      </div>
      <div className="flex justify-end mt-3">
        <Button type="submit" disabled={loading} className="bg-cyan-600 hover:bg-cyan-700">
          {loading ? 'Uploading…' : 'Save Recon'}
        </Button>
      </div>
    </form>
  );
}