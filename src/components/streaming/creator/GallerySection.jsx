import React, { useMemo, useState } from 'react';
import { CalendarDays, Film, Image as ImageIcon, Play, Plus, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';

const DEMO_DATES = [
  { key: '2026-08-26', label: '26', weekday: 'WED' },
  { key: '2026-08-27', label: '27', weekday: 'THU' },
  { key: '2026-08-28', label: '28', weekday: 'FRI' },
  { key: '2026-08-29', label: '29', weekday: 'SAT' },
];

const DEMO_MOMENTS = [
  { id: 'm26-1', date: '2026-08-26', time: '8:42 PM', title: 'The clutch save', type: 'video', tag: 'HIGHLIGHT', game: 'SMITE 2', description: 'A last-second play that turned the match around.', tone: 'from-cyan-400/30 via-slate-900 to-blue-950' },
  { id: 'm26-2', date: '2026-08-26', time: '9:18 PM', title: 'Chat lost it', type: 'image', tag: 'FUNNY', game: 'SMITE 2', description: 'A chaotic moment that became an instant community favorite.', tone: 'from-purple-400/30 via-slate-900 to-fuchsia-950' },
  { id: 'm26-3', date: '2026-08-26', time: '10:03 PM', title: 'Perfect finish', type: 'video', tag: 'PLAY', game: 'SMITE 2', description: 'Clean execution with the whole squad celebrating.', tone: 'from-amber-300/30 via-slate-900 to-orange-950' },
  { id: 'm27-1', date: '2026-08-27', time: '7:12 PM', title: 'Boss down', type: 'video', tag: 'BOSS', game: 'The Elder Scrolls', description: 'The boss fight finally paid off after a long run.', tone: 'from-emerald-300/30 via-slate-900 to-teal-950' },
  { id: 'm27-2', date: '2026-08-27', time: '8:06 PM', title: 'Unexpected reaction', type: 'image', tag: 'FUNNY', game: 'The Elder Scrolls', description: 'One of those moments that only makes sense live.', tone: 'from-pink-300/30 via-slate-900 to-rose-950' },
  { id: 'm27-3', date: '2026-08-27', time: '9:31 PM', title: 'Rare drop', type: 'video', tag: 'LOOT', game: 'The Elder Scrolls', description: 'A rare reward appears at exactly the right time.', tone: 'from-violet-300/30 via-slate-900 to-indigo-950' },
  { id: 'm28-1', date: '2026-08-28', time: '6:48 PM', title: 'One HP moment', type: 'video', tag: 'CLUTCH', game: 'Fallout', description: 'Survived with almost nothing left and kept the run alive.', tone: 'from-lime-300/30 via-slate-900 to-green-950' },
  { id: 'm28-2', date: '2026-08-28', time: '8:22 PM', title: 'Community moment', type: 'image', tag: 'COMMUNITY', game: 'Fallout', description: 'A screenshot saved from the middle of the broadcast.', tone: 'from-sky-300/30 via-slate-900 to-cyan-950' },
  { id: 'm29-1', date: '2026-08-29', time: '5:14 PM', title: 'The big play', type: 'video', tag: 'FEATURED', game: 'Cyberpunk 2077', description: 'The standout moment from the session.', tone: 'from-fuchsia-300/30 via-slate-900 to-purple-950' },
];

function normalizeMoments(galleryImages) {
  const uploaded = (galleryImages || []).map((item, index) => {
    const url = typeof item === 'string' ? item : item?.url;
    const date = typeof item === 'object' && item?.date ? item.date : DEMO_DATES[index % DEMO_DATES.length].key;
    return {
      id: `uploaded-${index}`,
      date,
      time: typeof item === 'object' && item?.time ? item.time : `${7 + (index % 4)}:${String((index * 13) % 60).padStart(2, '0')} PM`,
      title: typeof item === 'object' && item?.title ? item.title : `Saved moment ${index + 1}`,
      type: typeof item === 'object' && item?.type ? item.type : 'image',
      tag: typeof item === 'object' && item?.tag ? item.tag : 'SAVED',
      game: typeof item === 'object' && item?.game ? item.game : 'Stream Highlight',
      description: typeof item === 'object' && item?.description ? item.description : 'A saved moment from the creator broadcast.',
      url,
      tone: 'from-cyan-300/20 via-slate-950 to-indigo-950',
    };
  }).filter((item) => item.url);
  return [...uploaded, ...DEMO_MOMENTS];
}

function MediaPreview({ moment, large = false }) {
  if (moment?.url) {
    return moment.type === 'video'
      ? <video src={moment.url} controls={large} muted={!large} className="absolute inset-0 h-full w-full object-cover bg-black" />
      : <img src={moment.url} alt={moment.title} className="absolute inset-0 h-full w-full object-cover" />;
  }
  return <div className={`absolute inset-0 bg-gradient-to-br ${moment?.tone || 'from-cyan-400/20 via-slate-950 to-indigo-950'}`} />;
}

export default function GallerySection({ isEditMode, galleryImages = [], onUpdateImages, onClose, fullscreen = false }) {
  const [selectedDate, setSelectedDate] = useState(DEMO_DATES[1].key);
  const [selectedMomentId, setSelectedMomentId] = useState(null);
  const [activeGame, setActiveGame] = useState('All Games');

  const moments = useMemo(() => normalizeMoments(galleryImages), [galleryImages]);
  const games = useMemo(() => ['All Games', ...Array.from(new Set(moments.map((moment) => moment.game)))], [moments]);
  const dateMoments = useMemo(() => moments.filter((moment) => moment.date === selectedDate && (activeGame === 'All Games' || moment.game === activeGame)), [moments, selectedDate, activeGame]);
  const selectedMoment = moments.find((moment) => moment.id === selectedMomentId) || dateMoments[0] || moments[0];

  const selectDate = (date) => {
    setSelectedDate(date);
    setSelectedMomentId(null);
  };

  const selectMoment = (moment) => {
    setSelectedDate(moment.date);
    setSelectedMomentId(moment.id);
  };

  const handleUpload = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/*';
    input.multiple = true;
    input.onchange = async (event) => {
      const files = Array.from(event.target.files || []);
      if (!files.length) return;
      const next = [];
      for (const file of files) {
        try {
          const { file_url } = await base44.integrations.Core.UploadFile({ file });
          next.push({ url: file_url, type: file.type.startsWith('video/') ? 'video' : 'image', date: selectedDate, title: file.name.replace(/\.[^.]+$/, ''), game: 'Stream Highlight', tag: 'SAVED' });
        } catch {
          next.push({ url: URL.createObjectURL(file), type: file.type.startsWith('video/') ? 'video' : 'image', date: selectedDate, title: file.name.replace(/\.[^.]+$/, ''), game: 'Stream Highlight', tag: 'SAVED' });
        }
      }
      onUpdateImages?.([...(galleryImages || []), ...next]);
    };
    input.click();
  };

  const handleRemove = (index) => onUpdateImages?.((galleryImages || []).filter((_, itemIndex) => itemIndex !== index));

  const dateMomentCounts = DEMO_DATES.map((date) => ({ ...date, count: moments.filter((moment) => moment.date === date.key).length }));

  const Timeline = ({ compact = false }) => (
    <div className={compact ? 'relative h-14' : 'relative h-16'}>
      <div className="absolute left-0 right-0 top-1/2 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
      <div className="absolute left-[8%] right-[8%] top-1/2 h-[3px] -translate-y-1/2 bg-gradient-to-r from-transparent via-cyan-200/30 to-transparent" />
      <div className="relative flex h-full items-center justify-between">
        {dateMomentCounts.map((date) => (
          <button key={date.key} type="button" onClick={() => selectDate(date.key)} className="group relative flex h-full w-16 flex-col items-center justify-center">
            <span className={`absolute top-1/2 h-7 w-px -translate-y-1/2 transition-all ${selectedDate === date.key ? 'bg-cyan-200 shadow-[0_0_14px_rgba(103,232,249,.65)]' : 'bg-white/20 group-hover:bg-white/45'}`} />
            <span className={`relative z-10 mt-8 text-[11px] font-bold ${selectedDate === date.key ? 'text-cyan-200' : 'text-white/55 group-hover:text-white'}`}>{date.label}</span>
            <span className="absolute bottom-0 text-[6px] tracking-[0.18em] text-white/25">{date.weekday} · {date.count}</span>
          </button>
        ))}
      </div>
    </div>
  );

  if (fullscreen) {
    return (
      <div className="relative h-full w-full overflow-hidden bg-black/75 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_35%,rgba(34,211,238,.08),transparent_28%),radial-gradient(circle_at_85%_65%,rgba(124,58,237,.08),transparent_30%)] pointer-events-none" />
        <div className="relative flex h-full min-h-0 flex-col">
          <header className="shrink-0 border-b border-white/10 px-6 py-4 md:px-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[9px] uppercase tracking-[0.34em] text-cyan-300/55">Gallery · Focus Mode</div>
                <h2 className="text-xl font-bold">Recent Moments</h2>
              </div>
              {isEditMode && <Button size="sm" onClick={handleUpload} className="bg-white text-black hover:bg-slate-200"><Upload className="mr-2 h-3.5 w-3.5" />Add Moment</Button>}
            </div>
          </header>

          <div className="flex min-h-0 flex-1">
            <aside className="w-[20%] min-w-[210px] max-w-[330px] shrink-0 overflow-y-auto px-5 py-6 md:px-7">
              <div className="mb-3 text-[8px] uppercase tracking-[0.28em] text-white/30">Games</div>
              <div className="space-y-1">
                {games.map((game) => (
                  <button key={game} type="button" onClick={() => setActiveGame(game)} className={`w-full border px-3 py-2.5 text-left text-[10px] transition-colors ${activeGame === game ? 'border-cyan-300/35 bg-cyan-300/[0.06] text-cyan-100' : 'border-transparent text-white/50 hover:bg-white/[0.04] hover:text-white/80'}`}>{game}</button>
                ))}
              </div>
              {isEditMode && galleryImages.length > 0 && <div className="mt-8 border-t border-white/10 pt-4"><div className="mb-2 text-[8px] uppercase tracking-[0.25em] text-white/25">Uploaded</div>{galleryImages.map((_, index) => <button key={index} type="button" onClick={() => handleRemove(index)} className="flex w-full items-center justify-between px-2 py-1.5 text-[8px] text-white/35 hover:bg-red-400/5 hover:text-red-300"><span>Saved media {index + 1}</span><Trash2 className="h-3 w-3" /></button>)}</div>}
            </aside>

            <div className="relative my-auto h-[76%] w-px shrink-0 bg-gradient-to-b from-transparent via-cyan-200/40 to-transparent" />

            <main className="min-w-0 flex-1 overflow-hidden px-5 py-5 md:px-8 md:py-6">
              <div className="flex h-full min-h-0 flex-col">
                <div className="shrink-0">
                  <div className="mb-2 flex items-center gap-2 text-[8px] uppercase tracking-[0.25em] text-white/30"><CalendarDays className="h-3 w-3" /> Timeline · {selectedDate}</div>
                  <Timeline />
                </div>

                <div className="shrink-0 pt-3">
                  <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide pb-4">
                    {dateMoments.map((moment) => (
                      <button key={moment.id} type="button" onClick={() => selectMoment(moment)} className={`relative h-20 w-36 shrink-0 overflow-hidden border text-left transition-all ${selectedMoment?.id === moment.id ? 'border-cyan-300/60 shadow-[0_0_24px_rgba(34,211,238,.12)]' : 'border-white/10 hover:border-white/30'}`}>
                        <MediaPreview moment={moment} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />
                        <div className="absolute bottom-1.5 left-2 right-2"><div className="text-[6px] uppercase tracking-wider text-cyan-200/70">{moment.tag} · {moment.time}</div><div className="truncate text-[9px] font-bold">{moment.title}</div></div>
                        {moment.type === 'video' && <Play className="absolute right-2 top-2 h-3 w-3" fill="currentColor" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative min-h-0 flex-1 border-t border-white/10 pt-5">
                  <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                  {selectedMoment ? <div className="grid h-full min-h-0 grid-cols-1 gap-6 lg:grid-cols-[1.45fr_.55fr]">
                    <div className="relative min-h-[220px] overflow-hidden bg-black/40">
                      <MediaPreview moment={selectedMoment} large />
                      {!selectedMoment.url && <div className="absolute inset-0 flex items-center justify-center"><div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/15 bg-white/5 backdrop-blur"><Play className="h-6 w-6 text-white/75" fill="currentColor" /></div></div>}
                    </div>
                    <div className="flex flex-col justify-center">
                      <div className="text-[7px] uppercase tracking-[0.28em] text-cyan-300/55">{selectedMoment.game} · {selectedMoment.time}</div>
                      <h3 className="mt-2 text-2xl font-bold">{selectedMoment.title}</h3>
                      <p className="mt-3 text-xs leading-5 text-white/40">{selectedMoment.description}</p>
                      <div className="mt-4 flex flex-wrap gap-2"><Badge className="border border-white/10 bg-white/5 text-white/50">{selectedMoment.tag}</Badge><Badge className="border border-white/10 bg-white/5 text-white/50">{selectedMoment.type}</Badge></div>
                    </div>
                  </div> : <div className="flex h-full items-center justify-center text-xs text-white/25">No moments saved for this date.</div>}
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-0 w-full overflow-hidden text-white">
      <div className="flex h-full min-h-0 flex-col">
        <div className="shrink-0 px-5 pt-3 md:px-7">
          <div className="flex items-center gap-3">
            <CalendarDays className="h-3.5 w-3.5 text-cyan-300/55" />
            <div className="text-[8px] uppercase tracking-[0.28em] text-white/30">Timeline</div>
            <div className="text-[8px] text-white/20">Select a date or moment</div>
          </div>
          <Timeline compact />
        </div>

        <div className="relative shrink-0 border-b border-white/10 px-5 pb-4 md:px-7">
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
          <div className="absolute bottom-0 left-[15%] right-[15%] h-[3px] bg-gradient-to-r from-transparent via-cyan-200/30 to-transparent" />
          <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide pt-2">
            {dateMoments.map((moment) => (
              <button key={moment.id} type="button" onClick={() => selectMoment(moment)} className={`relative h-20 w-36 shrink-0 overflow-hidden border text-left transition-all ${selectedMoment?.id === moment.id ? 'border-cyan-300/60' : 'border-white/10 hover:border-white/30'}`}>
                <MediaPreview moment={moment} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />
                <div className="absolute bottom-1.5 left-2 right-2"><div className="text-[6px] uppercase tracking-wider text-cyan-200/70">{moment.time}</div><div className="truncate text-[9px] font-bold">{moment.title}</div></div>
                {moment.type === 'video' && <Play className="absolute right-2 top-2 h-3 w-3" fill="currentColor" />}
              </button>
            ))}
            {isEditMode && <button type="button" onClick={handleUpload} className="flex h-20 w-28 shrink-0 flex-col items-center justify-center border border-dashed border-white/15 text-white/30 hover:border-white/30 hover:text-white/70"><Plus className="h-4 w-4" /><span className="mt-1 text-[7px] uppercase tracking-wider">Add Moment</span></button>}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 scrollbar-hide md:px-7">
          {selectedMoment ? <div className="grid min-h-[180px] grid-cols-1 gap-5 md:grid-cols-[1.55fr_.45fr]">
            <div className="relative min-h-[180px] overflow-hidden bg-black/25">
              <MediaPreview moment={selectedMoment} large />
              {!selectedMoment.url && <div className="absolute inset-0 flex items-center justify-center"><div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-white/5"><Play className="h-5 w-5" fill="currentColor" /></div></div>}
            </div>
            <div className="flex flex-col justify-center">
              <div className="text-[7px] uppercase tracking-[0.25em] text-cyan-300/55">{selectedMoment.game} · {selectedMoment.time}</div>
              <h3 className="mt-1.5 text-lg font-bold">{selectedMoment.title}</h3>
              <p className="mt-2 text-[10px] leading-4 text-white/40">{selectedMoment.description}</p>
              <div className="mt-3 flex gap-2"><Badge className="border border-white/10 bg-white/5 text-[8px] text-white/50">{selectedMoment.tag}</Badge><Badge className="border border-white/10 bg-white/5 text-[8px] text-white/50">{selectedMoment.type}</Badge></div>
            </div>
          </div> : <div className="flex h-full items-center justify-center text-xs text-white/25">No moments saved for this date.</div>}
        </div>
      </div>
    </div>
  );
}
