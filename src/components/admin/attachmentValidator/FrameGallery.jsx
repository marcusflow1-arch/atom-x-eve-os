import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { formatTimestamp } from './avvShared';

function FlagBadges({ f }) {
  return (
    <>
      {f.clipping_detected && <span className="text-[10px] bg-red-500/20 text-red-300 px-1.5 rounded">CLIP</span>}
      {f.drift_detected && <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 rounded">DRIFT</span>}
      {f.occlusion_detected && <span className="text-[10px] bg-orange-500/20 text-orange-300 px-1.5 rounded">OCCL</span>}
    </>
  );
}

export default function FrameGallery({ frames, onUpdate }) {
  const [active, setActive] = useState(null);
  const [draft, setDraft] = useState({ admin_notes: '', clipping_detected: false, drift_detected: false, occlusion_detected: false });

  useEffect(() => {
    if (active) {
      setDraft({
        admin_notes: active.admin_notes || '',
        clipping_detected: !!active.clipping_detected,
        drift_detected: !!active.drift_detected,
        occlusion_detected: !!active.occlusion_detected,
      });
    }
  }, [active]);

  if (!frames.length) {
    return (
      <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-xl font-bold mb-1">Frame Gallery</h2>
        <p className="text-slate-400 text-sm">Sampled validation frames will appear here after a run.</p>
      </section>
    );
  }

  const idx = active ? frames.findIndex((f) => f.id === active.id) : -1;
  const prev = idx > 0 ? frames[idx - 1] : null;
  const next = idx >= 0 && idx < frames.length - 1 ? frames[idx + 1] : null;

  const save = async () => {
    if (!active) return;
    const upd = await onUpdate(active.id, draft);
    if (upd) setActive(upd);
  };

  return (
    <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
      <h2 className="text-xl font-bold mb-3">Frame Gallery <span className="text-sm font-normal text-slate-400">({frames.length})</span></h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {frames.map((f) => (
          <button key={f.id} onClick={() => setActive(f)} className="text-left bg-slate-800/40 border border-slate-700 rounded-lg overflow-hidden hover:border-cyan-500/50 transition">
            <div className="aspect-video bg-slate-900 relative">
              {f.image_url
                ? <img src={f.image_url} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">No render</div>}
              <span className="absolute bottom-1 right-1 text-[10px] bg-black/60 px-1.5 rounded">{formatTimestamp(f.timestamp_seconds)}</span>
              <div className="absolute top-1 left-1 flex gap-1"><FlagBadges f={f} /></div>
            </div>
            <div className="p-2">
              <div className="text-xs text-slate-400">Frame {f.frame_index}</div>
              <div className="text-xs text-slate-500 truncate">{f.visual_summary || (f.alignment_notes || '—')}</div>
            </div>
          </button>
        ))}
      </div>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-3xl bg-slate-900 border-slate-700">
          {active && (
            <>
              <DialogHeader><DialogTitle>Frame {active.frame_index} · {formatTimestamp(active.timestamp_seconds)}</DialogTitle></DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="aspect-video bg-black rounded-lg overflow-hidden">
                    {active.image_url
                      ? <img src={active.image_url} className="w-full h-full object-cover" alt="" />
                      : <div className="w-full h-full flex items-center justify-center text-slate-500">No render</div>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" disabled={!prev} onClick={() => setActive(prev)} className="border-slate-600 text-slate-200">← Prev</Button>
                    <Button size="sm" variant="outline" disabled={!next} onClick={() => setActive(next)} className="border-slate-600 text-slate-200">Next →</Button>
                  </div>
                </div>
                <div className="text-sm space-y-3">
                  <div>
                    <div className="text-slate-500 mb-1">Visual summary</div>
                    <p className="text-slate-200">{active.visual_summary || '—'}</p>
                  </div>
                  <div>
                    <div className="text-slate-500 mb-1">Alignment notes</div>
                    <p className="text-slate-200">{active.alignment_notes || '—'}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <div className="flex items-center gap-2"><Switch checked={draft.clipping_detected} onCheckedChange={(v) => setDraft((d) => ({ ...d, clipping_detected: v }))} /><span className="text-xs text-red-300">Clipping</span></div>
                    <div className="flex items-center gap-2"><Switch checked={draft.drift_detected} onCheckedChange={(v) => setDraft((d) => ({ ...d, drift_detected: v }))} /><span className="text-xs text-amber-300">Drift</span></div>
                    <div className="flex items-center gap-2"><Switch checked={draft.occlusion_detected} onCheckedChange={(v) => setDraft((d) => ({ ...d, occlusion_detected: v }))} /><span className="text-xs text-orange-300">Occlusion</span></div>
                  </div>
                  <div>
                    <div className="text-slate-500 mb-1">Admin notes</div>
                    <Textarea value={draft.admin_notes} onChange={(e) => setDraft((d) => ({ ...d, admin_notes: e.target.value }))} placeholder="Add review notes…" className="bg-slate-900 border-slate-700" />
                  </div>
                  <Button onClick={save} size="sm" className="bg-cyan-600 hover:bg-cyan-700">Save notes & flags</Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}