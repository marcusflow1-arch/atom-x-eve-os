import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Crown, ChevronRight, ChevronUp, ChevronDown, X, Maximize2, 
  Users, Gamepad2, Target, Crosshair, Sword, Shield, Wand2, Car,
  Ghost, Puzzle, Mountain, Globe, Rocket, Heart, Brain, Zap, Star,
  TrendingUp, TrendingDown, Minus, Filter, Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Genre definitions with icons and stat types
const GENRES = [
  { id: 'fps', name: 'FPS', icon: Crosshair, color: 'from-red-500 to-orange-500', primaryStat: 'Damage Dealt', players: 1284332 },
  { id: 'rpg', name: 'RPG', icon: Sword, color: 'from-purple-500 to-pink-500', primaryStat: 'XP Gained', players: 2104876 },
  { id: 'action', name: 'Action', icon: Zap, color: 'from-yellow-500 to-red-500', primaryStat: 'Combo Score', players: 1567890 },
  { id: 'horror', name: 'Horror', icon: Ghost, color: 'from-gray-600 to-purple-900', primaryStat: 'Survival Time', players: 332110 },
  { id: 'racing', name: 'Racing', icon: Car, color: 'from-blue-500 to-cyan-500', primaryStat: 'Best Lap', players: 876543 },
  { id: 'strategy', name: 'Strategy', icon: Brain, color: 'from-green-500 to-teal-500', primaryStat: 'Matches Won', players: 654321 },
  { id: 'mmorpg', name: 'MMORPG', icon: Globe, color: 'from-indigo-500 to-purple-500', primaryStat: 'Level', players: 1987654 },
  { id: 'fighting', name: 'Fighting', icon: Sword, color: 'from-red-600 to-red-800', primaryStat: 'Win Rate', players: 543210 },
  { id: 'adventure', name: 'Adventure', icon: Mountain, color: 'from-emerald-500 to-green-600', primaryStat: 'Quests Done', players: 876543 },
  { id: 'puzzle', name: 'Puzzle', icon: Puzzle, color: 'from-pink-400 to-purple-500', primaryStat: 'Puzzles Solved', players: 432109 },
  { id: 'simulation', name: 'Simulation', icon: Gamepad2, color: 'from-cyan-500 to-blue-500', primaryStat: 'Hours Played', players: 321098 },
  { id: 'sports', name: 'Sports', icon: Trophy, color: 'from-green-500 to-lime-500', primaryStat: 'Wins', players: 765432 },
  { id: 'survival', name: 'Survival', icon: Shield, color: 'from-amber-600 to-orange-700', primaryStat: 'Days Survived', players: 456789 },
  { id: 'sandbox', name: 'Sandbox', icon: Mountain, color: 'from-yellow-500 to-amber-600', primaryStat: 'Creations', players: 654321 },
  { id: 'scifi', name: 'Sci-Fi', icon: Rocket, color: 'from-blue-600 to-indigo-700', primaryStat: 'Systems Explored', players: 543210 },
  { id: 'fantasy', name: 'Fantasy', icon: Wand2, color: 'from-violet-500 to-purple-600', primaryStat: 'Spells Cast', players: 876543 },
  { id: 'stealth', name: 'Stealth', icon: Ghost, color: 'from-slate-600 to-gray-800', primaryStat: 'Undetected Runs', players: 234567 },
  { id: 'platformer', name: 'Platformer', icon: Zap, color: 'from-orange-400 to-red-500', primaryStat: 'Levels Cleared', players: 345678 },
  { id: 'roguelike', name: 'Roguelike', icon: Target, color: 'from-red-500 to-pink-600', primaryStat: 'Runs Completed', players: 234567 },
  { id: 'openworld', name: 'Open World', icon: Globe, color: 'from-teal-500 to-cyan-600', primaryStat: 'Exploration %', players: 987654 },
];

