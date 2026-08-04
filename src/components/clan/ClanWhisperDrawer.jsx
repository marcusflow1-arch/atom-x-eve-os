import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import { X, Send, Users, Heart } from 'lucide-react';
import { format } from 'date-fns';

const convoId = (a, b) => [a, b].sort().join('__');

export default function ClanWhisperDrawer({ clan, onClose }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('online'); // 'online' | 'friends'
  const [target, setTarget] = useState(null); // { id, name, avatar }
  const [message, setMessage] = useState('');
  const scrollRef = useRef(null);

  // Online people (real presence)
  const { data: playerStates } = useQuery({
    queryKey: ['whisper_online_players'],
    queryFn: () => base44.entities.PlayerState.list(),
    refetchInterval: 10000,
  });

  // Friends (real friendships)
  const { data: friends } = useQuery({
    queryKey: ['whisper_friends', user?.id],
    queryFn: () => base44.entities.Friend.filter({ user_id: user.id }),
    enabled: !!user?.id,
  });

  const now = Date.now();
  const onlinePeople = (Array.isArray(playerStates) ? playerStates : [])
    .filter((p) => p && p.player_id && p.player_id !== user?.id && (!p.last_update || now - p.last_update < 120000))
    .map((p) => ({ id: p.player_id, name: p.display_name || 'Player', avatar: p.avatar_url }));

  const friendPeople = (friends || []).map((f) => ({ id: f.friend_id, name: f.friend_name, avatar: f.friend_avatar }));
  const people = tab === 'friends' ? friendPeople : onlinePeople;

  // Whisper conversation (backed by DirectMessage)
  const conversationId = target && user ? convoId(user.id, target.id) : null;
  const { data: messages } = useQuery({
    queryKey: ['whisper_messages', conversationId],
    queryFn: async () => {
      const msgs = await base44.entities.DirectMessage.filter({ conversation_id: conversationId });
      return msgs.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    },
    enabled: !!conversationId,
    refetchInterval: 3000,
  });

  const sendWhisper = useMutation({
    mutationFn: (content) =>
      base44.entities.DirectMessage.create({
        sender_id: user.id,
        receiver_id: target.id,
        content,
        conversation_id: conversationId,
      }),
    onMutate: (content) => {
      queryClient.setQueryData(['whisper_messages', conversationId], (old = []) => [
        ...old,
        { id: `opt_${Date.now()}`, sender_id: user.id, receiver_id: target.id, content, created_date: new Date().toISOString() },
      ]);
      setMessage('');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['whisper_messages', conversationId] }),
  });

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (message.trim() && target) sendWhisper.mutate(message.trim());
  };

  return (
    <>
      {/* Click-catcher over the un-faded chat area (left side) */}
      <div className="absolute inset-y-0 left-0 right-[40%] z-40" onClick={onClose} />

      {/* Drawer — fades only the right 40% */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 26, stiffness: 220 }}
        className="absolute inset-y-0 right-0 w-[40%] z-50 flex border-l border-purple-400/25 shadow-[-20px_0_50px_rgba(0,0,0,0.6)]"
        style={{ background: 'rgba(8, 10, 18, 0.88)', backdropFilter: 'blur(24px) saturate(150%)', WebkitBackdropFilter: 'blur(24px) saturate(150%)' }}
      >
        {/* People pane */}
        <div className="w-[42%] flex-shrink-0 flex flex-col border-r border-white/10">
          <div className="px-3 py-3 border-b border-white/10 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-purple-300">Whisper</span>
            <button onClick={onClose} className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-colors">
              <X className="w-3 h-3" />
            </button>
          </div>
          {/* Sub-page tabs */}
          <div className="flex border-b border-white/10">
            {[
              { id: 'online', label: 'Online', icon: Users },
              { id: 'friends', label: 'Friends', icon: Heart },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                  tab === t.id ? 'text-purple-300 bg-purple-500/15 border-b-2 border-purple-400' : 'text-white/40 hover:text-white'
                }`}
              >
                <t.icon className="w-3 h-3" /> {t.label}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto py-1" style={{ scrollbarWidth: 'none' }}>
            {people.map((p) => (
              <button
                key={p.id}
                onClick={() => setTarget(p)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                  target?.id === p.id ? 'bg-purple-500/20' : 'hover:bg-white/5'
                }`}
              >
                <div className="w-7 h-7 rounded-full overflow-hidden bg-slate-700 flex-shrink-0 border border-white/10">
                  {p.avatar ? (
                    <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-white">{p.name?.[0]}</div>
                  )}
                </div>
                <span className="text-white/80 text-xs font-medium truncate">{p.name}</span>
              </button>
            ))}
            {people.length === 0 && (
              <p className="text-white/30 text-[11px] text-center py-6 px-3">
                {tab === 'friends' ? 'No friends yet' : 'No one is online right now'}
              </p>
            )}
          </div>
        </div>

        {/* Conversation pane */}
        <div className="flex-1 min-w-0 flex flex-col">
          {target ? (
            <>
              <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-700 border border-white/10">
                  {target.avatar ? (
                    <img src={target.avatar} alt={target.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[9px] font-bold text-white">{target.name?.[0]}</div>
                  )}
                </div>
                <span className="text-white text-xs font-bold truncate">{target.name}</span>
                <span className="text-purple-300/60 text-[9px] uppercase tracking-wider ml-auto">Private</span>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2" ref={scrollRef} style={{ scrollbarWidth: 'none' }}>
                {(messages || []).map((m) => {
                  const mine = m.sender_id === user?.id;
                  return (
                    <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                        mine ? 'bg-purple-500/30 text-purple-50 border border-purple-400/20' : 'bg-white/8 text-white/80 border border-white/10'
                      }`}>
                        <p className="whitespace-pre-wrap break-words">{m.content}</p>
                        <p className="text-[8px] opacity-40 mt-0.5 text-right">{format(new Date(m.created_date), 'h:mm a')}</p>
                      </div>
                    </div>
                  );
                })}
                {(messages || []).length === 0 && (
                  <p className="text-white/25 text-[11px] text-center pt-8">Start a private whisper with {target.name}</p>
                )}
              </div>
              <form onSubmit={handleSend} className="p-3 border-t border-white/10 flex items-center gap-2">
                <input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={`Whisper ${target.name}...`}
                  className="flex-1 bg-black/40 border border-white/10 focus:border-purple-400/40 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/25 outline-none transition-colors"
                />
                <button
                  type="submit"
                  disabled={!message.trim()}
                  className="w-8 h-8 rounded-xl bg-purple-500 hover:bg-purple-400 disabled:opacity-40 flex items-center justify-center text-white transition-colors flex-shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-white/30 p-6 text-center">
              <Users className="w-8 h-8 opacity-40" />
              <p className="text-xs">Pick someone from the list to whisper them privately</p>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}