import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, FileText, Link as LinkIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  extractGoogleDocId,
  fetchGoogleDocText,
  parseContentWithLLM,
  persistParsedDocument,
} from './knowledgeIngestService';
import KnowledgeStatusBanner from './KnowledgeStatusBanner';
import { showSuccess, showError } from '@/components/error/ErrorToast';

// Step-by-step ingestion runner for a Google Docs link.
export default function GoogleDocsImportTab({ onIngested }) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [stage, setStage] = useState('idle'); // idle | fetching | parsing | saving | done | error
  const [errorMsg, setErrorMsg] = useState('');
  const [lastResult, setLastResult] = useState(null);

  const reset = () => { setStage('idle'); setErrorMsg(''); setLastResult(null); };

  const handleImport = async () => {
    const docId = extractGoogleDocId(url);
    if (!docId) {
      showError('Could not parse a Google Doc ID from that URL.');
      return;
    }
    reset();
    try {
      setStage('fetching');
      const { text } = await fetchGoogleDocText(url);

      setStage('parsing');
      const parsed = await parseContentWithLLM(text, { sourceType: 'google_docs', fileType: 'gdoc' });

      setStage('saving');
      const result = await persistParsedDocument({
        documentMeta: {
          title:       title || parsed?.summary?.slice(0, 80) || `Google Doc ${docId}`,
          source_type: 'google_docs',
          source_url:  url,
          source_id:   docId,
          file_type:   'gdoc',
          raw_content: text.slice(0, 30000),
          status:      'indexed',
        },
        parsed,
      });

      setStage('done');
      setLastResult(result);
      showSuccess(`Ingested "${result.doc.title}" — ${result.chunkCount} chunks stored.`);
      setUrl(''); setTitle('');
      onIngested && onIngested(result);
    } catch (err) {
      setStage('error');
      setErrorMsg(err?.message || String(err));
      showError(err, 'Google Docs Import');
    }
  };

  const busy = stage === 'fetching' || stage === 'parsing' || stage === 'saving';
  const stageLabel = {
    idle:     'Ready',
    fetching: 'Fetching document…',
    parsing:  'Parsing with AI…',
    saving:   'Saving to databank…',
    done:     'Indexed successfully',
    error:    'Failed',
  }[stage];

  return (
    <div>
      <KnowledgeStatusBanner />
      <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-6 h-6 text-cyan-400" />
          <h2 className="text-2xl font-bold">Knowledge Import from Google Docs</h2>
        </div>
        <p className="text-slate-400 text-sm mb-6">
          Paste a Google Docs share link below. The system will fetch the document,
          parse it into structured chunks, classify it, and store everything in the knowledge databank.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Input
            placeholder="Optional title (defaults to AI summary)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
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

        <div className="flex items-center gap-3">
          <Button onClick={handleImport} disabled={busy || !url} className="bg-cyan-600 hover:bg-cyan-700">
            {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LinkIcon className="w-4 h-4 mr-2" />}
            {busy ? stageLabel : 'Ingest Document'}
          </Button>
          {stage !== 'idle' && (
            <span className="text-sm text-slate-400 flex items-center gap-2">
              {stage === 'done' && <CheckCircle2 className="w-4 h-4 text-green-400" />}
              {stage === 'error' && <AlertCircle className="w-4 h-4 text-red-400" />}
              {stageLabel}
            </span>
          )}
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-300">
            {errorMsg}
          </div>
        )}

        {lastResult?.doc && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 p-4 bg-slate-800/50 border border-slate-700 rounded-xl"
          >
            <div className="text-xs uppercase tracking-widest text-slate-400 mb-1">Last Indexed</div>
            <div className="font-semibold">{lastResult.doc.title}</div>
            <div className="text-xs text-slate-400 mt-1">
              {lastResult.chunkCount} chunks · category: <span className="text-slate-200">{lastResult.doc.category}</span>
            </div>
            {lastResult.doc.summary && (
              <p className="text-sm text-slate-300 mt-2 italic">{lastResult.doc.summary}</p>
            )}
          </motion.div>
        )}
      </section>
    </div>
  );
}