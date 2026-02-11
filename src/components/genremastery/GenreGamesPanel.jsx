import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gamepad2, Trophy, Scroll, Star, Users, ChevronRight, Target, Zap, Shield, BookOpen, Clock, Check, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import GenreGameDetail from './GenreGameDetail';

export default function GenreGamesPanel({ isOpen, onClose, genre, allGames }) {
  const [selectedGame, setSelectedGame] = useState(null);

  const genreGames = useMemo(() => {
    if (!allGames || !genre) return [];
    return allGames.filter(game => {
      const gameGenre = (game.genre || '').toLowerCase();
      return genre.matchGenres?.some(mg => gameGenre.includes(mg));
    });
  }, [allGames, genre]);

  // Generate mock quest/achievement data per game
  const gameData = useMemo(() => {
    return genreGames.map(game => ({
      ...game,
      questCount: Math.floor(Math.random() * 30) + 10,
      achievementCards: Math.floor(Math.random() * 20) + 5,
      totalXP: Math.floor(Math.random() * 5000) + 1000,
      completionRate: Math.floor(Math.random() * 60) + 10,
      communityCompletions: Math.floor(Math.random() * 500) + 50,
    }));
  }, [genreGames]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[300]"
            onClick={onClose}
          />

          {/* Panel - slides from left, uses full width when game selected */}
          <motion.div
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '-100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="fixed left-0 top-0 bottom-0 right-0 z-[301] flex"
          >
            {/* Games List */}
            <div
              className="h-full flex flex-col overflow-hidden"
              style={{
                width: '380px',
                minWidth: '380px',
                background: 'rgba(10, 14, 20, 0.88)',
                backdropFilter: 'blur(40px) saturate(160%)',
                WebkitBackdropFilter: 'blur(40px) saturate(160%)',
                borderRight: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '4px 0 30px rgba(0,0,0,0.4)',
              }}
            >
              {/* Header */}
              <div className="p-5 border-b border-white/8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${genre?.color || 'from-blue-500 to-cyan-500'} flex items-center justify-center`}>
                    <Gamepad2 className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-white font-bold text-base tracking-wide">{genre?.name} Games</h2>
                    <p className="text-white/40 text-xs">{gameData.length} game{gameData.length !== 1 ? 's' : ''} available</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all"
                >
                  <X className="w-4 h-4 text-white/60" />
                </button>
              </div>

              {/* Games List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                {gameData.length === 0 ? (
                  <div className="text-center py-16 text-white/30">
                    <Gamepad2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">No games in this genre yet</p>
                  </div>
                ) : (
                  gameData.map((game) => (
                    <motion.button
                      key={game.id}
                      onClick={() => setSelectedGame(game)}
                      whileHover={{ x: 3 }}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all border ${
                        selectedGame?.id === game.id
                          ? 'bg-white/10 border-white/15'
                          : 'bg-transparent border-transparent hover:bg-white/5 hover:border-white/8'
                      }`}
                    >
                      {/* Game Cover */}
                      <div className="w-12 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-white/10 bg-black/30">
                        {game.cover_image ? (
                          <img src={game.cover_image} alt={game.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-800">
                            <Gamepad2 className="w-5 h-5 text-white/30" />
                          </div>
                        )}
                      </div>

                      {/* Game Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white text-sm font-semibold truncate">{game.title}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-white/40 text-xs flex items-center gap-1">
                            <Scroll className="w-3 h-3" />{game.questCount} quests
                          </span>
                          <span className="text-yellow-400/70 text-xs flex items-center gap-1">
                            <Trophy className="w-3 h-3" />{game.achievementCards} cards
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
                            <div
                              className={`h-full rounded-full bg-gradient-to-r ${genre?.color || 'from-blue-500 to-cyan-500'}`}
                              style={{ width: `${game.completionRate}%` }}
                            />
                          </div>
                          <span className="text-white/30 text-[10px]">{game.completionRate}%</span>
                        </div>
                      </div>

                      <ChevronRight className="w-4 h-4 text-white/20 flex-shrink-0" />
                    </motion.button>
                  ))
                )}
              </div>
            </div>

            {/* Game Detail Panel - appears to the right */}
            <AnimatePresence>
              {selectedGame && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="h-full flex-1 overflow-hidden"
                  style={{
                    background: 'rgba(8, 12, 18, 0.92)',
                    backdropFilter: 'blur(40px) saturate(160%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(160%)',
                    borderRight: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <GenreGameDetail
                    game={selectedGame}
                    genre={genre}
                    onClose={() => setSelectedGame(null)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}