import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Users, Eye, Radio } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Badge } from "@/components/ui/badge";

export default function StreamsForGame({ game, onClose }) {
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const liveRes = await base44.entities.AuraStream.filter({ is_live: true });
        const live = liveRes.data || liveRes || [];
        const titleLc = (game.title || "").toLowerCase();
        const genreLc = (game.genre || "").toLowerCase();
        const filtered = live.filter((s) => {
          const t = (s.title || "").toLowerCase();
          const d = (s.description || "").toLowerCase();
          const c = (s.category || "").toLowerCase();
          const tags = Array.isArray(s.tags) ? s.tags.map((x) => (x || "").toLowerCase()) : [];
          return (
            t.includes(titleLc) ||
            d.includes(titleLc) ||
            c === genreLc ||
            tags.includes(titleLc) ||
            tags.includes(genreLc)
          );
        });

        // Fetch streamer profiles for each unique streamer_id
        const byId = {};
        for (const s of filtered) {
          if (!s.streamer_id) continue;
          if (!byId[s.streamer_id]) {
            try {
              const profRes = await base44.entities.StreamerProfile.filter({ id: s.streamer_id });
              const prof = (profRes.data || profRes || [])[0] || null;
              byId[s.streamer_id] = prof;
            } catch (_) {
              byId[s.streamer_id] = null;
            }
          }
        }

        const enriched = filtered.map((s) => ({
          ...s,
          profile: byId[s.streamer_id] || null,
        }));

        if (isMounted) setStreams(enriched);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [game]);

  const goToProfile = (s) => {
    const id = s.profile?.id || s.streamer_id;
    if (!id) return;
    navigate(createPageUrl("StreamerProfile") + `?id=${id}`);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-end md:items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 30, opacity: 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 24 }}
          className="w-full max-w-4xl rounded-2xl overflow-hidden border"
          style={{
            background: "rgba(255,255,255,0.06)",
            backdropFilter: "blur(24px) saturate(140%)",
            WebkitBackdropFilter: "blur(24px) saturate(140%)",
            borderColor: "rgba(255,255,255,0.12)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <div>
              <p className="text-white/50 text-xs font-semibold uppercase tracking-wider">Live Streams</p>
              <h3 className="text-white font-bold text-lg">
                {game.title} <span className="text-white/40 text-sm ml-2">({game.genre})</span>
              </h3>
            </div>
            <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center">
              <X className="w-4 h-4 text-white/80" />
            </button>
          </div>

          {/* Body */}
          <div className="max-h-[60vh] overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="py-16 text-center text-white/60">Loading streams...</div>
            ) : streams.length === 0 ? (
              <div className="py-16 text-center text-white/60">No live streams found for this game right now.</div>
            ) : (
              streams.map((s) => (
                <button
                  key={s.id}
                  onClick={() => goToProfile(s)}
                  className="w-full text-left flex items-center gap-4 p-3 rounded-xl hover:bg-white/10 transition-colors border border-white/10"
                  style={{ background: "rgba(0,0,0,0.25)" }}
                >
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/40 flex items-center justify-center border border-white/10">
                    {s.profile?.avatar_url ? (
                      <img src={s.profile.avatar_url} alt={s.profile.display_name} className="w-full h-full object-cover" />
                    ) : (
                      <Radio className="w-5 h-5 text-white/60" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-semibold truncate">
                        {s.profile?.display_name || "Unknown Streamer"}
                      </p>
                      {s.category && (
                        <Badge className="bg-white/10 text-white/70 border-white/20 text-[10px]">{s.category}</Badge>
                      )}
                    </div>
                    <p className="text-white/60 text-sm truncate">{s.title}</p>
                    <div className="flex items-center gap-4 text-xs text-white/50 mt-1">
                      <span className="inline-flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {s.viewer_count || 0}</span>
                      <span className="inline-flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Followers {s.profile?.follower_count || 0}</span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}