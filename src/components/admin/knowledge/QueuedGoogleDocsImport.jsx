import React, { useState } from 'react';
import { Loader2, Link as LinkIcon, ListPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { enqueueGoogleDoc, enqueueBulkGoogleDocs } from './ingestionQueue';
import { extractGoogleDocId } from './knowledgeIngestService';
import { startWorker, isWorkerRunning } from './backgroundIngestionWorker';
import { showSuccess, showError } from '@/components/error/ErrorToast';

// Submit-only UI — everything actually happens in the queue + background worker.
// Submitting a link returns immediately and the dashboard reflects progress.
export default function QueuedGoogleDocsImport({ onEnqueued }) {
  const [url, setUrl]     = useState('');
  const [label, setLabel] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [busy, setBusy]   = useState(false);

  const handleEnqueueOne = async () => {
    if (!extractGoogleDocId(url)) { showError('Could not parse a Google Doc ID from that URL.'); return; }
    setBusy(true);
    try {
      await enqueueGoogleDoc({ url, label });
      if (!isWorkerRunning()) startWorker();
      showSuccess('Job queued — worker will process it in the background.');
      setUrl(''); setLabel('');
      onEnqueued && onEnqueued();
    } catch (e) {
      showError(e, 'Enqueue');
    }
    setBusy(false);
  };

  const handleEnqueueBulk = async () => {
    const lines = bulkText.split(/[\n,\s]+/).map((s) => s.trim()).filter(Boolean);
    const urls  = lines.filter((l) => extractGoogleDocId(l));
    if (urls.length === 0) { showError('No valid Google Docs URLs detected.'); return; }
    setBusy(true);
    try {
      await enqueueBulkGoogleDocs(urls);
      if (!isWorkerRunning()) startWorker();
      showSuccess(`Queued ${urls.length} documents — worker is running.`);
      setBulkText('');
      onEnqueued && onEnqueued();
    } catch (e) {
      showError(e, 'Bulk enqueue');
    }
    setBusy(false);
  };

  return (
    <div className="space-y-5">
      {/* Single URL */}
      <div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-2">
          <Input
            placeholder="Optional label (defaults to AI summary)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="bg-slate-800 border-slate-700"
            disabled={busy}
          />
          <Input
            placeholder="https://docs.google.com/document/d/..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="bg-slate-800 border-slate-700 md:col-span-2"
            disabled={busy}
          />
        </div>
        <Button onClick={handleEnqueueOne} disabled={busy || !url} className="bg-cyan-600 hover:bg-cyan-700">
          {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LinkIcon className="w-4 h-4 mr-2" />}
          Queue Google Doc
        </Button>
      </div>

      <div className="h-px bg-slate-800" />

      {/* Bulk */}
      <div>
        <div className="text-xs uppercase tracking-widest text-slate-400 mb-2">
          Bulk queue — paste many doc URLs
        </div>
        <Textarea
          placeholder={`https://docs.google.com/document/d/ABC.../edit\nhttps://docs.google.com/document/d/XYZ.../edit\n...`}
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
          className="bg-slate-900 border-slate-700 h-28 font-mono text-xs mb-2"
          disabled={busy}
        />
        <Button onClick={handleEnqueueBulk} disabled={busy || !bulkText} className="bg-cyan-600 hover:bg-cyan-700">
          {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ListPlus className="w-4 h-4 mr-2" />}
          Queue All Detected Docs
        </Button>
      </div>
    </div>
  );
}