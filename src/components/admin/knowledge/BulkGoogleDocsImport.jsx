import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, ListPlus, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  extractGoogleDocId,
  fetchGoogleDocText,
  parseContentWithLLM,
  persistParsedDocument,
} from './knowledgeIngestService';
import { showSuccess, showError } from '@/components/error/ErrorToast';

// Bulk ingestion of multiple Google Docs links pasted at once.
// Used as a fallback when the user wants to import an entire Drive folder —
// since unauthenticated browser code cannot list folder contents, the admin
// pastes all the document URLs from the folder and we process them one by one.
export default function BulkGoogleDocsImport({ onIngested }) {
  const [raw, setRaw] = useState('');
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState([]); // {url, status, message, title?}

  const parseUrls = () => {
    const lines = raw
      .split(/[\n,\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    // Keep only entries that look like Google Doc URLs
    return lines.filter((l) => extractGoogleDocId(l));
  };

  const handleRun = async () => {
    const urls = parseUrls();
    if (urls.length === 0) {
      showError('No valid Google Docs URLs detected. Paste links containing /document/d/<id>/');
      return;
    }
    setRunning(true);
    setResults(urls.map((u) => ({ url: u, status: 'pending' })));

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      setResults((r) => r.map((x, idx) => (idx === i ? { ...x, status: 'fetching' } : x)));
      try {
        const docId = extractGoogleDocId(url);
        const { text } = await fetchGoogleDocText(url);
        setResults((r) => r.map((x, idx) => (idx === i ? { ...x, status: 'parsing' } : x)));
        const parsed = await parseContentWithLLM(text, { sourceType: 'google_docs', fileType: 'gdoc' });
        const result = await persistParsedDocument({
          documentMeta: {
            title:       parsed?.summary?.slice(0, 80) || `Google Doc ${docId}`,
            source_type: 'google_docs',
            source_url:  url,
            source_id:   docId,
            file_type:   'gdoc',
            raw_content: text.slice(0, 30000),
            status:      'indexed',
          },
          parsed,
        });
        setResults((r) =>
          r.map((x, idx) =>
            idx === i ? { ...x, status: 'done', title: result.doc.title, chunks: result.chunkCount } : x
          )
        );
        onIngested && onIngested(result);
      } catch (err) {
        setResults((r) =>
          r.map((x, idx) => (idx === i ? { ...x, status: 'error', message: err?.message || String(err) } : x))
        );
      }
    }
    setRunning(false);
    showSuccess('Bulk import complete.');
  };

  const detectedCount = parseUrls().length;

  return (
    <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <ListPlus className="w-5 h-5 text-cyan-400" />
        <h3 className="font-semibold">Bulk Import from Drive Folder</h3>
      </div>
      <p className="text-sm text-slate-400 mb-3 leading-relaxed">
        Google Drive folders can't be listed from the browser without authentication. Open your folder in Drive,
        copy the share links of the docs inside it, and paste them all here (one per line or comma-separated).
        Each doc must be shared as <em>"Anyone with the link can view"</em>.
      </p>

      <Textarea
        placeholder={`https://docs.google.com/document/d/ABC.../edit\nhttps://docs.google.com/document/d/XYZ.../edit\n...`}
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        className="bg-slate-900 border-slate-700 h-32 font-mono text-xs"
        disabled={running}
      />

      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-slate-400">
          {detectedCount} valid link{detectedCount !== 1 ? 's' : ''} detected
        </span>
        <Button onClick={handleRun} disabled={running || detectedCount === 0} className="bg-cyan-600 hover:bg-cyan-700">
          {running ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ListPlus className="w-4 h-4 mr-2" />}
          {running ? 'Importing…' : `Ingest ${detectedCount} Doc${detectedCount !== 1 ? 's' : ''}`}
        </Button>
      </div>

      {results.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="mt-4 max-h-72 overflow-y-auto bg-black/40 border border-slate-800 rounded-lg p-3 font-mono text-[11px] space-y-1"
        >
          {results.map((r, idx) => {
            const icon =
              r.status === 'done'  ? <CheckCircle2 className="w-3 h-3 text-green-400" /> :
              r.status === 'error' ? <AlertCircle  className="w-3 h-3 text-red-400" /> :
              r.status === 'pending' ? <span className="w-3 h-3 inline-block rounded-full bg-slate-600" /> :
              <Loader2 className="w-3 h-3 animate-spin text-yellow-400" />;
            const color =
              r.status === 'done'  ? 'text-green-300' :
              r.status === 'error' ? 'text-red-300'   :
              r.status === 'pending' ? 'text-slate-500' :
              'text-yellow-200';
            return (
              <div key={idx} className="flex items-start gap-2">
                {icon}
                <span className={`${color} flex-1 break-all`}>
                  [{idx + 1}] {r.status.toUpperCase()} — {r.title || r.url}
                  {r.chunks != null && <span className="text-slate-500"> · {r.chunks} chunks</span>}
                  {r.message && <span className="text-red-400"> · {r.message}</span>}
                </span>
              </div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}