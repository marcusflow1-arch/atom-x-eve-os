import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Flame, ChevronLeft, ChevronRight } from 'lucide-react';

export default function StoreHeroShowcase({ games = [], activeSubCategory = 'Trending' }) {
  const [currentGameIdx, setCurrentGameIdx] = useState(0);
  const [direction, setDirection] = useState(1);

  const showcaseGames = games.slice(0, 8);

  useEffect(() => {
    if (showcaseGames.length === 0) return;
    const timer = setInterval(() => {
      setDirection(1);
      setCurrentGameIdx(prev => (prev + 1) % showcaseGames.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [showcaseGames.length]);

  const goNext = () => { setDirection(1); setCurrentGameIdx(prev => (prev + 1) % Math.max(showcaseGames.length, 1)); };
  const goPrev = () => { setDirection(-1); setCurrentGameIdx(prev => (prev - 1 + Math.max(showcaseGames.length, 1)) % Math.max(showcaseGames.length, 1)); };

  const currentGame = showcaseGames[currentGameIdx];

  return (
    <div className="relative w-full h-full overflow-hidden">
      <AnimatePresence mode="wait" custom={direction}>
        {currentGame ? (
          <motion.div
            key={currentGame.id}
            custom={direction}
            initial={{ opacity: 0, x: direction * 80 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -80 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className="absolute inset-0"
          >
            <img src={currentGame.cover_image || currentGame.banner_image} alt={currentGame.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />

            {/* Category Badge */}
            <div className="absolute top-5 left-6 flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-orange-500/20 border border-orange-500/40 rounded-full px-3 py-1">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-orange-300 text-xs font-bold uppercase tracking-wider">{activeSubCategory}</span>
              </div>
            </div>

            {/* Game Info */}
            <div className="absolute bottom-8 left-6 right-6">
              <h2 className="text-3xl font-black text-white mb-2 drop-shadow-lg">{currentGame.title}</h2>
              <div className="flex items-center gap-4 mb-3">
                <span className="text-white/60 text-sm">{currentGame.genre}</span>
                <div className="flex items-center gap-1 text-yellow-400">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span className="text-sm font-bold">{currentGame.rating || '4.8'}</span>
                </div>
                <span className="text-green-400 font-bold">${currentGame.price || '29.99'}</span>
              </div>
              {currentGame.description && (
                <p className="text-white/50 text-sm leading-relaxed line-clamp-2 max-w-md">{currentGame.description}</p>
              )}
            </div>
          </motion.div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Flame className="w-16 h-16 text-white/10 mx-auto mb-3" />
              <p className="text-white/30 text-sm">Loading games...</p>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Navigation Arrows */}
      <button onClick={goPrev} className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-black/70 transition-all z-10">
        <ChevronLeft className="w-4 h-4" />
      </button>
      <button onClick={goNext} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-black/70 transition-all z-10">
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
        {showcaseGames.map((_, i) => (
          <button key={i} onClick={() => { setDirection(i > currentGameIdx ? 1 : -1); setCurrentGameIdx(i); }} className={`rounded-full transition-all ${i === currentGameIdx ? 'w-6 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/30'}`} />
        ))}
      </div>

      {/* Game Thumbnails Strip */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-10">
        {showcaseGames.slice(0, 5).map((game, i) => (
          <button key={game.id} onClick={() => { setDirection(i > currentGameIdx ? 1 : -1); setCurrentGameIdx(i); }} className={`w-10 h-10 rounded-lg overflow-hidden border-2 transition-all ${i === currentGameIdx ? 'border-white scale-110' : 'border-white/20 opacity-60 hover:opacity-80'}`}>
            <img src={game.cover_image} alt={game.title} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}