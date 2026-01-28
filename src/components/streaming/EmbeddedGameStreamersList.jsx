import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Eye, Users, Radio, Play } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function EmbeddedGameStreamersList({ game }) {
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        // Get all live Aura streams, then filter to this game by title/genre/tags
        const liveRes = await base44.entities.AuraStream.filter({ is_live: true });
        const live = liveRes.data || liveRes || [];
        const titleLc = (game?.title || "").toLowerCase();
        const genreLc = (game?.genre || "").toLowerCase();

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

        // Enrich with streamer profile (if available)
        const byId = {};
        for (const s of filtered) {
          if (!s.streamer_id || byId[s.streamer_id] !== undefined) continue;
          try {
            const profRes = await base44.entities.StreamerProfile.filter({ id: s.streamer_id });
            const prof = (profRes.data || profRes || [])[0] || null;
            byId[s.streamer_id] = prof;
          } catch (_) {
            byId[s.streamer_id] = null;
          }
        }

        const enriched = filtered.map((s) => ({ ...s, profile: byId[s.streamer_id] || null }));
        if (isMounted) setStreams(enriched);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, [game]);

  const goToProfile = (s) => {
    const id = s.profile?.id || s.streamer_id;
    if (!id) return;
    navigate(createPageUrl("StreamerProfile") + `?id=${id}`);
  };

  if (loading) {
    return (
      <div className="py-10 text-center text-white/60">Loading live streams…</div>
    );
  }

  if (!streams.length) {
    return (
      <div className="py-12 text-center text-white/50">No one is streaming this game right now.</div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">Live Streamers</h3>
        <div className="text-xs text-white/50">{streams.length} live</div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {streams.map((s) => (
          <motion.button
            key={s.id}
            onClick={() => goToProfile(s)}
            whileHover={{ y: -4, scale: 1.02 }}
            className="text-left p-3 rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/10 transition-colors"
          >
            <div className="relative w-full aspect-video rounded-lg overflow-hidden mb-2 bg-black/40">
              {s.thumbnail_url ? (
                <img src={s.thumbnail_url} alt={s.title || "Live"} className="w-full h-full object-cover" />
              ) : s.profile?.avatar_url ? (
                <img src={s.profile.avatar_url} alt={s.profile.display_name || "Streamer"} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/50">
                  <Radio className="w-6 h-6" />
                </div>
              )}
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-bold flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> LIVE
              </div>
            </div>

            <p className="text-white font-semibold truncate">{s.profile?.display_name || s.title || "Live Stream"}</p>
            {s.title && <p className="text-white/60 text-xs truncate">{s.title}</p>}

            <div className="mt-1 flex items-center gap-3 text-xs text-white/60">
              <span className="inline-flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {s.viewer_count || 0}</span>
              {s.profile?.follower_count !== undefined && (
                <span className="inline-flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {s.profile.follower_count}</span>
              )}
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}