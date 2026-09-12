import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search, Send, Phone, PhoneOff, Video, VideoOff, Mic, MicOff,
  MessageSquare, Users, Gamepad2, Check, Ban, X,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import useDirectWebRTCCall from '@/components/friends/useDirectWebRTCCall';

const CALL_REQUEST = '__ATOM_LUNA_CALL_REQUEST__';
const CALL_RESPONSE = '__ATOM_LUNA_CALL_RESPONSE__';
const CALL_END = '__ATOM_LUNA_CALL_END__';

const friendIdOf = (friend) => friend?.friend_id || friend?.player_id || friend?.id || null;
const friendNameOf = (friend) => friend?.friend_name || friend?.display_name || friend?.name || 'Friend';
const friendAvatarOf = (friend) => friend?.friend_avatar || friend?.avatar_url || friend?.avatar || '';
const conversationIdFor = (a, b) => [String(a || ''), String(b || '')].sort().join('-');
const isSystemMessage = (content = '') =>
  content.startsWith(CALL_REQUEST) || content.startsWith(CALL_RESPONSE) || content.startsWith(CALL_END);

function decodeProtocol(content, prefix) {
  if (!content?.startsWith(prefix)) return null;
  try {
    return JSON.parse(content.slice(prefix.length));
  } catch {
    return null;
  }
}

function statusColor(status) {
  if (status === 'online') return 'bg-emerald-400';
  if (status === 'away' || status === 'idle') return 'bg-amber-400';
  if (status === 'busy' || status === 'dnd') return 'bg-rose-400';
  return 'bg-white/25';
}

function StreamMedia({ stream, video = false, muted = false, className = '' }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current && ref.current.srcObject !== stream) {
      ref.current.srcObject = stream || null;
    }
  }, [stream]);

  if (video) return <video ref={ref} autoPlay playsInline muted={muted} className={className} />;
  return <audio ref={ref} autoPlay muted={muted} />;
}

