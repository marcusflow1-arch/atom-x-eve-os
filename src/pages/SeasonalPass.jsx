import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Lock, Check, Star, Zap, Sword, Shield, Users, 
  User, Globe, ChevronLeft, ChevronRight, Sparkles, Crown,
  Play, X, RotateCw, Clock, TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '../components/auth/AuthContext';

// Rarity System
const rarityColors = {
  Common: { bg: 'bg-slate-700', border: 'border-slate-500', text: 'text-slate-300', glow: 'shadow-slate-500/50' },
  Rare: { bg: 'bg-blue-900', border: 'border-blue-500', text: 'text-blue-300', glow: 'shadow-blue-500/50' },
  Epic: { bg: 'bg-purple-900', border: 'border-purple-500', text: 'text-purple-300', glow: 'shadow-purple-500/50' },
  Legendary: { bg: 'bg-yellow-900', border: 'border-yellow-500', text: 'text-yellow-300', glow: 'shadow-yellow-500/50' },
  Mythical: { bg: 'bg-red-900', border: 'border-red-500', text: 'text-red-300', glow: 'shadow-red-500/50' },
  Godlike: { bg: 'bg-gradient-to-br from-purple-600 via-pink-600 to-yellow-600', border: 'border-pink-400', text: 'text-white', glow: 'shadow-pink-500/80' }
};

// Mock data for Limited Edition Cards
const limitedEditionCards = [
  {
    id: 1,
    name: 'Void Reaper',
    type: 'Ability',
    rarity: 'Godlike',
    description: 'Summon a dimensional rift that pulls enemies into the void',
    image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&h=600&fit=crop',
    season: 'Season 1',
    track: 'online'
  },
  {
    id: 2,
    name: 'Celestial Guardian',
    type: 'Companion',
    rarity: 'Mythical',
    description: 'Ancient spirit that shields allies and provides tactical support',
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=600&fit=crop',
    season: 'Season 1',
    track: 'pve'
  },
  {
    id: 3,
    name: 'Plasma Katana',
    type: 'Equipment',
    rarity: 'Legendary',
    description: 'Energy-infused blade that cuts through armor',
    image: 'https://images.unsplash.com/photo-1589254065878-42c9da997008?w=400&h=600&fit=crop',
    season: 'Season 1',
    track: 'solo'
  },
  {
    id: 4,
    name: 'Quantum Dash',
    type: 'Ability',
    rarity: 'Epic',
    description: 'Phase through obstacles and enemies',
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=600&fit=crop',
    season: 'Season 1',
    track: 'online'
  },
  {
    id: 5,
    name: 'Mech Wolf',
    type: 'Companion',
    rarity: 'Legendary',
    description: 'Tactical combat drone with pack hunter AI',
    image: 'https://images.unsplash.com/photo-1535083783855-76ae62b2914e?w=400&h=600&fit=crop',
    season: 'Season 1',
    track: 'solo'
  },
  {
    id: 6,
    name: 'Storm Caller',
    type: 'Ability',
    rarity: 'Mythical',
    description: 'Control weather patterns to devastate battlefields',
    image: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=400&h=600&fit=crop',
    season: 'Season 1',
    track: 'pve'
  }
];

// Mock Season Pass Levels (1-100)
const generateSeasonLevels = () => {
  const levels = [];
  const rewardTypes = ['Ability', 'Equipment', 'Companion', 'Currency', 'XP Boost'];
  const rarities = ['Common', 'Rare', 'Epic', 'Legendary', 'Mythical', 'Godlike'];
  
  for (let i = 1; i <= 100; i++) {
    const isPremium = i % 5 === 0;
    const rarity = i % 25 === 0 ? 'Godlike' : 
                   i % 20 === 0 ? 'Mythical' :
                   i % 10 === 0 ? 'Legendary' :
                   i % 5 === 0 ? 'Epic' : 
                   i % 3 === 0 ? 'Rare' : 'Common';
    
    levels.push({
      level: i,
      xpRequired: i * 1000,
      freeReward: {
        name: `Level ${i} Reward`,
        type: rewardTypes[Math.floor(Math.random() * rewardTypes.length)],
        rarity: rarity,
        icon: '🎁'
      },
      premiumReward: isPremium ? {
        name: `Premium ${i} Reward`,
        type: rewardTypes[Math.floor(Math.random() * rewardTypes.length)],
        rarity: rarity === 'Common' ? 'Epic' : rarity,
        icon: '💎'
      } : null
    });
  }
  
  return levels;
};

