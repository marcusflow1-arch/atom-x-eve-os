import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '../components/auth/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import Achievements from './Achievements';
import DigitalAchievementCard from '@/components/achievements/DigitalAchievementCard';
import CardEnhancementOverlay from '@/components/profile/CardEnhancementOverlay';
import ShinyCard from '@/components/shared/ShinyCard';
import { Badge } from '@/components/ui/badge';
import { Library as LibraryIcon, Search, Play, Loader2, Gamepad2, Radio, Grid, List, Heart, Clock, Eye, Bot, Sparkles, Users, MessageSquare, ChevronUp, ChevronRight, ChevronDown, Star, Zap, Trophy, X, Download, Settings, MoreHorizontal, Shield, Monitor, Car, Skull, Crosshair, Music, LayoutGrid, Flame, Mic } from 'lucide-react';
import VirtualizedGameList from '@/components/library/VirtualizedGameList';
import PageErrorBoundary from '@/components/error/PageErrorBoundary';
import { showError } from '@/components/error/ErrorToast';
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

  // New VerticalGameScroller (left strip with vertical scroll)
  const VerticalGameScroller = ({ games, selectedGame, onSelect, onPlay }) => {
    const colRef = useRef(null);
    return (
      <div className="relative h-full">
        <div
          ref={colRef}
          className="flex flex-col gap-3 overflow-y-auto pr-2 h-full"
          style={{ scrollbarWidth: 'none' }}
        >
          {games.map((game, i) => {
            const isActive = selectedGame?.id === game.id;
            return (
              <motion.div
                key={game.id || i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                whileHover={{ x: 4 }}
                className={`group relative flex items-center gap-3 p-3 rounded-xl cursor-pointer border ${
                  isActive ? 'border-cyan-400/30 bg-cyan-400/10 shadow-[0_0_24px_rgba(34,211,238,0.15)]' : 'border-white/10 hover:border-white/20'
                }`}
                onClick={() => onSelect(game)}
              >
                <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-black/50">
                  <img src={game.cover_image || game.cover} alt={game.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-70" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`font-semibold text-sm truncate ${isActive ? 'text-white' : 'text-white/80 group-hover:text-white'}`}>{game.title}</p>
                  <p className="text-white/40 text-xs capitalize truncate">{game.genre}</p>
                </div>
                <motion.button
                  onClick={(e) => { e.stopPropagation(); onPlay(game); }}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white text-white hover:text-black flex items-center justify-center transition-all"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Play className="w-3.5 h-3.5" />
                </motion.button>
              </motion.div>
            );
          })}
        </div>
      </div>
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
      <div className="flex items-center gap-2">
        <p className="text-white/30 text-xs capitalize">{game.genre}</p>
        {(game.card_rewards?.length > 0 || game.ability_unlocks?.length > 0) && (
          <div className="flex items-center gap-0.5 text-cyan-400/60" title="Cards & Abilities">
            <Sparkles className="w-2.5 h-2.5" />
            <span className="text-[9px]">{ (game.card_rewards?.length || 0) + (game.ability_unlocks?.length || 0) }</span>
          </div>
        )}
      </div>
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

// Game Discussion Section - Shows recent forum posts for a game
const GameDiscussionSection = ({ game, onNavigateToForum }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGamePosts = async () => {
      if (!game) return;
      setLoading(true);
      try {
        // Fetch posts related to this game from the Community/Forum
        const gamePosts = await base44.entities.Post.filter({
          game_title: game.title
        }, '-created_date', 5);
        setPosts(gamePosts || []);
      } catch (error) {
        console.error('Failed to fetch game posts:', error);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGamePosts();
  }, [game]);

  if (loading) {
    return (
      <motion.div key="discussion" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div key="discussion" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">Recent Discussions</h3>
        <Button 
          variant="outline"
          className="border-white/20 hover:bg-white/10 text-white"
          onClick={onNavigateToForum}
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          View All in Forum
        </Button>
      </div>

      {posts.length > 0 ? (
        <div className="space-y-3">
          {posts.map((post) => (
            <div 
              key={post.id}
              onClick={onNavigateToForum}
              className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer transition-all group"
            >
              <div className="flex items-start gap-4">
                {/* Author Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {post.created_by?.charAt(0).toUpperCase() || 'U'}
                </div>
                
                <div className="flex-1 min-w-0">
                  {/* Post Title */}
                  <h4 className="text-white font-medium group-hover:text-blue-400 transition-colors truncate">
                    {post.title}
                  </h4>
                  
                  {/* Post Preview */}
                  <p className="text-white/50 text-sm mt-1 line-clamp-2">
                    {post.content?.replace(/<[^>]*>/g, '').substring(0, 150)}...
                  </p>
                  
                  {/* Meta */}
                  <div className="flex items-center gap-4 mt-2 text-xs text-white/40">
                    <span>{post.created_by?.split('@')[0] || 'Anonymous'}</span>
                    <span>•</span>
                    <span>{new Date(post.created_date).toLocaleDateString()}</span>
                    {post.community && (
                      <>
                        <span>•</span>
                        <Badge variant="outline" className="text-[10px] border-white/20 text-white/50">
                          {post.community}
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Arrow */}
                <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-white/60 transition-colors flex-shrink-0" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-12 text-center bg-white/5 rounded-2xl border border-white/10">
          <MessageSquare className="w-16 h-16 text-white/20 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No Discussions Yet</h3>
          <p className="text-white/50 max-w-md mb-6">
            Be the first to start a conversation about {game?.title} in the Community Forum.
          </p>
          <Button 
            className="bg-blue-600 hover:bg-blue-500 rounded-full px-8 py-3"
            onClick={onNavigateToForum}
          >
            Start a Discussion
          </Button>
        </div>
      )}
    </motion.div>
  );
};

// Achievement Cards Section with Category Filters - Uses same UI as Achievements page
const AchievementCardsSection = ({ onShowAchievementsOverlay }) => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedCard, setSelectedCard] = useState(null);
  
  const categories = [
    { id: 'all', label: 'All' },
    { id: 'equipment', label: 'Equipment' },
    { id: 'abilities', label: 'Abilities' },
    { id: 'companions', label: 'Companions' },
    { id: 'teacher', label: 'Teacher' },
  ];

  // Mock achievement cards data with categories
  const achievementCards = [
    { id: 1, title: 'Plasma Shield', category: 'equipment', rarity: 'Rare', unlocked: true, description: 'A powerful energy shield that absorbs incoming damage.', stats: { defense: 25, energy: 15 }, series: 'Cyberpunk Collection' },
    { id: 2, title: 'Neural Blade', category: 'equipment', rarity: 'Epic', unlocked: true, description: 'A blade connected directly to your neural interface.', stats: { attack: 40, speed: 20 }, series: 'Cyberpunk Collection' },
    { id: 3, title: 'Void Armor', category: 'equipment', rarity: 'Legendary', unlocked: false, description: 'Armor forged in the void between dimensions.', stats: { defense: 60, magic: 30 }, series: 'Dark Souls Collection' },
    { id: 4, title: 'Fireball', category: 'abilities', rarity: 'Common', unlocked: true, description: 'Launch a devastating ball of fire at your enemies.', stats: { damage: 150, cooldown: 8 }, series: 'Elemental Series' },
    { id: 5, title: 'Time Warp', category: 'abilities', rarity: 'Epic', unlocked: false, description: 'Bend time itself to your will.', stats: { duration: 5, cooldown: 60 }, series: 'Temporal Series' },
    { id: 6, title: 'Shadow Strike', category: 'abilities', rarity: 'Rare', unlocked: true, description: 'Strike from the shadows with deadly precision.', stats: { damage: 200, critChance: 35 }, series: 'Assassin Series' },
    { id: 7, title: 'Phoenix', category: 'companions', rarity: 'Legendary', unlocked: false, description: 'A majestic phoenix that rises from the ashes.', stats: { fireDamage: 30, healBoost: 20 }, series: 'Mythical Beasts' },
    { id: 8, title: 'Wolf Spirit', category: 'companions', rarity: 'Rare', unlocked: true, description: 'A loyal wolf spirit that fights by your side.', stats: { speed: 25, tracking: 40 }, series: 'Spirit Animals' },
    { id: 9, title: 'Master Yun', category: 'teacher', rarity: 'Epic', unlocked: false, description: 'Ancient master of martial arts and wisdom.', stats: { xpBoost: 15, skillRate: 10 }, series: 'Legendary Teachers' },
    { id: 10, title: 'Sage Aria', category: 'teacher', rarity: 'Legendary', unlocked: false, description: 'A sage who has mastered the arcane arts.', stats: { magicBoost: 25, manaRegen: 15 }, series: 'Legendary Teachers' },
  ];

  const filteredCards = activeCategory === 'all' 
    ? achievementCards 
    : achievementCards.filter(c => c.category === activeCategory);

  const getRarityStyles = (rarity) => {
    switch(rarity) {
      case 'Legendary': return 'border-orange-500/50 text-orange-400 bg-orange-500/10';
      case 'Epic': return 'border-purple-500/50 text-purple-400 bg-purple-500/10';
      case 'Rare': return 'border-blue-500/50 text-blue-400 bg-blue-500/10';
      default: return 'border-slate-500/50 text-slate-400 bg-slate-500/10';
    }
  };

  const getCategoryIcon = (category) => {
    switch(category) {
      case 'equipment': return '⚔️';
      case 'abilities': return '✨';
      case 'companions': return '🐾';
      case 'teacher': return '📚';
      default: return '🏆';
    }
  };

  return (
    <motion.div 
      key="achievements" 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      {/* Simple Text Category Filters */}
      <div className="flex items-center gap-6">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`text-sm font-medium transition-all ${
              activeCategory === cat.id
                ? 'text-white'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Cards Grid - Consistent sizing */}
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-4">
        {filteredCards.map((card, i) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.03 }}
            onClick={() => setSelectedCard(card)}
            className="aspect-[3/4] rounded-xl overflow-hidden cursor-pointer group transition-all hover:scale-105"
          >
            {card.unlocked ? (
              /* Unlocked Card */
              <div className={`w-full h-full relative border ${getRarityStyles(card.rarity)} rounded-xl overflow-hidden`}
                   style={{ background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(8px)' }}>
                {/* Card Content */}
                <div className="absolute inset-0 flex flex-col p-3">
                  {/* Icon Area */}
                  <div className="flex-1 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-3xl">
                      {getCategoryIcon(card.category)}
                    </div>
                  </div>
                  
                  {/* Card Info */}
                  <div className="text-center">
                    <h3 className="text-white font-bold text-xs leading-tight mb-1 truncate">{card.title}</h3>
                    <Badge variant="outline" className={`text-[9px] h-4 px-1.5 border ${getRarityStyles(card.rarity)}`}>
                      {card.rarity}
                    </Badge>
                  </div>
                </div>
                
                {/* Hover Shine */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ) : (
              /* Locked Card - Question Mark */
              <div className="w-full h-full rounded-xl bg-slate-800/60 border border-white/10 flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-2">
                  <span className="text-2xl font-bold text-white/20">?</span>
                </div>
                <p className="text-white/30 text-xs font-medium">Locked</p>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Card Enhancement Overlay (same UI as Achievements page) */}
      <AnimatePresence>
        {selectedCard && (
          <CardEnhancementOverlay
            card={selectedCard}
            onClose={() => setSelectedCard(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

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
  const [favoriteGames, setFavoriteGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [embeddedView, setEmbeddedView] = useState('library'); // 'library' | 'achievements'
  const [streamingGameId, setStreamingGameId] = useState(localStorage.getItem('streaming_game_id'));
  const [selectedGame, setSelectedGame] = useState(null);
  const [showRecentlyAchieved, setShowRecentlyAchieved] = useState(false);
  const [showAchievementsOverlay, setShowAchievementsOverlay] = useState(false);
  const [showGameDetailsOverlay, setShowGameDetailsOverlay] = useState(false);
  const [launchingGame, setLaunchingGame] = useState(null);
  const [streamingSession, setStreamingSession] = useState(null);
  const [activeDetailTab, setActiveDetailTab] = useState('overview');
  const [activeGenre, setActiveGenre] = useState('All');
  const [sectionView, setSectionView] = useState('grid'); // 'grid' | 'details'
  
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

      <div className="relative z-10 px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-6">
            {/* Menu Button - circular like Luna Dashboard */}
            <button
              onClick={() => navigate(createPageUrl('LunaTemplate'))}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center transition-all shadow-lg border border-white/10"
            >
              <div className="flex flex-col gap-[3px]">
                <span className="w-4 h-[2px] bg-white/90 rounded-full"></span>
                <span className="w-4 h-[2px] bg-white/90 rounded-full"></span>
                <span className="w-4 h-[2px] bg-white/90 rounded-full"></span>
              </div>
            </button>

            {/* Achievements Link */}
            <button
              onClick={() => navigate(createPageUrl('LunaTemplate') + '?panel=achievements')}
              className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
            >
              <Trophy className="w-5 h-5 text-yellow-400" />
              <span className="text-lg font-semibold">Achievements</span>
            </button>

            <div className="h-6 w-px bg-white/10" />
            <h1 className="text-2xl font-bold text-white tracking-wide">Atom X Eve Library</h1>
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

        {/* Filter Tabs (List View Only) */}
        {viewMode === 'list' && (
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
        )}

        {viewMode === 'grid' ? (
          <div className="flex h-full">
              {/* LEFT SIDEBAR - SHINY BOX */}
              <div className="w-[460px] flex-shrink-0 h-[calc(100vh-140px)] pr-6 hidden lg:flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white/60 text-xs font-bold uppercase tracking-widest">Library</h3>
                  <div className="text-white/40 text-xs">{filteredGames.length} games</div>
                </div>
                <VerticalGameScroller
                  games={filteredGames}
                  selectedGame={selectedGame}
                  onSelect={setSelectedGame}
                  onPlay={handleLaunchGame}
                />
              </div>

              {/* RIGHT CONTENT AREA - GAME DETAILS */}
              <div className="flex-1 h-[calc(100vh-140px)] flex flex-col overflow-hidden">
                {selectedGame ? (
                  <>
                    {/* Game Header (No Box) */}
                    <div className="mb-8">
                      <div className="flex items-end gap-6 mb-6">
                         <div className="w-32 h-40 rounded-xl overflow-hidden shadow-2xl flex-shrink-0">
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
                        {['Overview', 'Discussion', 'Streamers', 'Guide', 'Support', 'Achievements', 'Streamer Affiliate'].map((tab) => {
                          const id = tab.toLowerCase().replace(' ', '_');
                          return (
                            <button
                              key={id}
                              onClick={() => setActiveDetailTab(id)}
                              className={`pb-4 text-sm font-bold uppercase tracking-wider transition-all relative ${
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
                        {activeDetailTab === 'overview' && (
                          <motion.div 
                            key="overview"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-8"
                          >
                             <div className="grid grid-cols-3 gap-6">
                                <div className="col-span-2 space-y-6">
                                  <div>
                                    <h3 className="text-lg font-bold text-white mb-3">About</h3>
                                    <p className="text-white/60 leading-relaxed text-sm">
                                      {selectedGame.description || 'Experience an epic journey in this critically acclaimed title. Master unique abilities, explore vast worlds, and uncover deep secrets that will challenge everything you know.'}
                                    </p>
                                  </div>
                                  
                                  {/* Trailer */}
                                  <div className="rounded-xl overflow-hidden bg-black/40 border border-white/10 aspect-video relative group cursor-pointer">
                                     <img src={selectedGame.banner || selectedGame.cover_image} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
                                     <div className="absolute inset-0 flex items-center justify-center">
                                       <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:scale-110 transition-transform">
                                          <Play className="w-6 h-6 fill-white text-white" />
                                       </div>
                                     </div>
                                  </div>
                                </div>

                                <div className="space-y-4">
                                   <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                      <h4 className="text-xs font-bold text-white/40 uppercase mb-4">Game Stats</h4>
                                      <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                          <span className="text-sm text-white/60">Last Played</span>
                                          <span className="text-sm text-white font-medium">Today</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                          <span className="text-sm text-white/60">Time Played</span>
                                          <span className="text-sm text-white font-medium">12.5 hrs</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                          <span className="text-sm text-white/60">Achievements</span>
                                          <span className="text-sm text-white font-medium">8 / 15</span>
                                        </div>
                                      </div>
                                   </div>
                                   
                                   <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                      <h4 className="text-xs font-bold text-white/40 uppercase mb-4">Friends Playing</h4>
                                      <div className="flex -space-x-2">
                                        {[1,2,3].map(i => (
                                          <div key={i} className="w-8 h-8 rounded-full bg-slate-700 border-2 border-slate-900 flex items-center justify-center text-xs font-bold">
                                            {String.fromCharCode(64+i)}
                                          </div>
                                        ))}
                                      </div>
                                   </div>
                                </div>
                             </div>
                          </motion.div>
                        )}

                        {activeDetailTab === 'discussion' && (
                          <GameDiscussionSection 
                            game={selectedGame} 
                            onNavigateToForum={() => navigate(createPageUrl('Community') + `?game=${encodeURIComponent(selectedGame.title)}`)}
                          />
                        )}
                        
                        {activeDetailTab === 'achievements' && (
                          <AchievementCardsSection 
                            onShowAchievementsOverlay={() => setShowAchievementsOverlay(true)}
                          />
                        )}

                        {['streamers', 'guide', 'support', 'streamer_affiliate'].includes(activeDetailTab) && (
                          <motion.div key="placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-64 text-white/30">
                             <Bot className="w-12 h-12 mb-4 opacity-50" />
                             <p>Content for {activeDetailTab.replace('_', ' ')} coming soon.</p>
                          </motion.div>
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
        ) : (
          <div className="flex flex-col">
            {/* Genre Tabs at Top */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <button
                onClick={() => { setActiveGenre('All'); setSectionView('grid'); }}
                className={`px-5 py-2.5 rounded-full border transition-all text-sm font-medium ${
                  activeGenre === 'All' 
                    ? 'bg-white/15 text-white border-white/30 shadow-lg' 
                    : 'text-white/60 hover:text-white hover:bg-white/5 border-white/10'
                }`}
              >
                All
              </button>
              {Object.keys(gamesByGenre).map((genre) => (
                <button
                  key={genre}
                  onClick={() => { setActiveGenre(genre); setSectionView('grid'); }}
                  className={`px-5 py-2.5 rounded-full border transition-all text-sm font-medium ${
                    activeGenre === genre 
                      ? 'bg-white/15 text-white border-white/30 shadow-lg' 
                      : 'text-white/60 hover:text-white hover:bg-white/5 border-white/10'
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>

            {/* Separator Line */}
            <div className="h-px w-full bg-white/10 mb-6" />

            {/* Content Below Line - Switches Between Grid & Details */}
            <AnimatePresence mode="wait">
              {sectionView === 'grid' ? (
                <motion.div
                  key="games-grid"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-4"
                >
                  {(activeGenre === 'All' ? filteredGames : filteredGames.filter(g => g.genre === activeGenre)).map((game, i) => (
                    <LunaGameCard
                      key={game.id || i}
                      game={game}
                      isStreaming={game.id === streamingGameId}
                      onSelect={(g) => { setSelectedGame(g); setSectionView('details'); }}
                      onPlay={handleLaunchGame}
                      index={i}
                    />
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="game-details"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col"
                >
                  {/* Back Button */}
                  <button
                    onClick={() => setSectionView('grid')}
                    className="self-start mb-6 flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white/90 transition-all"
                  >
                    <ChevronDown className="w-4 h-4 rotate-90" />
                    <span>Back to Library</span>
                  </button>

                  {/* Game Details Panel */}
                  <LunaGamePanel
                    game={selectedGame}
                    isStreaming={selectedGame?.id === streamingGameId}
                    onPlay={handleLaunchGame}
                    onStream={handleStreamGame}
                    onShowAchievements={() => setShowAchievementsOverlay(true)}
                    onShowGameDetails={() => setShowGameDetailsOverlay(true)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
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
    </PageErrorBoundary>
        );
}