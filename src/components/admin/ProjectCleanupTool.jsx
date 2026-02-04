import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, ListChecks, Trash2, Download, Upload } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function ProjectCleanupTool() {
  const [days, setDays] = useState(30);
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState({});

  const toggleSelect = (filePath) => setSelected((prev) => ({ ...prev, [filePath]: !prev[filePath] }));

  const approveSelected = async () => {
    const approved = (data?.items || []).filter((it) => selected[it.file_path]);
    if (approved.length === 0) { alert('Select at least one item to approve.'); return; }
    setUploading(true);
    try {
      const payload = { generated_at: new Date().toISOString(), approved_count: approved.length, items: approved };
      const file = new File([JSON.stringify(payload, null, 2)], `approved-cleanup-${new Date().toISOString()}.json`, { type: 'application/json' });
      const up = await base44.integrations.Core.UploadPrivateFile({ file });
      const signed = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: up.file_uri, expires_in: 86400 });
      alert(`Approved manifest saved (no deletions performed). Temporary link (24h):\n${signed.signed_url}`);
    } finally {
      setUploading(false);
    }
  };

  const { data, isFetching, refetch } = useQuery({
    queryKey: ['cleanupManifest', days],
    queryFn: async () => {
      const res = await base44.functions.invoke('generateCleanupManifest', { days });
      return res.data;
    }
  });

  // Reset selection on new data
  React.useEffect(() => { setSelected({}); }, [data]);

  const items = data?.items || [];

  const downloadManifest = () => {
    const blob = new Blob([JSON.stringify(data || {}, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cleanup-manifest-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    a.remove();
  };

  const uploadManifest = async () => {
    if (!data) return;
    setUploading(true);
    try {
      const file = new File([JSON.stringify(data, null, 2)], `cleanup-manifest-${new Date().toISOString()}.json`, { type: 'application/json' });
      const up = await base44.integrations.Core.UploadPrivateFile({ file });
      const signed = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: up.file_uri, expires_in: 86400 });
      alert(`Manifest uploaded. Temporary download link (24h):\n${signed.signed_url}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold">Project Cleanup (Pages & Components)</h3>
          <p className="text-slate-400 text-sm">Safe mode: no automatic deletions. Candidates must be explicitly approved. Items used or edited within the last N days are excluded.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-slate-400">{items.length} candidates</Badge>
          <Button onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <ListChecks className="w-4 h-4 mr-2"/>}
            Generate Manifest
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-sm text-slate-400">Days unused</label>
        <Input type="number" value={days} onChange={(e) => setDays(Math.max(1, Number(e.target.value || 30)))} className="w-24 bg-slate-900 border-slate-700" />
      </div>

      <div className="rounded-xl border border-slate-800 overflow-hidden">
        <div className="grid grid-cols-12 bg-slate-800/40 px-4 py-2 text-xs text-slate-400">
          <div className="col-span-1">Approve</div>
          <div className="col-span-5">File Path</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-2">Last Used</div>
          <div className="col-span-1">Edited</div>
          <div className="col-span-1">Uses</div>
        </div>
        <div className="max-h-72 overflow-y-auto divide-y divide-slate-800">
          {items.map((it) => (
            <div key={it.file_path} className="grid grid-cols-12 px-4 py-2 text-sm items-center">
              <div className="col-span-1">
                <input type="checkbox" checked={!!selected[it.file_path]} onChange={() => toggleSelect(it.file_path)} />
              </div>
              <div className="col-span-5 truncate" title={it.file_path}>{it.file_path}</div>
              <div className="col-span-2 capitalize">{it.type}</div>
              <div className="col-span-2">{it.last_used_date || '—'}</div>
              <div className="col-span-1">{it.last_edited_date || '—'}</div>
              <div className="col-span-1">{it.use_count}</div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="px-4 py-6 text-center text-slate-500">No stale files detected.</div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Button variant="outline" onClick={downloadManifest}><Download className="w-4 h-4 mr-2"/>Download Manifest JSON</Button>
        <Button variant="outline" onClick={uploadManifest} disabled={uploading}>
          {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Upload className="w-4 h-4 mr-2"/>}
          Upload Manifest to Private Storage
        </Button>
        <Button onClick={approveSelected} disabled={uploading || Object.values(selected).every(v => !v)} className="bg-emerald-600 hover:bg-emerald-700">
          <ListChecks className="w-4 h-4 mr-2"/>Approve Selected (no delete)
        </Button>
        <div className="text-xs text-slate-400">Approval saves a list for review; no files are deleted automatically. You’ll be asked again before any deletion happens.</div>
      </div>
    </section>
  );
}