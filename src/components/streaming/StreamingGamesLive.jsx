import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Search, Flame, Users as UsersIcon, Clock3, Sparkles, LayoutGrid, Gamepad2, Radio } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import StreamPlayerBox from "@/components/streaming/StreamPlayerBox";
import { Button } from "@/components/ui/button";
import GameStreamersView from "@/components/streaming/GameStreamersView";
import StreamChatBox from "@/components/streaming/StreamChatBox";

// Small utility to format large numbers
const formatNumber = (n) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n || 0);
};

const TOP_TABS = [
  { id: "trending", label: "Trending", icon: Flame },
  { id: "most", label: "Most Watching", icon: UsersIcon },
  { id: "new_streamers", label: "New Streamers", icon: Sparkles },
  { id: "new_games", label: "New Games", icon: Clock3 },
];

export default function StreamingGamesLive() {
  const [loading, setLoading] = useState(true);
  const [games, setGames] = useState([]);
  const [streams, setStreams] = useState([]);
  const [activeTab, setActiveTab] = useState("trending");
  const [search, setSearch] = useState("");
  const [activeGenre, setActiveGenre] = useState("All");
  // Aura Go Live box states
  const [isLive, setIsLive] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(70);
  const [showPlayerSettings, setShowPlayerSettings] = useState(false);
  const [isSettingsMaximized, setIsSettingsMaximized] = useState(false);
  const location = useLocation();
  const [selectedGame, setSelectedGame] = useState(location.state?.openGame || null);

  // Epic Moments demo clips
  const epicClips = [
    { src: 'https://cdn.coverr.co/videos/coverr-an-extreme-snowboarder-3663/1080p.mp4', title: 'Snowboard 360°', game: 'Action', duration: '0:12' },
    { src: 'https://cdn.coverr.co/videos/coverr-fps-gameplay-5587/1080p.mp4', title: 'Clutch 1v3', game: 'Shooter', duration: '0:09' },
    { src: 'https://cdn.coverr.co/videos/coverr-sci-fi-space-8940/1080p.mp4', title: 'Boss Finish', game: 'Sci‑Fi', duration: '0:14' }
  ];

  // Fetch games and streams
  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        const [gRes, sRes] = await Promise.all([
          base44.entities.Game.list(),
          base44.entities.Stream.list().catch(() => []),
        ]);
        const g = gRes?.data || gRes || [];
        const s = sRes?.data || sRes || [];
        if (mounted) {
          setGames(g);
          setStreams(s);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    run();
    return () => { mounted = false; };
  }, []);

  // Aggregate stream info per game
  const streamStatsByGame = useMemo(() => {
    const map = new Map();
    streams.forEach((st) => {
      const key = st.game_id || st.game || st.game_title || st.game_name; // best-effort
      if (!key) return;
      const prev = map.get(key) || { viewers: 0, liveCount: 0, latestStart: null };
      const viewers = (prev.viewers || 0) + (st.viewer_count || 0);
      const liveCount = prev.liveCount + (st.is_live ? 1 : 0);
      const latestStart = [prev.latestStart, st.started_at].filter(Boolean).sort().slice(-1)[0] || prev.latestStart;
      map.set(key, { viewers, liveCount, latestStart });
    });
    return map;
  }, [streams]);

  // Build genre list from games
  const genres = useMemo(() => {
    const set = new Set();
    games.forEach((g) => { if (g.genre) set.add(g.genre); });
    return ["All", ...Array.from(set).sort((a, b) => String(a).localeCompare(String(b)))];
  }, [games]);

  // Join games with stream stats
  const enrichedGames = useMemo(() => {
    return games.map((g) => {
      const key = g.id || g.title; // try id first
      // try both id and title to map streams
      const s1 = streamStatsByGame.get(g.id);
      const s2 = streamStatsByGame.get(g.title);
      const stat = s1 || s2 || { viewers: 0, liveCount: 0, latestStart: null };
      return {
        ...g,
        _live_viewers: stat.viewers || 0,
        _live_count: stat.liveCount || 0,
        _latest_stream: stat.latestStart,
      };
    });
  }, [games, streamStatsByGame]);

  // Filtering and sorting based on tab
  const filtered = useMemo(() => {
    let arr = enrichedGames;
    if (activeGenre !== "All") arr = arr.filter((g) => g.genre === activeGenre);
    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter((g) => String(g.title).toLowerCase().includes(q));
    }
    // Sorting per tab
    if (activeTab === "most") {
      arr = [...arr].sort((a, b) => (b._live_viewers || 0) - (a._live_viewers || 0));
    } else if (activeTab === "new_streamers") {
      arr = [...arr].sort((a, b) => {
        const at = a._latest_stream ? new Date(a._latest_stream).getTime() : 0;
        const bt = b._latest_stream ? new Date(b._latest_stream).getTime() : 0;
        return bt - at;
      });
    } else if (activeTab === "new_games") {
      arr = [...arr].sort((a, b) => (b.original_year || 0) - (a.original_year || 0));
    } else {
      // trending: mix of viewers and recency of latest stream
      arr = [...arr].sort((a, b) => {
        const av = (a._live_viewers || 0) + (a._live_count || 0) * 5;
        const bv = (b._live_viewers || 0) + (b._live_count || 0) * 5;
        return bv - av;
      });
    }
    return arr;
  }, [enrichedGames, activeTab, activeGenre, search]);

  return (
    <>
    <div className="h-full w-full pt-16 pb-10 px-6 text-white">
      {/* Page Title + Subnav */}
      <div className="max-w-[1920px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Radio className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl font-bold tracking-wider">Streaming</h1>
            <span className="text-white/30 text-sm">Games Live</span>
          </div>
        </div>

        <div className="flex gap-8">
          {/* LEFT: Genres */}
          <div className="w-[260px] hidden lg:block flex-shrink-0 sticky top-20 self-start">
            <div className="mb-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search games..."
                  className="w-full pl-9 pr-3 py-2 rounded-full bg-white/5 border border-white/10 text-sm placeholder:text-white/30 focus:bg-white/10 focus:border-white/30 outline-none transition"
                />
              </div>
            </div>

            <div className="space-y-2 pr-1 custom-scrollbar overflow-y-auto max-h-[calc(100vh-6rem)]">
              {genres.map((g) => (
                <button
                  key={g}
                  onClick={() => setActiveGenre(g)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    activeGenre === g
                      ? "bg-cyan-500/10 border-cyan-500/30 text-white"
                      : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                  }`}
                >
                  <div className="w-9 h-9 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center">
                    {g === "All" ? (
                      <LayoutGrid className={`w-5 h-5 ${activeGenre === g ? "text-cyan-400" : "text-white/60"}`} />
                    ) : (
                      <Gamepad2 className={`w-5 h-5 ${activeGenre === g ? "text-cyan-400" : "text-white/60"}`} />
                    )}
                  </div>
                  <span className={`text-sm font-bold ${activeGenre === g ? "text-white" : "text-white/70"}`}>{g}</span>
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT: Content */}
          <div className="flex-1 min-w-0">
            {/* Section Label */}
            <div className="flex items-center justify-center mb-3">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                <Sparkles className="w-4 h-4 text-cyan-300" />
                <span className="text-xs font-bold uppercase tracking-wider">Epic Moments</span>
              </div>
            </div>
            {/* Aura Streaming Box with Go Live */}
            <div className="relative mb-6">
              <div className="space-y-4">
                {/* Intro Video */}
                <div className="w-full h-[160px] md:h-[180px] lg:h-[200px] rounded-2xl overflow-hidden relative sticky top-20 z-20">
                  <video
                    className="w-full h-full object-cover"
                    src="https://cdn.coverr.co/videos/coverr-gamer-playing-on-keyboard-4972/1080p.mp4"
                    poster="https://images.unsplash.com/photo-1603484477859-abe6a73f936d?w=1200"
                    controls
                    playsInline
                  />
                  <div className="pointer-events-none absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                    <h3 className="text-white font-bold text-lg">Hi, I’m Marcus — Epic Moments</h3>
                    <p className="text-white/70 text-sm">A quick intro and a showcase of community highlights.</p>
                  </div>
                </div>

                {/* Clips Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {epicClips.map((clip, idx) => (
                    <motion.div key={idx} className="group relative rounded-xl overflow-hidden border border-white/10 bg-white/5">
                      <video className="w-full h-40 object-cover" src={clip.src} muted autoPlay loop playsInline />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className="bg-black/50 border-white/10 text-white/70 text-[10px]">{clip.game}</Badge>
                          <Badge variant="outline" className="border-white/10 text-white/50 text-[10px]">{clip.duration}</Badge>
                        </div>
                        <p className="text-white font-semibold text-sm line-clamp-1">{clip.title}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
            {/* Tabs */}
            <div className="flex items-center gap-2 mb-5 overflow-x-auto scrollbar-hide">
              {TOP_TABS.map(({ id, label, icon: Icon }) => {
                const active = id === activeTab;
                return (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full border whitespace-nowrap transition ${
                      active
                        ? "bg-cyan-500/20 border-cyan-400/40 text-cyan-100 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                        : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
                  </button>
                );
              })}
            </div>

            {/* Results */}
            <div className="relative">
              {loading ? (
                <div className="flex items-center justify-center py-24">
                  <div className="w-8 h-8 border-4 border-white/20 border-t-cyan-400 rounded-full animate-spin" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-20 text-white/50">No games found.</div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-5">
                  {filtered.map((g, idx) => (
                    <motion.div
                      key={g.id || g.title || idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(idx * 0.03, 0.4) }}
                      onClick={() => setSelectedGame({ ...g, image: g.cover_image || g.image, viewers: g._live_viewers || 0 })}
                      className="group relative aspect-[3/4] rounded-xl overflow-hidden border border-white/10 bg-white/5 cursor-pointer hover:border-cyan-400/40 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition"
                    >
                      {/* Cover */}
                      <img
                        src={g.cover_image || g.image || "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800"}
                        alt={g.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                      {/* Live badge */}
                      {(g._live_count || 0) > 0 && (
                        <div className="absolute top-2 left-2 flex items-center gap-2">
                          <Badge className="bg-red-500 text-white border-red-500/70 px-2 py-0.5 text-[10px]">LIVE</Badge>
                          <Badge className="bg-black/60 border-white/10 text-white/80 px-2 py-0.5 text-[10px]">
                            {formatNumber(g._live_viewers)} watching
                          </Badge>
                        </div>
                      )}

                      {/* Info bottom */}
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <div className="flex items-center gap-2 mb-1">
                          {g.genre && (
                            <Badge className="bg-black/50 border-white/10 text-white/70 text-[10px]">{g.genre}</Badge>
                          )}
                          {g.original_year && (
                            <Badge variant="outline" className="border-white/10 text-white/50 text-[10px]">{g.original_year}</Badge>
                          )}
                        </div>
                        <h3 className="text-white font-bold text-sm leading-snug line-clamp-2">{g.title}</h3>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>

    <AnimatePresence>
      {selectedGame && (
        <GameStreamersView game={selectedGame} onClose={() => setSelectedGame(null)} />
      )}
    </AnimatePresence>
  </>);
}