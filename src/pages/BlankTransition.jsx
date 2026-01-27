import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Globe, Rocket, Crown, Swords, Crosshair, Map, Ghost, Monitor, ArrowLeft, Trophy, Star, Zap, Target, ScrollText, Check } from 'lucide-react';
import MiniLunaNav from '../components/nav/MiniLunaNav';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import ShinyCard from '@/components/shared/ShinyCard';
import AchievementDetailOverlay from '@/components/achievements/AchievementDetailOverlay';

const GENRES = [
  { id: 'mmorpg', name: 'MMORPG', icon: Globe, color: 'from-purple-500 to-indigo-600', matchGenres: ['mmo', 'mmorpg'] },
  { id: 'scifi', name: 'Sci-Fi', icon: Rocket, color: 'from-cyan-500 to-blue-600', matchGenres: ['sci-fi', 'scifi', 'sci_fi'] },
  { id: 'fantasy', name: 'Fantasy', icon: Crown, color: 'from-amber-400 to-orange-500', matchGenres: ['fantasy', 'rpg'] },
  { id: 'action', name: 'Action', icon: Swords, color: 'from-red-500 to-rose-600', matchGenres: ['action', 'fighting'] },
  { id: 'shooter', name: 'Shooter', icon: Crosshair, color: 'from-emerald-500 to-green-600', matchGenres: ['shooter', 'shooting', 'fps'] },
  { id: 'adventure', name: 'Adventure', icon: Map, color: 'from-yellow-400 to-orange-400', matchGenres: ['adventure', 'open_world'] },
  { id: 'fear', name: 'Fear', icon: Ghost, color: 'from-slate-800 to-gray-900', matchGenres: ['horror', 'survival'] },
  { id: 'simulation', name: 'Simulation', icon: Monitor, color: 'from-blue-400 to-indigo-400', matchGenres: ['simulation', 'strategy'] },
];

// Mock quests/achievements for games
const generateGameQuests = (game) => {
  const questTypes = ['Story', 'Combat', 'Exploration', 'Collection', 'Challenge'];
  const quests = [];
  for (let i = 1; i <= 5; i++) {
    quests.push({
      id: `${game.id}-quest-${i}`,
      name: `${questTypes[i-1]} Quest ${i}`,
      description: `Complete ${questTypes[i-1].toLowerCase()} objectives in ${game.title}`,
      xp: Math.floor(Math.random() * 500) + 100,
      achievements: Math.floor(Math.random() * 3) + 1,
    });
  }
  return quests;
};

const generateGameAchievements = (game) => {
  const achievementNames = [
    'First Steps', 'Veteran', 'Master', 'Champion', 'Legend',
    'Explorer', 'Collector', 'Speedrunner', 'Perfectionist', 'Unstoppable'
  ];
  const rarities = ['Common', 'Rare', 'Epic', 'Legendary'];
  const achievements = [];
  const count = Math.floor(Math.random() * 5) + 5;
  for (let i = 0; i < count; i++) {
    achievements.push({
      id: `${game.id}-ach-${i}`,
      name: achievementNames[i % achievementNames.length],
      rarity: rarities[Math.floor(Math.random() * rarities.length)],
      xp: Math.floor(Math.random() * 200) + 50,
      unlocked: Math.random() > 0.6,
    });
  }
  return achievements;
};

