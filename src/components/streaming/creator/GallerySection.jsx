import React, { useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Film, Image as ImageIcon, Maximize2, Minimize2, Play, Plus, Trash2, Upload } from 'lucide-react';
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
    const time = typeof item === 'object' && item?.time ? item.time : `${7 + (index % 4)}:${String((index * 13) % 60).padStart(2, '0')} PM`;
    return {
      id: `uploaded-${index}`,
      date,
      time,
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

  const shiftDate = (direction) => {
    const current = DEMO_DATES.findIndex((date) => date.key === selectedDate);
    const next = Math.max(0, Math.min(DEMO_DATES.length - 1, current + direction));
    selectDate(DEMO_DATES[next].key);
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
        } catch (error) {
          next.push({ url: URL.createObjectURL(file), type: file.type.startsWith('video/') ? 'video' : 'image', date: selectedDate, title: file.name.replace(/\.[^.]+$/, ''), game: 'Stream Highlight', tag: 'SAVED' });
        }
      }
      onUpdateImages?.([...(galleryImages || []), ...next]);
    };
    input.click();
  };

  const handleRemove = (index) => onUpdateImages?.((galleryImages || []).filter((_, itemIndex) => itemIndex !== index));

  const dateMomentCounts = DEMO_DATES.map((date) => ({ ...date, count: moments.filter((moment) => moment.date === date.key).length }));

  if (fullscreen) {
    return (
      <div className="relative h-full min-h-0 w-full overflow-hidden bg-slate-950/45 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_30%,rgba(34,211,238,.07),transparent_30%),radial-gradient(circle_at_80%_70%,rgba(124,58,237,.08),transparent_34%)] pointer-events-none" />
        <div className="relative h-full flex flex-col min-h-0">
          <div className="shrink-0 flex items-center justify-between gap-4 px-5 md:px-8 py-4 border-b border-white/10">
            <div>
              <div className="text-[9px] uppercase tracking-[0.34em] text-cyan-300/60">Memory Chamber</div>
              <h2 className="text-xl md:text-2xl font-bold">Recent Moments</h2>
            </div>
            <div className="flex items-center gap-2">
              {isEditMode && <Button size="sm" onClick={handleUpload} className="bg-white text-black hover:bg-slate-200"><Upload className="w-3.5 h-3.5 mr-2" /> Add Moment</Button>}
              <div className="text-[9px] uppercase tracking-[0.22em] text-white/30">{moments.length} saved moments</div>
            </div>
          </div>

          <div className="shrink-0 px-5 md:px-8 pt-5">
            <div className="relative h-16">
              <div className="absolute left-0 right-0 top-1/2 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
              <div className="absolute left-[10%] right-[10%] top-1/2 h-[3px] -translate-y-1/2 bg-gradient-to-r from-transparent via-cyan-300/35 to-transparent opacity-60" />
              <div className="relative h-full flex items-center justify-between">
                {dateMomentCounts.map((date) => (
                  <button key={date.key} type="button" onClick={() => selectDate(date.key)} className="group relative h-full w-20 flex flex-col items-center justify-center">
                    <span className={`absolute top-1/2 w-px h-7 -translate-y-1/2 transition-all ${selectedDate === date.key ? 'bg-cyan-200 shadow-[0_0_14px_rgba(103,232,249,.65)]' : 'bg-white/20 group-hover:bg-white/45'}`} />
                    <span className={`relative z-10 mt-9 text-[11px] font-bold transition-colors ${selectedDate === date.key ? 'text-cyan-200' : 'text-white/55 group-hover:text-white'}`}>{date.label}</span>
                    <span className="absolute bottom-0 text-[7px] tracking-[0.2em] text-white/25">{date.weekday} · {date.count}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="shrink-0 px-5 md:px-8 pt-4 pb-5">
            <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
              <div className="text-[8px] uppercase tracking-[0.22em] text-white/30 shrink-0">Moments · {selectedDate.slice(5).replace('-', '/')}</div>
              <div className="h-px w-10 bg-white/10 shrink-0" />
              {dateMoments.map((moment) => (
                <button key={moment.id} type="button" onClick={() => selectMoment(moment)} className={`relative w-44 h-24 shrink-0 overflow-hidden border text-left transition-all ${selectedMoment?.id === moment.id ? 'border-cyan-300/60 shadow-[0_0_26px_rgba(34,211,238,.12)]' : 'border-white/10 hover:border-white/30'}`}>
                  {moment.url ? (moment.type === 'video' ? <video src={moment.url} muted className="absolute inset-0 w-full h-full object-cover" /> : <img src={moment.url} alt="" className="absolute inset-0 w-full h-full object-cover" />) : <div className={`absolute inset-0 bg-gradient-to-br ${moment.tone}`} />}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />
                  <div className="absolute left-2 right-2 bottom-2"><div className="text-[7px] uppercase tracking-[0.18em] text-cyan-200/70">{moment.tag} · {moment.time}</div><div className="text-[10px] font-bold truncate">{moment.title}</div></div>
                  {moment.type === 'video' && <Play className="absolute right-2 top-2 w-3.5 h-3.5 text-white/75" fill="currentColor" />}
                </button>
              ))}
            </div>
          </div>

          <div className="relative flex-1 min-h-0 border-t border-white/10 overflow-hidden">
            <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            <div className="h-full flex min-h-0">
              <aside className="w-[20%] min-w-[210px] max-w-[330px] shrink-0 p-5 md:p-7 overflow-y-auto scrollbar-hide">
                <div className="text-[8px] uppercase tracking-[0.28em] text-white/30 mb-3">Game Moments</div>
                <div className="space-y-1.5">
                  {games.map((game) => <button key={game} type="button" onClick={() => setActiveGame(game)} className={`w-full text-left px-3 py-2.5 border text-[10px] transition-colors ${activeGame === game ? 'border-cyan-300/35 bg-cyan-300/[0.06] text-cyan-100' : 'border-transparent text-white/50 hover:bg-white/[0.035] hover:text-white/80'}`}>{game}</button>)}
                </div>
                {isEditMode && galleryImages.length > 0 && <div className="mt-8"><div className="text-[8px] uppercase tracking-[0.25em] text-white/25 mb-2">Uploaded</div><div className="space-y-1">{galleryImages.map((_, index) => <button key={index} type="button" onClick={() => handleRemove(index)} className="w-full flex items-center justify-between px-2 py-1.5 text-[8px] text-white/35 hover:text-red-300 hover:bg-red-400/5"><span>Saved media {index + 1}</span><Trash2 className="w-3 h-3" /></button>)}</div></div>}
              </aside>
              <div className="relative w-px self-center h-[72%] shrink-0 bg-gradient-to-b from-transparent via-cyan-200/45 to-transparent shadow-[0_0_18px_rgba(103,232,249,.12)]" />
              <section className="flex-1 min-w-0 p-5 md:p-8 overflow-y-auto scrollbar-hide">
                {selectedMoment ? <div className="h-full min-h-[260px] flex flex-col md:flex-row gap-6">
                  <div className="flex-1 min-w-0 min-h-[240px] relative overflow-hidden bg-black/20 border border-white/10">
                    {selectedMoment.url ? (selectedMoment.type === 'video' ? <video src={selectedMoment.url} controls className="w-full h-full object-contain bg-black" /> : <img src={selectedMoment.url} alt={selectedMoment.title} className="w-full h-full object-contain bg-black" />) : <div className={`absolute inset-0 bg-gradient-to-br ${selectedMoment.tone}`}><div className="absolute inset-0 flex items-center justify-center"><div className="w-20 h-20 rounded-full border border-white/20 bg-white/5 backdrop-blur flex items-center justify-center"><Play className="w-7 h-7 text-white/75" fill="currentColor" /></div></div></div>}
                  </div>
                  <div className="md:w-[28%] min-w-[220px] flex flex-col justify-center">
                    <div className="text-[8px] uppercase tracking-[0.3em] text-cyan-300/55">{selectedMoment.game} · {selectedMoment.date} · {selectedMoment.time}</div>
                    <h3 className="mt-2 text-2xl font-bold">{selectedMoment.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-white/45">{selectedMoment.description}</p>
                    <div className="mt-5 flex items-center gap-2"><Badge className="bg-white/5 border border-white/10 text-white/55">{selectedMoment.tag}</Badge><Badge className="bg-white/5 border border-white/10 text-white/55">{selectedMoment.type === 'video' ? 'VIDEO' : 'IMAGE'}</Badge></div>
                  </div>
                </div> : <div className="h-full flex items-center justify-center text-white/25 text-sm">No saved moments for this selection.</div>}
              </section>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 w-full flex flex-col overflow-hidden text-white select-none">
      <div className="shrink-0 flex items-center justify-between gap-4 px-1 pb-3 border-b border-white/10">
        <div><div className="text-[9px] uppercase tracking-[0.3em] text-cyan-300/60">Gallery Timeline</div><h3 className="text-lg font-bold">Recent Moments</h3></div>
        <div className="flex items-center gap-2">{isEditMode && <Button size="sm" onClick={handleUpload} className="bg-white text-black hover:bg-slate-200"><Upload className="w-3 h-3 mr-2" /> Add</Button>}<span className="text-[8px] uppercase tracking-[0.2em] text-white/25">{selectedDate}</span></div>
      </div>
      <div className="shrink-0 pt-4">
        <div className="relative h-16">
          <div className="absolute left-2 right-2 top-1/2 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
          <div className="absolute left-[8%] right-[8%] top-1/2 h-[3px] -translate-y-1/2 bg-gradient-to-r from-transparent via-cyan-300/25 to-transparent" />
          <div className="relative h-full flex items-center justify-between">{dateMomentCounts.map((date) => <button key={date.key} type="button" onClick={() => selectDate(date.key)} className="group relative h-full w-16 flex flex-col items-center justify-center"><span className={`absolute top-1/2 w-px h-6 -translate-y-1/2 ${selectedDate === date.key ? 'bg-cyan-200 shadow-[0_0_12px_rgba(103,232,249,.55)]' : 'bg-white/20 group-hover:bg-white/40'}`} /><span className={`relative z-10 mt-8 text-[11px] font-bold ${selectedDate === date.key ? 'text-cyan-200' : 'text-white/55'}`}>{date.label}</span><span className="absolute bottom-0 text-[6px] tracking-[0.18em] text-white/25">{date.weekday}</span></button>)}</div>
        </div>
      </div>
      <div className="shrink-0 pt-3 pb-4 border-b border-white/10"><div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">{dateMoments.map((moment) => <button key={moment.id} type="button" onClick={() => selectMoment(moment)} className={`relative w-36 h-20 shrink-0 overflow-hidden border text-left ${selectedMoment?.id === moment.id ? 'border-cyan-300/55' : 'border-white/10 hover:border-white/30'}`}>{moment.url ? (moment.type === 'video' ? <video src={moment.url} muted className="absolute inset-0 w-full h-full object-cover" /> : <img src={moment.url} alt="" className="absolute inset-0 w-full h-full object-cover" />) : <div className={`absolute inset-0 bg-gradient-to-br ${moment.tone}`} />}<div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" /><div className="absolute bottom-1.5 left-2 right-2"><div className="text-[6px] uppercase tracking-wider text-cyan-200/65">{moment.time}</div><div className="text-[9px] font-bold truncate">{moment.title}</div></div>{moment.type === 'video' && <Play className="absolute right-2 top-2 w-3 h-3" fill="currentColor" />}</button>)}{isEditMode && <button type="button" onClick={handleUpload} className="w-28 h-20 shrink-0 border border-dashed border-white/15 text-white/30 hover:text-white/70 hover:border-white/30 flex flex-col items-center justify-center"><Plus className="w-4 h-4" /><span className="text-[7px] mt-1 uppercase tracking-wider">Add Moment</span></button>}</div></div>
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide pt-4">{selectedMoment ? <div className="grid grid-cols-1 md:grid-cols-[1.5fr_.7fr] gap-5 h-full min-h-[220px]"><div className="relative min-h-[220px] overflow-hidden bg-black/20 border border-white/10">{selectedMoment.url ? (selectedMoment.type === 'video' ? <video src={selectedMoment.url} controls className="w-full h-full object-contain bg-black" /> : <img src={selectedMoment.url} alt={selectedMoment.title} className="w-full h-full object-contain bg-black" />) : <div className={`absolute inset-0 bg-gradient-to-br ${selectedMoment.tone}`}><div className="absolute inset-0 flex items-center justify-center"><div className="w-16 h-16 rounded-full border border-white/20 bg-white/5 flex items-center justify-center"><Play className="w-6 h-6" fill="currentColor" /></div></div></div>}</div><div className="flex flex-col justify-center"><div className="text-[7px] uppercase tracking-[0.28em] text-cyan-300/55">{selectedMoment.game} · {selectedMoment.time}</div><h4 className="mt-2 text-xl font-bold">{selectedMoment.title}</h4><p className="mt-2 text-xs leading-5 text-white/40">{selectedMoment.description}</p><div className="mt-4 flex gap-2"><Badge className="bg-white/5 border border-white/10 text-white/50">{selectedMoment.tag}</Badge><Badge className="bg-white/5 border border-white/10 text-white/50">{selectedMoment.type}</Badge></div></div></div> : <div className="h-full flex items-center justify-center text-white/25 text-xs">No moments saved for this date.</div>}</div>
    </div>
  );
}
