import React from 'react';
import { HeartHandshake, Play } from 'lucide-react';
import { CATEGORY_META, COMMUNITY_CLIPS } from './galleryClipData';

// Community-contributed clips — saved by viewers as a favor to the streamer
export default function CommunityClipsRail({ onSelectClip }) {
  return (
    <section className="mt-3 shrink-0 border-t border-white/10 pt-3">
      <div className="mb-2 flex items-center gap-2">
        <HeartHandshake className="h-3.5 w-3.5 text-cyan-300/80" />
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white">Community Clips</div>
          <div className="text-[8px] text-white/35">Clipped by viewers as a favor &amp; contribution to the streamer — requested moments saved here</div>
        </div>
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
        {COMMUNITY_CLIPS.map((clip) => {
          const meta = CATEGORY_META[clip.category] || CATEGORY_META.SAVED;
          return (
            <button
              key={clip.id}
              type="button"
              onClick={() => onSelectClip?.({ ...clip, type: 'video', date: 'community', description: clip.note })}
              className="group relative h-32 w-52 shrink-0 overflow-hidden border border-white/10 text-left transition-all hover:-translate-y-0.5 hover:border-cyan-300/50"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${clip.tone}`} />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(255,255,255,.10),transparent_42%)]" />
              <div className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-white/20 bg-black/40"><Play className="h-2.5 w-2.5 text-white" fill="currentColor" /></div>
              <span className={`absolute left-1.5 top-1.5 border px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wider backdrop-blur-md ${meta.chip}`}>{meta.label}</span>
              <div className="absolute bottom-1.5 left-2 right-2">
                <div className="truncate text-[11px] font-extrabold text-white">{clip.title}</div>
                <div className="mt-0.5 truncate text-[8px] text-white/45">{clip.game} · {clip.time}</div>
                <div className="mt-1 flex items-center gap-1 truncate text-[8px] font-semibold text-cyan-200/80">
                  <HeartHandshake className="h-2.5 w-2.5 shrink-0" />Clipped by {clip.contributor}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}