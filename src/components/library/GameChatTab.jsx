import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import { Send, MessageSquare, Users, Loader2, Hash, AlertCircle, Lock } from 'lucide-react';

const FORUM_CHANNELS = Array.from({ length: 10 }, (_, i) => ({ id: i + 1, name: `Channel ${i + 1}` }));
const CHANNEL_CAPACITY = 100;

const avatarColors = [
  'from-cyan-500 to-blue-500',
  'from-purple-500 to-pink-500',
  'from-green-500 to-emerald-500',
  'from-orange-500 to-red-500',
  'from-yellow-500 to-orange-500',
  'from-indigo-500 to-purple-500',
];
const getColor = (name) => avatarColors[(name?.charCodeAt(0) || 0) % avatarColors.length];
const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : '?');
const formatTime = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

function ChatMessages({ messages, loading, user, bottomRef }) {
  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 animate-spin text-cyan-400" /></div>;
  if (!messages.length) return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <MessageSquare className="w-10 h-10 text-white/15 mb-3" />
      <p className="text-white/40 text-sm font-medium">No messages yet</p>
      <p className="text-white/20 text-xs mt-1">Be the first to say something!</p>
    </div>
  );
  return (
    <>
      {messages.map((msg, i) => {
        const isMe = msg.created_by === user?.email;
        const authorName = msg.author_name || msg.created_by?.split('@')[0] || 'Player';
        return (
          <div key={msg.id || i} className={`flex items-start gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getColor(authorName)} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
              {getInitial(authorName)}
            </div>
            <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
              {!isMe && <span className="text-[10px] font-bold text-white/40 px-1">{authorName}</span>}
              <div className={`px-3 py-2 rounded-xl text-sm leading-relaxed ${isMe ? 'bg-cyan-500/20 border border-cyan-500/30 text-white rounded-tr-none' : 'bg-white/5 border border-white/10 text-white/80 rounded-tl-none'}`}>
                {msg.content}
              </div>
              <span className="text-[10px] text-white/20 px-1">{formatTime(msg.created_date)}</span>
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </>
  );
}

export default function GameChatTab({ game }) {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('game_chat');

  // ── Game Chat State ──────────────────────────────────────────
  const [gcMessages, setGcMessages] = useState([]);
  const [gcInput, setGcInput] = useState('');
  const [gcLoading, setGcLoading] = useState(true);
  const [gcSending, setGcSending] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const gcBottomRef = useRef(null);
  const channelKey = game?.title ? `game_chat_${game.title}` : null;

  // ── Clan Forums State ────────────────────────────────────────
  const [forumChannel, setForumChannel] = useState(1);
  const [forumMessages, setForumMessages] = useState([]);
  const [forumInput, setForumInput] = useState('');
  const [forumLoading, setForumLoading] = useState(false);
  const [forumSending, setForumSending] = useState(false);
  const [capacityError, setCapacityError] = useState(false);
  const forumBottomRef = useRef(null);

  const forumChannelKey = game?.title ? `clan_forums_${game.title}_ch${forumChannel}` : null;

  // ── Game Chat Logic ──────────────────────────────────────────
  useEffect(() => {
    if (!channelKey) return;
    setGcLoading(true);
    base44.entities.ChatMessage.filter({ channel_id: channelKey }, 'created_date', 50)
      .then(msgs => {
        setGcMessages(msgs || []);
        setOnlineCount(Math.max(1, Math.floor(Math.random() * 18) + 2));
      })
      .catch(() => setGcMessages([]))
      .finally(() => setGcLoading(false));

    const unsub = base44.entities.ChatMessage.subscribe((event) => {
      if (event.data?.channel_id !== channelKey) return;
      if (event.type === 'create') setGcMessages(prev => [...prev, event.data]);
      if (event.type === 'delete') setGcMessages(prev => prev.filter(m => m.id !== event.id));
    });
    return () => unsub();
  }, [channelKey]);

  useEffect(() => { gcBottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [gcMessages]);

  const handleGcSend = async () => {
    if (!gcInput.trim() || gcSending || !isAuthenticated) return;
    const text = gcInput.trim();
    setGcInput('');
    setSendingOptimistic(text, setGcMessages, user, channelKey);
    setGcSending(true);
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
      setGcSending(false);
    }
  };

  // ── Clan Forums Logic ────────────────────────────────────────
  useEffect(() => {
    if (!forumChannelKey) return;
    setForumLoading(true);
    setCapacityError(false);
    base44.entities.ChatMessage.filter({ channel_id: forumChannelKey }, 'created_date', 200)
      .then(async (msgs) => {
        setForumMessages(msgs || []);
        // Check capacity: count unique senders in the last 24 hours
        const cutoff = Date.now() - 24 * 60 * 60 * 1000;
        const recentSenders = new Set(
          (msgs || [])
            .filter(m => new Date(m.created_date).getTime() > cutoff)
            .map(m => m.sender_id)
        );
        const alreadyParticipating = recentSenders.has(user?.id) || recentSenders.has(user?.email);
        if (recentSenders.size >= CHANNEL_CAPACITY && !alreadyParticipating) {
          setCapacityError(true);
        }
      })
      .catch(() => setForumMessages([]))
      .finally(() => setForumLoading(false));

    const unsub = base44.entities.ChatMessage.subscribe((event) => {
      if (event.data?.channel_id !== forumChannelKey) return;
      if (event.type === 'create') setForumMessages(prev => [...prev, event.data]);
      if (event.type === 'delete') setForumMessages(prev => prev.filter(m => m.id !== event.id));
    });
    return () => unsub();
  }, [forumChannelKey, user?.id]);

  useEffect(() => { forumBottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [forumMessages]);

  const handleForumSend = async () => {
    if (!forumInput.trim() || forumSending || !isAuthenticated || capacityError) return;
    const text = forumInput.trim();
    setForumInput('');
    setSendingOptimistic(text, setForumMessages, user, forumChannelKey);
    setForumSending(true);
    try {
      await base44.entities.ChatMessage.create({
        channel_id: forumChannelKey,
        sender_id: user?.id || user?.email || 'anonymous',
        content: text,
        type: 'text',
        author_name: user?.full_name || user?.email?.split('@')[0] || 'Player',
      });
    } catch (e) {
      console.error('Failed to send forum message', e);
    } finally {
      setForumSending(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col h-[calc(100vh-26rem)] min-h-[400px]">
      {/* Tab switcher */}
      <div className="flex gap-1 mb-4 flex-shrink-0 bg-black/20 rounded-xl p-1">
        {[
          { id: 'game_chat', label: 'Game Chat' },
          { id: 'clan_forums', label: 'Clan Forums' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── GAME CHAT ── */}
      {activeTab === 'game_chat' && (
        <>
          <div className="flex items-center justify-between mb-3 flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-green-400 text-sm font-bold">Live</span>
              <div className="h-4 w-px bg-white/10" />
              <div className="flex items-center gap-1.5 text-white/40 text-sm">
                <Users className="w-4 h-4" />
                <span>{onlineCount} online in {game?.title}</span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto rounded-xl bg-black/30 border border-white/10 p-4 space-y-3" style={{ scrollbarWidth: 'none' }}>
            <ChatMessages messages={gcMessages} loading={gcLoading} user={user} bottomRef={gcBottomRef} />
          </div>

          <div className="mt-3 flex-shrink-0">
            {!isAuthenticated ? (
              <div className="w-full py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-white/30 text-sm text-center">Sign in to participate in the game chat</div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={gcInput}
                  onChange={e => setGcInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGcSend(); } }}
                  placeholder={`Chat in ${game?.title}...`}
                  maxLength={500}
                  className="flex-1 h-11 rounded-xl bg-black/40 border border-white/10 px-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all"
                />
                <button
                  onClick={handleGcSend}
                  disabled={!gcInput.trim() || gcSending}
                  className="h-11 w-11 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all flex-shrink-0"
                >
                  {gcSending ? <Loader2 className="w-4 h-4 text-black animate-spin" /> : <Send className="w-4 h-4 text-black" />}
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── CLAN FORUMS ── */}
      {activeTab === 'clan_forums' && (
        <div className="flex flex-1 gap-3 min-h-0">
          {/* Channel list */}
          <div className="w-36 flex-shrink-0 flex flex-col gap-1 bg-black/20 rounded-xl p-2 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider px-2 pb-1">Channels</p>
            {FORUM_CHANNELS.map(ch => (
              <button
                key={ch.id}
                onClick={() => setForumChannel(ch.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all text-left ${
                  forumChannel === ch.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold'
                    : 'text-white/50 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Hash className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{ch.name}</span>
              </button>
            ))}
          </div>

          {/* Forum chat */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Channel header */}
            <div className="flex items-center justify-between mb-2 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-white/40" />
                <span className="text-white/70 text-sm font-semibold">Channel {forumChannel}</span>
                <span className="text-[10px] text-white/30">· Max {CHANNEL_CAPACITY} members</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto rounded-xl bg-black/30 border border-white/10 p-4 space-y-3" style={{ scrollbarWidth: 'none' }}>
              <ChatMessages messages={forumMessages} loading={forumLoading} user={user} bottomRef={forumBottomRef} />
            </div>

            <div className="mt-3 flex-shrink-0">
              {!isAuthenticated ? (
                <div className="w-full py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-white/30 text-sm text-center">Sign in to participate in clan forums</div>
              ) : capacityError ? (
                <div className="flex items-center gap-2 w-full py-3 px-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  <Lock className="w-4 h-4 flex-shrink-0" />
                  <span>Channel {forumChannel} is full (100 members). Please join another channel.</span>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={forumInput}
                    onChange={e => setForumInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleForumSend(); } }}
                    placeholder={`Message Channel ${forumChannel}...`}
                    maxLength={500}
                    className="flex-1 h-11 rounded-xl bg-black/40 border border-white/10 px-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all"
                  />
                  <button
                    onClick={handleForumSend}
                    disabled={!forumInput.trim() || forumSending}
                    className="h-11 w-11 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all flex-shrink-0"
                  >
                    {forumSending ? <Loader2 className="w-4 h-4 text-black animate-spin" /> : <Send className="w-4 h-4 text-black" />}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// Optimistic local message add helper
function setSendingOptimistic(text, setMessages, user, channelKey) {
  const optimistic = {
    id: `opt_${Date.now()}`,
    channel_id: channelKey,
    sender_id: user?.id || user?.email || 'anonymous',
    content: text,
    type: 'text',
    author_name: user?.full_name || user?.email?.split('@')[0] || 'Player',
    created_by: user?.email,
    created_date: new Date().toISOString(),
  };
  setMessages(prev => [...prev, optimistic]);
}