export default function LunaDashboardMessages({
  active,
  initialFriend = null,
  onActivate,
  onClose,
}) {
  const { user } = useAuth();
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(initialFriend);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
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

  const selectFriend = (friend) => {
    if (!friend) return;
    const wantedId = friendIdOf(friend);
    const dbFriend = friends.find((entry) => String(friendIdOf(entry)) === String(wantedId));
    setSelectedFriend(dbFriend || friend);
  };

  const loadFriends = async () => {
    if (!user?.id) return;
    try {
      const list = await base44.entities.Friend.filter({ user_id: user.id });
      const next = list || [];
      setFriends(next);
      setSelectedFriend((current) => {
        const wanted = friendIdOf(initialFriend || current);
        if (wanted) {
          return next.find((entry) => String(friendIdOf(entry)) === String(wanted)) || initialFriend || current;
        }
        return next[0] || null;
      });
    } catch (error) {
      console.error('[LunaDashboardMessages] Failed to load friends', error);
    }
  };

  const loadMessages = async (conversationId = selectedConversationId) => {
    if (!conversationId) {
      setMessages([]);
      return;
    }
    setLoading(true);
    try {
      const rows = await base44.entities.DirectMessage.filter({ conversation_id: conversationId });
      setMessages((rows || [])
        .filter((message) => !isSystemMessage(message.content || ''))
        .sort((a, b) => new Date(a.created_date || 0) - new Date(b.created_date || 0)));
    } catch (error) {
      console.error('[LunaDashboardMessages] Failed to load messages', error);
    } finally {
      setLoading(false);
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
    if (initialFriend) selectFriend(initialFriend);
  }, [initialFriend, friends]);

  useEffect(() => {
    if (!active || !selectedConversationId) return undefined;
    loadMessages(selectedConversationId);
    const timer = window.setInterval(() => loadMessages(selectedConversationId), 3000);
    return () => window.clearInterval(timer);
  }, [active, selectedConversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  useEffect(() => {
    if (!user?.id) return undefined;

    const handleMessage = (message) => {
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
        setSelectedFriend(friend);
        onActivate?.(friend);
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
        return;
      }

      if (!isSystemMessage(content) && message.conversation_id === selectedConversationId) {
        loadMessages(selectedConversationId);
      }
    };

    let unsubscribe = null;
    try {
      unsubscribe = base44.entities.DirectMessage.subscribe((event) => {
        if (event?.type === 'create' || event?.type === 'update') handleMessage(event.data);
      });
    } catch (error) {
      console.warn('[LunaDashboardMessages] Realtime DirectMessage subscribe unavailable', error);
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
        payload: {
          sender_id: user.id,
          receiver_id: selectedPeerId,
          conversation_id: selectedConversationId,
          content: text,
        },
      });
      await loadMessages(selectedConversationId);
    } catch (error) {
      console.error('[LunaDashboardMessages] Failed to send message', error);
      setDraft(text);
    }
  };

  const startCall = async (mode) => {
    if (!selectedFriend || !selectedPeerId || callSession) return;
    const callId = `${user.id}-${selectedPeerId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const roomId = `luna_direct_${callId}`;
    setCallSession({
      callId,
      roomId,
      mode,
      peerId: selectedPeerId,
      friend: selectedFriend,
      status: 'ringing',
    });
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
      console.error('[LunaDashboardMessages] Failed to place call', error);
      setCallSession(null);
    }
  };

  const acceptIncomingCall = async () => {
    if (!incomingCall) return;
    const incoming = incomingCall;
    setIncomingCall(null);
    setSelectedFriend(incoming.friend);
    setCallSession({
      callId: incoming.callId,
      roomId: incoming.roomId,
      mode: incoming.mode,
      peerId: incoming.peerId,
      friend: incoming.friend,
      status: 'active',
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
    const session = callSession;
    setCallSession(null);
    setMuted(false);
    setCameraOff(false);
    if (session?.friend) {
      try {
        await writeProtocol(session.friend, CALL_END, { callId: session.callId });
      } catch {}
    }
  };

  const filteredFriends = friends.filter((friend) => {
    const haystack = `${friendNameOf(friend)} ${friend.current_game || ''}`.toLowerCase();
    return haystack.includes(search.trim().toLowerCase());
  });

  const callFriend = callSession?.friend || incomingCall?.friend || selectedFriend;

  return (
    <div className={`${active ? 'flex' : 'hidden'} absolute inset-0 z-10 min-h-0 text-white`}>
      <aside className="w-[260px] flex-shrink-0 border-r border-white/10 flex flex-col px-5 py-4">
        <div className="flex items-center gap-3 pb-4 border-b border-white/10">
          <MessageSquare className="w-4 h-4 text-cyan-300" />
          <div>
            <div className="text-[8px] tracking-[0.32em] uppercase text-white/35">Luna</div>
            <div className="text-base font-semibold">Messages</div>
          </div>
        </div>

        <div className="py-3 border-b border-white/10">
          <div className="flex items-center gap-2 border-b border-white/15 pb-2">
            <Search className="w-3.5 h-3.5 text-white/30" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Find a friend"
              className="w-full bg-transparent outline-none text-xs text-white placeholder:text-white/25"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-2 pr-1 custom-scrollbar">
          {filteredFriends.map((friend) => {
            const id = friendIdOf(friend);
            const selected = String(id) === String(selectedPeerId);
            return (
              <button
                key={friend.id || id}
                onClick={() => setSelectedFriend(friend)}
                className={`w-full flex items-center gap-3 px-2 py-2.5 text-left border-l-2 transition ${selected ? 'border-cyan-300 bg-white/[0.05]' : 'border-transparent hover:bg-white/[0.03]'}`}
              >
                <div className="relative flex-shrink-0">
                  {friendAvatarOf(friend) ? (
                    <img src={friendAvatarOf(friend)} alt="" className="w-9 h-9 object-cover" />
                  ) : (
                    <div className="w-9 h-9 bg-white/10 flex items-center justify-center text-xs font-semibold">{friendNameOf(friend)[0]}</div>
                  )}
                  <span className={`absolute -right-1 -bottom-1 w-2.5 h-2.5 rounded-full border-2 border-[#0b111b] ${statusColor(friend.status)}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className={`text-xs truncate ${selected ? 'text-white' : 'text-white/70'}`}>{friendNameOf(friend)}</div>
                  <div className="text-[9px] text-white/30 truncate mt-0.5">{friend.current_game || friend.status || 'Offline'}</div>
                </div>
              </button>
            );
          })}
          {filteredFriends.length === 0 && (
            <div className="py-10 text-center text-white/25 text-xs">
              <Users className="w-6 h-6 mx-auto mb-2 opacity-50" />
              No friends found
            </div>
          )}
        </div>
      </aside>

      <section className="flex-1 min-w-0 min-h-0 flex flex-col px-6 py-4">
        <header className="h-14 flex items-center border-b border-white/10 flex-shrink-0">
          {selectedFriend ? (
            <>
              <div className="flex items-center gap-3 min-w-0">
                {friendAvatarOf(selectedFriend) ? (
                  <img src={friendAvatarOf(selectedFriend)} alt="" className="w-9 h-9 object-cover" />
                ) : (
                  <div className="w-9 h-9 bg-white/10 flex items-center justify-center text-xs">{friendNameOf(selectedFriend)[0]}</div>
                )}
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{friendNameOf(selectedFriend)}</div>
                  <div className="text-[9px] text-white/35 flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${statusColor(selectedFriend.status)}`} />
                    <span className="capitalize">{selectedFriend.status || 'offline'}</span>
                    {selectedFriend.current_game && <><span>•</span><Gamepad2 className="w-2.5 h-2.5" /><span className="truncate">{selectedFriend.current_game}</span></>}
                  </div>
                </div>
              </div>
              <div className="ml-auto flex items-center gap-1">
                <button onClick={() => startCall('voice')} disabled={!!callSession} title="Voice call" className="w-9 h-9 flex items-center justify-center text-white/50 hover:text-cyan-300 hover:bg-white/5 disabled:opacity-30">
                  <Phone className="w-4 h-4" />
                </button>
                <button onClick={() => startCall('video')} disabled={!!callSession} title="Video call" className="w-9 h-9 flex items-center justify-center text-white/50 hover:text-violet-300 hover:bg-white/5 disabled:opacity-30">
                  <Video className="w-4 h-4" />
                </button>
                <div className="w-px h-5 bg-white/10 mx-1.5" />
                <button onClick={onClose} title="Close messages" className="w-9 h-9 flex items-center justify-center text-white/40 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <>
              <span className="text-white/30 text-xs">Select a friend to start a conversation</span>
              <button onClick={onClose} className="ml-auto w-9 h-9 flex items-center justify-center text-white/40 hover:text-white"><X className="w-4 h-4" /></button>
            </>
          )}
        </header>

        <div className="relative flex-1 min-h-0">
          {callSession ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden">
              {callSession.status === 'active' && callSession.mode === 'video' && call.remoteStream ? (
                <StreamMedia stream={call.remoteStream} video className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute w-[420px] h-[420px] rounded-full bg-cyan-400/[0.035] blur-3xl" />
              )}

              <div className="relative z-10 flex flex-col items-center">
                {!(callSession.status === 'active' && callSession.mode === 'video' && call.remoteStream) && (
                  friendAvatarOf(callFriend) ? (
                    <img src={friendAvatarOf(callFriend)} alt="" className="w-24 h-24 object-cover rounded-full ring-1 ring-white/15" />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center text-3xl">{friendNameOf(callFriend)[0]}</div>
                  )
                )}
                <div className="text-lg font-semibold mt-4">{friendNameOf(callFriend)}</div>
                <div className="text-xs text-white/40 mt-1">
                  {callSession.status === 'ringing'
                    ? `Calling • ${callSession.mode === 'video' ? 'Video' : 'Voice'}`
                    : call.error
                      ? 'Camera or microphone unavailable'
                      : `${callSession.mode === 'video' ? 'Video' : 'Voice'} call • ${call.connectionState}`}
                </div>
              </div>

              {callSession.status === 'active' && callSession.mode === 'video' && call.localStream && (
                <StreamMedia stream={call.localStream} video muted className="absolute right-4 bottom-20 z-20 w-40 aspect-video object-cover border border-white/15 bg-black/50" />
              )}
              {callSession.status === 'active' && callSession.mode === 'voice' && call.remoteStream && <StreamMedia stream={call.remoteStream} />}

              <div className="absolute bottom-5 z-30 flex items-center gap-2.5">
                {callSession.status === 'active' && (
                  <>
                    <button onClick={() => setMuted((value) => !value)} className={`w-10 h-10 rounded-full flex items-center justify-center ${muted ? 'bg-rose-500 text-white' : 'bg-white/10 text-white hover:bg-white/15'}`}>
                      {muted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>
                    {callSession.mode === 'video' && (
                      <button onClick={() => setCameraOff((value) => !value)} className={`w-10 h-10 rounded-full flex items-center justify-center ${cameraOff ? 'bg-rose-500 text-white' : 'bg-white/10 text-white hover:bg-white/15'}`}>
                        {cameraOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                      </button>
                    )}
                  </>
                )}
                <button onClick={endCall} className="w-12 h-12 rounded-full bg-rose-500 hover:bg-rose-400 flex items-center justify-center">
                  <PhoneOff className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : selectedFriend ? (
            <div className="absolute inset-0 flex flex-col">
              <div className="flex-1 overflow-y-auto py-5 pr-2 custom-scrollbar">
                {loading && messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-white/25 text-xs">Loading conversation…</div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-white/25">
                    <MessageSquare className="w-8 h-8 mb-3 opacity-50" />
                    <div className="text-white/55 text-sm font-medium">Start a conversation with {friendNameOf(selectedFriend)}</div>
                    <div className="text-[10px] mt-1.5">Messages stay with this friend across sessions.</div>
                  </div>
                ) : (
                  <div className="max-w-3xl mx-auto space-y-3 px-4">
                    {messages.map((message) => {
                      const mine = String(message.sender_id) === String(user?.id);
                      return (
                        <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[70%] border-l-2 px-3 py-2 ${mine ? 'border-cyan-300 bg-cyan-300/[0.045]' : 'border-white/20 bg-white/[0.035]'}`}>
                            <div className="text-xs leading-5 text-white/90 whitespace-pre-wrap break-words">{message.content}</div>
                            <div className="text-[8px] text-white/25 mt-1">
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

              <div className="border-t border-white/10 pt-3">
                <div className="max-w-3xl mx-auto flex items-end gap-2 px-4">
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
                    placeholder={`Message ${friendNameOf(selectedFriend)}`}
                    className="flex-1 max-h-28 resize-none bg-transparent border-b border-white/20 focus:border-cyan-300/70 outline-none py-2.5 text-xs placeholder:text-white/20"
                  />
                  <button onClick={sendMessage} disabled={!draft.trim()} className="w-9 h-9 flex items-center justify-center text-cyan-300 hover:text-white disabled:text-white/15">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-white/25 text-xs">
              <div className="text-center"><Users className="w-9 h-9 mx-auto mb-3 opacity-40" />Choose a friend from the left</div>
            </div>
          )}
        </div>
      </section>

      {incomingCall && !callSession && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/45 backdrop-blur-md">
          <div className="w-full max-w-md border-y border-white/10 bg-black/20 py-7 px-8 text-center">
            {friendAvatarOf(incomingCall.friend) ? (
              <img src={friendAvatarOf(incomingCall.friend)} alt="" className="w-20 h-20 rounded-full object-cover ring-1 ring-white/15 mx-auto" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center text-2xl mx-auto">{friendNameOf(incomingCall.friend)[0]}</div>
            )}
            <div className="mt-4 text-base font-semibold">{friendNameOf(incomingCall.friend)}</div>
            <div className="mt-1 text-xs text-white/40">Incoming {incomingCall.mode === 'video' ? 'video' : 'voice'} call</div>
            <div className="mt-5 flex justify-center gap-4">
              <button onClick={rejectIncomingCall} className="w-12 h-12 rounded-full bg-rose-500/90 hover:bg-rose-400 flex items-center justify-center"><Ban className="w-5 h-5" /></button>
              <button onClick={acceptIncomingCall} className="w-12 h-12 rounded-full bg-emerald-500/90 hover:bg-emerald-400 flex items-center justify-center"><Check className="w-5 h-5" /></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
