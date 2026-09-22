import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Camera, FileText, Image as ImageIcon, Mic, MicOff, MoreHorizontal, Paperclip,
  Phone, PhoneOff, Search, Send, Smile, UserRound, Video, X
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';

const unwrap = (response) => {
  const body = response?.data ?? response;
  if (body?.error) throw new Error(body.error);
  return body || {};
};

const callChannel = (conversationId) => `dmcall_${conversationId}_${Date.now()}`;
const conversationIdFor = (a, b) => [String(a), String(b)].sort().join('::');

export default function MessengerHub() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [manualTargets, setManualTargets] = useState({});
  const [selectedId, setSelectedId] = useState('');
  const [messages, setMessages] = useState([]);
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [call, setCall] = useState(null);
  const [incomingOffer, setIncomingOffer] = useState(null);
  const [muted, setMuted] = useState(false);
  const feedRef = useRef(null);
  const fileInputRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const seenSignalsRef = useRef(new Set());
  const pendingIceRef = useRef([]);

  const social = useCallback(async (action, data = {}) => unwrap(await base44.functions.invoke('socialActions', { action, data })), []);

  const mergedConversations = useMemo(() => {
    const byId = new Map(conversations.map((item) => [String(item.partner_id), item]));
    Object.values(manualTargets).forEach((target) => {
      if (!byId.has(String(target.partner_id))) byId.set(String(target.partner_id), target);
    });
    return [...byId.values()].sort((a, b) => new Date(b.last_message_at || 0) - new Date(a.last_message_at || 0));
  }, [conversations, manualTargets]);

  const selected = useMemo(() => mergedConversations.find((item) => String(item.partner_id) === String(selectedId)) || null, [mergedConversations, selectedId]);

  const refreshInbox = useCallback(async () => {
    if (!user?.id) return;
    try {
      const body = await social('get_inbox');
      setConversations(body.conversations || []);
      setError('');
      if (!selectedId && body.conversations?.length) setSelectedId(String(body.conversations[0].partner_id));
      return true;
    } catch (e) {
      console.error('[MessengerHub] inbox', e);
      setError(e.message || 'Messages could not load.');
      return false;
    }
  }, [social, user?.id, selectedId]);

  const refreshThread = useCallback(async (targetId = selectedId) => {
    if (!user?.id || !targetId) return;
    try {
      const body = await social('get_thread', { target_user_id: targetId });
      setMessages((body.messages || []).slice().sort((a, b) => new Date(a.created_date || 0) - new Date(b.created_date || 0)));
      await social('mark_thread_read', { target_user_id: targetId });
      setError('');
      return true;
    } catch (e) {
      console.error('[MessengerHub] thread', e);
      setError(e.message || 'Conversation could not load.');
      return false;
    }
  }, [social, user?.id, selectedId]);

  useEffect(() => {
    let cancelled = false;
    let timer;
    const poll = async () => {
      const succeeded = await refreshInbox();
      if (!cancelled) timer = window.setTimeout(poll, succeeded ? 30000 : 120000);
    };
    poll();
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [refreshInbox]);

  useEffect(() => {
    if (!selectedId) { setMessages([]); return undefined; }
    let cancelled = false;
    let timer;
    const poll = async () => {
      const succeeded = await refreshThread(selectedId);
      if (!cancelled) timer = window.setTimeout(poll, succeeded ? 30000 : 120000);
    };
    poll();
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [selectedId, refreshThread]);

  useEffect(() => {
    const openTarget = (event) => {
      const target = event?.detail?.target || event?.detail || window.__lunaPendingMessageTarget || {};
      const id = target.friend_id || target.player_id || target.id || target.partner_id;
      if (!id) return;
      setManualTargets((previous) => ({
        ...previous,
        [String(id)]: {
          conversation_id: conversationIdFor(user?.id || 'me', id),
          partner_id: String(id),
          partner_name: target.friend_name || target.name || target.display_name || 'Player',
          partner_avatar: target.friend_avatar || target.avatar || target.avatar_url || '',
          is_friend: Boolean(target.is_friend),
          unread_count: 0,
          last_message: '',
          last_message_at: new Date().toISOString(),
        },
      }));
      setSelectedId(String(id));
      if (window.__lunaPendingMessageTarget && String(id) === String(window.__lunaPendingMessageTarget.friend_id || window.__lunaPendingMessageTarget.id)) window.__lunaPendingMessageTarget = null;
    };
    openTarget(null);
    window.addEventListener('openLunaMessages', openTarget);
    return () => window.removeEventListener('openLunaMessages', openTarget);
  }, [user?.id]);

  useEffect(() => {
    const feed = feedRef.current;
    if (feed) feed.scrollTop = feed.scrollHeight;
  }, [messages.length, selectedId]);

  const send = async ({ content = draft, messageType = 'text', mediaUrl = '', mediaName = '', mediaMime = '' } = {}) => {
    if (!selectedId || sending || (!String(content || '').trim() && !mediaUrl)) return;
    setSending(true);
    try {
      await social('send_message', {
        target_user_id: selectedId,
        content: String(content || ''),
        message_type: messageType,
        media_url: mediaUrl,
        media_name: mediaName,
        media_mime: mediaMime,
      });
      setDraft('');
      await Promise.all([refreshThread(selectedId), refreshInbox()]);
    } catch (e) {
      setError(e.message || 'Message could not send.');
    } finally {
      setSending(false);
    }
  };

  const uploadAndSend = async (file, forcedType) => {
    if (!file || !selectedId) return;
    setSending(true);
    try {
      const uploaded = await base44.integrations.Core.UploadFile({ file });
      const url = uploaded?.file_url;
      if (!url) throw new Error('Upload did not return a file URL.');
      const type = forcedType || (file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'file');
      await social('send_message', {
        target_user_id: selectedId,
        content: '',
        message_type: type,
        media_url: url,
        media_name: file.name || (type === 'screenshot' ? 'Screenshot.png' : 'Attachment'),
        media_mime: file.type || 'application/octet-stream',
      });
      await Promise.all([refreshThread(selectedId), refreshInbox()]);
    } catch (e) {
      console.error('[MessengerHub] upload', e);
      setError(e.message || 'Attachment could not send.');
    } finally {
      setSending(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const captureScreenshot = async () => {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      setError('Screen capture is not supported by this browser.');
      return;
    }
    let stream;
    try {
      stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      const video = document.createElement('video');
      video.srcObject = stream;
      video.muted = true;
      await video.play();
      await new Promise((resolve) => {
        if (video.videoWidth) resolve();
        else video.onloadedmetadata = () => resolve();
      });
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png', .94));
      if (!blob) throw new Error('Could not capture screenshot.');
      await uploadAndSend(new File([blob], `Luna-Screenshot-${Date.now()}.png`, { type: 'image/png' }), 'screenshot');
    } catch (e) {
      if (e?.name !== 'NotAllowedError') setError(e.message || 'Screenshot capture failed.');
    } finally {
      stream?.getTracks?.().forEach((track) => track.stop());
    }
  };

  const signal = useCallback(async (type, payload, targetId, channelId) => {
    if (!user?.id || !targetId || !channelId) return;
    await base44.entities.VoiceSignal.create({ channel_id: channelId, sender_id: user.id, target_id: targetId, type, payload: payload || {} });
  }, [user?.id]);

  const attachStreams = useCallback(() => {
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = remoteStreamRef.current;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStreamRef.current;
    if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
  }, []);

  const disposePeer = useCallback(() => {
    try { pcRef.current?.close?.(); } catch {}
    pcRef.current = null;
    localStreamRef.current?.getTracks?.().forEach((track) => track.stop());
    localStreamRef.current = null;
    remoteStreamRef.current = null;
    pendingIceRef.current = [];
    setMuted(false);
    setTimeout(attachStreams, 0);
  }, [attachStreams]);

  const buildPeer = useCallback((targetId, channelId) => {
    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    pcRef.current = pc;
    localStreamRef.current?.getTracks?.().forEach((track) => pc.addTrack(track, localStreamRef.current));
    pc.onicecandidate = (event) => {
      if (event.candidate) signal('ice', { candidate: event.candidate.toJSON?.() || event.candidate }, targetId, channelId).catch(() => {});
    };
    pc.ontrack = (event) => {
      remoteStreamRef.current = event.streams?.[0] || new MediaStream([event.track]);
      attachStreams();
    };
    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      if (state === 'connected') setCall((current) => current ? { ...current, state: 'connected' } : current);
      if (state === 'failed' || state === 'disconnected') setCall((current) => current ? { ...current, state } : current);
    };
    return pc;
  }, [attachStreams, signal]);

  const mediaForCall = async (mode) => navigator.mediaDevices.getUserMedia({ audio: true, video: mode === 'video' });

  const startCall = async (mode) => {
    if (!selected || !navigator.mediaDevices?.getUserMedia || typeof RTCPeerConnection === 'undefined') {
      setError('Voice/video calling is not available in this browser.');
      return;
    }
    try {
      disposePeer();
      const channelId = callChannel(selected.conversation_id || conversationIdFor(user.id, selected.partner_id));
      localStreamRef.current = await mediaForCall(mode);
      const pc = buildPeer(selected.partner_id, channelId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      setCall({ channelId, targetId: selected.partner_id, name: selected.partner_name, avatar: selected.partner_avatar, mode, state: 'calling', direction: 'outgoing' });
      attachStreams();
      await signal('offer', { sdp: pc.localDescription, mode, sender_name: user.full_name || user.username || 'Player', sender_avatar: user.avatar_url || '' }, selected.partner_id, channelId);
    } catch (e) {
      disposePeer();
      setCall(null);
      setError(e.message || 'Call could not start.');
    }
  };

  const flushIce = async () => {
    const pc = pcRef.current;
    if (!pc?.remoteDescription) return;
    const queued = pendingIceRef.current.splice(0);
    for (const candidate of queued) {
      try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch {}
    }
  };

  const acceptIncoming = async () => {
    const offerSignal = incomingOffer;
    if (!offerSignal) return;
    const mode = offerSignal.payload?.mode === 'video' ? 'video' : 'voice';
    try {
      disposePeer();
      localStreamRef.current = await mediaForCall(mode);
      const pc = buildPeer(offerSignal.sender_id, offerSignal.channel_id);
      await pc.setRemoteDescription(new RTCSessionDescription(offerSignal.payload?.sdp));
      await flushIce();
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      setCall({ channelId: offerSignal.channel_id, targetId: offerSignal.sender_id, name: offerSignal.payload?.sender_name || 'Player', avatar: offerSignal.payload?.sender_avatar || '', mode, state: 'connecting', direction: 'incoming' });
      setIncomingOffer(null);
      attachStreams();
      await signal('answer', { sdp: pc.localDescription }, offerSignal.sender_id, offerSignal.channel_id);
    } catch (e) {
      disposePeer();
      setCall(null);
      setError(e.message || 'Could not answer call.');
    }
  };

  const declineIncoming = async () => {
    if (incomingOffer) await signal('decline', {}, incomingOffer.sender_id, incomingOffer.channel_id).catch(() => {});
    setIncomingOffer(null);
  };

  const endCall = useCallback(async (notify = true) => {
    const current = call;
    if (notify && current?.targetId && current?.channelId) await signal('hangup', {}, current.targetId, current.channelId).catch(() => {});
    disposePeer();
    setCall(null);
  }, [call, disposePeer, signal]);

  useEffect(() => {
    if (!user?.id) return undefined;
    let cancelled = false;
    const poll = async () => {
      try {
        const signals = await base44.entities.VoiceSignal.filter({ target_id: user.id }, '-created_date', 80);
        for (const item of (signals || []).slice().reverse()) {
          if (!item?.id || seenSignalsRef.current.has(item.id)) continue;
          seenSignalsRef.current.add(item.id);
          if (seenSignalsRef.current.size > 600) seenSignalsRef.current = new Set([...seenSignalsRef.current].slice(-300));
          const age = Date.now() - new Date(item.created_date || 0).getTime();
          if (age > 5 * 60 * 1000) continue;
          if (item.type === 'offer') {
            if (!pcRef.current && !call) setIncomingOffer(item);
          } else if (item.type === 'answer' && pcRef.current && call?.channelId === item.channel_id) {
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(item.payload?.sdp));
            await flushIce();
          } else if (item.type === 'ice' && item.payload?.candidate) {
            if (pcRef.current?.remoteDescription) {
              try { await pcRef.current.addIceCandidate(new RTCIceCandidate(item.payload.candidate)); } catch {}
            } else pendingIceRef.current.push(item.payload.candidate);
          } else if (item.type === 'decline' && call?.channelId === item.channel_id) {
            disposePeer(); setCall(null); setError('Call declined.');
          } else if (item.type === 'hangup' && call?.channelId === item.channel_id) {
            disposePeer(); setCall(null);
          }
        }
      } catch (e) {
        if (!cancelled) console.warn('[MessengerHub] call signaling', e);
      }
    };
    poll();
    const timer = window.setInterval(poll, 1000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [user?.id, call, disposePeer]);

  useEffect(() => () => { disposePeer(); }, [disposePeer]);
  useEffect(() => { attachStreams(); }, [call, attachStreams]);

  const toggleMute = () => {
    const next = !muted;
    localStreamRef.current?.getAudioTracks?.().forEach((track) => { track.enabled = !next; });
    setMuted(next);
  };

  const filtered = mergedConversations.filter((item) => `${item.partner_name} ${item.last_message}`.toLowerCase().includes(search.toLowerCase()));
  const sharedMedia = messages.filter((message) => message.media_url).slice().reverse().slice(0, 12);

  return (
    <div className="relative flex h-full w-full overflow-hidden text-white">
      <aside className="w-[292px] shrink-0 border-r border-white/[0.08] bg-slate-950/25 backdrop-blur-2xl">
        <div className="px-4 pb-3 pt-4">
          <div className="flex items-center justify-between"><div><p className="text-[9px] font-black uppercase tracking-[.22em] text-cyan-200/45">Luna Social</p><h2 className="text-xl font-semibold">Messages</h2></div><button className="grid h-9 w-9 place-items-center rounded-full bg-white/[0.06] text-white/55"><MoreHorizontal className="h-4 w-4" /></button></div>
          <label className="mt-4 flex h-10 items-center gap-2 rounded-xl border border-white/[0.08] bg-black/20 px-3 focus-within:border-cyan-300/25"><Search className="h-4 w-4 text-white/30" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search messages" className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-white/25" /></label>
        </div>
        <div className="h-[calc(100%-104px)] overflow-y-auto px-2 pb-3 [scrollbar-width:thin]">
          {filtered.length ? filtered.map((thread) => (
            <button key={thread.partner_id} onClick={() => setSelectedId(String(thread.partner_id))} className={`mb-1 flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition ${String(selectedId) === String(thread.partner_id) ? 'bg-cyan-300/[0.10] shadow-[inset_0_0_0_1px_rgba(103,232,249,.14)]' : 'hover:bg-white/[0.05]'}`}>
              <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-white/10">{thread.partner_avatar ? <img src={thread.partner_avatar} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center"><UserRound className="h-5 w-5 text-white/35" /></div>}{thread.unread_count > 0 && <span className="absolute right-0 top-0 grid min-h-4 min-w-4 place-items-center rounded-full bg-cyan-300 px-1 text-[8px] font-black text-slate-950">{thread.unread_count}</span>}</div>
              <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className={`truncate text-[12px] ${thread.unread_count ? 'font-bold text-white' : 'font-semibold text-white/80'}`}>{thread.partner_name}</p>{thread.is_friend && <span className="rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[6px] uppercase tracking-wider text-white/35">Friend</span>}</div><p className={`mt-0.5 truncate text-[10px] ${thread.unread_count ? 'text-cyan-100/65' : 'text-white/30'}`}>{thread.last_message || 'Start a conversation'}</p></div>
            </button>
          )) : <div className="px-4 py-12 text-center text-xs text-white/30">No conversations yet.</div>}
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,.055),transparent_35%)]">
        {selected ? <>
          <header className="flex h-[68px] shrink-0 items-center gap-3 border-b border-white/[0.08] px-5 backdrop-blur-xl">
            <div className="h-10 w-10 overflow-hidden rounded-full bg-white/10">{selected.partner_avatar ? <img src={selected.partner_avatar} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center"><UserRound className="h-5 w-5 text-white/35" /></div>}</div>
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{selected.partner_name}</p><p className="text-[9px] text-white/35">{selected.is_friend ? 'Friend' : 'Message request'} · Luna Messenger</p></div>
            <button onClick={() => startCall('voice')} title="Voice call" className="grid h-9 w-9 place-items-center rounded-full bg-white/[0.06] text-cyan-100/75 hover:bg-white/[0.11]"><Phone className="h-4 w-4" /></button>
            <button onClick={() => startCall('video')} title="Video call" className="grid h-9 w-9 place-items-center rounded-full bg-white/[0.06] text-cyan-100/75 hover:bg-white/[0.11]"><Video className="h-4 w-4" /></button>
          </header>

          <div ref={feedRef} className="flex-1 overflow-y-auto px-6 py-5 [scrollbar-width:thin]">
            <div className="flex min-h-full flex-col justify-end gap-2.5">
              {!messages.length && <div className="my-auto text-center"><div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-white/10 bg-white/[0.04]"><UserRound className="h-7 w-7 text-white/25" /></div><p className="mt-3 text-sm font-semibold text-white/70">{selected.partner_name}</p><p className="mt-1 text-xs text-white/30">Send a message, photo, screenshot, or start a call.</p></div>}
              {messages.map((message) => {
                const mine = String(message.sender_id) === String(user?.id);
                return <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[72%] overflow-hidden text-[13px] leading-relaxed ${mine ? 'rounded-[19px_19px_5px_19px] bg-cyan-500/75 text-white shadow-[0_10px_35px_rgba(34,211,238,.08)]' : 'rounded-[19px_19px_19px_5px] border border-white/[0.08] bg-white/[0.07] text-white/90 backdrop-blur-2xl'}`}>
                  {message.media_url && message.message_type !== 'video' && <a href={message.media_url} target="_blank" rel="noreferrer"><img src={message.media_url} alt={message.media_name || 'Shared image'} className="max-h-[340px] w-full object-contain" /></a>}
                  {message.media_url && message.message_type === 'video' && <video src={message.media_url} controls className="max-h-[340px] w-full" />}
                  {message.content && <p className="px-3.5 py-2.5">{message.content}</p>}
                  {message.media_name && <p className="px-3 pb-2 text-[9px] text-white/45">{message.message_type === 'screenshot' ? 'Screenshot · ' : ''}{message.media_name}</p>}
                </div></div>;
              })}
            </div>
          </div>

          <div className="shrink-0 border-t border-white/[0.08] px-4 py-3 backdrop-blur-2xl">
            {error && <p className="mb-2 rounded-lg bg-rose-400/10 px-3 py-2 text-[10px] text-rose-200">{error}</p>}
            <div className="flex items-end gap-2">
              <button onClick={() => fileInputRef.current?.click()} title="Send picture or file" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/[0.06] text-white/55 hover:bg-white/[0.1]"><Paperclip className="h-4 w-4" /></button>
              <input ref={fileInputRef} type="file" className="hidden" accept="image/*,video/*,.pdf,.txt,.zip" onChange={(e) => uploadAndSend(e.target.files?.[0])} />
              <button onClick={captureScreenshot} title="Capture screenshot" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/[0.06] text-white/55 hover:bg-white/[0.1]"><Camera className="h-4 w-4" /></button>
              <div className="flex min-h-10 min-w-0 flex-1 items-center rounded-2xl border border-white/[0.09] bg-black/20 px-3 focus-within:border-cyan-300/25"><input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder={`Message ${selected.partner_name}`} className="min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none placeholder:text-white/25" /><Smile className="h-4 w-4 text-white/25" /></div>
              <button onClick={() => send()} disabled={sending || !draft.trim()} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cyan-400 text-slate-950 disabled:opacity-30"><Send className="h-4 w-4" /></button>
            </div>
          </div>
        </> : <div className="grid h-full place-items-center text-center"><div><div className="mx-auto grid h-20 w-20 place-items-center rounded-full border border-white/10 bg-white/[0.04]"><Send className="h-8 w-8 text-cyan-200/25" /></div><p className="mt-4 text-base font-semibold text-white/65">Your messages</p><p className="mt-1 text-xs text-white/30">Choose a conversation from the left.</p></div></div>}
      </main>

      {selected && <aside className="hidden w-[230px] shrink-0 border-l border-white/[0.08] bg-slate-950/20 p-4 xl:block"><div className="flex flex-col items-center pt-3"><div className="h-20 w-20 overflow-hidden rounded-full bg-white/10">{selected.partner_avatar ? <img src={selected.partner_avatar} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center"><UserRound className="h-8 w-8 text-white/30" /></div>}</div><p className="mt-3 max-w-full truncate text-sm font-semibold">{selected.partner_name}</p><p className="mt-1 text-[9px] uppercase tracking-[.16em] text-white/30">{selected.is_friend ? 'Friend' : 'Not a friend'}</p></div><div className="mt-6 border-t border-white/[0.08] pt-4"><p className="text-[8px] font-black uppercase tracking-[.18em] text-white/35">Shared media</p><div className="mt-3 grid grid-cols-3 gap-1.5">{sharedMedia.map((item) => <a key={item.id} href={item.media_url} target="_blank" rel="noreferrer" className="aspect-square overflow-hidden rounded-lg border border-white/[0.06] bg-white/[0.04]">{item.message_type === 'video' ? <div className="grid h-full place-items-center"><Video className="h-4 w-4 text-white/40" /></div> : item.message_type === 'file' ? <div className="grid h-full place-items-center"><FileText className="h-4 w-4 text-white/40" /></div> : <img src={item.media_url} alt="" className="h-full w-full object-cover" />}</a>)}</div>{!sharedMedia.length && <p className="mt-3 text-[10px] text-white/25">No shared media yet.</p>}</div></aside>}

      <audio ref={remoteAudioRef} autoPlay />

      {incomingOffer && !call && <div className="absolute inset-0 z-50 grid place-items-center bg-slate-950/70 backdrop-blur-xl"><div className="w-[320px] rounded-[26px] border border-white/12 bg-slate-900/80 p-6 text-center shadow-2xl"><div className="mx-auto h-20 w-20 overflow-hidden rounded-full bg-white/10">{incomingOffer.payload?.sender_avatar ? <img src={incomingOffer.payload.sender_avatar} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center"><UserRound className="h-8 w-8 text-white/35" /></div>}</div><h3 className="mt-4 text-lg font-semibold">{incomingOffer.payload?.sender_name || 'Incoming call'}</h3><p className="mt-1 text-xs text-white/40">Incoming {incomingOffer.payload?.mode === 'video' ? 'video' : 'voice'} call</p><div className="mt-6 flex justify-center gap-5"><button onClick={declineIncoming} className="grid h-13 w-13 place-items-center rounded-full bg-rose-500/90 p-4"><PhoneOff className="h-5 w-5" /></button><button onClick={acceptIncoming} className="grid h-13 w-13 place-items-center rounded-full bg-emerald-500/90 p-4"><Phone className="h-5 w-5" /></button></div></div></div>}

      {call && <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-6 backdrop-blur-2xl"><div className="relative h-full w-full max-w-[760px] overflow-hidden rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_50%_20%,rgba(34,211,238,.12),rgba(2,6,23,.95)_55%)] shadow-2xl">
        {call.mode === 'video' ? <div className="relative h-full w-full bg-black"><video ref={remoteVideoRef} autoPlay playsInline className="h-full w-full object-cover" /><video ref={localVideoRef} autoPlay muted playsInline className="absolute bottom-5 right-5 h-32 w-44 rounded-2xl border border-white/15 bg-slate-950 object-cover shadow-xl" /></div> : <div className="grid h-full place-items-center text-center"><div><div className="mx-auto h-32 w-32 overflow-hidden rounded-full border-2 border-cyan-200/25 bg-white/10 shadow-[0_0_70px_rgba(34,211,238,.12)]">{call.avatar ? <img src={call.avatar} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center"><UserRound className="h-12 w-12 text-white/30" /></div>}</div><h3 className="mt-5 text-2xl font-semibold">{call.name}</h3><p className="mt-2 text-xs uppercase tracking-[.18em] text-cyan-100/40">{call.state === 'connected' ? 'Connected' : call.state === 'calling' ? 'Calling…' : 'Connecting…'}</p></div></div>}
        <div className="absolute bottom-7 left-1/2 flex -translate-x-1/2 items-center gap-4 rounded-full border border-white/10 bg-black/35 p-2 backdrop-blur-2xl"><button onClick={toggleMute} className={`grid h-12 w-12 place-items-center rounded-full ${muted ? 'bg-rose-500/80' : 'bg-white/10'}`}>{muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}</button><button onClick={() => endCall(true)} className="grid h-14 w-14 place-items-center rounded-full bg-rose-500"><PhoneOff className="h-6 w-6" /></button></div>
        <button onClick={() => endCall(true)} className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-full bg-black/30 text-white/60"><X className="h-4 w-4" /></button>
      </div></div>}
    </div>
  );
}