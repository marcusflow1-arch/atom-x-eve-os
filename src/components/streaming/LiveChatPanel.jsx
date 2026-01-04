import React, { useState, useRef, useEffect } from 'react';
import { Send, Heart } from 'lucide-react';
import HeartReactionBubbles from './HeartReactionBubbles';
import { useAuth } from '@/components/auth/AuthContext';

const MOCK_MESSAGES = [
  { id: 1, user: 'fan_01', text: 'This visuals are insane! ✨', type: 'text' },
  { id: 2, user: 'mod_kai', text: 'Welcome everyone to the stream!', type: 'system' },
  { id: 3, user: 'viewerX', text: 'Is this live rendered?', type: 'text' },
];

export default function LiveChatPanel() {
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [text, setText] = useState('');
  const [heartTrigger, setHeartTrigger] = useState(0);
  const messagesEndRef = useRef(null);
  const { user } = useAuth();
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const send = () => {
    if (!text.trim()) return;
    setMessages((m) => [...m, { 
      id: Date.now(), 
      user: user?.username || 'You', 
      text: text.trim(), 
      type: 'text' 
    }]);
    setText('');
    // Trigger hearts on message send for fun
    triggerHeart();
  };

  const triggerHeart = () => {
    setHeartTrigger(prev => prev + 1);
  };

  return (
    <div className="h-full w-full relative flex flex-col">
      {/* Transparent Glass Background to let Active Gold shine through */}
      <div 
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          background: 'rgba(255, 255, 255, 0.02)', // Nearly 100% transparent
          boxShadow: 'inset 0 0 20px rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(4px)', // Minimal blur to keep background visible
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      />

      {/* Heart Reaction Bubbles Layer */}
      <HeartReactionBubbles trigger={heartTrigger} />

      {/* Header */}
      <div className="relative p-4 border-b border-white/10 flex justify-between items-center z-10">
        <span className="text-white/90 font-bold tracking-wide text-sm uppercase">Live Chat</span>
        <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            <span className="text-xs text-white/50">2.4k</span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="relative flex-1 overflow-y-auto p-4 space-y-3 z-10 scrollbar-hide">
        {messages.map((m) => (
          <div 
            key={m.id} 
            className={`
              text-sm leading-relaxed animate-in slide-in-from-bottom-2 duration-300
              ${m.type === 'system' ? 'text-yellow-400/80 italic text-xs py-1 text-center' : 'text-white/80'}
            `}
          >
            {m.type !== 'system' && (
              <span className="font-bold mr-2" style={{ color: '#22d3ee' }}>
                {m.user}:
              </span>
            )}
            {m.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="relative p-3 border-t border-white/10 z-20">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                placeholder="Say something..."
                className="w-full bg-black/20 border border-white/10 rounded-full px-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 focus:bg-black/30 transition-all"
            />
          </div>
          
          {/* Heart Reaction Button */}
          <button
            onClick={triggerHeart}
            className="p-2 rounded-full bg-white/5 hover:bg-pink-500/20 border border-white/10 hover:border-pink-500/50 text-pink-400 transition-all group active:scale-90"
            title="Send Love"
          >
            <Heart className="w-5 h-5 group-hover:fill-pink-500 transition-colors" />
          </button>

          {/* Send Button */}
          <button
            onClick={send}
            disabled={!text.trim()}
            className="p-2 rounded-full bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-500/50 text-cyan-400 transition-all active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}