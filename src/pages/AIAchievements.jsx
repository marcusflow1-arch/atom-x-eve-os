import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Trophy, Search, Filter, ChevronRight,
  Check, X, ArrowLeft, Gamepad2, Sparkles, Zap, Layers,
  ChevronDown, Mic as MicIcon, LayoutGrid, DollarSign, Hammer,
  MessageSquare, Users, Star, TrendingUp, BookOpen, Swords, Crown, Target, Settings, Calendar
} from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useAuth } from '../components/auth/AuthContext';
import { allMockGames } from '../components/store/mockData';
import AchievementDetailOverlay from '../components/achievements/AchievementDetailOverlay';
import ChallengeFriendModal from '../components/community/ChallengeFriendModal';
import CardEnhancementOverlay from '../components/profile/CardEnhancementOverlay';
import SkillTreeOverlay from '../components/achievements/SkillTreeOverlay';
import BlacksmithOverlay from '../components/achievements/BlacksmithOverlay';
import ShinyCard from '../components/shared/ShinyCard';
import MysteryCardDetail from '../components/streaming/MysteryCardDetail';
import AdvancedModel3DViewer from '../components/3d/AdvancedModel3DViewer';
import ReviewCard from '@/components/reviews/ReviewCard';
import ReviewComposer from '@/components/reviews/ReviewComposer';
import ReviewInsights from '@/components/reviews/ReviewInsights';
import LiveReviewFeed from '@/components/reviews/LiveReviewFeed';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

// --- Quick Action Box Component ---
const QuickActionBox = ({ icon: Icon, label, onClick, color = 'cyan' }) => {
  const colorClasses = {
    cyan: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 hover:border-cyan-400/50 text-cyan-300',
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30 hover:border-purple-400/50 text-purple-300',
    orange: 'from-orange-500/20 to-orange-600/10 border-orange-500/30 hover:border-orange-400/50 text-orange-300',
    green: 'from-green-500/20 to-green-600/10 border-green-500/30 hover:border-green-400/50 text-green-300',
    yellow: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30 hover:border-yellow-400/50 text-yellow-300',
    red: 'from-red-500/20 to-red-600/10 border-red-500/30 hover:border-red-400/50 text-red-300',
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30 hover:border-blue-400/50 text-blue-300',
    pink: 'from-pink-500/20 to-pink-600/10 border-pink-500/30 hover:border-pink-400/50 text-pink-300',
  };

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`
        relative w-full aspect-square rounded-2xl overflow-hidden
        bg-gradient-to-br ${colorClasses[color]}
        border backdrop-blur-md
        flex flex-col items-center justify-center gap-2
        transition-all duration-300 group
      `}
      style={{
        boxShadow: '0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
      }}
    >
      <Icon className="w-8 h-8 group-hover:scale-110 transition-transform" />
      <span className="text-xs font-bold uppercase tracking-wider text-center px-2">{label}</span>
    </motion.button>
  );
};

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

// --- Skill Node Component for Skill Tree ---
const SkillNode = ({ icon: Icon, name, sp, unlocked, color = 'purple', ultimate = false }) => {
  const colorStyles = {
    purple: {
      bg: unlocked ? 'bg-purple-500/30' : 'bg-white/10',
      border: unlocked ? 'border-purple-400/50' : 'border-white/20',
      text: unlocked ? 'text-purple-300' : 'text-white/40',
      glow: unlocked ? 'shadow-[0_0_15px_rgba(168,85,247,0.4)]' : ''
    },
    cyan: {
      bg: unlocked ? 'bg-cyan-500/30' : 'bg-white/10',
      border: unlocked ? 'border-cyan-400/50' : 'border-white/20',
      text: unlocked ? 'text-cyan-300' : 'text-white/40',
      glow: unlocked ? 'shadow-[0_0_15px_rgba(34,211,238,0.4)]' : ''
    }
  };

  const styles = colorStyles[color];

  return (
    <div className="flex flex-col items-center gap-1">
      <motion.div
        whileHover={{ scale: 1.1 }}
        className={`relative ${ultimate ? 'w-16 h-16' : 'w-12 h-12'} rounded-xl ${styles.bg} ${styles.border} border-2 flex items-center justify-center cursor-pointer transition-all ${styles.glow}`}
      >
        <Icon className={`${ultimate ? 'w-7 h-7' : 'w-5 h-5'} ${styles.text}`} />
        {unlocked && (
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center border border-white/30">
            <Check className="w-2.5 h-2.5 text-white" />
          </div>
        )}
      </motion.div>
      <span className={`text-[10px] font-medium ${unlocked ? 'text-white/70' : 'text-white/30'}`}>{name}</span>
      <span className={`text-[9px] px-1.5 py-0.5 rounded ${unlocked ? (color === 'purple' ? 'bg-purple-500/20 text-purple-300' : 'bg-cyan-500/20 text-cyan-300') : 'bg-white/10 text-white/40'}`}>
        {sp} SP
      </span>
    </div>
  );
};

