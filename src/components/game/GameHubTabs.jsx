import React, { useEffect, useMemo, useState } from 'react';
import { Building2, CalendarDays, ExternalLink, Gamepad2, MessageCircle, Play, Radio, Sparkles, Users, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import GameDetailPanel from './GameDetailPanel';
import { AtomEvents, trackAtomEvent } from '@/lib/atomTelemetry';

const glass = 'bg-white/[0.04] border border-white/10 backdrop-blur-xl';

function StudioTab({ game }) {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const studioName = game?.developer || 'Studio Unknown';
  const studioKey = game?.developerKey || game?.developer_key;
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const all = await base44.entities.Game.list();
        const rows = all?.data || all || [];
        const filtered = rows.filter(g =>
          (studioKey && (g.developerKey === studioKey || g.developer_key === studioKey)) ||
          (!studioKey && g.developer && g.developer.toLowerCase() === studioName.toLowerCase())
        );
        if (!cancelled) setGames(filtered.length ? filtered : [game]);
      } catch {
        if (!cancelled) setGames([game]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [game, studioKey, studioName]);

  return (
    <div className="space-y-8 pb-20">
      <section className={`${glass} rounded-3xl p-7 md:p-9`}>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-cyan-300 text-[10px] font-black uppercase tracking-[0.22em] mb-3"><Building2 className="w-4 h-4" /> Studio Hub</div>
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">{studioName}</h2>
            <p className="text-white/50 mt-2 max-w-2xl">Developer portfolio, current projects, announcements, and community updates for this studio.</p>
          </div>
          {studioKey && <button onClick={() => window.location.href = `/dev-studio/${studioKey}`} className="px-4 py-2.5 rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-200 text-sm font-bold hover:bg-cyan-400/15">Open Studio Profile <ExternalLink className="inline w-4 h-4 ml-1" /></button>}
        </div>
      </section>
      <section>
        <div className="flex items-center justify-between mb-4"><div><h3 className="text-xl font-black text-white">Games by {studioName}</h3><p className="text-xs text-white/35 mt-1">Browse the complete studio catalog without leaving the game hub.</p></div><span className="text-xs text-white/35">{games.length} title{games.length === 1 ? '' : 's'}</span></div>
        {loading ? <div className={`${glass} rounded-2xl p-8 text-white/40`}>Loading studio catalog…</div> : <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{games.map(g => <a key={g.id} href={`/GameDetail?id=${encodeURIComponent(g.id)}`} className={`${glass} rounded-2xl overflow-hidden group hover:border-cyan-400/30 transition-all`}><div className="aspect-[16/8] bg-black/40 overflow-hidden"><img src={g.banner_image || g.cover_image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /></div><div className="p-4"><div className="flex items-center justify-between gap-3"><h4 className="font-bold text-white truncate">{g.title}</h4><span className="text-[10px] uppercase text-cyan-300">{g.status || 'available'}</span></div><p className="text-xs text-white/40 mt-1 line-clamp-2">{g.description || 'Studio title'}</p></div></a>)}</div>}
      </section>
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">{[['Studio Vision','Where the team is taking its worlds next.',Sparkles],['Roadmap','Upcoming milestones, builds, seasons, and releases.',CalendarDays],['Community Updates','Developer posts, livestreams, and behind-the-scenes content.',Users]].map(([title,text,Icon]) => <div key={title} className={`${glass} rounded-2xl p-5`}><Icon className="w-5 h-5 text-cyan-300 mb-3" /><h4 className="font-bold text-white">{title}</h4><p className="text-sm text-white/45 mt-2">{text}</p><div className="mt-4 h-1 rounded-full bg-white/5 overflow-hidden"><div className="h-full w-2/3 bg-cyan-400/50 rounded-full" /></div></div>)}</section>
    </div>
  );
}

function StreamTab({ game }) {
  const [messages, setMessages] = useState([{ id: 1, user: 'System', text: `Welcome to ${game?.title || 'the stream'} live chat.` }, { id: 2, user: 'Aura', text: 'Community stream connected.' }]);
  const [draft, setDraft] = useState('');
  const videoUrl = game?.stream_url || game?.live_stream_url || game?.trailer_url || game?.video_urls?.[0];
  const youtubeId = useMemo(() => { if (!videoUrl) return null; const m = String(videoUrl).match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|live\/))([^?&#/]+)/i); return m?.[1] || null; }, [videoUrl]);
  const send = () => { const text = draft.trim(); if (!text) return; setMessages(prev => [...prev, { id: Date.now(), user: 'You', text }]); setDraft(''); };
  return <div className="pb-20"><div className="flex items-center gap-2 mb-4 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300"><Radio className="w-4 h-4" /> Live Stream + Unified Chat</div><div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-4 min-h-[620px]"><section className={`${glass} rounded-2xl overflow-hidden flex flex-col`}><div className="aspect-video bg-black flex items-center justify-center">{youtubeId ? <iframe title={`${game.title} stream`} src={`https://www.youtube.com/embed/${youtubeId}?rel=0`} className="w-full h-full" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen /> : <div className="text-center px-8"><div className="w-16 h-16 rounded-full bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center mx-auto mb-4"><Play className="w-7 h-7 text-cyan-300" /></div><h3 className="font-bold text-white">Stream is ready</h3><p className="text-sm text-white/35 mt-2">The studio can publish a live stream URL to this game to activate the player.</p></div>}</div><div className="p-5"><div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" /><span className="text-xs font-bold text-red-300 uppercase tracking-wider">Live</span><span className="text-white/30 text-xs">• {game.title}</span></div><h2 className="text-xl font-black text-white mt-2">{game.title} Community Stream</h2></div></section><aside className={`${glass} rounded-2xl flex flex-col overflow-hidden`}><div className="p-4 border-b border-white/10 flex items-center justify-between"><div><h3 className="font-black text-white">Live Chat</h3><p className="text-[10px] text-white/30 uppercase tracking-wider">Unified community feed</p></div><MessageCircle className="w-4 h-4 text-cyan-300" /></div><div className="flex-1 p-4 space-y-3 overflow-y-auto">{messages.map(m => <div key={m.id} className="rounded-xl bg-white/[0.03] border border-white/5 p-3"><div className="text-[10px] font-bold text-cyan-300">{m.user}</div><div className="text-sm text-white/70 mt-1">{m.text}</div></div>)}</div><div className="p-3 border-t border-white/10"><div className="flex gap-2"><input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Send a message…" className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400/40" /><button onClick={send} className="px-3 rounded-xl bg-cyan-400/15 border border-cyan-400/20 text-cyan-200 font-bold">Send</button></div></div></aside></div></div>;
}

export default function GameHubTabs({ gameId, onClose }) {
  const [game, setGame] = useState(null); const [tab, setTab] = useState('game');
  useEffect(() => { let cancelled = false; base44.entities.Game.get(gameId).then(g => { if (!cancelled) { setGame(g); trackAtomEvent(AtomEvents.GAME_HUB_OPENED, { gameId, gameTitle: g?.title }); } }).catch(() => { if (!cancelled) setGame(null); }); return () => { cancelled = true; }; }, [gameId]);
  const selectTab = (id) => { setTab(id); const event = id === 'game' ? AtomEvents.GAME_TAB_SELECTED : id === 'studio' ? AtomEvents.STUDIO_TAB_SELECTED : AtomEvents.STREAM_TAB_SELECTED; trackAtomEvent(event, { gameId, gameTitle: game?.title }); };
  if (!game) return <div className="h-full flex items-center justify-center text-white/30">Loading game hub…</div>;
  return <div className="h-full w-full relative bg-[#0d0d0d] text-white overflow-hidden flex flex-col"><div className="relative z-30 flex-shrink-0 px-5 md:px-8 pt-16 pb-3 flex items-center justify-between border-b border-white/10 bg-black/30 backdrop-blur-xl"><div className="flex items-center gap-3 min-w-0"><button onClick={onClose} className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10"><X className="w-4 h-4" /></button><div className="min-w-0"><div className="text-[10px] uppercase tracking-[0.2em] text-cyan-300 font-black">Game Hub</div><h1 className="text-lg font-black truncate">{game.title}</h1></div></div><div className="flex p-1 rounded-xl bg-white/5 border border-white/10">{[['game','Game',Gamepad2],['studio','Studio',Building2],['stream','Stream',Radio]].map(([id,label,Icon]) => <button key={id} onClick={() => selectTab(id)} className={`px-3 md:px-5 py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${tab === id ? 'bg-white text-black shadow-lg' : 'text-white/45 hover:text-white hover:bg-white/5'}`}><Icon className="w-3.5 h-3.5" />{label}</button>)}</div></div><div className="relative z-10 flex-1 overflow-y-auto">{tab === 'game' && <GameDetailPanel gameId={gameId} onClose={onClose} />}{tab === 'studio' && <div className="max-w-7xl mx-auto w-full px-5 md:px-10 py-8"><StudioTab game={game} /></div>}{tab === 'stream' && <div className="max-w-7xl mx-auto w-full px-5 md:px-10 py-8"><StreamTab game={game} /></div>}</div></div>;
}
