import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, X, MessageCircle, Trash2 } from 'lucide-react';
import { friendsStore, removeFriend } from './socialStores';
import { base44 } from '@/api/base44Client';

const ONLINE_WINDOW_MS = 2 * 60 * 1000; // last_seen within 2 minutes → online

/**
 * FriendsListPanel — opened with the L key.
 * Shows accepted friends with online/offline status + actions (remove).
 * Online status is determined by reading each friend's User.last_seen.
 */
export default function FriendsListPanel({ open, onClose }) {
  const [{ friends }, setState] = useState(friendsStore.get());
  const [onlineMap, setOnlineMap] = useState({}); // userId → bool
  useEffect(() => friendsStore.subscribe(setState), []);

  // Poll each friend's last_seen while panel is open to compute online status
  useEffect(() => {
    if (!open || friends.length === 0) return;
    let cancelled = false;
    const refresh = async () => {
      try {
        const ids = friends.map((f) => f.id);
        const users = await base44.entities.User.filter({ id: { $in: ids } });
        if (cancelled) return;
        const now = Date.now();
        const map = {};
        (users || []).forEach((u) => {
          const seen = u.last_seen ? new Date(u.last_seen).getTime() : 0;
          map[u.id] = now - seen < ONLINE_WINDOW_MS;
        });
        setOnlineMap(map);
      } catch (e) { /* best-effort, ignore */ }
    };
    refresh();
    const iv = setInterval(refresh, 30000);
    return () => { cancelled = true; clearInterval(iv); };
  }, [open, friends]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.2 }}
            className="fixed right-6 top-1/2 -translate-y-1/2 z-50 w-80 rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(10, 14, 22, 0.92)',
              backdropFilter: 'blur(20px) saturate(160%)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.7), 0 0 30px rgba(16, 185, 129, 0.18)',
            }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-emerald-500/10">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-300" />
                <div className="text-sm font-bold text-white tracking-wide">Friends</div>
                <span className="text-[10px] text-emerald-300/70 font-mono">({friends.length})</span>
              </div>
              <button onClick={onClose} className="text-white/40 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-2">
              {friends.length === 0 ? (
                <div className="px-3 py-8 text-center text-white/40 text-xs">
                  No friends yet.<br/>
                  <span className="text-white/30">Middle-click a player and choose Add Friend.</span>
                </div>
              ) : (
                friends.map((f) => {
                  const online = !!onlineMap[f.id];
                  return (
                  <div
                    key={f.id}
                    className="group flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold ${online ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-200' : 'bg-white/5 border-white/15 text-white/40'}`}>
                      {(f.name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white font-medium truncate">{f.name}</div>
                      <div className={`text-[10px] flex items-center gap-1 ${online ? 'text-emerald-300/70' : 'text-white/40'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${online ? 'bg-emerald-400' : 'bg-white/30'}`}></span>
                        {online ? 'Online' : 'Offline'}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        title="Message"
                        className="p-1.5 rounded hover:bg-cyan-500/20 text-cyan-300"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </button>
                      <button
                        title="Remove"
                        onClick={() => removeFriend(f.id)}
                        className="p-1.5 rounded hover:bg-red-500/20 text-red-300"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  );
                })
              )}
            </div>

            <div className="px-4 py-2 border-t border-white/10 text-[10px] text-white/40 text-center">
              Press <span className="font-mono text-emerald-300">L</span> to close
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}