export default function BlankTransition() {
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const genreId = params.get('genre') || 'mmorpg';
  const gameIdParam = params.get('game');
  const currentGenre = GENRES.find(g => g.id === genreId) || GENRES[0];
  
  const [selectedGame, setSelectedGame] = useState(null);

  // Fetch games from database
  const { data: allGames = [], isLoading } = useQuery({
    queryKey: ['games-for-skill-tree'],
    queryFn: () => base44.entities.Game.list(),
  });

  // Filter games by current genre
  const genreGames = useMemo(() => {
    if (!allGames || allGames.length === 0) return [];
    return allGames.filter(game => {
      const gameGenre = (game.genre || '').toLowerCase();
      return currentGenre.matchGenres.some(mg => gameGenre.includes(mg));
    });
  }, [allGames, currentGenre]);

  // Select game from URL param or first in list
  useEffect(() => {
    if (gameIdParam && genreGames.length > 0) {
      const game = genreGames.find(g => g.id === gameIdParam);
      if (game) setSelectedGame(game);
    } else if (genreGames.length > 0 && !selectedGame) {
      setSelectedGame(genreGames[0]);
    }
  }, [gameIdParam, genreGames, selectedGame]);

  useEffect(() => { window.scrollTo(0, 0); }, [genreId]);

  // Generate quests and achievements for selected game
  const quests = useMemo(() => selectedGame ? generateGameQuests(selectedGame) : [], [selectedGame]);
  const achievements = useMemo(() => selectedGame ? generateGameAchievements(selectedGame) : [], [selectedGame]);
  const totalXP = useMemo(() => {
    const questXP = quests.reduce((sum, q) => sum + q.xp, 0);
    const achXP = achievements.reduce((sum, a) => sum + a.xp, 0);
    return questXP + achXP;
  }, [quests, achievements]);

  const handleGameClick = (game) => {
    setSelectedGame(game);
    navigate(createPageUrl(`BlankTransition?genre=${genreId}&game=${game.id}`), { replace: true });
  };

  const rarityColors = {
    Common: 'bg-slate-600 text-slate-200',
    Rare: 'bg-blue-600 text-blue-100',
    Epic: 'bg-purple-600 text-purple-100',
    Legendary: 'bg-yellow-600 text-yellow-100',
  };

  return (
    <div className="relative min-h-screen w-full bg-black text-white overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-black to-slate-900" />
        <div className={`absolute inset-0 bg-gradient-to-r ${currentGenre.color} blur-[150px] opacity-20`} />
      </div>

      {/* Left Rail: Games list */}
      <div className="fixed left-0 top-0 h-screen w-px bg-white/20 z-[25]" />
      <div className="fixed left-0 top-20 bottom-0 w-[12%] min-w-[140px] z-[26] overflow-y-auto relative">
        <div className="py-2 flex flex-col items-stretch gap-1 select-none px-2">
          {/* Back button */}
          <div
            className="h-12 w-full flex items-center justify-center text-white/80 text-xl cursor-pointer hover:text-white hover:bg-white/5 rounded-lg transition-all"
            onClick={() => navigate(createPageUrl('GenreMastery'))}
            title="Back to Skill Tree"
          >
            <ArrowLeft className="w-5 h-5" />
          </div>
          
          <div className="h-px bg-white/10 my-2" />

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-white/20 border-t-cyan-400 rounded-full animate-spin" />
            </div>
          ) : genreGames.length === 0 ? (
            <div className="text-center py-8 text-white/40 text-xs">
              No games in this genre
            </div>
          ) : (
            genreGames.map((game) => {
              const isSelected = selectedGame?.id === game.id;
              return (
                <motion.div
                  key={game.id}
                  onClick={() => handleGameClick(game)}
                  whileHover={{ x: 4 }}
                  className={`
                    flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all
                    ${isSelected 
                      ? 'bg-white/15 border border-cyan-400/40 shadow-[0_0_12px_rgba(34,211,238,0.2)]' 
                      : 'hover:bg-white/10 border border-transparent'
                    }
                  `}
                >
                  {/* Game thumbnail */}
                  <div className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0 border border-white/10">
                    {game.cover_image ? (
                      <img src={game.cover_image} alt={game.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                        <currentGenre.icon className="w-4 h-4 text-white/40" />
                      </div>
                    )}
                  </div>
                  {/* Game title */}
                  <span className={`text-xs font-medium truncate ${isSelected ? 'text-white' : 'text-white/70'}`}>
                    {game.title}
                  </span>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Page header fixed at top */}
      <div className="fixed top-0 left-[12%] right-0 z-30">
        <MiniLunaNav title="Skill Tree" />
      </div>

      {/* Game Details Panel (static position) */}
      <div className="fixed top-24 left-[14%] right-6 px-6 z-10 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 120px)' }}>
        <AnimatePresence mode="wait">
          {selectedGame ? (
            <motion.div
              key={selectedGame.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="rounded-3xl p-8 md:p-10 relative overflow-hidden"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(40px) saturate(180%)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.25)'
              }}
            >
              <div className={`absolute inset-0 bg-gradient-to-r ${currentGenre.color} opacity-5`} />
              
              {/* Game Header */}
              <div className="relative z-10 grid md:grid-cols-2 gap-8 items-start mb-8">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className="bg-white/10 border-white/20 text-white">{currentGenre.name}</Badge>
                    <Badge className="bg-cyan-500/20 border-cyan-500/30 text-cyan-300">{selectedGame.genre}</Badge>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-extrabold mb-3">{selectedGame.title}</h2>
                  <p className="text-white/70 mb-4 line-clamp-3">{selectedGame.description}</p>
                  
                  {/* XP Summary */}
                  <div className="flex items-center gap-6 p-4 rounded-xl bg-black/30 border border-white/10">
                    <div className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-yellow-400" />
                      <div>
                        <div className="text-2xl font-bold text-white">{totalXP.toLocaleString()}</div>
                        <div className="text-xs text-white/50">Total XP Available</div>
                      </div>
                    </div>
                    <div className="h-10 w-px bg-white/10" />
                    <div className="flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-purple-400" />
                      <div>
                        <div className="text-2xl font-bold text-white">{achievements.length}</div>
                        <div className="text-xs text-white/50">Achievements</div>
                      </div>
                    </div>
                    <div className="h-10 w-px bg-white/10" />
                    <div className="flex items-center gap-2">
                      <ScrollText className="w-5 h-5 text-green-400" />
                      <div>
                        <div className="text-2xl font-bold text-white">{quests.length}</div>
                        <div className="text-xs text-white/50">Quests</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Game Cover */}
                <div className="relative h-64 flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent rounded-2xl" />
                  {selectedGame.cover_image ? (
                    <img 
                      src={selectedGame.cover_image} 
                      alt={selectedGame.title} 
                      className="w-full h-full object-contain drop-shadow-[0_0_30px_rgba(255,255,255,0.2)] rounded-xl" 
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl flex items-center justify-center">
                      <currentGenre.icon className="w-20 h-20 text-white/20" />
                    </div>
                  )}
                </div>
              </div>

              {/* Quests Section */}
              <div className="relative z-10 mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5 text-green-400" />
                  <h3 className="text-xl font-bold">Available Quests</h3>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {quests.map((quest) => (
                    <div
                      key={quest.id}
                      className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer"
                    >
                      <h4 className="font-bold text-white mb-1">{quest.name}</h4>
                      <p className="text-xs text-white/60 mb-3">{quest.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-yellow-400">
                          <Zap className="w-4 h-4" />
                          <span className="text-sm font-bold">+{quest.xp} XP</span>
                        </div>
                        <div className="flex items-center gap-1 text-purple-400">
                          <Trophy className="w-4 h-4" />
                          <span className="text-sm font-bold">{quest.achievements}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Achievements Section */}
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="w-5 h-5 text-purple-400" />
                  <h3 className="text-xl font-bold">Achievements</h3>
                </div>
                <div className="flex flex-wrap gap-3">
                  {achievements.map((ach) => (
                    <div
                      key={ach.id}
                      className={`
                        flex items-center gap-3 px-4 py-2 rounded-full border transition-all
                        ${ach.unlocked 
                          ? 'bg-white/10 border-white/20' 
                          : 'bg-black/30 border-white/5 opacity-60'
                        }
                      `}
                    >
                      <Star className={`w-4 h-4 ${ach.unlocked ? 'text-yellow-400 fill-yellow-400' : 'text-white/30'}`} />
                      <span className="text-sm font-medium">{ach.name}</span>
                      <Badge className={`text-[10px] ${rarityColors[ach.rarity]}`}>{ach.rarity}</Badge>
                      <span className="text-xs text-yellow-400/80">+{ach.xp} XP</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-3xl p-12 text-center"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(40px) saturate(180%)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <currentGenre.icon className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white/60 mb-2">Select a Game</h2>
              <p className="text-white/40">Choose a game from the left panel to view quests and achievements</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}