// Limited Edition Card Component
const LimitedEditionCard = ({ card, onClick }) => {
  const rarity = rarityColors[card.rarity];
  
  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -8 }}
      onClick={() => onClick(card)}
      className="relative w-64 h-96 rounded-xl overflow-hidden cursor-pointer shadow-2xl"
      style={{
        background: 'rgba(148, 163, 184, 0.06)',
        backdropFilter: 'blur(50px) saturate(200%)',
        WebkitBackdropFilter: 'blur(50px) saturate(200%)',
        border: '1px solid rgba(148, 163, 184, 0.15)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
      }}
    >
      {/* Liquid Glass Shine Effect */}
      <motion.div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
        }}
        animate={{
          x: ['-100%', '200%'],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          repeatDelay: 4,
        }}
      />
      
      {/* Card Image */}
      <img src={card.image} alt={card.name} className="w-full h-56 object-cover" />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
      
      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="flex items-center justify-between mb-1.5">
          <Badge className="bg-slate-700/80 text-white border-slate-600/40 backdrop-blur-md text-[10px] font-semibold px-2 py-0.5">
            {card.rarity}
          </Badge>
          <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30 backdrop-blur-md text-[10px] px-2 py-0.5">
            {card.type}
          </Badge>
        </div>
        
        <h3 className="text-lg font-bold text-white mb-1 drop-shadow-lg">{card.name}</h3>
        <p className="text-xs text-white/85 line-clamp-2 drop-shadow">{card.description}</p>
        
        {/* Rarity Indicator */}
        <div className="flex items-center gap-0.5 mt-2">
          {[...Array(5)].map((_, i) => (
            <Star 
              key={i} 
              className={`w-2.5 h-2.5 ${i < (card.rarity === 'Godlike' ? 5 : card.rarity === 'Mythical' ? 4 : card.rarity === 'Legendary' ? 3 : card.rarity === 'Epic' ? 2 : 1) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} 
            />
          ))}
        </div>
      </div>
      
      {/* Liquid Glass Border */}
      <motion.div
        className="absolute inset-0 rounded-xl pointer-events-none border border-slate-300/25"
        animate={{
          opacity: [0.25, 0.5, 0.25],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
        }}
      />
    </motion.div>
  );
};

// Season Pass Level Node
const SeasonLevelNode = ({ level, isUnlocked, isPremiumOwned, currentLevel, onClick }) => {
  const { freeReward, premiumReward, level: levelNumber } = level;
  const isCurrentLevel = levelNumber === currentLevel;
  const rarity = rarityColors[freeReward.rarity];
  
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      onClick={() => onClick(level)}
      className={`relative flex-shrink-0 w-16 h-20 cursor-pointer transition-all ${
        isCurrentLevel ? 'scale-105' : ''
      }`}
    >
      {/* Premium Track */}
      {premiumReward && (
        <div 
          className="absolute top-0 left-0 right-0 h-8 rounded-t-md flex items-center justify-center"
          style={{
            background: isUnlocked && isPremiumOwned 
              ? 'rgba(250, 204, 21, 0.12)' 
              : 'rgba(148, 163, 184, 0.05)',
            backdropFilter: 'blur(30px) saturate(180%)',
            border: isUnlocked && isPremiumOwned 
              ? '1px solid rgba(250, 204, 21, 0.3)' 
              : '1px solid rgba(148, 163, 184, 0.1)',
          }}
        >
          {isUnlocked && isPremiumOwned ? (
            <Check className="w-3.5 h-3.5 text-yellow-600" />
          ) : (
            <Crown className="w-3.5 h-3.5 text-slate-400/40" />
          )}
        </div>
      )}
      
      {/* Free Track */}
      <div 
        className={`absolute bottom-0 left-0 right-0 h-8 rounded-b-md flex items-center justify-center ${premiumReward ? 'top-9' : 'top-0 rounded-t-md'}`}
        style={{
          background: isUnlocked 
            ? 'rgba(96, 165, 250, 0.12)' 
            : 'rgba(148, 163, 184, 0.05)',
          backdropFilter: 'blur(30px) saturate(180%)',
          border: isUnlocked 
            ? '1px solid rgba(96, 165, 250, 0.3)' 
            : '1px solid rgba(148, 163, 184, 0.1)',
        }}
      >
        {isUnlocked ? (
          <Check className="w-3.5 h-3.5 text-blue-500" />
        ) : (
          <Lock className="w-3.5 h-3.5 text-slate-400/40" />
        )}
      </div>
      
      {/* Level Number */}
      <div 
        className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded text-[10px] font-semibold"
        style={{
          background: isCurrentLevel 
            ? 'rgba(96, 165, 250, 0.2)' 
            : 'rgba(148, 163, 184, 0.08)',
          backdropFilter: 'blur(20px) saturate(180%)',
          border: isCurrentLevel 
            ? '1px solid rgba(96, 165, 250, 0.4)' 
            : '1px solid rgba(148, 163, 184, 0.15)',
          color: isCurrentLevel ? '#60a5fa' : '#64748b',
        }}
      >
        {levelNumber}
      </div>
      
      {/* Current Level Indicator */}
      {isCurrentLevel && (
        <motion.div
          className="absolute -inset-0.5 rounded-md pointer-events-none"
          style={{
            border: '1.5px solid rgba(96, 165, 250, 0.5)',
          }}
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
};

// Track Selector
const TrackSelector = ({ activeTrack, onTrackChange }) => {
  const tracks = [
    { id: 'solo', name: 'Solo', icon: User, color: 'text-cyan-400', description: 'Single-player progression' },
    { id: 'online', name: 'Online/PVP', icon: Sword, color: 'text-red-400', description: 'Competitive multiplayer' },
    { id: 'pve', name: 'PVE/World Events', icon: Globe, color: 'text-green-400', description: 'Raids & boss fights' }
  ];
  
  return (
    <div className="flex gap-4 mb-6">
      {tracks.map((track) => (
        <button
          key={track.id}
          onClick={() => onTrackChange(track.id)}
          className="flex-1 flex items-center gap-2.5 px-5 py-3 rounded-lg transition-all"
          style={{
            background: activeTrack === track.id 
              ? 'rgba(96, 165, 250, 0.15)' 
              : 'rgba(148, 163, 184, 0.05)',
            backdropFilter: 'blur(50px) saturate(200%)',
            border: activeTrack === track.id 
              ? '1px solid rgba(96, 165, 250, 0.3)' 
              : '1px solid rgba(148, 163, 184, 0.12)',
            color: activeTrack === track.id ? '#3b82f6' : '#64748b',
          }}
        >
          <track.icon className="w-5 h-5" />
          <div className="text-left">
            <div className="font-semibold text-sm">{track.name}</div>
            <div className="text-xs opacity-60">{track.description}</div>
          </div>
        </button>
      ))}
    </div>
  );
};

// Preview Modal
const PreviewModal = ({ item, onClose }) => {
  if (!item) return null;
  
  const rarity = rarityColors[item.rarity || 'Common'];
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-8"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 50 }}
        onClick={(e) => e.stopPropagation()}
        className={`relative max-w-4xl w-full bg-slate-900 rounded-3xl border-4 ${rarity.border} ${rarity.glow} shadow-2xl overflow-hidden`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
        >
          <X className="w-6 h-6 text-white" />
        </button>
        
        <div className="grid md:grid-cols-2 gap-6 p-8">
          {/* Left: Image */}
          <div className="relative">
            <img 
              src={item.image} 
              alt={item.name} 
              className="w-full h-96 object-cover rounded-2xl"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-2xl" />
          </div>
          
          {/* Right: Details */}
          <div className="flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Badge className={`${rarity.bg} ${rarity.text} text-sm px-4 py-1`}>
                  {item.rarity}
                </Badge>
                <Badge variant="outline" className="text-sm">
                  {item.type}
                </Badge>
              </div>
              
              <h2 className="text-4xl font-black text-white mb-4">{item.name}</h2>
              <p className="text-lg text-white/70 mb-6">{item.description}</p>
              
              {/* Stats */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                  <span className="text-slate-400">Power Level</span>
                  <span className="text-white font-bold">9,500</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                  <span className="text-slate-400">Cooldown</span>
                  <span className="text-white font-bold">45s</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                  <span className="text-slate-400">Track</span>
                  <span className="text-white font-bold capitalize">{item.track}</span>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
                <Play className="w-4 h-4 mr-2" />
                Preview Animation
              </Button>
              <Button variant="outline" className="w-12">
                <RotateCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default function SeasonalPass() {
  const { user } = useAuth();
  const [activeTrack, setActiveTrack] = useState('solo');
  const [currentLevel, setCurrentLevel] = useState(15);
  const [isPremiumOwned, setIsPremiumOwned] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [seasonLevels] = useState(generateSeasonLevels());
  
  const carouselRef = useRef(null);
  const progressRef = useRef(null);
  
  // Auto-scroll carousel
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;
    
    let scrollInterval = setInterval(() => {
      if (carousel.scrollLeft >= carousel.scrollWidth - carousel.clientWidth) {
        carousel.scrollLeft = 0;
      } else {
        carousel.scrollLeft += 1;
      }
    }, 30);
    
    return () => clearInterval(scrollInterval);
  }, []);
  
  // Center current level on mount
  useEffect(() => {
    const progress = progressRef.current;
    if (!progress) return;
    
    const nodeWidth = 128; // Width including margin
    const scrollPosition = (currentLevel - 1) * nodeWidth - (progress.clientWidth / 2) + (nodeWidth / 2);
    progress.scrollLeft = scrollPosition;
  }, [currentLevel]);
  
  const filteredCards = limitedEditionCards.filter(card => card.track === activeTrack);
  
  return (
    <div 
      className="min-h-screen relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 25%, #cbd5e1 50%, #e2e8f0 75%, #f1f5f9 100%)'
      }}
    >
      {/* Ambient Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-400/8 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-slate-400/8 rounded-full blur-[120px]" />
      </div>
      
      <div className="relative z-10 p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-5xl font-black mb-2 bg-gradient-to-r from-slate-700 via-blue-600 to-slate-700 bg-clip-text text-transparent">
                Season 1: Awakening
              </h1>
              <p className="text-slate-600">Level {currentLevel} / 100 • 45 days remaining</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div 
                className="text-right px-5 py-2.5 rounded-lg"
                style={{
                  background: 'rgba(148, 163, 184, 0.08)',
                  backdropFilter: 'blur(50px) saturate(200%)',
                  border: '1px solid rgba(148, 163, 184, 0.15)',
                }}
              >
                <div className="text-xs text-slate-600 font-medium">Season XP</div>
                <div className="text-xl font-bold text-slate-800">125,430 / 150,000</div>
              </div>
              <Button 
                onClick={() => setIsPremiumOwned(!isPremiumOwned)}
                style={{
                  background: isPremiumOwned 
                    ? 'linear-gradient(135deg, rgba(234, 179, 8, 0.18), rgba(251, 146, 60, 0.18))'
                    : 'rgba(96, 165, 250, 0.15)',
                  backdropFilter: 'blur(50px) saturate(200%)',
                  border: isPremiumOwned 
                    ? '1px solid rgba(234, 179, 8, 0.35)' 
                    : '1px solid rgba(96, 165, 250, 0.3)',
                  color: isPremiumOwned ? '#ca8a04' : '#3b82f6',
                  fontSize: '14px',
                  fontWeight: '600',
                }}
                className="hover:opacity-90 h-10"
              >
                <Crown className="w-4 h-4 mr-2" />
                {isPremiumOwned ? 'Premium Active' : 'Unlock Premium'}
              </Button>
            </div>
          </div>
          
          {/* XP Progress Bar */}
          <div 
            className="w-full h-2.5 rounded-full overflow-hidden"
            style={{
              background: 'rgba(148, 163, 184, 0.1)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(148, 163, 184, 0.15)',
            }}
          >
            <motion.div
              className="h-full"
              style={{
                background: 'linear-gradient(90deg, rgba(96, 165, 250, 0.5), rgba(147, 197, 253, 0.5))',
              }}
              initial={{ width: 0 }}
              animate={{ width: '83%' }}
              transition={{ duration: 1 }}
            />
          </div>
        </div>
        
        {/* Track Selector */}
        <TrackSelector activeTrack={activeTrack} onTrackChange={setActiveTrack} />
        
        {/* Limited Edition Cards Carousel */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-800">
              <Sparkles className="w-6 h-6 text-blue-500" />
              Limited Edition Season Rewards
            </h2>
            <div className="text-sm text-slate-600">
              Scroll to explore • Click to preview
            </div>
          </div>
          
          <div 
            ref={carouselRef}
            className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide"
            style={{ scrollBehavior: 'smooth' }}
          >
            {filteredCards.map((card) => (
              <LimitedEditionCard key={card.id} card={card} onClick={setSelectedItem} />
            ))}
          </div>
        </div>
        
        {/* Flagship Seasonal Companion Spotlight */}
        <div 
          className="mb-12 p-6 rounded-2xl relative overflow-hidden"
          style={{
            background: 'rgba(148, 163, 184, 0.08)',
            backdropFilter: 'blur(60px) saturate(200%)',
            border: '1px solid rgba(148, 163, 184, 0.15)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/3 to-slate-500/3 animate-pulse" />
          <div className="relative z-10 grid md:grid-cols-2 gap-6 items-center">
            <div>
              <Badge 
                className="mb-3 text-white text-xs"
                style={{
                  background: 'rgba(96, 165, 250, 0.2)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(96, 165, 250, 0.3)',
                }}
              >
                Season 1 Exclusive
              </Badge>
              <h2 className="text-3xl font-black mb-3 text-slate-800">Celestial Guardian</h2>
              <p className="text-base text-slate-700 mb-5">
                The flagship companion of Season 1. An ancient protector that provides shields, 
                tactical support, and devastating ultimate abilities for your team.
              </p>
              <div className="flex gap-2.5">
                <Button 
                  style={{
                    background: 'rgba(96, 165, 250, 0.15)',
                    backdropFilter: 'blur(50px) saturate(200%)',
                    border: '1px solid rgba(96, 165, 250, 0.3)',
                    color: '#3b82f6',
                    fontSize: '14px',
                    fontWeight: '600',
                  }}
                  className="hover:opacity-90 h-10"
                >
                  <Play className="w-3.5 h-3.5 mr-1.5" />
                  Watch Trailer
                </Button>
                <Button 
                  style={{
                    background: 'rgba(148, 163, 184, 0.1)',
                    backdropFilter: 'blur(50px)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    color: '#64748b',
                    fontSize: '14px',
                    fontWeight: '600',
                  }}
                  className="hover:opacity-90 h-10"
                >
                  Learn More
                </Button>
              </div>
            </div>
            <div className="relative h-80">
              <img 
                src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&h=400&fit=crop" 
                alt="Celestial Guardian" 
                className="w-full h-full object-cover rounded-2xl"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-2xl" />
            </div>
          </div>
        </div>
        
        {/* Season Pass Progress Track */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-slate-800">
            <Trophy className="w-6 h-6 text-blue-500" />
            Season Pass Progression
          </h2>
          
          {/* Scroll Controls */}
          <div className="flex items-center gap-4 mb-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                if (progressRef.current) {
                  progressRef.current.scrollLeft -= 400;
                }
              }}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="flex-1 text-center text-sm text-slate-600">
              Scroll or drag to explore all 100 levels
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                if (progressRef.current) {
                  progressRef.current.scrollLeft += 400;
                }
              }}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Progress Track */}
          <div 
            ref={progressRef}
            className="relative flex gap-2.5 overflow-x-auto pb-8 pt-2 px-4 rounded-xl scrollbar-hide"
            style={{ 
              scrollBehavior: 'smooth',
              background: 'rgba(148, 163, 184, 0.06)',
              backdropFilter: 'blur(50px) saturate(200%)',
              border: '1px solid rgba(148, 163, 184, 0.12)',
            }}
          >
            {seasonLevels.map((level) => (
              <SeasonLevelNode
                key={level.level}
                level={level}
                isUnlocked={level.level <= currentLevel}
                isPremiumOwned={isPremiumOwned}
                currentLevel={currentLevel}
                onClick={(lvl) => console.log('Clicked level:', lvl)}
              />
            ))}
          </div>
        </div>
        
        {/* Season Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { icon: TrendingUp, label: 'Season Rank', value: '#1,247', color: 'text-blue-400' },
            { icon: Clock, label: 'Time Played', value: '127h', color: 'text-green-400' },
            { icon: Trophy, label: 'Rewards Claimed', value: '45/100', color: 'text-yellow-400' },
            { icon: Users, label: 'Squad Wins', value: '89', color: 'text-purple-400' }
          ].map((stat, i) => (
            <div 
              key={i} 
              className="p-5 rounded-lg"
              style={{
                background: 'rgba(148, 163, 184, 0.08)',
                backdropFilter: 'blur(50px) saturate(200%)',
                border: '1px solid rgba(148, 163, 184, 0.15)',
              }}
            >
              <div className="flex items-center gap-2.5 mb-1.5">
                <stat.icon className="w-4.5 h-4.5 text-blue-500" />
                <span className="text-sm text-slate-600 font-medium">{stat.label}</span>
              </div>
              <div className="text-xl font-bold text-slate-800">{stat.value}</div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Preview Modal */}
      <AnimatePresence>
        {selectedItem && (
          <PreviewModal item={selectedItem} onClose={() => setSelectedItem(null)} />
        )}
      </AnimatePresence>
      
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}