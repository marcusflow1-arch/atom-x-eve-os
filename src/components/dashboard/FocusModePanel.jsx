import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
        Calendar as CalendarIcon, Clock, Target, ChevronLeft, ChevronRight,
        Plus, Star, Zap, Sword, Shield, Wand2, Flame, Pin,
        Play, Sparkles, Trophy, Crown, Eye, Check, Trash2, X,
        Library as LibraryIcon, Radio, Gamepad2, Search, MoreHorizontal, Bot,
        Heart, BookOpen, Bell, Settings, Book, Home, Download, Ticket, Users, Tv, Swords, Layers, TrendingUp, Globe
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
import AvatarProgressionBox from '@/components/avatar/AvatarProgressionBox';
import StatsDropdown from '@/components/dashboard/StatsDropdown';
import FriendsDropdown from '@/components/dashboard/FriendsDropdown';
import AIAttributesBox from '@/components/dashboard/AIAttributesBox';
import InventoryEquipOverlay from '@/components/profile/InventoryEquipOverlay';
import IntelligentCalendarOverlay from '@/components/calendar/IntelligentCalendarOverlay';
import EnvironmentSelector from '@/components/avatarHome/EnvironmentSelector';
import EnvironmentHub from '@/components/environment/EnvironmentHub';
import SystemUpdatesBox from '@/components/dashboard/SystemUpdatesBox';
import SystemUpdatesOverlay from '@/components/dashboard/SystemUpdatesOverlay';
import Mini3DViewerBox from '@/components/dashboard/Mini3DViewerBox';
import DevSpotlightRibbon from '@/components/dashboard/DevSpotlightRibbon';
import CardCollectionBrowser from '@/components/dashboard/CardCollectionBrowser';

import { useQuery } from '@tanstack/react-query';

