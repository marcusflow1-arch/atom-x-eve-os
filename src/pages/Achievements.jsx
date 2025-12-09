import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Trophy, Search, Filter, Mic, Volume2, ChevronRight,
  Check, X, ArrowLeft, Gamepad2, Sparkles, Layers,
  ChevronDown, Mic as MicIcon
} from 'lucide-react';
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useAuth } from '../components/auth/AuthContext';
import { Achievement } from '@/entities/Achievement';
import { Game } from '@/entities/Game';
import { allMockGames } from '../components/store/mockData';
import AchievementDetailOverlay from '../components/achievements/AchievementDetailOverlay';
import ChallengeFriendModal from '../components/community/ChallengeFriendModal';
import CardEnhancementOverlay from '../components/profile/CardEnhancementOverlay';
import ShinyCard from '../components/shared/ShinyCard';
import { base44 } from '@/api/base44Client';

// --- Shiny Sidebar Box Component ---
const ShinySidebarBox = ({ children, className = "" }) => {
  return (
    <motion.div
      className={`relative overflow-hidden rounded-2xl border border-white/10 shadow-2xl ${className}`}
      style={{
        background: 'linear-gradient(180deg, #020617 0%, #0f172a 100%)',
      }}
    >
        {children}
    </motion.div>
  );
};

// --- Achievement Card (Trading Card Style) ---
const AchievementCard = ({ achievement, onClick, isUnlocked }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseX = useSpring(x, { stiffness: 150, damping: 15 });
  const mouseY = useSpring(y, { stiffness: 150, damping: 15 });
  const rotateX = useTransform(mouseY, [-0.5, 0.5], [20, -20]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-20, 20]);

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
    Common: "border-slate-600 shadow-slate-500/20",
    Uncommon: "border-green-500 shadow-green-500/20",
    Rare: "border-blue-500 shadow-blue-500/20",
    Epic: "border-purple-500 shadow-purple-500/20",
    Legendary: "border-orange-500 shadow-orange-500/20",
    Mythic: "border-red-500 shadow-red-500/20",
    Godlike: "border-yellow-400 shadow-yellow-500/40"
  };

  const rarityColor = rarityColors[achievement.rarity] || rarityColors.Common;

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
      whileHover={{ scale: 1.05 }}
      className={`relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer group bg-slate-900 border-2 ${isUnlocked ? rarityColor : 'border-slate-800 grayscale opacity-60'}`}
    >
      {/* Card Content */}
      <div className="absolute inset-0 flex flex-col items-center p-4 transform-style-3d">
        {/* Header */}
        <div className="w-full flex justify-between items-start mb-2" style={{ transform: "translateZ(20px)" }}>
          <Badge variant="outline" className="bg-black/50 border-white/10 text-[10px]">
            {achievement.category || 'General'}
          </Badge>
          <div className="text-yellow-400 font-bold text-xs">{achievement.points} pts</div>
        </div>

        {/* Icon / Image Area */}
        <div className="flex-1 flex items-center justify-center w-full my-2" style={{ transform: "translateZ(30px)" }}>
          <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center text-5xl shadow-inner border border-white/10">
            {achievement.icon || '🏆'}
          </div>
        </div>

        {/* Info */}
        <div className="w-full text-center mt-auto" style={{ transform: "translateZ(25px)" }}>
          <h3 className="text-white font-bold text-lg leading-tight mb-1 line-clamp-2">{achievement.title}</h3>
          <p className="text-slate-400 text-xs line-clamp-2">{achievement.description}</p>
        </div>

        {/* Rarity Label */}
        <div className="mt-3 w-full border-t border-white/10 pt-2 flex justify-between items-center" style={{ transform: "translateZ(20px)" }}>
          <span className={`text-[10px] font-bold uppercase tracking-wider ${isUnlocked ? 'text-white' : 'text-slate-500'}`}>
            {achievement.rarity}
          </span>
          {isUnlocked && <Check className="w-4 h-4 text-green-400" />}
        </div>
      </div>

      {/* Shine Effect */}
      <motion.div 
        style={{
          opacity: useTransform(rotateX, (val) => Math.abs(val) / 30 + 0.1),
          background: "linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.2) 45%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0.2) 55%, transparent 80%)",
          transform: useTransform(mouseX, [-0.5, 0.5], ["translateX(-100%)", "translateX(100%)"]),
        }}
        className="absolute inset-0 z-10 pointer-events-none mix-blend-overlay"
      />
    </motion.div>
  );
};

