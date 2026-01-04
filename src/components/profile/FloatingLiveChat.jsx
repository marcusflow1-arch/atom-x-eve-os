import React, { useState } from 'react';
import { Send } from 'lucide-react';

const MOCK_MESSAGES = [
  { id: 1, user: 'fan_01', text: 'Loved the last lore breakdown! 🔥' },
  { id: 2, user: 'mod_kai', text: 'Stream starts in 10, prep your questions.' },
  { id: 3, user: 'viewerX', text: 'Any updates on the new build?' },
];

export default function FloatingLiveChat() {
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [text, setText] = useState('');

  const send = () => {
    if (!text.trim()) return;
    setMessages((m) => [...m, { id: Date.now(), user: 'you', text: text.trim() }]);
    setText('');
  };

  return (
    <aside className="h-full w-full">
      <div
        className="h-full w-full rounded-2xl border flex flex-col"
        style={{
          background: 'rgba(255,255,255,0.08)',
          borderColor: 'rgba(255,255,255,0.15)',
          backdropFilter: 'blur(16px) saturate(140%)',
          WebkitBackdropFilter: 'blur(16px) saturate(140%)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.45)',
        }}
      >
        <div className="p-3 border-b border-white/10 text-white/80 text-xs tracking-wider uppercase">Live Chat</div>
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {messages.map(m => (
            <div key={m.id} className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/80">
              <span className="text-cyan-300 mr-2">{m.user}:</span>{m.text}
            </div>
          ))}
        </div>
        <div className="p-3 border-t border-white/10 flex items-center gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="Type a message..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-white/40 outline-none focus:border-cyan-400/40"
          />
          <button
            onClick={send}
            className="px-3 py-2 rounded-xl text-white/80 hover:text-white border border-white/10 hover:bg-white/5 transition-all"
            title="Send"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  );
}