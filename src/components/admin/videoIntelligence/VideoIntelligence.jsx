import React from 'react';
import { ScanSearch, Terminal, AlertCircle } from 'lucide-react';
import { useVideoIntelligence } from './useVideoIntelligence';
import VideoInputPanel from './VideoInputPanel';
import ProcessingOptions from './ProcessingOptions';
import TimelineResults from './TimelineResults';
import FrameGallery from './FrameGallery';
import ExportPanel from './ExportPanel';
import PastAnalyses from './PastAnalyses';

export default function VideoIntelligence() {
  const v = useVideoIntelligence();
  return (
    <section className="space-y-6">
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <ScanSearch className="w-6 h-6 text-cyan-500" /> Video Intelligence
        </h2>
        <p className="text-slate-400 text-sm mt-2 max-w-3xl">
          This tool converts a video into structured visual timeline data using scene segmentation, frame extraction, transcript alignment, and fallback frame packaging for additional review.
        </p>
      </div>

      {v.error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-2 text-red-300 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {v.error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VideoInputPanel
          url={v.url} setUrl={v.setUrl}
          title={v.title} setTitle={v.setTitle}
          tags={v.tags} setTags={v.setTags}
          notes={v.notes} setNotes={v.setNotes}
          onAnalyze={v.analyze} onPackage={v.generatePackage} onFull={v.runFullPipeline}
          busy={v.busy} action={v.action} hasAnalysis={!!v.analysis}
        />
        <ProcessingOptions options={v.options} setOptions={v.setOptions} />
      </div>

      {(v.busy || v.logs.length > 0) && (
        <div className="rounded-xl border border-slate-700 bg-black/60 font-mono text-sm overflow-hidden">
          <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center gap-2 text-green-400">
            <Terminal className="w-4 h-4" />
            <span className="font-bold">Processing log</span>
            {v.busy && <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse ml-2" />}
          </div>
          <div className="p-4 h-44 overflow-y-auto flex flex-col-reverse gap-1">
            {v.logs.length === 0 && <div className="text-slate-600 italic">Waiting…</div>}
            {v.logs.map((l) => (
              <div key={l.id} className="flex gap-2">
                <span className="text-slate-600 text-xs">[{l.time}]</span>
                <span className={l.level === 'error' ? 'text-red-400' : l.level === 'success' ? 'text-green-400' : l.level === 'warning' ? 'text-yellow-400' : 'text-slate-300'}>{l.msg}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <TimelineResults analysis={v.analysis} scenes={v.scenes} frames={v.frames} />
      <FrameGallery frames={v.frames} scenes={v.scenes} />
      <ExportPanel
        exports={v.exports}
        onDownloadZip={v.downloadZip} onDownloadJson={v.downloadJson} onDownloadCsv={v.downloadCsv}
        onDownloadFrames={v.downloadFrames} onCopySummary={v.copySummary} onSaveRecord={v.saveRecord}
        onPackage={v.generatePackage} busy={v.busy} action={v.action} analysis={v.analysis}
      />
      <PastAnalyses analyses={v.pastAnalyses} onReopen={v.reopen} onNew={v.reset} />
    </section>
  );
}