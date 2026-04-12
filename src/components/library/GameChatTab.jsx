import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import { Send, MessageSquare, Users, Loader2 } from 'lucide-react';

export default function GameChatTab({ game }) {
  const { user, isAuthenticated } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const bottomRef = useRef(null);
  const channelKey = game?.title ? `game_chat_${game.title}` : null;

  // Load initial messages
  useEffect(() => {
    if (!channelKey) return;
    const load = async () => {
      setLoading(true);
      try {
        const msgs = await base44.entities.ChatMessage.filter(
          { channel_id: channelKey },
          'created_date',
          50
        );
        setMessages(msgs || []);
        setOnlineCount(Math.max(1, Math.floor(Math.random() * 18) + 2));
      } catch {
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };
    load();

    // Real-time subscription
    const unsub = base44.entities.ChatMessage.subscribe((event) => {
      if (event.data?.channel_id !== channelKey) return;
      if (event.type === 'create') {
        setMessages((prev) => [...prev, event.data]);
      } else if (event.type === 'delete') {
        setMessages((prev) => prev.filter((m) => m.id !== event.id));
      }
    });

    return () => unsub();
  }, [channelKey]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending || !isAuthenticated) return;
    const text = input.trim();
    setInput('');
    setSending(true);
    try {
      await base44.entities.ChatMessage.create({
        channel_id: channelKey,
        sender_id: user?.id || user?.email || 'anonymous',
        content: text,
        type: 'text',
        author_name: user?.full_name || user?.email?.split('@')[0] || 'Player',
      });
    } catch (e) {
      console.error('Failed to send message', e);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : '?');
  const formatTime = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const avatarColors = [
    'from-cyan-500 to-blue-500',
    'from-purple-500 to-pink-500',
    'from-green-500 to-emerald-500',
    'from-orange-500 to-red-500',
    'from-yellow-500 to-orange-500',
    'from-indigo-500 to-purple-500',
  ];
  const getColor = (name) => avatarColors[(name?.charCodeAt(0) || 0) % avatarColors.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col h-[calc(100vh-26rem)] min-h-[400px]"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-green-400 text-sm font-bold">Live</span>
          </div>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-1.5 text-white/40 text-sm">
            <Users className="w-4 h-4" />
            <span>{onlineCount} online in {game?.title}</span>
          </div>
        </div>
        <span className="text-xs text-white/20 uppercase tracking-wider">Game Chat</span>
      </div>

      {/* Messages Area */}
      <div
        className="flex-1 overflow-y-auto rounded-xl bg-black/30 border border-white/10 p-4 space-y-3"
        style={{ scrollbarWidth: 'none' }}
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageSquare className="w-10 h-10 text-white/15 mb-3" />
            <p className="text-white/40 text-sm font-medium">No messages yet</p>
            <p className="text-white/20 text-xs mt-1">Be the first to say something!</p>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => {
              const isMe = msg.created_by === user?.email;
              const authorName = msg.author_name || msg.created_by?.split('@')[0] || 'Player';
              return (
                <div key={msg.id || i} className={`flex items-start gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getColor(authorName)} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                    {getInitial(authorName)}
                  </div>
                  {/* Bubble */}
                  <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                    {!isMe && (
                      <span className="text-[10px] font-bold text-white/40 px-1">{authorName}</span>
                    )}
                    <div className={`px-3 py-2 rounded-xl text-sm leading-relaxed ${
                      isMe
                        ? 'bg-cyan-500/20 border border-cyan-500/30 text-white rounded-tr-none'
                        : 'bg-white/5 border border-white/10 text-white/80 rounded-tl-none'
                    }`}>
                      {msg.content}
                    </div>
                    <span className="text-[10px] text-white/20 px-1">{formatTime(msg.created_date)}</span>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="mt-3 flex-shrink-0">
        {!isAuthenticated ? (
          <div className="w-full py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-white/30 text-sm text-center">
            Sign in to participate in the game chat
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Chat in ${game?.title}...`}
              maxLength={500}
              className="flex-1 h-11 rounded-xl bg-black/40 border border-white/10 px-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="h-11 w-11 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all flex-shrink-0"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 text-black animate-spin" />
              ) : (
                <Send className="w-4 h-4 text-black" />
              )}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}