import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '../components/auth/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import Achievements from './Achievements';
import { Badge } from '@/components/ui/badge';
import { Library as LibraryIcon, Search, Play, Loader2, Gamepad2, Radio, Clock, Eye, Bot, Sparkles, Users, ChevronRight, Star, Zap, Trophy, X, Shield, Mic, LayoutGrid } from 'lucide-react';
import PageErrorBoundary from '@/components/error/PageErrorBoundary';
import { showError } from '@/components/error/ErrorToast';
import GameLauncherOverlay from '../components/library/GameLauncherOverlay';
import RemotePlayOverlay from '../components/streaming/RemotePlayOverlay';
import LibraryGameOverlay from '../components/library/LibraryGameOverlay';
import LibraryFullGrid from '../components/library/LibraryFullGrid';
import { motion, AnimatePresence } from 'framer-motion';
import GlassPageFrame from '@/components/shared/GlassPageFrame';

// Vertical Game List Item for the sidebar
const LibrarySidebarItem = ({ game, isSelected, onSelect, onPlay }) => (
  <motion.div
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    whileHover={{ x: 4 }}
    onClick={() => onSelect(game)}
    className={`group relative flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all ${
      isSelected
        ? 'border-cyan-400/30 bg-cyan-400/10 shadow-[0_0_20px_rgba(34,211,238,0.12)]'
        : 'border-white/5 hover:border-white/15 hover:bg-white/5'
    }`}
  >
    {/* Selected indicator bar */}
    {isSelected && (
      <motion.div
        layoutId="libSidebarIndicator"
        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-400 to-cyan-400 rounded-r-full"
      />
    )}
    <div className="relative w-12 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-black/50">
      <img src={game.cover_image || game.cover} alt={game.title} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
    </div>
    <div className="min-w-0 flex-1">
      <p className={`font-semibold text-sm truncate ${isSelected ? 'text-white' : 'text-white/70 group-hover:text-white'}`}>{game.title}</p>
      <p className="text-white/35 text-xs capitalize truncate">{game.genre}</p>
    </div>
    <motion.button
      onClick={(e) => { e.stopPropagation(); onPlay(game); }}
      className="w-7 h-7 rounded-full bg-white/10 hover:bg-white text-white hover:text-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      <Play className="w-3 h-3 fill-current ml-0.5" />
    </motion.button>
  </motion.div>
);

