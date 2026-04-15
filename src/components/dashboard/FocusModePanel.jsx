import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
        Calendar as CalendarIcon, Clock, Target, ChevronLeft, ChevronRight,
        Plus, Star, Zap, Sword, Shield, Wand2, Flame, Pin,
        Play, Sparkles, Trophy, Crown, Eye, Check, Trash2, X,
        Library as LibraryIcon, Radio, Gamepad2, Search, MoreHorizontal, Bot,
        Heart, BookOpen, Bell, Settings, Book, Home, Download, Ticket, Users, Tv, Swords, Layers, TrendingUp, Globe, UserPlus
      } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { allMockGames } from '../store/mockData';
import CardTutorialOverlay from '../cards/CardTutorialOverlay';
import LunaCardScroll from '../profile/LunaCardScroll';
import ScrollTransitionOverlay from '@/components/shared/ScrollTransitionOverlay';
import LimitedEditionDisplay from './LimitedEditionDisplay';
import EntertainmentRow from './EntertainmentRow';
import StreamPlayerBox from '@/components/streaming/StreamPlayerBox';
import StreamChatBox from '@/components/streaming/StreamChatBox';

import StatsPopupOverlay from '@/components/dashboard/StatsPopupOverlay';
import FriendsDropdown from '@/components/dashboard/FriendsDropdown';
import InventoryEquipOverlay from '@/components/profile/InventoryEquipOverlay';
import IntelligentCalendarOverlay from '@/components/calendar/IntelligentCalendarOverlay';
import EnvironmentSelector from '@/components/avatarHome/EnvironmentSelector';
import EnvironmentHub from '@/components/environment/EnvironmentHub';
import MemoriesDrawer from '@/components/dashboard/MemoriesDrawer';
import EnvHubDrawer from '@/components/dashboard/EnvHubDrawer';
import QuickChangeEnvDrawer from '@/components/dashboard/QuickChangeEnvDrawer';
import DateTimeTile from '@/components/dashboard/DateTimeTile';
import SystemUpdatesBox from '@/components/dashboard/SystemUpdatesBox';
import SystemUpdatesDrawer from '@/components/dashboard/SystemUpdatesDrawer';
import Mini3DViewerBox from '@/components/dashboard/Mini3DViewerBox';
import DevSpotlightRibbon from '@/components/dashboard/DevSpotlightRibbon';
import CardCollectionBrowser from '@/components/dashboard/CardCollectionBrowser';
import LiveIntelligenceFeed from './LiveIntelligenceFeed';


import { useQuery } from '@tanstack/react-query';

