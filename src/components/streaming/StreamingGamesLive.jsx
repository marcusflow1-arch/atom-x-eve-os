import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ChevronLeft, ChevronRight, Eye, Radio, Sparkles, Users, Clock3, Play } from "lucide-react";
import StreamerTile from "@/components/streaming/aura/StreamerTile";
import { getDiscoverStreamers } from "@/components/streaming/aura/streamerMockData";

const TABS = [
  { id: "trending", label: "Trending", icon: Sparkles },
  { id: "watching", label: "Most Watching", icon: Users },
  { id: "new", label: "New Streamers", icon: Radio },
  { id: "games", label: "New Games", icon: Clock3 },
];

const normalizeStreams = (rows = []) => rows.map((s, i) => ({
  id: s.id || s.streamer_id || s.user_id || `stream-${i}`,
  name: s.streamer_name || s.channel_name || s.username || s.name || `Creator ${i + 1}`,
  title: s.title || s.stream_title || "Live on Atom X Eve",
  game: s.game_title || s.game_name || s.game || "Gaming",
  gameImage: s.game_image || s.cover_image || s.thumbnail,
  thumbnail: s.thumbnail || s.preview_image || s.image,
  avatar: s.avatar || s.profile_image || s.user_avatar,
  viewers: Number(s.viewer_count || s.viewers || 0),
  uptimeMinutes: Number(s.uptime_minutes || s.uptimeMinutes || 0),
  tags: s.tags || [],
  isLive: s.is_live !== false,
  raw: s,
}));

