import React, { useMemo, useState } from 'react';
import { CalendarDays, Image as ImageIcon, Play, Upload, Trash2, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

const DATES = [
  { key: '2026-08-26', label: '26', day: 'WED' },
  { key: '2026-08-27', label: '27', day: 'THU' },
  { key: '2026-08-28', label: '28', day: 'FRI' },
  { key: '2026-08-29', label: '29', day: 'SAT' },
];

const MOMENTS = [
  { id: '26-1', date: '2026-08-26', time: '8:42 PM', title: 'The clutch save', tag: 'HIGHLIGHT', game: 'SMITE 2', type: 'video', description: 'A last-second play that turned the match around.', tone: 'from-cyan-400/30 via-slate-950 to-blue-950' },
  { id: '26-2', date: '2026-08-26', time: '9:18 PM', title: 'Chat lost it', tag: 'FUNNY', game: 'SMITE 2', type: 'image', description: 'A chaotic community moment saved from the broadcast.', tone: 'from-purple-400/30 via-slate-950 to-fuchsia-950' },
  { id: '26-3', date: '2026-08-26', time: '10:03 PM', title: 'Perfect finish', tag: 'PLAY', game: 'SMITE 2', type: 'video', description: 'Clean execution with the squad celebrating.', tone: 'from-amber-300/30 via-slate-950 to-orange-950' },
  { id: '27-1', date: '2026-08-27', time: '7:12 PM', title: 'Boss down', tag: 'BOSS', game: 'The Elder Scrolls', type: 'video', description: 'The boss fight finally paid off after a long run.', tone: 'from-emerald-300/30 via-slate-950 to-teal-950' },
  { id: '27-2', date: '2026-08-27', time: '8:06 PM', title: 'Unexpected reaction', tag: 'FUNNY', game: 'The Elder Scrolls', type: 'image', description: 'One of those moments that only makes sense live.', tone: 'from-pink-300/30 via-slate-950 to-rose-950' },
  { id: '27-3', date: '2026-08-27', time: '9:31 PM', title: 'Rare drop', tag: 'LOOT', game: 'The Elder Scrolls', type: 'video', description: 'A rare reward appears at exactly the right time.', tone: 'from-violet-300/30 via-slate-950 to-indigo-950' },
  { id: '28-1', date: '2026-08-28', time: '6:48 PM', title: 'One HP moment', tag: 'CLUTCH', game: 'Fallout', type: 'video', description: 'Survived with almost nothing left and kept the run alive.', tone: 'from-lime-300/30 via-slate-950 to-green-950' },
  { id: '28-2', date: '2026-08-28', time: '8:22 PM', title: 'Community moment', tag: 'COMMUNITY', game: 'Fallout', type: 'image', description: 'A screenshot saved from the middle of the broadcast.', tone: 'from-sky-300/30 via-slate-950 to-cyan-950' },
  { id: '29-1', date: '2026-08-29', time: '5:14 PM', title: 'The big play', tag: 'FEATURED', game: 'Cyberpunk 2077', type: 'video', description: 'The standout moment from the session.', tone: 'from-fuchsia-300/30 via-slate-950 to-purple-950' },
];

function normalize(items) {
  const uploaded = (items || []).map((item, index) => {
    const url = typeof item === 'string' ? item : item?.url;
    if (!url) return null;
    return {
      id: `uploaded-${index}`,
      url,
      date: typeof item === 'object' && item?.date ? item.date : DATES[index % DATES.length].key,
      time: typeof item === 'object' && item?.time ? item.time : `${7 + (index % 4)}:${String((index * 13) % 60).padStart(2, '0')} PM`,
      title: typeof item === 'object' && item?.title ? item.title : `Saved moment ${index + 1}`,
      tag: typeof item === 'object' && item?.tag ? item.tag : 'SAVED',
      game: typeof item === 'object' && item?.game ? item.game : 'Stream Highlight',
      type: typeof item === 'object' && item?.type ? item.type : 'image',
      description: typeof item === 'object' && item?.description ? item.description : 'A saved moment from the creator broadcast.',
      tone: 'from-cyan-300/20 via-slate-950 to-indigo-950',
    };
  }).filter(Boolean);
  return [...uploaded, ...MOMENTS];
}

function Preview({ moment, controls = false }) {
  if (moment?.url) {
    return moment.type === 'video'
      ? <video src={moment.url} controls={controls} muted={!controls} className="absolute inset-0 h-full w-full object-cover bg-black" />
      : <img src={moment.url} alt={moment.title} className="absolute inset-0 h-full w-full object-cover" />;
  }
  return <div className={`absolute inset-0 bg-gradient-to-br ${moment?.tone || 'from-cyan-400/20 via-slate-950 to-indigo-950'}`} />;
}

export default function GallerySection({ isEditMode, galleryImages = [], onUpdateImages, onClose, fullscreen = false, onFullscreenChange }) {
  const [date, setDate] = useState(DATES[1].key);
  const [selectedId, setSelectedId] = useState(null);
  const [game, setGame] = useState('All Games');
  const moments = useMemo(() => normalize(galleryImages), [galleryImages]);
  const games = useMemo(() => ['All Games', ...Array.from(new Set(moments.map((m) => m.game)))], [moments]);
  const visible = useMemo(() => moments.filter((m) => m.date === date && (game === 'All Games' || m.game === game)), [moments, date, game]);
  const selected = moments.find((m) => m.id === selectedId) || visible[0] || moments[0];

  const selectDate = (next) => { setDate(next); setSelectedId(null); };
  const selectMoment = (m) => { setDate(m.date); setSelectedId(m.id); };

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
          additions.push({ url: result.file_url, type: file.type.startsWith('video/') ? 'video' : 'image', date, title: file.name.replace(/\.[^.]+$/, ''), game: 'Stream Highlight', tag: 'SAVED' });
        } catch {
          additions.push({ url: URL.createObjectURL(file), type: file.type.startsWith('video/') ? 'video' : 'image', date, title: file.name.replace(/\.[^.]+$/, ''), game: 'Stream Highlight', tag: 'SAVED' });
        }
      }
      onUpdateImages?.([...(galleryImages || []), ...additions]);
    };
    input.click();
  };

  const remove = (index) => onUpdateImages?.((galleryImages || []).filter((_, i) => i !== index));

  const Timeline = () => (
    <div className="relative h-16 w-full">
      <div className="absolute left-0 right-0 top-1/2 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      <div className="absolute left-[4%] right-[4%] top-1/2 h-[4px] -translate-y-1/2 bg-gradient-to-r from-transparent via-cyan-100/35 to-transparent" />
      <div className="relative flex h-full items-center justify-between px-[3%]">
        {DATES.map((item) => {
          const count = moments.filter((m) => m.date === item.key).length;
          return <button key={item.key} type="button" onClick={() => selectDate(item.key)} className="group relative h-full w-20">
            <span className={`absolute left-1/2 top-1/2 h-9 w-px -translate-x-1/2 -translate-y-1/2 ${date === item.key ? 'bg-cyan-200 shadow-[0_0_15px_rgba(103,232,249,.8)]' : 'bg-white/20 group-hover:bg-white/55'}`} />
            <span className={`absolute left-1/2 top-[58%] -translate-x-1/2 text-[11px] font-bold ${date === item.key ? 'text-cyan-200' : 'text-white/50 group-hover:text-white'}`}>{item.label}</span>
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 whitespace-nowrap text-[6px] tracking-[0.18em] text-white/25">{item.day} · {count}</span>
          </button>;
        })}
      </div>
    </div>
  );

  const MomentStrip = () => (
    <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide py-3">
      {visible.map((m) => <button key={m.id} type="button" onClick={() => selectMoment(m)} className={`group relative h-24 w-40 shrink-0 overflow-hidden border text-left transition-all ${selected?.id === m.id ? 'border-cyan-300/65 shadow-[0_0_24px_rgba(34,211,238,.16)]' : 'border-white/10 hover:border-white/30'}`}>
        <Preview moment={m} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />
        <div className="absolute bottom-2 left-2 right-2"><div className="text-[6px] uppercase tracking-wider text-cyan-200/70">{m.tag} · {m.time}</div><div className="truncate text-[9px] font-bold text-white">{m.title}</div></div>
        {m.type === 'video' ? <Play className="absolute right-2 top-2 h-3 w-3 text-white" fill="currentColor" /> : <ImageIcon className="absolute right-2 top-2 h-3 w-3 text-white/70" />}
      </button>)}
    </div>
  );

  if (fullscreen) {
    return <div className="relative h-full w-full overflow-hidden bg-black/95 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_30%,rgba(34,211,238,.07),transparent_28%),radial-gradient(circle_at_90%_70%,rgba(124,58,237,.07),transparent_30%)]" />
      <div className="relative flex h-full min-h-0 flex-col">
        <header className="shrink-0 border-b border-white/10 px-6 py-4 md:px-8">
          <div className="flex items-center justify-between gap-4"><div><div className="text-[9px] uppercase tracking-[0.34em] text-cyan-300/55">Gallery · Focus Mode</div><h2 className="text-xl font-bold">Recent Moments</h2></div><div className="flex items-center gap-2">{isEditMode && <Button size="sm" onClick={upload} className="bg-white text-black hover:bg-slate-200"><Upload className="mr-2 h-3.5 w-3.5" />Add Moment</Button>}<button type="button" onClick={() => onFullscreenChange?.(false)} className="h-8 w-8 border border-white/10 bg-white/5 text-white/70 hover:text-white" aria-label="Exit full screen"><Minimize2 className="mx-auto h-4 w-4" /></button></div></div>
        </header>
        <div className="flex min-h-0 flex-1">
          <aside className="w-[20%] min-w-[210px] max-w-[320px] shrink-0 overflow-y-auto px-5 py-6 md:px-7"><div className="mb-3 text-[8px] uppercase tracking-[0.28em] text-white/30">Games</div><div className="space-y-1">{games.map((g) => <button key={g} type="button" onClick={() => setGame(g)} className={`w-full border px-3 py-2.5 text-left text-[10px] transition-colors ${game === g ? 'border-cyan-300/35 bg-cyan-300/[0.06] text-cyan-100' : 'border-transparent text-white/50 hover:bg-white/[0.04] hover:text-white/80'}`}>{g}</button>)}</div>{isEditMode && galleryImages.length > 0 && <div className="mt-8 border-t border-white/10 pt-4"><div className="mb-2 text-[8px] uppercase tracking-[0.25em] text-white/25">Uploaded</div>{galleryImages.map((_, index) => <button key={index} type="button" onClick={() => remove(index)} className="flex w-full items-center justify-between px-2 py-1.5 text-[8px] text-white/35 hover:text-red-300"><span>Saved media {index + 1}</span><Trash2 className="h-3 w-3" /></button>)}</div>}</aside>
          <div className="relative my-auto h-[76%] w-px shrink-0 bg-gradient-to-b from-transparent via-cyan-200/45 to-transparent" />
          <main className="min-w-0 flex-1 overflow-hidden px-5 py-5 md:px-8 md:py-6"><div className="flex h-full min-h-0 flex-col"><div className="shrink-0"><div className="mb-2 flex items-center gap-2 text-[8px] uppercase tracking-[0.25em] text-white/30"><CalendarDays className="h-3 w-3" />Timeline · {date}</div><Timeline /></div><div className="shrink-0 border-t border-white/10 pt-1"><MomentStrip /></div><div className="relative min-h-0 flex-1 border-t border-white/10 pt-5"><div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />{selected && <div className="grid h-full min-h-0 gap-6 lg:grid-cols-[1.55fr_.45fr]"><div className="relative min-h-[220px] overflow-hidden bg-black/50"><Preview moment={selected} controls={selected.type === 'video'} />{!selected.url && <div className="absolute inset-0 flex items-center justify-center"><div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-white/5"><Play className="h-5 w-5 text-white/75" fill="currentColor" /></div></div>}</div><div className="flex flex-col justify-center"><div className="text-[7px] uppercase tracking-[0.28em] text-cyan-300/55">{selected.game} · {selected.time}</div><h3 className="mt-2 text-2xl font-bold">{selected.title}</h3><p className="mt-3 text-xs leading-5 text-white/40">{selected.description}</p><div className="mt-4 text-[8px] uppercase tracking-[0.22em] text-white/25">{selected.tag} · {selected.type}</div></div></div>}</div></div></div></main>
        </div>
      </div>
    </div>;
  }

  return <div className="h-full w-full overflow-hidden border border-white/[0.08] bg-slate-950/80 text-white backdrop-blur-2xl">
    <div className="flex h-full w-full flex-col p-4 md:p-6">
      <div className="mb-2 flex shrink-0 items-center justify-between gap-4"><div><div className="text-[9px] uppercase tracking-[0.3em] text-cyan-300/60">Gallery</div><h3 className="text-lg font-bold">Moments Timeline</h3></div><div className="flex items-center gap-2">{isEditMode && <Button size="sm" onClick={upload} className="bg-white text-black hover:bg-slate-200"><Upload className="mr-2 h-3.5 w-3.5" />Add Moment</Button>}<button type="button" onClick={() => onFullscreenChange?.(true)} className="h-8 w-8 border border-white/10 bg-white/5 text-white/70 hover:text-white" aria-label="Full screen"><Maximize2 className="mx-auto h-4 w-4" /></button></div></div>
      <Timeline />
      <div className="shrink-0"> <MomentStrip /></div>
      <div className="relative min-h-0 flex-1 border-t border-white/10 pt-4"><div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" /><div className="grid h-full min-h-0 grid-cols-[7fr_3fr] gap-4"><div className="min-w-0 overflow-hidden"><div className="h-full overflow-y-auto pr-2 scrollbar-hide"><div className="grid grid-cols-2 gap-3 xl:grid-cols-3">{visible.map((m) => <button key={m.id} type="button" onClick={() => selectMoment(m)} className={`relative aspect-video overflow-hidden border text-left ${selected?.id === m.id ? 'border-cyan-300/60' : 'border-white/10 hover:border-white/25'}`}><Preview moment={m} /><div className="absolute inset-0 bg-gradient-to-t from-black/85 to-transparent" /><div className="absolute bottom-2 left-2 right-2"><div className="text-[6px] uppercase tracking-wider text-cyan-200/70">{m.tag} · {m.time}</div><div className="truncate text-[9px] font-bold">{m.title}</div></div></button>)}</div></div></div><div className="relative min-w-0 border-l border-white/10 pl-4"><div className="h-full overflow-hidden">{selected && <div className="flex h-full flex-col"><div className="relative min-h-0 flex-1 overflow-hidden bg-black/40"><Preview moment={selected} controls={selected.type === 'video'} /></div><div className="shrink-0 pt-3"><div className="text-[7px] uppercase tracking-[0.25em] text-cyan-300/55">{selected.game} · {selected.time}</div><div className="mt-1 text-sm font-bold">{selected.title}</div><div className="mt-1 text-[9px] leading-4 text-white/35">{selected.description}</div></div></div>}</div></div></div></div>
    </div>
  </div>;
}
