import React, { useMemo, useState } from 'react';
import { MessageCircle, Play, Radio, Send, Users } from 'lucide-react';
import StoreAchievementsStrip from '@/components/store/StoreAchievementsStrip';

const panelStyle = {
  background: 'rgba(28, 32, 38, 0.34)',
  backdropFilter: 'blur(30px) saturate(150%)',
  WebkitBackdropFilter: 'blur(30px) saturate(150%)',
  border: '1px solid rgba(255,255,255,0.09)',
  boxShadow: '0 10px 36px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.05)',
};

function getYouTubeId(url) {
  if (!url) return null;
  const match = String(url).match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|live\/))([^?&#/]+)/i);
  return match?.[1] || null;
}

function getTwitchChannel(url) {
  if (!url) return null;
  const match = String(url).match(/twitch\.tv\/([A-Za-z0-9_]+)/i);
  return match?.[1] || null;
}

export default function GameStreamPanel({ game }) {
  const [messages, setMessages] = useState([
    { id: 1, user: 'System', text: `Welcome to ${game?.title || 'this game'} live chat.` },
    { id: 2, user: 'Aura', text: 'Game stream channel connected.' },
  ]);
  const [draft, setDraft] = useState('');

  const streamUrl = game?.stream_url || game?.live_stream_url || game?.streamUrl || game?.liveStreamUrl || game?.trailer_url || game?.video_urls?.[0] || '';
  const youtubeId = useMemo(() => getYouTubeId(streamUrl), [streamUrl]);
  const twitchChannel = useMemo(() => getTwitchChannel(streamUrl), [streamUrl]);

  const sendMessage = () => {
    const text = draft.trim();
    if (!text) return;
    setMessages(prev => [...prev, { id: Date.now(), user: 'You', text }]);
    setDraft('');
  };

  const renderPlayer = () => {
    if (youtubeId) {
      return (
        <iframe
          title={`${game?.title || 'Game'} stream`}
          src={`https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1`}
          className="w-full h-full"
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      );
    }

    if (twitchChannel) {
      const parent = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      return (
        <iframe
          title={`${game?.title || 'Game'} Twitch stream`}
          src={`https://player.twitch.tv/?channel=${encodeURIComponent(twitchChannel)}&parent=${encodeURIComponent(parent)}`}
          className="w-full h-full"
          allowFullScreen
        />
      );
    }

    if (streamUrl && /^(https?:)?\/\//i.test(streamUrl)) {
      return <video src={streamUrl} controls playsInline className="w-full h-full object-contain bg-black" />;
    }

    return (
      <div className="absolute inset-0 flex items-center justify-center text-center px-8">
        <div>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <Play className="w-7 h-7 text-white/70 fill-white/50" />
          </div>
          <h3 className="text-white font-black text-lg">Game stream ready</h3>
          <p className="text-white/35 text-sm mt-2 max-w-md">Add a live stream URL to this game to activate the player. The page is already wired for YouTube, Twitch, and direct video URLs.</p>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-8 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-white/45 text-[10px] font-black uppercase tracking-[0.24em]">
              <Radio className="w-4 h-4 text-red-300" />
              Game Stream
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white mt-1 tracking-tight">{game?.title || 'Game'} Live</h2>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/55">Live channel</span>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-5">
          <section className="rounded-3xl overflow-hidden" style={panelStyle}>
            <div className="relative aspect-video bg-black/40 overflow-hidden">
              {game?.banner_image && !youtubeId && !twitchChannel && !streamUrl && (
                <img src={game.banner_image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20 blur-md scale-105" />
              )}
              <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.06), rgba(0,0,0,0.32))' }} />
              <div className="relative z-10 w-full h-full">{renderPlayer()}</div>
            </div>
            <div className="px-5 py-4 flex items-center justify-between gap-4 border-t border-white/10">
              <div className="min-w-0">
                <p className="text-white font-black truncate">{game?.title || 'Game'} Community Stream</p>
                <p className="text-white/35 text-xs mt-1">Watch gameplay and participate in the community feed.</p>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-white/35 flex-shrink-0">
                <Users className="w-3.5 h-3.5" />
                Community
              </div>
            </div>
          </section>

          <aside className="rounded-3xl overflow-hidden flex flex-col min-h-[360px]" style={panelStyle}>
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-white font-black text-sm">Live Chat</h3>
                <p className="text-[9px] text-white/30 uppercase tracking-[0.18em] mt-0.5">Game community</p>
              </div>
              <MessageCircle className="w-4 h-4 text-white/45" />
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5" style={{ scrollbarWidth: 'none' }}>
              {messages.map(message => (
                <div key={message.id} className="rounded-2xl px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-[10px] font-bold text-white/45">{message.user}</p>
                  <p className="text-sm text-white/75 mt-1 leading-relaxed">{message.text}</p>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-white/10">
              <div className="flex gap-2">
                <input
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  placeholder="Say something..."
                  className="flex-1 min-w-0 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/20 outline-none"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                />
                <button onClick={sendMessage} className="w-10 h-10 rounded-xl flex items-center justify-center text-white/70 hover:text-white transition-colors" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }} title="Send message">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </aside>
        </div>

        <section className="rounded-3xl overflow-hidden" style={panelStyle}>
          <div className="px-5 py-4 border-b border-white/10">
            <h3 className="text-white font-black text-lg">{game?.title || 'Game'} Achievement Cards</h3>
            <p className="text-white/35 text-xs mt-1">Cards the player can potentially earn from this game.</p>
          </div>
          <div className="min-h-[220px] p-3">
            <StoreAchievementsStrip currentGame={game} />
          </div>
        </section>
      </div>
    </div>
  );
}