export default function StreamingGamesLive() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [games, setGames] = useState([]);
  const [streams, setStreams] = useState([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("trending");

  useEffect(() => {
    let mounted = true;
    Promise.all([
      base44.entities.Game.list().catch(() => []),
      base44.entities.Stream.list().catch(() => []),
    ]).then(([gRes, sRes]) => {
      if (!mounted) return;
      setGames(gRes?.data || gRes || []);
      setStreams(normalizeStreams(sRes?.data || sRes || []));
    }).finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  const fallback = useMemo(() => getDiscoverStreamers(games.slice(0, 14), 4) || [], [games]);
  const liveChannels = useMemo(() => {
    const api = streams.filter(s => s.isLive);
    return api.length ? api : fallback;
  }, [streams, fallback]);

  const heroItems = useMemo(() => liveChannels.slice(0, Math.min(6, liveChannels.length)), [liveChannels]);
  const hero = heroItems[heroIndex % Math.max(heroItems.length, 1)];

  const goToStreamer = (streamer) => {
    navigate("/streaminghome", {
      state: {
        streamer,
        streamerId: streamer.id,
        game: streamer.game,
        gameId: streamer.raw?.game_id || streamer.gameId,
      },
    });
  };

  const rows = useMemo(() => {
    const base = [...liveChannels];
    if (activeTab === "watching") return base.sort((a, b) => b.viewers - a.viewers);
    if (activeTab === "new") return base.sort((a, b) => a.uptimeMinutes - b.uptimeMinutes);
    if (activeTab === "games") return base.sort((a, b) => String(a.game).localeCompare(String(b.game)));
    return base.sort((a, b) => b.viewers - a.viewers);
  }, [liveChannels, activeTab]);

  const gameCards = useMemo(() => games.slice(0, 12), [games]);

  useEffect(() => {
    if (heroItems.length < 2) return undefined;
    const timer = setInterval(() => setHeroIndex(i => (i + 1) % heroItems.length), 7000);
    return () => clearInterval(timer);
  }, [heroItems.length]);

  return (
    <div className="w-full min-h-screen bg-[#0f1419] text-white px-5 md:px-8 xl:px-10 pt-16 pb-28">
      <div className="max-w-[2100px] mx-auto space-y-10">
        <section className="relative h-[360px] md:h-[430px] overflow-hidden bg-black/30 border border-white/10">
          <AnimatePresence mode="wait">
            {hero ? (
              <motion.div key={hero.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0">
                <img src={hero.thumbnail || hero.gameImage || "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1800"} alt="" className="w-full h-full object-cover opacity-60" />
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/55 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 to-transparent" />
                <div className="absolute left-7 md:left-12 bottom-10 max-w-2xl">
                  <div className="flex items-center gap-2 mb-3"><span className="px-2 py-1 bg-red-600 text-[10px] font-black tracking-widest">LIVE</span><span className="text-white/60 text-xs"><Eye className="inline w-3.5 h-3.5 mr-1" />{hero.viewers.toLocaleString()} watching</span></div>
                  <p className="text-cyan-300 text-xs uppercase tracking-[0.25em] font-bold mb-2">Featured Stream</p>
                  <h1 className="text-3xl md:text-5xl font-black tracking-tight">{hero.title}</h1>
                  <p className="mt-2 text-white/60">{hero.name} · {hero.game}</p>
                  <button onClick={() => goToStreamer(hero)} className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-white text-black text-sm font-black hover:bg-white/90 transition"><Play className="w-4 h-4 fill-current" /> Watch Stream</button>
                </div>
              </motion.div>
            ) : <div className="absolute inset-0 flex items-center justify-center text-white/40">No featured streams available.</div>}
          </AnimatePresence>
          {heroItems.length > 1 && <>
            <button aria-label="Previous featured stream" onClick={() => setHeroIndex(i => (i - 1 + heroItems.length) % heroItems.length)} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/60 border border-white/15 flex items-center justify-center hover:bg-white/10"><ChevronLeft /></button>
            <button aria-label="Next featured stream" onClick={() => setHeroIndex(i => (i + 1) % heroItems.length)} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/60 border border-white/15 flex items-center justify-center hover:bg-white/10"><ChevronRight /></button>
          </>}
        </section>

        <section>
          <div className="flex items-center justify-between mb-4"><div><h2 className="text-lg md:text-xl font-black">Live Channels We Think You'll Like</h2><p className="text-xs text-white/40 mt-1">Personalized live broadcasts from the Atom X Eve community</p></div><span className="text-xs text-white/40">{rows.length} live</span></div>
          {loading ? <div className="py-20 text-center text-white/40">Loading live channels…</div> : rows.length ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-5 gap-y-8">{rows.slice(0, 10).map(s => <StreamerTile key={s.id} streamer={s} onClick={goToStreamer} />)}</div> : <div className="py-16 text-center text-white/40">No live channels right now.</div>}
        </section>

        <section>
          <div className="flex items-center justify-between mb-4"><h2 className="text-lg md:text-xl font-black">Categories / Games We Think You'll Like</h2><span className="text-xs text-white/40">Browse live games</span></div>
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">{gameCards.map((g, i) => <button key={g.id || i} onClick={() => window.dispatchEvent(new CustomEvent("atomxe:aura-game-selected", { detail: { ...g, image: g.cover_image || g.image } }))} className="group flex-shrink-0 w-44 md:w-52 text-left"><div className="aspect-[3/4] overflow-hidden bg-white/5 border border-white/10"><img src={g.cover_image || g.image || "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800"} alt={g.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /></div><p className="mt-2 text-sm font-bold truncate">{g.title}</p><p className="text-[11px] text-white/40">{g.genre || "Game"}</p></button>)}</div>
        </section>

        <section>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-5">{TABS.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setActiveTab(id)} className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border flex items-center gap-2 whitespace-nowrap transition ${activeTab === id ? "bg-cyan-500/15 border-cyan-400/40 text-cyan-200" : "bg-white/5 border-white/10 text-white/50 hover:text-white"}`}><Icon className="w-3.5 h-3.5" />{label}</button>)}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-5 gap-y-8">{rows.slice(0, 10).map(s => <StreamerTile key={`${activeTab}-${s.id}`} streamer={s} onClick={goToStreamer} />)}</div>
        </section>
      </div>
    </div>
  );
}