// Luna Game Detail Panel (now unused - kept as reference, replaced by LibraryGameOverlay)
const LunaGamePanel = ({ game, isStreaming, onPlay, onStream, onShowAchievements, onShowGameDetails }) => {
  const [activeTab, setActiveTab] = useState('overview');
  
  if (!game) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <Gamepad2 className="w-20 h-20 text-white/10 mx-auto mb-4" />
          </motion.div>
          <p className="text-white/30 text-lg">Select a game to view details</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Eye },
    { id: 'cards_abilities', label: 'Cards & Abilities', icon: Sparkles },
    { id: 'achievements', label: 'Achievements', icon: Trophy },
    { id: 'community', label: 'Community', icon: Users },
    { id: 'streamer_affiliate', label: 'Streamer Affiliate', icon: Radio },
  ];

  const [videoMode, setVideoMode] = useState('gameplay'); // 'gameplay', 'card_demo', 'ability_preview'

  return (
    <div className="h-full flex flex-col">
      {/* Hero Section */}
      <div className="relative h-72 rounded-2xl overflow-hidden mb-6 flex-shrink-0">
        <motion.img 
          src={game.banner || game.cover_image || game.cover} 
          alt={game.title}
          className="w-full h-full object-cover"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6 }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent" />
        
        {/* Glass Border */}
        <div className="absolute inset-0 rounded-2xl" style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)' }} />
        
        {/* Live Badge */}
        {isStreaming && (
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-4 right-4 flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg"
          >
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            LIVE NOW
          </motion.div>
        )}
        
        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex items-end justify-between">
            <div>
              <Badge className="mb-3 bg-white/10 text-white border-white/20 backdrop-blur-md">
                {game.genre}
              </Badge>
              <h1 className="text-4xl font-black text-white mb-2 drop-shadow-lg">{game.title}</h1>
              <div className="flex items-center gap-6 text-sm text-white/60">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span>12.5 hours played</span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-400" />
                  <span>8/15 achievements</span>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <motion.button
                onClick={() => onPlay(game)}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-white text-black font-bold hover:bg-white/90 transition-all shadow-xl"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Play className="w-5 h-5 fill-current" />
                Play
              </motion.button>
              <motion.button
                onClick={() => onStream(game)}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-purple-500/20 text-purple-300 font-semibold hover:bg-purple-500/30 transition-all border border-purple-500/30"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Radio className="w-5 h-5" />
                Stream
              </motion.button>
              <motion.button
                onClick={onShowGameDetails}
                className="w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all border border-white/10"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <MoreHorizontal className="w-5 h-5 text-white" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 mb-6 flex-shrink-0">
        {tabs.map(tab => (
          <motion.button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
              activeTab === tab.id
                ? 'bg-white/10 text-white border border-white/15 shadow-lg'
                : 'text-white/40 hover:text-white hover:bg-white/5'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </motion.button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto pr-2" style={{ scrollbarWidth: 'none' }}>
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div 
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Rewards Summary - Identity First */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 p-4 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-cyan-500/20 rounded-lg text-cyan-400"><Sparkles className="w-4 h-4" /></div>
                    <h4 className="font-bold text-white">Progression</h4>
                  </div>
                  <p className="text-sm text-white/60">Unlocks <span className="text-white font-bold">3 Abilities</span> & <span className="text-white font-bold">5 Cards</span> for your Avatar.</p>
                </div>
                <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400"><Bot className="w-4 h-4" /></div>
                    <h4 className="font-bold text-white">AI Evolution</h4>
                  </div>
                  <p className="text-sm text-white/60">Trains <span className="text-white font-bold">Combat Tactics</span> & <span className="text-white font-bold">Stealth</span> traits.</p>
                </div>
                <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-green-500/20 rounded-lg text-green-400"><Shield className="w-4 h-4" /></div>
                    <h4 className="font-bold text-white">Synergy</h4>
                  </div>
                  <p className="text-sm text-white/60">Compatible with <span className="text-white font-bold">RPG</span> & <span className="text-white font-bold">Sci-Fi</span> decks.</p>
                </div>
              </div>

              {/* Game Media & Demonstration */}
              <div className="p-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-bold text-lg">Identity Preview</h3>
                  <div className="flex bg-white/5 rounded-lg p-1">
                    {['gameplay', 'card_demo', 'ability_preview'].map(mode => (
                      <button
                        key={mode}
                        onClick={() => setVideoMode(mode)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                          videoMode === mode ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'
                        }`}
                      >
                        {mode.replace('_', ' ').toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-white/10 group">
                  <video 
                    key={videoMode}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    controls
                    autoPlay
                    muted
                    loop
                    poster={game.banner || game.cover_image}
                  >
                    <source src={
                      videoMode === 'card_demo' ? "https://cdn.coverr.co/videos/coverr-playing-cards-on-a-table-5388/1080p.mp4" :
                      videoMode === 'ability_preview' ? "https://cdn.coverr.co/videos/coverr-fire-burning-in-slow-motion-5358/1080p.mp4" :
                      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
                    } type="video/mp4" />
                  </video>
                  <div className="absolute bottom-4 left-4 right-4 p-4 bg-black/60 backdrop-blur-md rounded-lg border border-white/10">
                    <p className="text-sm text-white font-medium">
                      {videoMode === 'gameplay' ? 'Experience the immersive world.' : 
                       videoMode === 'card_demo' ? 'See how cards interact with your deck.' : 
                       'Preview ability effects on your Avatar.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-8">
                {[
                  { icon: Sparkles, value: '5/12', label: 'Cards Unlocked', color: 'text-cyan-400' },
                  { icon: Zap, value: '3', label: 'Active Abilities', color: 'text-purple-400' },
                  { icon: Trophy, value: '8/15', label: 'Achievements', color: 'text-yellow-400' },
                ].map((stat, i) => (
                  <div key={i} className="text-center">
                    <stat.icon className={`w-6 h-6 ${stat.color} mx-auto mb-2`} />
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-white/40 text-xs">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* About - De-emphasized */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                <h3 className="text-white/60 font-bold text-sm mb-2 uppercase tracking-wider">About This Game</h3>
                <p className="text-white/50 text-sm leading-relaxed">
                  {game.description || 'An epic adventure awaits in this groundbreaking title that redefines the genre.'}
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === 'cards_abilities' && (
            <motion.div 
              key="cards_abilities"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Avatar Integration Placeholder */}
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8 border border-white/10 relative overflow-hidden">
                <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-blue-500/5 blur-3xl"></div>
                <div className="flex items-center gap-6 relative z-10">
                  <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                    <Bot className="w-8 h-8 text-white/50" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">Your Avatar Uses These Cards</h3>
                    <p className="text-white/50 text-sm">Cards earned in {game.title} are equipped to your global Avatar profile.</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-white font-bold text-lg mb-4">Unlockable Cards</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="aspect-[3/4] bg-white/5 rounded-xl border border-white/10 p-4 flex flex-col justify-between group hover:border-cyan-500/30 transition-colors cursor-pointer">
                      <div className="flex justify-between items-start">
                        <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 bg-cyan-500/10 text-[10px]">
                          Rare
                        </Badge>
                        <Shield className="w-4 h-4 text-white/20 group-hover:text-cyan-400 transition-colors" />
                      </div>
                      <div className="text-center">
                        <div className="w-12 h-12 mx-auto bg-white/5 rounded-full mb-3 flex items-center justify-center">
                          <Sparkles className="w-6 h-6 text-cyan-400" />
                        </div>
                        <h4 className="text-white font-bold text-sm">Plasma Shield</h4>
                        <p className="text-white/40 text-xs mt-1">Defense +15</p>
                      </div>
                      <div className="text-center">
                        <span className="text-[10px] text-white/30 uppercase tracking-wider">Tradable</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-white font-bold text-lg mb-4">Abilities</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2].map(i => (
                    <div key={i} className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                      <div className="w-12 h-12 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
                        <Zap className="w-6 h-6 text-purple-400" />
                      </div>
                      <div>
                        <h4 className="text-white font-bold">Neural Overload</h4>
                        <p className="text-white/50 text-sm mt-1">Stuns enemies in a 10m radius. Cooldown: 45s.</p>
                        <div className="mt-2 flex gap-2">
                          <Badge variant="outline" className="text-[10px] border-white/10 text-white/40">Active</Badge>
                          <Badge variant="outline" className="text-[10px] border-purple-500/30 text-purple-400">Epic</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'community' && (
            <motion.div 
              key="community"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="p-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-bold text-lg">Community Discussion</h3>
                  <Button size="sm" className="bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/30">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    New Post
                  </Button>
                </div>

                <div className="space-y-4">
                  {[
                    { title: 'Best build for endgame content?', replies: 45, user: 'DragonSlayer' },
                    { title: 'Hidden easter eggs in Chapter 5', replies: 23, user: 'MysticMage' },
                    { title: 'Looking for raid group tonight', replies: 12, user: 'ShadowNinja' },
                  ].map((topic, i) => (
                    <div 
                      key={i} 
                      className="pb-4 border-b border-white/10 last:border-0 cursor-pointer group"
                    >
                      <h4 className="text-white font-medium mb-1 group-hover:text-blue-400 transition-colors">{topic.title}</h4>
                      <div className="flex items-center gap-4 text-xs text-white/40">
                        <span>by {topic.user}</span>
                        <span>{topic.replies} replies</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'achievements' && (
            <motion.div 
              key="achievements"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white font-bold text-lg">Achievement Progress</h3>
                <button 
                  onClick={onShowAchievements}
                  className="text-blue-400 text-sm hover:text-blue-300 flex items-center gap-1"
                >
                  View All <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                {[
                  { name: 'Dragon Slayer Supreme', icon: '🐉', rarity: 'Legendary', progress: 100 },
                  { name: 'Master Thief', icon: '💰', rarity: 'Epic', progress: 75 },
                  { name: 'Arena Champion', icon: '⚔️', rarity: 'Epic', progress: 50 },
                  { name: 'Legendary Explorer', icon: '🗺️', rarity: 'Rare', progress: 30 },
                ].map((achievement, i) => (
                  <div key={i} className="p-1">
                    <div className="flex items-center gap-4">
                      <div className="text-3xl">{achievement.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-white font-medium">{achievement.name}</h4>
                          <Badge className={`text-xs ${
                            achievement.rarity === 'Legendary' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                            achievement.rarity === 'Epic' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
                            'bg-blue-500/20 text-blue-400 border-blue-500/30'
                          }`}>
                            {achievement.rarity}
                          </Badge>
                        </div>
                        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${achievement.progress}%` }}
                            transition={{ duration: 1, delay: i * 0.1 }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'streamer_affiliate' && (
            <motion.div 
              key="streamer_affiliate"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center h-64 text-white/30"
            >
              <Radio className="w-12 h-12 mb-4 opacity-50" />
              <p>Streamer Affiliate content coming soon</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default function Library({ onSwitchToStore, onSwitchToAchievements }) {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  // Escape key to exit back to Luna Dashboard
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        navigate(createPageUrl('LunaTemplate'));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);
  const [ownedGames, setOwnedGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [embeddedView, setEmbeddedView] = useState('library');
  const [streamingGameId, setStreamingGameId] = useState(localStorage.getItem('streaming_game_id'));
  const [selectedGame, setSelectedGame] = useState(null);
  const [overlayGame, setOverlayGame] = useState(null); // game for the right-side overlay
  const [showFullLibrary, setShowFullLibrary] = useState(false);
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
      showError(e, 'Start Stream');
      setStreamingSession({ game, session: { status: 'initializing' } });
    }
  };

  const handleLaunchGame = (game) => {
    setLaunchingGame(game);
  };

  useEffect(() => {
    const fetchOwnedGames = async () => {
      const isDev = import.meta.env.DEV;
      const useMock = isDev && window.localStorage.getItem('USE_MOCK_DATA') === 'true';
      let userGames = [];

      if (isAuthenticated) {
        try {
          const allGamesFromDb = await base44.entities.Game.filter({}, '-created_date', 100);
          const ownedIds = user?.purchased_items || [];
          userGames = allGamesFromDb.filter(g => ownedIds.includes(g.id));

          // Fallback to mock data in dev if user has no games
          if (userGames.length === 0 && useMock) {
            const { allMockGames } = await import('../components/store/mockData');
            const mockGamesArray = Object.values(allMockGames).slice(0, 5);
            userGames = mockGamesArray;
          }
        } catch (error) {
          console.error('Failed to fetch games:', error);
          if (useMock) {
            const { allMockGames } = await import('../components/store/mockData');
            userGames = Object.values(allMockGames).slice(0, 5);
          }
        }
      } else if (useMock) {
        // Not authenticated but in dev mode
        const { allMockGames } = await import('../components/store/mockData');
        userGames = Object.values(allMockGames).slice(0, 3);
      }
      
      setOwnedGames(Array.from(new Map(userGames.map(g => [g.id, g])).values()));
      setFavoriteGames(userGames.slice(0, 3));
      if (userGames.length > 0) setSelectedGame(userGames[0]);
      setLoading(false);
    };

    fetchOwnedGames();
    const handleStorageChange = () => setStreamingGameId(localStorage.getItem('streaming_game_id'));
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user, isAuthenticated]);

  const getFilteredGames = () => {
    let games = activeTab === 'installed' ? ownedGames.slice(0, Math.ceil(ownedGames.length / 2)) 
              : activeTab === 'favorites' ? favoriteGames : ownedGames;
    
    // Sidebar Filters
    if (selectedGenres.length > 0) {
        games = games.filter(game => selectedGenres.includes(game.genre));
    }
    if (minRating > 0) {
        games = games.filter(game => (game.rating || 0) >= minRating);
    }

    if (searchTerm) {
      games = games.filter(game =>
        game?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        game?.genre?.toLowerCase().includes(searchTerm.toLowerCase())
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
    <PageErrorBoundary pageName="Library">
    <GlassPageFrame>
    <div 
      className="min-h-screen text-white"
      style={{ background: 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 25%, #0d1117 50%, #1a1f2e 75%, #0f1419 100%)' }}
    >
      {/* Achievements Overlay-style Transition */}
      <AnimatePresence>
        {embeddedView === 'achievements' && (
          <motion.div
            key="library-achievements"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-xl"
          >
            <div className="absolute top-6 left-6">
              <button
                onClick={() => setEmbeddedView('library')}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white/90"
              >
                <Gamepad2 className="w-4 h-4 text-cyan-400" />
                <span>Achievements</span>
              </button>
            </div>

            <div className="w-full h-full overflow-hidden">
              <Achievements onExitToLibrary={() => setEmbeddedView('library')} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Ambient Glow Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-400/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-slate-300/5 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-200/3 rounded-full blur-[180px]" />
      </div>

      <div className="relative z-10 px-8 pt-20 pb-8">
        {/* Search Bar */}
        <div className="flex items-center justify-end gap-4 mb-6">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-white/60 transition-colors" />
            <input
              type="text"
              placeholder="Search games..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 bg-white/5 border border-white/10 rounded-xl pl-11 pr-10 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all backdrop-blur-xl"
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition-all">
              <Mic className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Unified Library Layout: Sidebar + Content */}
        <div className="flex h-[calc(100vh-160px)]">
          {/* LEFT SIDEBAR - Game List */}
          <div className="w-[220px] min-w-[200px] flex-shrink-0 h-full pr-4 hidden lg:flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white/60 text-xs font-bold uppercase tracking-widest">Library</h3>
              <div className="text-white/40 text-xs">{filteredGames.length} games</div>
            </div>
            <VerticalGameScroller
              games={filteredGames}
              selectedGame={selectedGame}
              onSelect={(game) => { setSelectedGame(game); }}
              onPlay={handleLaunchGame}
            />
          </div>

          {/* Faded Vertical Divider */}
          <div className="w-px flex-shrink-0 self-stretch my-4 hidden lg:block" style={{ background: 'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.10) 30%, rgba(255,255,255,0.10) 70%, transparent 100%)' }} />

          {/* RIGHT CONTENT AREA */}
          <div className="flex-1 h-full flex flex-col overflow-hidden pl-4">
            {selectedGame ? (
              <>
                {/* Game Header */}
                <div className="mb-6 flex-shrink-0">
                  <div className="flex items-end gap-6 mb-6">
                     <div className="w-28 h-36 rounded-xl overflow-hidden shadow-2xl flex-shrink-0">
                       <img src={selectedGame.cover_image || selectedGame.cover} alt={selectedGame.title} className="w-full h-full object-cover" />
                     </div>
                     <div className="flex-1">
                       <Badge className="mb-2 bg-white/10 text-white border-white/20 backdrop-blur-md">{selectedGame.genre}</Badge>
                       <h1 className="text-4xl font-black text-white mb-2 tracking-tight">{selectedGame.title}</h1>
                       <div className="flex items-center gap-6 text-sm text-white/60 mb-4">
                         <div className="flex items-center gap-2">
                           <Clock className="w-4 h-4 text-blue-400" />
                           <span>12.5h played</span>
                         </div>
                         <div className="flex items-center gap-2">
                           <Trophy className="w-4 h-4 text-yellow-400" />
                           <span>8/15 achievements</span>
                         </div>
                       </div>
                       <div className="flex gap-3">
                         <Button onClick={() => handleLaunchGame(selectedGame)} className="bg-white text-black hover:bg-white/90 font-bold">
                           <Play className="w-4 h-4 mr-2 fill-current" /> Play
                         </Button>
                         <Button variant="outline" onClick={() => handleStreamGame(selectedGame)} className="border-white/20 hover:bg-white/10 text-white">
                           <Radio className="w-4 h-4 mr-2" /> Stream
                         </Button>
                       </div>
                     </div>
                  </div>

                  {/* Clean Navigation Line */}
                  <div className="flex items-center gap-8 border-b border-white/10">
                    {['Content', 'Community', 'Achievements', 'Streamers', 'Discussion', 'Streamer Affiliate', 'Support'].map((tab) => {
                      const id = tab.toLowerCase().replace(/ /g, '_');
                      return (
                        <button
                          key={id}
                          onClick={() => setActiveDetailTab(id)}
                          className={`pb-4 text-sm font-bold uppercase tracking-wider transition-all relative whitespace-nowrap ${
                            activeDetailTab === id ? 'text-white' : 'text-white/40 hover:text-white'
                          }`}
                        >
                          {tab}
                          {activeDetailTab === id && (
                            <motion.div 
                              layoutId="activeTabLine"
                              className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Content Area (Scrollable) */}
                <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
                  <AnimatePresence mode="wait">
                    {activeDetailTab === 'content' && (
                      <GameContentTab game={selectedGame} />
                    )}

                    {activeDetailTab === 'community' && (
                      <GameCommunityTab game={selectedGame} />
                    )}

                    {activeDetailTab === 'discussion' && (
                      <GameDiscussionTab game={selectedGame} />
                    )}
                    
                    {activeDetailTab === 'achievements' && (
                      <AchievementCardsSection 
                        onShowAchievementsOverlay={() => setShowAchievementsOverlay(true)}
                      />
                    )}

                    {activeDetailTab === 'streamers' && (
                      <motion.div key="streamers" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                        <EmbeddedGameStreamersList game={selectedGame} />
                      </motion.div>
                    )}

                    {activeDetailTab === 'streamer_affiliate' && (
                      <GameStreamerAffiliateTab game={selectedGame} />
                    )}

                    {activeDetailTab === 'support' && (
                      <GameSupportTab game={selectedGame} />
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-white/30">
                <Gamepad2 className="w-16 h-16 mb-4 opacity-50" />
                <p>Select a game from the library</p>
              </div>
            )}
          </div>
        </div>
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
    </GlassPageFrame>
    </PageErrorBoundary>
        );
}