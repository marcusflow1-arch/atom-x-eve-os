import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '../components/auth/AuthContext';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Library as LibraryIcon, Search, Play, Loader2, Gamepad2, Radio, Grid, List, Heart, Clock, Eye, Bot, Sparkles, Users, MessageSquare, ChevronRight, Star, Zap, Trophy, X, Download, Settings, MoreHorizontal, Shield, Monitor, Car, Skull, Crosshair, Music, LayoutGrid, Flame } from 'lucide-react';
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

// --- Shiny Sidebar Box Component ---
const ShinySidebarBox = ({ children, className = "" }) => {
  const x = useMotionValue(0);
  const mouseX = useSpring(x, { stiffness: 500, damping: 100 });
  
  const gradientBg = useTransform(
    mouseX, 
    [0, 1], 
    ["linear-gradient(105deg, transparent 0%, rgba(255,255,255,0) 0%, transparent 100%)", 
     "linear-gradient(105deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)"]
  );

  function handleMouseMove({ currentTarget, clientX }) {
    const { left, width } = currentTarget.getBoundingClientRect();
    x.set((clientX - left) / width);
  }

  return (
    <motion.div
      className={`relative overflow-hidden bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => x.set(0.5)}
      style={{
        background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)',
      }}
    >
        <motion.div
            className="absolute inset-0 pointer-events-none z-10"
            style={{
                background: useTransform(mouseX, val => 
                    `linear-gradient(105deg, transparent ${val * 100 - 20}%, rgba(255,255,255,0.1) ${val * 100}%, transparent ${val * 100 + 20}%)`
                ),
                opacity: 1
            }}
        />
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
    className={`group relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-300 ${
      isSelected 
        ? 'bg-white/10 shadow-lg' 
        : 'hover:bg-white/5'
    }`}
    style={isSelected ? {
      border: '1px solid rgba(255,255,255,0.15)',
      boxShadow: '0 4px 20px rgba(100,150,200,0.15), inset 0 1px 0 rgba(255,255,255,0.1)',
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

// Luna Game Detail Panel
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
    { id: 'community', label: 'Community', icon: Users },
    { id: 'achievements', label: 'Achievements', icon: Trophy },
  ];

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
              className="space-y-6"
            >
              {/* About */}
              <LiquidGlassCard className="p-5" hover={false}>
                <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-400" />
                  About This Game
                </h3>
                <p className="text-white/60 leading-relaxed">
                  {game.description || 'An epic adventure awaits in this groundbreaking title that redefines the genre. Explore vast worlds, engage in intense combat, and uncover secrets that will change everything.'}
                </p>
              </LiquidGlassCard>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { icon: Clock, value: '12.5h', label: 'Playtime', color: 'text-blue-400' },
                  { icon: Trophy, value: '8/15', label: 'Achievements', color: 'text-yellow-400' },
                  { icon: Zap, value: '2h ago', label: 'Last Played', color: 'text-green-400' },
                ].map((stat, i) => (
                  <LiquidGlassCard key={i} className="p-4 text-center" hover={false}>
                    <stat.icon className={`w-6 h-6 ${stat.color} mx-auto mb-2`} />
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-white/40 text-xs">{stat.label}</p>
                  </LiquidGlassCard>
                ))}
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
              <LiquidGlassCard className="p-5" hover={false}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-bold text-lg">Community Discussion</h3>
                  <Button size="sm" className="bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/30">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    New Post
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {[
                    { title: 'Best build for endgame content?', replies: 45, user: 'DragonSlayer' },
                    { title: 'Hidden easter eggs in Chapter 5', replies: 23, user: 'MysticMage' },
                    { title: 'Looking for raid group tonight', replies: 12, user: 'ShadowNinja' },
                  ].map((topic, i) => (
                    <motion.div 
                      key={i} 
                      className="p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer border border-white/5 hover:border-white/10"
                      whileHover={{ x: 4 }}
                    >
                      <h4 className="text-white font-medium mb-1">{topic.title}</h4>
                      <div className="flex items-center gap-4 text-xs text-white/40">
                        <span>by {topic.user}</span>
                        <span>{topic.replies} replies</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </LiquidGlassCard>
            </motion.div>
          )}

          {activeTab === 'achievements' && (
            <motion.div 
              key="achievements"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
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
                      <ChevronRight className="w-5 h-5 text-white/30" />
                    </div>
                  </LiquidGlassCard>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
  const [viewMode, setViewMode] = useState('grid');
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
    <div 
      className="min-h-screen text-white"
      style={{ background: 'linear-gradient(135deg, #1a1f2e 0%, #2d3548 25%, #3d4a5c 50%, #2d3548 75%, #1a1f2e 100%)' }}
    >
      {/* Ambient Glow Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-400/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-slate-300/5 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-200/3 rounded-full blur-[180px]" />
      </div>

      <div className="relative z-10 px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex-1"></div>

          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                placeholder="Search games..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all backdrop-blur-xl"
              />
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  viewMode === 'list' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-6 mb-8">
          {['all', 'installed', 'favorites'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-sm font-medium transition-colors capitalize pb-2 relative ${
                activeTab === tab ? 'text-white' : 'text-white/40 hover:text-white/70'
              }`}
            >
              {tab === 'favorites' && <Heart className="w-4 h-4 inline mr-2" />}
              {tab}
              {activeTab === tab && (
                <motion.div 
                  layoutId="activeLibraryTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400 to-cyan-400"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>

        {viewMode === 'grid' ? (
          <>
            {/* Hero Section - Featured Game */}
            {filteredGames.length > 0 && (
              <div className="mb-10">
                <LunaHeroCard 
                  game={selectedGame || filteredGames[0]} 
                  onPlay={handleLaunchGame}
                  onSelect={setSelectedGame}
                />
              </div>
            )}

            {/* Games Grid by Genre */}
            {(() => {
              const gamesByGenre = filteredGames.reduce((acc, game) => {
                const genre = game?.genre || 'Other';
                const genreKey = genre.charAt(0).toUpperCase() + genre.slice(1).toLowerCase();
                if (!acc[genreKey]) acc[genreKey] = [];
                acc[genreKey].push(game);
                return acc;
              }, {});

              return Object.entries(gamesByGenre).map(([genre, genreGames]) => (
                <div key={genre} className="mb-12">
                  <div className="flex items-center gap-3 mb-6">
                    <h2 className="text-xl font-bold text-white">{genre}</h2>
                    <span className="text-white/30 text-sm">({genreGames.length})</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                    {genreGames.map((game, idx) => (
                      <LunaGameCard
                        key={game.id}
                        game={game}
                        index={idx}
                        isStreaming={game.id === streamingGameId}
                        onSelect={setSelectedGame}
                        onPlay={handleLaunchGame}
                      />
                    ))}
                  </div>
                </div>
              ));
            })()}
          </>
        ) : (
          /* List View */
          <div className="flex gap-6">
            {/* Left Sidebar - Game List */}
            <div className="w-80 flex-shrink-0">
              <LiquidGlassCard className="p-4" hover={false}>
                <div className="mb-4">
                  <p className="text-white/40 text-xs font-medium uppercase tracking-wider">Your Games</p>
                </div>
                <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto pr-2" style={{ scrollbarWidth: 'none' }}>
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