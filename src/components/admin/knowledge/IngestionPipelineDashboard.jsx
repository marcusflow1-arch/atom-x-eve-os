import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Play, Pause, RefreshCw, Trash2, AlertCircle, CheckCircle2, Clock, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  listJobs,
  retryJob,
  pauseJob,
  resumeJob,
  deleteJob,
  clearCompleted,
  progressOf,
} from './ingestionQueue';
import {
  startWorker,
  stopWorker,
  isWorkerRunning,
  subscribeWorker,
} from './backgroundIngestionWorker';
import { showError } from '@/components/error/ErrorToast';

// ─── Status pill ──────────────────────────────────────────────────────────
const STATUS_STYLES = {
  pending:    { color: 'text-slate-300',  dot: 'bg-slate-500',   icon: Clock },
  processing: { color: 'text-yellow-200', dot: 'bg-yellow-400',  icon: Activity },
  completed:  { color: 'text-green-300',  dot: 'bg-green-500',   icon: CheckCircle2 },
  failed:     { color: 'text-red-300',    dot: 'bg-red-500',     icon: AlertCircle },
  paused:     { color: 'text-blue-300',   dot: 'bg-blue-500',    icon: Pause },
};

export default function IngestionPipelineDashboard() {
  const [jobs, setJobs]       = useState([]);
  const [workerState, setWorkerState] = useState({ state: 'idle', job: null });
  const [running, setRunning] = useState(isWorkerRunning());
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try { setJobs(await listJobs()); }
    catch (e) { showError(e, 'Queue refresh'); }
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    const unsub = subscribeWorker((tick) => {
      setWorkerState(tick);
      setRunning(isWorkerRunning());
    });
    const poll = setInterval(refresh, 3000);
    return () => { unsub(); clearInterval(poll); };
  }, []);

  // Auto-start the worker on first mount if there are pending/processing jobs.
  useEffect(() => {
    if (!running && jobs.some((j) => j.status === 'pending' || j.status === 'processing')) {
      startWorker();
      setRunning(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs.length]);

  const counts = jobs.reduce((m, j) => { m[j.status] = (m[j.status] || 0) + 1; return m; }, {});

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-semibold">Ingestion Pipeline</h3>
          <span className={`text-xs px-2 py-0.5 rounded-full ${running ? 'bg-green-500/15 text-green-300' : 'bg-slate-700 text-slate-300'}`}>
            Worker: {running ? 'running' : 'stopped'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {running ? (
            <Button size="sm" variant="outline" onClick={() => { stopWorker(); setRunning(false); }}>
              <Pause className="w-3.5 h-3.5 mr-1" /> Stop worker
            </Button>
          ) : (
            <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700" onClick={() => { startWorker(); setRunning(true); }}>
              <Play className="w-3.5 h-3.5 mr-1" /> Start worker
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={refresh} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button size="sm" variant="ghost" className="text-red-300 hover:text-red-200"
            onClick={async () => { const n = await clearCompleted(); refresh(); showError(`Cleared ${n} completed jobs.`, 'Cleanup'); }}>
            <Trash2 className="w-3.5 h-3.5 mr-1" /> Clear completed
          </Button>
        </div>
      </div>

      {/* Counters */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
        {['pending', 'processing', 'completed', 'failed', 'paused'].map((s) => {
          const meta = STATUS_STYLES[s] || STATUS_STYLES.pending;
          return (
            <div key={s} className="bg-slate-800/60 border border-slate-700 rounded-lg p-2 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
              <span className="text-xs uppercase tracking-widest text-slate-400">{s}</span>
              <span className="ml-auto text-sm font-mono">{counts[s] || 0}</span>
            </div>
          );
        })}
      </div>

      {/* Live worker tick */}
      {workerState.job && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3 mb-4 flex items-center gap-3"
        >
          <Loader2 className="w-4 h-4 animate-spin text-cyan-300" />
          <div className="text-xs text-cyan-100 flex-1 min-w-0 truncate">
            Worker processing: <span className="font-semibold">{workerState.job.label || workerState.job.url}</span>
          </div>
          {workerState.progress && (
            <div className="text-xs text-cyan-200 font-mono">
              {workerState.progress.done}/{workerState.progress.total || '?'}
            </div>
          )}
        </motion.div>
      )}

      {/* Job rows */}
      {jobs.length === 0 ? (
        <div className="text-center py-8 text-slate-500 text-sm">Queue is empty. Submit a Google Doc to enqueue a job.</div>
      ) : (
        <div className="space-y-1.5 max-h-[28rem] overflow-y-auto pr-1">
          {jobs.map((j) => {
            const p    = progressOf(j);
            const meta = STATUS_STYLES[j.status] || STATUS_STYLES.pending;
            const Icon = meta.icon;
            return (
              <div key={j.id} className="bg-slate-800/40 border border-slate-700 rounded-lg p-2.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <Icon className={`w-3.5 h-3.5 ${meta.color}`} />
                  <span className={`text-[10px] font-mono uppercase tracking-widest ${meta.color} w-20 flex-shrink-0`}>
                    {j.status}
                  </span>
                  <span className="flex-1 min-w-0 text-sm text-slate-200 truncate">
                    {j.label || j.url}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono flex-shrink-0">
                    {p.done}/{p.total || '?'} · {j.chunks_stored || 0} chunks
                    {j.retry_count > 0 && <span className="text-orange-400"> · retry {j.retry_count}</span>}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-1 bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      j.status === 'completed' ? 'bg-green-500' :
                      j.status === 'failed'    ? 'bg-red-500'   :
                      j.status === 'paused'    ? 'bg-blue-500'  :
                      'bg-gradient-to-r from-cyan-500 to-emerald-500'
                    }`}
                    style={{ width: `${p.pct}%` }}
                  />
                </div>

                {j.error_message && (
                  <div className="mt-1.5 text-[10px] text-red-300 truncate">{j.error_message}</div>
                )}

                {/* Row actions */}
                <div className="flex items-center gap-1 mt-1.5">
                  {j.status === 'failed' && (
                    <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={async () => { await retryJob(j.id); refresh(); if (!isWorkerRunning()) { startWorker(); setRunning(true); } }}>
                      <RefreshCw className="w-3 h-3 mr-1" /> Retry
                    </Button>
                  )}
                  {j.status === 'processing' && (
                    <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={async () => { await pauseJob(j.id); refresh(); }}>
                      <Pause className="w-3 h-3 mr-1" /> Pause
                    </Button>
                  )}
                  {j.status === 'paused' && (
                    <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={async () => { await resumeJob(j.id); refresh(); if (!isWorkerRunning()) { startWorker(); setRunning(true); } }}>
                      <Play className="w-3 h-3 mr-1" /> Resume
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="h-6 px-2 text-xs text-red-300 hover:text-red-200 ml-auto"
                    onClick={async () => { if (window.confirm('Delete this job from the queue? Stored chunks are kept.')) { await deleteJob(j.id); refresh(); } }}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}