// Mock pinned games
const pinnedGames = [
  { id: 1, title: 'Cyberpunk 2088', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400', lastPlayed: '2 hours ago', progress: 68 },
  { id: 2, title: 'Elden Ring', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400', lastPlayed: 'Yesterday', progress: 45 },
  { id: 3, title: 'Stellar Odyssey', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400', lastPlayed: '3 days ago', progress: 92 },
  { id: 4, title: 'Shadow Realm', image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400', lastPlayed: 'Last week', progress: 23 },
  { id: 5, title: 'Neon Legends', image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400', lastPlayed: '2 days ago', progress: 55 },
];

const MOCK_EVENTS = [
  {
    id: 1,
    type: 'game_update',
    title: 'Cyberpunk 2088 Patch 2.1',
    subtitle: 'New story expansion',
    date: 'Dec 26',
    time: '10:00 AM',
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400',
    color: 'from-cyan-500/20 to-blue-500/20',
    icon: Download,
    featured: true
  },
  {
    id: 2,
    type: 'live_event',
    title: 'Winter Gaming Festival',
    subtitle: 'Live tournaments & prizes',
    date: 'Dec 28',
    time: '6:00 PM',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400',
    color: 'from-purple-500/20 to-pink-500/20',
    icon: Ticket
  },
  {
    id: 3,
    type: 'developer',
    title: 'Dev Stream',
    subtitle: 'Neon Legends Studio',
    date: 'Dec 29',
    time: '3:00 PM',
    image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400',
    color: 'from-orange-500/20 to-amber-500/20',
    icon: Users
  },
  {
    id: 4,
    type: 'seasonal',
    title: 'New Year Challenge',
    subtitle: 'Limited rewards available',
    date: 'Jan 1',
    time: '12:00 AM',
    image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400',
    color: 'from-emerald-500/20 to-teal-500/20',
    icon: Star
  },
  {
    id: 5,
    type: 'community',
    title: 'Clan Wars Season 4',
    subtitle: 'Registration opens',
    date: 'Jan 3',
    time: '9:00 AM',
    image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400',
    color: 'from-red-500/20 to-rose-500/20',
    icon: Gamepad2
  }
];

const FeaturedEventCard = ({ event, onOpenCalendar }) => {
  const Icon = event.icon;
  
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      className="relative h-full rounded-2xl overflow-hidden cursor-pointer group"
      style={{
        background: 'rgba(100, 120, 140, 0.08)',
        backdropFilter: 'blur(20px) saturate(150%)',
        WebkitBackdropFilter: 'blur(20px) saturate(150%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
      }}
    >
      <div className="absolute inset-0">
        <img src={event.image} alt="" className="w-full h-full object-cover opacity-30 group-hover:opacity-40 transition-opacity" />
        <div className={`absolute inset-0 bg-gradient-to-br ${event.color}`} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      </div>
      
      <div className="relative h-full flex flex-col justify-between p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
            <Icon className="w-3.5 h-3.5 text-white/80" />
            <span className="text-[10px] font-semibold text-white/80 uppercase tracking-wider">Featured</span>
          </div>
          <div className="text-right">
            <div className="text-white font-bold text-lg">{event.date}</div>
            <div className="text-white/50 text-xs">{event.time}</div>
          </div>
        </div>
        
        <div>
          <h3 className="text-white font-bold text-xl mb-1 group-hover:text-cyan-300 transition-colors">{event.title}</h3>
          <p className="text-white/60 text-sm">{event.subtitle}</p>
          
          <div className="flex items-center gap-2 mt-4">
            <button 
              onClick={onOpenCalendar}
              className="flex-1 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 rounded-xl py-2.5 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2"
            >
              <CalendarIcon className="w-4 h-4" />
              Add to Calendar
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const SmallEventCard = ({ event }) => {
  const Icon = event.icon;
  
  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -2 }}
      className="relative rounded-xl overflow-hidden cursor-pointer group"
      style={{
        background: 'rgba(100, 120, 140, 0.06)',
        backdropFilter: 'blur(16px) saturate(140%)',
        WebkitBackdropFilter: 'blur(16px) saturate(140%)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
      }}
    >
      <div className="flex items-center gap-3 p-3">
        <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 relative">
          <img src={event.image} alt="" className="w-full h-full object-cover" />
          <div className={`absolute inset-0 bg-gradient-to-br ${event.color} opacity-60`} />
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon className="w-5 h-5 text-white drop-shadow-lg" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-semibold text-sm truncate group-hover:text-cyan-300 transition-colors">{event.title}</h4>
          <p className="text-white/40 text-xs truncate">{event.subtitle}</p>
          <div className="flex items-center gap-2 mt-1">
            <Clock className="w-3 h-3 text-white/30" />
            <span className="text-white/50 text-[10px]">{event.date} • {event.time}</span>
          </div>
        </div>
        
        <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors flex-shrink-0" />
      </div>
    </motion.div>
  );
};

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
      if (!e.target.closest('[data-game-panel]') && !e.target.closest('[data-game-card]')) {
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
function EnvironmentHubTile({ isOpen, onToggle }) {
  return (
    <button 
      className="w-full h-full rounded-xl overflow-hidden relative group cursor-pointer"
      style={{
        background: isOpen ? 'rgba(200, 210, 220, 0.14)' : 'rgba(100, 120, 140, 0.08)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: `1px solid ${isOpen ? 'rgba(255, 255, 255, 0.20)' : 'rgba(255, 255, 255, 0.10)'}`,
        transition: 'all 0.3s ease'
      }}
      onClick={onToggle}
    >
      <img 
        src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80" 
        alt="Environment Hub"
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-50"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
      <div className="absolute bottom-3 left-3 right-3">
        <h4 className="text-white font-bold text-sm truncate flex items-center gap-2">
          <Globe className="w-4 h-4 text-cyan-400" />
          Environment Hub
        </h4>
        <p className="text-white/50 text-[10px]">Change your 3D world</p>
      </div>
    </button>
  );
}

// Quick Access Icons Row
function QuickAccessRow({ onOpenCalendar, onDateTimeClick, navigate, onLiveClick }) {
  return (
    <div className="h-full flex gap-6">
      {/* Left Column: Quick Actions */}
      <div className="flex-1 min-w-0">
        <QuickActionsBar navigate={navigate} onLiveClick={onLiveClick} />
      </div>
      
      {/* Right Column: System Status & Calendar Hub */}
      <div className="w-[280px] flex-shrink-0 flex flex-col gap-3">
         <DateTimeTile onClick={onDateTimeClick} />
         <AddToCalendarButton 
           onClick={onOpenCalendar} 
           clanIcon="https://images.unsplash.com/photo-1614728853913-3e74785093ca?w=100&h=100&fit=crop" 
         />
      </div>
    </div>
  );
}

// Game Reference - clickable scene moments from games that change the Luna dashboard background
function GameReference({ reference, onClick, isActive, isHomeButton }) {
  if (isHomeButton) {
    return (
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className="relative w-16 h-16 rounded-lg overflow-hidden cursor-pointer border-2 border-white/20 hover:border-cyan-400/50 transition-all flex-shrink-0 bg-gradient-to-br from-cyan-500/20 to-blue-500/20"
      >
        <div className="w-full h-full flex items-center justify-center">
          <Home className="w-6 h-6 text-white/80" />
        </div>
        <div className="absolute bottom-1 left-1 right-1">
          <p className="text-white text-[7px] font-bold truncate text-center">Home</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => onClick(reference)}
      className={`relative w-16 h-16 rounded-lg overflow-hidden cursor-pointer border-2 transition-all flex-shrink-0 ${
        isActive ? 'border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)]' : 'border-white/10 hover:border-white/30'
      }`}
    >
      <img 
        src={reference.thumbnail} 
        alt={reference.title}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
      <div className="absolute bottom-1 left-1 right-1">
        <p className="text-white text-[7px] font-bold truncate">{reference.title}</p>
      </div>
      {/* Scene type indicator */}
      <div className={`absolute top-1 right-1 w-2 h-2 rounded-full ${
        reference.type === 'death' ? 'bg-red-500' :
        reference.type === 'victory' ? 'bg-green-500' :
        reference.type === 'battle' ? 'bg-orange-500' :
        'bg-blue-500'
      }`} />
    </motion.div>
  );
}

// New QuickActionsBar Component
function QuickActionsBar({ navigate, onLiveClick, onStatsClick, onFriendsClick }) {
  const quickActions = [
    { id: 'friends', label: 'Friends', icon: Users, color: 'from-blue-500/20 to-cyan-500/20', borderColor: 'border-blue-500/30', onClick: onFriendsClick },
    { id: 'live', label: 'Live', icon: Radio, color: 'from-red-500/20 to-rose-500/20', borderColor: 'border-red-500/30', onClick: onLiveClick },
    { id: 'settings', label: 'Settings', icon: Settings, color: 'from-slate-500/20 to-gray-500/20', borderColor: 'border-slate-500/30', onClick: () => console.log('Settings clicked') },
    { id: 'skill-tree', label: 'Skill Tree', icon: Layers, color: 'from-purple-500/20 to-pink-500/20', borderColor: 'border-purple-500/30', onClick: () => navigate(createPageUrl('GenreMastery')) },
    { id: 'ai-story', label: 'AI Story', icon: BookOpen, color: 'from-emerald-500/20 to-teal-500/20', borderColor: 'border-emerald-500/30', onClick: () => navigate(createPageUrl('AIStory')) },
    { id: 'ai-battle', label: 'AI Battle', icon: Swords, color: 'from-orange-500/20 to-red-500/20', borderColor: 'border-orange-500/30', onClick: () => navigate(createPageUrl('AIBattle')) },
    { id: 'season-pass', label: 'Season Pass', icon: Crown, color: 'from-amber-500/20 to-yellow-500/20', borderColor: 'border-amber-500/30', onClick: () => navigate(createPageUrl('SeasonalPass')) },
    { id: 'achievements', label: 'Achievements', icon: Trophy, color: 'from-yellow-500/20 to-orange-500/20', borderColor: 'border-yellow-500/30', onClick: () => navigate(createPageUrl('Achievements')) },
    { id: 'leaderboard', label: 'Leaderboard', icon: TrendingUp, color: 'from-cyan-500/20 to-blue-500/20', borderColor: 'border-cyan-500/30', onClick: () => navigate(createPageUrl('Leaderboard')) },
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto w-full pointer-events-auto" style={{ scrollbarWidth: 'none' }}>
      <motion.button
        key="stats-tile"
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        onClick={onStatsClick}
        className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border border-white/15 transition-all flex-shrink-0"
        style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', width: '85px', height: '75px' }}
      >
        <TrendingUp className="w-5 h-5 text-white/80" />
        <span className="text-white/70 text-[9px] font-semibold text-center leading-tight">Stats</span>
      </motion.button>
      {quickActions.map((action) => {
        const Icon = action.icon;
        return (
          <motion.button
            key={action.id}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={action.onClick}
            className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border ${action.borderColor} transition-all hover:shadow-lg flex-shrink-0`}
            style={{
              background: `linear-gradient(135deg, ${action.color.split(' ')[0].replace('from-', '')} 0%, ${action.color.split(' ')[1].replace('to-', '')} 100%)`.replace(/\/\d+/g, ''),
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              width: '85px',
              height: '75px'
            }}
          >
            <Icon className="w-5 h-5 text-white/80" />
            <span className="text-white/70 text-[9px] font-semibold text-center leading-tight">{action.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

// Library Banner Section - Now ONLY renders Banner + Memories (Quick Actions moved out)
export function LibraryBannerSection({ games, onBackgroundChange, currentEnvId, onSelectEnv }) {
  const [showEnvDropdown, setShowEnvDropdown] = useState(false);
  const envDropdownRef = useRef(null);
  const [activeReference, setActiveReference] = useState(null);
  const [references, setReferences] = useState([]);
  const scrollRef = useRef(null);

  // Close env dropdown on outside click
  useEffect(() => {
    if (!showEnvDropdown) return;
    const handler = (e) => {
      if (envDropdownRef.current && !envDropdownRef.current.contains(e.target)) {
        setShowEnvDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showEnvDropdown]);

  useEffect(() => {
    const fetchBackgrounds = async () => {
      try {
        const backgrounds = await base44.entities.HeroBackground.list();
        
        // Initial mock data
        let initialRefs = [
          { id: 1, title: 'Final Stand', thumbnail: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6876751a602125f45f1861b9/0d9e757d8_unnamed.jpg', type: 'death', background: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6876751a602125f45f1861b9/0d9e757d8_unnamed.jpg', game: 'Borderlands' },
          { id: 2, title: 'Boss Victory', thumbnail: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=200', type: 'victory', background: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1920', game: 'Cyberpunk 2088' },
          { id: 3, title: 'Epic Battle', thumbnail: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=200', type: 'battle', background: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=1920', game: 'Shadow Realm' },
          { id: 4, title: 'Fallen Hero', thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=200', type: 'death', background: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1920', game: 'Dark Souls' },
          { id: 5, title: 'Champion', thumbnail: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=200', type: 'victory', background: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=1920', game: 'Stellar Odyssey' },
        ];

        // Add fetched backgrounds
        if (backgrounds && backgrounds.data) {
          const plasmaWater = backgrounds.data.find(bg => bg.title === 'Plasma-Water' || bg.title === 'Plasma Water');
          if (plasmaWater) {
            initialRefs.push({
              id: plasmaWater.id,
              title: 'Plasma Water',
              thumbnail: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=200',
              type: 'victory',
              background: plasmaWater.video_url,
              game: 'Hero Theme',
              isVideo: true
            });
          }
        }
        
        setReferences(initialRefs);
      } catch (error) {
        console.error("Failed to fetch backgrounds", error);
      }
    };
    
    fetchBackgrounds();
  }, []);

  const handleReferenceClick = (reference) => {
    setActiveReference(reference);
    if (onBackgroundChange) {
      onBackgroundChange(reference.background);
    }
  };

  const handleHomeClick = () => {
    setActiveReference(null);
    if (onBackgroundChange) {
      onBackgroundChange(null);
    }
  };

  return (
    <div className="flex flex-col items-start w-full">
      {/* Game Banner + Memories */}
      <div ref={envDropdownRef}>
        <div className="flex items-stretch gap-4 w-full">
          {/* Environment Hub Tile (dropdown trigger) */}
          <div className="w-[368px] h-[60px] flex-shrink-0 relative">
            <EnvironmentHubTile isOpen={showEnvDropdown} onToggle={() => setShowEnvDropdown(v => !v)} />
          </div>

          {/* References Section (Memories) */}
          <div 
            ref={scrollRef}
            className="flex items-center gap-2 overflow-x-auto" 
            style={{ scrollbarWidth: 'none' }}
          >
            <span className="text-white/30 text-[8px] uppercase tracking-wider mr-1 flex-shrink-0">Memories</span>
            {references.map((ref) => (
              <GameReference 
                key={ref.id} 
                reference={ref} 
                onClick={handleReferenceClick}
                isActive={activeReference?.id === ref.id}
              />
            ))}
            {/* Home Button */}
            <GameReference 
              isHomeButton={true}
              onClick={handleHomeClick}
            />
          </div>
        </div>

        {/* Environment Hub Dropdown */}
        <AnimatePresence>
          {showEnvDropdown && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="w-full overflow-hidden rounded-2xl"
              style={{
                background: 'rgba(180, 190, 200, 0.08)',
                backdropFilter: 'blur(30px) saturate(140%)',
                WebkitBackdropFilter: 'blur(30px) saturate(140%)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.06)'
              }}
            >
              <div className="p-4 max-h-[480px] overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                <EnvironmentHub
                  currentEnvId={currentEnvId}
                  onSelectEnv={(env) => {
                    onSelectEnv?.(env);
                    setShowEnvDropdown(false);
                  }}
                  onClose={() => setShowEnvDropdown(false)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Date & Time Tile Component
const DateTimeTile = ({ onClick, onCalendarClick = () => {} }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const dateString = time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const yearString = time.getFullYear();

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full flex-1 rounded-2xl relative overflow-hidden group border border-white/10 cursor-pointer"
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(20px) saturate(150%)',
        WebkitBackdropFilter: 'blur(20px) saturate(150%)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
      
      <div className="relative h-full flex flex-col items-center justify-center p-6 text-center">
        {/* Calendar icon button in the corner */}
        <button
          onClick={(e) => { e.stopPropagation(); onCalendarClick(); }}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center"
          title="Add to Calendar"
        >
          <CalendarIcon className="w-4 h-4 text-white/80" />
        </button>
        <div className="text-5xl font-black text-white tracking-tighter mb-2 drop-shadow-lg">
          {timeString}
        </div>
        <div className="flex flex-col gap-1">
          <div className="text-sm font-bold text-cyan-300 uppercase tracking-widest">
            {dateString}
          </div>
          <div className="text-xs text-white/40 font-mono">
            {yearString}
          </div>
        </div>
        
        {/* Update Indicator */}
        <div className="mt-4 flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
          <span className="text-[10px] text-white/60 font-medium">System Online</span>
        </div>
      </div>
    </motion.div>
  );
};

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
export default function FocusModePanel({ onBackgroundChange, onOpenCalendar, onToggleStats, currentEnvId, onSelectEnv, onOpenDevSpotlight }) {
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
  const [showStatsDropdown, setShowStatsDropdown] = useState(false);
  const [statsActiveTab, setStatsActiveTab] = useState('ai'); // 'ai' | 'inventory'
  const [showCalendar, setShowCalendar] = useState(false);
  const openCalendar = () => setShowCalendar(true);

  // Toggle Stats dropdown with 'O' (AI) and 'I' (Inventory) keys
  useEffect(() => {
    const onKeyDown = (e) => {
      const key = e.key?.toLowerCase();
      if (key === 'o') {
        setShowLiveDropdown(false);
        setShowFriendsDropdown(false);
        setStatsActiveTab('ai');
        setShowStatsDropdown((v) => !v);
      } else if (key === 'i') {
        setShowLiveDropdown(false);
        setShowFriendsDropdown(false);
        setStatsActiveTab('inventory');
        setShowStatsDropdown(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
  const [settingsMaximized, setSettingsMaximized] = useState(false);

  const handleGameSelect = (game) => {
    setSelectedGame(game);
    setShowGamePanel(true);
  };

  const handleCloseGamePanel = () => {
    setShowGamePanel(false);
  };

  const handleDateTimeClick = () => {
    setPendingNavigateUrl(createPageUrl('Notifications'));
    setShowScrollTransition(true);
  };

  // Fetch games for bottom Library section
  useEffect(() => {
    const fetchGames = async () => {
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
        userGames = [...userGames, ...Object.values(allMockGames).slice(0, 20)];
      }
      
      setOwnedGames(Array.from(new Map(userGames.map(g => [g.id, g])).values()));
      setLoading(false);
    };
    fetchGames();
  }, [user, isAuthenticated]);

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
    <div className="relative h-full flex flex-col items-center focus-panel-scroll overflow-y-auto pointer-events-none" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      <style>{`.focus-panel-scroll{scrollbar-width:none;-ms-overflow-style:none}.focus-panel-scroll::-webkit-scrollbar{display:none}`}</style>

      {/* Top Section - Quick Access Icons & Live Streaming */}
      <div className="w-full relative z-50">
        <div className="flex gap-6 items-start">
          {/* Left Column: Quick Actions + Stream Player */}
          <div className="flex-1 min-w-0 flex flex-col gap-6 relative" style={{ minHeight: 'calc(100vh - 80px)' }}>
            <QuickActionsBar 
              navigate={navigate} 
              onLiveClick={() => { setShowStatsDropdown(false); setShowFriendsDropdown(false); setShowLiveDropdown((v) => !v); }} 
              onStatsClick={() => { setShowLiveDropdown(false); setShowFriendsDropdown(false); setShowStatsDropdown((v) => !v); }}
              onFriendsClick={() => { setShowLiveDropdown(false); setShowStatsDropdown(false); setShowFriendsDropdown((v) => !v); }}
            />

            <AnimatePresence>
              {showFriendsDropdown && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 0, marginBottom: 24 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0, marginBottom: 0 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="w-full overflow-hidden pointer-events-auto"
                >
                  <div className="w-full">
                    <FriendsDropdown />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showStatsDropdown && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 0, marginBottom: 24 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0, marginBottom: 0 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="w-full overflow-hidden pointer-events-auto"
                >
                  <div className="w-full">
                      <StatsDropdown activeTab={statsActiveTab} onTabChange={setStatsActiveTab} />
                    </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-1 pointer-events-auto">
              <LibraryBannerSection 
                games={ownedGames}
                onBackgroundChange={onBackgroundChange}
                currentEnvId={currentEnvId}
                onSelectEnv={onSelectEnv}
              />
            </div>

            {/* Developer Spotlight + Card Collection Browser side by side */}
            <div className="pointer-events-auto flex gap-4 items-start" style={{ marginTop: 'auto', paddingTop: '24px' }}>
              {/* Card Collection Browser - left, aligned under 3D viewer area */}
              <div className="w-[280px] flex-shrink-0">
                <CardCollectionBrowser />
              </div>
              {/* Developer Spotlight - takes remaining space */}
              <div className="flex-1 min-w-0">
                <DevSpotlightRibbon onOpenOverlay={onOpenDevSpotlight} />
              </div>
            </div>

            <AnimatePresence>
              {showLiveDropdown && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 0, marginBottom: 24 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0, marginBottom: 0 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="w-full overflow-hidden pointer-events-auto"
                >
                  <div className="h-[400px] w-full flex gap-4">
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
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Right Column: System Status + Calendar */}
          <div className="w-[280px] flex-shrink-0 flex flex-col gap-2 pointer-events-auto">
             <DateTimeTile onClick={handleDateTimeClick} onCalendarClick={onOpenCalendar || openCalendar} />
             {/* System Updates Box */}
             <div className="mt-1">
               <SystemUpdatesBox onOpenFullscreen={() => setShowUpdatesOverlay(true)} />
             </div>
             {/* AI Attribute Box to the right side */}
             <div className="mt-1">
                <AIAttributesBox />
              </div>
             </div>
        </div>
      </div>






      {/* System Updates Fullscreen Overlay */}
      <AnimatePresence>
        {showUpdatesOverlay && (
          <SystemUpdatesOverlay onClose={() => setShowUpdatesOverlay(false)} />
        )}
      </AnimatePresence>

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

      {/* Bottom Section - Grid layout */}

      {/* Outside box: bottom-left Skills & AI Passives (shown in Inventory view) */}

      <div className="mt-10 w-full flex gap-6 items-start justify-between min-w-0 pointer-events-auto">
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




    </div>
  );
}