import React from 'react';
import { Image as ImageIcon, Play } from 'lucide-react';
import { CATEGORY_META } from './galleryClipData';

// Renders a clip's media (uploaded file) or its gradient placeholder
export function ClipPreview({ clip, controls = false }) {
  if (clip?.url) {
    return clip.type === 'video'
      ? <video src={clip.url} controls={controls} muted={!controls} className="absolute inset-0 h-full w-full object-cover bg-black" />
      : <img src={clip.url} alt={clip.title} className="absolute inset-0 h-full w-full object-cover" />;
  }
  return <div className={`absolute inset-0 bg-gradient-to-br ${clip?.tone || 'from-cyan-400/20 via-slate-950 to-indigo-950'}`} />;
}

export default function ClipCard({ clip, selected, onSelect }) {
  const meta = CATEGORY_META[clip.category] || CATEGORY_META.SAVED;
  return (
    <button
      type="button"
      onClick={() => onSelect?.(clip)}
      className={`group relative aspect-video w-40 shrink-0 overflow-hidden border text-left transition-all ${selected ? 'border-cyan-300/70 shadow-[0_0_22px_rgba(34,211,238,.18)]' : 'border-white/10 hover:-translate-y-0.5 hover:border-white/35'}`}
    >
      <ClipPreview clip={clip} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />
      <div className="absolute right-1.5 top-1.5">
        {clip.type === 'video' ? <Play className="h-3 w-3 text-white" fill="currentColor" /> : <ImageIcon className="h-3 w-3 text-white/70" />}
      </div>
      <span className={`absolute left-1.5 top-1.5 border px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wider backdrop-blur-md ${meta.chip}`}>{meta.label}</span>
      <div className="absolute bottom-1.5 left-1.5 right-1.5">
        <div className="text-[7px] uppercase tracking-wider text-white/40">{clip.time}</div>
        <div className="truncate text-[10px] font-bold text-white">{clip.title}</div>
      </div>
    </button>
  );
}