import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Trophy, Flame, Zap, ChevronLeft, ChevronRight, Lock } from 'lucide-react';

const MOCK_ACHIEVEMENTS = [
  { id: 1, game: 'Cyberpunk 2088', title: 'Ghost in the Wire', description: 'Complete all stealth missions without detection', rarity: 'Legendary', icon: '👻', xp: 500, color: 'from-yellow-500 to-orange-500' },
  { id: 2, game: 'Dragon Age VII', title: 'Arcane Mastery', description: 'Master all spell schools in a single playthrough', rarity: 'Epic', icon: '🔮', xp: 350, color: 'from-purple-500 to-pink-500' },
  { id: 3, game: 'Stellar Conflict', title: 'Fleet Admiral', description: 'Win 100 consecutive space battles', rarity: 'Mythical', icon: '⭐', xp: 750, color: 'from-cyan-500 to-blue-500' },
  { id: 4, game: 'Shadow Realms', title: 'Void Walker', description: 'Traverse all hidden dimensions', rarity: 'Rare', icon: '🌑', xp: 200, color: 'from-slate-500 to-indigo-500' },
  { id: 5, game: 'Mech Warriors X', title: 'Iron Giant', description: 'Pilot every mech class to max level', rarity: 'Epic', icon: '🤖', xp: 400, color: 'from-green-500 to-teal-500' },
  { id: 6, game: 'Neon Blade', title: 'Speed Demon', description: 'Clear the city district under 2 minutes', rarity: 'Legendary', icon: '⚡', xp: 600, color: 'from-red-500 to-orange-500' },
];

const RARITY_COLORS = {
  Common: 'text-slate-300 border-slate-500/40 bg-slate-500/10',
  Rare: 'text-blue-300 border-blue-500/40 bg-blue-500/10',
  Epic: 'text-purple-300 border-purple-500/40 bg-purple-500/10',
  Legendary: 'text-yellow-300 border-yellow-500/40 bg-yellow-500/10',
  Mythical: 'text-cyan-300 border-cyan-500/40 bg-cyan-500/10',
};

export default function StoreHeroShowcase({ games = [], activeSubCategory = 'Trending' }) {
  const [currentGameIdx, setCurrentGameIdx] = useState(0);
  const [achievementOffset, setAchievementOffset] = useState(0);
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

  useEffect(() => {
    const timer = setInterval(() => {
      setAchievementOffset(prev => (prev + 1) % MOCK_ACHIEVEMENTS.length);
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  const goNext = () => {
    setDirection(1);
    setCurrentGameIdx(prev => (prev + 1) % Math.max(showcaseGames.length, 1));
  };
  const goPrev = () => {
    setDirection(-1);
    setCurrentGameIdx(prev => (prev - 1 + Math.max(showcaseGames.length, 1)) % Math.max(showcaseGames.length, 1));
  };

  const currentGame = showcaseGames[currentGameIdx];
  const visibleAchievements = MOCK_ACHIEVEMENTS.slice(0, 5).map((_, i) => 
    MOCK_ACHIEVEMENTS[(achievementOffset + i) % MOCK_ACHIEVEMENTS.length]
  );

  return (
    <div className="flex w-full h-full gap-0">
      {/* LEFT: Game Slideshow */}
      <div className="flex-1 relative overflow-hidden">
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
              <img
                src={currentGame.cover_image || currentGame.banner_image}
                alt={currentGame.title}
                className="w-full h-full object-cover"
              />
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
            <button
              key={i}
              onClick={() => { setDirection(i > currentGameIdx ? 1 : -1); setCurrentGameIdx(i); }}
              className={`rounded-full transition-all ${i === currentGameIdx ? 'w-6 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/30'}`}
            />
          ))}
        </div>

        {/* Game Thumbnails Strip */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-10">
          {showcaseGames.slice(0, 5).map((game, i) => (
            <button
              key={game.id}
              onClick={() => { setDirection(i > currentGameIdx ? 1 : -1); setCurrentGameIdx(i); }}
              className={`w-10 h-10 rounded-lg overflow-hidden border-2 transition-all ${i === currentGameIdx ? 'border-white scale-110' : 'border-white/20 opacity-60 hover:opacity-80'}`}
            >
              <img src={game.cover_image} alt={game.title} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      {/* DIVIDER */}
      <div className="w-px bg-gradient-to-b from-transparent via-white/20 to-transparent flex-shrink-0" />

      {/* RIGHT: Trending Achievements */}
      <div className="w-[340px] flex-shrink-0 flex flex-col overflow-hidden" style={{ background: 'rgba(0,0,0,0.35)' }}>
        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b border-white/10 flex items-center gap-2 flex-shrink-0">
          <Trophy className="w-4 h-4 text-yellow-400" />
          <span className="text-white font-bold text-sm uppercase tracking-wider">Trending Achievements</span>
          <div className="ml-auto flex items-center gap-1 bg-red-500/20 border border-red-500/30 rounded-full px-2 py-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            <span className="text-red-300 text-[10px] font-bold">LIVE</span>
          </div>
        </div>

        {/* Achievement List */}
        <div className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="popLayout">
            {visibleAchievements.map((ach, i) => (
              <motion.div
                key={`${ach.id}-${achievementOffset}`}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ delay: i * 0.06, duration: 0.3 }}
                className="px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer group"
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 bg-gradient-to-br ${ach.color} bg-opacity-20 border border-white/10`}>
                    {ach.icon}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-white font-bold text-sm truncate">{ach.title}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider border rounded-full px-1.5 py-0.5 flex-shrink-0 ${RARITY_COLORS[ach.rarity] || RARITY_COLORS.Common}`}>
                        {ach.rarity}
                      </span>
                    </div>
                    <p className="text-white/40 text-xs leading-tight truncate">{ach.game}</p>
                    <p className="text-white/30 text-xs leading-tight truncate mt-0.5">{ach.description}</p>
                  </div>

                  {/* XP */}
                  <div className="flex-shrink-0 flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1">
                      <Zap className="w-3 h-3 text-yellow-400" />
                      <span className="text-yellow-400 text-xs font-bold">{ach.xp}</span>
                    </div>
                    <Lock className="w-3 h-3 text-white/20 group-hover:text-white/40 transition-colors" />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-white/10 flex-shrink-0">
          <button className="w-full text-center text-xs text-white/30 hover:text-white/60 transition-colors font-medium tracking-wider uppercase">
            View All Achievements →
          </button>
        </div>
      </div>
    </div>
  );
}