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
  const achievementIcons = ['🎮', '⚔️', '🏆', '👑', '🌟', '🗺️', '💎', '⚡', '✨', '🔥'];
  const categories = ['standard', 'ability', 'equipment', 'companion'];
  const rarities = ['Common', 'Rare', 'Epic', 'Legendary'];
  const achievements = [];
  const count = Math.floor(Math.random() * 5) + 5;
  for (let i = 0; i < count; i++) {
    const rarity = rarities[Math.floor(Math.random() * rarities.length)];
    achievements.push({
      id: `${game.id}-ach-${i}`,
      title: achievementNames[i % achievementNames.length],
      name: achievementNames[i % achievementNames.length],
      description: `Complete ${achievementNames[i % achievementNames.length].toLowerCase()} objectives in ${game.title}`,
      icon: achievementIcons[i % achievementIcons.length],
      rarity: rarity,
      category: categories[Math.floor(Math.random() * categories.length)],
      points: Math.floor(Math.random() * 200) + 50,
      xp: Math.floor(Math.random() * 200) + 50,
      game: game.title,
      unlocked: Math.random() > 0.6,
      reward: {
        name: `${achievementNames[i % achievementNames.length]} Reward`,
        description: `Exclusive reward for unlocking this achievement`,
        stats: { Attack: Math.floor(Math.random() * 50), Defense: Math.floor(Math.random() * 30) }
      }
    });
  }
  return achievements;
};

