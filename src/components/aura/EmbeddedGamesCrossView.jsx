import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Gamepad2 } from "lucide-react";
import { aiGamesList, trendingGames, newReleases, classicBestSellers, androidGames } from "@/components/store/mockData";

export default function EmbeddedGamesCrossView() {
  const [genreIndex, setGenreIndex] = useState(0);
  const [gameIndex, setGameIndex] = useState(0);

  const genreData = useMemo(() => {
    const all = [...aiGamesList, ...trendingGames, ...newReleases, ...classicBestSellers, ...androidGames];
    const byGenre = all.reduce((acc, g) => {
      const key = g.genre || "Other";
      acc[key] = acc[key] || [];
      if (!acc[key].some((x) => x.id === g.id)) acc[key].push(g);
      return acc;
    }, {});
    return Object.entries(byGenre)
      .map(([label, items]) => ({ id: label, label, items }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, []);

  const current = genreData[genreIndex];

  if (!genreData.length) return null;

  return (
    <div className="relative">
      {/* Genres small list */}
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={() => setGenreIndex((g) => Math.max(g - 1, 0))}
          className="w-7 h-7 rounded-md bg-white/10 hover:bg-white/20 flex items-center justify-center"
        >
          <ChevronLeft className="w-4 h-4 text-white" />
        </button>
        <div className="text-white/80 text-sm font-medium flex items-center gap-2">
          <Gamepad2 className="w-4 h-4" />
          <span>{current?.label}</span>
        </div>
        <button
          onClick={() => setGenreIndex((g) => Math.min(g + 1, genreData.length - 1))}
          className="w-7 h-7 rounded-md bg-white/10 hover:bg-white/20 flex items-center justify-center"
        >
          <ChevronRight className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Horizontal game strip */}
      <div className="flex items-center gap-3 overflow-x-auto pb-1">
        {current?.items?.map((game, idx) => {
          const active = idx === gameIndex;
          return (
            <button
              key={game.id}
              onMouseEnter={() => setGameIndex(idx)}
              onClick={() => setGameIndex(idx)}
              className={`relative w-[120px] aspect-[3/4] rounded-lg overflow-hidden border ${
                active ? "border-white/40" : "border-white/10 opacity-70 hover:opacity-100"
              }`}
            >
              <img src={game.cover_image || game.image} alt={game.title} className="w-full h-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                <p className="text-white text-[11px] font-semibold truncate">{game.title}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}