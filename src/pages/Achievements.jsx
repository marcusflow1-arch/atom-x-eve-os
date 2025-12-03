import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge'; // Added Badge import
import { 
  Award, Trophy, Star, Package, BrainCircuit, Heart, Search, Filter, Zap, Shield, Sword, ChevronRight, Mic, Bot,
  LayoutGrid, List, Check, X, ArrowLeft, Share2, Plus, Gamepad2, Users, Crown, Play, Sparkles, Target, Book // Added new icons
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../components/auth/AuthContext';
import { Achievement } from '@/entities/Achievement';
import { Game } from '@/entities/Game';
import { allMockGames } from '../components/store/mockData';
import GenreFilter from '../components/achievements/GenreFilter';
import AchievementSearch from '../components/achievements/AchievementSearch';
import TrackingPanel from '../components/achievements/TrackingPanel';
import AchievementDetailOverlay from '../components/achievements/AchievementDetailOverlay';
import AchievementFilterBar from '../components/achievements/AchievementFilterBar';
import { ThemeBackground, ThemeToggle } from '../components/shared/ThemeSystem';

const rarityStyles = {
  Common: { color: "text-slate-300", bg: "bg-slate-800/80", border: "border-slate-600" },
  Uncommon: { color: "text-green-400", bg: "bg-green-900/80", border: "border-green-500/80" },
  Rare: { color: "text-blue-400", bg: "bg-blue-900/80", border: "border-blue-500/80" },
  Epic: { color: "text-purple-400", bg: "bg-purple-900/80", border: "border-purple-500/80" },
  Legendary: { color: "text-orange-400", bg: "bg-orange-900/80", border: "border-orange-500/80" },
  Mythical: { color: "text-red-400", bg: "bg-red-900/80", border: "border-red-500/80" },
  Limitless: { color: "text-fuchsia-400", bg: "bg-fuchsia-900/80", border: "border-fuchsia-500/80" }
};

const GameCard = ({ game, onClick, isSelected }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    whileHover={{ scale: 1.03, y: -5 }}
    onClick={() => onClick(game)}
    className={`group relative rounded-xl overflow-hidden cursor-pointer bg-slate-800 border transition-all duration-300 ${
      isSelected ? 'border-blue-500/80 shadow-lg shadow-blue-500/20' : 'border-slate-700/50'
    }`}
    style={{ cursor: 'pointer' }}
  >
    <img src={game.cover_image} alt={game.title} className="w-full h-80 object-cover transition-transform duration-300 group-hover:scale-105" />
    <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />
    <div className="absolute bottom-0 p-4">
      <h3 className="font-bold text-lg text-white">{game.title}</h3>
      <p className="text-sm text-slate-400">{game.genre}</p>
    </div>
    {isSelected && (
      <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded text-xs font-bold">
        Selected
      </div>
    )}
  </motion.div>
);

const AchievementListItem = ({ achievement, onSelect, isUnlocked, isSelected }) => {
  const rarity = rarityStyles[achievement.rarity] || rarityStyles.Common;
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      whileHover={{ x: 5 }}
      onClick={() => onSelect(achievement)}
      className={`relative p-4 rounded-lg cursor-pointer transition-all duration-200 border-l-4 ${
        isSelected 
          ? `bg-slate-700/80 ${rarity.border} border-l-4` 
          : `bg-slate-800/40 hover:bg-slate-700/60 border-l-slate-600`
      } ${isUnlocked ? '' : 'opacity-60 grayscale'}`}
      style={{ cursor: 'pointer' }}
    >
      <div className="flex items-center gap-4">
        <div className="text-3xl">{achievement.icon}</div>
        <div className="flex-1 min-w-0">
          <h3 className={`font-bold text-base ${rarity.color} truncate`}>{achievement.title}</h3>
          <p className="text-sm text-slate-400 truncate">{achievement.description}</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge className={`text-xs ${rarity.bg} ${rarity.color}`}>
              {achievement.rarity}
            </Badge>
            <span className="text-yellow-400 font-semibold text-sm">{achievement.points} pts</span>
          </div>
        </div>
        {isUnlocked && <Check className="w-5 h-5 text-green-400 flex-shrink-0" />}
      </div>
    </motion.div>
  );
};