// Achievement Card Component with liquid glass effect
const AchievementCard = ({ achievement, onClick, isUnlocked }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseX = useSpring(x, { stiffness: 150, damping: 15 });
  const mouseY = useSpring(y, { stiffness: 150, damping: 15 });
  const rotateX = useTransform(mouseY, [-0.5, 0.5], [15, -15]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-15, 15]);

  function handleMouseMove(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseXPos = event.clientX - rect.left;
    const mouseYPos = event.clientY - rect.top;
    x.set(mouseXPos / width - 0.5);
    y.set(mouseYPos / height - 0.5);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  const rarityColors = {
    Common: "border-slate-500 shadow-slate-500/20",
    Rare: "border-blue-500 shadow-blue-500/30",
    Epic: "border-purple-500 shadow-purple-500/30",
    Legendary: "border-orange-500 shadow-orange-500/40",
    Mythic: "border-red-500 shadow-red-500/40",
  };

  const rarityBadgeColors = {
    Common: "bg-slate-500/15 text-slate-300 border-slate-500/30",
    Rare: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    Epic: "bg-purple-500/15 text-purple-300 border-purple-500/30",
    Legendary: "bg-orange-500/15 text-orange-300 border-orange-500/30",
    Mythic: "bg-red-500/15 text-red-300 border-red-500/30",
  };

  const rarityColor = rarityColors[achievement.rarity] || rarityColors.Common;
  const badgeColor = rarityBadgeColors[achievement.rarity] || rarityBadgeColors.Common;

  return (
    <motion.div
      onClick={() => onClick(achievement)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d"
      }}
      whileHover={{ scale: 1.05, z: 50 }}
      className={`relative w-full aspect-[3/4] rounded-lg overflow-hidden cursor-pointer group border ${isUnlocked ? rarityColor : 'border-slate-800 grayscale opacity-60'}`}
    >
      <ShinyCard>
        {/* Card Content */}
        <div className="absolute inset-0 flex flex-col items-center p-2" style={{ transform: "translateZ(10px)" }}>
          {/* Header */}
          <div className="w-full flex justify-between items-start mb-1">
            <Badge variant="outline" className={`text-[7px] px-1 py-0 border ${badgeColor}`}>
              {achievement.rarity}
            </Badge>
            <div className="text-yellow-400 font-bold text-[8px]">{achievement.points}</div>
          </div>

          {/* Icon Area */}
          <div className="flex-1 flex items-center justify-center w-full my-1" style={{ transform: "translateZ(20px)" }}>
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-xl shadow-inner border border-white/10">
              {achievement.icon || '🏆'}
            </div>
          </div>

          {/* Info */}
          <div className="w-full text-center mt-auto" style={{ transform: "translateZ(15px)" }}>
            <h3 className="text-white font-bold text-[10px] leading-tight mb-0.5 line-clamp-2">{achievement.title}</h3>
          </div>

          {/* Status */}
          <div className="mt-1 w-full border-t border-white/10 pt-1 flex justify-center">
            {isUnlocked ? (
              <Check className="w-3 h-3 text-green-400" />
            ) : (
              <span className="text-slate-500 text-[8px]">Locked</span>
            )}
          </div>
        </div>

        {/* Shine Effect */}
        <motion.div
          style={{
            opacity: useTransform(rotateX, (val) => Math.abs(val) / 20 + 0.1),
            background: "linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.15) 45%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0.15) 55%, transparent 80%)",
            transform: useTransform(mouseX, [-0.5, 0.5], ["translateX(-100%)", "translateX(100%)"])
          }}
          className="absolute inset-0 z-10 pointer-events-none"
        />

        {/* Corner Glow Effects */}
        <motion.div
          className="absolute bottom-0 left-0 w-10 h-10 pointer-events-none"
          animate={{
            boxShadow: [
              "0 0 0px rgba(59, 130, 246, 0)",
              "0 0 15px rgba(59, 130, 246, 0.6)",
              "0 0 0px rgba(59, 130, 246, 0)"
            ]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          style={{
            borderLeft: "2px solid rgba(59, 130, 246, 0.5)",
            borderBottom: "2px solid rgba(59, 130, 246, 0.5)",
            borderBottomLeftRadius: "0.75rem"
          }}
        />
        <motion.div
          className="absolute top-0 right-0 w-10 h-10 pointer-events-none"
          animate={{
            boxShadow: [
              "0 0 0px rgba(59, 130, 246, 0)",
              "0 0 15px rgba(59, 130, 246, 0.6)",
              "0 0 0px rgba(59, 130, 246, 0)"
            ]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          style={{
            borderRight: "2px solid rgba(59, 130, 246, 0.5)",
            borderTop: "2px solid rgba(59, 130, 246, 0.5)",
            borderTopRightRadius: "0.75rem"
          }}
        />
      </ShinyCard>
    </motion.div>
  );
};

export default function BlankTransition() {
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const genreId = params.get('genre') || 'mmorpg';
  const gameIdParam = params.get('game');
  const currentGenre = GENRES.find(g => g.id === genreId) || GENRES[0];
  
  const [selectedGame, setSelectedGame] = useState(null);
  const [selectedAchievement, setSelectedAchievement] = useState(null);

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
      <div className="fixed left-0 top-20 bottom-0 w-[12%] min-w-[140px] z-[26] overflow-y-auto relative">
        <div className="py-2 flex flex-col items-stretch gap-1 select-none px-2">
          {/* Back button with horizontal line below */}
          <div className="flex flex-col items-center">
            <div
              className="h-12 w-full flex items-center justify-center text-white/80 text-xl cursor-pointer hover:text-white hover:bg-white/5 rounded-lg transition-all"
              onClick={() => navigate(createPageUrl('GenreMastery'))}
              title="Back to Skill Tree"
            >
              <ArrowLeft className="w-5 h-5" />
            </div>
            <div className="w-full h-px bg-white/20 my-2" />
          </div>

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

              {/* Achievements Section - Card Grid */}
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="w-5 h-5 text-purple-400" />
                  <h3 className="text-xl font-bold">Achievements</h3>
                  <span className="text-white/40 text-sm ml-2">({achievements.length} total)</span>
                </div>
                <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                  {achievements.map((ach) => (
                    <AchievementCard
                      key={ach.id}
                      achievement={ach}
                      isUnlocked={ach.unlocked}
                      onClick={(a) => setSelectedAchievement(a)}
                    />
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

      {/* Achievement Detail Overlay */}
      <AnimatePresence>
        {selectedAchievement && (
          <AchievementDetailOverlay
            achievement={selectedAchievement}
            onClose={() => setSelectedAchievement(null)}
            onTrack={() => {}}
            isTracked={false}
            onShare={() => {}}
            onChallenge={() => {}}
          />
        )}
      </AnimatePresence>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}