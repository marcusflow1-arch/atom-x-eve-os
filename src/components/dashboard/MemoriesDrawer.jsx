import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CalendarDays,
  Camera,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Expand,
  Film,
  Heart,
  Home,
  Maximize2,
  MessageCircle,
  Minimize2,
  Pause,
  Play,
  Sparkles,
  Trophy,
  Users,
  X,
} from 'lucide-react';

const FALLBACK_MEMORIES = [
  {
    id: 'neon-perfect-counter',
    title: 'Perfect Counter at Match Point',
    game: 'Neon Legends',
    dateLabel: 'September 27',
    exactTime: '9:42:18 PM',
    timestamp: '00:18:42',
    isVideo: true,
    legendary: true,
    image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1600&fit=crop',
    notes: 'I waited for the feint, caught the recovery frame, and turned the whole round around in one counter.',
    trophy: 'Neon Clutch — Win a ranked match from critical health.',
    reactions: [
      { name: 'Maya', avatar: 'M', text: 'That read was ridiculous. You called the feint before it happened.', reaction: '🔥' },
      { name: 'Dre', avatar: 'D', text: 'Save this one forever. Match point was ice cold.', reaction: '🏆' },
    ],
  },
  {
    id: 'cyberpunk-rooftop',
    title: 'Night City Rooftop Run',
    game: 'Cyberpunk 2088',
    dateLabel: 'September 27',
    exactTime: '7:16:05 PM',
    timestamp: '01:07:31',
    isVideo: false,
    legendary: false,
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1600&fit=crop',
    notes: 'The lighting hit at exactly the right moment. This is the skyline angle I wanted for the whole playthrough.',
    trophy: 'Urban Ghost — Reach the tower district without triggering an alert.',
    reactions: [
      { name: 'Kai', avatar: 'K', text: 'This looks like key art.', reaction: '✨' },
    ],
  },
  {
    id: 'stellar-rings',
    title: 'First Pass Through the Helios Rings',
    game: 'Stellar Odyssey',
    dateLabel: 'September 24',
    exactTime: '11:03:44 PM',
    timestamp: '02:41:09',
    isVideo: false,
    legendary: true,
    image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=1600&fit=crop',
    notes: 'No HUD, no waypoint, just the ship drifting through the rings. One of those moments where I stopped playing and just watched.',
    trophy: 'Beyond the Map — Discover a hidden stellar landmark.',
    reactions: [
      { name: 'Nova', avatar: 'N', text: 'Wallpaper immediately.', reaction: '🌌' },
      { name: 'Maya', avatar: 'M', text: 'The scale is unreal.', reaction: '💙' },
    ],
  },
  {
    id: 'shadow-boss',
    title: 'The Last Hit',
    game: 'Shadow Realm',
    dateLabel: 'September 21',
    exactTime: '1:28:52 AM',
    timestamp: '00:09:56',
    isVideo: true,
    legendary: true,
    image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=1600&fit=crop',
    notes: 'One flask left, no revive, and the boss was still in phase three. The final dodge is the reason this clip exists.',
    trophy: 'No Light Left — Defeat a realm guardian without assistance.',
    reactions: [
      { name: 'Dre', avatar: 'D', text: 'I thought you were done at 2 HP.', reaction: '😱' },
      { name: 'Kai', avatar: 'K', text: 'Legendary. No notes.', reaction: '👑' },
    ],
  },
  {
    id: 'apex-squad',
    title: 'Squad Wipe From the Drop',
    game: 'Apex Surge',
    dateLabel: 'September 15',
    exactTime: '10:12:03 PM',
    timestamp: '00:03:27',
    isVideo: true,
    legendary: false,
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1600&fit=crop',
    notes: 'The opening route finally worked. Fast loot, high ground, then the cleanest first fight of the night.',
    trophy: 'Hot Drop — Eliminate an entire squad within five minutes.',
    reactions: [
      { name: 'Nova', avatar: 'N', text: 'Run this route again next session.', reaction: '🎯' },
    ],
  },
  {
    id: 'mythforge-guild',
    title: 'Guild Hall Before Reset',
    game: 'MythForge Online',
    dateLabel: 'September 8',
    exactTime: '6:54:30 PM',
    timestamp: '04:18:12',
    isVideo: false,
    legendary: false,
    image: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=1600&fit=crop',
    notes: 'Everyone made it online before the seasonal reset, so I grabbed one clean group shot before the banners changed.',
    trophy: 'Together at Dawn — Complete a seasonal chapter with a full guild party.',
    reactions: [
      { name: 'Maya', avatar: 'M', text: 'Best season yet.', reaction: '❤️' },
      { name: 'Dre', avatar: 'D', text: 'Frame this one.', reaction: '📸' },
    ],
  },
];

