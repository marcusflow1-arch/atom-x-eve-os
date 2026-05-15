import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send } from 'lucide-react';
import { base44 } from '@/api/base44Client';

/**
 * FriendChatBox — slides in from the right when a friend's message icon is clicked.
 * Loads the conversation history with the selected friend and lets the user send messages.
 */
export default function FriendChatBox({ friend, onClose }) {
  const [me, setMe] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  // conversation_id is deterministic from the two user IDs (sorted)
  const convId = me && friend ? [me.id, friend.id].sort().join('_') : null;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const u = await base44.auth.me();
        if (!cancelled) setMe(u);
      } catch { /* not authed */ }
    })();
    return () => { cancelled = true; };
  }, []);

  // Poll messages every 3s while open
  useEffect(() => {
    if (!convId) return;
    let cancelled = false;
    const fetchMsgs = async () => {
      try {
        const rows = await base44.entities.DirectMessage.filter(
          { conversation_id: convId }, 'created_date', 200
        );
        if (!cancelled) setMessages(rows || []);
      } catch { /* ignore */ }
    };
    fetchMsgs();
    const iv = setInterval(fetchMsgs, 3000);
    return () => { cancelled = true; clearInterval(iv); };
  }, [convId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length]);

  // Live WebRTC listener — append messages from this friend the instant they arrive
  useEffect(() => {
    if (!me || !friend) return;
    const handler = (e) => {
      const d = e.detail;
      if (!d || d.conversation_id !== convId) return;
      if (d.sender_id !== friend.id) return;
      setMessages((prev) => {
        // de-dupe by client_msg_id (set on send) or content+timestamp
        if (d.client_msg_id && prev.some((m) => m.client_msg_id === d.client_msg_id)) return prev;
        return [...prev, {
          id: d.client_msg_id || `rtc_${Date.now()}`,
          sender_id: d.sender_id,
          receiver_id: d.receiver_id,
          content: d.content,
          conversation_id: d.conversation_id,
          client_msg_id: d.client_msg_id,
        }];
      });
    };
    window.addEventListener('directMessageReceived', handler);
    return () => window.removeEventListener('directMessageReceived', handler);
  }, [me?.id, friend?.id, convId]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || !me || !friend || sending) return;
    setSending(true);
    const clientMsgId = `${me.id}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // 1) Broadcast over WebRTC immediately for real-time delivery
    try {
      if (typeof window.webrtcBroadcast === 'function') {
        window.webrtcBroadcast({
          type: 'dm',
          payload: {
            receiver_id: friend.id,
            content: text,
            conversation_id: convId,
            client_msg_id: clientMsgId,
          },
        });
      }
    } catch { /* ignore */ }

    // 2) Optimistic local append
    setMessages((prev) => [...prev, {
      id: clientMsgId,
      sender_id: me.id,
      receiver_id: friend.id,
      content: text,
      conversation_id: convId,
      client_msg_id: clientMsgId,
    }]);
    setDraft('');

    // 3) Persist to DB for history (works even if peer is offline)
    try {
      await base44.entities.DirectMessage.create({
        sender_id: me.id,
        receiver_id: friend.id,
        content: text,
        conversation_id: convId,
        is_read: false,
      });
    } catch (e) { /* ignore */ }
    setSending(false);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <AnimatePresence>
      {friend && (
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 40 }}
          transition={{ duration: 0.2 }}
          className="fixed right-6 bottom-6 z-[60] w-80 h-[480px] rounded-2xl overflow-hidden flex flex-col"
          style={{
            background: 'rgba(10, 14, 22, 0.95)',
            backdropFilter: 'blur(20px) saturate(160%)',
            border: '1px solid rgba(34, 211, 238, 0.35)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.7), 0 0 30px rgba(34, 211, 238, 0.18)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-cyan-500/10">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-xs font-bold text-cyan-200 shrink-0">
                {(friend.name || '?').charAt(0).toUpperCase()}
              </div>
              <div className="text-sm font-bold text-white truncate">{friend.name}</div>
            </div>
            <button onClick={onClose} className="text-white/40 hover:text-white shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.length === 0 ? (
              <div className="text-center text-white/40 text-xs py-8">
                No messages yet.<br/>Say hi 👋
              </div>
            ) : (
              messages.map((m) => {
                const mine = me && m.sender_id === me.id;
                return (
                  <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[75%] px-3 py-1.5 rounded-2xl text-sm break-words ${
                        mine
                          ? 'bg-cyan-500/30 border border-cyan-400/30 text-white rounded-br-sm'
                          : 'bg-white/10 border border-white/10 text-white/90 rounded-bl-sm'
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Input */}
          <div className="border-t border-white/10 p-2 flex items-center gap-2">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Type a message..."
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-cyan-400/50"
            />
            <button
              onClick={handleSend}
              disabled={!draft.trim() || sending}
              className="p-2 rounded-lg bg-cyan-500/30 hover:bg-cyan-500/50 disabled:opacity-30 disabled:cursor-not-allowed text-cyan-200 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}