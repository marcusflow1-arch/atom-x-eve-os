import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Trophy, Search, Filter, Mic, Volume2, ChevronRight,
  Check, X, ArrowLeft, Gamepad2, Sparkles, Layers,
  ChevronDown, Mic as MicIcon, LayoutGrid, DollarSign
} from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useAuth } from '../components/auth/AuthContext';
import { allMockGames } from '../components/store/mockData';
import AchievementDetailOverlay from '../components/achievements/AchievementDetailOverlay';
import ChallengeFriendModal from '../components/community/ChallengeFriendModal';
import CardEnhancementOverlay from '../components/profile/CardEnhancementOverlay';
import SkillTreeOverlay from '../components/achievements/SkillTreeOverlay';
import ShinyCard from '../components/shared/ShinyCard';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

// --- Shiny Sidebar Box Component ---
const ShinySidebarBox = ({ children, className = "" }) => {
  return (
    <motion.div
      className={`relative overflow-hidden rounded-2xl border shadow-2xl ${className}`}
      style={{
        background: 'rgba(100, 120, 140, 0.12)',
        backdropFilter: 'blur(20px) saturate(130%)',
        WebkitBackdropFilter: 'blur(20px) saturate(130%)',
        borderColor: 'rgba(255, 255, 255, 0.10)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)'
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

      {/* Animated Blue Light Corners */}
      <motion.div
        className="absolute bottom-0 left-0 w-16 h-16 pointer-events-none"
        animate={{
          boxShadow: [
            "0 0 0px rgba(59, 130, 246, 0)",
            "0 0 20px rgba(59, 130, 246, 0.8)",
            "0 0 0px rgba(59, 130, 246, 0)"
          ]
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        style={{
          borderLeft: "3px solid rgba(59, 130, 246, 0.6)",
          borderBottom: "3px solid rgba(59, 130, 246, 0.6)",
          borderBottomLeftRadius: "0.75rem"
        }}
      />
      <motion.div
        className="absolute top-0 right-0 w-16 h-16 pointer-events-none"
        animate={{
          boxShadow: [
            "0 0 0px rgba(59, 130, 246, 0)",
            "0 0 20px rgba(59, 130, 246, 0.8)",
            "0 0 0px rgba(59, 130, 246, 0)"
          ]
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        style={{
          borderRight: "3px solid rgba(59, 130, 246, 0.6)",
          borderTop: "3px solid rgba(59, 130, 246, 0.6)",
          borderTopRightRadius: "0.75rem"
        }}
      />
    </motion.div>
  );
};

function AchievementsView({ onExitToLibrary }) {
  const { user, isAuthenticated, updateUserData } = useAuth();
  const navigate = useNavigate();
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
  const [showGridMenu, setShowGridMenu] = useState(false);
  
  // View Mode: 'cross' (new Store-like) or 'classic' (old sidebar)
  const [viewMode, setViewMode] = useState('cross');
  
  // Skill Tree Mode toggle
  const [skillTreeMode, setSkillTreeMode] = useState(false);
  const [skillTreeCard, setSkillTreeCard] = useState(null);
  
  // Cross Interface Navigation State
  const [activeGameIndex, setActiveGameIndex] = useState(0);
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [activeGenre, setActiveGenre] = useState('All');
  const [isGenreOpen, setIsGenreOpen] = useState(true);

  // Calculate Total Score
  const totalScore = useMemo(() => {
    if (!user?.unlocked_achievements || !localAchievements) return 0;
    let score = 0;
    Object.values(localAchievements).flat().forEach(ach => {
      if (user.unlocked_achievements.includes(ach.id)) {
        score += (ach.points || 0);
      }
    });
    // Add base score if new user or for demo
    return score || 12450;
  }, [user, localAchievements]);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        let games = [];
        try {
          const gamesResponse = await base44.entities.Game.list();
          games = gamesResponse.data || gamesResponse;
        } catch (err) {
          console.error('Error fetching games:', err);
        }

        let achievements = [];
        try {
          const achievementsResponse = await base44.entities.Achievement.list();
          achievements = achievementsResponse.data || achievementsResponse;
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

  const [userCards, setUserCards] = useState([]);

  useEffect(() => {
    const fetchUserCards = async () => {
      if (!user || !selectedGame) return;
      
      try {
        const cards = await base44.entities.UserCard.filter({ 
          user_id: user.id,
          game_name: selectedGame.title 
        });
        setUserCards(cards);
      } catch (error) {
        console.error('Failed to fetch user cards:', error);
      }
    };

    fetchUserCards();
  }, [user, selectedGame]);

  const tradingCards = useMemo(() => {
    if (!selectedGame) return [];
    
    const gameAchievements = localAchievements[selectedGame.title] || [];
    const cards = [];

    gameAchievements.forEach(achievement => {
      if (achievement.reward) {
        const userCard = userCards.find(c => c.card_name === achievement.reward.name);
        const isUnlocked = user?.unlocked_achievements?.includes(achievement.id);
        
        cards.push({
          id: achievement.id,
          title: achievement.reward.name || achievement.title,
          series: selectedGame.title,
          rarity: achievement.rarity,
          image: selectedGame.cover_image || selectedGame.cover,
          description: achievement.reward.description || achievement.description,
          stats: achievement.reward.stats || {},
          isPurchased: userCard?.acquisition_method === 'purchased',
          isUnlocked: isUnlocked,
          purchasePrice: userCard?.purchase_price
        });
      }
    });

    return cards;
  }, [selectedGame, localAchievements, userCards, user]);

  const genres = useMemo(() => {
    const g = new Set(allGames.map(game => game.genre).filter(Boolean));
    return ['All', ...Array.from(g)];
  }, [allGames]);

  // Keyboard and wheel navigation for cross interface
  useEffect(() => {
    if (viewMode !== 'cross' || isLoading || filteredGames.length === 0) return;

    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      
      // Up/Down: Change game
      if (key === 'arrowup' || key === 'w') {
        e.preventDefault();
        if (activeGameIndex > 0) {
          setActiveGameIndex(prev => prev - 1);
          setActiveCardIndex(0);
        }
      } else if (key === 'arrowdown' || key === 's') {
        e.preventDefault();
        if (activeGameIndex < filteredGames.length - 1) {
          setActiveGameIndex(prev => prev + 1);
          setActiveCardIndex(0);
        }
      }
      // Left/Right: Change card
      else if (key === 'arrowleft' || key === 'a') {
        e.preventDefault();
        if (activeCardIndex > 0) {
          setActiveCardIndex(prev => prev - 1);
        }
      } else if (key === 'arrowright' || key === 'd') {
        e.preventDefault();
        const currentGame = filteredGames[activeGameIndex];
        const cards = generateCardsForGame(currentGame);
        if (activeCardIndex < cards.length - 1) {
          setActiveCardIndex(prev => prev + 1);
        }
      }
      // Enter: Select card
      else if (key === 'enter') {
        e.preventDefault();
        const currentGame = filteredGames[activeGameIndex];
        const cards = generateCardsForGame(currentGame);
        if (cards[activeCardIndex]) {
          setSelectedCard(cards[activeCardIndex]);
        }
      }
    };

    let lastWheelTime = 0;
    const WHEEL_COOLDOWN = 150;

    const handleWheel = (e) => {
      const now = Date.now();
      if (now - lastWheelTime < WHEEL_COOLDOWN) return;

      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey) {
        // Horizontal (Cards)
        if (e.deltaX > 0 || (e.shiftKey && e.deltaY > 0)) {
          const currentGame = filteredGames[activeGameIndex];
          const cards = generateCardsForGame(currentGame);
          if (activeCardIndex < cards.length - 1) {
            setActiveCardIndex(prev => prev + 1);
            lastWheelTime = now;
          }
        } else if (e.deltaX < 0 || (e.shiftKey && e.deltaY < 0)) {
          if (activeCardIndex > 0) {
            setActiveCardIndex(prev => prev - 1);
            lastWheelTime = now;
          }
        }
      } else {
        // Vertical (Games)
        if (e.deltaY > 0) {
          if (activeGameIndex < filteredGames.length - 1) {
            setActiveGameIndex(prev => prev + 1);
            setActiveCardIndex(0);
            lastWheelTime = now;
          }
        } else if (e.deltaY < 0) {
          if (activeGameIndex > 0) {
            setActiveGameIndex(prev => prev - 1);
            setActiveCardIndex(0);
            lastWheelTime = now;
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('wheel', handleWheel);
    };
  }, [viewMode, activeGameIndex, activeCardIndex, filteredGames, isLoading]);

  // Helper to generate cards for a game
  const generateCardsForGame = useCallback((game) => {
    if (!game) return [];
    return Array.from({ length: 12 }, (_, i) => ({
      id: `card-${game.id}-${i}`,
      title: `${game.title} Card ${i + 1}`,
      series: game.title,
      rarity: ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic'][Math.floor(Math.random() * 5)],
      image: game.cover_image || game.cover,
      description: `A collectible trading card from ${game.title}.`,
      stats: { strength: Math.floor(Math.random() * 100), magic: Math.floor(Math.random() * 100) }
    }));
  }, []);

  // Current game and cards for cross view
  const currentCrossGame = filteredGames[activeGameIndex];
  const currentCrossCards = useMemo(() => generateCardsForGame(currentCrossGame), [currentCrossGame, generateCardsForGame]);
  const activeCard = currentCrossCards[activeCardIndex];

  // Constants for positioning
  const ITEM_HEIGHT = 80;
  const CROSS_Y_VH = 40;

  return (
    <div className="h-screen w-full text-slate-200 overflow-hidden relative font-sans selection:bg-blue-500/30" style={{ background: 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 25%, #0d1117 50%, #1a1f2e 75%, #0f1419 100%)' }}>
      
      <AnimatePresence mode="wait">
        {viewMode === 'cross' ? (
          /* CROSS INTERFACE VIEW */
          <motion.div
            key="cross-interface"
            className="w-full h-full relative"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Dynamic Background */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentCrossGame?.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="absolute inset-0 z-0"
              >
                <div className="absolute inset-0 bg-transparent" />
                {currentCrossGame?.cover_image && (
                  <>
                    <img
                      src={currentCrossGame.cover_image || currentCrossGame.cover}
                      alt="bg"
                      className="w-full h-full object-cover opacity-40 blur-sm scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/40 to-transparent" />
                  </>
                )}
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[150px] mix-blend-screen" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px] mix-blend-screen" />
              </motion.div>
            </AnimatePresence>

            {/* Interface Layer */}
            <div className="relative z-10 w-full h-full">
              
              {/* Header with Game Name and Controls */}
              <div className="absolute top-8 left-12 flex items-center gap-4 z-30">
                <span className="text-white/90 font-bold text-lg uppercase tracking-wider">
                  {currentCrossGame?.title || 'Select a Game'}
                </span>
                
                {/* Grid View Toggle - 4 small squares */}
                <button
                  onClick={() => setViewMode('classic')}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 hover:border-white/30 transition-all"
                  title="Switch to Grid View"
                >
                  <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                    <div className="bg-white/60 hover:bg-white rounded-[2px]" />
                    <div className="bg-white/60 hover:bg-white rounded-[2px]" />
                    <div className="bg-white/60 hover:bg-white rounded-[2px]" />
                    <div className="bg-white/60 hover:bg-white rounded-[2px]" />
                  </div>
                </button>

                {/* Controller icon - Back to Games */}
                <button
                  onClick={() => navigate(createPageUrl('Store') + '?mode=games')}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 hover:border-white/30 transition-all"
                  title="Back to Games"
                >
                  <Gamepad2 className="w-5 h-5 text-white/80" />
                </button>

                {/* Skill Tree Mode Toggle */}
                <button
                  onClick={() => setSkillTreeMode(!skillTreeMode)}
                  className={`p-2 rounded-lg border transition-all ${
                    skillTreeMode 
                      ? 'bg-purple-500/30 border-purple-400/50 text-purple-300' 
                      : 'bg-white/10 hover:bg-white/20 border-white/10 hover:border-white/30 text-white/80'
                  }`}
                  title={skillTreeMode ? 'Exit Skill Tree Mode' : 'Enter Skill Tree Mode'}
                >
                  <Layers className="w-5 h-5" />
                </button>
              </div>

              {/* VERTICAL AXIS (Games) */}
              <div className="absolute top-0 bottom-0 left-16 w-48 flex flex-col items-center z-20 pointer-events-none">
                <motion.div
                  className="flex flex-col items-center gap-6 py-8 pointer-events-auto"
                  animate={{
                    y: `calc(${CROSS_Y_VH}vh - ${activeGameIndex * (ITEM_HEIGHT + 24)}px - ${ITEM_HEIGHT / 2}px)`
                  }}
                  transition={{ type: "spring", stiffness: 250, damping: 25 }}
                >
                  {filteredGames.map((game, idx) => {
                    const isActive = idx === activeGameIndex;
                    return (
                      <motion.div
                        key={game.id}
                        onClick={() => {
                          setActiveGameIndex(idx);
                          setActiveCardIndex(0);
                        }}
                        animate={{
                          scale: isActive ? 1.2 : 0.9,
                          opacity: isActive ? 1 : 0.3,
                          x: isActive ? 20 : 0
                        }}
                        className="flex flex-col items-center gap-2 cursor-pointer w-32"
                      >
                        <div className={`
                          w-16 h-16 rounded-2xl overflow-hidden transition-all duration-300
                          ${isActive
                            ? 'shadow-[0_0_30px_rgba(255,255,255,0.2)] border-2 border-white/40'
                            : 'border border-white/10'
                          }
                        `}>
                          <img
                            src={game.cover_image || game.cover}
                            alt={game.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className={`text-xs font-bold uppercase tracking-widest text-center truncate w-full ${isActive ? 'text-white' : 'text-transparent'}`}>
                          {game.title}
                        </span>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </div>

              {/* HORIZONTAL AXIS (Cards) */}
              <div className="absolute left-0 right-0 top-[40vh] -translate-y-1/2 h-80 z-10 flex items-center pointer-events-none">
                <motion.div
                  className="flex items-center gap-8 pl-64 pointer-events-auto"
                  animate={{
                    x: -activeCardIndex * (200 + 32)
                  }}
                  transition={{ type: "spring", stiffness: 250, damping: 25 }}
                >
                  {currentCrossCards.map((card, idx) => {
                    const isActive = idx === activeCardIndex;
                    return (
                      <motion.div
                        key={card.id}
                        onClick={() => {
                          setActiveCardIndex(idx);
                          if (isActive) {
                            if (skillTreeMode) {
                              setSkillTreeCard(card);
                            } else {
                              setSelectedCard(card);
                            }
                          }
                        }}
                        animate={{
                          scale: isActive ? 1.1 : 0.9,
                          opacity: isActive ? 1 : 0.4,
                          y: isActive ? 0 : 20
                        }}
                        className={`
                          w-[200px] aspect-[2.5/3.5] flex-shrink-0 rounded-xl relative overflow-hidden cursor-pointer
                          border transition-all duration-300 shadow-2xl
                          ${isActive
                            ? 'border-white/40 shadow-blue-500/20'
                            : 'border-white/5 bg-black/40'
                          }
                        `}
                      >
                        <ShinyCard index={idx}>
                          <div className="absolute inset-0 flex flex-col p-3">
                            <div className="relative w-full h-3/5 rounded-lg overflow-hidden mb-2 border border-white/10">
                              <img src={card.image} alt={card.title} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            </div>
                            <div className="flex-1 flex flex-col justify-between">
                              <div>
                                <h3 className="text-white font-bold text-xs leading-tight mb-1 line-clamp-2">{card.title}</h3>
                                <Badge variant="outline" className={`text-[9px] h-4 px-1 border ${
                                  card.rarity === 'Legendary' ? 'border-orange-500/50 text-orange-400' :
                                  card.rarity === 'Epic' ? 'border-purple-500/50 text-purple-400' :
                                  card.rarity === 'Rare' ? 'border-blue-500/50 text-blue-400' :
                                  card.rarity === 'Mythic' ? 'border-red-500/50 text-red-400' :
                                  'border-slate-500/50 text-slate-400'
                                }`}>
                                  {card.rarity}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </ShinyCard>
                        {isActive && (
                          <motion.div
                            layoutId="card-active-border"
                            className="absolute inset-0 border-4 border-white/60 rounded-xl z-20"
                            transition={{ duration: 0.2 }}
                          />
                        )}
                      </motion.div>
                    );
                  })}
                </motion.div>
              </div>

              {/* ACTIVE CARD DETAILS */}
              <div className="absolute bottom-16 left-64 max-w-2xl z-30 pointer-events-none">
                <AnimatePresence mode="wait">
                  {activeCard && (
                    <motion.div
                      key={activeCard.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center gap-3">
                        <Badge className="bg-white/10 backdrop-blur-md border-white/20 text-white">
                          {currentCrossGame?.genre || 'adventure'}
                        </Badge>
                        <Badge className={`backdrop-blur-md border ${
                          activeCard.rarity === 'Legendary' ? 'bg-orange-500/20 border-orange-500/40 text-orange-300' :
                          activeCard.rarity === 'Epic' ? 'bg-purple-500/20 border-purple-500/40 text-purple-300' :
                          activeCard.rarity === 'Rare' ? 'bg-blue-500/20 border-blue-500/40 text-blue-300' :
                          activeCard.rarity === 'Mythic' ? 'bg-red-500/20 border-red-500/40 text-red-300' :
                          'bg-slate-500/20 border-slate-500/40 text-slate-300'
                        }`}>
                          {activeCard.rarity}
                        </Badge>
                      </div>
                      <h1 className="text-5xl font-black text-white leading-tight drop-shadow-xl">
                        {activeCard.title}
                      </h1>
                      <p className="text-lg text-white/70 line-clamp-3 max-w-xl drop-shadow-md">
                        {activeCard.description}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        ) : (
          /* CLASSIC SIDEBAR VIEW */
          <motion.div
            key="classic-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full w-full"
          >
            {/* Ambient Glow */}
            <div className="absolute inset-0 z-0">
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay" />
              <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-cyan-500/8 via-purple-500/4 to-transparent blur-3xl" />
              <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-t from-blue-500/8 via-cyan-500/4 to-transparent blur-3xl" />
            </div>

            <div className="relative z-10 flex flex-col h-full p-6 md:p-8">
              
              {/* Main Layout: 2 Columns */}
              <div className="flex gap-8 h-full overflow-hidden">
                
                {/* Left Sidebar (Shiny Box) */}
                <div className="w-[320px] flex-shrink-0 h-full flex flex-col gap-6">
                  
                  {/* Header */}
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-black tracking-tighter text-white">
                      Achievements
                    </h1>
                    
                    {/* Cross View Toggle - 4 small squares grid icon */}
                    <motion.button
                      onClick={() => setViewMode('cross')}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="ml-auto w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center border border-white/15"
                      title="Switch to Cross View"
                    >
                      <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                        <div className="bg-white/80 rounded-[2px]" />
                        <div className="bg-white/80 rounded-[2px]" />
                        <div className="bg-white/80 rounded-[2px]" />
                        <div className="bg-white/80 rounded-[2px]" />
                      </div>
                    </motion.button>

                    {/* Controller icon - Back to Games */}
                    <motion.button
                      onClick={() => navigate(createPageUrl('Store') + '?mode=games')}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center border border-white/15"
                      title="Back to Games"
                    >
                      <Gamepad2 className="w-4 h-4 text-white/80" />
                    </motion.button>

                    {/* Skill Tree Mode Toggle */}
                    <motion.button
                      onClick={() => setSkillTreeMode(!skillTreeMode)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                        skillTreeMode 
                          ? 'bg-purple-500/30 border-purple-400/50 text-purple-300' 
                          : 'bg-white/10 hover:bg-white/20 border-white/15 text-white/80'
                      }`}
                      title={skillTreeMode ? 'Exit Skill Tree Mode' : 'Enter Skill Tree Mode'}
                    >
                      <Layers className="w-4 h-4" />
                    </motion.button>
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

                    {/* Genre Filters - Liquid Glass Dropdown */}
                    <div className="mb-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold text-white transition-all focus:outline-none bg-white/10 backdrop-blur-md border border-white/20 shadow-[0_4px_30px_rgba(0,0,0,0.1)] hover:bg-white/20">
                            <span>{activeGenre === 'All' ? 'All Genres' : activeGenre}</span>
                            <ChevronDown className="w-4 h-4 text-white/70" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent 
                          className="w-[280px] bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-xl p-1 text-white z-50 max-h-60 overflow-y-auto custom-scrollbar"
                          style={{ background: 'rgba(30, 41, 59, 0.7)' }}
                        >
                          {genres.map((genre) => (
                            <DropdownMenuItem
                              key={genre}
                              onClick={() => setActiveGenre(genre)}
                              className={`cursor-pointer rounded-lg px-3 py-2 text-sm font-medium transition-colors focus:bg-white/10 focus:text-white ${
                                activeGenre === genre ? 'bg-blue-600/30 text-blue-200' : 'text-slate-300 hover:text-white'
                              }`}
                            >
                              {genre}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
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
                          className={`group w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 border ${
                              selectedGame?.id === game.id 
                              ? 'shadow-lg border-cyan-400/30' 
                              : 'hover:border-cyan-400/20 border-transparent'
                          }`}
                          style={selectedGame?.id === game.id ? {
                            background: 'rgba(34, 211, 238, 0.12)',
                            boxShadow: '0 0 12px rgba(34, 211, 238, 0.15)'
                          } : {
                            background: 'transparent'
                          }}
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
                      <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar pb-20">
                          {tradingCards.length > 0 ? (
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                                  {tradingCards.map((card, i) => (
                                      <div key={card.id} className="aspect-[2.5/3.5]">
                                          <ShinyCard index={i} onClick={() => {
                                            if (skillTreeMode) {
                                              setSkillTreeCard(card);
                                            } else {
                                              setSelectedCard(card);
                                            }
                                          }}>
                                             <div className="absolute inset-0 flex flex-col p-3">
                                                 <div className="relative w-full h-3/5 rounded-lg overflow-hidden mb-2 border border-white/10">
                                                     <img src={card.image} alt={card.title} className="w-full h-full object-cover" />
                                                     <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                                     {card.isPurchased && !card.isUnlocked && (
                                                       <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-green-500/90 backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-lg">
                                                         <DollarSign className="w-4 h-4 text-white" />
                                                       </div>
                                                     )}
                                                 </div>
                                                 <div className="flex-1 flex flex-col justify-between">
                                                     <div>
                                                         <h3 className="text-white font-bold text-xs leading-tight mb-1 line-clamp-2">{card.title}</h3>
                                                         <div className="flex gap-1 flex-wrap">
                                                             <Badge variant="outline" className={`text-[9px] h-4 px-1 border ${
                                                                 card.rarity === 'Legendary' ? 'border-orange-500/50 text-orange-400' :
                                                                 card.rarity === 'Epic' ? 'border-purple-500/50 text-purple-400' :
                                                                 card.rarity === 'Rare' ? 'border-blue-500/50 text-blue-400' :
                                                                 card.rarity === 'Mythic' ? 'border-red-500/50 text-red-400' :
                                                                 'border-slate-500/50 text-slate-400'
                                                             }`}>
                                                                 {card.rarity}
                                                             </Badge>
                                                             {card.isPurchased && (
                                                               <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[9px] h-4 px-1">
                                                                 BOUGHT
                                                               </Badge>
                                                             )}
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
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* Card Enhancement Overlay */}
      <AnimatePresence>
        {selectedCard && (
          <CardEnhancementOverlay
            card={selectedCard}
            onClose={() => setSelectedCard(null)}
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

      {/* Floating Score Display */}
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-8 right-8 z-50 flex items-center gap-3 bg-black/40 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 shadow-2xl"
      >
        <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30">
          <Trophy className="w-5 h-5 text-yellow-400" />
        </div>
        <div>
          <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Total Score</div>
          <div className="text-xl font-black text-white leading-none">{totalScore.toLocaleString()}</div>
        </div>
      </motion.div>

    </div>
  );
}

export default function Achievements({ onExitToLibrary }) {
  return (
    <div className="h-screen w-full overflow-hidden">
      <AchievementsView onExitToLibrary={onExitToLibrary} />
    </div>
  );
}