const FILTERS = [
  { id: 'all', label: 'All Memories', icon: Sparkles },
  { id: 'video', label: 'Video Clips', icon: Film },
  { id: 'screenshots', label: 'Screenshots', icon: Camera },
  { id: 'legendary', label: 'Legendary Moments', icon: Trophy },
];

const normalizeMemory = (item, index) => {
  const rawDate = item?.created_date || item?.createdAt || item?.date;
  let dateLabel = item?.dateLabel;
  if (!dateLabel && rawDate) {
    const d = new Date(rawDate);
    if (!Number.isNaN(d.getTime())) dateLabel = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  }

  const isVideo = Boolean(item?.isVideo || item?.type === 'video' || item?.media_type === 'video');
  const mediaUrl = item?.videoUrl || item?.mediaUrl || item?.url || item?.file_url || null;
  const image = item?.thumbnail || item?.image || item?.cover || item?.cover_image || (!isVideo ? mediaUrl : null);

  return {
    ...item,
    id: item?.id || `memory-${index}`,
    title: item?.title || item?.name || `Memory ${index + 1}`,
    game: item?.game || item?.gameTitle || item?.game_title || 'Atom XE',
    dateLabel: dateLabel || 'September 27',
    exactTime: item?.exactTime || item?.time || '8:00:00 PM',
    timestamp: item?.timestamp || item?.gameTimestamp || '00:00:00',
    isVideo,
    legendary: Boolean(item?.legendary || item?.rarity === 'legendary' || item?.highlight === true),
    image: image || 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1600&fit=crop',
    mediaUrl,
    notes: item?.notes || item?.thoughts || item?.description || 'A saved highlight from this play session.',
    trophy: item?.trophy || item?.achievement || 'Highlight captured during gameplay.',
    reactions: Array.isArray(item?.reactions) ? item.reactions : [],
  };
};

