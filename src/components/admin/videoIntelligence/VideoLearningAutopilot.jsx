import React, { useEffect, useMemo, useState } from 'react';
import { BrainCircuit, Play, Radio, RefreshCw, CheckCircle2, AlertTriangle, Loader2, Images, Database, Bot, BookOpen, Gamepad2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { showError, showSuccess } from '@/components/error/ErrorToast';

const LEARNING_MODES = [
  { value: 'gameplay_reference', label: 'Game Walkthrough / Gameplay', icon: Gamepad2, description: 'Learn player loops, controls, combat, progression, UI, quests, bosses, worlds and game functionality.' },
  { value: 'game_tutorial', label: 'Game Development / Unreal Tutorial', icon: BookOpen, description: 'Learn development workflows, editor steps, project structure, systems and production processes.' },
  { value: 'environment_reference', label: 'Environment / World Building', icon: Images, description: 'Learn level composition, environments, lighting, props, traversal and world structure.' },
  { value: 'animation_reference', label: 'Animation / Motion', icon: Images, description: 'Learn animation states, timing, transitions, poses, movement and visual feedback.' },
  { value: 'game_design_reference', label: 'Game Design / Systems', icon: BrainCircuit, description: 'Learn mechanics, UX, progression, economy, menus, feedback and system relationships.' },
  { value: 'general_video', label: 'General Video', icon: BrainCircuit, description: 'Build a broad visual and conceptual knowledge record.' }
];

function isChannelUrl(url) { return /youtube\.com\/(?:@[^/]+|channel\/|c\/|user\/)/i.test(url); }

export default function VideoLearningAutopilot() {
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [mode, setMode] = useState('gameplay_reference');
  const [jobs, setJobs] = useState([]);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try { setJobs(await base44.entities.VideoLearningJob.list('-created_date', 100)); }
    catch (e) { showError(e, 'Video Learning'); }
  };

  // Existing jobs that were left in the old queued state are automatically dispatched once.
  const resumeStuckJobs = async (items) => {
    const stale = items.filter(j => j.status === 'queued');
    for (const job of stale) {
      try {
        await base44.entities.VideoLearningJob.update(job.id, {
          status: job.source_type === 'channel' ? 'discovering' : 'extracting',
          current_stage: 'Starting automatically — no queue',
          progress_percent: Math.max(job.progress_percent || 0, 1)
        });
        // Deliberately do not await the worker: the backend continues after this page is closed.
        void base44.functions.invoke('videoLearningAutopilot', { jobId: job.id });
      } catch (e) { console.warn('Auto-start warning', e); }
    }
  };

  useEffect(() => {
    let cancelled = false;
    const boot = async () => {
      try {
        const items = await base44.entities.VideoLearningJob.list('-created_date', 100);
        if (!cancelled) setJobs(items);
        if (!cancelled) await resumeStuckJobs(items);
      } catch (e) { if (!cancelled) showError(e, 'Video Learning'); }
    };
    boot();
    const id = setInterval(load, 3000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  const active = useMemo(() => jobs.filter(j => !['completed', 'failed'].includes(j.status)), [jobs]);
  const selectedMode = LEARNING_MODES.find(m => m.value === mode) || LEARNING_MODES[0];

  const submit = async () => {
    const source = url.trim();
    if (!source) return showError('Paste a YouTube video or channel URL.');
    setBusy(true);
    try {
      const channel = isChannelUrl(source);
      const sourceType = channel ? 'youtube_channel' : 'youtube_video';
      const jobType = channel ? 'channel' : 'video';
      const initialStatus = channel ? 'discovering' : 'extracting';

      const sourceRecord = await base44.entities.VideoLearningSource.create({
        source_type: sourceType,
        url: source,
        title: channel ? 'YouTube Learning Channel' : 'YouTube Learning Video',
        status: channel ? 'discovering' : 'learning',
        auto_learn: true,
        video_count: 0
      });

      const job = await base44.entities.VideoLearningJob.create({
        source_url: source,
        source_type: jobType,
        status: initialStatus,
        current_stage: channel ? `Discovering videos for ${selectedMode.label}` : `Starting ${selectedMode.label} immediately`,
        progress_percent: 1,
        notes
      });

      await base44.entities.VideoLearningProfile.create({
        job_id: job.id,
        knowledge_type: mode,
        learning_goal: notes,
        priority: channel ? 90 : 80
      });

      // Direct backend dispatch. There is no waiting queue and the page does not need to remain open.
      void base44.functions.invoke('videoLearningAutopilot', { jobId: job.id }).catch(async (error) => {
        try {
          await base44.entities.VideoLearningJob.update(job.id, { status: 'failed', current_stage: 'Learning worker failed to start', error_message: error?.message || String(error) });
          await base44.entities.VideoLearningSource.update(sourceRecord.id, { status: 'error', error_message: error?.message || String(error) });
        } catch {}
      });

      setUrl('');
      setNotes('');
      await load();
      showSuccess(channel ? 'Channel learning started automatically.' : 'Video analysis started automatically. You can leave this page.');
    } catch (e) {
      showError(e, 'Start Video Learning');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-5">
      <div className="bg-slate-900/60 border border-violet-500/20 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 shrink-0 rounded-xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center"><BrainCircuit className="w-6 h-6 text-violet-300" /></div>
          <div><h3 className="text-xl font-bold">Autonomous Video Learning</h3><p className="text-sm text-slate-400 mt-1 leading-relaxed">Paste a YouTube video or channel and Atom × Eve starts learning immediately. The backend studies chronological visual evidence, stores the learned knowledge, and continues after you leave the page.</p></div>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
          {LEARNING_MODES.map(item => { const Icon = item.icon; const selected = mode === item.value; return <button key={item.value} type="button" onClick={() => setMode(item.value)} className={`text-left rounded-xl border p-3 transition-all ${selected ? 'border-violet-400/60 bg-violet-500/10' : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'}`}><div className="flex items-center gap-2"><Icon className="w-4 h-4 text-cyan-300" /><span className="text-sm font-medium text-slate-200">{item.label}</span></div><p className="text-[11px] text-slate-500 mt-1.5">{item.description}</p></button>; })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-3 mt-5">
          <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="YouTube video or channel URL" className="bg-slate-950 border-slate-700 h-11" disabled={busy} />
          <Button onClick={submit} disabled={busy || !url.trim()} className="h-11 px-5 bg-violet-600 hover:bg-violet-700">{busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}Start Learning Now</Button>
        </div>
        <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder={`Optional learning objective for ${selectedMode.label}`} className="mt-3 bg-slate-950 border-slate-700 min-h-20" disabled={busy} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
          <Info icon={Images} title="Picture-book study" text="Chronological visual evidence is analyzed instead of relying on a thumbnail or shallow summary." />
          <Info icon={Database} title="Project memory" text="Reusable knowledge, implementation guidance and scene timelines are stored in the project knowledge bank." />
          <Info icon={Bot} title="Autopilot" text="The backend worker is dispatched immediately and continues independently of the Admin page." />
        </div>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4"><div className="flex items-center gap-2"><Radio className="w-5 h-5 text-cyan-300" /><h3 className="font-semibold">Live Learning Activity</h3><Badge variant="outline">{active.length} active</Badge></div><Button size="sm" variant="outline" onClick={load}><RefreshCw className="w-3.5 h-3.5 mr-1.5" />Refresh</Button></div>
        <div className="space-y-3">{jobs.length === 0 && <p className="text-sm text-slate-500">No learning activity yet.</p>}{jobs.map(job => <JobRow key={job.id} job={job} />)}</div>
      </div>
    </section>
  );
}

function Info({ icon: Icon, title, text }) { return <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"><Icon className="w-4 h-4 text-cyan-300 mb-2" /><div className="text-sm font-medium">{title}</div><div className="text-xs text-slate-500 mt-1 leading-relaxed">{text}</div></div>; }
function JobRow({ job }) {
  const failed = job.status === 'failed'; const done = job.status === 'completed';
  const label = done ? 'Completed' : failed ? 'Failed' : (job.current_stage || job.status || 'Starting');
  return <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4"><div className="flex items-start gap-3">{done ? <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5" /> : failed ? <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" /> : <Loader2 className="w-5 h-5 text-cyan-300 animate-spin mt-0.5" />}<div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="font-medium truncate max-w-[70%]">{job.title || job.source_url}</span><Badge className={done ? 'bg-emerald-500/15 text-emerald-300' : failed ? 'bg-red-500/15 text-red-300' : 'bg-cyan-500/15 text-cyan-300'}>{done ? 'completed' : failed ? 'failed' : 'learning'}</Badge></div><div className="text-xs text-slate-500 mt-1 break-all">{job.source_url}</div><div className="mt-3 h-2 rounded-full bg-slate-800 overflow-hidden"><div className="h-full bg-cyan-500 transition-all" style={{ width: `${Math.max(1, Math.min(100, job.progress_percent || 1))}%` }} /></div><div className="flex flex-wrap justify-between gap-2 text-[11px] text-slate-500 mt-2"><span>{label}</span><span>{job.progress_percent || 0}% · {job.frame_count || 0} frames · {job.knowledge_chunk_count || 0} knowledge chunks</span></div>{job.error_message && <div className="text-xs text-red-300 mt-2">{job.error_message}</div>}</div></div></div>;
}
