import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Trophy, Search, Filter, Mic, Volume2, ChevronRight,
  Check, X, ArrowLeft, Gamepad2, Sparkles, Layers,
  ChevronDown, Mic as MicIcon, LayoutGrid, DollarSign, Hammer,
  MessageSquare, Users, Star, TrendingUp, SlidersHorizontal,
  Shield, Monitor, Car, Skull, Crosshair, Music, Zap, Heart,
  Crown, Globe, Rocket, Map, Ghost, Scroll
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../components/auth/AuthContext';
import { allMockGames } from '../components/store/mockData';
import AchievementDetailOverlay from '../components/achievements/AchievementDetailOverlay';
import ChallengeFriendModal from '../components/community/ChallengeFriendModal';
import CardEnhancementOverlay from '../components/profile/CardEnhancementOverlay';
import SkillTreeOverlay from '../components/achievements/SkillTreeOverlay';
import BlacksmithOverlay from '../components/achievements/BlacksmithOverlay';
import ShinyCard from '../components/shared/ShinyCard';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import GlassPageFrame from '@/components/shared/GlassPageFrame';

// Genre definitions (same as GenreMastery for consistency)
const GENRES = [
  { id: 'all', name: 'All', short: 'ALL', icon: LayoutGrid, color: 'from-cyan-500 to-blue-500', accent: 'text-cyan-400', matchGenres: [] },
  { id: 'mmorpg', name: 'MMORPG', short: 'MMO', icon: Globe, color: 'from-purple-500 to-indigo-600', accent: 'text-purple-400', matchGenres: ['mmo', 'mmorpg'] },
  { id: 'scifi', name: 'Sci-Fi', short: 'SCI', icon: Rocket, color: 'from-cyan-500 to-blue-600', accent: 'text-cyan-400', matchGenres: ['sci-fi', 'scifi', 'sci_fi'] },
  { id: 'fantasy', name: 'Fantasy', short: 'FAN', icon: Crown, color: 'from-amber-400 to-orange-500', accent: 'text-amber-400', matchGenres: ['fantasy', 'rpg'] },
  { id: 'action', name: 'Action', short: 'ACT', icon: Crosshair, color: 'from-red-500 to-rose-600', accent: 'text-red-400', matchGenres: ['action', 'fighting'] },
  { id: 'shooter', name: 'Shooter', short: 'FPS', icon: Crosshair, color: 'from-emerald-500 to-green-600', accent: 'text-emerald-400', matchGenres: ['shooter', 'shooting', 'fps'] },
  { id: 'adventure', name: 'Adventure', short: 'ADV', icon: Map, color: 'from-yellow-400 to-orange-400', accent: 'text-yellow-400', matchGenres: ['adventure', 'open_world'] },
  { id: 'horror', name: 'Horror', short: 'HOR', icon: Ghost, color: 'from-slate-800 to-gray-900', accent: 'text-slate-400', matchGenres: ['horror', 'survival'] },
  { id: 'simulation', name: 'Simulation', short: 'SIM', icon: Monitor, color: 'from-blue-400 to-indigo-400', accent: 'text-blue-400', matchGenres: ['simulation', 'strategy'] },
  { id: 'racing', name: 'Racing', short: 'RAC', icon: Car, color: 'from-orange-500 to-red-500', accent: 'text-orange-400', matchGenres: ['racing'] },
];