export default function Achievements() {
  const { user, isAuthenticated, updateUserData } = useAuth();
  const [allGames, setAllGames] = useState([]);
  const [localAchievements, setLocalAchievements] = useState({});
  const [selectedGame, setSelectedGame] = useState(null);
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trackedAchievements, setTrackedAchievements] = useState([]);
  const [challengeModalOpen, setChallengeModalOpen] = useState(false);
  const [achievementToChallenge, setAchievementToChallenge] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [activeGenre, setActiveGenre] = useState('All');
  const [isGenreOpen, setIsGenreOpen] = useState(true);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        let games = [];
        try {
          games = await Game.list();
        } catch (err) {
          console.error('Error fetching games:', err);
        }

        let achievements = [];
        try {
          achievements = await Achievement.list();
        } catch (err) {
          console.error('Error fetching achievements:', err);
        }

        const ownedGameIds = new Set(user?.purchased_items || []);
        let userGames;

        if (isAuthenticated && ownedGameIds.size > 0) {
          const dbOwnedGames = games.filter((g) => ownedGameIds.has(g.id));
          const mockOwnedGames = Object.values(allMockGames).filter((g) => ownedGameIds.has(g.id));
          const combined = [...dbOwnedGames, ...mockOwnedGames];
          userGames = Array.from(new Map(combined.map((g) => [g.id, g])).values());
        } else {
          // If no purchases, show all mock games + DB games
          const combined = [...games, ...Object.values(allMockGames)];
          userGames = Array.from(new Map(combined.map((g) => [g.id, g])).values());
        }

        setAllGames(userGames);
        if (userGames.length > 0) setSelectedGame(userGames[0]);

        const achievementsByGame = {};
        achievements.forEach((ach) => {
          if (!achievementsByGame[ach.game]) {
            achievementsByGame[ach.game] = [];
          }
          achievementsByGame[ach.game].push(ach);
        });
        setLocalAchievements(achievementsByGame);
        setTrackedAchievements(user?.tracked_achievements || []);

      } catch (error) {
        console.error("Error fetching achievement data:", error);
        setError(error.message);
        setAllGames(Object.values(allMockGames)); // Fallback
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, isAuthenticated]);

  const handleTrackAchievement = useCallback(async (achievement) => {
    if (!isAuthenticated || !user) return;
    try {
      const isCurrentlyTracked = trackedAchievements.includes(achievement.id);
      const newTracked = isCurrentlyTracked ?
      trackedAchievements.filter((id) => id !== achievement.id) :
      [...trackedAchievements, achievement.id];

      setTrackedAchievements(newTracked);
      await updateUserData({ tracked_achievements: newTracked });
    } catch (err) {
      console.error('Error tracking achievement:', err);
    }
  }, [isAuthenticated, user, updateUserData, trackedAchievements]);

  const handleShareAchievement = async (achievement) => {
    // Share logic preserved
    if (!user) return;
    try {
      const aiResponse = await base44.functions.invoke('communityAI', {
        action: 'generate_achievement_post',
        data: {
          achievement: achievement,
          game: achievement.game,
          user_name: user.username || user.full_name
        }
      });

      await base44.entities.Post.create({
        title: `I unlocked ${achievement.title}!`,
        content: aiResponse.data.content,
        type: 'achievement_share',
        community: 'general',
        game_title: achievement.game,
        achievement_id: achievement.id,
        achievement_data: achievement,
        is_ai_generated: true,
        score: 0
      });
      alert("Shared to community feed!");
    } catch (error) {
      console.error("Error sharing achievement:", error);
    }
  };

  const handleChallenge = (achievement) => {
    setAchievementToChallenge(achievement);
    setChallengeModalOpen(true);
  };

  const filteredGames = useMemo(() => {
    if (isLoading || !allGames) return [];
    return allGames.filter((game) => {
      const genreMatch = activeGenre === 'All' || !activeGenre || game.genre?.toLowerCase().includes(activeGenre.toLowerCase());
      const searchMatch = searchTerm === '' || game.title.toLowerCase().includes(searchTerm.toLowerCase());
      return genreMatch && searchMatch;
    });
  }, [allGames, activeGenre, searchTerm, isLoading]);

  const gameAchievements = useMemo(() => {
    if (!selectedGame || !localAchievements[selectedGame.title]) return [];
    return localAchievements[selectedGame.title];
  }, [selectedGame, localAchievements]);

  const tradingCards = useMemo(() => {
    if (!selectedGame) return [];
    return Array.from({ length: 12 }, (_, i) => ({
      id: `card-${selectedGame.id}-${i}`,
      title: `${selectedGame.title} Card ${i + 1}`,
      series: selectedGame.title,
      rarity: ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic'][Math.floor(Math.random() * 5)],
      image: selectedGame.cover_image || selectedGame.cover,
      description: `A collectible trading card from ${selectedGame.title}.`,
      stats: { strength: Math.floor(Math.random() * 100), magic: Math.floor(Math.random() * 100) }
    }));
  }, [selectedGame]);

  const genres = useMemo(() => {
    const g = new Set(allGames.map(game => game.genre).filter(Boolean));
    return ['All', ...Array.from(g)];
  }, [allGames]);

  return (
    <div className="h-screen w-full bg-[#0f172a] text-slate-200 overflow-hidden relative font-sans selection:bg-blue-500/30">
      {/* Ambient Glow */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay" />
        <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-blue-500/10 via-purple-500/5 to-transparent blur-3xl" />
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-t from-indigo-500/10 via-blue-500/5 to-transparent blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col h-full p-6 md:p-8">
        
        {/* Main Layout: 2 Columns */}
        <div className="flex gap-8 h-full overflow-hidden">
          
          {/* Left Sidebar (Shiny Box) */}
          <div className="w-[320px] flex-shrink-0 h-full flex flex-col gap-6">
            
            {/* Header with Speaker Icon */}
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black tracking-tighter text-white flex items-center gap-2">
                Achievements <Volume2 className="w-6 h-6 text-blue-400" />
              </h1>
            </div>

            {/* Shiny Box Container */}
            <ShinySidebarBox className="flex-1 flex flex-col p-5">
              
              {/* Search with Mic */}
              <div className="relative group mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-white/60 transition-colors" />
                <input
                  type="text"
                  placeholder="Search games..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-10 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all backdrop-blur-xl"
                />
                <button className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition-all">
                  <MicIcon className="w-4 h-4" />
                </button>
              </div>

              {/* Genre Filters */}
              <div className="mb-4">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {genres.slice(0, 5).map(genre => (
                    <button
                      key={genre}
                      onClick={() => setActiveGenre(genre)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase whitespace-nowrap transition-all ${
                        activeGenre === genre 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
              </div>

              {/* Game List */}
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2">
                {filteredGames.map(game => (
                  <motion.button
                    key={game.id}
                    onClick={() => {
                        setSelectedGame(game);
                        setSelectedAchievement(null);
                    }}
                    className={`group w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                        selectedGame?.id === game.id 
                        ? 'bg-white/10 shadow-lg border border-white/10' 
                        : 'hover:bg-white/5 border border-transparent'
                    }`}
                    whileHover={{ x: 4 }}
                  >
                    {/* Small Box (Image) */}
                    <div className="w-12 h-12 rounded-lg bg-black/50 overflow-hidden flex-shrink-0 border border-white/10 group-hover:border-white/30 transition-colors">
                      <img src={game.cover_image || game.cover} alt="" className="w-full h-full object-cover" />
                    </div>
                    
                    {/* Name */}
                    <div className="flex-1 text-left overflow-hidden">
                      <h3 className={`font-bold text-sm truncate ${selectedGame?.id === game.id ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>
                        {game.title}
                      </h3>
                      <p className="text-xs text-slate-500 truncate">{game.genre}</p>
                    </div>

                    {selectedGame?.id === game.id && (
                        <div className="w-1 h-8 bg-blue-500 rounded-full" />
                    )}
                  </motion.button>
                ))}
              </div>

            </ShinySidebarBox>
          </div>

          {/* Right Content: Achievements Grid (Cards) */}
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {selectedGame ? (
              <>
                <div className="mb-6 flex items-end gap-6">
                    <div className="w-24 h-32 rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-black/50 hidden md:block">
                        <img src={selectedGame.cover_image} className="w-full h-full object-cover" alt={selectedGame.title} />
                    </div>
                    <div>
                        <h2 className="text-4xl font-black text-white mb-2">{selectedGame.title}</h2>
                        <div className="flex items-center gap-4 text-slate-400 text-sm">
                            <span className="flex items-center gap-1"><Layers className="w-4 h-4" /> {tradingCards.length} Trading Cards</span>
                            <span className="flex items-center gap-1"><Sparkles className="w-4 h-4" /> Collect & Upgrade</span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar pb-20">
                    {tradingCards.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {tradingCards.map((card, i) => (
                                <div key={card.id} className="aspect-[2.5/3.5]">
                                    <ShinyCard index={i} onClick={() => setSelectedCard(card)}>
                                        <div className="absolute inset-0 flex flex-col p-3">
                                            <div className="relative w-full h-3/5 rounded-lg overflow-hidden mb-2 border border-white/10">
                                                <img src={card.image} alt={card.title} className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                            </div>
                                            <div className="flex-1 flex flex-col justify-between">
                                                <div>
                                                    <h3 className="text-white font-bold text-xs leading-tight mb-1 line-clamp-2">{card.title}</h3>
                                                    <div className="flex gap-1 flex-wrap">
                                                        <Badge variant="outline" className={`text-[9px] h-4 px-1 border ${
                                                            card.rarity === 'Legendary' ? 'border-orange-500/50 text-orange-400' :
                                                            card.rarity === 'Epic' ? 'border-purple-500/50 text-purple-400' :
                                                            card.rarity === 'Rare' ? 'border-blue-500/50 text-blue-400' :
                                                            'border-slate-500/50 text-slate-400'
                                                        }`}>
                                                            {card.rarity}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </ShinyCard>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-64 flex flex-col items-center justify-center text-slate-500">
                            <Layers className="w-16 h-16 mb-4 opacity-20" />
                            <p className="text-lg font-medium">No trading cards found</p>
                        </div>
                    )}
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 border border-dashed border-white/10 rounded-3xl bg-white/[0.02]">
                <Gamepad2 className="w-24 h-24 mb-6 opacity-20" />
                <h2 className="text-2xl font-bold text-slate-400 mb-2">Select a Game</h2>
                <p className="max-w-md text-center">Choose a game from the sidebar to view your collection of achievements and trading cards.</p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Detail Overlay */}
      <AnimatePresence>
        {selectedAchievement && (
          <AchievementDetailOverlay
            achievement={selectedAchievement}
            onClose={() => setSelectedAchievement(null)}
            onTrack={handleTrackAchievement}
            isTracked={trackedAchievements.includes(selectedAchievement.id)}
            onShare={handleShareAchievement}
            onChallenge={handleChallenge} 
          />
        )}
      </AnimatePresence>

      {/* Challenge Modal */}
      {achievementToChallenge && (
        <ChallengeFriendModal
          achievement={achievementToChallenge}
          isOpen={challengeModalOpen}
          onClose={() => setChallengeModalOpen(false)} 
        />
      )}
    </div>
  );
}