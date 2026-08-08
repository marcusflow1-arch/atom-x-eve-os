import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, FileText, Camera, Layers, Activity, ListVideo } from 'lucide-react';
import { formatTimestamp, STATUS_STYLES, parseJson } from './viShared';

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2">
      <div className="flex items-center gap-2 text-xs text-slate-400"><Icon className="w-3.5 h-3.5" /> {label}</div>
      <div className="text-lg font-bold text-white mt-0.5 truncate">{value}</div>
    </div>
  );
}

export default function TimelineResults({ analysis, scenes, frames }) {
  if (!analysis) {
    return (
      <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-xl font-bold mb-1">Timeline Results</h2>
        <p className="text-slate-400 text-sm">No analysis yet. Paste a YouTube URL and run an analysis to see the structured timeline here.</p>
      </section>
    );
  }
  return (
    <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-3 gap-2">
        <h2 className="text-xl font-bold truncate">{analysis.title || 'Untitled Video'}</h2>
        <Badge className={STATUS_STYLES[analysis.status] || 'bg-slate-500/20 text-slate-300'}>{analysis.status}</Badge>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-4">
        <Stat icon={Clock} label="Duration" value={formatTimestamp(analysis.duration_seconds || 0)} />
        <Stat icon={FileText} label="Transcript" value={analysis.transcript_available ? 'Yes' : 'No'} />
        <Stat icon={Camera} label="Frames" value={frames.length} />
        <Stat icon={Layers} label="Scenes" value={scenes.length} />
        <Stat icon={ListVideo} label="Segments" value={analysis.total_segments ?? scenes.length} />
        <Stat icon={Activity} label="Status" value={analysis.status} />
      </div>
      <a href={analysis.video_url} target="_blank" rel="noreferrer" className="text-cyan-400 text-sm hover:underline truncate block mb-4">{analysis.video_url}</a>
      {analysis.summary_markdown && (
        <div className="bg-slate-800/40 border border-slate-700 rounded-lg p-3 mb-4 text-sm text-slate-300 whitespace-pre-wrap">{analysis.summary_markdown}</div>
      )}
      <div className="space-y-3">
        {scenes.map((sc) => (
          <div key={sc.id} className="bg-slate-800/40 border border-slate-700 rounded-xl p-4 flex gap-4">
            <div className="w-40 shrink-0">
              {sc.representative_frame_url
                ? <img src={sc.representative_frame_url} alt="" className="w-full aspect-video object-cover rounded-lg" />
                : <div className="w-full aspect-video rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-600 text-xs">No frame</div>}
              <div className="text-xs text-slate-400 mt-1 text-center">{formatTimestamp(sc.start_time_seconds)} – {formatTimestamp(sc.end_time_seconds)}</div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono text-slate-500">Scene {sc.scene_index}</span>
                {sc.importance_score > 0 && <Badge variant="outline" className="text-xs">importance {Math.round(sc.importance_score * 100)}%</Badge>}
              </div>
              <p className="text-sm text-slate-200 mb-2">{sc.scene_summary}</p>
              {sc.transcript_excerpt && <p className="text-xs text-slate-400 italic mb-2">“{sc.transcript_excerpt}”</p>}
              <div className="flex flex-wrap gap-1.5">
                {parseJson(sc.detected_objects_json).map((o, i) => (<Badge key={o + i} className="bg-blue-500/15 text-blue-300 text-xs">{o}</Badge>))}
                {parseJson(sc.detected_entities_json).map((o, i) => (<Badge key={o + i} className="bg-violet-500/15 text-violet-300 text-xs">{o}</Badge>))}
              </div>
              {sc.ocr_text && <p className="text-xs text-amber-300/80 mt-2">OCR: {sc.ocr_text}</p>}
              {parseJson(sc.actions_json).length > 0 && <p className="text-xs text-slate-400 mt-2">Actions: {parseJson(sc.actions_json).join(' · ')}</p>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}