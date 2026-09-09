import React, { useMemo, useRef } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { CATEGORY_META, CATEGORY_ORDER, CLIP_DAYS } from './galleryClipData';
import ClipCard from './ClipCard';

// Horizontally scrolling timeline — one column per stream day, clips grouped by category
export default function MomentsTimeline({ clips, selectedId, onSelectClip }) {
  const railRef = useRef(null);
  const scrollBy = (dir) => railRef.current?.scrollBy({ left: dir * 620, behavior: 'smooth' });

  const grouped = useMemo(() => {
    const map = {};
    for (const day of CLIP_DAYS) {
      const dayClips = clips.filter((c) => c.date === day.key);
      const byCategory = {};
      for (const clip of dayClips) {
        (byCategory[clip.category] ||= []).push(clip);
      }
      map[day.key] = byCategory;
    }
    return map;
  }, [clips]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-2 flex shrink-0 items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-[8px] uppercase tracking-[0.26em] text-white/30">
          <CalendarDays className="h-3 w-3" />
          Moments Timeline · scroll day by day
        </div>
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => scrollBy(-1)} className="flex h-7 w-7 items-center justify-center border border-white/10 bg-white/5 text-white/60 hover:text-white" aria-label="Scroll timeline left"><ChevronLeft className="h-4 w-4" /></button>
          <button type="button" onClick={() => scrollBy(1)} className="flex h-7 w-7 items-center justify-center border border-white/10 bg-white/5 text-white/60 hover:text-white" aria-label="Scroll timeline right"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        <div className="absolute left-0 right-0 top-1/2 -z-0 hidden h-px bg-white/10" />
        <div ref={railRef} className="flex h-full gap-4 overflow-x-auto scrollbar-hide">
          {CLIP_DAYS.map((day) => {
            const byCategory = grouped[day.key] || {};
            const count = Object.values(byCategory).reduce((sum, list) => sum + list.length, 0);
            return (
              <div key={day.key} className="flex w-[300px] shrink-0 flex-col overflow-hidden border border-white/[0.07] bg-white/[0.02]">
                <div className="flex shrink-0 items-center gap-3 border-b border-white/[0.07] bg-white/[0.025] px-3 py-2">
                  <div className="text-lg font-extrabold text-white">{day.label}</div>
                  <div className="min-w-0">
                    <div className="text-[8px] uppercase tracking-[0.2em] text-white/40">{day.weekday} · {day.month}</div>
                    <div className="text-[8px] uppercase tracking-wider text-cyan-300/55">{count} clip{count === 1 ? '' : 's'}</div>
                  </div>
                </div>
                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3 scrollbar-hide">
                  {count === 0 && <div className="pt-6 text-center text-[9px] uppercase tracking-wider text-white/25">No clips saved</div>}
                  {CATEGORY_ORDER.filter((cat) => byCategory[cat]?.length).map((cat) => {
                    const meta = CATEGORY_META[cat];
                    return (
                      <div key={cat}>
                        <span className={`mb-1.5 inline-block border px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-[0.18em] ${meta.chip}`}>{meta.label} · {byCategory[cat].length}</span>
                        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                          {byCategory[cat].map((clip) => (
                            <ClipCard key={clip.id} clip={clip} selected={selectedId === clip.id} onSelect={onSelectClip} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}