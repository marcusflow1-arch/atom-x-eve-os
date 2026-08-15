import React, { useEffect, useMemo, useState } from 'react';
import { BrainCircuit, Play, Radio, RefreshCw, CheckCircle2, AlertTriangle, Loader2, Images, Database, Bot } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { showError, showSuccess } from '@/components/error/ErrorToast';

function isChannelUrl(url) { return /youtube\.com\/(?:@[^/]+|channel\/|c\/|user\/)/i.test(url); }

export default function VideoLearningAutopilot() {
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [jobs, setJobs] = useState([]);
  const [busy, setBusy] = useState(false);
  const load = async () => { try { setJobs(await base44.entities.VideoLearningJob.list('-created_date', 100)); } catch (e) { showError(e, 'Video Learning Jobs'); } };
  useEffect(() => { load(); const id = setInterval(load, 5000); return () => clearInterval(id); }, []);
  const active = useMemo(() => jobs.filter(j => !['completed','failed'].includes(j.status)), [jobs]);
  const submit = async () => {
    const source = url.trim();
    if (!source) return showError('Paste a YouTube video or channel URL.');
    setBusy(true);
    try {
      const sourceType = isChannelUrl(source) ? 'channel' : 'video';
      const job = await base44.entities.VideoLearningJob.create({ source_url: source, source_type: sourceType, status: 'queued', current_stage: 'Queued for autonomous learning', notes });
      try { await base44.functions.invoke('videoLearningAutopilot', { jobId: job.id }); } catch {}
      setUrl(''); setNotes(''); await load();
      showSuccess(sourceType === 'channel' ? 'Channel learning queued. Videos will be processed automatically.' : 'Video learning queued. The frame-book worker will continue in the background.');
    } catch (e) { showError(e, 'Start Video Learning'); } finally { setBusy(false); }
  };
  return (
    <section className="space-y-5">
      <div className="bg-slate-900/60 border border-violet-500/20 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 shrink-0 rounded-xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center"><BrainCircuit className="w-6 h-6 text-violet-300" /></div>
          <div className="min-w-0"><h3 className="text-xl font-bold">Autonomous Video Learning</h3><p className="text-sm text-slate-400 mt-1 leading-relaxed">Give Atom × Eve a YouTube video or channel. The backend treats the video as a chronological picture book: it obtains real YouTube storyboard/frame imagery, studies the visual timeline, extracts gameplay behavior and implementation knowledge, and writes that knowledge into the project's searchable memory. It is a persistent job, not a page-session prompt.</p></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-3 mt-5">
          <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="YouTube video or channel URL" className="bg-slate-950 border-slate-700 h-11" disabled={busy} />
          <Button onClick={submit} disabled={busy || !url.trim()} className="h-11 px-5 bg-violet-600 hover:bg-violet-700">{busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}Start Autonomous Learning</Button>
        </div>
        <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional learning objective: e.g. study the complete combat loop, progression, bosses, menus, and Unreal Engine workflow shown in this video/course." className="mt-3 bg-slate-950 border-slate-700 min-h-20" disabled={busy} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
          <Info icon={Images} title="Frame-book study" text="Processes the visual timeline in chronological order instead of relying on a single thumbnail or summary." />
          <Info icon={Database} title="Project memory" text="Writes reusable knowledge chunks so other game-building tools can retrieve what was learned later." />
          <Info icon={Bot} title="Autopilot" text="Jobs persist in the database and continue through the backend worker after you leave the Admin page." />
        </div>
      </div>
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4"><div className="flex items-center gap-2"><Radio className="w-5 h-5 text-cyan-300" /><h3 className="font-semibold">Learning Queue</h3><Badge variant="outline">{active.length} active</Badge></div><Button size="sm" variant="outline" onClick={load}><RefreshCw className="w-3.5 h-3.5 mr-1.5" />Refresh</Button></div>
        <div className="space-y-3">{jobs.length === 0 && <p className="text-sm text-slate-500">No autonomous learning jobs yet.</p>}{jobs.map(job => <JobRow key={job.id} job={job} />)}</div>
      </div>
    </section>
  );
}
function Info({ icon: Icon, title, text }) { return <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"><Icon className="w-4 h-4 text-cyan-300 mb-2" /><div className="text-sm font-medium">{title}</div><div className="text-xs text-slate-500 mt-1 leading-relaxed">{text}</div></div>; }
function JobRow({ job }) {
  const failed = job.status === 'failed'; const done = job.status === 'completed';
  return <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4"><div className="flex items-start gap-3">{done ? <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5" /> : failed ? <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" /> : <Loader2 className="w-5 h-5 text-cyan-300 animate-spin mt-0.5" />}<div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="font-medium truncate max-w-[70%]">{job.title || job.source_url}</span><Badge className={done ? 'bg-emerald-500/15 text-emerald-300' : failed ? 'bg-red-500/15 text-red-300' : 'bg-cyan-500/15 text-cyan-300'}>{job.status}</Badge></div><div className="text-xs text-slate-500 mt-1 break-all">{job.source_url}</div><div className="mt-3 h-2 rounded-full bg-slate-800 overflow-hidden"><div className="h-full bg-cyan-500 transition-all" style={{ width: `${Math.max(0, Math.min(100, job.progress_percent || 0))}%` }} /></div><div className="flex flex-wrap justify-between gap-2 text-[11px] text-slate-500 mt-2"><span>{job.current_stage || 'Queued'}</span><span>{job.progress_percent || 0}% · {job.frame_count || 0} frame records · {job.knowledge_chunk_count || 0} knowledge chunks</span></div>{job.error_message && <div className="text-xs text-red-300 mt-2">{job.error_message}</div>}</div></div></div>;
}
