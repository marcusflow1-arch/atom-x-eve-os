import React from 'react';
import { FileText } from 'lucide-react';
import KnowledgeStatusBanner from './KnowledgeStatusBanner';
import PersistentGoogleDocsImport from './PersistentGoogleDocsImport';
import BulkGoogleDocsImport from './BulkGoogleDocsImport';

// Persistent, resumable, batched Google Docs ingestion.
// Large Unreal Engine knowledge docs are split into character-bounded
// batches, each parsed by the LLM individually, with progress checkpointed
// to localStorage after every batch so the job auto-resumes on refresh.
export default function GoogleDocsImportTab() {
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
            Paste a Google Docs share link. The system fetches the document, splits it into batches,
            parses each batch with AI, classifies content, maps Unreal Engine concepts, and stores
            structured chunks into the knowledge databank. Long docs are <em>checkpointed</em> — if
            the page is refreshed mid-ingestion the job resumes automatically.
          </p>
        </div>

        <PersistentGoogleDocsImport />

        <div className="pt-2 border-t border-slate-800">
          <BulkGoogleDocsImport />
        </div>
      </section>
    </div>
  );
}