import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '../components/auth/AuthContext';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Library as LibraryIcon, Search, Play, Loader2, Gamepad2, Radio, Mic, MicOff, Grid, List, Heart, Clock, Eye, Bot, Sparkles, Users, MessageSquare, Hash, Send, Volume2, Package, Video, HelpCircle, Gift, MapPin, Wifi, ChevronRight, Star, Zap, Trophy } from 'lucide-react';
import { allMockGames } from '../components/store/mockData';
import RecentlyAchievedOverlay from '../components/library/RecentlyAchievedOverlay';
import OwnedGameOverlay from '../components/library/OwnedGameOverlay';
import GameAchievementsOverlay from '../components/library/GameAchievementsOverlay';
import GameLauncherOverlay from '../components/library/GameLauncherOverlay';
import RemotePlayOverlay from '../components/streaming/RemotePlayOverlay';
import { motion, AnimatePresence } from 'framer-motion';

// Luna Card Component with darker, cleaner aesthetic
const LunaCard = ({ children, className = "", hover = true, onClick }) => (
  <div 
    onClick={onClick}
    className={`relative rounded-xl overflow-hidden transition-all duration-300 ${hover ? 'hover:scale-[1.02] cursor-pointer' : ''} ${className}`}
    style={{
      background: 'rgba(0,0,0,0.4)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.06)',
      boxShadow: hover ? '0 4px 24px rgba(0,0,0,0.5)' : '0 2px 12px rgba(0,0,0,0.3)',
    }}
  >
    {children}
  </div>
);

