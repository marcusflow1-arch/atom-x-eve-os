import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Search, Maximize2, Minimize2, Radio, X, Gamepad2, ArrowLeft, Eye, Users, SlidersHorizontal } from 'lucide-react';
import StreamerTile from './aura/StreamerTile';
import { getStreamersForGame, formatViewers } from './aura/streamerMockData';

const OPEN_EVENT = 'atomxe:aura-stream-browser';
export const openAuraStreamBrowser = () => window.dispatchEvent(new CustomEvent(OPEN_EVENT));

const FILTERS = [
  ['all','All Streams'], ['noCommentary','No Commentary'], ['noCam','No Camera'],
  ['talkative','Talkative'], ['interactive','Interactive'], ['chill','Chill'],
  ['competitive','Competitive'], ['educational','Educational']
];

export default function AuraStreamBrowserOverlay({ standalone = false }) {
  const [open, setOpen] = useState(standalone);
  const [fullscreen, setFullscreen] = useState(true);
  const [games, setGames] = useState([]);
  const [query, setQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedGame, setSelectedGame] = useState(null);
  const [streamFilter, setStreamFilter] = useState('all');

  useEffect(() => {
    if (standalone) return undefined;
    const handler = () => { setFullscreen(true); setSelectedGame(null); setStreamFilter('all'); setOpen(v => !v); };
    window.addEventListener(OPEN_EVENT, handler);
    return () => window.removeEventListener(OPEN_EVENT, handler);
  }, [standalone]);

  useEffect(() => {
    const onKey = e => {
      if (e.key !== 'Escape') return;
      if (selectedGame) setSelectedGame(null);
      else if (!standalone) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedGame, standalone]);

  useEffect(() => {
    if (!open || games.length) return;
    let mounted = true;
    base44.entities.Game.list().then(res => { if (mounted) setGames(res?.data || res || []); }).catch(() => {});
    return () => { mounted = false; };
  }, [open, games.length]);

  const genres = useMemo(() => ['All', ...new Set(games.map(g => g.genre).filter(Boolean))], [games]);
  const filteredGames = useMemo(() => games.filter(g =>
    (selectedGenre === 'All' || g.genre === selectedGenre) &&
    (!query.trim() || String(g.title || '').toLowerCase().includes(query.toLowerCase()))
  ), [games, selectedGenre, query]);

  const streamers = useMemo(() => {
    if (!selectedGame) return [];
    return getStreamersForGame(selectedGame, 24).filter(s => {
      if (streamFilter === 'all') return true;
      if (streamFilter === 'noCommentary') return s.isNoCommentary;
      if (streamFilter === 'noCam') return s.isNoCam;
      if (streamFilter === 'talkative') return s.personality === 'Talkative' || s.tags?.includes('Interactive');
      if (streamFilter === 'interactive') return s.personality === 'Interactive' || s.tags?.includes('Interactive');
      if (streamFilter === 'chill') return s.personality === 'Chill' || s.tags?.includes('Chill');
      if (streamFilter === 'competitive') return s.personality === 'Competitive' || s.tags?.includes('Competitive');
      if (streamFilter === 'educational') return s.personality === 'Educational' || s.tags?.includes('Educational');
      return true;
    }).sort((a,b) => b.viewers - a.viewers);
  }, [selectedGame, streamFilter]);

  const chooseGame = game => setSelectedGame(game);
  const closeOverlay = () => { setSelectedGame(null); setOpen(false); };
  const chooseStreamer = streamer => {
    const params = new URLSearchParams({ streamerId: streamer.id || '', gameId: selectedGame?.id || '', game: selectedGame?.title || streamer.game || '' });
    window.location.assign(`/streaminghome?${params.toString()}`);
  };

  return <AnimatePresence>
    {open && <motion.div className="fixed inset-0 z-[10000] pointer-events-none" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
      <motion.section initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}} transition={{type:'spring',stiffness:420,damping:38}}
        className={`absolute right-0 bottom-0 pointer-events-auto overflow-hidden border-t border-white/10 bg-[#080d13]/92 backdrop-blur-md shadow-[0_-20px_80px_rgba(0,0,0,.5)] ${fullscreen ? 'left-0 top-0' : 'left-1/2 top-1/2'}`}>
        <div className="h-full w-full flex flex-col">
          <header className="h-14 shrink-0 flex items-center justify-between px-5 border-b border-white/10 bg-black/15">
            <div className="flex items-center gap-3">
              {selectedGame && <button onClick={() => setSelectedGame(null)} className="p-2 text-white/55 hover:text-white transition" title="Back to games"><ArrowLeft size={17}/></button>}
              <Radio className="w-4 h-4 text-purple-300"/>
              <span className="text-xs font-bold uppercase tracking-[.2em]">{selectedGame ? `Live Streamers · ${selectedGame.title || 'Selected Game'}` : 'Streaming Games'}</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setFullscreen(v=>!v)} className="p-2 text-white/55 hover:text-white transition" title={fullscreen?'Minimize':'Fullscreen'}>{fullscreen?<Minimize2 size={16}/>:<Maximize2 size={16}/>}</button>
              {!standalone && <button onClick={closeOverlay} className="p-2 text-white/55 hover:text-white transition" title="Close"><X size={17}/></button>}
            </div>
          </header>

          {!selectedGame ? <div className="flex min-h-0 flex-1">
            <aside className="w-56 shrink-0 border-r border-white/10 p-4 overflow-y-auto">
              <div className="relative mb-5"><Search className="absolute left-3 top-2.5 w-4 h-4 text-white/30"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Find a game" className="w-full h-9 pl-9 pr-3 bg-white/5 border border-white/10 rounded-none outline-none text-xs"/></div>
              <div className="text-[10px] uppercase tracking-widest text-white/30 mb-2">Categories</div>
              <div className="space-y-1">{genres.map(g=><button key={g} onClick={()=>setSelectedGenre(g)} className={`w-full text-left px-3 py-2 text-xs transition ${selectedGenre===g?'text-white bg-white/10':'text-white/55 hover:text-white hover:bg-white/5'}`}><Gamepad2 className="inline w-3.5 h-3.5 mr-2"/>{g}</button>)}</div>
            </aside>
            <main className="min-w-0 flex-1 overflow-y-auto p-5"><div className="grid grid-cols-2 xl:grid-cols-4 gap-3">{filteredGames.map(game=><button key={game.id||game.title} onClick={()=>chooseGame(game)} className="text-left group bg-white/[.035] hover:bg-white/[.07] border border-white/10 overflow-hidden transition"><div className="aspect-[16/9] overflow-hidden bg-black/30"><img src={game.cover_image||game.image||'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800'} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/></div><div className="p-3"><div className="text-xs font-semibold truncate">{game.title||'Untitled game'}</div><div className="mt-1 text-[10px] text-white/40">{game.genre||'Games'} · View live streamers</div></div></button>)}</div>{!filteredGames.length&&<div className="h-full flex items-center justify-center text-white/30 text-sm">No streaming games found.</div>}</main>
          </div> : <div className="flex min-h-0 flex-1 bg-gradient-to-br from-white/[.025] via-transparent to-purple-500/[.025]">
            <aside className="w-64 shrink-0 border-r border-white/10 px-5 py-6 overflow-y-auto bg-black/10">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[.24em] text-white/35 mb-5"><SlidersHorizontal size={13}/> Stream Filters</div>
              <div className="mb-5 pb-5 border-b border-white/10">
                <div className="text-xs text-white/45 mb-2">Selected game</div>
                <div className="flex items-center gap-3"><div className="w-12 h-12 overflow-hidden bg-white/5"><img src={selectedGame.cover_image||selectedGame.image||''} alt="" className="w-full h-full object-cover"/></div><div className="min-w-0"><div className="text-sm font-semibold text-white truncate">{selectedGame.title}</div><div className="text-[10px] text-white/40">{selectedGame.genre||'Live category'}</div></div></div>
              </div>
              <div className="space-y-1">{FILTERS.map(([id,label])=><button key={id} onClick={()=>setStreamFilter(id)} className={`w-full text-left px-3 py-2.5 text-xs transition ${streamFilter===id?'text-white bg-white/10 border-l border-purple-300/70':'text-white/55 hover:text-white hover:bg-white/5 border-l border-transparent'}`}>{label}</button>)}</div>
            </aside>
            <main className="min-w-0 flex-1 overflow-y-auto px-7 py-6">
              <div className="flex items-end justify-between mb-7 pb-4 border-b border-white/10">
                <div><div className="text-[10px] uppercase tracking-[.28em] text-purple-200/55">Now broadcasting</div><h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Live creators playing {selectedGame.title}</h2><p className="mt-1 text-xs text-white/40">Choose a stream by style, personality, camera setup, or commentary.</p></div>
                <div className="flex items-center gap-2 text-xs text-white/45"><Users size={14}/><span>{streamers.length} live</span><span className="text-white/20">·</span><Eye size={13}/><span>{formatViewers(streamers.reduce((n,s)=>n+s.viewers,0))} watching</span></div>
              </div>
              {streamers.length ? <div className="grid gap-x-6 gap-y-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{streamers.map(s=><StreamerTile key={s.id} streamer={s} onClick={chooseStreamer}/>)}</div> : <div className="min-h-64 flex flex-col items-center justify-center text-white/35 text-sm"><Radio size={28} className="mb-3 opacity-40"/>No live channels match this stream style.</div>}
            </main>
          </div>}
        </div>
      </motion.section>
    </motion.div>}
  </AnimatePresence>;
}
