import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Send, Paperclip, Video, Trophy, Mic, Phone, MoreVertical,
  Smile, Clock, MessageCircle, Share2, Play
} from 'lucide-react';

// ─── Mock Chat Data ──────────────────────────────────────────────────────────
const MOCK_CHAT_HISTORY = [
  {
    id: 1,
    sender: 'friend',
    name: 'IsabelX',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&q=80',
    content: 'yo did you beat that raid yet?',
    timestamp: new Date(Date.now() - 600000),
    type: 'text'
  },
  {
    id: 2,
    sender: 'you',
    name: 'You',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&q=80',
    content: 'yeah got it first try!',
    timestamp: new Date(Date.now() - 540000),
    type: 'text'
  },
  {
    id: 3,
    sender: 'friend',
    name: 'IsabelX',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&q=80',
    content: 'let me see the clip!',
    timestamp: new Date(Date.now() - 480000),
    type: 'text'
  },
  {
    id: 4,
    sender: 'you',
    name: 'You',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&q=80',
    content: 'shared a video clip',
    timestamp: new Date(Date.now() - 420000),
    type: 'video',
    metadata: {
      title: 'First Raid Clear - Cyberpunk 2088',
      duration: '2:34',
      thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&q=80'
    }
  },
  {
    id: 5,
    sender: 'friend',
    name: 'IsabelX',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&q=80',
    content: 'that was insane 🔥',
    timestamp: new Date(Date.now() - 360000),
    type: 'text'
  },
  {
    id: 6,
    sender: 'friend',
    name: 'IsabelX',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&q=80',
    content: 'shared an achievement guide',
    timestamp: new Date(Date.now() - 300000),
    type: 'guide',
    metadata: {
      title: 'How to Unlock Shadow Master Achievement',
      description: 'Complete all stealth missions without being detected',
      game: 'Cyberpunk 2088'
    }
  },
];

const MOCK_ACHIEVEMENTS = [
  { id: 1, name: 'First Blood', desc: 'Get your first kill', icon: '🎯' },
  { id: 2, name: 'Shadow Master', desc: 'Complete all stealth missions', icon: '👤' },
  { id: 3, name: 'Legendary', desc: 'Reach max level', icon: '👑' },
];

