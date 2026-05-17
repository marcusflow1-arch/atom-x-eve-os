import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Upload, FileCode, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import {
  fetchUploadedFileText,
  parseContentWithLLM,
  persistParsedDocument,
} from './knowledgeIngestService';
import KnowledgeStatusBanner from './KnowledgeStatusBanner';
import { showSuccess, showError } from '@/components/error/ErrorToast';

const ENGINE_FILE_HINT = `Supports Unreal Engine documentation, source files (.cpp / .h),
exported Blueprint JSON, config files, and design notes.`;

function inferFileType(name) {
  const n = name.toLowerCase();
  if (n.endsWith('.cpp'))  return 'cpp';
  if (n.endsWith('.h'))    return 'h';
  if (n.endsWith('.hpp'))  return 'hpp';
  if (n.endsWith('.json')) return 'json';
  if (n.endsWith('.md'))   return 'md';
  if (n.endsWith('.txt'))  return 'txt';
  if (n.endsWith('.ini'))  return 'config';
  if (n.endsWith('.uasset') || n.endsWith('.umap')) return 'blueprint';
  return 'unknown';
}

export default function EngineFileImportTab({ onIngested }) {
  const [stage, setStage] = useState('idle'); // idle | uploading | reading | parsing | saving | done | error
  const [errorMsg, setErrorMsg] = useState('');
  const [lastResult, setLastResult] = useState(null);
  const [title, setTitle] = useState('');

  const reset = () => { setStage('idle'); setErrorMsg(''); setLastResult(null); };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fileType = inferFileType(file.name);
    reset();
    try {
      setStage('uploading');
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      setStage('reading');
      const text = await fetchUploadedFileText(file_url);

      setStage('parsing');
      const parsed = await parseContentWithLLM(text, { sourceType: 'engine_doc', fileType });

      setStage('saving');
      const result = await persistParsedDocument({
        documentMeta: {
          title:       title || file.name,
          source_type: 'engine_doc',
          source_url:  file_url,
          source_id:   file.name,
          file_type:   fileType,
          raw_content: text.slice(0, 30000),
          status:      'indexed',
        },
        parsed,
      });

      setStage('done');
      setLastResult(result);
      showSuccess(`Ingested "${result.doc.title}" — ${result.chunkCount} chunks.`);
      setTitle('');
      onIngested && onIngested(result);
      // Reset input so the same file can be re-uploaded.
      e.target.value = '';
    } catch (err) {
      setStage('error');
      setErrorMsg(err?.message || String(err));
      showError(err, 'File Import');
    }
  };

  const busy = ['uploading', 'reading', 'parsing', 'saving'].includes(stage);
  const stageLabel = {
    idle:      'Ready',
    uploading: 'Uploading file…',
    reading:   'Reading content…',
    parsing:   'Parsing with AI…',
    saving:    'Saving to databank…',
    done:      'Indexed successfully',
    error:     'Failed',
  }[stage];

  return (
    <div>
      <KnowledgeStatusBanner />
      <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileCode className="w-6 h-6 text-emerald-400" />
          <h2 className="text-2xl font-bold">Engine File Learning Import</h2>
        </div>
        <p className="text-slate-400 text-sm mb-2">{ENGINE_FILE_HINT}</p>
        <p className="text-slate-500 text-xs mb-6 italic">
          This system interprets engine concepts (Actors → Entity Systems, Components → Modular Modules,
          Blueprints → Visual Logic Graphs, GameModes → System States) — it does not compile or run engine code.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Input
            placeholder="Optional title (defaults to filename)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-slate-800 border-slate-700 md:col-span-2"
            disabled={busy}
          />
          <label className="relative cursor-pointer">
            <input
              type="file"
              accept=".cpp,.h,.hpp,.json,.md,.txt,.ini,.uasset,.umap"
              onChange={handleFile}
              className="hidden"
              disabled={busy}
            />
            <Button disabled={busy} className="bg-emerald-600 hover:bg-emerald-700 w-full" asChild>
              <span>
                {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                {busy ? stageLabel : 'Upload Engine File'}
              </span>
            </Button>
          </label>
        </div>

        {stage !== 'idle' && (
          <div className="text-sm text-slate-400 flex items-center gap-2 mt-2">
            {stage === 'done'  && <CheckCircle2 className="w-4 h-4 text-green-400" />}
            {stage === 'error' && <AlertCircle  className="w-4 h-4 text-red-400" />}
            {stageLabel}
          </div>
        )}

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
            {lastResult.doc.engine_mapping && (
              <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-400">
                {Object.entries(lastResult.doc.engine_mapping).map(([k, v]) =>
                  Array.isArray(v) && v.length > 0 ? (
                    <div key={k}>
                      <span className="text-slate-300 capitalize">{k}:</span> {v.slice(0, 4).join(', ')}{v.length > 4 ? '…' : ''}
                    </div>
                  ) : null
                )}
              </div>
            )}
          </motion.div>
        )}
      </section>
    </div>
  );
}