// Luna-style Game Card - Cleaner, darker aesthetic
const LunaGameCard = ({ game, isStreaming, onSelect, onPlay }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={() => onSelect(game)}
      className="relative cursor-pointer group"
    >
      <div 
        className="relative aspect-[2/3] rounded-xl overflow-hidden bg-black"
        style={{
          boxShadow: isHovered 
            ? '0 24px 48px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.1)' 
            : '0 8px 24px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)',
          transition: 'box-shadow 0.3s ease',
        }}
      >
        {/* Game Cover */}
        <img 
          src={game.cover_image || game.cover} 
          alt={game.title}
          className="w-full h-full object-cover transition-all duration-500"
          style={{
            transform: isHovered ? 'scale(1.05)' : 'scale(1)',
          }}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
        
        {/* Live Badge */}
        {isStreaming && (
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-2 right-2 flex items-center gap-1 bg-red-500 text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase"
          >
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            Live
          </motion.div>
        )}
        
        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="text-white font-semibold text-sm mb-0.5 line-clamp-1">
            {game.title}
          </h3>
          <p className="text-white/40 text-xs capitalize">{game.genre}</p>
        </div>

        {/* Hover Play Button */}
        <AnimatePresence>
          {isHovered && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-black/60"
            >
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                onClick={(e) => { e.stopPropagation(); onPlay(game); }}
                className="w-14 h-14 rounded-full bg-white hover:bg-white/90 flex items-center justify-center transition-colors shadow-xl"
              >
                <Play className="w-5 h-5 text-black fill-black ml-0.5" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// Luna Sidebar Item - Minimal, clean design
const LunaSidebarItem = ({ game, isSelected, isStreaming, onSelect, onPlay }) => (
  <motion.div
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    onClick={() => onSelect(game)}
    className={`group relative flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all ${
      isSelected 
        ? 'bg-white/8' 
        : 'hover:bg-white/4'
    }`}
  >
    {/* Game Thumbnail */}
    <div className="relative w-12 h-12 rounded-md overflow-hidden flex-shrink-0 bg-black">
      <img src={game.cover_image || game.cover} alt={game.title} className="w-full h-full object-cover" />
      {isStreaming && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-500/90">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
        </div>
      )}
    </div>
    
    {/* Game Info */}
    <div className="flex-1 min-w-0">
      <h3 className={`font-medium text-sm truncate ${isSelected ? 'text-white' : 'text-white/70 group-hover:text-white'}`}>
        {game.title}
      </h3>
      <p className="text-white/30 text-xs capitalize">{game.genre}</p>
    </div>

    {/* Quick Play Button */}
    <button
      onClick={(e) => { e.stopPropagation(); onPlay(game); }}
      className="w-7 h-7 rounded-full bg-white/90 hover:bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
    >
      <Play className="w-3 h-3 text-black fill-black ml-0.5" />
    </button>

    {/* Selected Indicator */}
    {isSelected && (
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r" />
    )}
  </motion.div>
);

// Luna-style Game Detail Panel
const LunaGamePanel = ({ game, isStreaming, onPlay, onStream, onShowAchievements, onShowGameDetails }) => {
  const [activeTab, setActiveTab] = useState('overview');
  
  if (!game) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Gamepad2 className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <p className="text-white/40 text-lg">Select a game to view details</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'community', label: 'Community' },
    { id: 'achievements', label: 'Achievements' },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Hero Section - Luna style */}
      <div className="relative h-80 rounded-xl overflow-hidden mb-8 flex-shrink-0 bg-black">
        <img 
          src={game.banner || game.cover_image || game.cover} 
          alt={game.title}
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent" />
        
        {/* Live Badge */}
        {isStreaming && (
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-4 right-4 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded text-xs font-bold uppercase"
          >
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            Live
          </motion.div>
        )}
        
        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-white/40 text-xs uppercase tracking-wider mb-2">{game.genre}</p>
              <h1 className="text-5xl font-bold text-white mb-3">{game.title}</h1>
              <div className="flex items-center gap-6 text-sm text-white/50">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>12.5 hours</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Trophy className="w-4 h-4" />
                  <span>8 of 15</span>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => onPlay(game)}
                className="flex items-center gap-2 px-8 py-3 rounded-full bg-white text-black font-semibold hover:bg-white/90 transition-all shadow-lg"
              >
                <Play className="w-4 h-4 fill-current" />
                Play
              </button>
              <button
                onClick={() => onStream(game)}
                className="px-6 py-3 rounded-full bg-white/10 text-white font-medium hover:bg-white/15 transition-all backdrop-blur-md"
              >
                Stream
              </button>
              <button
                onClick={onShowGameDetails}
                className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center transition-all"
              >
                <Eye className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-6 mb-6 flex-shrink-0 border-b border-white/5 pb-4">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-medium text-sm transition-all relative ${
              activeTab === tab.id
                ? 'text-white'
                : 'text-white/30 hover:text-white/60'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div 
                layoutId="panelTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto pr-2" style={{ scrollbarWidth: 'none' }}>
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* About */}
            <LunaCard className="p-5" hover={false}>
              <h3 className="text-white font-semibold text-base mb-3">About This Game</h3>
              <p className="text-white/50 text-sm leading-relaxed">
                {game.description || 'An epic adventure awaits in this groundbreaking title that redefines the genre. Explore vast worlds, engage in intense combat, and uncover secrets that will change everything.'}
              </p>
            </LunaCard>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4">
              <LunaCard className="p-4 text-center" hover={false}>
                <Clock className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                <p className="text-xl font-bold text-white">12.5h</p>
                <p className="text-white/30 text-xs">Playtime</p>
              </LunaCard>
              <LunaCard className="p-4 text-center" hover={false}>
                <Star className="w-5 h-5 text-yellow-400 mx-auto mb-2" />
                <p className="text-xl font-bold text-white">8/15</p>
                <p className="text-white/30 text-xs">Achievements</p>
              </LunaCard>
              <LunaCard className="p-4 text-center" hover={false}>
                <Zap className="w-5 h-5 text-green-400 mx-auto mb-2" />
                <p className="text-xl font-bold text-white">2h ago</p>
                <p className="text-white/30 text-xs">Last Played</p>
              </LunaCard>
            </div>

            {/* Game Trailer */}
            <LunaCard className="p-5" hover={false}>
              <h3 className="text-white font-semibold text-base mb-4">Game Trailer</h3>
              <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
                <video 
                  className="w-full h-full object-cover"
                  controls
                  poster={game.banner || game.cover_image}
                >
                  <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" type="video/mp4" />
                </video>
              </div>
            </LunaCard>
          </div>
        )}

        {activeTab === 'community' && (
          <div className="space-y-4">
            <LunaCard className="p-5" hover={false}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold text-lg">Community Discussion</h3>
                <Button size="sm" className="bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/30">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  New Post
                </Button>
              </div>
              
              {/* Discussion Topics */}
              <div className="space-y-3">
                {[
                  { title: 'Best build for endgame content?', replies: 45, user: 'DragonSlayer' },
                  { title: 'Hidden easter eggs in Chapter 5', replies: 23, user: 'MysticMage' },
                  { title: 'Looking for raid group tonight', replies: 12, user: 'ShadowNinja' },
                ].map((topic, i) => (
                  <div key={i} className="p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                    <h4 className="text-white font-medium mb-1">{topic.title}</h4>
                    <div className="flex items-center gap-4 text-xs text-white/40">
                      <span>by {topic.user}</span>
                      <span>{topic.replies} replies</span>
                    </div>
                  </div>
                ))}
              </div>
            </LunaCard>
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-white font-semibold text-base">Achievement Guides</h3>
              <button 
                onClick={onShowAchievements}
                className="text-blue-400 text-sm hover:text-blue-300 flex items-center gap-1"
              >
                View All <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            {/* Achievement List */}
            <div className="space-y-3">
              {[
                { name: 'Dragon Slayer Supreme', icon: '🐉', rarity: 'Legendary', progress: 100 },
                { name: 'Master Thief', icon: '💰', rarity: 'Epic', progress: 75 },
                { name: 'Arena Champion', icon: '⚔️', rarity: 'Epic', progress: 50 },
                { name: 'Legendary Explorer', icon: '🗺️', rarity: 'Rare', progress: 30 },
              ].map((achievement, i) => (
                <LunaCard key={i} className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="text-3xl">{achievement.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-white font-medium">{achievement.name}</h4>
                        <Badge className={`text-xs ${
                          achievement.rarity === 'Legendary' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                          achievement.rarity === 'Epic' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
                          'bg-blue-500/20 text-blue-400 border-blue-500/30'
                        }`}>
                          {achievement.rarity}
                        </Badge>
                      </div>
                      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full"
                          style={{ width: `${achievement.progress}%` }}
                        />
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white/30" />
                  </div>
                </LiquidGlassCard>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function Library() {
  const { user, isAuthenticated } = useAuth();
  const [ownedGames, setOwnedGames] = useState([]);
  const [favoriteGames, setFavoriteGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [viewMode, setViewMode] = useState('list');
  const [isListening, setIsListening] = useState(false);
  const [streamingGameId, setStreamingGameId] = useState(localStorage.getItem('streaming_game_id'));
  const [selectedGame, setSelectedGame] = useState(null);
  const [showRecentlyAchieved, setShowRecentlyAchieved] = useState(false);
  const [showAchievementsOverlay, setShowAchievementsOverlay] = useState(false);
  const [showGameDetailsOverlay, setShowGameDetailsOverlay] = useState(false);
  const [launchingGame, setLaunchingGame] = useState(null);
  const [streamingSession, setStreamingSession] = useState(null);

  const handleStreamGame = async (game) => {
    try {
      const res = await base44.functions.invoke('initiateRemotePlay', { game_id: game.id });
      if (res.data && res.data.success) {
        setStreamingSession({ game, session: res.data.session });
      } else {
        setStreamingSession({ game, session: { status: 'initializing' } });
      }
    } catch (e) {
      console.error(e);
      setStreamingSession({ game, session: { status: 'initializing' } });
    }
  };

  const handleLaunchGame = (game) => {
    setLaunchingGame(game);
  };

  useEffect(() => {
    const fetchOwnedGames = async () => {
      let userGames = [];
      const testGameAlpha = allMockGames['test_game_alpha'];

      if (isAuthenticated) {
        const allGamesFromDb = await base44.entities.Game.list();
        const combinedGamePool = { ...allMockGames, ...Object.fromEntries(allGamesFromDb.map(g => [g.id, g])) };
        
        const ownedIds = user?.purchased_items || [];
        userGames = ownedIds.map(id => combinedGamePool[id]).filter(Boolean);

        if (testGameAlpha) {
          userGames.unshift(testGameAlpha);
        }
      } else {
        if (testGameAlpha) {
          userGames.push(testGameAlpha);
        }
      }
      
      setOwnedGames(Array.from(new Map(userGames.map(g => [g.id, g])).values()));
      setFavoriteGames(userGames.slice(0, 3));
      if (userGames.length > 0) {
        setSelectedGame(userGames[0]);
      }
      setLoading(false);
    };

    fetchOwnedGames();

    const handleStorageChange = () => {
      setStreamingGameId(localStorage.getItem('streaming_game_id'));
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user, isAuthenticated]);

  const startVoiceSearch = () => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setSearchTerm(transcript);
      };

      recognition.start();
    }
  };

  const getFilteredGames = () => {
    let games = [];
    switch (activeTab) {
      case 'installed':
        games = ownedGames.slice(0, Math.ceil(ownedGames.length / 2));
        break;
      case 'favorites':
        games = favoriteGames;
        break;
      default:
        games = ownedGames;
    }

    if (searchTerm) {
      games = games.filter(game =>
        game.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        game.genre.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return games;
  };

  const filteredGames = getFilteredGames();

  if (!isAuthenticated && filteredGames.length <= 1) {
    return (
      <div 
        className="flex flex-col items-center justify-center min-h-screen text-white p-6"
        style={{ background: 'linear-gradient(135deg, #1a1f2e 0%, #2d3548 25%, #3d4a5c 50%, #2d3548 75%, #1a1f2e 100%)' }}
      >
        <LibraryIcon className="w-20 h-20 text-white/20 mb-6" />
        <h1 className="text-3xl font-bold mb-2">Your Library is Empty</h1>
        <p className="text-white/50 mb-6 max-w-md text-center">Sign in to see your purchased games.</p>
        <Button asChild className="bg-white text-black hover:bg-white/90">
          <Link to={createPageUrl('Store')}>Explore Games</Link>
        </Button>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div 
        className="flex items-center justify-center min-h-screen"
        style={{ background: 'linear-gradient(135deg, #1a1f2e 0%, #2d3548 25%, #3d4a5c 50%, #2d3548 75%, #1a1f2e 100%)' }}
      >
        <Loader2 className="w-12 h-12 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div 
      className="h-screen flex flex-col overflow-hidden text-white"
      style={{ 
        background: '#0a0a0a',
      }}
    >
      {/* Header */}
      <div className="relative z-10 flex-shrink-0 px-8 pt-8 pb-6"
        style={{
          background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, transparent 100%)',
        }}
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-1">Library</h1>
            <p className="text-white/30 text-sm">{filteredGames.length} games</p>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2 bg-white/5 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === 'grid' ? 'bg-white text-black' : 'text-white/50 hover:text-white'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === 'list' ? 'bg-white text-black' : 'text-white/50 hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-8 relative">
          {['all', 'installed', 'favorites'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-sm font-medium transition-colors capitalize pb-3 relative ${
                activeTab === tab ? 'text-white' : 'text-white/30 hover:text-white/60'
              }`}
            >
              {tab === 'favorites' && <Heart className="w-3.5 h-3.5 inline mr-1.5" />}
              {tab}
              {activeTab === tab && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 overflow-hidden px-8 pb-8">
        {viewMode === 'list' ? (
          <div className="flex gap-6 h-full">
            {/* Left Sidebar - Game List */}
            <div className="w-72 flex-shrink-0 flex flex-col gap-4">
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-11 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-all"
                />
              </div>

              {/* Game List */}
              <LunaCard className="flex-1 overflow-hidden" hover={false}>
                <div className="px-4 py-3 border-b border-white/5">
                  <p className="text-white/30 text-xs font-medium uppercase tracking-wider">Your Games</p>
                </div>
                <div className="overflow-y-auto h-full p-2" style={{ maxHeight: 'calc(100% - 48px)', scrollbarWidth: 'none' }}>
                  {filteredGames.map(game => (
                    <LunaSidebarItem
                      key={game.id}
                      game={game}
                      isSelected={selectedGame?.id === game.id}
                      isStreaming={game.id === streamingGameId}
                      onSelect={setSelectedGame}
                      onPlay={handleLaunchGame}
                    />
                  ))}
                </div>
              </LunaCard>
            </div>

            {/* Game Detail Panel */}
            <div className="flex-1 overflow-hidden">
              <LunaGamePanel
                game={selectedGame}
                isStreaming={selectedGame?.id === streamingGameId}
                onPlay={handleLaunchGame}
                onStream={handleStreamGame}
                onShowAchievements={() => setShowAchievementsOverlay(true)}
                onShowGameDetails={() => setShowGameDetailsOverlay(true)}
              />
            </div>
          </div>
        ) : (
          /* Grid View */
          <div className="h-full overflow-y-auto pr-2" style={{ scrollbarWidth: 'none' }}>
            {/* Search Bar for Grid */}
            <div className="mb-8">
              <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="text"
                  placeholder="Search your games..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-11 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all"
                />
              </div>
            </div>

            {/* Games Grid by Genre */}
            {(() => {
              const gamesByGenre = filteredGames.reduce((acc, game) => {
                const genre = game.genre || 'Other';
                const genreKey = genre.charAt(0).toUpperCase() + genre.slice(1).toLowerCase();
                if (!acc[genreKey]) acc[genreKey] = [];
                acc[genreKey].push(game);
                return acc;
              }, {});

              return Object.entries(gamesByGenre).map(([genre, genreGames]) => (
                <div key={genre} className="mb-12">
                  <div className="flex items-center gap-3 mb-6">
                    <h2 className="text-xl font-semibold text-white">{genre}</h2>
                    <span className="text-white/20 text-sm">({genreGames.length})</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4">
                    {genreGames.map(game => (
                      <LunaGameCard
                        key={game.id}
                        game={game}
                        isStreaming={game.id === streamingGameId}
                        onSelect={setSelectedGame}
                        onPlay={handleLaunchGame}
                      />
                    ))}
                  </div>
                </div>
              ));
            })()}
          </div>
        )}
      </div>

      {/* Overlays */}
      <RecentlyAchievedOverlay
        isVisible={showRecentlyAchieved}
        onClose={() => setShowRecentlyAchieved(false)}
        gameTitle={selectedGame?.title}
      />

      {showAchievementsOverlay && selectedGame && (
        <GameAchievementsOverlay
          gameTitle={selectedGame.title}
          onClose={() => setShowAchievementsOverlay(false)}
        />
      )}

      {showGameDetailsOverlay && selectedGame && (
        <OwnedGameOverlay
          game={selectedGame}
          onClose={() => setShowGameDetailsOverlay(false)}
        />
      )}

      <AnimatePresence>
        {launchingGame && (
          <GameLauncherOverlay 
            game={launchingGame} 
            onClose={() => setLaunchingGame(null)} 
          />
        )}
        {streamingSession && (
          <RemotePlayOverlay 
            game={streamingSession.game}
            session={streamingSession.session}
            onClose={() => setStreamingSession(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}