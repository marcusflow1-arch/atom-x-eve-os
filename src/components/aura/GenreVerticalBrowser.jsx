import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Sparkles, Star, DollarSign } from 'lucide-react';
import { aiGamesList, trendingGames, newReleases, classicBestSellers, androidGames } from '@/components/store/mockData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import ShinyCard from '@/components/shared/ShinyCard';
import GameCartOverlay from './GameCartOverlay';

const chunkPairs = (arr) => {
  const res = [];
  for (let i = 0; i < arr.length; i += 2) res.push(arr.slice(i, i + 2));
  return res;
};

const GameCard = ({ game, onClick }) => (
  <motion.button
    onClick={() => onClick(game)}
    whileHover={{ scale: 1.03 }}
    className="relative w-full rounded-2xl overflow-hidden aura-glass aura-refraction aura-ease text-left"
    style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }}
  >
    <ShinyCard>
      <div className="relative w-full aspect-[3/4]">
        <img src={game.cover_image} alt={game.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
        <div className="absolute top-2 left-2 flex items-center gap-2">
          <Badge className="bg-black/50 border-white/15 text-white/85 text-[10px]">{game.genre}</Badge>
          <Badge className="bg-black/50 border-white/15 text-yellow-300 text-[10px] flex items-center gap-1">
            <Star className="w-3 h-3 fill-yellow-300" /> {game.rating || 4.5}
          </Badge>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <div className="flex items-center justify-between">
            <h4 className="text-white font-bold text-sm truncate max-w-[70%]">{game.title}</h4>
            <div className="text-white font-semibold text-sm flex items-center gap-1">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              {Number(game.price || 0).toFixed(0)}
            </div>
          </div>
        </div>
      </div>
    </ShinyCard>
  </motion.button>
);

export default function GenreVerticalBrowser() {
  const allGames = useMemo(() => [
    ...aiGamesList,
    ...trendingGames,
    ...newReleases,
    ...classicBestSellers,
    ...androidGames,
  ], []);

  const grouped = useMemo(() => {
    const map = new Map();
    allGames.forEach((g) => {
      const key = g.genre || 'Other';
      if (!map.has(key)) map.set(key, []);
      const arr = map.get(key);
      if (!arr.some((x) => x.id === g.id)) arr.push(g);
    });
    return Array.from(map.entries()).map(([genre, items]) => ({ genre, items, pairs: chunkPairs(items) }));
  }, [allGames]);

  const [pageByGenre, setPageByGenre] = useState({});
  const [overlayGame, setOverlayGame] = useState(null);

  const nextPair = (genre, total) => {
    setPageByGenre((s) => ({ ...s, [genre]: ((s[genre] || 0) + 1) % Math.max(total, 1) }));
  };
  const prevPair = (genre, total) => {
    setPageByGenre((s) => ({ ...s, [genre]: ((s[genre] || 0) - 1 + Math.max(total, 1)) % Math.max(total, 1) }));
  };

  return (
    <div className="h-full overflow-y-auto px-6 pb-10 space-y-10">
      {grouped.map(({ genre, pairs }) => {
        const idx = pageByGenre[genre] || 0;
        const current = pairs[idx] || [];
        return (
          <section key={genre} className="relative">
            {/* Genre header above game boxes */}
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-300" />
              <h3 className="text-white text-lg font-bold tracking-wide">{genre}</h3>
            </div>

            {/* Row with arrows and two game cards */}
            <div className="relative flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="flex-shrink-0 aura-glass aura-ease text-white"
                onClick={() => prevPair(genre, pairs.length)}
                title="Previous"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>

              <div className="grid grid-cols-2 gap-4 flex-1">
                {current.map((g) => (
                  <GameCard key={g.id} game={g} onClick={setOverlayGame} />
                ))}
                {current.length < 2 && <div className="rounded-2xl border border-white/10 bg-white/5" />}
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="flex-shrink-0 aura-glass aura-ease text-white"
                onClick={() => nextPair(genre, pairs.length)}
                title="Next"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </section>
        );
      })}

      <GameCartOverlay game={overlayGame} onClose={() => setOverlayGame(null)} />

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}