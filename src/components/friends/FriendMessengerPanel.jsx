import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageSquare, Send, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function FriendMessengerPanel({ friend, currentUserId, onClose }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const feedRef = useRef(null);
  const inputRef = useRef(null);

  const friendId = friend?.friend_id || friend?.player_id || friend?.id;
  const conversationId = useMemo(() => {
    if (!currentUserId || !friendId) return '';
    return [String(currentUserId), String(friendId)].sort().join('-');
  }, [currentUserId, friendId]);

  const loadMessages = async () => {
    if (!conversationId) return;
    try {
      const rows = await base44.entities.DirectMessage.filter({ conversation_id: conversationId });
      setMessages((rows || []).slice().sort((a, b) => new Date(a.created_date) - new Date(b.created_date)));
      setError('');
    } catch (err) {
      console.error('Failed to load direct messages:', err);
      setError('Conversation history could not load.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadMessages();
    if (!conversationId) return undefined;
    let cleanup;
    let refreshTimer;
    try {
      cleanup = base44.entities.DirectMessage.subscribe((event) => {
        const message = event?.data;
        if (message?.conversation_id !== conversationId) return;
        clearTimeout(refreshTimer);
        refreshTimer = setTimeout(loadMessages, 80);
      });
    } catch {
      // Sending always refreshes the thread; realtime is an enhancement.
    }
    return () => {
      clearTimeout(refreshTimer);
      cleanup?.();
    };
  }, [conversationId]);

  useEffect(() => {
    const feed = feedRef.current;
    if (feed) feed.scrollTop = feed.scrollHeight;
  }, [messages.length]);

  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
    const onKey = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const sendMessage = async (event) => {
    event?.preventDefault?.();
    const content = draft.trim();
    if (!content || !currentUserId || !friendId || !conversationId || sending) return;
    setSending(true);
    setError('');
    try {
      await base44.entities.DirectMessage.create({
        sender_id: currentUserId,
        receiver_id: friendId,
        conversation_id: conversationId,
        content,
      });
      setDraft('');
      await loadMessages();
    } catch (err) {
      console.error('Failed to send direct message:', err);
      setError('Message could not send. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const displayName = friend?.friend_name || friend?.display_name || 'Player';
  const avatar = friend?.friend_avatar || friend?.avatar_url || '';
  const status = friend?.status || 'online';

  return (
    <AnimatePresence>
      <motion.div
        key="friend-messenger"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 p-4 backdrop-blur-xl"
        onMouseDown={(event) => { if (event.target === event.currentTarget) onClose?.(); }}
      >
        <motion.section
          initial={{ opacity: 0, y: 18, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.99 }}
          transition={{ duration: 0.2 }}
          role="dialog"
          aria-modal="true"
          aria-label={`Messages with ${displayName}`}
          className="flex h-[min(720px,82vh)] w-full max-w-[760px] flex-col overflow-hidden rounded-[24px] border border-white/15 bg-[linear-gradient(145deg,rgba(18,22,29,.86),rgba(5,7,11,.92))] text-white shadow-[0_30px_100px_rgba(0,0,0,.58),inset_0_1px_0_rgba(255,255,255,.1)] backdrop-blur-3xl"
        >
          <header className="flex shrink-0 items-center gap-3 border-b border-white/10 px-5 py-4">
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-white/10">
              {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center text-sm font-bold text-white/70">{displayName.slice(0, 1).toUpperCase()}</div>}
              <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#11151c] ${status === 'online' ? 'bg-emerald-400' : status === 'away' || status === 'idle' ? 'bg-amber-400' : 'bg-slate-500'}`} />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-[15px] font-semibold">{displayName}</h2>
              <p className="mt-0.5 text-[11px] capitalize text-white/45">{status === 'online' ? 'Active now' : status}</p>
            </div>
            <button type="button" onClick={onClose} aria-label="Close messages" className="grid h-9 w-9 place-items-center rounded-full bg-white/[0.06] text-white/60 transition hover:bg-white/[0.12] hover:text-white"><X className="h-4 w-4" /></button>
          </header>

          <div ref={feedRef} className="flex-1 overflow-y-auto px-5 py-5 [scrollbar-width:thin] [scrollbar-color:rgba(148,163,184,.35)_transparent]">
            {loading ? (
              <div className="grid h-full place-items-center text-sm text-white/35">Loading conversation…</div>
            ) : messages.length ? (
              <div className="flex min-h-full flex-col justify-end gap-2.5">
                {messages.map((message, index) => {
                  const mine = String(message.sender_id) === String(currentUserId);
                  const previous = messages[index - 1];
                  const showTime = !previous || new Date(message.created_date) - new Date(previous.created_date) > 10 * 60 * 1000;
                  return (
                    <React.Fragment key={message.id || `${message.created_date}-${index}`}>
                      {showTime && <div className="py-2 text-center text-[9px] uppercase tracking-[0.14em] text-white/25">{new Date(message.created_date).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</div>}
                      <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[76%] px-3.5 py-2.5 text-[13px] leading-relaxed shadow-sm ${mine ? 'rounded-[18px_18px_4px_18px] bg-blue-600 text-white' : 'rounded-[18px_18px_18px_4px] border border-white/8 bg-white/[0.075] text-white/90 backdrop-blur-xl'}`}>
                          {message.content}
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            ) : (
              <div className="grid h-full place-items-center text-center">
                <div><MessageSquare className="mx-auto h-8 w-8 text-white/20" /><p className="mt-3 text-sm text-white/45">No messages yet.</p><p className="mt-1 text-xs text-white/25">Start your conversation with {displayName}.</p></div>
              </div>
            )}
          </div>

          <form onSubmit={sendMessage} className="shrink-0 border-t border-white/10 p-4">
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/30 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,.06)] backdrop-blur-2xl focus-within:border-blue-300/35">
              <input ref={inputRef} value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={2000} placeholder={`Message ${displayName}`} className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-white outline-none placeholder:text-white/25" />
              <button type="submit" disabled={!draft.trim() || sending} aria-label="Send message" className="grid h-9 w-9 place-items-center rounded-xl bg-blue-600 text-white transition hover:bg-blue-500 disabled:cursor-default disabled:opacity-35"><Send className="h-4 w-4" /></button>
            </div>
            {error && <p className="px-2 pt-2 text-xs text-rose-300">{error}</p>}
          </form>
        </motion.section>
      </motion.div>
    </AnimatePresence>
  );
}
