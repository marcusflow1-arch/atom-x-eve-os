import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { MessageCircle, Play, Radio, Send, Users } from 'lucide-react';
import GameAchievementCard from '@/components/game/GameAchievementCard';

const glass = {
  background: 'rgba(8, 12, 18, 0.42)',
  backdropFilter: 'blur(30px) saturate(150%)',
  WebkitBackdropFilter: 'blur(30px) saturate(150%)',
  border: '1px solid rgba(255,255,255,0.08)',
  boxShadow: '0 10px 38px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.045)',
};

function getVideoUrl(game) {
  return game?.stream_url || game?.live_stream_url || game?.twitch_url || game?.youtube_live_url || game?.trailer_url || game?.video_urls?.[0] || '';
}

function getEmbed(url) {
  if (!url) return null;
  const value = String(url);
  const yt = value.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|live\/))([^?&#/]+)/i);
  if (yt?.[1]) return `https://www.youtube.com/embed/${yt[1]}?rel=0&autoplay=0`;
  const twitch = value.match(/twitch\.tv\/(?:videos\/)?([^/?#]+)|twitch\.tv\/videos\/(\d+)/i);
  if (twitch) {
    const channel = twitch[2] || twitch[1];
    return channel && /^\d+$/.test(channel) ? `https://player.twitch.tv/?video=${channel}&parent=${window.location.hostname}` : `https://player.twitch.tv/?channel=${channel}&parent=${window.location.hostname}`;
  }
  return null;
}

export default function LiveStreamBox({ game }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [achievements, setAchievements] = useState([]);
  const videoUrl = getVideoUrl(game);
  const embedUrl = useMemo(() => getEmbed(videoUrl), [videoUrl]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await base44.entities.Achievement.list('-created_date', 100);
        const rows = res?.data || res || [];
        const gameTitle = String(game?.title || '').trim().toLowerCase();
        const gameId = String(game?.id || '').trim();
        const filtered = rows.filter(a => {
          const ag = String(a.game || a.game_title || a.gameId || a.game_id || '').trim().toLowerCase();
          return !gameTitle && !gameId ? true : ag === gameTitle || ag === gameId;
        });
        if (active) setAchievements(filtered);
      } catch {
        if (active) setAchievements([]);
      }
    };
    load();
    return () => { active = false; };
  }, [game?.id, game?.title]);

  useEffect(() => {
    setMessages([{ id: 'system', user: 'System', text: `Welcome to ${game?.title || 'the game'} stream.` }]);
  }, [game?.title]);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setMessages(prev => [...prev, { id: Date.now(), user: 'You', text }]);
    setDraft('');
  };

  return (
    <div className="w-full h-full overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
      <div className="max-w-7xl mx-auto px-5 md:px-8 py-7 space-y-8">
        <section className="rounded-3xl overflow-hidden" style={glass}>
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] min-h-[560px]">
            <div className="min-w-0 border-b xl:border-b-0 xl:border-r border-white/10 flex flex-col">
              <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /><span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">Live Stream</span><span className="px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-300 text-[8px] font-bold">LIVE</span></div>
                <span className="text-[10px] text-white/25 flex items-center gap-1"><Users className="w-3 h-3" /> Game-specific stream</span>
              </div>
              <div className="relative aspect-video bg-black/25 flex items-center justify-center overflow-hidden">
                {embedUrl ? <iframe title={`${game?.title || 'Game'} stream`} src={embedUrl} className="w-full h-full border-0" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen /> : <><img src={game?.banner_image || game?.cover_image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20 blur-xl scale-105" /><div className="absolute inset-0 bg-black/55" /><div className="relative z-10 text-center px-8"><div className="w-16 h-16 rounded-full bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center mx-auto mb-4"><Play className="w-7 h-7 text-cyan-300" /></div><h3 className="font-black text-white text-lg">{game?.title || 'Game'} Stream</h3><p className="text-sm text-white/35 mt-2">No active stream is configured for this game yet.</p></div></>}
              </div>
              <div className="px-5 py-4"><div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-cyan-300 font-black"><Radio className="w-3.5 h-3.5" /> {game?.title || 'Game'}</div><h2 className="text-xl font-black text-white mt-1">{game?.title || 'Game'} Community Stream</h2><p className="text-xs text-white/35 mt-1">Watch streams and stay connected to the game's community.</p></div>
            </div>
            <aside className="min-h-[420px] flex flex-col bg-white/[0.018]">
              <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between"><div><h3 className="font-black text-white text-sm">Live Chat</h3><p className="text-[9px] text-white/25 uppercase tracking-wider">Part of the stream</p></div><MessageCircle className="w-4 h-4 text-cyan-300" /></div>
              <div className="flex-1 p-4 space-y-3 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>{messages.map(message => <div key={message.id} className="rounded-xl px-3 py-2.5 bg-white/[0.025] border border-white/[0.06]"><div className="text-[9px] font-black uppercase tracking-wider text-cyan-300/80">{message.user}</div><div className="text-sm text-white/70 mt-1 leading-relaxed">{message.text}</div></div>)}</div>
              <div className="p-3 border-t border-white/10"><div className="flex gap-2"><input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Send a message…" className="flex-1 min-w-0 rounded-xl bg-white/[0.035] border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400/35" /><button onClick={send} className="w-10 rounded-xl bg-cyan-400/10 border border-cyan-400/20 text-cyan-200 flex items-center justify-center" aria-label="Send"><Send className="w-4 h-4" /></button></div></div>
            </aside>
          </div>
        </section>

        <section>
          <div className="flex items-center gap-4"><span className="h-px flex-1 bg-white/10" /><h2 className="text-sm md:text-base font-black uppercase tracking-[0.18em] text-white/85">{game?.title || 'Game'} Cards</h2><span className="h-px flex-1 bg-white/10" /></div>
          <div className="flex items-center justify-center gap-2 mt-4"><button className="px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-wider bg-orange-400/10 border border-orange-400/20 text-orange-300">DLC</button>{['ALL', 'ABILITY', 'EQUIPMENT', 'COMPANION', 'ENVIRONMENT'].map(filter => <button key={filter} className="px-2.5 py-1 rounded-full text-[8px] font-bold uppercase tracking-wider text-white/35 hover:text-white/75 transition-colors">{filter}</button>)}</div>
          <div className="mt-5 flex gap-4 overflow-x-auto pb-3" style={{ scrollbarWidth: 'thin' }}>{achievements.length > 0 ? achievements.map((achievement, index) => <GameAchievementCard key={achievement.id || `${achievement.title}-${index}`} achievement={achievement} index={index} compact />) : <div className="w-full text-center py-10 text-white/25 text-xs">No achievements are registered for this game yet.</div>}</div>
        </section>
      </div>
    </div>
  );
}
