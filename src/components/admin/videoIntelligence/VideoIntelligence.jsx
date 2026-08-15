import React from 'react';
import { Terminal, AlertCircle, Brain, Database, Images, BookOpen } from 'lucide-react';
import { useVideoIntelligence } from './useVideoIntelligence';
import VideoInputPanel from './VideoInputPanel';
import ProcessingOptions from './ProcessingOptions';
import TimelineResults from './TimelineResults';
import FrameGallery from './FrameGallery';
import ExportPanel from './ExportPanel';
import PastAnalyses from './PastAnalyses';
import VideoLearningAutopilot from './VideoLearningAutopilot';

export default function VideoIntelligence() {
  const v = useVideoIntelligence();
  return (
    <section className="space-y-6">
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-start justify-between gap-5 flex-wrap">
          <div className="min-w-0 max-w-4xl">
            <h2 className="text-2xl font-bold flex items-center gap-2"><Brain className="w-6 h-6 text-cyan-400" /> Video Learning & Knowledge Engine</h2>
            <p className="text-slate-400 text-sm mt-2 leading-relaxed">Autonomous visual learning for Atom × Eve. Videos are studied as a chronological picture book using real YouTube storyboard/frame imagery, then converted into persistent, searchable project knowledge that future game-building tools can retrieve.</p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5 text-cyan-300"><Images className="w-3.5 h-3.5" /> Frame memory</span>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-emerald-300"><Database className="w-3.5 h-3.5" /> Project memory</span>
            <span className="inline-flex items-center gap-1 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1.5 text-violet-300"><BookOpen className="w-3.5 h-3.5" /> Reusable knowledge</span>
          </div>
        </div>
      </div>

      <VideoLearningAutopilot />

      {v.error && <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-2 text-red-300 text-sm"><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {v.error}</div>}

      <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-5">
        <div className="mb-4"><h3 className="font-semibold">Manual / Interactive Analysis</h3><p className="text-xs text-slate-500 mt-1">Use this when you want to inspect a single video immediately. Autonomous Learning above is the persistent backend workflow.</p></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <VideoInputPanel url={v.url} setUrl={v.setUrl} title={v.title} setTitle={v.setTitle} tags={v.tags} setTags={v.setTags} notes={v.notes} setNotes={v.setNotes} onAnalyze={v.analyze} onPackage={v.generatePackage} onFull={v.runFullPipeline} busy={v.busy} action={v.action} hasAnalysis={!!v.analysis} />
          <ProcessingOptions options={v.options} setOptions={v.setOptions} />
        </div>
      </div>

      {(v.busy || v.logs.length > 0) && <div className="rounded-xl border border-slate-700 bg-black/60 font-mono text-sm overflow-hidden"><div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center gap-2 text-green-400"><Terminal className="w-4 h-4" /><span className="font-bold">Learning pipeline log</span>{v.busy && <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse ml-2" />}</div><div className="p-4 h-44 overflow-y-auto flex flex-col-reverse gap-1">{v.logs.length === 0 && <div className="text-slate-600 italic">Waiting…</div>}{v.logs.map(l => <div key={l.id} className="flex gap-2"><span className="text-slate-600 text-xs">[{l.time}]</span><span className={l.level === 'error' ? 'text-red-400' : l.level === 'success' ? 'text-green-400' : l.level === 'warning' ? 'text-yellow-400' : 'text-slate-300'}>{l.msg}</span></div>)}</div></div>}
      <TimelineResults analysis={v.analysis} scenes={v.scenes} frames={v.frames} />
      <FrameGallery frames={v.frames} scenes={v.scenes} />
      <ExportPanel exports={v.exports} onDownloadZip={v.downloadZip} onDownloadJson={v.downloadJson} onDownloadCsv={v.downloadCsv} onDownloadFrames={v.downloadFrames} onCopySummary={v.copySummary} onSaveRecord={v.saveRecord} onPackage={v.generatePackage} busy={v.busy} action={v.action} analysis={v.analysis} />
      <PastAnalyses analyses={v.pastAnalyses} onReopen={v.reopen} onNew={v.reset} />
    </section>
  );
}