// Genre scroll tabs (reused from GenreMastery)
function GenreScrollTabs({ genres, selectedGenre, onSelect }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleWheel = (e) => { e.preventDefault(); el.scrollLeft += e.deltaY > 0 ? 80 : -80; };
    const handleKeyDown = (e) => {
      if (!el.matches(':hover')) return;
      if (e.key === 'd' || e.key === 'D') el.scrollLeft += 80;
      if (e.key === 'a' || e.key === 'A') el.scrollLeft -= 80;
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);
    return () => { el.removeEventListener('wheel', handleWheel); window.removeEventListener('keydown', handleKeyDown); };
  }, []);

  return (
    <div className="flex-1 min-w-0 relative">
      <div className="absolute left-0 top-0 bottom-0 w-6 z-10 pointer-events-none" style={{ background: 'linear-gradient(to right, rgba(8,12,18,0.9), transparent)' }} />
      <div className="absolute right-0 top-0 bottom-0 w-6 z-10 pointer-events-none" style={{ background: 'linear-gradient(to left, rgba(8,12,18,0.9), transparent)' }} />
      <div ref={scrollRef} className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide scroll-smooth px-2" style={{ scrollBehavior: 'smooth' }}>
        {genres.map((g) => (
          <button
            key={g.id}
            onClick={() => onSelect(g)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full whitespace-nowrap border transition-all text-xs font-semibold flex-shrink-0 ${
              selectedGenre?.id === g.id
                ? 'bg-white/12 border-white/20 text-white'
                : 'bg-transparent border-transparent text-white/45 hover:bg-white/5 hover:text-white/70'
            }`}
          >
            {g.icon && React.createElement(g.icon, { className: 'w-3.5 h-3.5' })}
            <span>{g.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function AchievementsView({ onExitToLibrary, onClosePage }) {
  const { user, isAuthenticated, updateUserData } = useAuth();
  const navigate = useNavigate();
  const [allGames, setAllGames] = useState([]);
  const [localAchievements, setLocalAchievements] = useState({});
  const [selectedGame, setSelectedGame] = useState(null);
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [trackedAchievements, setTrackedAchievements] = useState([]);
  const [challengeModalOpen, setChallengeModalOpen] = useState(false);
  const [achievementToChallenge, setAchievementToChallenge] = useState(null);

  // Modes
  const [skillTreeMode, setSkillTreeMode] = useState(false);
  const [skillTreeCard, setSkillTreeCard] = useState(null);
  const [blacksmithMode, setBlacksmithMode] = useState(false);
  const [blacksmithCard, setBlacksmithCard] = useState(null);
  const [aftermarketMode, setAftermarketMode] = useState(false);

  // Genre filter
  const [selectedGenre, setSelectedGenre] = useState(GENRES[0]);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        let games = [];
        try {
          const gamesResponse = await base44.entities.Game.list();
          games = gamesResponse.data || gamesResponse;
        } catch (err) { console.error('Error fetching games:', err); }

        let achievements = [];
        try {
          const achievementsResponse = await base44.entities.Achievement.list();
          achievements = achievementsResponse.data || achievementsResponse;
        } catch (err) { console.error('Error fetching achievements:', err); }

        const ownedGameIds = new Set(user?.purchased_items || []);
        let userGames;
        if (isAuthenticated && ownedGameIds.size > 0) {
          const dbOwned = games.filter(g => ownedGameIds.has(g.id));
          const mockOwned = Object.values(allMockGames).filter(g => ownedGameIds.has(g.id));
          const combined = [...dbOwned, ...mockOwned];
          userGames = Array.from(new Map(combined.map(g => [g.id, g])).values());
        } else {
          const combined = [...games, ...Object.values(allMockGames)];
          userGames = Array.from(new Map(combined.map(g => [g.id, g])).values());
        }
        setAllGames(userGames);
        if (userGames.length > 0) setSelectedGame(userGames[0]);

        const achievementsByGame = {};
        achievements.forEach(ach => {
          if (!achievementsByGame[ach.game]) achievementsByGame[ach.game] = [];
          achievementsByGame[ach.game].push(ach);
        });
        setLocalAchievements(achievementsByGame);
        setTrackedAchievements(user?.tracked_achievements || []);
      } catch (error) {
        console.error("Error fetching achievement data:", error);
        setAllGames(Object.values(allMockGames));
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user, isAuthenticated]);

  const handleTrackAchievement = useCallback(async (achievement) => {
    if (!isAuthenticated || !user) return;
    const isTracked = trackedAchievements.includes(achievement.id);
    const newTracked = isTracked ? trackedAchievements.filter(id => id !== achievement.id) : [...trackedAchievements, achievement.id];
    setTrackedAchievements(newTracked);
    await updateUserData({ tracked_achievements: newTracked });
  }, [isAuthenticated, user, updateUserData, trackedAchievements]);

  const handleShareAchievement = async (achievement) => {
    if (!user) return;
    try {
      const aiResponse = await base44.functions.invoke('communityAI', {
        action: 'generate_achievement_post',
        data: { achievement, game: achievement.game, user_name: user.username || user.full_name }
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
    } catch (error) { console.error("Error sharing achievement:", error); }
  };

  const handleChallenge = (achievement) => {
    setAchievementToChallenge(achievement);
    setChallengeModalOpen(true);
  };

  // Filter games by selected genre
  const filteredGames = useMemo(() => {
    if (isLoading || !allGames) return [];
    if (selectedGenre.id === 'all') return allGames;
    return allGames.filter(game => {
      const g = (game.genre || '').toLowerCase();
      return selectedGenre.matchGenres?.some(mg => g.includes(mg));
    });
  }, [allGames, selectedGenre, isLoading]);

  // Game data with stats
  const gameData = useMemo(() => {
    return filteredGames.map(game => ({
      ...game,
      questCount: Math.floor(Math.random() * 30) + 10,
      achievementCards: Math.floor(Math.random() * 20) + 5,
      completionRate: Math.floor(Math.random() * 60) + 10,
    }));
  }, [filteredGames]);

  // User cards
  const [userCards, setUserCards] = useState([]);
  useEffect(() => {
    const fetchUserCards = async () => {
      if (!user || !selectedGame) return;
      try {
        const cards = await base44.entities.UserCard.filter({ user_id: user.id, game_name: selectedGame.title });
        setUserCards(cards);
      } catch (error) { console.error('Failed to fetch user cards:', error); }
    };
    fetchUserCards();
  }, [user, selectedGame]);

  // Trading cards for selected game
  const tradingCards = useMemo(() => {
    if (!selectedGame || !localAchievements[selectedGame.title]) return [];
    const gameAchs = localAchievements[selectedGame.title] || [];
    const cards = [];
    gameAchs.forEach(ach => {
      if (ach.reward) {
        const userCard = userCards.find(c => c.card_name === ach.reward.name);
        const isUnlocked = user?.unlocked_achievements?.includes(ach.id);
        cards.push({
          id: ach.id,
          title: ach.reward.name || ach.title,
          series: selectedGame.title,
          rarity: ach.rarity,
          image: selectedGame.cover_image || selectedGame.cover,
          description: ach.reward.description || ach.description,
          stats: ach.reward.stats || {},
          isPurchased: userCard?.acquisition_method === 'purchased',
          isUnlocked,
        });
      }
    });
    return cards;
  }, [selectedGame, localAchievements, userCards, user]);

  // Generate fallback cards
  const generateCardsForGame = useCallback((game) => {
    if (!game) return [];
    return Array.from({ length: 12 }, (_, i) => ({
      id: `card-${game.id}-${i}`,
      title: `${game.title} Card ${i + 1}`,
      series: game.title,
      rarity: ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic'][Math.floor(Math.random() * 5)],
      image: game.cover_image || game.cover,
      description: `A collectible trading card from ${game.title}.`,
      stats: { strength: Math.floor(Math.random() * 100), magic: Math.floor(Math.random() * 100) },
    }));
  }, []);

  const displayCards = useMemo(() => {
    if (!selectedGame) return [];
    return tradingCards.length > 0 ? tradingCards : generateCardsForGame(selectedGame);
  }, [selectedGame, tradingCards, generateCardsForGame]);

  // Score
  const totalScore = useMemo(() => {
    if (!user?.unlocked_achievements || !localAchievements) return 12450;
    let score = 0;
    Object.values(localAchievements).flat().forEach(ach => {
      if (user.unlocked_achievements.includes(ach.id)) score += ach.points || 0;
    });
    return score || 12450;
  }, [user, localAchievements]);

  // Auto-select first game when genre changes or games load
  useEffect(() => {
    if (gameData.length > 0) {
      setSelectedGame(gameData[0]);
    } else {
      setSelectedGame(null);
    }
  }, [selectedGenre, gameData.length]);

  // Escape key handling
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (blacksmithCard) setBlacksmithCard(null);
        else if (skillTreeCard) setSkillTreeCard(null);
        else if (selectedCard) setSelectedCard(null);
        else if (selectedAchievement) setSelectedAchievement(null);
        else if (onClosePage) onClosePage();
        else navigate(createPageUrl('LunaTemplate'));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [blacksmithCard, skillTreeCard, selectedCard, selectedAchievement, onClosePage, navigate]);

  return (
    <GlassPageFrame>
      <div className="h-screen w-full text-white font-sans overflow-hidden relative flex flex-col"
        style={{ background: 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 25%, #0d1117 50%, #1a1f2e 75%, #0f1419 100%)' }}
      >
        {/* Ambient glow */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[150px] mix-blend-screen" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px] mix-blend-screen" />
        </div>

        {/* ═══ SUB-NAV BAR ═══ */}
        <div className="relative z-10 flex-shrink-0 mt-16">
          <div className="flex items-center px-6 py-2 gap-0"
            style={{
              background: 'rgba(8, 12, 18, 0.5)',
              backdropFilter: 'blur(20px)',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {/* Left: Achievement Cards label */}
            <span className="text-white/50 text-xs font-bold uppercase tracking-widest whitespace-nowrap flex-shrink-0 mr-4 select-none">
              Achievement Cards
            </span>

            {/* Fade divider left */}
            <div className="flex-shrink-0 w-px h-8 mx-3 relative">
              <div className="absolute inset-x-0 top-0 bottom-0" style={{ background: 'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.15) 35%, rgba(255,255,255,0.15) 65%, transparent 100%)' }} />
            </div>

            {/* Center: Scrollable genre tabs */}
            <GenreScrollTabs
              genres={GENRES}
              selectedGenre={selectedGenre}
              onSelect={setSelectedGenre}
            />

            {/* Fade divider right */}
            <div className="flex-shrink-0 w-px h-8 mx-3 relative">
              <div className="absolute inset-x-0 top-0 bottom-0" style={{ background: 'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.15) 35%, rgba(255,255,255,0.15) 65%, transparent 100%)' }} />
            </div>

            {/* Right: Black Market + Skill Tree buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => { setAftermarketMode(!aftermarketMode); setSkillTreeMode(false); setBlacksmithMode(false); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border whitespace-nowrap ${
                  aftermarketMode
                    ? 'bg-emerald-500/15 border-emerald-400/30 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.1)]'
                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white hover:border-white/15'
                }`}
                style={{ backdropFilter: 'blur(12px)' }}
              >
                <DollarSign className="w-4 h-4" />
                <span>Black Market</span>
              </button>

              <button
                onClick={() => { setSkillTreeMode(!skillTreeMode); setBlacksmithMode(false); setAftermarketMode(false); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border whitespace-nowrap ${
                  skillTreeMode
                    ? 'bg-purple-500/15 border-purple-400/30 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.1)]'
                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white hover:border-white/15'
                }`}
                style={{ backdropFilter: 'blur(12px)' }}
              >
                <Layers className="w-4 h-4" />
                <span>Skill Tree</span>
              </button>
            </div>
          </div>
        </div>

        {/* ═══ MAIN CONTENT: Games List + Cards ═══ */}
        <div className="flex-1 flex min-h-0 relative z-10">

          {/* LEFT: Games List */}
          <div
            className="h-full flex flex-col overflow-hidden flex-shrink-0"
            style={{
              width: '320px',
              minWidth: '320px',
              background: 'rgba(10, 14, 20, 0.65)',
              backdropFilter: 'blur(30px)',
              borderRight: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {/* List Header */}
            <div className="p-4 border-b border-white/6 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${selectedGenre.color} flex items-center justify-center`}>
                  <Gamepad2 className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-sm">{selectedGenre.id === 'all' ? 'All' : selectedGenre.name} Games</h2>
                  <p className="text-white/35 text-[10px]">{gameData.length} game{gameData.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>

            {/* Games */}
            <div className="flex-1 overflow-y-auto p-2.5 space-y-1">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-white/20 border-t-cyan-400 rounded-full animate-spin" />
                </div>
              ) : gameData.length === 0 ? (
                <div className="text-center py-12 text-white/25">
                  <Gamepad2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">No games in this genre yet</p>
                </div>
              ) : (
                gameData.map((game) => (
                  <motion.button
                    key={game.id}
                    onClick={() => setSelectedGame(game)}
                    whileHover={{ x: 2 }}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all border ${
                      selectedGame?.id === game.id
                        ? 'bg-white/10 border-white/15'
                        : 'bg-transparent border-transparent hover:bg-white/5 hover:border-white/6'
                    }`}
                  >
                    <div className="w-10 h-14 rounded-lg overflow-hidden flex-shrink-0 border border-white/8 bg-black/30">
                      {game.cover_image || game.cover ? (
                        <img src={game.cover_image || game.cover} alt={game.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-800">
                          <Gamepad2 className="w-4 h-4 text-white/25" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white text-xs font-semibold truncate">{game.title}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-white/30 text-[10px]">{game.genre}</span>
                        <span className="text-yellow-400/50 text-[10px] flex items-center gap-0.5">
                          <Trophy className="w-2.5 h-2.5" />{game.achievementCards}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className="flex-1 h-0.5 rounded-full bg-white/5 overflow-hidden">
                          <div className={`h-full rounded-full bg-gradient-to-r ${selectedGenre.color}`} style={{ width: `${game.completionRate}%` }} />
                        </div>
                        <span className="text-white/20 text-[9px]">{game.completionRate}%</span>
                      </div>
                    </div>
                  </motion.button>
                ))
              )}
            </div>
          </div>

          {/* RIGHT: Cards Grid */}
          <div className="flex-1 h-full overflow-hidden"
            style={{
              background: 'rgba(8, 12, 18, 0.55)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <AnimatePresence mode="wait">
              {selectedGame ? (
                <motion.div
                  key={`cards-${selectedGame.id}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="h-full flex flex-col"
                >
                  {/* Game Header */}
                  <div className="p-5 pb-3 border-b border-white/6 flex items-center gap-4">
                    <div className="w-12 h-16 rounded-lg overflow-hidden border border-white/10 flex-shrink-0">
                      <img src={selectedGame.cover_image || selectedGame.cover} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-white font-bold text-lg truncate">{selectedGame.title}</h2>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge className="bg-white/10 text-white/70 border-white/20 text-[10px]">{selectedGame.genre}</Badge>
                        <span className="text-white/30 text-xs">{displayCards.length} cards</span>
                      </div>
                    </div>

                    {/* Mode indicators */}
                    {skillTreeMode && <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/30">Skill Tree Mode</Badge>}
                    {blacksmithMode && <Badge className="bg-orange-500/20 text-orange-300 border-orange-400/30">Blacksmith Mode</Badge>}
                    {aftermarketMode && <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/30">Black Market</Badge>}
                  </div>

                  {/* Cards Grid */}
                  <div className="flex-1 overflow-y-auto p-5">
                    {displayCards.length > 0 ? (
                      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                        {displayCards.map((card, i) => (
                          <motion.div
                            key={card.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.02 }}
                            className="aspect-[2.5/3.5]"
                          >
                            <ShinyCard
                              index={i}
                              onClick={() => {
                                if (skillTreeMode) setSkillTreeCard(card);
                                else if (blacksmithMode) setBlacksmithCard(card);
                                else setSelectedCard(card);
                              }}
                            >
                              <div className="absolute inset-0 flex flex-col p-2">
                                <div className="relative w-full h-3/5 rounded-md overflow-hidden mb-1.5 border border-white/10">
                                  <img src={card.image} alt={card.title} className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                  {card.isPurchased && !card.isUnlocked && (
                                    <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-green-500/90 flex items-center justify-center border border-white/20">
                                      <DollarSign className="w-2.5 h-2.5 text-white" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 flex flex-col justify-between">
                                  <div>
                                    <h3 className="text-white font-bold text-[10px] leading-tight mb-0.5 line-clamp-2">{card.title}</h3>
                                    <div className="flex gap-1 flex-wrap">
                                      <Badge variant="outline" className={`text-[8px] h-3.5 px-1 border ${
                                        card.rarity === 'Legendary' ? 'border-orange-500/50 text-orange-400' :
                                        card.rarity === 'Epic' ? 'border-purple-500/50 text-purple-400' :
                                        card.rarity === 'Rare' ? 'border-blue-500/50 text-blue-400' :
                                        card.rarity === 'Mythic' ? 'border-red-500/50 text-red-400' :
                                        'border-slate-500/50 text-slate-400'
                                      }`}>
                                        {card.rarity}
                                      </Badge>
                                      {card.isPurchased && (
                                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[8px] h-3.5 px-1">
                                          BOUGHT
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </ShinyCard>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-64 flex flex-col items-center justify-center text-slate-500">
                        <Layers className="w-12 h-12 mb-3 opacity-20" />
                        <p className="text-sm font-medium">No trading cards found</p>
                        <p className="text-xs text-white/20 mt-1">Unlock achievements to earn cards</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex flex-col items-center justify-center text-center px-8"
                >
                  <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${selectedGenre.color} opacity-20 flex items-center justify-center mb-6`}>
                    <Gamepad2 className="w-10 h-10 text-white/40" />
                  </div>
                  <h2 className="text-xl font-bold text-white/30 mb-2">Select a Game</h2>
                  <p className="text-white/20 text-sm max-w-sm">
                    Choose a game from the list to view its achievement cards and collection.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Overlays */}
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

        <AnimatePresence>
          {selectedCard && !skillTreeMode && (
            <CardEnhancementOverlay card={selectedCard} onClose={() => setSelectedCard(null)} />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {skillTreeCard && skillTreeMode && (
            <SkillTreeOverlay card={skillTreeCard} onClose={() => setSkillTreeCard(null)} />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {blacksmithCard && blacksmithMode && (
            <BlacksmithOverlay card={blacksmithCard} onClose={() => setBlacksmithCard(null)} />
          )}
        </AnimatePresence>

        {achievementToChallenge && (
          <ChallengeFriendModal
            achievement={achievementToChallenge}
            isOpen={challengeModalOpen}
            onClose={() => setChallengeModalOpen(false)}
          />
        )}

        {/* Floating Score */}
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
    </GlassPageFrame>
  );
}

export default function Achievements({ onExitToLibrary, onClose, showCloseButton }) {
  return (
    <div className="h-screen w-full overflow-hidden relative">
      <AchievementsView onExitToLibrary={onExitToLibrary} onClosePage={onClose} />
    </div>
  );
}