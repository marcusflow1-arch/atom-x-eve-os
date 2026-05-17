import React, { useEffect } from 'react';
import { FileText } from 'lucide-react';
import KnowledgeStatusBanner from './KnowledgeStatusBanner';
import QueuedGoogleDocsImport from './QueuedGoogleDocsImport';
import IngestionPipelineDashboard from './IngestionPipelineDashboard';
import { startWorker } from './backgroundIngestionWorker';
import { listActiveJobs } from './ingestionQueue';

// Real queue + worker pipeline.
// • Submitting a doc only enqueues a `PendingKnowledgeURL` row.
// • A singleton background worker drains the queue continuously, chunk by
//   chunk, with checkpoints saved to the database after every chunk.
// • If any pending/processing job exists on mount we auto-start the worker.
export default function GoogleDocsImportTab() {
  useEffect(() => {
    (async () => {
      try {
        const active = await listActiveJobs();
        if (active && active.length > 0) startWorker();
      } catch { /* ignore */ }
    })();
  }, []);

  return (
    <div>
      <KnowledgeStatusBanner />
      <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-6 h-6 text-cyan-400" />
            <h2 className="text-2xl font-bold">Knowledge Import from Google Docs</h2>
          </div>
          <p className="text-slate-400 text-sm">
            Submitted documents are queued as <em>PendingKnowledgeURL</em> jobs and processed by a
            background worker — one chunk at a time, with a database checkpoint after each chunk,
            up to 3 automatic retries on failure, and full resume on refresh. The worker keeps
            running until the queue is empty.
          </p>
        </div>

        <QueuedGoogleDocsImport />

        <div className="pt-2 border-t border-slate-800">
          <IngestionPipelineDashboard />
        </div>
      </section>
    </div>
  );
}