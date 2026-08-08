import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatTimestamp, parseJson } from './viShared';

export default function FrameGallery({ frames, scenes }) {
  const [active, setActive] = useState(null);
  if (!frames.length) {
    return (
      <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-xl font-bold mb-1">Frame Gallery</h2>
        <p className="text-slate-400 text-sm">Extracted frames will appear here after analysis.</p>
      </section>
    );
  }
  const neighbors = (f) => frames.filter((x) => x.scene_id === f.scene_id).sort((a, b) => a.timestamp_seconds - b.timestamp_seconds);
  return (
    <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
      <h2 className="text-xl font-bold mb-3">Frame Gallery <span className="text-sm font-normal text-slate-400">({frames.length})</span></h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {frames.map((f) => (
          <button key={f.id} onClick={() => setActive(f)} className="text-left bg-slate-800/40 border border-slate-700 rounded-lg overflow-hidden hover:border-cyan-500/50 transition">
            <div className="aspect-video bg-slate-900 relative">
              {f.image_url
                ? <img src={f.image_url} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">No image</div>}
              {f.is_representative && <span className="absolute top-1 left-1 text-[10px] bg-cyan-600/80 px-1.5 rounded">REP</span>}
              <span className="absolute bottom-1 right-1 text-[10px] bg-black/60 px-1.5 rounded">{formatTimestamp(f.timestamp_seconds)}</span>
            </div>
            <div className="p-2">
              <div className="text-xs text-slate-400 truncate">Scene {f.scene_index ?? '—'}</div>
              <div className="text-xs text-slate-500 truncate">{f.frame_summary || '—'}</div>
            </div>
          </button>
        ))}
      </div>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-3xl bg-slate-900 border-slate-700">
          {active && (() => {
            const scene = scenes.find((s) => s.id === active.scene_id);
            const nbrs = neighbors(active);
            return (
              <>
                <DialogHeader><DialogTitle>Frame {active.frame_index} · {formatTimestamp(active.timestamp_seconds)}</DialogTitle></DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="aspect-video bg-black rounded-lg overflow-hidden">
                    {active.image_url
                      ? <img src={active.image_url} className="w-full h-full object-cover" alt="" />
                      : <div className="w-full h-full flex items-center justify-center text-slate-500">No image generated</div>}
                  </div>
                  <div className="text-sm space-y-2">
                    <div><span className="text-slate-500">Scene:</span> {scene ? `#${scene.scene_index} (${formatTimestamp(scene.start_time_seconds)}–${formatTimestamp(scene.end_time_seconds)})` : '—'}</div>
                    <div><span className="text-slate-500">Summary:</span> {active.frame_summary || scene?.scene_summary || '—'}</div>
                    {active.ocr_text && <div><span className="text-slate-500">OCR:</span> <span className="text-amber-300">{active.ocr_text}</span></div>}
                    <div><span className="text-slate-500">Objects:</span> {parseJson(active.detected_objects_json).join(', ') || '—'}</div>
                    <div><span className="text-slate-500">Entities:</span> {parseJson(active.detected_entities_json).join(', ') || '—'}</div>
                    {scene?.transcript_excerpt && <div><span className="text-slate-500">Transcript:</span> <span className="italic">“{scene.transcript_excerpt}”</span></div>}
                    <div>
                      <span className="text-slate-500">Neighbors in segment:</span>
                      <div className="flex gap-1.5 mt-1 flex-wrap">
                        {nbrs.map((n) => (
                          <button key={n.id} onClick={() => setActive(n)} className={`text-[10px] px-1.5 py-0.5 rounded ${n.id === active.id ? 'bg-cyan-600' : 'bg-slate-700 hover:bg-slate-600'}`}>
                            {formatTimestamp(n.timestamp_seconds)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </section>
  );
}