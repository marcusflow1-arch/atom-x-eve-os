import React, { useState, useRef, useEffect } from 'react';
import { Send, Megaphone, MessageSquare } from 'lucide-react';
import { clanAction } from './clanStore';

/** Compact chat panel pinned to the right edge of the clan overlay. */
export default function ClanOverlayChat({ clan, messages, myMembership }) {
  const [input, setInput] = useState('');
  const [announce, setAnnounce] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  if (!clan) return null;

  const canAnnounce = myMembership && (myMembership.role === 'leader' || myMembership.role === 'officer');

  const send = async () => {
    if (!input.trim()) return;
    try {
      await clanAction('post_message', {
        divisionId: clan.id,
        content: input.trim(),
        isAnnouncement: announce && canAnnounce,
      });
      setInput(''); setAnnounce(false);
    } catch (e) { console.error(e); }
  };

  return (
    <div className="w-72 flex-shrink-0 border-l border-white/10 flex flex-col"
      style={{ background: 'rgba(15, 18, 25, 0.65)' }}
    >
      <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-cyan-300" />
        <span className="text-white text-sm font-semibold">Guild Chat</span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-2 scrollbar-hide">
        {messages.length === 0 && (
          <div className="text-center py-6 text-white/30 text-xs">No messages yet. Say hello!</div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`text-xs ${m.isAnnouncement ? 'bg-amber-500/10 border-l-2 border-amber-400 pl-2 py-1 rounded' : ''}`}>
            <div className="flex items-baseline gap-1.5">
              <span className={`font-semibold ${m.role === 'leader' ? 'text-amber-300' : m.role === 'officer' ? 'text-blue-300' : 'text-white/80'}`}>
                {m.author}
              </span>
              {m.isAnnouncement && <Megaphone className="w-3 h-3 text-amber-300" />}
            </div>
            <div className="text-white/70 break-words">{m.content}</div>
          </div>
        ))}
      </div>

      <div className="p-2 border-t border-white/10">
        {canAnnounce && (
          <label className="flex items-center gap-1.5 mb-1.5 text-[10px] text-white/50 cursor-pointer">
            <input type="checkbox" checked={announce} onChange={(e) => setAnnounce(e.target.checked)} className="w-3 h-3" />
            Send as announcement
          </label>
        )}
        <div className="flex items-center gap-1.5">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
            placeholder="Message guild..."
            className="flex-1 px-2 py-1.5 bg-black/40 border border-white/10 rounded text-white text-xs focus:outline-none focus:border-cyan-400/40"
          />
          <button onClick={send} disabled={!input.trim()} className="p-1.5 rounded bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 hover:bg-cyan-500/30 disabled:opacity-40">
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}