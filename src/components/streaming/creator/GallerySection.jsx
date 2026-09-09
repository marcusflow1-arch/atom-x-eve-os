import React, { useMemo, useState } from 'react';
import { Play, Trash2, Upload, Maximize2, Minimize2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import MomentsTimeline from '@/components/streaming/gallery/MomentsTimeline';
import CommunityClipsRail from '@/components/streaming/gallery/CommunityClipsRail';
import { ClipPreview } from '@/components/streaming/gallery/ClipCard';
import { CATEGORY_META, CLIPS, CLIP_DAYS } from '@/components/streaming/gallery/galleryClipData';

// Merge creator-uploaded media with the seeded clip farm
function normalizeClips(items) {
  const uploaded = (items || []).map((item, index) => {
    const url = typeof item === 'string' ? item : item?.url;
    if (!url) return null;
    const category = typeof item === 'object' && item.category && CATEGORY_META[item.category] ? item.category : 'SAVED';
    return {
      id: `uploaded-${index}`,
      url,
      date: (typeof item === 'object' && item.date) || CLIP_DAYS[CLIP_DAYS.length - 1].key,
      time: (typeof item === 'object' && item.time) || '11:59 PM',
      title: (typeof item === 'object' && item.title) || `Saved moment ${index + 1}`,
      category,
      game: (typeof item === 'object' && item.game) || 'Stream Highlight',
      type: (typeof item === 'object' && item.type) || 'image',
      description: (typeof item === 'object' && item.description) || 'A saved moment from the creator broadcast.',
      tone: 'from-cyan-300/20 via-slate-950 to-indigo-950',
    };
  }).filter(Boolean);
  return [...uploaded, ...CLIPS];
}

function ClipViewer({ clip, onClose }) {
  if (!clip) return null;
  const meta = CATEGORY_META[clip.category] || CATEGORY_META.SAVED;
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/75 p-6 backdrop-blur-sm" onClick={onClose}>
      <div className="flex w-full max-w-3xl items-stretch gap-5" onClick={(event) => event.stopPropagation()}>
        <div className="relative min-h-[200px] flex-1 overflow-hidden border border-white/15 bg-black">
          <ClipPreview clip={clip} controls={clip.type === 'video'} />
          {!clip.url && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-white/5"><Play className="h-5 w-5 text-white/75" fill="currentColor" /></div>
            </div>
          )}
        </div>
        <div className="flex w-60 shrink-0 flex-col justify-center">
          <span className={`w-fit border px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.18em] ${meta.chip}`}>{meta.label}</span>
          <h4 className="mt-3 text-xl font-bold text-white">{clip.title}</h4>
          <div className="mt-2 text-[9px] uppercase tracking-[0.2em] text-cyan-300/55">{clip.game} · {clip.time}</div>
          <p className="mt-3 text-xs leading-5 text-white/45">{clip.description}</p>
          {clip.contributor && <div className="mt-3 text-[9px] text-white/40">Clipped by {clip.contributor} — community contribution</div>}
        </div>
      </div>
      <button type="button" onClick={onClose} className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center border border-white/10 bg-white/5 text-white/70 hover:text-white" aria-label="Close clip viewer"><X className="h-4 w-4" /></button>
    </div>
  );
}

export default function GallerySection({ isEditMode, galleryImages = [], onUpdateImages }) {
  const [fullscreen, setFullscreen] = useState(false);
  const [selected, setSelected] = useState(null);
  const clips = useMemo(() => normalizeClips(galleryImages), [galleryImages]);

  const upload = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/*';
    input.multiple = true;
    input.onchange = async (event) => {
      const files = Array.from(event.target.files || []);
      if (!files.length) return;
      const additions = [];
      for (const file of files) {
        try {
          const result = await base44.integrations.Core.UploadFile({ file });
          additions.push({ url: result.file_url, type: file.type.startsWith('video/') ? 'video' : 'image', title: file.name.replace(/\.[^.]+$/, ''), game: 'Stream Highlight', category: 'SAVED' });
        } catch {
          additions.push({ url: URL.createObjectURL(file), type: file.type.startsWith('video/') ? 'video' : 'image', title: file.name.replace(/\.[^.]+$/, ''), game: 'Stream Highlight', category: 'SAVED' });
        }
      }
      onUpdateImages?.([...(galleryImages || []), ...additions]);
    };
    input.click();
  };

  const remove = (index) => onUpdateImages?.((galleryImages || []).filter((_, i) => i !== index));

  const content = (
    <div className={`relative flex h-full w-full flex-col ${fullscreen ? 'gap-5 p-6 md:p-8' : ''}`}>
      <div className="flex shrink-0 items-center justify-between gap-4">
        <div>
          <div className="text-[9px] uppercase tracking-[0.3em] text-cyan-300/60">Gallery · Clip Farm</div>
          <h3 className="text-lg font-bold text-white md:text-xl">Moments Timeline</h3>
          <p className="text-[9px] text-white/35">Cool, epic, odd and funny moments clipped from the stream — browsed day by day</p>
        </div>
        <div className="flex items-center gap-2">
          {isEditMode && <Button size="sm" onClick={upload} className="bg-white text-black hover:bg-slate-200"><Upload className="mr-2 h-3.5 w-3.5" />Add Clip</Button>}
          <button type="button" onClick={() => setFullscreen((value) => !value)} className="h-8 w-8 border border-white/10 bg-white/5 text-white/70 hover:text-white" aria-label={fullscreen ? 'Exit full screen' : 'Full screen'}>
            {fullscreen ? <Minimize2 className="mx-auto h-4 w-4" /> : <Maximize2 className="mx-auto h-4 w-4" />}
          </button>
        </div>
      </div>

      <MomentsTimeline clips={clips} selectedId={selected?.id} onSelectClip={setSelected} />
      <CommunityClipsRail onSelectClip={setSelected} />

      {isEditMode && galleryImages.length > 0 && (
        <div className="mt-2 flex shrink-0 items-center gap-2 border-t border-white/10 pt-2">
          <span className="text-[8px] uppercase tracking-[0.22em] text-white/25">Uploaded</span>
          {galleryImages.map((_, index) => (
            <button key={index} type="button" onClick={() => remove(index)} className="flex items-center gap-1 border border-white/10 px-2 py-1 text-[8px] text-white/40 hover:border-red-300/40 hover:text-red-300" title="Remove upload">
              <Trash2 className="h-2.5 w-2.5" />{index + 1}
            </button>
          ))}
        </div>
      )}

      {selected && <ClipViewer clip={selected} onClose={() => setSelected(null)} />}
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-4 z-50 overflow-hidden border border-white/15 bg-slate-950/95 text-white shadow-[0_30px_100px_rgba(0,0,0,.7)] backdrop-blur-2xl md:inset-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_25%,rgba(34,211,238,.06),transparent_30%),radial-gradient(circle_at_90%_75%,rgba(124,58,237,.07),transparent_32%)]" />
        <div className="relative h-full">{content}</div>
      </div>
    );
  }

  return <div className="relative h-full w-full overflow-hidden border border-white/[0.08] bg-slate-950/80 text-white backdrop-blur-2xl">{content}</div>;
}