// Mock pinned games
const pinnedGames = [
  { id: 1, title: 'Cyberpunk 2088', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400', lastPlayed: '2 hours ago', progress: 68 },
  { id: 2, title: 'Elden Ring', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400', lastPlayed: 'Yesterday', progress: 45 },
  { id: 3, title: 'Stellar Odyssey', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400', lastPlayed: '3 days ago', progress: 92 },
  { id: 4, title: 'Shadow Realm', image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400', lastPlayed: 'Last week', progress: 23 },
  { id: 5, title: 'Neon Legends', image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400', lastPlayed: '2 days ago', progress: 55 },
];



// Upcoming cards with achievement-style design - organized by genre
const upcomingCards = [
  { 
    id: 1, 
    name: 'Voidtech Slayer', 
    type: 'Ability', 
    rarity: 'Legendary', 
    genre: 'RPG',
    game: 'Elden Ring: Nightreign', 
    icon: '⚔️',
    description: 'A devastating attack that rips through dimensional barriers, dealing massive damage to all enemies in a cone.',
    stats: { Power: 95, Cooldown: '12s', Range: 'Medium' },
    unlockCondition: 'Complete "The Eternal Night" questline',
    releaseDate: 'Season 3',
    lore: 'Forged in the void between worlds, this technique was mastered by the Nightreign Knights who guard the boundary between realms.'
  },
  { 
    id: 2, 
    name: 'Quantum Shield', 
    type: 'Equipment', 
    rarity: 'Epic', 
    genre: 'Sci-Fi',
    game: 'Cyberpunk 2088', 
    icon: '🛡️',
    description: 'Advanced nano-tech protection from the Night City underworld. Absorbs incoming damage.',
    stats: { Defense: 78, Duration: '8s', Absorption: '40%' },
    unlockCondition: 'Reach Cyberpunk genre level 15',
    releaseDate: 'Season 3',
    lore: 'Developed by Arasaka\'s black ops division, this shield creates a quantum probability field that deflects incoming projectiles.'
  },
  { 
    id: 3, 
    name: 'Arcane Surge', 
    type: 'Passive', 
    rarity: 'Rare', 
    genre: 'RPG',
    game: 'Baldur\'s Gate 3', 
    icon: '✨',
    description: 'Channel the Weave to amplify magical abilities. Each spell increases power.',
    stats: { Bonus: '+25%', Stack: '5x', Duration: '10s' },
    unlockCondition: 'Cast 1000 spells across RPG games',
    releaseDate: 'Available Now',
    lore: 'The Weave responds to those who show dedication. Masters of this technique can feel the very fabric of magic bend to their will.'
  },
  { 
    id: 4, 
    name: 'Neon Rush', 
    type: 'Ability', 
    rarity: 'Epic', 
    genre: 'Action',
    game: 'Neon Legends', 
    icon: '⚡',
    description: 'Burst of speed through the neon-lit streets. Become untargetable while dashing.',
    stats: { Speed: '+300%', Duration: '2s', Damage: '45' },
    unlockCondition: 'Win 50 races in Action games',
    releaseDate: 'Season 3',
    lore: 'Street racers who master this technique become living lightning, leaving only afterimages in their wake.'
  },
  { 
    id: 5, 
    name: 'Dragon\'s Breath', 
    type: 'Ability', 
    rarity: 'Legendary', 
    genre: 'RPG',
    game: 'Dragon Age', 
    icon: '🔥',
    description: 'Unleash the fury of an ancient dragon, breathing fire in a massive area.',
    stats: { Power: 120, Area: 'Large', Burn: '6s' },
    unlockCondition: 'Defeat 10 dragons across all games',
    releaseDate: 'Season 4',
    lore: 'Only those who have faced the mightiest beasts and emerged victorious can channel their primal fury.'
  },
];

// Card genres for filtering
const CARD_GENRES = ['All', 'RPG', 'Action', 'Sci-Fi', 'Horror', 'Strategy'];

const ALL_GENRES = ['Action', 'RPG', 'Strategy', 'Adventure', 'Shooter', 'Sci-Fi', 'Horror', 'Sports', 'Racing', 'Simulation', 'Puzzle'];

const rarityStyles = {
  Common: { border: 'border-slate-400', glow: '', ring: 'ring-slate-400/30', text: 'text-slate-300' },
  Rare: { border: 'border-blue-400', glow: 'shadow-[0_0_15px_rgba(59,130,246,0.4)]', ring: 'ring-blue-400/40', text: 'text-blue-300' },
  Epic: { border: 'border-purple-400', glow: 'shadow-[0_0_20px_rgba(168,85,247,0.5)]', ring: 'ring-purple-400/50', text: 'text-purple-300' },
  Legendary: { border: 'border-amber-400', glow: 'shadow-[0_0_25px_rgba(251,191,36,0.6)]', ring: 'ring-amber-400/60', text: 'text-amber-300' },
};

// Achievement-style Card Component with tilt effect
function AchievementStyleCard({ card, isSelected, onClick, size = 'normal' }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef(null);
  const style = rarityStyles[card.rarity];

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setTilt({
      x: (y - 0.5) * 20,
      y: (x - 0.5) * -20
    });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setIsHovered(false);
  };

  const sizeClasses = size === 'small' 
    ? 'w-20 h-28' 
    : size === 'medium'
    ? 'w-28 h-40'
    : size === 'large' 
    ? 'w-40 h-56' 
    : 'w-28 h-40';

  return (
    <motion.div
      ref={cardRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      animate={{
        rotateX: tilt.x,
        rotateY: tilt.y,
        scale: isSelected ? 1.05 : 1
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`${sizeClasses} relative cursor-pointer perspective-1000 flex-shrink-0`}
      style={{ transformStyle: 'preserve-3d' }}
    >
      {/* Card Base */}
      <div 
        className={`absolute inset-0 rounded-xl border-2 ${style.border} ${isSelected || isHovered ? style.glow : ''} overflow-hidden transition-shadow duration-300`}
        style={{
          background: 'linear-gradient(135deg, rgba(30, 40, 55, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)'
        }}
      >
        {/* Animated shine line */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(${105 + tilt.y * 2}deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)`,
          }}
        />
        
        {/* Content */}
        <div className="relative h-full flex flex-col p-2">
          {/* Rarity indicator */}
          <div className="flex justify-between items-start mb-1">
            <span className={`text-[8px] font-bold uppercase tracking-wider ${style.text}`}>
              {card.rarity}
            </span>
            {isSelected && <Eye className="w-3 h-3 text-white/60" />}
          </div>

          {/* Icon */}
          <div className="flex-1 flex items-center justify-center">
            <span className={`${size === 'large' ? 'text-5xl' : size === 'small' ? 'text-2xl' : 'text-3xl'}`}>{card.icon}</span>
          </div>

          {/* Name */}
          <div className="text-center">
            <p className={`text-white font-bold ${size === 'large' ? 'text-sm' : 'text-[10px]'} truncate`}>{card.name}</p>
            <p className={`text-white/50 ${size === 'large' ? 'text-xs' : 'text-[8px]'} truncate`}>{card.type}</p>
          </div>
        </div>

        {/* Corner decorations */}
        <div className={`absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 ${style.border} rounded-tl-lg`} />
        <div className={`absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 ${style.border} rounded-tr-lg`} />
        <div className={`absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 ${style.border} rounded-bl-lg`} />
        <div className={`absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 ${style.border} rounded-br-lg`} />
      </div>
    </motion.div>
  );
}

// CalendarModal removed in favor of IntelligentCalendarOverlay

// Library Game Card Component
function LibraryGameCard({ game, isSelected, onClick, onPlay }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
      className={`relative flex-shrink-0 w-32 cursor-pointer group ${isSelected ? 'ring-2 ring-cyan-400 rounded-xl' : ''}`}
    >
      <div 
        className="relative aspect-[3/4] rounded-xl overflow-hidden"
        style={{
          boxShadow: isHovered 
            ? '0 20px 40px rgba(0,0,0,0.5), 0 0 30px rgba(100,150,255,0.2)' 
            : '0 8px 20px rgba(0,0,0,0.3)',
          transition: 'all 0.3s ease',
        }}
      >
        <img 
          src={game.cover_image || game.cover} 
          alt={game.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-80" />
        
        {/* Hover Play Button */}
        <AnimatePresence>
          {isHovered && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            >
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                onClick={(e) => { e.stopPropagation(); onPlay?.(game); }}
                className="w-12 h-12 rounded-full bg-white hover:bg-white/90 flex items-center justify-center transition-colors shadow-xl"
              >
                <Play className="w-5 h-5 text-black fill-black ml-0.5" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Game Info */}
        <div className="absolute bottom-0 left-0 right-0 p-2">
          <h3 className="text-white font-bold text-xs truncate drop-shadow-lg">{game.title}</h3>
          <div className="flex items-center gap-2 text-[9px] text-white/50 mt-0.5">
            <div className="flex items-center gap-0.5">
              <Clock className="w-2.5 h-2.5" />
              <span>12h</span>
            </div>
            <div className="flex items-center gap-0.5">
              <Trophy className="w-2.5 h-2.5" />
              <span>8/15</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Game Detail Panel for selected game
function GameDetailPanel({ game, onClose }) {
  const [activeTab, setActiveTab] = useState('overview');
  
  if (!game) return null;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'discussion', label: 'Discussion' },
    { id: 'streamers', label: 'Streamers' },
    { id: 'guide', label: 'Guide' },
    { id: 'support', label: 'Support' },
    { id: 'achievements', label: 'Achievements' },
    { id: 'affiliate', label: 'Affiliate' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="h-full flex flex-col"
    >
      {/* Game Header */}
      <div className="flex gap-3 mb-3">
        <div className="w-16 h-20 rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
          <img src={game.cover_image || game.cover} alt={game.title} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-white font-bold text-base leading-tight">{game.title}</h2>
              <p className="text-white/40 text-[10px] capitalize">{game.genre}</p>
            </div>
            <button 
              onClick={onClose}
              className="w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
            >
              <X className="w-2.5 h-2.5 text-white/60" />
            </button>
          </div>
          
          {/* Stats */}
          <div className="flex items-center gap-3 text-[10px] text-white/50 mt-1.5">
            <div className="flex items-center gap-1">
              <Clock className="w-2.5 h-2.5 text-blue-400" />
              <span>12.5h</span>
            </div>
            <div className="flex items-center gap-1">
              <Trophy className="w-2.5 h-2.5 text-yellow-400" />
              <span>8/15</span>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2 mt-2">
            <button className="flex items-center gap-1 px-3 py-1.5 bg-white text-black rounded-md text-[10px] font-bold hover:bg-white/90 transition-colors">
              <Play className="w-2.5 h-2.5 fill-current" />
              Play
            </button>
            <button className="flex items-center gap-1 px-2.5 py-1.5 bg-purple-500/20 text-purple-300 rounded-md text-[10px] font-medium hover:bg-purple-500/30 transition-colors border border-purple-500/30">
              <Radio className="w-2.5 h-2.5" />
              Stream
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 mb-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-2 py-1 rounded-md text-[9px] font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-white/10 text-white border border-white/15'
                : 'text-white/40 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <div>
                <h3 className="text-white font-semibold text-xs mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  About
                </h3>
                <p className="text-white/50 text-[10px] leading-relaxed">
                  {game.description || 'Experience an epic journey in this critically acclaimed title. Master unique abilities, explore vast worlds, and uncover deep secrets.'}
                </p>
              </div>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: Clock, value: '12.5h', label: 'Played', color: 'text-blue-400' },
                  { icon: Trophy, value: '8/15', label: 'Achievements', color: 'text-yellow-400' },
                  { icon: Zap, value: '2h ago', label: 'Last Played', color: 'text-green-400' },
                ].map((stat, i) => (
                  <div key={i} className="text-center p-2 rounded-lg border" style={{ background: 'rgba(100, 120, 140, 0.08)', borderColor: 'rgba(255, 255, 255, 0.06)' }}>
                    <stat.icon className={`w-3 h-3 ${stat.color} mx-auto mb-1`} />
                    <p className="text-white font-bold text-xs">{stat.value}</p>
                    <p className="text-white/30 text-[8px]">{stat.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'discussion' && (
            <motion.div
              key="discussion"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              {[
                { title: 'Best build for endgame?', replies: 45, user: 'DragonSlayer' },
                { title: 'Hidden easter eggs found!', replies: 23, user: 'MysticMage' },
                { title: 'Looking for raid group', replies: 12, user: 'ShadowNinja' },
              ].map((topic, i) => (
                <div key={i} className="p-2 rounded-lg border cursor-pointer transition-colors hover:border-cyan-400/20" style={{ background: 'rgba(100, 120, 140, 0.08)', borderColor: 'rgba(255, 255, 255, 0.06)' }}>
                  <h4 className="text-white text-[10px] font-medium mb-0.5">{topic.title}</h4>
                  <p className="text-white/30 text-[8px]">by {topic.user} • {topic.replies} replies</p>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'achievements' && (
            <motion.div
              key="achievements"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              {[
                { name: 'Dragon Slayer', icon: '🐉', progress: 100, rarity: 'Legendary' },
                { name: 'Master Thief', icon: '💰', progress: 75, rarity: 'Epic' },
                { name: 'Arena Champion', icon: '⚔️', progress: 50, rarity: 'Rare' },
                { name: 'Explorer', icon: '🗺️', progress: 30, rarity: 'Common' },
              ].map((ach, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg border" style={{ background: 'rgba(100, 120, 140, 0.08)', borderColor: 'rgba(255, 255, 255, 0.06)' }}>
                  <span className="text-lg">{ach.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white text-[10px] font-medium">{ach.name}</span>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded ${
                        ach.rarity === 'Legendary' ? 'bg-orange-500/20 text-orange-400' :
                        ach.rarity === 'Epic' ? 'bg-purple-500/20 text-purple-400' :
                        ach.rarity === 'Rare' ? 'bg-cyan-500/20 text-cyan-400' :
                        'bg-white/10 text-white/50'
                      }`}>{ach.rarity}</span>
                    </div>
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-cyan-400 to-cyan-500 rounded-full"
                        style={{ width: `${ach.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {['streamers', 'guide', 'support', 'affiliate'].includes(activeTab) && (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-24 text-white/20"
            >
              <Eye className="w-6 h-6 mb-2 opacity-50" />
              <p className="text-[10px] capitalize">{activeTab} coming soon</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// Library Games Section (Bottom) - shows all games
function LibraryGamesSection({ onSelectGame, selectedGame, allGames, showGamePanel, onClosePanel }) {
  const navigate = useNavigate();
  const libraryScrollRef = useRef(null);
  const [showEntertainment, setShowEntertainment] = useState(false);

  // Show all games
  const currentGames = allGames;

  const handleLibraryClick = () => {
    // If in Entertainment view, switch back to Library view
    if (showEntertainment) {
      setShowEntertainment(false);
    } else {
      // If already in Library view, navigate to the full Library page
      navigate(createPageUrl('Store') + '?subview=library');
    }
  };

  const handleEntertainmentClick = (e) => {
    e.stopPropagation();
    // If in Library view, switch to Entertainment view
    if (!showEntertainment) {
      setShowEntertainment(true);
    } else {
      // If already in Entertainment view, navigate to full Entertainment page
      navigate(createPageUrl('LunaTemplate') + '?panel=entertainment');
    }
  };

  const handleGameClick = (game) => {
    onSelectGame(game);
  };

  // Vertical scroller: rows of 7 games
  const rows = [];
  for (let i = 0; i < currentGames.length; i += 7) {
    rows.push(currentGames.slice(i, i + 7));
  }

  return (
    <div className="h-full flex flex-col" onClick={(e) => {
      // Close panel when clicking outside of it (but not on games)
      if (e.target && !e.target.closest?.('[data-game-panel]') && !e.target.closest?.('[data-game-card]')) {
        onClosePanel();
      }
    }}>
      {/* Main Games Grid removed per request */}
    </div>
  );
}

// Game Side Menu - Slide-out from right
function GameSideMenu({ game, onClose }) {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  if (!game) return null;

  return (
    <>
      {/* Dimming Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
        onClick={onClose}
      />

      {/* Slide-out Menu */}
      <motion.div
        ref={menuRef}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed top-0 right-0 bottom-0 w-[300px] z-[101] border-l border-white/10 flex flex-col shadow-2xl"
        style={{
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(20px) saturate(150%)'
        }}
      >
        {/* Header - Game Cover Area */}
        <div className="relative h-48 flex-shrink-0">
          <img 
            src={game.cover_image || game.cover} 
            alt={game.title} 
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/50 to-slate-900" />
          
          <button 
            onClick={onClose}
            className="absolute top-4 left-4 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center transition-colors border border-white/10"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>

          <div className="absolute bottom-4 left-6 right-6">
            <h2 className="text-2xl font-bold text-white mb-1 shadow-lg">{game.title}</h2>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-white/10 border border-white/10 text-[10px] font-medium text-white/80">
                {game.genre || 'Action'}
              </span>
              <span className="text-[10px] text-white/50">Version 1.2.0</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Main Actions */}
          <div className="space-y-3">
            <button className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-white/90 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-white/10">
              <Play className="w-5 h-5 fill-current" />
              Play Now
            </button>
            
            <button className="w-full py-3 bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-semibold rounded-xl hover:bg-cyan-500/30 transition-all flex items-center justify-center gap-2">
              <Book className="w-4 h-4" />
              Manage Cards
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button className="py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all flex flex-col items-center justify-center gap-1">
                <Settings className="w-5 h-5 text-white/70" />
                <span className="text-xs font-medium text-white/70">Settings</span>
              </button>
              <button className="py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all flex flex-col items-center justify-center gap-1">
                <Zap className="w-5 h-5 text-amber-400" />
                <span className="text-xs font-medium text-white/70">Update</span>
              </button>
            </div>
          </div>

          <div className="w-full h-px bg-white/10" />

          {/* Season Eligibility */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20">
            <div className="flex items-center gap-3 mb-2">
              <Crown className="w-5 h-5 text-purple-400" />
              <h3 className="text-sm font-bold text-white">Season Eligible</h3>
            </div>
            <p className="text-xs text-white/60">
              Earn XP and Cards for the <span className="text-purple-300">Winter Season</span> by playing this game.
            </p>
          </div>

          {/* Stats */}
          <div>
             <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">Your Progress</h3>
             <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                   <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-blue-400" />
                      <span className="text-sm text-white/80">Time Played</span>
                   </div>
                   <span className="text-sm font-bold text-white">12.5h</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                   <div className="flex items-center gap-3">
                      <Trophy className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm text-white/80">Achievements</span>
                   </div>
                   <span className="text-sm font-bold text-white">8/15</span>
                </div>
             </div>
          </div>

          <div className="w-full h-px bg-white/10" />

          {/* Related Cards Preview */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider">Related Cards</h3>
              <button className="text-[10px] text-cyan-400 hover:text-cyan-300">View All</button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-16 h-20 rounded border border-white/10 bg-white/5 flex-shrink-0 flex items-center justify-center">
                   <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                      <Star className="w-4 h-4 text-white/40" />
                   </div>
                </div>
              ))}
            </div>
          </div>

          {/* About */}
          <div>
            <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2">About</h3>
            <p className="text-sm text-white/60 leading-relaxed">
              {game.description || 'Experience an epic journey in this critically acclaimed title. Master unique abilities, explore vast worlds, and uncover deep secrets.'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-black/20">
           <button className="w-full py-2 text-xs text-red-400 hover:text-red-300 transition-colors flex items-center justify-center gap-2">
              <Trash2 className="w-3 h-3" />
              Uninstall Game
           </button>
        </div>
      </motion.div>
    </>
  );
}

// Card Detail Overlay - Translucent Achievement style (like Destiny cards)
function CardDetailOverlay({ card, onClose }) {
  if (!card) return null;
  
  const style = rarityStyles[card.rarity];
  
  // Generate a card ID
  const cardId = `CARD-${card.id.toString().padStart(4, '0')}-${card.rarity?.substring(0, 1)}${card.type?.substring(0, 1)}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Translucent Backdrop with blur */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" />

      {/* Modal Container - Translucent glass box */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1.35, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-3xl rounded-2xl overflow-hidden border-2 ${style?.border || 'border-white/20'}`}
        style={{ transformOrigin: 'center' }}
        style={{
          background: 'linear-gradient(135deg, rgba(100, 120, 140, 0.15) 0%, rgba(80, 100, 120, 0.12) 100%)',
          backdropFilter: 'blur(35px) saturate(150%)',
          WebkitBackdropFilter: 'blur(35px) saturate(150%)',
          boxShadow: `0 25px 80px rgba(0,0,0,0.6), 0 0 60px ${
            card.rarity === 'Legendary' ? 'rgba(251, 191, 36, 0.15)' :
            card.rarity === 'Epic' ? 'rgba(168, 85, 247, 0.15)' :
            'rgba(34, 211, 238, 0.15)'
          }`
        }}
      >
        {/* Top Rarity Glow Bar */}
        <div className={`h-1 ${
          card.rarity === 'Legendary' ? 'bg-gradient-to-r from-transparent via-amber-400 to-transparent' :
          card.rarity === 'Epic' ? 'bg-gradient-to-r from-transparent via-purple-400 to-transparent' :
          'bg-gradient-to-r from-transparent via-blue-400 to-transparent'
        }`} />

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10 backdrop-blur-md border border-white/10"
        >
          <X className="w-5 h-5 text-white/80" />
        </button>

        <div className="p-8">
          <div className="flex gap-8">
            {/* Left Side - Card Preview in Glass Box */}
            <div className="flex-shrink-0 flex flex-col items-center">
              {/* Card Container with inner glow */}
              <div 
                className={`p-4 rounded-xl border ${style?.border || 'border-white/20'}`}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  boxShadow: `inset 0 0 30px ${
                    card.rarity === 'Legendary' ? 'rgba(251, 191, 36, 0.1)' :
                    card.rarity === 'Epic' ? 'rgba(168, 85, 247, 0.1)' :
                    'rgba(59, 130, 246, 0.1)'
                  }`
                }}
              >
                <AchievementStyleCard card={card} isSelected={true} size="large" />
              </div>
              
              {/* Card ID Badge */}
              <div className="mt-4 px-4 py-2 rounded-lg bg-white/5 border border-white/10">
                <p className="text-white/30 text-[10px] font-mono tracking-widest">{cardId}</p>
              </div>
            </div>

            {/* Right Side - Card Details */}
            <div className="flex-1 min-w-0">
              {/* Title */}
              <h2 className={`text-3xl font-black mb-2 ${style?.text || 'text-white'}`}>{card.name}</h2>
              
              {/* Meta Tags Row */}
              <div className="flex flex-wrap items-center gap-2 mb-5">
                {/* Rarity */}
                <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border ${
                  card.rarity === 'Legendary' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                  card.rarity === 'Epic' ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' :
                  'bg-blue-500/20 text-blue-300 border-blue-500/40'
                }`}>
                  <Star className="w-3 h-3 inline mr-1" />
                  {card.rarity}
                </span>
                
                {/* Type/Class */}
                <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 text-white/80 border border-white/10">
                  <Zap className="w-3 h-3 inline mr-1" />
                  {card.type}
                </span>
                
                {/* Genre */}
                <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 text-white/80 border border-white/10">
                  {card.genre}
                </span>

                {/* Release Status */}
                <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                  card.releaseDate === 'Available Now' 
                    ? 'bg-green-500/20 text-green-300 border-green-500/30' 
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}>
                  {card.releaseDate}
                </span>
              </div>

              {/* Description */}
              <p className="text-white/70 text-sm leading-relaxed mb-5">{card.description}</p>

              {/* Source Game */}
              <div className="flex items-center gap-2 mb-5 p-3 rounded-lg bg-white/5 border border-white/10">
                <Gamepad2 className="w-4 h-4 text-white/40" />
                <span className="text-white/60 text-sm">From: <span className="text-white font-medium">{card.game}</span></span>
              </div>

              {/* Stats Grid */}
              <div className="mb-5">
                <h4 className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-3">Card Stats</h4>
                <div className="grid grid-cols-3 gap-3">
                  {Object.entries(card.stats).map(([key, val]) => (
                    <div 
                      key={key} 
                      className="p-3 rounded-lg text-center border border-white/10"
                      style={{ background: 'rgba(255,255,255,0.03)' }}
                    >
                      <p className={`font-bold text-lg ${style?.text || 'text-cyan-400'}`}>{val}</p>
                      <p className="text-white/40 text-[10px] uppercase tracking-wide">{key}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lore */}
              {card.lore && (
                <div className="p-4 rounded-lg border border-white/10 mb-5" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <BookOpen className="w-4 h-4 text-white/30 mb-2" />
                  <p className="text-white/50 text-xs italic leading-relaxed">"{card.lore}"</p>
                </div>
              )}

              {/* Unlock Condition */}
              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span className="text-amber-300 text-xs font-bold uppercase tracking-wide">Unlock Condition</span>
                </div>
                <p className="text-white/80 text-sm">{card.unlockCondition}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-5">
                <button className="flex-1 px-5 py-3 bg-white text-black font-bold text-sm rounded-xl hover:bg-white/90 transition-all hover:scale-[1.02]">
                  Track Progress
                </button>
                <button className="px-5 py-3 bg-white/10 text-white font-medium text-sm rounded-xl hover:bg-white/20 transition-all border border-white/10">
                  <Heart className="w-4 h-4 inline mr-2" />
                  Wishlist
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Fade Bar */}
        <div className={`h-0.5 ${
          card.rarity === 'Legendary' ? 'bg-gradient-to-r from-transparent via-amber-400/50 to-transparent' :
          card.rarity === 'Epic' ? 'bg-gradient-to-r from-transparent via-purple-400/50 to-transparent' :
          'bg-gradient-to-r from-transparent via-blue-400/50 to-transparent'
        }`} />
      </motion.div>
    </motion.div>
  );
}

// Achievement Cards Trophy Box - navigates to achievements page
function AchievementCardsTrophy({ onClick }) {
  return (
    <motion.div 
      whileHover={{ y: -8, scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      onClick={onClick}
      className="w-[120px] h-44 flex-shrink-0 rounded-xl border border-amber-500/30 overflow-hidden relative group cursor-pointer flex flex-col items-center justify-center gap-3"
      style={{
        background: 'rgba(100, 120, 140, 0.08)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        boxShadow: '0 0 20px rgba(255, 215, 0, 0.1)'
      }}
    >
      {/* Trophy Icon */}
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <Trophy 
          className="w-16 h-16" 
          style={{ 
            stroke: '#FFD700',
            fill: 'rgba(255, 215, 0, 0.1)',
            filter: 'drop-shadow(0px 0px 12px rgba(255, 215, 0, 0.5))' 
          }} 
          strokeWidth={1.5} 
        />
      </motion.div>
      
      {/* Label */}
      <span className="text-amber-300/90 text-xs font-semibold text-center px-2" style={{ textShadow: '0 2px 6px rgba(255, 215, 0, 0.3)' }}>
        Achievement Cards
      </span>

      {/* Hover glow effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </motion.div>
  );
}

// Large 3D Card Component for Live Panel
function Large3DCard({ card, isActive }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef(null);
  const style = rarityStyles[card.rarity];

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setTilt({
      x: (y - 0.5) * 25,
      y: (x - 0.5) * -25
    });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setIsHovered(false);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      animate={{
        rotateX: tilt.x,
        rotateY: tilt.y,
        scale: isHovered ? 1.02 : 1
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="w-32 h-44 relative cursor-pointer flex-shrink-0"
      style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}
    >
      {/* Card Base */}
      <div 
        className={`absolute inset-0 rounded-xl border-2 ${style.border} ${isHovered ? style.glow : ''} overflow-hidden transition-shadow duration-300`}
        style={{
          background: 'linear-gradient(135deg, rgba(30, 40, 55, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          boxShadow: isHovered 
            ? `0 20px 40px rgba(0,0,0,0.5), 0 0 30px ${
                card.rarity === 'Legendary' ? 'rgba(251, 191, 36, 0.3)' :
                card.rarity === 'Epic' ? 'rgba(168, 85, 247, 0.3)' :
                'rgba(59, 130, 246, 0.3)'
              }` 
            : '0 10px 30px rgba(0,0,0,0.4)'
        }}
      >
        {/* Animated shine line */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(${105 + tilt.y * 2}deg, transparent 40%, rgba(255,255,255,0.2) 50%, transparent 60%)`,
          }}
        />
        
        {/* Content */}
        <div className="relative h-full flex flex-col p-3">
          {/* Rarity indicator */}
          <div className="flex justify-between items-start mb-2">
            <span className={`text-[9px] font-bold uppercase tracking-wider ${style.text}`}>
              {card.rarity}
            </span>
            <span className="text-[8px] text-white/40">{card.type}</span>
          </div>

          {/* Icon */}
          <div className="flex-1 flex items-center justify-center">
            <span className="text-5xl drop-shadow-lg">{card.icon}</span>
          </div>

          {/* Name */}
          <div className="text-center mt-2">
            <p className="text-white font-bold text-sm leading-tight">{card.name}</p>
            <p className="text-white/40 text-[9px] mt-1">{card.game}</p>
          </div>
        </div>

        {/* Corner decorations */}
        <div className={`absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 ${style.border} rounded-tl-lg`} />
        <div className={`absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 ${style.border} rounded-tr-lg`} />
        <div className={`absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 ${style.border} rounded-bl-lg`} />
        <div className={`absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 ${style.border} rounded-br-lg`} />
      </div>
    </motion.div>
  );
}

// Environment Hub Tile Component - now a dropdown trigger
function EnvironmentHubTile({ isOpen, onToggle, onQuickChangeToggle, isEnvironmentActive, onToggleEnvironment }) {
  return (
    <div 
      className="w-full h-full rounded-xl overflow-hidden relative group"
      style={{
        background: isOpen
          ? 'linear-gradient(145deg, rgba(18,32,52,0.98) 0%, rgba(10,20,36,0.99) 100%)'
          : 'linear-gradient(145deg, rgba(14,24,40,0.95) 0%, rgba(8,16,28,0.97) 100%)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: isOpen ? '1px solid rgba(125,211,252,0.35)' : '1px solid rgba(125,211,252,0.12)',
        boxShadow: isOpen ? '0 0 16px rgba(125,211,252,0.12), inset 0 1px 0 rgba(125,211,252,0.1)' : 'inset 0 1px 0 rgba(125,211,252,0.05)',
        transition: 'all 0.3s ease'
      }}
    >
      <button className="absolute inset-0 w-full h-full cursor-pointer" onClick={onToggle}>
        <img 
          src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80" 
          alt="Environment Hub"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
        <button 
          onClick={(e) => { e.stopPropagation(); onToggleEnvironment?.(); }}
          className="absolute top-2 left-2 px-3 py-1.5 rounded-lg bg-black/50 hover:bg-black/70 border border-white/10 text-white text-[10px] font-bold tracking-wider uppercase backdrop-blur-md transition-all z-10 flex items-center gap-1.5 group-hover:border-cyan-400/50 cursor-pointer"
        >
          {isEnvironmentActive ? (
            <><div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" /> Luna Dashboard</>
          ) : (
            <><div className="w-1.5 h-1.5 rounded-full bg-white/40" /> Luna Dashboard</>
          )}
        </button>
        <div className="absolute bottom-3 left-3 right-3 text-left">
          <h4 className="text-white font-bold text-sm truncate flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-400" />
            Environment Hub
          </h4>
          <p className="text-white/50 text-[10px]">Change your 3D world</p>
        </div>
      </button>
      
      <button 
        onClick={(e) => { e.stopPropagation(); onQuickChangeToggle(); }}
        className="absolute top-2 right-2 w-7 h-7 rounded-md bg-white/10 hover:bg-cyan-500/30 border border-white/20 flex items-center justify-center z-10 transition-colors cursor-pointer group-hover:bg-white/20"
        title="Quick Change Environments"
      >
        <LibraryIcon className="w-3.5 h-3.5 text-white" />
      </button>
    </div>
  );
}

// Friend Reference - clickable friends that show join/invite options
function FriendReference({ friend, isActive, onClick, onJoin, onInvite, onPartyInvite }) {
  return (
    <div className="relative">
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onClick(friend)}
        className={`relative w-16 h-16 rounded-lg overflow-hidden cursor-pointer border-2 transition-all flex-shrink-0 ${
          isActive ? 'border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)]' : 'border-white/10 hover:border-white/30'
        }`}
      >
        <img 
          src={friend.avatar} 
          alt={friend.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        <div className="absolute bottom-1 left-1 right-1">
          <p className="text-white text-[7px] font-bold truncate text-center">{friend.name}</p>
        </div>
        <div className={`absolute top-1 right-1 w-2 h-2 rounded-full ${
          friend.status === 'online' ? 'bg-green-500' : 'bg-slate-500'
        }`} />
      </motion.div>
      
      {/* Options dropdown when active */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 5 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-32 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-lg p-1.5 shadow-xl z-50 flex flex-col gap-1"
          >
            <button onClick={(e) => { e.stopPropagation(); onJoin(friend); }} className="w-full text-left px-2 py-1.5 hover:bg-white/10 rounded text-[9px] text-white transition-colors">
              Join Dashboard
            </button>
            <button onClick={(e) => { e.stopPropagation(); onInvite(friend); }} className="w-full text-left px-2 py-1.5 hover:bg-white/10 rounded text-[9px] text-white transition-colors">
              Invite to Dashboard
            </button>
            <button onClick={(e) => { e.stopPropagation(); onPartyInvite(friend); }} className="w-full text-left px-2 py-1.5 hover:bg-white/10 rounded text-[9px] text-white transition-colors">
              Invite to Party
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function HomeReference({ onClick }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="w-16 h-16 rounded-lg border-2 border-white/20 hover:border-cyan-400/50 flex flex-col items-center justify-center gap-1 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 transition-all flex-shrink-0"
    >
      <Home className="w-6 h-6 text-white/80" />
      <span className="text-[7px] font-bold text-white/80 uppercase tracking-wider">Home</span>
    </motion.button>
  );
}

// Bottom Nav Header (Replaces Quick Actions)
function BottomNavBoxes({ navigate, onLiveClick, showLive }) {
  return null;
}

// Library Banner Section - Now ONLY renders Banner + Memories (Quick Actions moved out)
export function LibraryBannerSection({ 
  games, onBackgroundChange, currentEnvId, onSelectEnv, showEnvDropdown, setShowEnvDropdown, onQuickChangeToggle,
  navBoxes, calendarBox, intelligenceFeed, isEnvironmentActive, onToggleEnvironment
}) {
  const envDropdownRef = useRef(null);
  const [activeFriend, setActiveFriend] = useState(null);
  const [onlineFriends, setOnlineFriends] = useState([]);
  const [showMemoriesDrawer, setShowMemoriesDrawer] = useState(false);
  const [memoriesExpanded, setMemoriesExpanded] = useState(false);
  const scrollRef = useRef(null);
  const { user } = useAuth();
  const [invitedUsers, setInvitedUsers] = useState({});

  const { data: dbUsers } = useQuery({
    queryKey: ['all_users_for_online_list'],
    queryFn: () => base44.entities.PlayerState.list(),
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (!dbUsers) return;
    const now = new Date();
    const isOnline = (p) => {
      if (p.player_id === user?.id) return false;
      if (p.last_update) {
        return (now.getTime() - p.last_update) < 120000;
      }
      return true;
    };

    const usersList = [];
    const seenIds = new Set();
    
    (Array.isArray(dbUsers) ? dbUsers : []).filter(p => p && isOnline(p)).forEach(p => {
      if (!p || !p.player_id) return;
      if (!seenIds.has(p.player_id)) {
        seenIds.add(p.player_id);
        usersList.push({
          id: p.player_id,
          name: p.display_name || 'Unknown',
          avatar: p.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.player_id}`,
          status: p.status || 'online',
          envUrl: p.env_url
        });
      }
    });

    setOnlineFriends(usersList.filter(f => f && f.id).slice(0, 5));
  }, [dbUsers, user]);

  const handleFriendClick = (friend) => {
    setActiveFriend(activeFriend?.id === friend.id ? null : friend);
  };

  const handleJoin = (u) => {
    setActiveFriend(null);
    if (onSelectEnv) {
      onSelectEnv({
        id: `joined_${u.id}`,
        modelUrl: u.envUrl || 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/ddff83a29_ModularEnvironment.fbx'
      });
    }
    window.dispatchEvent(new CustomEvent('joinMultiplayerChannel', {
      detail: { channelId: `dashboard_${u.id}`, hostId: u.id, hostName: u.name }
    }));
  };

  const handleInvite = (u) => {
    setInvitedUsers(prev => ({ ...prev, [u.id]: 'inviting' }));
    setTimeout(() => {
      setInvitedUsers(prev => ({ ...prev, [u.id]: 'accepted' }));
      window.dispatchEvent(new CustomEvent('joinMultiplayerChannel', {
        detail: { channelId: `dashboard_${user?.id || 'local'}`, hostId: user?.id, hostName: user?.full_name || 'My' }
      }));
      setActiveFriend(null);
    }, 2000);
  };

  const handlePartyInvite = (u) => {
    setActiveFriend(null);
    // You can add party invite logic/toast here later
  };

  const handleHomeClick = () => {
    setActiveFriend(null);
    if (onSelectEnv) {
      onSelectEnv({
        id: 'default_room',
        modelUrl: 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/ddff83a29_ModularEnvironment.fbx'
      });
    }
    window.dispatchEvent(new CustomEvent('joinMultiplayerChannel', {
      detail: { channelId: `dashboard_${user?.id || 'local'}`, hostId: user?.id, hostName: user?.full_name || 'My' }
    }));
  };

  return (
    <div className="flex flex-col items-start w-full h-full">
      {/* Game Banner + Memories */}
      <div ref={envDropdownRef} className="w-full h-full">
        <div className="flex flex-col gap-3 w-full h-full relative">
          {/* Top Row: Env Hub | Memories | Friends | Home | Online Users | Spacer | Calendar Box */}
          <div className="flex items-center gap-4 w-full h-24">
            {/* Environment Hub - Reduced by 25% */}
            <div className="w-[247px] h-full flex-shrink-0">
              <EnvironmentHubTile 
                isOpen={showEnvDropdown} 
                onToggle={() => setShowEnvDropdown(v => !v)} 
                onQuickChangeToggle={onQuickChangeToggle}
                isEnvironmentActive={isEnvironmentActive}
                onToggleEnvironment={onToggleEnvironment}
              />
            </div>

            {/* Memories & Line */}
            <div className="flex flex-shrink-0 items-center gap-2 h-full px-2">
              <button
                onClick={() => setShowMemoriesDrawer(true)}
                className="text-white/40 hover:text-cyan-300 text-[8px] uppercase tracking-wider transition-colors flex flex-col items-center justify-center gap-0.5"
              >
                <span className="text-xl leading-none">📷</span>
                <span className="leading-none">Memories</span>
              </button>
              <div className="w-px h-8 bg-white/10 mx-1 flex-shrink-0" />
            </div>

            {/* Friends (with placeholders) & Home & Online Users Dropdown */}
            <div className="flex flex-shrink-0 items-center gap-2 h-full">
              {(onlineFriends || []).filter(Boolean).map((friend) => (
                <div key={friend.id} className="flex-shrink-0">
                  <FriendReference 
                    friend={friend} 
                    onClick={handleFriendClick}
                    onJoin={handleJoin}
                    onInvite={handleInvite}
                    onPartyInvite={handlePartyInvite}
                    isActive={activeFriend?.id === friend.id}
                  />
                </div>
              ))}
              
              {/* Invisible Placeholders for Friends */}
              {[...Array(Math.max(0, 5 - onlineFriends.length))].map((_, i) => (
                <div key={`empty-${i}`} className="flex flex-col items-center gap-1 flex-shrink-0">
                  <Plus className="w-3.5 h-3.5 text-white" />
                  <div className="w-16 h-16 rounded-lg bg-transparent border border-white/5" />
                </div>
              ))}

              <div className="flex-shrink-0 ml-2">
                <HomeReference onClick={handleHomeClick} />
              </div>
              
              {/* Planet Icon / Online Users Dropdown moved here next to Home */}
              <div className="flex-shrink-0 ml-2 flex items-center justify-center">
                <OnlineUsersDropdown onSelectEnv={onSelectEnv} />
              </div>
            </div>

            {/* Calendar Box - Expanded to fill remaining space */}
            <div className="flex-1 min-w-[400px] h-full">
              {calendarBox}
            </div>
          </div>

          {/* Bottom Row: Nav Boxes */}
          <div className="flex justify-between items-start w-full">
            <div className="w-[330px] flex justify-center">
              {navBoxes}
            </div>
            {intelligenceFeed && (
              <div className="fixed right-8 z-[999] pointer-events-none" style={{ top: '188px', bottom: '96px' }}>
                <div className="pointer-events-auto h-full shadow-2xl">
                  {intelligenceFeed}
                </div>
              </div>
            )}
          </div>
        </div>
    </div>

      {/* Memories Drawer — slides in from right */}
      <AnimatePresence>
        {showMemoriesDrawer && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
              onClick={() => setShowMemoriesDrawer(false)}
            />
            <motion.div
              initial={{ x: memoriesExpanded ? '100vw' : 340, opacity: 0 }} 
              animate={{ x: 0, opacity: 1, width: memoriesExpanded ? '90vw' : '20rem' }} 
              exit={{ x: memoriesExpanded ? '100vw' : 340, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 z-[9999] flex flex-col rounded-l-3xl"
              style={{
                background: 'rgba(100, 120, 140, 0.12)',
                backdropFilter: 'blur(30px) saturate(150%)',
                WebkitBackdropFilter: 'blur(30px) saturate(150%)',
                borderLeft: '1px solid rgba(255, 255, 255, 0.10)',
                boxShadow: '-4px 0 30px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
              }}
            >
              {/* Expand Toggle */}
              <button
                onClick={() => setMemoriesExpanded(prev => !prev)}
                className="absolute top-1/2 -left-6 -translate-y-1/2 w-6 h-20 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-l-xl border-y border-l border-white/20 flex items-center justify-center z-10 transition-colors"
              >
                {memoriesExpanded ? <ChevronRight className="w-4 h-4 text-white" /> : <ChevronLeft className="w-4 h-4 text-white" />}
              </button>

              <div className="p-6 flex items-center justify-between border-b border-white/10 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📷</span>
                  <span className="text-white font-bold text-lg tracking-wide">Memories</span>
                </div>
                <button onClick={() => setShowMemoriesDrawer(false)} className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.1] flex items-center justify-center transition-all">
                  <X className="w-4 h-4 text-white/60" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4" style={{ scrollbarWidth: 'none' }}>
                <MemoriesDrawer
                  references={[]}
                  activeReference={null}
                  onSelectReference={() => {}}
                  onHomeClick={handleHomeClick}
                  onClose={() => setShowMemoriesDrawer(false)}
                  isExpanded={memoriesExpanded}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Online Users Dropdown
function OnlineUsersDropdown({ onSelectEnv }) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const ref = React.useRef(null);
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [joiningId, setJoiningId] = useState(null);
  const [invitedUsers, setInvitedUsers] = useState({});

  // Query actual users via PlayerState for real-time multiplayer presence
  const { data: dbUsers } = useQuery({
    queryKey: ['all_users_for_online_list'],
    queryFn: () => base44.entities.PlayerState.list(),
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  React.useEffect(() => {
    if (!dbUsers) return;

    const now = new Date();
    const isOnline = (p) => {
      if (p.player_id === user?.id) return true; // Always show self
      if (p.last_update) {
        return (now.getTime() - p.last_update) < 120000; // Consider online if updated in last 2 mins
      }
      return true; // Fallback if no last_update
    };

    // Filter to only show users who are actually online and remove duplicates
    const usersList = [];
    const seenIds = new Set();
    
    dbUsers.filter(isOnline).forEach(p => {
      if (!seenIds.has(p.player_id)) {
        seenIds.add(p.player_id);
        usersList.push({
          id: p.player_id,
          name: p.display_name || 'Unknown',
          avatar: p.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.player_id}`,
          status: p.status || 'online',
          isMe: p.player_id === user?.id,
          modelUrl: p.model_url || 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/gltf/Xbot.glb',
          envUrl: p.env_url || 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/ddff83a29_ModularEnvironment.fbx'
        });
      }
    });

    // Ensure current user is always at the top
    const meIndex = usersList.findIndex(u => u.isMe);
    if (meIndex > -1) {
      const me = usersList.splice(meIndex, 1)[0];
      me.name = me.name + ' (You)';
      usersList.unshift(me);
    } else if (user) {
       // Fallback if current user not in list yet
       usersList.unshift({
           id: user.id,
           name: (user.full_name || user.username || user.email?.split('@')[0] || 'Me') + ' (You)',
           avatar: user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
           status: 'online',
           isMe: true,
           modelUrl: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/gltf/Xbot.glb',
           envUrl: 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/ddff83a29_ModularEnvironment.fbx'
       });
    }

    setOnlineUsers(usersList);
  }, [dbUsers, user]);

  React.useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleJoin = (u) => {
    setJoiningId(u.id);
    setTimeout(() => {
      setJoiningId(null);
      setOpen(false);
      
      // Switch environment to match theirs
      if (onSelectEnv) {
        onSelectEnv({
          id: `joined_${u.id}`,
          modelUrl: u.envUrl || 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/ddff83a29_ModularEnvironment.fbx'
        });
      }

      // Connect to their world instance channel
      window.dispatchEvent(new CustomEvent('joinMultiplayerChannel', {
        detail: { channelId: `dashboard_${u.id}`, hostId: u.id, hostName: u.name }
      }));
    }, 1500);
  };
  
  const handleInvite = (e, u) => {
    e.stopPropagation();
    setInvitedUsers(prev => ({ ...prev, [u.id]: 'inviting' }));
    setTimeout(() => {
      setInvitedUsers(prev => ({ ...prev, [u.id]: 'accepted' }));
      
      // Simulate them joining us
      window.dispatchEvent(new CustomEvent('joinMultiplayerChannel', {
        detail: { channelId: `dashboard_${user?.id || 'local'}`, hostId: user?.id, hostName: user?.full_name || 'My' }
      }));
    }, 2000);
  };

  const filteredUsers = onlineUsers.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="relative" ref={ref}>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(v => !v)}
        title="Online Users"
        className="w-8 h-8 rounded-xl flex items-center justify-center transition-all border"
        style={{
          background: open ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.06)',
          borderColor: open ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.1)',
          boxShadow: open ? '0 0 10px rgba(59,130,246,0.2)' : 'none',
        }}
      >
        <Globe className="w-4 h-4 text-blue-300" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-2 right-0 w-64 rounded-2xl overflow-hidden z-[100]"
            style={{
              background: 'rgba(12, 18, 30, 0.96)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(59,130,246,0.25)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}
          >
            {/* Header */}
            <div className="px-3 pt-3 pb-2 border-b border-white/5 flex items-center justify-between">
              <p className="text-xs font-bold text-white/90 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                Global Online
              </p>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-[10px] font-bold">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                {onlineUsers.length} Online
              </div>
            </div>

            {/* Search */}
            <div className="px-2 pt-2">
              <div className="relative">
                <Search className="w-3 h-3 text-white/25 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search players..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 rounded-lg pl-7 pr-2 py-1.5 text-[10px] text-white/80 placeholder:text-white/20 focus:outline-none"
                  autoFocus
                />
              </div>
            </div>

            {/* Users List */}
            <div className="p-2 space-y-0.5 max-h-56 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
              {filteredUsers.map(u => (
                <div
                  key={u.id}
                  className="w-full flex items-center gap-2 px-2 py-2 rounded-xl hover:bg-white/[0.06] border border-transparent hover:border-white/[0.08] transition-all group"
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-8 h-8 rounded-lg overflow-hidden">
                      <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0c121e] ${
                      u.status === 'online' ? 'bg-green-400' : 'bg-slate-600'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col">
                    <span className="text-[11px] font-medium text-white/90 truncate">{u.name}</span>
                    <span className="text-[9px] text-white/40 truncate">{u.isMe ? 'Browsing Dashboard' : 'In Luna Dashboard'}</span>
                  </div>
                  {!u.isMe && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleInvite(e, u)}
                        disabled={invitedUsers[u.id] === 'inviting' || invitedUsers[u.id] === 'accepted'}
                        className="w-6 h-6 rounded border border-white/10 hover:border-purple-400/50 hover:bg-purple-400/20 text-white/50 hover:text-purple-300 transition-colors flex items-center justify-center disabled:opacity-50"
                        title="Invite to your dashboard"
                      >
                        {invitedUsers[u.id] === 'inviting' ? <span className="text-[8px]">...</span> : 
                         invitedUsers[u.id] === 'accepted' ? <Check className="w-3 h-3 text-green-400" /> : 
                         <Plus className="w-3 h-3" />}
                      </button>
                      <button
                        onClick={() => handleJoin(u)}
                        disabled={joiningId === u.id}
                        className="text-[9px] font-bold px-2 py-1 rounded border transition-colors flex-shrink-0 cursor-pointer"
                        style={{
                          borderColor: joiningId === u.id ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.1)',
                          background: joiningId === u.id ? 'rgba(59,130,246,0.2)' : 'transparent',
                          color: joiningId === u.id ? '#60a5fa' : 'rgba(255,255,255,0.7)',
                        }}
                      >
                        {joiningId === u.id ? 'Joining...' : 'Join'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {filteredUsers.length === 0 && (
                <p className="text-center text-[10px] text-white/30 py-4">No players found</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Add to Calendar Button Component
const AddToCalendarButton = ({ onClick, clanIcon }) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="w-full h-16 rounded-xl relative overflow-hidden group border border-white/10 flex items-center justify-center gap-3 transition-all"
    style={{
      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)'
    }}
  >
    <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
    
    {clanIcon ? (
      <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/20 shadow-lg relative z-10">
        <img src={clanIcon} alt="Clan" className="w-full h-full object-cover" />
      </div>
    ) : (
      <CalendarIcon className="w-5 h-5 text-blue-300 relative z-10" />
    )}
    
    <span className="text-sm font-bold text-white tracking-wide relative z-10">Add to Calendar</span>
  </motion.button>
);

// Main Export
export default function FocusModePanel({ onBackgroundChange, onOpenCalendar, onToggleStats, currentEnvId, onSelectEnv, onOpenDevSpotlight, isEnvironmentActive, onToggleEnvironment }) {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [selectedGame, setSelectedGame] = useState(null);
  const [showGamePanel, setShowGamePanel] = useState(false);
  const [activeGenre, setActiveGenre] = useState('Action');
  const [ownedGames, setOwnedGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpdatesOverlay, setShowUpdatesOverlay] = useState(false);

  // Transition State
  const [showScrollTransition, setShowScrollTransition] = useState(false);
  const [pendingNavigateUrl, setPendingNavigateUrl] = useState(null);

  // Live Dropdown State
  const [showLiveDropdown, setShowLiveDropdown] = useState(false);
  const [showFriendsDropdown, setShowFriendsDropdown] = useState(false);
  const [isLive, setIsLive] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(80);
  const [showStreamSettings, setShowStreamSettings] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const openCalendar = () => setShowCalendar(true);
  const [showEnvDrawer, setShowEnvDrawer] = useState(false);
  const [showQuickChangeDrawer, setShowQuickChangeDrawer] = useState(false);
  const [envDrawerExpanded, setEnvDrawerExpanded] = useState(false);


  const [settingsMaximized, setSettingsMaximized] = useState(false);
  const bannerAreaRef = useRef(null);

  const handleGameSelect = (game) => {
    setSelectedGame(game);
    setShowGamePanel(true);
  };

  const handleCloseGamePanel = () => {
    setShowGamePanel(false);
  };

  const handleDateTimeClick = () => {
    setShowUpdatesOverlay(true);
  };

  // Fetch games for bottom Library section
  const { data: allGamesFromDb } = useQuery({
    queryKey: ['all_games_focus_panel'],
    queryFn: () => base44.entities.Game.list(),
    enabled: !!isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

  const purchasedItemsStr = JSON.stringify(user?.purchased_items || []);

  useEffect(() => {
    let userGames = [];
    const testGameAlpha = allMockGames['test_game_alpha'];

    if (isAuthenticated) {
      if (!allGamesFromDb) return;
      const combinedGamePool = { ...allMockGames, ...Object.fromEntries(allGamesFromDb.map(g => [g.id, g])) };
      const ownedIds = JSON.parse(purchasedItemsStr);
      userGames = ownedIds.map(id => combinedGamePool[id]).filter(Boolean);
      if (testGameAlpha) userGames.unshift(testGameAlpha);
    } else {
      if (testGameAlpha) userGames.push(testGameAlpha);
      userGames = [...userGames, ...Object.values(allMockGames).slice(0, 20)];
    }
    
    setOwnedGames(Array.from(new Map(userGames.map(g => [g.id, g])).values()));
    setLoading(false);
  }, [isAuthenticated, purchasedItemsStr, allGamesFromDb]);

  // Compute games by genre - map to ALL_GENRES
  const gamesByGenre = useMemo(() => {
    const result = {};
    // Initialize all genres
    ALL_GENRES.forEach(g => result[g] = []);
    
    // Map games to genres
    ownedGames.forEach(game => {
      const gameGenre = game.genre || 'Action';
      // Try to match to our genre list
      const matchedGenre = ALL_GENRES.find(g => 
        g.toLowerCase() === gameGenre.toLowerCase() ||
        g.toLowerCase().includes(gameGenre.toLowerCase()) ||
        gameGenre.toLowerCase().includes(g.toLowerCase().split(' ')[0])
      ) || 'Action';
      
      if (result[matchedGenre]) {
        result[matchedGenre].push(game);
      }
    });
    
    return result;
  }, [ownedGames]);

  // Removed internal calendar logic in favor of global IntelligentCalendarOverlay

  return (
    <div className="relative h-full flex flex-col items-center focus-panel-scroll overflow-hidden pointer-events-none" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      <style>{`.focus-panel-scroll{scrollbar-width:none;-ms-overflow-style:none}.focus-panel-scroll::-webkit-scrollbar{display:none}`}</style>

      {/* Top Section - Quick Access Icons & Live Streaming */}
      <div className="w-full relative z-50">
        <div className="flex gap-6 items-start">
          {/* Left Column: Environment Hub + Memories + Overlays */}
          <div className="flex-1 min-w-0 flex flex-col gap-6 relative" style={{ minHeight: 'calc(100vh - 80px)' }}>

            {/* Banner area — Environment Hub always stays fixed */}
            <div className="pointer-events-auto relative" ref={bannerAreaRef}>
              <LibraryBannerSection 
                games={ownedGames}
                onBackgroundChange={onBackgroundChange}
                currentEnvId={currentEnvId}
                onSelectEnv={onSelectEnv}
                showEnvDropdown={false}
                setShowEnvDropdown={() => setShowEnvDrawer(true)}
                onQuickChangeToggle={() => setShowQuickChangeDrawer(true)}
                isEnvironmentActive={isEnvironmentActive}
                onToggleEnvironment={onToggleEnvironment}
                navBoxes={
                  <BottomNavBoxes 
                    navigate={navigate} 
                    onLiveClick={() => { setShowFriendsDropdown(false); setShowLiveDropdown((v) => !v); }}
                    showLive={showLiveDropdown}
                  />
                }
                intelligenceFeed={<LiveIntelligenceFeed />}
                calendarBox={
                  <div className="flex w-full h-full">
                    <div className="flex-1 min-w-0 h-full">
                      <DateTimeTile onClick={handleDateTimeClick} onCalendarClick={onOpenCalendar || openCalendar} />
                    </div>
                  </div>
                }
              />

              {/* Open space below Environment Hub — Skill Tree/Friends/Live overlay fills this */}
              {/* Height is fixed so DevSpotlight always stays at same position */}
              <div className="relative mt-3" style={{ height: '512px' }}>
                {/* OVERLAY: Skill Tree / Friends / Live — fills the open space exactly */}
                <AnimatePresence>
                  {(showFriendsDropdown || showLiveDropdown) && (
                    <motion.div
                      key="panel-overlay"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="absolute inset-0 z-50 pointer-events-auto overflow-hidden rounded-2xl"
                      style={{
                        background: 'linear-gradient(135deg, rgba(10, 16, 26, 0.96) 0%, rgba(14, 22, 38, 0.94) 100%)',
                        backdropFilter: 'blur(24px)',
                        WebkitBackdropFilter: 'blur(24px)',
                        border: showFriendsDropdown
                          ? '1px solid rgba(74,222,128,0.30)'
                          : '1px solid rgba(248,113,113,0.30)',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(125,211,252,0.06)',
                      }}
                    >
                      {/* Close button */}
                      <button
                        onClick={() => { setShowFriendsDropdown(false); setShowLiveDropdown(false); }}
                        className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
                      >
                        <X className="w-3 h-3 text-white/60" />
                      </button>



                      {showFriendsDropdown && (
                        <div className="h-full overflow-hidden">
                          <FriendsDropdown />
                        </div>
                      )}

                      {showLiveDropdown && (
                        <div className="h-full flex gap-3 p-3">
                          <div className="h-full w-[70%]">
                            <StreamPlayerBox
                              isLive={isLive}
                              onToggleLive={() => setIsLive(!isLive)}
                              isPlaying={isPlaying}
                              onTogglePlay={() => setIsPlaying(!isPlaying)}
                              volume={volume}
                              onVolumeChange={setVolume}
                              onOpenSettings={() => setShowStreamSettings(true)}
                              settingsOpen={showStreamSettings}
                              onCloseSettings={() => setShowStreamSettings(false)}
                              isSettingsMaximized={settingsMaximized}
                              onToggleSettingsMaximize={() => setSettingsMaximized(!settingsMaximized)}
                            />
                          </div>
                          <div className="h-full w-[30%]">
                            <StreamChatBox isLive={isLive} />
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* DevSpotlightRibbon removed from here, moved to root of FocusModePanel */}

            </div>
          </div>
        </div>
      </div>






      {/* System Updates Drawer */}
      <SystemUpdatesDrawer open={showUpdatesOverlay} onClose={() => setShowUpdatesOverlay(false)} />

      {/* Calendar Overlay - local to FocusModePanel */}
      <AnimatePresence>
        {showCalendar && (
          <IntelligentCalendarOverlay onClose={() => setShowCalendar(false)} currentUserId={user?.id} />
        )}
      </AnimatePresence>

      {/* Scroll Transition Overlay */}
      <AnimatePresence>
        {showScrollTransition && (
          <ScrollTransitionOverlay 
            onComplete={() => {
              navigate(pendingNavigateUrl);
              setShowScrollTransition(false);
            }} 
          />
        )}
      </AnimatePresence>

      {/* Game Side Menu Overlay */}
      <AnimatePresence>
        {showGamePanel && selectedGame && (
          <GameSideMenu 
            game={selectedGame} 
            onClose={handleCloseGamePanel} 
          />
        )}
      </AnimatePresence>

      {/* Inventory Equip Overlay - opens when any inventory slot is clicked */}
      <InventoryEquipOverlay />

      {/* Environment Hub — slide-in drawer from the right */}
      <EnvHubDrawer
        open={showEnvDrawer}
        onClose={() => setShowEnvDrawer(false)}
        currentEnvId={currentEnvId}
        onSelectEnv={onSelectEnv}
      />
      <QuickChangeEnvDrawer
        open={showQuickChangeDrawer}
        onClose={() => setShowQuickChangeDrawer(false)}
        currentEnvId={currentEnvId}
        onSelectEnv={onSelectEnv}
      />
      <div className="hidden">
        {/* Left: Library Area */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          <LibraryGamesSection 
            onSelectGame={handleGameSelect}
            selectedGame={selectedGame}
            allGames={ownedGames}
            showGamePanel={showGamePanel}
            onClosePanel={handleCloseGamePanel}
          />
        </div>


      </div>

      {/* DevSpotlightRibbon — aligned perfectly to the left edge of FocusModePanel */}
      <div className="pointer-events-auto absolute bottom-0 left-0 z-50">
        <DevSpotlightRibbon onOpenOverlay={onOpenDevSpotlight} />
      </div>
    </div>
  );
}