function AIAchievementsView({ onClosePage }) {
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
  
  // Skill Tree Mode toggle
  const [skillTreeMode, setSkillTreeMode] = useState(false);
  const [skillTreeCard, setSkillTreeCard] = useState(null);
  
  // Blacksmith Mode toggle
  const [blacksmithMode, setBlacksmithMode] = useState(false);
  const [blacksmithCard, setBlacksmithCard] = useState(null);

  // Settings overlay state
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Path subpage state
  const [activePathTab, setActivePathTab] = useState('power'); // 'power' or 'ai'

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [activeGenre, setActiveGenre] = useState('All');

  // Calculate Total Score
  const totalScore = useMemo(() => {
    if (!user?.unlocked_achievements || !localAchievements) return 0;
    let score = 0;
    Object.values(localAchievements).flat().forEach(ach => {
      if (user.unlocked_achievements.includes(ach.id)) {
        score += (ach.points || 0);
      }
    });
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
        setAllGames(Object.values(allMockGames));
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

  const [userCards, setUserCards] = useState([]);
  const [gameReviews, setGameReviews] = useState([]);
  const [userReactions, setUserReactions] = useState({});
  const [showReviewPanel, setShowReviewPanel] = useState(false);

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

  useEffect(() => {
    const fetchReviews = async () => {
      if (!selectedGame) return;
      
      try {
        const reviews = await base44.entities.Post.filter({ 
          type: 'game_review',
          game_title: selectedGame.title 
        }, '-created_date');
        setGameReviews(reviews);
      } catch (error) {
        console.error('Failed to fetch reviews:', error);
      }
    };

    fetchReviews();
  }, [selectedGame]);

  useEffect(() => {
    const fetchUserReactions = async () => {
      if (!isAuthenticated || !user) return;
      try {
        const allUserReactions = await base44.entities.Reaction.filter({
          created_by: user.email
        });
        const reactionsMap = {};
        allUserReactions.forEach(r => {
          reactionsMap[r.target_id] = r.type;
        });
        setUserReactions(reactionsMap);
      } catch (err) {
        console.error('Failed to fetch reactions:', err);
      }
    };
    fetchUserReactions();
  }, [isAuthenticated, user]);

  const handleReaction = async (reviewId, reactionType) => {
    if (!isAuthenticated) return;
    
    try {
      const existingReactions = await base44.entities.Reaction.filter({
        target_id: reviewId,
        created_by: user.email
      });
      
      if (existingReactions.length > 0) {
        const existingReaction = existingReactions[0];
        if (existingReaction.type === reactionType) {
          await base44.entities.Reaction.delete(existingReaction.id);
        } else {
          await base44.entities.Reaction.update(existingReaction.id, { type: reactionType });
        }
      } else {
        await base44.entities.Reaction.create({
          target_id: reviewId,
          target_type: 'post',
          type: reactionType
        });
      }
      
      const allUserReactions = await base44.entities.Reaction.filter({
        created_by: user.email
      });
      const reactionsMap = {};
      allUserReactions.forEach(r => {
        reactionsMap[r.target_id] = r.type;
      });
      setUserReactions(reactionsMap);
    } catch (err) {
      console.error('Failed to react:', err);
    }
  };

  const handleSubmitReview = async (reviewData) => {
    if (!isAuthenticated || !selectedGame) return;
    
    try {
      await base44.entities.Post.create({
        title: `Review: ${selectedGame.title}`,
        content: reviewData.content,
        type: 'game_review',
        game_title: selectedGame.title,
        genre: selectedGame.genre,
        rating: reviewData.rating,
        community: 'reviews'
      });
      
      const reviews = await base44.entities.Post.filter({ 
        type: 'game_review',
        game_title: selectedGame.title 
      }, '-created_date');
      setGameReviews(reviews);
    } catch (err) {
      console.error('Failed to submit review:', err);
    }
  };

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

  // Layered Escape key handling
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (blacksmithCard) {
          setBlacksmithCard(null);
        } else if (skillTreeCard) {
          setSkillTreeCard(null);
        } else if (selectedCard) {
          setSelectedCard(null);
        } else if (selectedAchievement) {
          setSelectedAchievement(null);
        } else if (onClosePage) {
          onClosePage();
        } else {
          navigate(createPageUrl('LunaTemplate'));
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [blacksmithCard, skillTreeCard, selectedCard, selectedAchievement, onClosePage, navigate]);

  return (
    <div className="min-h-screen w-full text-slate-200 relative font-sans selection:bg-blue-500/30" style={{ background: 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 25%, #0d1117 50%, #1a1f2e 75%, #0f1419 100%)' }}>
      
      {/* Ambient Glow */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay" />
        <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-cyan-500/8 via-purple-500/4 to-transparent blur-3xl" />
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-t from-blue-500/8 via-cyan-500/4 to-transparent blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col p-6 md:p-8 pt-24">
        
        {/* Main Layout: 2 Columns */}
        <div className="flex gap-6 flex-1 overflow-hidden">
          
          {/* LEFT COLUMN: Library + Game Banner below */}
          <div className="w-[320px] flex-shrink-0 h-full flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black tracking-tighter text-white">
                Library
              </h1>
            </div>
            


            {/* Library Section - Now at top, takes most space */}
            <ShinySidebarBox className="flex-1 flex flex-col p-5 min-h-0">
              
              {/* Search with Mic */}
              <div className="relative group mb-4">
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

            {/* Game Banner Section - Below Library */}
            <div className="mt-2">
              <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-3">Game Banner</h3>
              <div className="h-[80px] rounded-xl overflow-hidden border border-white/10 bg-white/5 relative cursor-pointer hover:border-cyan-400/30 transition-all">
                <img 
                  src={selectedGame?.cover_image || selectedGame?.cover || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800'} 
                  alt="Game Banner" 
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-2 left-3">
                  <p className="text-white font-bold text-sm">{selectedGame?.title || 'Select a Game'}</p>
                </div>
              </div>
            </div>

            {/* Settings & Calendar Row - Above Quick Actions */}
            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={() => setSettingsOpen(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-white/70 hover:text-white"
              >
                <Settings className="w-4 h-4" />
                <span className="text-xs font-medium">Settings</span>
              </button>
              <button
                onClick={() => navigate(createPageUrl('LunaTemplate') + '?panel=calendar')}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-white/70 hover:text-white"
              >
                <Calendar className="w-4 h-4" />
                <span className="text-xs font-medium">Calendar</span>
              </button>
            </div>

            {/* Quick Action Boxes - Below Game Banner */}
            <div className="grid grid-cols-4 gap-2">
              <QuickActionBox 
                icon={Users} 
                label="Friends" 
                color="cyan"
                onClick={() => navigate(createPageUrl('Friends'))}
              />
              <QuickActionBox 
                icon={Layers} 
                label="Skill Tree" 
                color="purple"
                onClick={() => navigate(createPageUrl('GenreMastery'))}
              />
              <QuickActionBox 
                icon={BookOpen} 
                label="AI Story" 
                color="blue"
                onClick={() => navigate(createPageUrl('AIStory'))}
              />
              <QuickActionBox 
                icon={Swords} 
                label="AI Battle" 
                color="red"
                onClick={() => navigate(createPageUrl('AIBattle'))}
              />
              <QuickActionBox 
                icon={Crown} 
                label="Season Pass" 
                color="yellow"
                onClick={() => navigate(createPageUrl('SeasonalPass'))}
              />
              <QuickActionBox 
                icon={Trophy} 
                label="Achievements" 
                color="orange"
                onClick={() => navigate(createPageUrl('Achievements'))}
              />
              <QuickActionBox 
                icon={Target} 
                label="Leaderboard" 
                color="green"
                onClick={() => navigate(createPageUrl('Leaderboard'))}
              />
              <QuickActionBox 
                icon={Sparkles} 
                label="Memories" 
                color="pink"
                onClick={() => {}}
              />
            </div>
          </div>

          {/* RIGHT COLUMN: Card detail inline when selected; otherwise default view */}
          <div className="flex-1 flex gap-6 overflow-visible">
            {selectedCard ? (
              <div className="flex-1 min-h-0 overflow-hidden">
                <MysteryCardDetail card={selectedCard} onBack={() => setSelectedCard(null)} />
              </div>
            ) : selectedGame && tradingCards.length > 0 ? (
              <>
                {/* LEFT: Achievement Cards Grid */}
                <div className="flex-1 flex flex-col gap-6 overflow-visible">
                  {/* Achievement Cards Section */}
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <h3 className="text-sm font-bold text-white/80 uppercase tracking-wider mb-4">Achievement Cards</h3>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                      <div className="grid grid-cols-5 gap-3">
                        {tradingCards.map((card, i) => (
                          <button
                            key={card.id}
                            onClick={() => setSelectedCard(card)}
                            className="aspect-[2.5/3.5] rounded-lg overflow-hidden border border-white/10 hover:border-cyan-400/50 transition-all hover:shadow-lg hover:shadow-cyan-500/20 bg-black/30"
                          >
                            <img src={card.image} alt={card.title} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-2">
                              <h4 className="text-white font-bold text-[10px] leading-tight truncate">{card.title}</h4>
                              <Badge variant="outline" className={`text-[8px] h-3 px-0.5 border ${
                                card.rarity === 'Legendary' ? 'border-orange-500/50 text-orange-400' :
                                card.rarity === 'Epic' ? 'border-purple-500/50 text-purple-400' :
                                card.rarity === 'Rare' ? 'border-blue-500/50 text-blue-400' :
                                'border-slate-500/50 text-slate-400'
                              }`}>
                                {card.rarity}
                              </Badge>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* FAR RIGHT: Empty Space */}
                  <div className="w-[220px] flex-shrink-0 flex flex-col">
                    <ShinySidebarBox className="aspect-[2.5/3.5] w-full overflow-hidden p-0" />
                  </div>
                </div>

                {/* Skill Tree Box */}
                <ShinySidebarBox className="flex-1 flex flex-col overflow-hidden">
                  {/* Header Info */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/20">
                    <h3 className="text-sm font-bold text-white/80 uppercase tracking-wider">Skill Progression</h3>
                    <div className="flex items-center gap-3">
                      <div className="text-xs text-white/40">
                        <span className="text-purple-400 font-bold">1150</span> SP Available
                      </div>
                      <Badge variant="outline" className="text-[10px] border-white/10 bg-white/5">
                        {selectedGame.title}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex-1 flex overflow-hidden relative">
                    {/* LEFT COLUMN: Power Path */}
                    <div className="flex-1 flex flex-col border-r border-white/10 bg-gradient-to-b from-purple-500/[0.02] to-transparent">
                      <div className="p-4 text-center border-b border-white/5">
                        <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-purple-500/20 text-purple-300 mb-2">
                          <Swords className="w-4 h-4" />
                        </div>
                        <h3 className="text-sm font-bold text-white">Power Path</h3>
                        <p className="text-[10px] text-white/40">Strength & Combat</p>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                        <div className="flex flex-col items-center gap-4">
                          {/* Tier 1 */}
                          <div className="flex items-center justify-center">
                            <SkillNode icon={Zap} name="Power Strike" sp={100} unlocked={true} color="purple" />
                          </div>
                          <div className="w-0.5 h-6 bg-purple-500/50" />
                          
                          {/* Tier 2 */}
                          <div className="flex items-center gap-8 justify-center w-full">
                            <SkillNode icon={TrendingUp} name="Momentum" sp={100} unlocked={true} color="purple" />
                            <SkillNode icon={Zap} name="Surge" sp={100} unlocked={true} color="purple" />
                          </div>
                          <div className="flex items-center justify-center gap-16 w-full">
                            <div className="w-0.5 h-6 bg-purple-500/30" />
                            <div className="w-0.5 h-6 bg-purple-500/50" />
                          </div>
                          
                          {/* Tier 3 */}
                          <div className="flex items-center gap-8 justify-center w-full">
                            <SkillNode icon={Crown} name="Dominance" sp={250} unlocked={false} color="purple" />
                            <SkillNode icon={Swords} name="Fury" sp={250} unlocked={false} color="purple" />
                          </div>
                          <div className="flex items-center justify-center gap-16 w-full">
                            <div className="w-0.5 h-6 bg-white/10" />
                            <div className="w-0.5 h-6 bg-white/10" />
                          </div>
                          
                          {/* Tier 4 */}
                          <div className="flex items-center gap-8 justify-center w-full">
                            <SkillNode icon={Target} name="Precision" sp={500} unlocked={false} color="purple" />
                            <SkillNode icon={Swords} name="Rampage" sp={500} unlocked={false} color="purple" />
                          </div>
                          <div className="w-0.5 h-6 bg-white/10" />
                          
                          {/* Tier 5 */}
                          <SkillNode icon={Crown} name="Ascendant" sp={1000} unlocked={false} color="purple" ultimate />
                        </div>
                      </div>
                    </div>

                    {/* RIGHT COLUMN: AI Path */}
                    <div className="flex-1 flex flex-col bg-gradient-to-b from-cyan-500/[0.02] to-transparent">
                      <div className="p-4 text-center border-b border-white/5">
                        <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-300 mb-2">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <h3 className="text-sm font-bold text-white">AI Adaptation</h3>
                        <p className="text-[10px] text-white/40">Versatility & Behavior</p>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                        <div className="flex flex-col items-center gap-4 opacity-70">
                          {/* Tier 1 */}
                          <div className="flex items-center justify-center">
                            <SkillNode icon={Sparkles} name="Neural Link" sp={100} unlocked={false} color="cyan" />
                          </div>
                          <div className="w-0.5 h-6 bg-white/10" />
                          
                          {/* Tier 2 */}
                          <div className="flex items-center gap-8 justify-center w-full">
                            <SkillNode icon={TrendingUp} name="Adaptive" sp={100} unlocked={false} color="cyan" />
                            <SkillNode icon={Star} name="Instinct" sp={100} unlocked={false} color="cyan" />
                          </div>
                          <div className="flex items-center justify-center gap-16 w-full">
                            <div className="w-0.5 h-6 bg-white/10" />
                            <div className="w-0.5 h-6 bg-white/10" />
                          </div>
                          
                          {/* Tier 3 */}
                          <div className="flex items-center gap-8 justify-center w-full">
                            <SkillNode icon={BookOpen} name="Memory" sp={250} unlocked={false} color="cyan" />
                            <SkillNode icon={Target} name="Predict" sp={250} unlocked={false} color="cyan" />
                          </div>
                          <div className="flex items-center justify-center gap-16 w-full">
                            <div className="w-0.5 h-6 bg-white/10" />
                            <div className="w-0.5 h-6 bg-white/10" />
                          </div>
                          
                          {/* Tier 4 */}
                          <div className="flex items-center gap-8 justify-center w-full">
                            <SkillNode icon={Sparkles} name="Evolve" sp={500} unlocked={false} color="cyan" />
                            <SkillNode icon={Zap} name="Sync" sp={500} unlocked={false} color="cyan" />
                          </div>
                          <div className="w-0.5 h-6 bg-white/10" />
                          
                          {/* Tier 5 */}
                          <SkillNode icon={Sparkles} name="Transcend" sp={1000} unlocked={false} color="cyan" ultimate />
                        </div>
                      </div>
                    </div>
                  </div>
                </ShinySidebarBox>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 border border-dashed border-white/10 rounded-3xl bg-white/[0.02]">
                <Gamepad2 className="w-24 h-24 mb-6 opacity-20" />
                <h2 className="text-2xl font-bold text-slate-400 mb-2">Select a Game</h2>
                <p className="max-w-md text-center">Choose a game from the sidebar to view your collection.</p>
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


      {/* Skill Tree Overlay */}
      <AnimatePresence>
        {skillTreeCard && skillTreeMode && (
          <SkillTreeOverlay
            card={skillTreeCard}
            onClose={() => setSkillTreeCard(null)}
          />
        )}
      </AnimatePresence>

      {/* Blacksmith Overlay */}
      <AnimatePresence>
        {blacksmithCard && blacksmithMode && (
          <BlacksmithOverlay
            card={blacksmithCard}
            onClose={() => setBlacksmithCard(null)}
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

      {/* Settings Overlay */}
      <AnimatePresence>
        {settingsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/60 backdrop-blur-sm"
            onClick={() => setSettingsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl h-[70vh] rounded-3xl overflow-hidden"
              style={{
                background: 'rgba(100, 120, 140, 0.12)',
                backdropFilter: 'blur(30px) saturate(150%)',
                WebkitBackdropFilter: 'blur(30px) saturate(150%)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
              }}
            >
              {/* Close Button */}
              <button 
                onClick={() => setSettingsOpen(false)}
                className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 flex items-center justify-center text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Settings Content */}
              <div className="p-8 h-full flex flex-col">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                    <Settings className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Settings</h2>
                    <p className="text-white/50 text-sm">Configure your preferences</p>
                  </div>
                </div>

                <div className="flex-1 flex items-center justify-center text-white/30">
                  <p>Settings content coming soon...</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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

export default function AIAchievements({ onClose }) {
  return (
    <div className="h-screen w-full overflow-hidden relative">
      <AIAchievementsView onClosePage={onClose} />
    </div>
  );
}