function CinematicHero({ memory, onOpen }) {
  const videoRef = useRef(null);
  const hasPlayableVideo = memory?.isVideo && Boolean(memory?.mediaUrl);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hasPlayableVideo) return undefined;

    let slowTimer;
    let freezeTimer;
    const playPreview = async () => {
      try {
        video.currentTime = 0;
        video.muted = true;
        video.playbackRate = 1;
        await video.play();
        slowTimer = window.setTimeout(() => { if (video) video.playbackRate = 0.42; }, 450);
        freezeTimer = window.setTimeout(() => { if (video) video.pause(); }, 1450);
      } catch {
        // Browsers may block autoplay; the poster remains as the hero frame.
      }
    };
    playPreview();
    return () => {
      window.clearTimeout(slowTimer);
      window.clearTimeout(freezeTimer);
      video.pause();
    };
  }, [memory?.id, hasPlayableVideo]);

  return (
    <motion.button
      key={memory?.id}
      type="button"
      onClick={onOpen}
      initial={{ opacity: 0, scale: 1.14, z: 120, filter: 'blur(5px)' }}
      animate={{ opacity: 1, scale: 1, z: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.62, ease: [0.16, 1, 0.3, 1] }}
      className="group relative h-full min-h-[300px] w-full overflow-hidden text-left focus:outline-none"
      style={{ transformPerspective: 1200 }}
    >
      {hasPlayableVideo ? (
        <video ref={videoRef} src={memory.mediaUrl} poster={memory.image} playsInline muted preload="metadata" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <motion.img
          key={memory?.image}
          src={memory?.image}
          alt={memory?.title || 'Memory highlight'}
          className="absolute inset-0 h-full w-full object-cover"
          initial={{ scale: 1.08 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.8, ease: 'easeOut' }}
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/15 to-black/10" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-transparent to-black/25" />
      <motion.div
        initial={{ opacity: 0.75 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 1.45, ease: 'easeOut' }}
        className="absolute inset-0 bg-white/10"
      />

      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-5 p-6 md:p-8">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-200/70">
            {memory?.isVideo ? <Film className="h-3.5 w-3.5" /> : <Camera className="h-3.5 w-3.5" />}
            {memory?.legendary ? 'Legendary Moment' : 'Saved Memory'}
          </div>
          <h2 className="max-w-3xl text-2xl font-black tracking-tight md:text-4xl">{memory?.title}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/45">
            <span>{memory?.game}</span>
            <span>{memory?.dateLabel}</span>
            <span>{memory?.exactTime}</span>
          </div>
        </div>
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-white/10 backdrop-blur-xl transition-all duration-200 group-hover:scale-110 group-hover:bg-white/20 group-focus-visible:ring-2 group-focus-visible:ring-cyan-300/70">
          {memory?.isVideo ? <Play className="h-5 w-5 fill-current" /> : <Expand className="h-5 w-5" />}
        </div>
      </div>
    </motion.button>
  );
}

export default function MemoriesDrawer({ references = [], activeReference, onSelectReference, onHomeClick, onClose }) {
  const overlayRef = useRef(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeDate, setActiveDate] = useState(null);
  const [selectedId, setSelectedId] = useState(activeReference?.id || null);
  const [playbackItem, setPlaybackItem] = useState(null);
  const [galleryExpanded, setGalleryExpanded] = useState(false);

  const memories = useMemo(() => {
    const source = Array.isArray(references) && references.length ? references : FALLBACK_MEMORIES;
    return source.map(normalizeMemory);
  }, [references]);

  const dates = useMemo(() => Array.from(new Set(memories.map((memory) => memory.dateLabel))), [memories]);
  const resolvedDate = activeDate && dates.includes(activeDate) ? activeDate : dates[0];

  const filteredMemories = useMemo(() => memories.filter((memory) => {
    const dateMatch = !resolvedDate || memory.dateLabel === resolvedDate;
    const filterMatch = activeFilter === 'all'
      || (activeFilter === 'video' && memory.isVideo)
      || (activeFilter === 'screenshots' && !memory.isVideo)
      || (activeFilter === 'legendary' && memory.legendary);
    return dateMatch && filterMatch;
  }), [memories, resolvedDate, activeFilter]);

  const selectedMemory = filteredMemories.find((memory) => memory.id === selectedId)
    || filteredMemories[0]
    || memories.find((memory) => memory.id === selectedId)
    || memories[0];

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.dataset.memoriesOverlay = 'open';

    const hiddenElements = [];
    const suppress = (element) => {
      if (!(element instanceof HTMLElement)) return;
      hiddenElements.push({
        element,
        visibility: element.style.visibility,
        pointerEvents: element.style.pointerEvents,
        opacity: element.style.opacity,
      });
      element.style.visibility = 'hidden';
      element.style.pointerEvents = 'none';
      element.style.opacity = '0';
    };

    const frame = window.requestAnimationFrame(() => {
      const root = overlayRef.current;
      if (!root) return;

      document.querySelectorAll('canvas, [aria-label="AI Attribute Box"], [aria-label*="AI Avatar"], [data-ai-avatar-panel], .ai-avatar-panel, .ai-attribute-box').forEach((element) => {
        if (!root.contains(element) && !element.contains(root)) suppress(element);
      });

      document.querySelectorAll('body *').forEach((element) => {
        if (!(element instanceof HTMLElement) || root.contains(element) || element.contains(root)) return;
        const computed = window.getComputedStyle(element);
        const zIndex = Number.parseInt(computed.zIndex, 10);
        if (computed.position === 'fixed' && Number.isFinite(zIndex) && zIndex > 100) suppress(element);
      });
    });

    return () => {
      window.cancelAnimationFrame(frame);
      hiddenElements.forEach(({ element, visibility, pointerEvents, opacity }) => {
        element.style.visibility = visibility;
        element.style.pointerEvents = pointerEvents;
        element.style.opacity = opacity;
      });
      document.body.style.overflow = previousOverflow;
      delete document.documentElement.dataset.memoriesOverlay;
    };
  }, []);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();

      if (playbackItem) {
        setPlaybackItem(null);
        return;
      }
      if (galleryExpanded) {
        setGalleryExpanded(false);
        return;
      }
      onClose?.();
    };

    window.addEventListener('keydown', handleEscape, true);
    return () => window.removeEventListener('keydown', handleEscape, true);
  }, [playbackItem, galleryExpanded, onClose]);

  const selectDate = (date) => {
    setActiveDate(date);
    const next = memories.find((memory) => memory.dateLabel === date);
    if (next) setSelectedId(next.id);
  };

  const selectFilter = (filterId) => {
    setActiveFilter(filterId);
    const next = memories.find((memory) => {
      const dateMatch = !resolvedDate || memory.dateLabel === resolvedDate;
      const filterMatch = filterId === 'all'
        || (filterId === 'video' && memory.isVideo)
        || (filterId === 'screenshots' && !memory.isVideo)
        || (filterId === 'legendary' && memory.legendary);
      return dateMatch && filterMatch;
    });
    if (next) setSelectedId(next.id);
  };

  return (
    <motion.div
      ref={overlayRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      className="fixed inset-0 z-[100] isolate h-[100dvh] w-screen overflow-hidden bg-black/80 text-white backdrop-blur-xl pointer-events-auto"
      style={{ right: 0 }}
      role="dialog"
      aria-modal="true"
      aria-label="Memories gallery"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_12%,rgba(34,211,238,0.08),transparent_34%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />

      <div className="relative z-10 flex h-full min-h-0 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between px-5 md:px-8 lg:px-10">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-white/[0.06] backdrop-blur-md">
              <Camera className="h-4 w-4 text-cyan-200/75" />
            </div>
            <div>
              <div className="text-[9px] font-semibold uppercase tracking-[0.3em] text-cyan-200/45">Atom XE Capture Archive</div>
              <h1 className="text-lg font-black tracking-tight">Memories</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onHomeClick && (
              <button
                type="button"
                onClick={onHomeClick}
                className="hidden items-center gap-2 rounded-full bg-white/[0.045] px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-white/45 transition hover:bg-white/[0.08] hover:text-white md:flex"
              >
                <Home className="h-3.5 w-3.5" /> Home
              </button>
            )}
            <button
              type="button"
              onClick={() => setGalleryExpanded((value) => !value)}
              className="flex items-center gap-2 rounded-full bg-white/[0.055] px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-white/65 transition hover:bg-white/[0.1] hover:text-white"
            >
              {galleryExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{galleryExpanded ? 'Timeline View' : 'Full Gallery'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-full bg-white/[0.055] text-white/55 transition hover:bg-white/[0.1] hover:text-white"
              aria-label="Close Memories"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="shrink-0 px-5 md:px-8 lg:px-10">
          <div className="flex items-center gap-2 overflow-x-auto py-2" style={{ scrollbarWidth: 'none' }}>
            <div className="mr-2 flex shrink-0 items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.24em] text-white/25">
              <CalendarDays className="h-3.5 w-3.5" /> Timeline
            </div>
            {dates.map((date, index) => {
              const active = date === resolvedDate;
              return (
                <button
                  key={date}
                  type="button"
                  onClick={() => selectDate(date)}
                  className={`relative shrink-0 px-4 py-2 text-xs font-semibold transition-all duration-200 ${active ? 'text-white' : 'text-white/35 hover:text-white/70'}`}
                >
                  {date}
                  <span className={`absolute inset-x-3 -bottom-px h-px bg-gradient-to-r from-transparent via-cyan-300 to-transparent transition-opacity ${active ? 'opacity-100' : 'opacity-0'}`} />
                  {index < dates.length - 1 && <span className="absolute -right-1 top-1/2 h-1 w-1 -translate-y-1/2 rounded-full bg-white/15" />}
                </button>
              );
            })}
          </div>

          <div className="flex gap-1 overflow-x-auto border-t border-white/[0.04] py-2" style={{ scrollbarWidth: 'none' }}>
            {FILTERS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => selectFilter(id)}
                className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-semibold transition-all duration-200 ${activeFilter === id ? 'bg-cyan-400/10 text-cyan-200' : 'text-white/35 hover:bg-white/[0.04] hover:text-white/70'}`}
              >
                <Icon className="h-3.5 w-3.5" /> {label}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {galleryExpanded ? (
            <motion.main
              key="gallery"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="min-h-0 flex-1 overflow-y-auto px-5 pb-8 pt-3 md:px-8 lg:px-10"
              style={{ scrollbarWidth: 'none' }}
            >
              <div className="grid auto-rows-[210px] grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {filteredMemories.map((memory, index) => (
                  <motion.button
                    key={memory.id}
                    type="button"
                    layoutId={`memory-${memory.id}`}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.04, 0.24) }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => { setSelectedId(memory.id); setPlaybackItem(memory); }}
                    className={`group relative overflow-hidden text-left focus:outline-none focus-visible:ring-1 focus-visible:ring-cyan-300/70 ${memory.legendary ? 'sm:col-span-2 sm:row-span-2' : ''}`}
                  >
                    <img src={memory.image} alt={memory.title} className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/15 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <div className="mb-1 flex items-center gap-2 text-[9px] uppercase tracking-[0.2em] text-cyan-200/55">
                        {memory.isVideo ? <Film className="h-3 w-3" /> : <Camera className="h-3 w-3" />}
                        {memory.game}
                      </div>
                      <div className="font-bold text-white/90">{memory.title}</div>
                      <div className="mt-1 text-[10px] text-white/35">{memory.exactTime}</div>
                    </div>
                    {memory.legendary && <Trophy className="absolute right-4 top-4 h-4 w-4 text-amber-200/75" />}
                  </motion.button>
                ))}
              </div>

              {filteredMemories.length === 0 && (
                <div className="grid h-full min-h-[260px] place-items-center text-center text-white/30">
                  <div><Camera className="mx-auto mb-3 h-6 w-6" /><p className="text-sm">No memories match this date and filter.</p></div>
                </div>
              )}
            </motion.main>
          ) : (
            <motion.main
              key="timeline"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto] gap-3 px-5 pb-5 pt-3 md:px-8 lg:px-10"
            >
              <div className="grid min-h-0 gap-3 xl:grid-cols-[minmax(0,1.75fr)_minmax(330px,.75fr)]">
                <div className="relative min-h-0 overflow-hidden bg-slate-950/35 backdrop-blur-md">
                  <AnimatePresence mode="wait">
                    {selectedMemory ? <CinematicHero memory={selectedMemory} onOpen={() => setPlaybackItem(selectedMemory)} /> : null}
                  </AnimatePresence>
                </div>

                <aside className="min-h-0 overflow-y-auto bg-slate-950/55 p-5 backdrop-blur-md md:p-6" style={{ scrollbarWidth: 'none' }}>
                  {selectedMemory && (
                    <motion.div key={selectedMemory.id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-[9px] font-semibold uppercase tracking-[0.25em] text-white/30">Moment Inspection</div>
                        {selectedMemory.legendary && <span className="flex items-center gap-1.5 rounded-full bg-amber-300/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-amber-200/80"><Trophy className="h-3 w-3" /> Legendary</span>}
                      </div>

                      <h3 className="mt-3 text-xl font-black tracking-tight">{selectedMemory.title}</h3>
                      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                        <div className="bg-white/[0.025] p-3"><div className="text-[9px] uppercase tracking-wider text-white/25">Game</div><div className="mt-1 font-semibold text-white/75">{selectedMemory.game}</div></div>
                        <div className="bg-white/[0.025] p-3"><div className="text-[9px] uppercase tracking-wider text-white/25">Timestamp</div><div className="mt-1 flex items-center gap-1.5 font-semibold text-white/75"><Clock3 className="h-3 w-3 text-cyan-200/55" /> {selectedMemory.timestamp}</div></div>
                      </div>

                      <div className="mt-5">
                        <div className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/25">Player Notes</div>
                        <p className="mt-2 text-xs leading-5 text-white/55">{selectedMemory.notes}</p>
                      </div>

                      <div className="mt-5 bg-cyan-400/[0.035] p-3.5">
                        <div className="flex items-start gap-3">
                          <Trophy className="mt-0.5 h-4 w-4 shrink-0 text-cyan-200/60" />
                          <div><div className="text-[9px] uppercase tracking-[0.18em] text-cyan-200/40">Trophy Context</div><div className="mt-1 text-xs leading-5 text-white/60">{selectedMemory.trophy}</div></div>
                        </div>
                      </div>

                      <div className="mt-6 flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.2em] text-white/25"><Users className="h-3.5 w-3.5" /> Friend Reactions</div>
                      <div className="mt-3 space-y-2">
                        {(selectedMemory.reactions || []).length ? selectedMemory.reactions.map((reaction, index) => (
                          <div key={`${reaction.name}-${index}`} className="flex gap-3 bg-white/[0.02] p-3">
                            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/[0.06] text-[10px] font-bold text-white/70">{reaction.avatar || reaction.name?.[0] || 'F'}</div>
                            <div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><span className="text-[10px] font-semibold text-white/70">{reaction.name}</span><span className="text-sm">{reaction.reaction || '♥'}</span></div><p className="mt-1 text-[10px] leading-4 text-white/40">{reaction.text}</p></div>
                          </div>
                        )) : (
                          <div className="flex items-center gap-2 py-4 text-[10px] text-white/25"><MessageCircle className="h-3.5 w-3.5" /> No friend reactions yet.</div>
                        )}
                      </div>

                      <div className="mt-5 flex gap-2">
                        <button type="button" onClick={() => setPlaybackItem(selectedMemory)} className="flex flex-1 items-center justify-center gap-2 bg-white/[0.075] px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-white/75 transition hover:bg-white/[0.12] hover:text-white">
                          {selectedMemory.isVideo ? <Play className="h-3.5 w-3.5 fill-current" /> : <Expand className="h-3.5 w-3.5" />} Open Media
                        </button>
                        {onSelectReference && (
                          <button type="button" onClick={() => onSelectReference(selectedMemory)} className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-cyan-200/60 transition hover:bg-cyan-300/[0.06] hover:text-cyan-100">Use</button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </aside>
              </div>

              <div className="relative shrink-0 overflow-hidden">
                <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-black to-transparent" />
                <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-black to-transparent" />
                <div className="flex gap-2 overflow-x-auto py-1" style={{ scrollbarWidth: 'none' }}>
                  {filteredMemories.map((memory) => {
                    const active = selectedMemory?.id === memory.id;
                    return (
                      <motion.button
                        key={memory.id}
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        onClick={() => setSelectedId(memory.id)}
                        className={`group relative h-24 w-44 shrink-0 overflow-hidden text-left transition-all duration-200 focus:outline-none focus-visible:ring-1 focus-visible:ring-cyan-300/70 ${active ? 'ring-1 ring-cyan-300/60' : 'opacity-60 hover:opacity-100'}`}
                      >
                        <img src={memory.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 p-2.5"><div className="truncate text-[10px] font-bold text-white/85">{memory.title}</div><div className="mt-0.5 flex items-center gap-1.5 text-[8px] text-white/40">{memory.isVideo ? <Play className="h-2.5 w-2.5 fill-current" /> : <Camera className="h-2.5 w-2.5" />}{memory.game}</div></div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.main>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {playbackItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPlaybackItem(null)}
            className="fixed inset-0 z-[120] grid place-items-center bg-black/95 p-4 backdrop-blur-2xl md:p-8"
          >
            <motion.div
              layoutId={`memory-${playbackItem.id}`}
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              onClick={(event) => event.stopPropagation()}
              className="relative flex h-full max-h-[92dvh] w-full max-w-[1600px] items-center justify-center overflow-hidden bg-black"
            >
              {playbackItem.isVideo && playbackItem.mediaUrl ? (
                <video src={playbackItem.mediaUrl} poster={playbackItem.image} controls autoPlay playsInline className="max-h-full max-w-full" />
              ) : (
                <img src={playbackItem.image} alt={playbackItem.title} className="max-h-full max-w-full object-contain" />
              )}

              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />
              <div className="absolute bottom-5 left-5 right-16 md:bottom-7 md:left-7">
                <div className="text-[9px] font-semibold uppercase tracking-[0.22em] text-cyan-200/55">{playbackItem.game} · {playbackItem.timestamp}</div>
                <div className="mt-1 text-lg font-black md:text-2xl">{playbackItem.title}</div>
              </div>
              <button type="button" onClick={() => setPlaybackItem(null)} className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-black/45 text-white/70 backdrop-blur-xl transition hover:bg-white/10 hover:text-white" aria-label="Close media playback">
                <X className="h-4 w-4" />
              </button>
              {playbackItem.isVideo && !playbackItem.mediaUrl && (
                <div className="absolute inset-0 grid place-items-center bg-black/25 pointer-events-none"><div className="rounded-full bg-black/55 px-4 py-2 text-[10px] uppercase tracking-wider text-white/55 backdrop-blur-md">Video source unavailable — showing saved hero frame</div></div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