// ─── Message Bubble Component ─────────────────────────────────────────────────
function MessageBubble({ msg, isYou }) {
  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-2 mb-3 ${isYou ? 'justify-end' : 'justify-start'}`}
    >
      {!isYou && (
        <img src={msg.avatar} alt={msg.name} className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
      )}

      <div className={`flex flex-col gap-1 max-w-xs ${isYou ? 'items-end' : 'items-start'}`}>
        {!isYou && (
          <p className="text-[8px] font-bold text-white/50 px-2">{msg.name}</p>
        )}

        {msg.type === 'text' && (
          <div
            className="px-4 py-2 rounded-lg text-sm leading-relaxed"
            style={{
              background: isYou ? 'rgba(34,211,238,0.2)' : 'rgba(255,255,255,0.08)',
              border: isYou ? '1px solid rgba(34,211,238,0.3)' : '1px solid rgba(255,255,255,0.1)',
              color: isYou ? '#67e8f9' : 'rgba(255,255,255,0.9)',
            }}
          >
            {msg.content}
          </div>
        )}

        {msg.type === 'video' && (
          <div
            className="rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity group"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <div className="relative w-48 h-28">
              <img src={msg.metadata.thumbnail} alt={msg.metadata.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/50 transition-all">
                <Play className="w-8 h-8 text-white fill-white" />
              </div>
              <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-[8px] text-white font-bold">
                {msg.metadata.duration}
              </div>
            </div>
            <div className="p-3">
              <p className="text-xs font-semibold text-white line-clamp-1">{msg.metadata.title}</p>
              <p className="text-[8px] text-white/50 mt-1">Video Clip</p>
            </div>
          </div>
        )}

        {msg.type === 'guide' && (
          <div
            className="rounded-lg p-3 w-56 cursor-pointer hover:opacity-80 transition-opacity"
            style={{
              background: 'rgba(251,191,36,0.08)',
              border: '1px solid rgba(251,191,36,0.25)',
            }}
          >
            <div className="flex items-start gap-2">
              <Trophy className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-yellow-400">{msg.metadata.title}</p>
                <p className="text-[8px] text-white/60 mt-1">{msg.metadata.description}</p>
                <p className="text-[7px] text-white/40 mt-1.5">{msg.metadata.game}</p>
              </div>
            </div>
          </div>
        )}

        <p className="text-[7px] text-white/40 px-2 mt-0.5">
          {formatTime(msg.timestamp)}
        </p>
      </div>
    </motion.div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function FriendMessenger({ friend, onClose }) {
  const [messages, setMessages] = useState(MOCK_CHAT_HISTORY);
  const [inputValue, setInputValue] = useState('');
  const [voiceActive, setVoiceActive] = useState(false);
  const [tab, setTab] = useState('chat'); // 'chat', 'clips', 'guides'
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (inputValue.trim()) {
      const newMsg = {
        id: messages.length + 1,
        sender: 'you',
        name: 'You',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&q=80',
        content: inputValue,
        timestamp: new Date(),
        type: 'text'
      };
      setMessages([...messages, newMsg]);
      setInputValue('');
    }
  };

  const handleShareVideo = () => {
    const newMsg = {
      id: messages.length + 1,
      sender: 'you',
      name: 'You',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&q=80',
      content: 'shared a video clip',
      timestamp: new Date(),
      type: 'video',
      metadata: {
        title: 'Epic Moment - Elden Ring',
        duration: '1:42',
        thumbnail: 'https://images.unsplash.com/photo-1605901309584-818e25960b8f?w=200&q=80'
      }
    };
    setMessages([...messages, newMsg]);
  };

  const handleShareGuide = (achievement) => {
    const newMsg = {
      id: messages.length + 1,
      sender: 'you',
      name: 'You',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&q=80',
      content: 'shared an achievement guide',
      timestamp: new Date(),
      type: 'guide',
      metadata: {
        title: `How to Unlock ${achievement.name}`,
        description: achievement.desc,
        game: 'Valorant'
      }
    };
    setMessages([...messages, newMsg]);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      transition={{ type: 'spring', stiffness: 280, damping: 28 }}
      className="fixed z-[71] flex flex-col overflow-hidden"
      style={{
        right: '0px',
        left: '400px',
        top: '64px',
        bottom: '0px',
        background: 'linear-gradient(135deg, rgba(6, 8, 16, 0.95) 0%, rgba(10, 12, 22, 0.92) 100%)',
        backdropFilter: 'blur(60px) saturate(200%)',
        WebkitBackdropFilter: 'blur(60px) saturate(200%)',
        border: 'none',
        boxShadow: 'inset -1px 0 0 rgba(255,255,255,0.08)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <img src={friend.avatar} alt={friend.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-white/10" />
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-white truncate">{friend.name}</p>
            <p className={`text-[10px] font-medium ${friend.status === 'online' ? 'text-emerald-400' : 'text-white/50'}`}>
              {friend.status === 'online' ? '🟢 Online' : '🔴 Away'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setVoiceActive(!voiceActive)}
            className={`p-2 rounded-lg flex items-center justify-center transition-all ${
              voiceActive ? 'bg-red-500/20 text-red-400' : 'text-white/40 hover:text-white/70 hover:bg-white/5'
            }`}
            style={{ border: voiceActive ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(255,255,255,0.08)' }}
            title="Voice Call"
          >
            <Mic className="w-5 h-5" />
          </button>
          <button onClick={onClose}
            className="p-2 rounded-lg flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/5 transition-all"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-6 pt-4 pb-4 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {[
          { id: 'chat', label: 'Chat', icon: MessageCircle },
          { id: 'clips', label: 'Clips', icon: Video },
          { id: 'guides', label: 'Guides', icon: Trophy }
        ].map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id}
              onClick={() => setTab(t.id)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all flex-1"
              style={{
                background: tab === t.id ? 'rgba(34,211,238,0.12)' : 'transparent',
                border: tab === t.id ? '1px solid rgba(34,211,238,0.25)' : '1px solid rgba(255,255,255,0.06)',
                color: tab === t.id ? '#67e8f9' : 'rgba(255,255,255,0.6)'
              }}>
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Chat Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4" style={{ scrollbarWidth: 'none' }}>
        {tab === 'chat' && (
          <div>
            {messages.map(msg => (
              <MessageBubble key={msg.id} msg={msg} isYou={msg.sender === 'you'} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}

        {tab === 'clips' && (
          <div className="space-y-2">
            {messages.filter(m => m.type === 'video').map(msg => (
              <div key={msg.id}
                className="rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity group"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="relative w-full h-32">
                  <img src={msg.metadata.thumbnail} alt={msg.metadata.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/50 transition-all">
                    <Play className="w-6 h-6 text-white fill-white" />
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-sm font-semibold text-white">{msg.metadata.title}</p>
                  <p className="text-[8px] text-white/50 mt-1">{msg.metadata.duration}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'guides' && (
          <div className="space-y-2">
            {MOCK_ACHIEVEMENTS.map(ach => (
              <div key={ach.id}
                className="rounded-lg p-3 cursor-pointer hover:opacity-80 transition-opacity"
                style={{
                  background: 'rgba(251,191,36,0.08)',
                  border: '1px solid rgba(251,191,36,0.25)',
                }}
                onClick={() => handleShareGuide(ach)}>
                <div className="flex items-start gap-2">
                  <span className="text-2xl flex-shrink-0">{ach.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-yellow-400">{ach.name}</p>
                    <p className="text-[8px] text-white/60 mt-1">{ach.desc}</p>
                    <p className="text-[8px] text-white/40 mt-1.5">Click to share</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input Area (Chat only) */}
      {tab === 'chat' && (
        <div className="flex-shrink-0 px-6 py-4"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex gap-2 mb-3">
            <button
              onClick={handleShareVideo}
              className="p-2 rounded-lg flex items-center justify-center text-white/50 hover:text-white/80 hover:bg-white/5 transition-all"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
              title="Share Video Clip"
            >
              <Video className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTab('guides')}
              className="p-2 rounded-lg flex items-center justify-center text-white/50 hover:text-white/80 hover:bg-white/5 transition-all"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
              title="Share Achievement Guide"
            >
              <Trophy className="w-4 h-4" />
            </button>
            <div className="flex-1" />
            <button
              className="p-2 rounded-lg flex items-center justify-center text-white/50 hover:text-white/80 hover:bg-white/5 transition-all"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
              title="Emoji"
            >
              <Smile className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-2">
            <input type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSend()}
              placeholder="Type a message..."
              className="flex-1 rounded-lg px-4 py-3 text-sm text-white placeholder-white/30 outline-none"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }} />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim()}
              className="px-4 rounded-lg flex items-center justify-center transition-all disabled:opacity-40 font-semibold"
              style={{
                background: inputValue.trim() ? 'rgba(34,211,238,0.2)' : 'rgba(255,255,255,0.05)',
                border: inputValue.trim() ? '1px solid rgba(34,211,238,0.3)' : '1px solid rgba(255,255,255,0.08)',
                color: inputValue.trim() ? '#67e8f9' : 'rgba(255,255,255,0.4)'
              }}>
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}