// Generate mock leaderboard data
const generateLeaderboardData = (genreId, count = 100) => {
  const names = [
    'DragonSlayer', 'CyberNinja', 'MysticMage', 'ShadowBlade', 'IceWarrior',
    'PhoenixRise', 'StormBringer', 'NightHawk', 'GhostReaper', 'IronFist',
    'VoidWalker', 'SilverFang', 'DarkKnight', 'LightSeeker', 'FlameHeart',
    'ThunderBolt', 'StarDust', 'MoonShade', 'SunRay', 'EarthShaker'
  ];
  
  return Array.from({ length: count }, (_, i) => ({
    rank: i + 1,
    username: `${names[i % names.length]}${Math.floor(i / names.length) > 0 ? Math.floor(i / names.length) + 1 : ''}`,
    score: Math.floor(100000 - (i * 850) + Math.random() * 100),
    trend: i < 10 ? (Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'same') : 'same',
    trendAmount: Math.floor(Math.random() * 50),
    avatar: `https://i.pravatar.cc/150?u=${genreId}${i}`,
    isAI: Math.random() > 0.8
  }));
};

// Mini Leaderboard Tile (for homepage)
export const LeaderboardTile = ({ onClick, userRank = null }) => {
  const [currentGenreIndex, setCurrentGenreIndex] = useState(0);
  
  // Auto-scroll through genres
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentGenreIndex(prev => (prev + 1) % GENRES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const visibleGenres = [
    GENRES[currentGenreIndex],
    GENRES[(currentGenreIndex + 1) % GENRES.length],
    GENRES[(currentGenreIndex + 2) % GENRES.length],
    GENRES[(currentGenreIndex + 3) % GENRES.length],
    GENRES[(currentGenreIndex + 4) % GENRES.length],
  ];

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="relative w-full h-full rounded-xl overflow-hidden cursor-pointer group"
      style={{
        background: 'rgba(15, 23, 42, 0.8)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)'
      }}
    >
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <span className="text-white font-bold text-sm">LEADERBOARDS</span>
          </div>
          <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white/80 transition-colors" />
        </div>
        <p className="text-white/50 text-xs mt-1">By Genre</p>
      </div>

      {/* Genre List - Auto scrolling */}
      <div className="p-3 space-y-2">
        <AnimatePresence mode="popLayout">
          {visibleGenres.map((genre, index) => {
            const Icon = genre.icon;
            const mockUserRank = Math.floor(Math.random() * 10000) + 1;
            
            return (
              <motion.div
                key={`${genre.id}-${currentGenreIndex}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${genre.color} flex items-center justify-center`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{genre.name}</p>
                  <p className="text-white/40 text-xs">{(genre.players / 1000).toFixed(0)}K players</p>
                </div>
                <div className="text-right">
                  <p className="text-cyan-400 text-xs font-bold">#{mockUserRank.toLocaleString()}</p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Footer hint */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-slate-900/90 to-transparent">
        <p className="text-center text-white/40 text-xs">Click to explore all genres</p>
      </div>
    </motion.div>
  );
};

// Genre Selection Panel (after clicking tile)
const GenreSelectionPanel = ({ onSelectGenre, onClose, onFullScreen }) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredGenres = GENRES.filter(g => 
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="w-full h-full flex flex-col rounded-xl overflow-hidden"
      style={{
        background: 'rgba(15, 23, 42, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(30px)'
      }}
    >
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Trophy className="w-6 h-6 text-yellow-400" />
          <div>
            <h2 className="text-white font-bold text-lg">Genre Leaderboards</h2>
            <p className="text-white/50 text-sm">Select a genre to view rankings</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onFullScreen}
            className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/10"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-white/5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input
            placeholder="Search genres..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
          />
        </div>
      </div>

      {/* Genre Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {filteredGenres.map((genre) => {
            const Icon = genre.icon;
            const mockUserRank = Math.floor(Math.random() * 10000) + 1;
            
            return (
              <motion.button
                key={genre.id}
                whileHover={{ scale: 1.01, x: 4 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => onSelectGenre(genre)}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-left group"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${genre.color} flex items-center justify-center shadow-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-white font-bold">{genre.name}</p>
                    <Badge className="bg-white/10 text-white/60 text-xs">
                      {(genre.players / 1000000).toFixed(1)}M players
                    </Badge>
                  </div>
                  <p className="text-white/50 text-sm">{genre.primaryStat}</p>
                </div>
                <div className="text-right">
                  <p className="text-white/40 text-xs mb-1">Your Rank</p>
                  <p className="text-cyan-400 font-bold">#{mockUserRank.toLocaleString()}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-white/60 transition-colors" />
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

// Rank List View (after selecting genre)
const RankListView = ({ genre, onBack, onFullScreen, isFullScreen = false }) => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 });
  const [activeTab, setActiveTab] = useState('global');
  const [statFilter, setStatFilter] = useState('primary');
  const listRef = useRef(null);

  useEffect(() => {
    setLeaderboardData(generateLeaderboardData(genre.id, 100000));
  }, [genre]);

  // Virtualized rendering - only render visible items
  const visibleItems = leaderboardData.slice(visibleRange.start, visibleRange.end);

  const handleScroll = useCallback((e) => {
    const { scrollTop, clientHeight, scrollHeight } = e.target;
    const itemHeight = 64;
    const start = Math.floor(scrollTop / itemHeight);
    const visibleCount = Math.ceil(clientHeight / itemHeight) + 10;
    setVisibleRange({ start: Math.max(0, start - 5), end: start + visibleCount });
  }, []);

  // Jump controls
  const jumpRanks = (amount) => {
    const newStart = Math.max(0, Math.min(leaderboardData.length - 50, visibleRange.start + amount));
    setVisibleRange({ start: newStart, end: newStart + 50 });
    if (listRef.current) {
      listRef.current.scrollTop = newStart * 64;
    }
  };

  const Icon = genre.icon;

  const getTrendIcon = (trend) => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-400" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-white/30" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={`flex flex-col rounded-xl overflow-hidden ${isFullScreen ? 'fixed inset-4 z-50' : 'w-full h-full'}`}
      style={{
        background: 'rgba(15, 23, 42, 0.98)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(30px)'
      }}
    >
      {/* Header */}
      <div className={`p-4 border-b border-white/10 bg-gradient-to-r ${genre.color} bg-opacity-20`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10"
            >
              <ChevronRight className="w-5 h-5 rotate-180" />
            </Button>
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${genre.color} flex items-center justify-center shadow-lg`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-xl">{genre.name} Leaderboard</h2>
              <p className="text-white/60 text-sm">{(genre.players).toLocaleString()} ranked players</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isFullScreen && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onFullScreen}
                className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/10"
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
            )}
            {isFullScreen && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>

        {/* Tabs - Only in full screen */}
        {isFullScreen && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="bg-black/20">
              <TabsTrigger value="global">Global</TabsTrigger>
              <TabsTrigger value="friends">Friends</TabsTrigger>
              <TabsTrigger value="season">Season</TabsTrigger>
              <TabsTrigger value="stats">Stats</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </div>

      {/* Stat Filter Bar */}
      {isFullScreen && (
        <div className="p-3 border-b border-white/5 flex items-center gap-2 overflow-x-auto">
          <span className="text-white/40 text-sm mr-2">Sort by:</span>
          {['primary', 'accuracy', 'kd', 'headshots', 'matches'].map((stat) => (
            <Button
              key={stat}
              variant={statFilter === stat ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setStatFilter(stat)}
              className={statFilter === stat ? 'bg-white/20' : 'text-white/60'}
            >
              {stat === 'primary' ? genre.primaryStat : stat.toUpperCase()}
            </Button>
          ))}
        </div>
      )}

      {/* Jump Controls */}
      <div className="p-2 border-b border-white/5 flex items-center justify-between bg-black/20">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => jumpRanks(-1000)}
            className="text-white/60 hover:text-white text-xs"
          >
            ↑ 1,000
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => jumpRanks(-100)}
            className="text-white/60 hover:text-white text-xs"
          >
            ↑ 100
          </Button>
        </div>
        <span className="text-white/40 text-xs">
          Showing #{visibleRange.start + 1} - #{Math.min(visibleRange.end, leaderboardData.length)}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => jumpRanks(100)}
            className="text-white/60 hover:text-white text-xs"
          >
            ↓ 100
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => jumpRanks(1000)}
            className="text-white/60 hover:text-white text-xs"
          >
            ↓ 1,000
          </Button>
        </div>
      </div>

      {/* Leaderboard List */}
      <div 
        ref={listRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto"
        style={{ scrollBehavior: 'smooth' }}
      >
        {/* Spacer for virtualization */}
        <div style={{ height: visibleRange.start * 64 }} />
        
        {visibleItems.map((player) => (
          <motion.div
            key={player.rank}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`flex items-center gap-4 px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer ${
              player.rank <= 3 ? 'bg-gradient-to-r from-yellow-500/10 to-transparent' : ''
            }`}
          >
            {/* Rank */}
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0 ${
              player.rank === 1 ? 'bg-yellow-500 text-yellow-900' :
              player.rank === 2 ? 'bg-slate-400 text-slate-900' :
              player.rank === 3 ? 'bg-amber-600 text-amber-900' :
              'bg-slate-700/50 text-white/60'
            }`}>
              {player.rank <= 3 ? <Crown className="w-6 h-6" /> : player.rank}
            </div>

            {/* Avatar & Name */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <img 
                src={player.avatar} 
                alt={player.username}
                className="w-10 h-10 rounded-full object-cover border-2 border-white/10"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-white font-semibold truncate">{player.username}</p>
                  {player.isAI && (
                    <Badge className="bg-blue-500/20 text-blue-300 text-xs">AI</Badge>
                  )}
                </div>
                <p className="text-white/40 text-sm">{genre.primaryStat}</p>
              </div>
            </div>

            {/* Score */}
            <div className="text-right">
              <p className="text-white font-bold text-lg">{player.score.toLocaleString()}</p>
              <div className="flex items-center gap-1 justify-end">
                {getTrendIcon(player.trend)}
                {player.trend !== 'same' && (
                  <span className={`text-xs ${player.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                    {player.trendAmount}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
        
        {/* Bottom spacer */}
        <div style={{ height: Math.max(0, (leaderboardData.length - visibleRange.end) * 64) }} />
      </div>
    </motion.div>
  );
};

// Main Component with state management
export default function GenreLeaderboardSystem({ initialView = 'tile' }) {
  const [view, setView] = useState(initialView); // 'tile', 'genres', 'ranks', 'fullscreen'
  const [selectedGenre, setSelectedGenre] = useState(null);

  const handleTileClick = () => setView('genres');
  const handleSelectGenre = (genre) => {
    setSelectedGenre(genre);
    setView('ranks');
  };
  const handleBack = () => {
    if (view === 'fullscreen') {
      setView('ranks');
    } else if (view === 'ranks') {
      setView('genres');
      setSelectedGenre(null);
    } else {
      setView('tile');
    }
  };
  const handleFullScreen = () => setView('fullscreen');
  const handleClose = () => {
    setView('tile');
    setSelectedGenre(null);
  };

  // Render based on current view
  if (view === 'tile') {
    return <LeaderboardTile onClick={handleTileClick} />;
  }

  return (
    <AnimatePresence mode="wait">
      {view === 'genres' && (
        <GenreSelectionPanel
          key="genres"
          onSelectGenre={handleSelectGenre}
          onClose={handleClose}
          onFullScreen={handleFullScreen}
        />
      )}
      {(view === 'ranks' || view === 'fullscreen') && selectedGenre && (
        <RankListView
          key="ranks"
          genre={selectedGenre}
          onBack={handleBack}
          onFullScreen={handleFullScreen}
          isFullScreen={view === 'fullscreen'}
        />
      )}
    </AnimatePresence>
  );
}