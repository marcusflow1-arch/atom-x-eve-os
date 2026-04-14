import React, { useState } from 'react';
import { Radio, Eye, Send, Users, ChevronRight } from 'lucide-react';

const MOCK_STREAMERS = [
  { name: 'ShadowAce', viewers: '2.4k', title: 'Epic boss run', avatar: 'S' },
  { name: 'NovaPulse', viewers: '1.1k', title: 'Chill grind', avatar: 'N' },
  { name: 'VoidWalker', viewers: '890', title: 'PvP highlights', avatar: 'V' },
];

const MOCK_CHAT = [
  { user: 'CryptoKnight', text: 'This game is insane 🔥', color: '#22d3ee' },
  { user: 'NeuroGamer', text: 'How did he do that move??', color: '#a78bfa' },
  { user: 'BladeRunner', text: 'GG no re lmao', color: '#4ade80' },
  { user: 'SkyHunter', text: 'LETS GOOO 🎮', color: '#fbbf24' },
  { user: 'NightOwl', text: 'subscribed for more', color: '#f87171' },
  { user: 'CryptoKnight', text: 'drop the build pls', color: '#22d3ee' },
];

export default function LiveStreamSection({ game, onViewAll }) {
  const [activeStreamer, setActiveStreamer] = useState(0);
  const [chatMessages, setChatMessages] = useState(MOCK_CHAT);
  const [chatInput, setChatInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const streamer = MOCK_STREAMERS[activeStreamer];

  const handleSend = () => {
    if (!chatInput.trim()) return;
    setChatMessages(prev => [...prev, { user: 'You', text: chatInput.trim(), color: '#60a5fa' }]);
    setChatInput('');
  };

  return (
    <div className="border-t border-white/10 pt-8">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Radio className="w-4 h-4 text-red-400" />
        <span className="text-white font-black text-sm">Live Streams</span>
        <span className="flex items-center gap-1 ml-2 px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 text-[9px] font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse inline-block" />
          LIVE
        </span>
        <button onClick={onViewAll} className="ml-auto text-white/30 text-[10px] hover:text-white transition-colors">View all →</button>
      </div>

      {/* Main layout: big stream box + chat */}
      <div className="flex gap-4" style={{ height: sidebarOpen ? '480px' : '340px' }}>

        {/* Left Sidebar Toggle + Video Box */}
        <div className="flex gap-2">
          {/* Toggle Arrow */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all flex-shrink-0 mt-[120px]"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
            title={sidebarOpen ? 'Hide streamers' : 'Show streamers'}
          >
            <ChevronRight className={`w-4 h-4 text-white/50 transition-transform ${sidebarOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Sidebar Dropdown */}
          {sidebarOpen && (
            <div className="w-48 rounded-xl border border-white/10 overflow-hidden flex flex-col" style={{ background: 'rgba(0,0,0,0.4)' }}>
              <div className="px-3 py-2 border-b border-white/8">
                <p className="text-white/70 text-xs font-bold">Streamers</p>
              </div>
              <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1" style={{ scrollbarWidth: 'none' }}>
                {MOCK_STREAMERS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveStreamer(i)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all text-left text-xs ${
                      i === activeStreamer
                        ? 'bg-white/10 border border-white/20'
                        : 'bg-transparent border border-transparent hover:bg-white/5'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-[8px] font-black text-white flex-shrink-0">
                      {s.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold truncate">{s.name}</p>
                      <p className="text-white/40 text-[9px] flex items-center gap-0.5">
                        <Users className="w-2.5 h-2.5" /> {s.viewers}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Left: Video Box */}
        <div className="flex-1 min-w-0 flex flex-col gap-0">
          {/* Big stream preview */}
          <div className="relative flex-1 rounded-xl overflow-hidden bg-black border border-white/10">
            <img
              src={game?.cover_image}
              alt="stream"
              className="w-full h-full object-cover opacity-50"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            {/* LIVE badge + viewers */}
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-red-500 px-2 py-1 rounded-md text-[10px] font-bold text-white">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                LIVE
              </div>
              <div className="flex items-center gap-1 bg-black/60 px-2 py-1 rounded-md text-[10px] text-white/80">
                <Eye className="w-3 h-3" />
                {streamer.viewers}
              </div>
            </div>

            {/* Streamer info overlay bottom */}
            <div className="absolute bottom-3 left-3 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-sm font-black text-white">
                {streamer.avatar}
              </div>
              <div>
                <p className="text-white font-bold text-sm leading-tight">{streamer.name}</p>
                <p className="text-white/50 text-[10px]">{streamer.title}</p>
              </div>
            </div>
          </div>


        </div>

        {/* Right: Live Chat */}
        <div className="w-[260px] flex-shrink-0 flex flex-col rounded-xl border border-white/10 overflow-hidden" style={{ background: 'rgba(0,0,0,0.3)' }}>
          {/* Chat header */}
          <div className="px-3 py-2 border-b border-white/8 flex items-center gap-2">
            <Radio className="w-3 h-3 text-red-400" />
            <span className="text-white/70 text-xs font-bold">Live Chat</span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2" style={{ scrollbarWidth: 'none' }}>
            {chatMessages.map((msg, i) => (
              <div key={i} className="text-xs leading-relaxed">
                <span className="font-bold mr-1" style={{ color: msg.color }}>{msg.user}:</span>
                <span className="text-white/70">{msg.text}</span>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="px-2 py-2 border-t border-white/8 flex gap-1.5">
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Say something..."
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-white/25 outline-none focus:border-cyan-400/40"
            />
            <button
              onClick={handleSend}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-cyan-400 hover:text-cyan-200 transition-all flex-shrink-0"
              style={{ background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.2)' }}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}