const AchievementDetailPanel = ({ achievement, isUnlocked, onTrack, isTracked, onClose }) => {
  if (!achievement) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-slate-500">
          <Trophy className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-semibold">Select an achievement</p>
          <p className="text-sm mt-2">Click an achievement from the list to view details</p>
        </div>
      </div>
    );
  }

  const rarity = rarityStyles[achievement.rarity] || rarityStyles.Common;
  
  // Mock video URL - in production this would come from the achievement data
  const videoUrl = achievement.video_url || 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1&controls=0&loop=1&playlist=dQw4w9WgXcQ';
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="h-full overflow-y-auto space-y-6 p-6 bg-slate-800/30 rounded-xl"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className={`text-6xl ${rarity.color}`}>{achievement.icon}</div>
          <div>
            <h2 className={`text-3xl font-black ${rarity.color} mb-2`}>{achievement.title}</h2>
            <div className="flex items-center gap-3">
              <Badge className={`${rarity.bg} ${rarity.color} ${rarity.border} border text-sm px-3 py-1`}>
                {achievement.rarity}
              </Badge>
              <Badge variant="outline" className="text-sm">
                {achievement.category}
              </Badge>
              <Badge variant="outline" className="text-sm text-yellow-400">
                {achievement.points} Points
              </Badge>
            </div>
          </div>
        </div>
        {isUnlocked && (
          <Badge className="bg-green-600 text-white px-3 py-1">
            <Check className="w-4 h-4 mr-1" /> Unlocked
          </Badge>
        )}
      </div>

      {/* Description */}
      <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
        <h3 className="text-white font-semibold mb-2">Description</h3>
        <p className="text-slate-300 leading-relaxed">{achievement.description}</p>
      </div>

      {/* Video Demonstration */}
      <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
          <Play className="w-5 h-5 text-blue-400" />
          Reward Demonstration
        </h3>
        <div className="aspect-video bg-black rounded-lg overflow-hidden">
          <iframe
            width="100%"
            height="100%"
            src={videoUrl}
            title="Achievement Reward Demo"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          ></iframe>
        </div>
      </div>

      {/* Reward Details */}
      {achievement.reward && (
        <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            Unlocked Rewards
          </h3>
          <div className="space-y-3">
            <div className="bg-slate-800/50 rounded-lg p-4 border border-blue-500/30">
              <div className="flex items-start gap-3">
                <div className="text-3xl">{achievement.reward.icon || '🎁'}</div>
                <div className="flex-1">
                  <h4 className="text-white font-semibold">{achievement.reward.name || `${achievement.title} Reward`}</h4>
                  <p className="text-sm text-slate-400 mt-1">
                    {achievement.reward.description || 'Special reward for unlocking this achievement'}
                  </p>
                  {achievement.reward.stats && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {Object.entries(achievement.reward.stats).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-2 text-sm" key={key}>
                          <ChevronRight className="w-3 h-3 text-green-400" />
                          <span className="text-slate-300">{key}: <span className="text-white font-semibold">+{value}</span></span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* How to Unlock */}
      <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
          <Target className="w-5 h-5 text-purple-400" />
          How to Unlock
        </h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-blue-400 font-bold text-sm">1</span>
            </div>
            <div>
              <p className="text-white font-medium">Complete the Required Challenge</p>
              <p className="text-slate-400 text-sm mt-1">{achievement.description}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-blue-400 font-bold text-sm">2</span>
            </div>
            <div>
              <p className="text-white font-medium">Achievement Automatically Unlocks</p>
              <p className="text-slate-400 text-sm mt-1">Once conditions are met, rewards are instantly granted</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-blue-400 font-bold text-sm">3</span>
            </div>
            <div>
              <p className="text-white font-medium">Claim Your Rewards</p>
              <p className="text-slate-400 text-sm mt-1">Access your new {achievement.category} in your arsenal</p>
            </div>
          </div>
        </div>
        
        <Button className="w-full mt-4 bg-purple-600 hover:bg-purple-700">
          <Book className="w-4 h-4 mr-2" />
          View Community Guides
        </Button>
      </div>

      {/* Progress Tracking */}
      {!isUnlocked && (
        <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold">Track Progress</h3>
            <Button
              onClick={() => onTrack(achievement)}
              variant={isTracked ? "outline" : "default"}
              size="sm"
              className={isTracked ? "border-blue-500 text-blue-400" : "bg-blue-600 hover:bg-blue-700"}
            >
              {isTracked ? '✓ Tracking' : 'Track Achievement'}
            </Button>
          </div>
          <p className="text-slate-400 text-sm">
            {isTracked 
              ? 'This achievement is being tracked. View progress in the tracking panel.'
              : 'Track this achievement to monitor your progress toward unlocking it.'}
          </p>
        </div>
      )}

      {/* Game Info */}
      <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
        <h3 className="text-white font-semibold mb-2">Game Information</h3>
        <div className="flex items-center gap-2">
          <Gamepad2 className="w-4 h-4 text-blue-400" />
          <span className="text-slate-300">{achievement.game}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default function Achievements() {
  const { user, isAuthenticated, updateUserData } = useAuth();
  const [allGames, setAllGames] = useState([]);
  const [localAchievements, setLocalAchievements] = useState({});
  const [selectedGame, setSelectedGame] = useState(null);
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTrackingPanelVisible, setIsTrackingPanelVisible] = useState(true);
  const [trackedAchievements, setTrackedAchievements] = useState([]);

  // DOM refs for positioning
  const gameBoxRef = useRef(null);
  const trackingPanelRef = useRef(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [rarityFilter, setRarityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeGenre, setActiveGenre] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedTheme, setSelectedTheme] = useState('royal_collection');

  // Fetch initial data safely with error handling
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch games with error handling
        let games = [];
        try {
          games = await Game.list();
        } catch (err) {
          console.error('Error fetching games from DB:', err);
          games = [];
        }
        
        // Fetch achievements with error handling
        let achievements = [];
        try {
          achievements = await Achievement.list();
        } catch (err) {
          console.error('Error fetching achievements from DB:', err);
          achievements = [];
        }
        
        const ownedGameIds = new Set(user?.purchased_items || []);
        let userGames;

        if (isAuthenticated && ownedGameIds.size > 0) {
            const dbOwnedGames = games.filter(g => ownedGameIds.has(g.id));
            const mockOwnedGames = Object.values(allMockGames).filter(g => ownedGameIds.has(g.id));
            const combined = [...dbOwnedGames, ...mockOwnedGames];
            userGames = Array.from(new Map(combined.map(g => [g.id, g])).values());
        } else {
            // If achievements failed to load, we can't filter by "games with achievements".
            // In this case, show all available mock games.
            if (achievements.length === 0) {
                userGames = Object.values(allMockGames);
            } else {
                const gamesWithAchievements = new Set(achievements.map(a => a.game));
                const dbGames = games.filter(g => gamesWithAchievements.has(g.title));
                const mockGames = Object.values(allMockGames).filter(g => gamesWithAchievements.has(g.title));
                const combined = [...dbGames, ...mockGames];
                userGames = Array.from(new Map(combined.map(g => [g.id, g])).values());
            }
        }
        
        setAllGames(userGames);
        
        // Organize achievements by game locally
        const achievementsByGame = {};
        achievements.forEach(ach => {
          if (!achievementsByGame[ach.game]) {
            achievementsByGame[ach.game] = [];
          }
          achievementsByGame[ach.game].push(ach);
        });
        setLocalAchievements(achievementsByGame);

        // Initialize tracked achievements from user data
        setTrackedAchievements(user?.tracked_achievements || []);

      } catch (error) {
        console.error("Error fetching achievement data:", error);
        setError(error.message || 'Failed to load achievements');
        // Fallback to mock data if a critical error occurred during the overall process
        setAllGames(Object.values(allMockGames));
        setLocalAchievements({});
      } finally {
        setIsLoading(false);
      }
    };
    
    // Add a small delay to ensure contexts are initialized
    const timeoutId = setTimeout(fetchData, 100);
    return () => clearTimeout(timeoutId);
  }, [user, isAuthenticated]);
  
  const handleTrackAchievement = useCallback(async (achievement) => {
    if (!isAuthenticated || !user) return;
    
    try {
      const isCurrentlyTracked = trackedAchievements.includes(achievement.id);
      const newTracked = isCurrentlyTracked 
        ? trackedAchievements.filter(id => id !== achievement.id)
        : [...trackedAchievements, achievement.id];
      
      setTrackedAchievements(newTracked);
      await updateUserData({ tracked_achievements: newTracked });
    } catch (err) {
      console.error('Error tracking achievement:', err);
      // Optionally, show a toast notification to the user
    }
  }, [isAuthenticated, user, updateUserData, trackedAchievements]);

  const handleUntrackAchievement = useCallback(async (achievementId) => {
    if (!isAuthenticated || !user) return;
    
    try {
      const newTracked = trackedAchievements.filter(id => id !== achievementId);
      setTrackedAchievements(newTracked);
      await updateUserData({ tracked_achievements: newTracked });
    } catch (err) {
      console.error('Error untracking achievement:', err);
      // Optionally, show a toast notification to the user
    }
  }, [isAuthenticated, user, updateUserData, trackedAchievements]);

  const handleGameSelect = (game) => {
    setSelectedGame(game);
    setSelectedAchievement(null);
    setSearchTerm('');
  };

  const filteredGames = useMemo(() => {
    if (isLoading || !allGames) return [];
    return allGames.filter(game => {
        const genreMatch = !activeGenre || game.genre?.toLowerCase().includes(activeGenre.toLowerCase());
        const searchMatch = searchTerm === '' || game.title.toLowerCase().includes(searchTerm.toLowerCase());
        return genreMatch && searchMatch;
    });
  }, [allGames, activeGenre, searchTerm, isLoading]);
  
  const gameAchievements = useMemo(() => {
    if (!selectedGame || !localAchievements[selectedGame.title]) return [];
    
    const achievementsForGame = localAchievements[selectedGame.title] || [];
    
    return achievementsForGame.filter(ach => {
      if (!ach) return false;
      
      const searchMatch = searchTerm === '' || ach.title?.toLowerCase().includes(searchTerm.toLowerCase());
      const rarityMatch = rarityFilter === 'all' || ach.rarity === rarityFilter;
      const unlocked = user?.unlocked_achievements?.includes(ach.id);
      const statusMatch = statusFilter === 'all' || 
                         (statusFilter === 'unlocked' && unlocked) || 
                         (statusFilter === 'locked' && !unlocked);
      const categoryMatch = categoryFilter === 'all' || ach.category === categoryFilter;
      
      return searchMatch && rarityMatch && statusMatch && categoryMatch;
    });
  }, [selectedGame, localAchievements, searchTerm, rarityFilter, statusFilter, categoryFilter, user]);

  const trackedAchievementDetails = useMemo(() => {
    if (!trackedAchievements.length) return [];
    
    const allAchievements = Object.values(localAchievements).flat();
    return trackedAchievements
      .map(id => allAchievements.find(ach => ach?.id === id))
      .filter(Boolean);
  }, [trackedAchievements, localAchievements]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900 text-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading Achievement Hub...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900 text-white">
        <div className="text-center max-w-md p-4 bg-slate-800 rounded-lg shadow-xl border border-red-700/50">
          <Trophy className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Error Loading Achievements</h2>
          <p className="text-slate-400 mb-4">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full text-white relative overflow-hidden" style={{ cursor: 'default' }}>
      <ThemeBackground themeId={selectedTheme} />
      <div className={`absolute top-4 z-50 transition-all duration-300 ${isTrackingPanelVisible ? 'right-[380px]' : 'right-4'}`}>
        <ThemeToggle selectedTheme={selectedTheme} onThemeSelect={setSelectedTheme} />
      </div>
      <style>{`
        /* Prevent flashing cursor on non-input elements */
        .bg-slate-900 * {
          user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          cursor: default;
        }
        
        /* Allow text selection and proper cursor only in input fields */
        input, textarea, [contenteditable="true"] {
          user-select: text !important;
          -webkit-user-select: text !important;
          -moz-user-select: text !important;
          -ms-user-select: text !important;
          cursor: text !important;
        }
        
        /* Proper cursor for clickable elements */
        button, [role="button"], a, .cursor-pointer {
          cursor: pointer !important;
        }

        /* Virtualized list for performance */
        .achievement-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 1rem;
          max-height: 60vh;
          overflow-y: auto;
          padding-right: 8px;
        }

        .achievement-grid::-webkit-scrollbar {
          width: 6px;
        }

        .achievement-grid::-webkit-scrollbar-track {
          background: rgba(51, 65, 85, 0.3);
          border-radius: 3px;
        }

        .achievement-grid::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.5);
          border-radius: 3px;
        }

        .achievement-grid::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.7);
        }
      `}</style>

      <div className={`relative z-10 transition-all duration-300 ${isTrackingPanelVisible ? 'pr-[360px]' : ''}`}>
        <AnimatePresence>
          {selectedAchievement && !selectedGame && ( // Only show overlay if no game is selected (global achievement view)
            <AchievementDetailOverlay 
              achievement={selectedAchievement} 
              onClose={() => setSelectedAchievement(null)}
              onTrack={handleTrackAchievement}
              isTracked={trackedAchievements.includes(selectedAchievement.id)}
            />
          )}
        </AnimatePresence>

        <div className="p-8">
          {!selectedGame ? (
            <>
              {/* Hero Message */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 text-center"
              >
                <h1 className="text-5xl font-black mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Build Your Legend
                </h1>
                <p className="text-xl text-slate-300 mb-2">
                  Every achievement unlocks <span className="text-yellow-400 font-bold">real abilities</span>, <span className="text-orange-400 font-bold">equipment</span>, and <span className="text-purple-400 font-bold">companions</span>
                </p>
                <p className="text-lg text-slate-400">
                  Your progress across all games builds your <span className="text-blue-400 font-semibold">persistent RPG character</span>
                </p>
              </motion.div>

              <h2 className="text-3xl font-black mb-4">Select a Game to View Achievements</h2>
              
              {/* Genre Filter */}
              <div className="flex items-center gap-4 mb-4">
                <GenreFilter activeGenre={activeGenre} onSelectGenre={setActiveGenre} />
              </div>

              {/* Main Search Bar with Voice Search */}
              <div className="mb-6">
                <AchievementSearch onSearch={setSearchTerm} />
              </div>

              {/* Achievement Tracking Toggle for main view */}
              <div className="flex justify-end mb-6">
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 bg-slate-800/50 backdrop-blur-sm hover:bg-blue-600/20 border border-blue-500/30 text-blue-400 hover:text-blue-300"
                    onClick={() => setIsTrackingPanelVisible(!isTrackingPanelVisible)}
                    style={{ cursor: 'pointer' }}
                >
                    <ChevronRight className={`w-4 h-4 mr-2 transition-transform ${!isTrackingPanelVisible ? 'rotate-180' : ''}`} />
                    Achievement Tracking
                </Button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {filteredGames.map(game => (
                  <div key={game.id} ref={game === selectedGame ? gameBoxRef : null}>
                    <GameCard 
                      game={game} 
                      onClick={handleGameSelect} 
                      isSelected={game === selectedGame}
                    />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[calc(100vh-64px)] flex flex-col"> {/* Adjusted height for sticky header/footer if present */}
              <Button variant="ghost" onClick={() => {
                  setSelectedGame(null);
                  setSearchTerm('');
                  setSelectedAchievement(null); // Clear selected achievement when going back to game list
              }} className="mb-4 self-start" style={{ cursor: 'pointer' }}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Game Library
              </Button>
              
              {/* Selected Game Display */}
              <div ref={gameBoxRef} className="mb-6">
                <h1 className="text-5xl font-black mb-2">{selectedGame.title} Achievements</h1>
                <p className="text-slate-400 mb-4">
                  {gameAchievements.length} achievement{gameAchievements.length !== 1 ? 's' : ''} available
                </p>
              </div>

              {/* Achievement Filter Bar with Integrated Tracking Toggle */}
              <AchievementFilterBar 
                searchTerm={searchTerm}
                rarityFilter={rarityFilter}
                statusFilter={statusFilter}
                categoryFilter={categoryFilter}
                onSearch={setSearchTerm}
                onRarityChange={setRarityFilter}
                onStatusChange={setStatusFilter}
                onCategoryChange={setCategoryFilter}
                isTrackingPanelVisible={isTrackingPanelVisible}
                onToggleTrackingPanel={() => setIsTrackingPanelVisible(!isTrackingPanelVisible)}
              />

              {/* Split Panel Layout */}
              <div className="flex-1 flex gap-6 overflow-hidden mt-6"> {/* Added mt-6 for spacing */}
                {/* Left Panel - Achievement List */}
                <div className="w-[400px] flex-shrink-0 overflow-y-auto space-y-2 pr-2 custom-scrollbar" style={{ maxHeight: 'calc(100vh - 350px)' }}> {/* Adjusted max-height based on UI */}
                  {gameAchievements.length > 0 ? (
                    gameAchievements.map(ach => (
                      <AchievementListItem
                        key={ach.id}
                        achievement={ach}
                        onSelect={setSelectedAchievement}
                        isUnlocked={user?.unlocked_achievements?.includes(ach.id)}
                        isSelected={selectedAchievement?.id === ach.id}
                      />
                    ))
                  ) : (
                    <div className="text-center py-20 text-slate-500">
                      <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <h3 className="text-xl font-semibold mb-2">No achievements match your filters</h3>
                      <p>Try adjusting your search or filter criteria</p>
                    </div>
                  )}
                </div>

                {/* Vertical Divider */}
                <div className="w-px bg-gradient-to-b from-transparent via-blue-500/50 to-transparent flex-shrink-0"></div>

                {/* Right Panel - Achievement Details */}
                <div className="flex-1 overflow-hidden">
                  <AchievementDetailPanel
                    achievement={selectedAchievement}
                    isUnlocked={selectedAchievement && user?.unlocked_achievements?.includes(selectedAchievement.id)}
                    onTrack={handleTrackAchievement}
                    isTracked={selectedAchievement && trackedAchievements.includes(selectedAchievement.id)}
                    onClose={() => setSelectedAchievement(null)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Vertical divider line */}
      <div 
        className="absolute top-0 right-0 h-full w-px bg-blue-500/30" 
        style={{ 
          transform: `translateX(${isTrackingPanelVisible ? '-360px' : '0px'})`, 
          transition: 'transform 300ms ease-in-out',
          boxShadow: isTrackingPanelVisible ? '0 0 10px rgba(59, 130, 246, 0.5)' : 'none'
        }} 
      />

      {/* Achievement Tracking Panel */}
      <div ref={trackingPanelRef}>
        <TrackingPanel 
          isVisible={isTrackingPanelVisible}
          onToggle={() => setIsTrackingPanelVisible(!isTrackingPanelVisible)}
          trackedAchievements={trackedAchievementDetails}
          allAchievements={Object.values(localAchievements).flat()}
          onSelectAchievement={setSelectedAchievement}
          onUntrack={handleUntrackAchievement}
        />
      </div>
    </div>
  );
}