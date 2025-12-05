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

// Liquid Glass Card Component
const LiquidGlassCard = ({ children, className = "", hover = true, onClick }) => (
  <div 
    onClick={onClick}
    className={`relative rounded-2xl overflow-hidden transition-all duration-300 ${hover ? 'hover:shadow-[0_0_40px_rgba(150,180,220,0.2)] cursor-pointer' : ''} ${className}`}
    style={{
      background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.02) 100%)',
      backdropFilter: 'blur(40px) saturate(180%)',
      WebkitBackdropFilter: 'blur(40px) saturate(180%)',
      border: '1px solid rgba(255,255,255,0.15)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
    }}
  >
    {children}
  </div>
);

// Luna-style Game Card for Grid View
const LunaGameCard = ({ game, isStreaming, onSelect, onPlay }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.03, y: -5 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={() => onSelect(game)}
      className="relative cursor-pointer group"
    >
      <div 
        className="relative aspect-[3/4] rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: isHovered ? '0 20px 60px rgba(0,0,0,0.4), 0 0 40px rgba(100,150,200,0.15)' : '0 10px 40px rgba(0,0,0,0.3)',
        }}
      >
        {/* Game Cover */}
        <img 
          src={game.cover_image || game.cover} 
          alt={game.title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-80" />
        
        {/* Live Badge */}
        {isStreaming && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
            <Radio className="w-3 h-3 animate-pulse" />
            LIVE
          </div>
        )}
        
        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-white font-bold text-lg mb-1 group-hover:text-blue-300 transition-colors drop-shadow-lg">
            {game.title}
          </h3>
          <p className="text-white/60 text-sm capitalize mb-3">{game.genre}</p>
          
          {/* Quick Stats */}
          <div className="flex items-center gap-3 text-xs text-white/50">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>12.5h</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3" />
              <span>8/15</span>
            </div>
          </div>
        </div>

        {/* Hover Play Button */}
        <AnimatePresence>
          {isHovered && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            >
              <motion.button
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                onClick={(e) => { e.stopPropagation(); onPlay(game); }}
                className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-xl border border-white/30 flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <Play className="w-7 h-7 text-white fill-white ml-1" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Glow on Hover */}
        <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-cyan-400 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`} />
      </div>
    </motion.div>
  );
};

// Luna-style Sidebar Game Item
const LunaSidebarItem = ({ game, isSelected, isStreaming, onSelect, onPlay }) => (
  <motion.div
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    onClick={() => onSelect(game)}
    className={`group relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-300 ${
      isSelected 
        ? 'bg-white/10' 
        : 'hover:bg-white/5'
    }`}
    style={isSelected ? {
      border: '1px solid rgba(255,255,255,0.15)',
      boxShadow: '0 4px 20px rgba(100,150,200,0.1)',
    } : {}}
  >
    {/* Game Thumbnail */}
    <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-black/30">
      <img src={game.cover_image || game.cover} alt={game.title} className="w-full h-full object-cover" />
      {isStreaming && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-500/80">
          <Radio className="w-4 h-4 text-white animate-pulse" />
        </div>
      )}
    </div>
    
    {/* Game Info */}
    <div className="flex-1 min-w-0">
      <h3 className={`font-semibold text-sm truncate transition-colors ${isSelected ? 'text-white' : 'text-white/80 group-hover:text-white'}`}>
        {game.title}
      </h3>
      <p className="text-white/40 text-xs capitalize">{game.genre}</p>
    </div>

    {/* Quick Play Button */}
    <button
      onClick={(e) => { e.stopPropagation(); onPlay(game); }}
      className="w-8 h-8 rounded-full bg-blue-500/20 hover:bg-blue-500/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
    >
      <Play className="w-3.5 h-3.5 text-blue-400 fill-blue-400 ml-0.5" />
    </button>

    {/* Selected Indicator */}
    {isSelected && (
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-400 to-cyan-400 rounded-r-full" />
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
      {/* Hero Section */}
      <div className="relative h-64 rounded-2xl overflow-hidden mb-6 flex-shrink-0">
        <img 
          src={game.banner || game.cover_image || game.cover} 
          alt={game.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
        
        {/* Live Badge */}
        {isStreaming && (
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500 text-white px-3 py-1.5 rounded-full text-sm font-bold">
            <Radio className="w-4 h-4 animate-pulse" />
            STREAMING LIVE
          </div>
        )}
        
        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex items-end justify-between">
            <div>
              <Badge className="mb-3 bg-white/10 text-white border-white/20 backdrop-blur-md">
                {game.genre}
              </Badge>
              <h1 className="text-4xl font-black text-white mb-2 drop-shadow-lg">{game.title}</h1>
              <div className="flex items-center gap-4 text-sm text-white/70">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>12.5 hours played</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4" />
                  <span>8/15 achievements</span>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => onPlay(game)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-black font-bold hover:bg-white/90 transition-colors"
              >
                <Play className="w-5 h-5 fill-current" />
                Play
              </button>
              <button
                onClick={() => onStream(game)}
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-purple-500/20 text-purple-300 font-semibold hover:bg-purple-500/30 transition-colors border border-purple-500/30"
              >
                <Wifi className="w-5 h-5" />
                Stream
              </button>
              <button
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-500/20 text-green-300 font-semibold hover:bg-green-500/30 transition-colors border border-green-500/30"
              >
                <Bot className="w-5 h-5" />
                AI Play
              </button>
              <button
                onClick={onShowGameDetails}
                className="w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors border border-white/10"
              >
                <Eye className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 mb-6 flex-shrink-0">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
              activeTab === tab.id
                ? 'bg-white/10 text-white border border-white/15'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(100,150,200,0.3) transparent' }}>
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* About */}
            <LiquidGlassCard className="p-5" hover={false}>
              <h3 className="text-white font-bold text-lg mb-3">About This Game</h3>
              <p className="text-white/60 leading-relaxed">
                {game.description || 'An epic adventure awaits in this groundbreaking title that redefines the genre. Explore vast worlds, engage in intense combat, and uncover secrets that will change everything.'}
              </p>
            </LiquidGlassCard>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4">
              <LiquidGlassCard className="p-4 text-center" hover={false}>
                <Clock className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">12.5h</p>
                <p className="text-white/40 text-xs">Playtime</p>
              </LiquidGlassCard>
              <LiquidGlassCard className="p-4 text-center" hover={false}>
                <Star className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">8/15</p>
                <p className="text-white/40 text-xs">Achievements</p>
              </LiquidGlassCard>
              <LiquidGlassCard className="p-4 text-center" hover={false}>
                <Zap className="w-6 h-6 text-green-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">2h ago</p>
                <p className="text-white/40 text-xs">Last Played</p>
              </LiquidGlassCard>
            </div>

            {/* Game Trailer */}
            <LiquidGlassCard className="p-5" hover={false}>
              <h3 className="text-white font-bold text-lg mb-4">Game Trailer</h3>
              <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
                <video 
                  className="w-full h-full object-cover"
                  controls
                  poster={game.banner || game.cover_image}
                >
                  <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" type="video/mp4" />
                </video>
              </div>
            </LiquidGlassCard>
          </div>
        )}

        {activeTab === 'community' && (
          <div className="space-y-4">
            <LiquidGlassCard className="p-5" hover={false}>
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
            </LiquidGlassCard>
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-white font-bold text-lg">Achievement Guides</h3>
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
                <LiquidGlassCard key={i} className="p-4">
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
      style={{ background: 'linear-gradient(135deg, #1a1f2e 0%, #2d3548 25%, #3d4a5c 50%, #2d3548 75%, #1a1f2e 100%)' }}
    >
      {/* Ambient Glow Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-400/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-slate-300/5 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-200/3 rounded-full blur-[180px]" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex-shrink-0 px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(59,130,246,0.3) 0%, rgba(147,197,253,0.2) 100%)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <LibraryIcon className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white">My Library</h1>
              <p className="text-white/40 text-sm">{filteredGames.length} games</p>
            </div>
          </div>

          {/* View Toggle */}
          <div 
            className="flex items-center gap-1 p-1 rounded-xl"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'list' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-6">
          {['all', 'installed', 'favorites'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-sm font-medium transition-colors capitalize flex items-center gap-2 ${
                activeTab === tab ? 'text-white' : 'text-white/40 hover:text-white/70'
              }`}
            >
              {tab === 'favorites' && <Heart className="w-4 h-4" />}
              {tab}
              {activeTab === tab && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400 rounded-full"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 overflow-hidden px-6 pb-6">
        {viewMode === 'list' ? (
          <div className="flex gap-6 h-full">
            {/* Left Sidebar - Game List */}
            <div className="w-72 flex-shrink-0 flex flex-col gap-4">
              {/* Search */}
              <LiquidGlassCard className="p-3" hover={false}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <Input
                    type="text"
                    placeholder="Search games..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-white/5 border-white/10 pl-10 pr-10 text-white placeholder:text-white/30 focus:border-blue-500/50"
                  />
                  <button
                    onClick={startVoiceSearch}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 ${isListening ? 'text-red-400 animate-pulse' : 'text-white/40 hover:text-white'}`}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                </div>
              </LiquidGlassCard>

              {/* Game List */}
              <LiquidGlassCard className="flex-1 overflow-hidden" hover={false}>
                <div className="p-3 border-b border-white/10">
                  <p className="text-white/40 text-xs font-medium uppercase tracking-wider">Your Games</p>
                </div>
                <div className="overflow-y-auto h-full p-2" style={{ maxHeight: 'calc(100% - 48px)', scrollbarWidth: 'thin', scrollbarColor: 'rgba(100,150,200,0.3) transparent' }}>
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
              </LiquidGlassCard>
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
          <div className="h-full overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(100,150,200,0.3) transparent' }}>
            {/* Search Bar for Grid */}
            <div className="mb-6">
              <LiquidGlassCard className="p-3 max-w-md" hover={false}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <Input
                    type="text"
                    placeholder="Search games..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-white/5 border-white/10 pl-10 text-white placeholder:text-white/30 focus:border-blue-500/50"
                  />
                </div>
              </LiquidGlassCard>
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
                <div key={genre} className="mb-10">
                  <div className="flex items-center gap-3 mb-5">
                    <h2 className="text-xl font-bold text-white">{genre}</h2>
                    <span className="text-white/30 text-sm">({genreGames.length})</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
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