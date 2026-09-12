import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X, Search, Send, Phone, PhoneOff, Video, VideoOff, Mic, MicOff,
  MessageSquare, Gamepad2, Users, Check, Ban,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import useDirectWebRTCCall from '@/components/friends/useDirectWebRTCCall';

const CALL_REQUEST = '__ATOM_LUNA_CALL_REQUEST__';
const CALL_RESPONSE = '__ATOM_LUNA_CALL_RESPONSE__';
const CALL_END = '__ATOM_LUNA_CALL_END__';
const isSystemMessage = (content = '') =>
  content.startsWith(CALL_REQUEST) || content.startsWith(CALL_RESPONSE) || content.startsWith(CALL_END);

const friendIdOf = (friend) => friend?.friend_id || friend?.player_id || friend?.id || null;
const conversationIdFor = (a, b) => [String(a || ''), String(b || '')].sort().join('-');
const statusColor = (status) => status === 'online'
  ? 'bg-emerald-400'
  : status === 'away' || status === 'idle'
    ? 'bg-amber-400'
    : status === 'busy' || status === 'dnd'
      ? 'bg-rose-400'
      : 'bg-white/25';

function decodeProtocol(content, prefix) {
  if (!content?.startsWith(prefix)) return null;
  try { return JSON.parse(content.slice(prefix.length)); } catch { return null; }
}

function MediaElement({ stream, video = false, muted = false, className = '' }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current && ref.current.srcObject !== stream) ref.current.srcObject = stream || null;
  }, [stream]);
  if (video) return <video ref={ref} autoPlay playsInline muted={muted} className={className} />;
  return <audio ref={ref} autoPlay muted={muted} />;
}

