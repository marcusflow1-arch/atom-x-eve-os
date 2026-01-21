import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gamepad2, Smartphone, Search, LayoutGrid, ChevronRight, Crosshair, Shield, Car, Monitor, Zap, Sparkles, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { aiGamesList, trendingGames, newReleases, classicBestSellers, androidGames } from "@/components/store/mockData";
import StreamsForGame from "./StreamsForGame";

const GENRE_ICON_MAP = {
  Shooter: Crosshair,
  RPG: Shield,
  Racing: Car,
  Simulation: Monitor,
  Puzzle: Zap,
  "Action RPG": Shield,
  Action: Gamepad2,
  Adventure: Gamepad2,
  Strategy: Monitor,
  "Sci-Fi": Sparkles,
  Sports: Gamepad2,
  Sandbox: Gamepad2,
  Survival: Gamepad2,
  Mystery: Sparkles,
};

export default function AuraGamesCrossView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeGenreIdx, setActiveGenreIdx] = useState(0);
  const [activeGameIdx, setActiveGameIdx] = useState(0);
  const [androidOnly, setAndroidOnly] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const containerRef = useRef(null);
  const wheelCooldownRef = useRef(0);

  // Layout constants (mirroring Store cross view)
  const ITEM_HEIGHT = 80; // px
  const ITEM_GAP = 24; // px
  const CROSS_Y_VH = 40; // center at ~40vh

  // Combine all games
  const allGames = useMemo(() => {
    const list = [...aiGamesList, ...trendingGames, ...newReleases, ...classicBestSellers, ...androidGames];
    return list;
  }, []);

  // Build genre data grouped and filtered
  const genreData = useMemo(() => {
    const filtered = allGames.filter((g) => {
      const term = searchTerm.trim().toLowerCase();
      const matches = term ? (g.title?.toLowerCase().includes(term) || g.genre?.toLowerCase().includes(term)) : true;
      const platformOk = androidOnly ? (g.platforms?.includes("Android") || g.isMobile) : true;
      return matches && platformOk;
    });
    const byGenre = {};
    for (const g of filtered) {
      const key = g.genre || "Other";
      if (!byGenre[key]) byGenre[key] = [];
      // avoid duplicates by id
      if (!byGenre[key].some((x) => x.id === g.id)) byGenre[key].push(g);
    }
    const entries = Object.entries(byGenre)
      .map(([label, items]) => ({
        id: label.toLowerCase().replace(/\s+/g, "_"),
        label,
        icon: GENRE_ICON_MAP[label] || Gamepad2,
        items,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));

    // Clamp active indices if needed
    if (activeGenreIdx >= entries.length) {
      setActiveGenreIdx(0);
      setActiveGameIdx(0);
    } else if (entries[activeGenreIdx] && activeGameIdx >= entries[activeGenreIdx].items.length) {
      setActiveGameIdx(0);
    }
    return entries;
  }, [allGames, searchTerm, androidOnly, activeGenreIdx, activeGameIdx]);

  const currentGenre = genreData[activeGenreIdx];
  const activeGame = currentGenre?.items?.[activeGameIdx];

  // Keyboard navigation
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onKey = (e) => {
      if (!genreData.length) return;
      if (selectedGame) return; // don't navigate while modal open
      const k = e.key.toLowerCase();
      
      if (e.key === "ArrowRight" || k === "d") {
        setActiveGameIdx((i) => Math.min(i + 1, (currentGenre?.items?.length || 1) - 1));
      } else if (e.key === "ArrowLeft" || k === "a") {
        setActiveGameIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === "ArrowDown" || k === "s") {
        setActiveGenreIdx((g) => Math.min(g + 1, genreData.length - 1));
        setActiveGameIdx(0);
      } else if (e.key === "ArrowUp" || k === "w") {
        setActiveGenreIdx((g) => Math.max(g - 1, 0));
        setActiveGameIdx(0);
      }
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [genreData, currentGenre, selectedGame]);

  const onWheel = (e) => {
    // Allow vertical scrolling inside the streams box without switching genres
    if (e.target && typeof e.target.closest === 'function' && e.target.closest('.streams-box')) return;

    const now = Date.now();
    if (now - wheelCooldownRef.current < 160) return; // throttle
    wheelCooldownRef.current = now;

    // Support both horizontal (games) and vertical (genres) scrolling
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      // Horizontal scroll -> Games
      if (e.deltaX > 0) {
        setActiveGameIdx((i) => Math.min(i + 1, (currentGenre?.items?.length || 1) - 1));
      } else {
        setActiveGameIdx((i) => Math.max(i - 1, 0));
      }
    } else {
      // Vertical scroll -> Genres
      if (e.deltaY > 0) {
        setActiveGenreIdx((g) => Math.min(g + 1, Math.max(genreData.length - 1, 0)));
        setActiveGameIdx(0);
      } else {
        setActiveGenreIdx((g) => Math.max(g - 1, 0));
        setActiveGameIdx(0);
      }
    }
  };

  return (
    <div ref={containerRef} tabIndex={0} onWheel={onWheel} className="relative w-full h-full outline-none">
      {/* Background */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeGame?.id || currentGenre?.id || "bg"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 -z-10"
        >
          {activeGame?.cover_image && (
            <>
              <img src={activeGame.cover_image} alt="bg" className="w-full h-full object-cover opacity-30 blur-sm" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/40 to-transparent" />
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center gap-3 px-6 pt-4 pb-2">
        <div className="flex items-center gap-2 text-white/60 text-xs uppercase tracking-wider">
          <Gamepad2 className="w-4 h-4" />
          <span>Aura</span>
          <ChevronRight className="w-4 h-4" />
          <span className="text-white">Games</span>
          {currentGenre && (
            <>
              <ChevronRight className="w-4 h-4" />
              <span className="text-white">{currentGenre.label}</span>
            </>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setAndroidOnly((v) => !v)}
            className={`px-3 py-1.5 rounded-lg border text-xs ${
              androidOnly ? "bg-green-500/20 border-green-400/40 text-green-300" : "bg-white/10 border-white/10 text-white/70 hover:bg-white/20"
            }`}
            title="Android Games"
          >
            <Smartphone className="w-4 h-4" />
          </button>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search games..."
              className="bg-white/10 hover:bg-white/20 focus:bg-white/20 border border-white/10 focus:border-white/30 rounded-lg pl-7 pr-3 py-1.5 text-xs text-white placeholder:text-white/40 w-48 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Vertical Genres */}
      <div className="absolute top-24 bottom-16 left-4 w-40 overflow-hidden">
        <motion.div
          className="flex flex-col gap-6 py-2"
          animate={{ y: `calc(${CROSS_Y_VH}vh - ${activeGenreIdx * (ITEM_HEIGHT + ITEM_GAP)}px - ${ITEM_HEIGHT/2}px)` }}
          transition={{ type: "spring", stiffness: 250, damping: 25 }}
        >
          {genreData.map((g, idx) => {
            const Icon = g.icon;
            const active = idx === activeGenreIdx;
            return (
              <motion.button
                key={g.id}
                onClick={() => { setActiveGenreIdx(idx); setActiveGameIdx(0); }}
                animate={{ scale: active ? 1.2 : 0.9, opacity: active ? 1 : 0.35, x: active ? 20 : 0 }}
                transition={{ type: "spring", stiffness: 250, damping: 25 }}
                className="flex flex-col items-center gap-2"
                style={{ height: ITEM_HEIGHT }}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${active ? "bg-white/20 border-white/30" : "bg-white/5 border-white/10"}`}>
                  <Icon className={`w-7 h-7 ${active ? "text-white" : "text-white/70"}`} />
                </div>
                <span className={`text-[10px] uppercase tracking-wider ${active ? "text-white" : "text-white/60"}`}>{g.label}</span>
              </motion.button>
            );
          })}
        </motion.div>
      </div>

      {/* Horizontal Games */}
      <div className="absolute left-56 right-6 top-[40vh] -translate-y-1/2 h-80 flex items-center">
        <motion.div className="flex items-center gap-6">
          {currentGenre?.items?.map((game, idx) => {
            const active = idx === activeGameIdx;
            return (
              <motion.div
                key={game.id}
                onMouseEnter={() => setActiveGameIdx(idx)}
                onClick={() => setSelectedGame(game)}
                animate={{ scale: active ? 1.06 : 0.92, opacity: active ? 1 : 0.5, y: active ? 0 : 12 }}
                transition={{ type: "spring", stiffness: 220, damping: 24 }}
                className={`relative w-[168px] aspect-[3/4] rounded-xl overflow-hidden cursor-pointer border ${active ? "border-white/40" : "border-white/10 bg-black/40"}`}
              >
                <img src={game.cover_image || game.image} alt={game.title} className="w-full h-full object-cover" />
                {!active && <div className="absolute inset-0 bg-black/40" />}
                <div className="absolute top-2 right-2">
                  <Badge className="bg-black/60 text-white border-white/10">${game.price}</Badge>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <h4 className="text-white font-bold text-sm truncate">{game.title}</h4>
                  <div className="flex items-center justify-between text-xs text-white/70">
                    <span>{game.genre}</span>
                    <span className="inline-flex items-center gap-1 text-yellow-400"><Star className="w-3 h-3 fill-current" /> {game.rating || 4.5}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Active Game Details */}
      {activeGame && (
        <div className="absolute bottom-8 left-56 right-6 pointer-events-none">
          <div className="max-w-2xl space-y-3">
            <div className="flex items-center gap-2 pointer-events-auto">
              <Badge className="bg-white/10 text-white border-white/20">{activeGame.genre}</Badge>
              {activeGame.aiEnhanced && (
                <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/40">AI Enhanced</Badge>
              )}
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white drop-shadow">{activeGame.title}</h1>
            <p className="text-white/70 line-clamp-3 max-w-xl">{activeGame.description}</p>
          </div>
        </div>
      )}

      {/* Streams Overlay */}
      <AnimatePresence>
        {selectedGame && (
          <StreamsForGame game={selectedGame} onClose={() => setSelectedGame(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}