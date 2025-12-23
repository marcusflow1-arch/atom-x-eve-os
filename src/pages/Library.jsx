import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '../components/auth/AuthContext';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import Achievements from './Achievements';
import DigitalAchievementCard from '@/components/achievements/DigitalAchievementCard';
import { Badge } from '@/components/ui/badge';
import { Library as LibraryIcon, Search, Play, Loader2, Gamepad2, Radio, Grid, List, Heart, Clock, Eye, Bot, Sparkles, Users, MessageSquare, ChevronRight, ChevronDown, Star, Zap, Trophy, X, Download, Settings, MoreHorizontal, Shield, Monitor, Car, Skull, Crosshair, Music, LayoutGrid, Flame, Mic, Layers, ShoppingCart } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { allMockGames } from '../components/store/mockData';
import RecentlyAchievedOverlay from '../components/library/RecentlyAchievedOverlay';
import OwnedGameOverlay from '../components/library/OwnedGameOverlay';
import GameAchievementsOverlay from '../components/library/GameAchievementsOverlay';
import GameLauncherOverlay from '../components/library/GameLauncherOverlay';
import RemotePlayOverlay from '../components/streaming/RemotePlayOverlay';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import LiquidGlassCard from '@/components/shared/LiquidGlassCard';

// --- Library Grid View Component (Classic Steam-style Layout) ---
const LibraryGridView = ({ games, onLaunchGame, onStreamGame, onSwitchToAchievements }) => {
  const [selectedGame, setSelectedGame] = useState(games[0] || null);
  const [activeTab, setActiveTab] = useState('overview');
  const [activeCategory, setActiveCategory] = useState('all');
  const [isGenreOpen, setIsGenreOpen] = useState(true);

  // Group games by genre
  const gamesByGenre = React.useMemo(() => {
    return games.reduce((acc, game) => {
      const g = game.genre || 'Uncategorized';
      if (!acc[g]) acc[g] = [];
      acc[g].push(game);
      return acc;
    }, {});
  }, [games]);

  const genres = Object.keys(gamesByGenre);

  if (games.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <p className="text-white/50">No games found</p>
      </div>
    );
  }

  const tabs = ['Overview', 'Discussion', 'Streamers', 'Guide', 'Support', 'Achievements', 'Streamer Affiliate'];

  return (
    <div className="h-full flex">
      {/* Left Sidebar */}
      <div className="w-56 flex-shrink-0 border-r border-white/10 p-4 overflow-y-auto" style={{ background: 'rgba(20, 30, 45, 0.6)' }}>
        {/* Library Section */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-white/50 text-xs font-semibold uppercase tracking-wider mb-3">
            <Layers className="w-3.5 h-3.5" />
            Library
          </div>
          <div className="space-y-1">
            <button
              onClick={() => setActiveCategory('all')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeCategory === 'all' 
                  ? 'bg-blue-500/20 text-white border border-blue-500/30' 
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              All Games
              {activeCategory === 'all' && <ChevronRight className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setActiveCategory('installed')}
              className={`w-full flex items-center px-3 py-2 rounded-lg text-sm transition-all ${
                activeCategory === 'installed' ? 'text-white' : 'text-white/40 hover:text-white/70'
              }`}
            >
              Installed Games
            </button>
            <button
              onClick={() => setActiveCategory('favorites')}
              className={`w-full flex items-center px-3 py-2 rounded-lg text-sm transition-all ${
                activeCategory === 'favorites' ? 'text-white' : 'text-white/40 hover:text-white/70'
              }`}
            >
              Favorites Games
            </button>
          </div>
        </div>

        {/* Genre Categories */}
        <div>
          <button 
            onClick={() => setIsGenreOpen(!isGenreOpen)}
            className="flex items-center justify-between w-full text-white/50 text-xs font-semibold uppercase tracking-wider mb-3"
          >
            <span>Genre Categories</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isGenreOpen ? '' : '-rotate-90'}`} />
          </button>
          
          {isGenreOpen && (
            <div className="space-y-1">
              {genres.map((genre) => (
                <div key={genre}>
                  <div className="flex items-center gap-2 px-2 py-1.5 text-white/40 text-xs">
                    <span>• {genre}</span>
                  </div>
                  <div className="pl-4 space-y-1">
                    {gamesByGenre[genre].map((game) => (
                      <button
                        key={game.id}
                        onClick={() => setSelectedGame(game)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-all ${
                          selectedGame?.id === game.id 
                            ? 'bg-blue-500/20 text-white border border-blue-500/30' 
                            : 'text-white/60 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <div className="w-8 h-8 rounded overflow-hidden flex-shrink-0 bg-black/30">
                          <img src={game.cover_image || game.cover} alt="" className="w-full h-full object-cover" />
                        </div>
                        <span className="truncate text-xs">{game.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6" style={{ background: 'rgba(15, 23, 42, 0.4)' }}>
        {selectedGame ? (
          <div className="flex gap-6">
            {/* Left - Game Cover & Info */}
            <div className="flex-shrink-0">
              {/* Game Cover */}
              <div className="w-40 aspect-[3/4] rounded-xl overflow-hidden border border-white/10 mb-4">
                <img 
                  src={selectedGame.cover_image || selectedGame.cover} 
                  alt={selectedGame.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Right - Game Details */}
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="mb-4">
                <Badge className="mb-2 bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
                  {selectedGame.genre}
                </Badge>
                <h1 className="text-3xl font-bold text-white mb-2">{selectedGame.title}</h1>
                <div className="flex items-center gap-4 text-sm text-white/50">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-blue-400" />
                    12.5h played
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-yellow-400" />
                    8/15 achievements
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 mb-6">
                <Button 
                  onClick={() => onLaunchGame(selectedGame)} 
                  className="bg-white text-black hover:bg-white/90 font-semibold px-6"
                >
                  <Play className="w-4 h-4 mr-2 fill-current" /> Play
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => onStreamGame(selectedGame)} 
                  className="border-white/20 hover:bg-white/10 text-white"
                >
                  <Radio className="w-4 h-4 mr-2" />
                </Button>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-6 border-b border-white/10 mb-6">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab.toLowerCase().replace(' ', '_'))}
                    className={`pb-3 text-sm font-medium transition-all relative ${
                      activeTab === tab.toLowerCase().replace(' ', '_')
                        ? 'text-white'
                        : 'text-white/40 hover:text-white/70'
                    }`}
                  >
                    {tab.toUpperCase()}
                    {activeTab === tab.toLowerCase().replace(' ', '_') && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
                    )}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="flex gap-6">
                {/* Main Content */}
                <div className="flex-1">
                  <h3 className="text-white font-semibold mb-3">About</h3>
                  <p className="text-white/60 text-sm leading-relaxed mb-6">
                    {selectedGame.description || 'Step into a vast fantasy world where your choices shape the destiny of kingdoms. This AI-reconstructed masterpiece brings together the best elements of classic RPG gaming with modern technology, offering an unparalleled immersive experience.'}
                  </p>

                  {/* Video/Trailer Placeholder */}
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-black/50 border border-white/10">
                    <img 
                      src={selectedGame.banner || selectedGame.cover_image || selectedGame.cover}
                      alt="trailer"
                      className="w-full h-full object-cover opacity-50"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center cursor-pointer hover:bg-white/30 transition-all">
                        <Play className="w-6 h-6 text-white fill-white ml-1" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Sidebar - Stats */}
                <div className="w-56 flex-shrink-0 space-y-4">
                  {/* Game Stats */}
                  <div className="p-4 rounded-xl border border-white/10" style={{ background: 'rgba(30, 40, 60, 0.5)' }}>
                    <h4 className="text-white/50 text-xs font-bold uppercase tracking-wider mb-3">Game Stats</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-white/50">Last Played</span>
                        <span className="text-white font-medium">Today</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-white/50">Time Played</span>
                        <span className="text-white font-medium">12.5 hrs</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-white/50">Achievements</span>
                        <span className="text-white font-medium">8 / 15</span>
                      </div>
                    </div>
                  </div>

                  {/* Friends Playing */}
                  <div className="p-4 rounded-xl border border-white/10" style={{ background: 'rgba(30, 40, 60, 0.5)' }}>
                    <h4 className="text-white/50 text-xs font-bold uppercase tracking-wider mb-3">Friends Playing</h4>
                    <div className="flex items-center gap-2">
                      {['A', 'B', 'C'].map((letter, i) => (
                        <div 
                          key={i}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                          style={{ background: ['#3b82f6', '#22c55e', '#f59e0b'][i] }}
                        >
                          {letter}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-white/30">
            <p>Select a game from the sidebar</p>
          </div>
        )}
      </div>
    </div>
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

function SwordsIcon(props) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
            <path d="m13 19 6-6" />
            <path d="M16 16l4 4" />
            <path d="M19 21l2-2" />
        </svg>
    )
}

const GENRE_ICONS = {
    'Action': SwordsIcon,
    'RPG': Shield,
    'Strategy': Trophy,
    'Simulation': Monitor,
    'Sports': Trophy,
    'Racing': Car,
    'Horror': Skull,
    'Shooter': Crosshair,
    'Music': Music,
    'Adventure': Gamepad2,
    'Puzzle': Zap,
    'Romance': Heart,
    'Sci-Fi': Sparkles,
};

// Luna Hero Game Card
const LunaHeroCard = ({ game, onPlay, onSelect }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className="relative h-[400px] rounded-3xl overflow-hidden cursor-pointer"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={() => onSelect(game)}
      whileHover={{ scale: 1.01 }}
      style={{
        boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 100px rgba(100,150,255,0.1)',
      }}
    >
      {/* Background Image */}
      <motion.img 
        src={game.banner || game.cover_image || game.cover} 
        alt={game.title}
        className="absolute inset-0 w-full h-full object-cover"
        animate={{ scale: isHovered ? 1.05 : 1 }}
        transition={{ duration: 0.6 }}
      />
      
      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-transparent" />
      
      {/* Animated Border Glow */}
      <motion.div 
        className="absolute inset-0 rounded-3xl pointer-events-none"
        animate={{ 
          boxShadow: isHovered 
            ? 'inset 0 0 0 2px rgba(100,180,255,0.5), 0 0 30px rgba(100,180,255,0.2)' 
            : 'inset 0 0 0 1px rgba(255,255,255,0.1)'
        }}
        transition={{ duration: 0.3 }}
      />
      
      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-8">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Badge className="mb-4 bg-white/10 text-white border-white/20 backdrop-blur-md text-xs">
            {game.genre}
          </Badge>
          <h2 className="text-5xl font-bold text-white mb-3 drop-shadow-lg">{game.title}</h2>
          <p className="text-white/60 text-sm mb-6 max-w-lg line-clamp-2">
            {game.description || 'An epic gaming experience awaits you.'}
          </p>
          
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => { e.stopPropagation(); onPlay(game); }}
              className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-white text-black font-bold text-lg hover:bg-white/90 transition-all shadow-xl"
            >
              <Play className="w-6 h-6 fill-current" />
              Play Now
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-white/10 text-white backdrop-blur-xl border border-white/20 font-medium hover:bg-white/20 transition-all"
            >
              <Eye className="w-5 h-5" />
              Details
            </motion.button>
          </div>
        </motion.div>
      </div>
      
      {/* Stats */}
      <div className="absolute top-6 right-6 flex items-center gap-4">
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black/40 backdrop-blur-xl border border-white/10">
          <Clock className="w-4 h-4 text-blue-400" />
          <span className="text-white text-sm font-medium">12.5h played</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black/40 backdrop-blur-xl border border-white/10">
          <Trophy className="w-4 h-4 text-yellow-400" />
          <span className="text-white text-sm font-medium">8/15</span>
        </div>
      </div>
    </motion.div>
  );
};

// Luna Game Card with liquid glass effect
const LunaGameCard = ({ game, isStreaming, onSelect, onPlay, index }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      whileHover={{ y: -10, scale: 1.02 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={() => onSelect(game)}
      className="relative cursor-pointer group"
    >
      <div 
        className="relative aspect-[3/4] rounded-2xl overflow-hidden"
        style={{
          boxShadow: isHovered 
            ? '0 25px 50px rgba(0,0,0,0.6), 0 0 40px rgba(100,150,255,0.2), inset 0 0 0 1px rgba(255,255,255,0.2)' 
            : '0 10px 30px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.08)',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Cover Image */}
        <motion.img 
          src={game.cover_image || game.cover} 
          alt={game.title}
          className="absolute inset-0 w-full h-full object-cover"
          animate={{ scale: isHovered ? 1.1 : 1 }}
          transition={{ duration: 0.6 }}
        />
        
        {/* Glass Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-90" />
        
        {/* Liquid Shine Effect */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        />
        
        {/* Live Badge */}
        {isStreaming && (
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-3 right-3 flex items-center gap-1.5 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg"
          >
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            LIVE
          </motion.div>
        )}
        
        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-white font-bold text-base mb-1 group-hover:text-blue-200 transition-colors drop-shadow-lg line-clamp-1">
            {game.title}
          </h3>
          <p className="text-white/50 text-xs capitalize mb-3">{game.genre}</p>
          
          {/* Mini Stats */}
          <div className="flex items-center gap-3 text-[10px] text-white/40">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>12.5h</span>
            </div>
            <div className="flex items-center gap-1">
              <Trophy className="w-3 h-3" />
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
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                onClick={(e) => { e.stopPropagation(); onPlay(game); }}
                className="w-16 h-16 rounded-full bg-white hover:bg-white/90 flex items-center justify-center transition-colors shadow-2xl"
              >
                <Play className="w-6 h-6 text-black fill-black ml-1" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Bottom Glow Line */}
        <motion.div 
          className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: isHovered ? 1 : 0, opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </motion.div>
  );
};

// Luna Sidebar Item
const LunaSidebarItem = ({ game, isSelected, isStreaming, onSelect, onPlay }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    onClick={() => onSelect(game)}
    className={`group relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-300 border ${
    isSelected 
    ? 'border-cyan-400/30 shadow-lg' 
    : 'hover:border-cyan-400/20 border-transparent'
    }`}
    style={isSelected ? {
    background: 'rgba(34, 211, 238, 0.12)',
    boxShadow: '0 0 12px rgba(34, 211, 238, 0.15), inset 0 1px 0 rgba(255,255,255,0.08)',
    } : {}}
    whileHover={{ x: 4 }}
  >
    {/* Game Thumbnail */}
    <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-black/50">
      <img src={game.cover_image || game.cover} alt={game.title} className="w-full h-full object-cover" />
      {isStreaming && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-500/90">
          <Radio className="w-4 h-4 text-white animate-pulse" />
        </div>
      )}
      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
        <Play className="w-5 h-5 text-white fill-white" />
      </div>
    </div>
    
    {/* Game Info */}
    <div className="flex-1 min-w-0">
      <h3 className={`font-semibold text-sm truncate transition-colors ${isSelected ? 'text-white' : 'text-white/70 group-hover:text-white'}`}>
        {game.title}
      </h3>
      <p className="text-white/30 text-xs capitalize">{game.genre}</p>
    </div>

    {/* Quick Play Button */}
    <motion.button
      onClick={(e) => { e.stopPropagation(); onPlay(game); }}
      className="w-8 h-8 rounded-full bg-white/10 hover:bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:text-black"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
    </motion.button>

    {/* Selected Indicator */}
    {isSelected && (
      <motion.div 
        layoutId="sidebarIndicator"
        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-400 to-cyan-400 rounded-r-full"
      />
    )}
  </motion.div>
);

// Luna Game Detail Panel - Redesigned with Card + Scrollable Content
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
    { id: 'overview', label: 'Overview' },
    { id: 'discussion', label: 'Discussion' },
    { id: 'streamers', label: 'Streamers' },
    { id: 'guide', label: 'Guide' },
    { id: 'support', label: 'Support' },
    { id: 'achievements', label: 'Achievements' },
    { id: 'streamer_affiliate', label: 'Streamer Affiliate' },
  ];

  return (
    <div className="h-full flex gap-6">
      {/* Left Side - Game Card + Actions */}
      <div className="flex-shrink-0 flex flex-col gap-4">
        {/* Game Card */}
        <div 
          className="w-48 aspect-[3/4] rounded-2xl overflow-hidden relative border border-white/10"
          style={{
            background: 'rgba(20, 30, 50, 0.8)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)'
          }}
        >
          <img 
            src={game.cover_image || game.cover} 
            alt={game.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          {/* Game Title on Card */}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <Badge className="mb-2 bg-blue-500/30 text-blue-200 border-blue-500/40 text-[10px]">
              {game.genre}
            </Badge>
            <h3 className="text-white font-bold text-sm leading-tight">{game.title}</h3>
            <div className="flex items-center gap-3 mt-2 text-[10px] text-white/50">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> 12.5h played
              </span>
              <span className="flex items-center gap-1">
                <Trophy className="w-3 h-3" /> 8/15
              </span>
            </div>
          </div>

          {/* Live Badge */}
          {isStreaming && (
            <div className="absolute top-2 right-2 flex items-center gap-1 bg-red-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              LIVE
            </div>
          )}
        </div>

        {/* Action Buttons - Play & Stream side by side, Options below */}
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <motion.button
              onClick={() => onPlay(game)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white text-black font-semibold text-xs hover:bg-white/90 transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Play
            </motion.button>
            <motion.button
              onClick={() => onStream(game)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-purple-500/20 text-purple-300 font-semibold text-xs hover:bg-purple-500/30 transition-all border border-purple-500/30"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Radio className="w-3.5 h-3.5" />
              Stream
            </motion.button>
          </div>
          <motion.button
            onClick={onShowGameDetails}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 text-white/70 font-medium text-xs hover:bg-white/20 transition-all border border-white/10"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Settings className="w-3.5 h-3.5" />
            Options
          </motion.button>
        </div>
      </div>

      {/* Right Side - Tabs + Scrollable Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Tab Navigation */}
        <div className="flex items-center gap-6 mb-4 flex-shrink-0 border-b border-white/10 pb-3">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`text-sm font-medium transition-all relative pb-1 ${
                activeTab === tab.id
                  ? 'text-white'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="activeTabIndicator"
                  className="absolute -bottom-3 left-0 right-0 h-0.5 bg-blue-400"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Scrollable Tab Content */}
        <div className="flex-1 overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.2) transparent' }}>
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div 
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6 pb-8"
              >
                {/* About */}
                <div>
                  <h3 className="text-white font-bold text-base mb-3">About</h3>
                  <p className="text-white/60 text-sm leading-relaxed">
                    {game.description || 'Step into a vast fantasy world where your choices shape the destiny of kingdoms. This AI-reconstructed masterpiece brings together the best elements of classic RPG gaming with modern technology, offering an unparalleled immersive experience.'}
                  </p>
                </div>

                {/* Game Trailer */}
                <div>
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-black/50 border border-white/10">
                    <img 
                      src={game.banner || game.cover_image || game.cover}
                      alt="trailer"
                      className="w-full h-full object-cover opacity-60"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center cursor-pointer hover:bg-white/30 transition-all">
                        <Play className="w-6 h-6 text-white fill-white ml-1" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Game Stats Sidebar Style */}
                <div className="p-4 rounded-xl border border-white/10" style={{ background: 'rgba(30, 40, 60, 0.5)' }}>
                  <h4 className="text-white/50 text-xs font-bold uppercase tracking-wider mb-3">Game Stats</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/50">Last Played</span>
                      <span className="text-white font-medium">Today</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/50">Time Played</span>
                      <span className="text-white font-medium">12.5 hrs</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/50">Achievements</span>
                      <span className="text-white font-medium">8 / 15</span>
                    </div>
                  </div>
                </div>

                {/* Friends Playing */}
                <div className="p-4 rounded-xl border border-white/10" style={{ background: 'rgba(30, 40, 60, 0.5)' }}>
                  <h4 className="text-white/50 text-xs font-bold uppercase tracking-wider mb-3">Friends Playing</h4>
                  <div className="flex items-center gap-2">
                    {['A', 'B', 'C'].map((letter, i) => (
                      <div 
                        key={i}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ background: ['#3b82f6', '#22c55e', '#f59e0b'][i] }}
                      >
                        {letter}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'discussion' && (
              <motion.div 
                key="discussion"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4 pb-8"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-bold text-base">Community Discussion</h3>
                  <Button size="sm" className="bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/30 text-xs">
                    <MessageSquare className="w-3 h-3 mr-1" />
                    New Post
                  </Button>
                </div>

                <div className="space-y-3">
                  {[
                    { title: 'Best build for endgame content?', replies: 45, user: 'DragonSlayer' },
                    { title: 'Hidden easter eggs in Chapter 5', replies: 23, user: 'MysticMage' },
                    { title: 'Looking for raid group tonight', replies: 12, user: 'ShadowNinja' },
                    { title: 'Tips for new players', replies: 67, user: 'VeteranGamer' },
                    { title: 'Bug report: Quest not completing', replies: 8, user: 'QATester' },
                  ].map((topic, i) => (
                    <div 
                      key={i} 
                      className="p-3 rounded-lg border border-white/5 hover:border-white/15 cursor-pointer transition-all"
                      style={{ background: 'rgba(30, 40, 60, 0.3)' }}
                    >
                      <h4 className="text-white font-medium text-sm mb-1 hover:text-blue-400 transition-colors">{topic.title}</h4>
                      <div className="flex items-center gap-4 text-xs text-white/40">
                        <span>by {topic.user}</span>
                        <span>{topic.replies} replies</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'achievements' && (
              <motion.div 
                key="achievements"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4 pb-8"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-white font-bold text-base">Achievement Progress</h3>
                  <button 
                    onClick={onShowAchievements}
                    className="text-blue-400 text-xs hover:text-blue-300 flex items-center gap-1"
                  >
                    View All <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="space-y-3">
                  {[
                    { name: 'Dragon Slayer Supreme', icon: '🐉', rarity: 'Legendary', progress: 100 },
                    { name: 'Master Thief', icon: '💰', rarity: 'Epic', progress: 75 },
                    { name: 'Arena Champion', icon: '⚔️', rarity: 'Epic', progress: 50 },
                    { name: 'Legendary Explorer', icon: '🗺️', rarity: 'Rare', progress: 30 },
                    { name: 'First Steps', icon: '👣', rarity: 'Common', progress: 100 },
                  ].map((achievement, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-white/5" style={{ background: 'rgba(30, 40, 60, 0.3)' }}>
                      <div className="text-2xl">{achievement.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-white font-medium text-sm">{achievement.name}</h4>
                          <Badge className={`text-[10px] ${
                            achievement.rarity === 'Legendary' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                            achievement.rarity === 'Epic' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
                            achievement.rarity === 'Rare' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                            'bg-slate-500/20 text-slate-400 border-slate-500/30'
                          }`}>
                            {achievement.rarity}
                          </Badge>
                        </div>
                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${achievement.progress}%` }}
                            transition={{ duration: 1, delay: i * 0.1 }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {(activeTab === 'streamers' || activeTab === 'guide' || activeTab === 'support' || activeTab === 'streamer_affiliate') && (
              <motion.div 
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center justify-center h-48 text-white/30"
              >
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                  {activeTab === 'streamers' && <Radio className="w-5 h-5" />}
                  {activeTab === 'guide' && <Eye className="w-5 h-5" />}
                  {activeTab === 'support' && <MessageSquare className="w-5 h-5" />}
                  {activeTab === 'streamer_affiliate' && <Users className="w-5 h-5" />}
                </div>
                <p className="text-sm capitalize">{activeTab.replace('_', ' ')} content coming soon</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

// --- Library Scroll Menu Component (Like Achievements) ---
const LibraryScrollMenu = ({ games, selectedGame, onSelectGame, onLaunchGame }) => {
  const [activeGameIndex, setActiveGameIndex] = useState(0);
  const scrollMenuRef = useRef(null);

  const ITEM_HEIGHT = 80;
  const ITEM_GAP = 24;
  // Position to align with center of game card (header ~100px + card starts ~0px from content, card is ~256px tall, center is ~128px)
  // Total offset from top: header area (~100px) + half of card height (~128px) = ~228px
  const CARD_CENTER_OFFSET = 228;

  // Sync selectedGame with activeGameIndex
  useEffect(() => {
    if (selectedGame && games.length > 0) {
      const idx = games.findIndex(g => g.id === selectedGame.id);
      if (idx !== -1 && idx !== activeGameIndex) {
        setActiveGameIndex(idx);
      }
    }
  }, [selectedGame, games]);

  // Wheel Navigation - only on the scroll menu area
  const handleWheel = (e) => {
    if (games.length === 0) return;
    e.stopPropagation();
    
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      if (e.deltaY > 0) {
        if (activeGameIndex < games.length - 1) {
          const newIndex = activeGameIndex + 1;
          setActiveGameIndex(newIndex);
          onSelectGame(games[newIndex]);
        }
      } else if (e.deltaY < 0) {
        if (activeGameIndex > 0) {
          const newIndex = activeGameIndex - 1;
          setActiveGameIndex(newIndex);
          onSelectGame(games[newIndex]);
        }
      }
    }
  };

  if (games.length === 0) return null;

  return (
    <div 
      ref={scrollMenuRef}
      onWheel={handleWheel}
      className="absolute top-0 bottom-0 left-0 w-40 flex flex-col items-center z-20"
    >
      <motion.div 
        className="flex flex-col items-center gap-6"
        animate={{ 
          y: CARD_CENTER_OFFSET - (activeGameIndex * (ITEM_HEIGHT + ITEM_GAP)) - (ITEM_HEIGHT / 2)
        }}
        transition={{ type: "spring", stiffness: 250, damping: 25 }}
      >
        {games.map((game, idx) => {
          const isActive = idx === activeGameIndex;
          return (
            <motion.div
              key={game.id}
              onClick={() => {
                setActiveGameIndex(idx);
                onSelectGame(game);
              }}
              animate={{ 
                scale: isActive ? 1.2 : 0.85,
                opacity: isActive ? 1 : 0.3,
                x: isActive ? 24 : 0
              }}
              className="flex flex-col items-center gap-2 cursor-pointer w-28"
            >
              <div className={`
                w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 overflow-hidden
                ${isActive 
                  ? 'shadow-[0_0_30px_rgba(34,211,238,0.3)] backdrop-blur-md border border-cyan-400/30' 
                  : 'border border-white/10 backdrop-blur-sm'
                }
              `}>
                <img 
                  src={game.cover_image || game.cover} 
                  alt={game.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider text-center truncate w-full transition-all duration-300 ${isActive ? 'text-white' : 'text-transparent'}`}>
                {game.title}
              </span>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};

export default function Library({ onSwitchToStore, onSwitchToAchievements }) {
  const { user, isAuthenticated } = useAuth();
  const [ownedGames, setOwnedGames] = useState([]);
  const [favoriteGames, setFavoriteGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'
  const [showTransitionMenu, setShowTransitionMenu] = useState(false);
  const [embeddedView, setEmbeddedView] = useState('library'); // 'library' | 'achievements'
  const [streamingGameId, setStreamingGameId] = useState(localStorage.getItem('streaming_game_id'));
  const [selectedGame, setSelectedGame] = useState(null);
  const [showRecentlyAchieved, setShowRecentlyAchieved] = useState(false);
  const [showAchievementsOverlay, setShowAchievementsOverlay] = useState(false);
  const [showGameDetailsOverlay, setShowGameDetailsOverlay] = useState(false);
  const [launchingGame, setLaunchingGame] = useState(null);
  const [streamingSession, setStreamingSession] = useState(null);
  const [activeDetailTab, setActiveDetailTab] = useState('overview');

  
  // Sidebar Filters
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 100]);
  const [minRating, setMinRating] = useState(0);
  const [isGenreOpen, setIsGenreOpen] = useState(true);

  const gamesByGenre = React.useMemo(() => {
    return ownedGames.reduce((acc, game) => {
      const g = game.genre || 'Uncategorized';
      if (!acc[g]) acc[g] = [];
      acc[g].push(game);
      return acc;
    }, {});
  }, [ownedGames]);

  const handleStreamGame = async (game) => {
    try {
      const res = await base44.functions.invoke('initiateRemotePlay', { game_id: game.id });
      if (res.data && res.data.success) {
        setStreamingSession({ game, session: res.data.session });
      } else {
        setStreamingSession({ game, session: { status: 'initializing' } });
      }
    } catch (e) {
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
        if (testGameAlpha) userGames.unshift(testGameAlpha);
      } else {
        if (testGameAlpha) userGames.push(testGameAlpha);
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
    <div className="h-screen w-full text-white overflow-hidden relative">
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

      {/* Left Side Scroll Menu */}
      <LibraryScrollMenu
        games={filteredGames}
        selectedGame={selectedGame}
        onSelectGame={setSelectedGame}
        onLaunchGame={handleLaunchGame}
      />

      <div className="relative z-10 px-8 py-8 pl-44">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => (onSwitchToAchievements ? onSwitchToAchievements() : setEmbeddedView('achievements'))}
              className="p-2.5 rounded-xl bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 hover:border-yellow-500/50 transition-all"
              title="Achievements"
            >
              <Trophy className="w-5 h-5 text-yellow-400" />
            </button>
            
            {/* View Mode Toggle */}
            <button
              onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
              className={`p-2.5 rounded-xl transition-all border ${
                viewMode === 'grid' 
                  ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' 
                  : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white'
              }`}
              title={viewMode === 'grid' ? 'Switch to List View' : 'Switch to Grid View'}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            {/* Search */}
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
        </div>



        {/* Transitional Menu Overlay */}
        <AnimatePresence>
          {showTransitionMenu && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex items-center justify-center"
            >
              {/* Close Button */}
              <button
                onClick={() => setShowTransitionMenu(false)}
                className="absolute top-6 right-6 p-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 transition-all"
              >
                <X className="w-5 h-5 text-white" />
              </button>

              {/* Menu Content - Blank for now */}
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <LayoutGrid className="w-16 h-16 text-white/20 mx-auto mb-6" />
                  <h2 className="text-2xl font-bold text-white mb-2">Menu</h2>
                  <p className="text-white/40">Content coming soon</p>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Area - List View (default) */}
        {viewMode === 'list' && (
          <div className="flex-1 min-h-[calc(100vh-200px)]">
            <LunaGamePanel
              game={selectedGame}
              isStreaming={selectedGame?.id === streamingGameId}
              onPlay={handleLaunchGame}
              onStream={handleStreamGame}
              onShowAchievements={() => setShowAchievementsOverlay(true)}
              onShowGameDetails={() => setShowGameDetailsOverlay(true)}
            />
          </div>
        )}
      </div>

      {/* Grid View - Full Screen Overlay (below header) */}
      {viewMode === 'grid' && (
        <div className="fixed top-0 left-0 right-0 bottom-0 z-30 bg-slate-900 flex flex-col">
          {/* Top Header Bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10" style={{ background: 'rgba(15, 23, 42, 0.95)' }}>
            {/* Left - Logo & Nav */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <button className="p-2 hover:bg-white/10 rounded-lg transition-all">
                  <div className="flex flex-col gap-1">
                    <span className="w-4 h-0.5 bg-white/80 rounded-full"></span>
                    <span className="w-4 h-0.5 bg-white/80 rounded-full"></span>
                    <span className="w-4 h-0.5 bg-white/80 rounded-full"></span>
                  </div>
                </button>
                <span className="text-white font-bold text-lg">Atom X Eve Library</span>
              </div>
              
              {/* Category Tabs */}
              <div className="flex items-center gap-1">
                <button className="px-4 py-1.5 rounded-full bg-blue-500 text-white text-sm font-medium">
                  Games
                </button>
                <button className="px-4 py-1.5 rounded-full text-white/60 hover:text-white text-sm font-medium transition-all">
                  Marketplace
                </button>
                <button className="px-4 py-1.5 rounded-full text-white/60 hover:text-white text-sm font-medium transition-all">
                  Trading Post
                </button>
              </div>
            </div>

            {/* Right - Search & Cart */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="text"
                  placeholder="Search games..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-48 bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/20"
                />
              </div>
              <button className="p-2 hover:bg-white/10 rounded-lg transition-all">
                <ShoppingCart className="w-5 h-5 text-white/60" />
              </button>
            </div>
          </div>

          {/* Secondary Header - Achievements & Search/View Toggle */}
          <div className="flex items-center justify-between px-4 py-3" style={{ background: 'rgba(20, 30, 45, 0.8)' }}>
            {/* Left - Achievements Button */}
            <button
              onClick={() => setEmbeddedView('achievements')}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20 transition-all"
            >
              <Trophy className="w-4 h-4" />
              <span className="text-sm font-medium">Achievements</span>
            </button>

            {/* Right - Search & View Toggle */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="text"
                  placeholder="Search games..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-48 bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/20"
                />
                <button className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Mic className="w-4 h-4 text-white/30 hover:text-white/60 transition-all" />
                </button>
              </div>
              
              {/* View Toggle */}
              <div className="flex items-center border border-white/10 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 transition-all ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'}`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 transition-all ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Grid Content */}
          <div className="flex-1 overflow-hidden">
            <LibraryGridView
              games={filteredGames}
              onLaunchGame={handleLaunchGame}
              onStreamGame={handleStreamGame}
              onSwitchToAchievements={() => setEmbeddedView('achievements')}
            />
          </div>
        </div>
      )}



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