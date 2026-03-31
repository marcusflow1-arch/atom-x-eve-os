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

  return null;
}