export default function LunaMessageCenter({
  open,
  initialFriend = null,
  onClose,
  onRequestOpen,
}) {
  const { user } = useAuth();
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(initialFriend);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [callSession, setCallSession] = useState(null);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const messagesEndRef = useRef(null);

  const selectedPeerId = friendIdOf(selectedFriend);
  const selectedConversationId = useMemo(
    () => user?.id && selectedPeerId ? conversationIdFor(user.id, selectedPeerId) : null,
    [user?.id, selectedPeerId],
  );

  const call = useDirectWebRTCCall({
    active: callSession?.status === 'active',
    roomId: callSession?.roomId,
    mode: callSession?.mode || 'voice',
    user,
    peerId: callSession?.peerId,
    muted,
    cameraOff,
  });

  const loadFriends = async () => {
    if (!user?.id) return;
    try {
      const list = await base44.entities.Friend.filter({ user_id: user.id });
      setFriends(list || []);
      setSelectedFriend((current) => {
        if (initialFriend) {
          const wanted = friendIdOf(initialFriend);
          return (list || []).find((friend) => String(friendIdOf(friend)) === String(wanted)) || initialFriend;
        }
        if (current) {
          const currentId = friendIdOf(current);
          return (list || []).find((friend) => String(friendIdOf(friend)) === String(currentId)) || current;
        }
        return list?.[0] || null;
      });
    } catch (error) {
      console.error('[LunaMessages] Failed to load friends', error);
    }
  };

  const loadMessages = async (conversationId = selectedConversationId) => {
    if (!conversationId) {
      setMessages([]);
      return;
    }
    setLoadingMessages(true);
    try {
      const rows = await base44.entities.DirectMessage.filter({ conversation_id: conversationId });
      const visible = (rows || [])
        .filter((message) => !isSystemMessage(message.content || ''))
        .sort((a, b) => new Date(a.created_date || 0) - new Date(b.created_date || 0));
      setMessages(visible);
    } catch (error) {
      console.error('[LunaMessages] Failed to load conversation', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    loadFriends();
    if (!user?.id) return undefined;
    let unsubscribe = null;
    try {
      unsubscribe = base44.entities.Friend.subscribe(() => loadFriends());
    } catch {}
    return () => unsubscribe?.();
  }, [user?.id]);

  useEffect(() => {
    if (!initialFriend) return;
    setSelectedFriend(initialFriend);
  }, [initialFriend]);

  useEffect(() => {
    if (!open || !selectedConversationId) return;
    loadMessages(selectedConversationId);
    const timer = window.setInterval(() => loadMessages(selectedConversationId), 3000);
    return () => window.clearInterval(timer);
  }, [open, selectedConversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!user?.id) return undefined;

    const handleProtocol = (message) => {
      if (!message || String(message.receiver_id) !== String(user.id)) return;
      const content = message.content || '';

      const request = decodeProtocol(content, CALL_REQUEST);
      if (request) {
        const friend = friends.find((entry) => String(friendIdOf(entry)) === String(message.sender_id)) || {
          id: message.sender_id,
          friend_id: message.sender_id,
          friend_name: request.callerName || 'Friend',
          friend_avatar: request.callerAvatar || '',
          status: 'online',
        };
        setIncomingCall({ ...request, friend, peerId: message.sender_id });
        onRequestOpen?.(friend);
        return;
      }

      const response = decodeProtocol(content, CALL_RESPONSE);
      if (response) {
        setCallSession((current) => {
          if (!current || current.callId !== response.callId) return current;
          if (!response.accepted) return null;
          return { ...current, status: 'active' };
        });
        return;
      }

      const ended = decodeProtocol(content, CALL_END);
      if (ended) {
        setCallSession((current) => current?.callId === ended.callId ? null : current);
        setIncomingCall((current) => current?.callId === ended.callId ? null : current);
      }

      if (!isSystemMessage(content) && selectedConversationId === message.conversation_id) {
        loadMessages(selectedConversationId);
      }
    };

    let unsubscribe = null;
    try {
      unsubscribe = base44.entities.DirectMessage.subscribe((event) => {
        if (event?.type === 'create' || event?.type === 'update') handleProtocol(event.data);
      });
    } catch (error) {
      console.warn('[LunaMessages] DirectMessage realtime unavailable; polling remains active', error);
    }
    return () => unsubscribe?.();
  }, [user?.id, friends, selectedConversationId]);

  const sendMessage = async () => {
    const text = draft.trim();
    if (!text || !user?.id || !selectedPeerId || !selectedConversationId) return;
    setDraft('');
    try {
      await base44.entities.DirectMessage.create({
        sender_id: user.id,
        receiver_id: selectedPeerId,
        conversation_id: selectedConversationId,
        content: text,
      });
      window.webrtcBroadcast?.({
        type: 'dm',
        payload: { sender_id: user.id, receiver_id: selectedPeerId, conversation_id: selectedConversationId, content: text },
      });
      await loadMessages(selectedConversationId);
    } catch (error) {
      console.error('[LunaMessages] Failed to send message', error);
      setDraft(text);
    }
  };

  const writeProtocol = async (friend, prefix, payload) => {
    const peerId = friendIdOf(friend);
    if (!user?.id || !peerId) return;
    return base44.entities.DirectMessage.create({
      sender_id: user.id,
      receiver_id: peerId,
      conversation_id: conversationIdFor(user.id, peerId),
      content: `${prefix}${JSON.stringify(payload)}`,
    });
  };

  const startCall = async (mode) => {
    if (!selectedFriend || !selectedPeerId || callSession) return;
    const callId = `${user.id}-${selectedPeerId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const roomId = `luna_direct_${callId}`;
    const session = {
      callId,
      roomId,
      mode,
      peerId: selectedPeerId,
      friend: selectedFriend,
      status: 'ringing',
      startedAt: Date.now(),
    };
    setCallSession(session);
    setMuted(false);
    setCameraOff(false);
    try {
      await writeProtocol(selectedFriend, CALL_REQUEST, {
        callId,
        roomId,
        mode,
        callerId: user.id,
        callerName: user.full_name || user.username || 'Friend',
        callerAvatar: user.avatar_url || '',
      });
    } catch (error) {
      console.error('[LunaMessages] Failed to place call', error);
      setCallSession(null);
    }
  };

  const acceptIncomingCall = async () => {
    if (!incomingCall) return;
    const incoming = incomingCall;
    setSelectedFriend(incoming.friend);
    setIncomingCall(null);
    setCallSession({
      callId: incoming.callId,
      roomId: incoming.roomId,
      mode: incoming.mode,
      peerId: incoming.peerId,
      friend: incoming.friend,
      status: 'active',
      startedAt: Date.now(),
    });
    setMuted(false);
    setCameraOff(false);
    await writeProtocol(incoming.friend, CALL_RESPONSE, { callId: incoming.callId, accepted: true });
  };

  const rejectIncomingCall = async () => {
    if (!incomingCall) return;
    const incoming = incomingCall;
    setIncomingCall(null);
    await writeProtocol(incoming.friend, CALL_RESPONSE, { callId: incoming.callId, accepted: false });
  };

  const endCall = async () => {
    const activeCall = callSession;
    setCallSession(null);
    setMuted(false);
    setCameraOff(false);
    if (activeCall?.friend) {
      try {
        await writeProtocol(activeCall.friend, CALL_END, { callId: activeCall.callId });
      } catch {}
    }
  };

  const closeCenter = () => {
    if (callSession) endCall();
    onClose?.();
  };

  const filteredFriends = friends.filter((friend) => {
    const value = `${friend.friend_name || ''} ${friend.current_game || ''}`.toLowerCase();
    return value.includes(search.trim().toLowerCase());
  });

  const callFriend = callSession?.friend || incomingCall?.friend || selectedFriend;
  const showSurface = open || !!incomingCall || !!callSession;

  return (
    <AnimatePresence>
      {showSurface && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[180] text-white"
          style={{
            background: 'rgba(3,7,12,0.66)',
            backdropFilter: 'blur(28px) saturate(125%)',
            WebkitBackdropFilter: 'blur(28px) saturate(125%)',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/30 pointer-events-none" />

          <div className="relative h-full w-full max-w-[1540px] mx-auto flex pt-16 pb-8 px-8">
            {/* Friend rail — intentionally square/borderless rather than a floating rounded card. */}
            <aside className="w-[310px] flex-shrink-0 flex flex-col border-r border-white/10 pr-5">
              <div className="h-16 flex items-center gap-3 border-b border-white/10">
                <MessageSquare className="w-5 h-5 text-cyan-300" />
                <div>
                  <div className="text-[10px] tracking-[0.32em] uppercase text-white/40">Luna</div>
                  <div className="text-lg font-semibold tracking-wide">Messages</div>
                </div>
              </div>

              <div className="py-4 border-b border-white/10">
                <div className="flex items-center gap-2 border-b border-white/15 pb-2">
                  <Search className="w-4 h-4 text-white/35" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Find a friend"
                    className="w-full bg-transparent outline-none text-sm text-white placeholder:text-white/30"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto py-3 pr-1 custom-scrollbar">
                {filteredFriends.map((friend) => {
                  const id = friendIdOf(friend);
                  const active = String(id) === String(selectedPeerId);
                  return (
                    <button
                      key={friend.id || id}
                      onClick={() => setSelectedFriend(friend)}
                      className={`w-full flex items-center gap-3 px-2 py-3 text-left border-l-2 transition-all ${active ? 'border-cyan-300 bg-white/[0.055]' : 'border-transparent hover:bg-white/[0.035]'}`}
                    >
                      <div className="relative flex-shrink-0">
                        {friend.friend_avatar ? (
                          <img src={friend.friend_avatar} alt="" className="w-11 h-11 object-cover" />
                        ) : (
                          <div className="w-11 h-11 bg-white/10 flex items-center justify-center font-semibold text-white/60">
                            {(friend.friend_name || '?').slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <span className={`absolute -right-1 -bottom-1 w-3 h-3 border-2 border-[#080d13] rounded-full ${statusColor(friend.status)}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className={`text-sm truncate ${active ? 'text-white' : 'text-white/75'}`}>{friend.friend_name || 'Friend'}</div>
                        <div className="text-[11px] text-white/35 truncate mt-0.5">
                          {friend.current_game || friend.status || 'Offline'}
                        </div>
                      </div>
                    </button>
                  );
                })}
                {filteredFriends.length === 0 && (
                  <div className="py-12 text-center text-white/30 text-sm">
                    <Users className="w-7 h-7 mx-auto mb-3 opacity-60" />
                    No friends found
                  </div>
                )}
              </div>
            </aside>

            <main className="flex-1 min-w-0 flex flex-col pl-7">
              <header className="h-16 flex items-center border-b border-white/10">
                {selectedFriend ? (
                  <>
                    <div className="flex items-center gap-3 min-w-0">
                      {selectedFriend.friend_avatar ? (
                        <img src={selectedFriend.friend_avatar} alt="" className="w-10 h-10 object-cover" />
                      ) : (
                        <div className="w-10 h-10 bg-white/10 flex items-center justify-center">{(selectedFriend.friend_name || '?')[0]}</div>
                      )}
                      <div className="min-w-0">
                        <div className="font-semibold truncate">{selectedFriend.friend_name}</div>
                        <div className="text-[11px] text-white/40 flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${statusColor(selectedFriend.status)}`} />
                          <span className="capitalize">{selectedFriend.status || 'offline'}</span>
                          {selectedFriend.current_game && <><span>•</span><Gamepad2 className="w-3 h-3" /><span className="truncate">{selectedFriend.current_game}</span></>}
                        </div>
                      </div>
                    </div>
                    <div className="ml-auto flex items-center gap-1">
                      <button
                        onClick={() => startCall('voice')}
                        disabled={!!callSession}
                        title="Voice call"
                        className="w-10 h-10 flex items-center justify-center text-white/55 hover:text-cyan-300 hover:bg-white/5 disabled:opacity-30 transition"
                      >
                        <Phone className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => startCall('video')}
                        disabled={!!callSession}
                        title="Video call"
                        className="w-10 h-10 flex items-center justify-center text-white/55 hover:text-violet-300 hover:bg-white/5 disabled:opacity-30 transition"
                      >
                        <Video className="w-5 h-5" />
                      </button>
                      <div className="w-px h-6 bg-white/10 mx-2" />
                      <button onClick={closeCenter} className="w-10 h-10 flex items-center justify-center text-white/45 hover:text-white transition" title="Close">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="text-white/35 text-sm">Select a friend to start a conversation</span>
                    <button onClick={closeCenter} className="ml-auto w-10 h-10 flex items-center justify-center text-white/45 hover:text-white"><X className="w-5 h-5" /></button>
                  </>
                )}
              </header>

              {/* Conversation / call occupies the center page itself, not a nested modal. */}
              <div className="relative flex-1 min-h-0">
                {callSession ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden">
                    {callSession.status === 'active' && callSession.mode === 'video' && call.remoteStream ? (
                      <MediaElement stream={call.remoteStream} video className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="absolute w-[480px] h-[480px] rounded-full bg-cyan-400/[0.035] blur-3xl" />
                      </div>
                    )}
                    <div className="relative z-10 flex flex-col items-center">
                      {!(callSession.status === 'active' && callSession.mode === 'video' && call.remoteStream) && (
                        callFriend?.friend_avatar ? (
                          <img src={callFriend.friend_avatar} alt="" className="w-32 h-32 object-cover rounded-full ring-1 ring-white/15" />
                        ) : (
                          <div className="w-32 h-32 rounded-full bg-white/10 flex items-center justify-center text-4xl">{(callFriend?.friend_name || '?')[0]}</div>
                        )
                      )}
                      <h2 className="text-2xl font-semibold mt-6">{callFriend?.friend_name || 'Friend'}</h2>
                      <div className="text-sm text-white/45 mt-2">
                        {callSession.status === 'ringing'
                          ? `Calling • ${callSession.mode === 'video' ? 'Video' : 'Voice'}`
                          : call.error
                            ? 'Camera or microphone unavailable'
                            : `${callSession.mode === 'video' ? 'Video' : 'Voice'} call • ${call.connectionState}`}
                      </div>
                    </div>

                    {callSession.status === 'active' && callSession.mode === 'video' && call.localStream && (
                      <MediaElement stream={call.localStream} video muted className="absolute right-5 bottom-24 z-20 w-52 aspect-video object-cover border border-white/15 bg-black/50" />
                    )}
                    {callSession.status === 'active' && callSession.mode === 'voice' && call.remoteStream && <MediaElement stream={call.remoteStream} />}

                    <div className="absolute bottom-8 z-30 flex items-center gap-3">
                      {callSession.status === 'active' && (
                        <>
                          <button onClick={() => setMuted((value) => !value)} className={`w-12 h-12 rounded-full flex items-center justify-center ${muted ? 'bg-rose-500 text-white' : 'bg-white/10 text-white hover:bg-white/15'}`}>
                            {muted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                          </button>
                          {callSession.mode === 'video' && (
                            <button onClick={() => setCameraOff((value) => !value)} className={`w-12 h-12 rounded-full flex items-center justify-center ${cameraOff ? 'bg-rose-500 text-white' : 'bg-white/10 text-white hover:bg-white/15'}`}>
                              {cameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                            </button>
                          )}
                        </>
                      )}
                      <button onClick={endCall} className="w-14 h-14 rounded-full bg-rose-500 hover:bg-rose-400 flex items-center justify-center shadow-[0_0_30px_rgba(244,63,94,0.25)]">
                        <PhoneOff className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                ) : selectedFriend ? (
                  <div className="absolute inset-0 flex flex-col">
                    <div className="flex-1 overflow-y-auto py-7 pr-3 custom-scrollbar">
                      {loadingMessages && messages.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-white/25 text-sm">Loading conversation…</div>
                      ) : messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center text-white/30">
                          <MessageSquare className="w-10 h-10 mb-4 opacity-50" />
                          <div className="text-white/60 font-medium">Start a conversation with {selectedFriend.friend_name}</div>
                          <div className="text-xs mt-2">Messages will appear here across sessions.</div>
                        </div>
                      ) : (
                        <div className="max-w-4xl mx-auto space-y-4 px-4">
                          {messages.map((message) => {
                            const mine = String(message.sender_id) === String(user?.id);
                            return (
                              <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[68%] border-l-2 px-4 py-2 ${mine ? 'border-cyan-300 bg-cyan-300/[0.045]' : 'border-white/20 bg-white/[0.035]'}`}>
                                  <div className="text-sm leading-6 text-white/90 whitespace-pre-wrap break-words">{message.content}</div>
                                  <div className="text-[10px] text-white/25 mt-1.5">
                                    {message.created_date ? new Date(message.created_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          <div ref={messagesEndRef} />
                        </div>
                      )}
                    </div>

                    <div className="border-t border-white/10 py-4">
                      <div className="max-w-4xl mx-auto flex items-end gap-3 px-4">
                        <textarea
                          rows={1}
                          value={draft}
                          onChange={(event) => setDraft(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' && !event.shiftKey) {
                              event.preventDefault();
                              sendMessage();
                            }
                          }}
                          placeholder={`Message ${selectedFriend.friend_name}`}
                          className="flex-1 max-h-32 resize-none bg-transparent border-b border-white/20 focus:border-cyan-300/70 outline-none py-3 text-sm placeholder:text-white/25"
                        />
                        <button onClick={sendMessage} disabled={!draft.trim()} className="w-11 h-11 flex items-center justify-center text-cyan-300 hover:text-white disabled:text-white/15 transition">
                          <Send className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-white/25">
                    <div className="text-center"><Users className="w-12 h-12 mx-auto mb-4 opacity-40" /><div>Choose a friend from the left</div></div>
                  </div>
                )}
              </div>
            </main>
          </div>

          {/* Incoming call appears on the same blurred page, never inside a rounded dialog. */}
          {incomingCall && !callSession && (
            <div className="absolute inset-0 z-[210] flex items-center justify-center bg-black/45 backdrop-blur-md">
              <div className="flex flex-col items-center text-center px-10 py-8 border-y border-white/10 w-full max-w-lg bg-black/20">
                {incomingCall.friend?.friend_avatar ? (
                  <img src={incomingCall.friend.friend_avatar} alt="" className="w-24 h-24 rounded-full object-cover ring-1 ring-white/15" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center text-3xl">{(incomingCall.friend?.friend_name || '?')[0]}</div>
                )}
                <div className="mt-5 text-xl font-semibold">{incomingCall.friend?.friend_name || 'Friend'}</div>
                <div className="mt-2 text-sm text-white/45">Incoming {incomingCall.mode === 'video' ? 'video' : 'voice'} call</div>
                <div className="mt-7 flex gap-5">
                  <button onClick={rejectIncomingCall} className="w-14 h-14 rounded-full bg-rose-500/90 hover:bg-rose-400 flex items-center justify-center"><Ban className="w-6 h-6" /></button>
                  <button onClick={acceptIncomingCall} className="w-14 h-14 rounded-full bg-emerald-500/90 hover:bg-emerald-400 flex items-center justify-center"><Check className="w-6 h-6" /></button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
