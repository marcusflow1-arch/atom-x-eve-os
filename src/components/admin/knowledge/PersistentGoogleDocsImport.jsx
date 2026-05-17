import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Link as LinkIcon, CheckCircle2, AlertCircle, PlayCircle, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  startIngestion,
  resumeIngestion,
  listJobs,
  getResumableJobs,
  deleteJob,
  summarizeProgress,
} from './persistentIngestRunner';
import { extractGoogleDocId } from './knowledgeIngestService';
import { showError } from '@/components/error/ErrorToast';

// ─── Persistent, resumable Google Docs importer ───────────────────────────
// Large Unreal Engine docs are processed in batches — progress is checkpointed
// to localStorage after every batch so the job can resume after refresh.
export default function PersistentGoogleDocsImport({ onIngested }) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [activeJob, setActiveJob] = useState(null);
  const [jobs, setJobs] = useState(listJobs());
  const refreshTimer = useRef(null);

  const refreshList = () => setJobs(listJobs());

  // Auto-resume any unfinished job on mount.
  useEffect(() => {
    const resumable = getResumableJobs();
    if (resumable.length > 0 && !activeJob) {
      const j = resumable[0];
      setActiveJob(j);
      resumeIngestion({ jobId: j.id, onProgress: (u) => { setActiveJob({ ...u }); refreshList(); } })
        .catch((err) => showError(err, 'Auto-Resume'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Periodic refresh of the saved-jobs list while a job is running.
  useEffect(() => {
    if (activeJob && activeJob.status !== 'done' && activeJob.status !== 'failed') {
      refreshTimer.current = setInterval(refreshList, 1500);
      return () => clearInterval(refreshTimer.current);
    }
  }, [activeJob]);

  const handleStart = async () => {
    if (!extractGoogleDocId(url)) {
      showError('Could not parse a Google Doc ID from that URL.');
      return;
    }
    try {
      await startIngestion({
        url,
        title,
        onProgress: (u) => { setActiveJob({ ...u }); refreshList(); },
      });
      onIngested && onIngested();
      setUrl(''); setTitle('');
    } catch (err) {
      showError(err, 'Persistent Ingestion');
    }
  };

  const handleResume = async (job) => {
    setActiveJob(job);
    try {
      await resumeIngestion({
        jobId: job.id,
        onProgress: (u) => { setActiveJob({ ...u }); refreshList(); },
      });
      onIngested && onIngested();
    } catch (err) {
      showError(err, 'Resume');
    }
  };

  const handleDelete = (jobId) => {
    if (!window.confirm('Forget this ingestion job? Stored knowledge chunks are NOT deleted.')) return;
    deleteJob(jobId);
    if (activeJob?.id === jobId) setActiveJob(null);
    refreshList();
  };

  const isBusy = activeJob && (activeJob.status === 'queued' || activeJob.status === 'parsing');
  const progress = summarizeProgress(activeJob);

  return (
    <div className="space-y-4">
      {/* Input form */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          placeholder="Optional title (defaults to AI summary)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-slate-800 border-slate-700"
          disabled={isBusy}
        />
        <Input
          placeholder="https://docs.google.com/document/d/..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="bg-slate-800 border-slate-700 md:col-span-2"
          disabled={isBusy}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={handleStart} disabled={isBusy || !url} className="bg-cyan-600 hover:bg-cyan-700">
          {isBusy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LinkIcon className="w-4 h-4 mr-2" />}
          {isBusy ? 'Processing…' : 'Start Persistent Ingestion'}
        </Button>
        <span className="text-xs text-slate-500">
          Large docs are split into batches and checkpointed — they resume automatically after a refresh.
        </span>
      </div>

      {/* Active job progress */}
      {activeJob && (
        <motion.div
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/50 border border-slate-700 rounded-xl p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-widest text-slate-400">Active Job</div>
              <div className="font-semibold truncate">{activeJob.title || `Google Doc ${activeJob.doc_id}`}</div>
              <div className="text-xs text-slate-500 break-all">{activeJob.url}</div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {activeJob.status === 'done'   && <CheckCircle2 className="w-5 h-5 text-green-400" />}
              {activeJob.status === 'failed' && <AlertCircle className="w-5 h-5 text-red-400" />}
              {isBusy && <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" />}
            </div>
          </div>

          {progress && (
            <>
              <div className="h-2 bg-slate-900 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all"
                  style={{ width: `${progress.pct}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>
                  Batch {progress.done} / {progress.total || '?'} · {progress.chunks} chunks stored
                </span>
                <span className="uppercase tracking-widest">
                  {progress.pct}% · {progress.status}
                  {progress.errors > 0 && <span className="text-orange-400"> · {progress.errors} batch error(s)</span>}
                </span>
              </div>
            </>
          )}

          {activeJob.error_message && (
            <div className="mt-3 p-2 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-300">
              {activeJob.error_message}
            </div>
          )}
        </motion.div>
      )}

      {/* Saved-jobs list */}
      {jobs.length > 0 && (
        <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold tracking-wide uppercase text-slate-300">
              Ingestion Jobs ({jobs.length})
            </h4>
            <Button size="sm" variant="ghost" onClick={refreshList} className="text-slate-400 hover:text-white">
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
            </Button>
          </div>
          <div className="space-y-1.5 max-h-72 overflow-y-auto">
            {jobs.map((j) => {
              const p = summarizeProgress(j);
              const color =
                j.status === 'done'   ? 'text-green-300' :
                j.status === 'failed' ? 'text-red-300'   :
                j.status === 'parsing' ? 'text-yellow-200' :
                'text-slate-300';
              return (
                <div key={j.id} className="flex items-center gap-2 bg-slate-900/40 border border-slate-800 rounded-lg p-2">
                  <span className={`text-[10px] font-mono uppercase tracking-widest ${color} w-16 flex-shrink-0`}>
                    {j.status}
                  </span>
                  <span className="flex-1 min-w-0">
                    <div className="text-sm text-slate-200 truncate">{j.title || j.doc_id}</div>
                    <div className="text-[10px] text-slate-500">
                      {p.pct}% · {p.done}/{p.total || '?'} batches · {p.chunks} chunks
                    </div>
                  </span>
                  {j.status !== 'done' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-xs"
                      onClick={() => handleResume(j)}
                      disabled={isBusy}
                    >
                      <PlayCircle className="w-3 h-3 mr-1" /> Resume
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(j.id)}
                    className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    title="Forget job (chunks stay in databank)"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}