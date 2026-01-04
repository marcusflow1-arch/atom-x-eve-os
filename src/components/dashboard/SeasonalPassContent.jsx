import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Lock, Check, Star, Zap, Sword, Shield, Users, 
  User, Globe, ChevronLeft, ChevronRight, Sparkles, Crown,
  Play, X, RotateCw, Clock, TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '../auth/AuthContext';
import ShinyCard from '../shared/ShinyCard';

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
    image: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6876751a602125f45f1861b9/87b4c67dd_123-1239359_lightsaber-katana-sword.png',
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
    image: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6876751a602125f45f1861b9/8c415b4eb_bc6044b0f6806867e2f92d967579b4.png',
    season: 'Season 1',
    track: 'solo',
    isAnimated: true
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

// Mock Season Pass Levels (1-100) with card rewards
const generateSeasonLevels = () => {
  const levels = [];
  const rewardTypes = ['Ability', 'Equipment', 'Companion', 'Currency', 'XP Boost'];
  
  const getRewardImage = (level) => {
    return `https://source.unsplash.com/random/500x500?weapon,armor,tech&sig=${level}`;
  };
  
  for (let i = 1; i <= 100; i++) {
    const rarity = i % 25 === 0 ? 'Godlike' : 
                   i % 20 === 0 ? 'Mythical' :
                   i % 10 === 0 ? 'Legendary' :
                   i % 5 === 0 ? 'Epic' : 
                   i % 3 === 0 ? 'Rare' : 'Common';
    
    levels.push({
      level: i,
      isUnlocked: i <= 12,
      season: 1,
      cardReward: {
        name: `Season Reward ${i}`,
        type: rewardTypes[Math.floor(Math.random() * rewardTypes.length)],
        rarity: rarity,
        image: getRewardImage(i),
        description: `Exclusive Season 1 reward for reaching level ${i}.`
      },
      equipmentReward: {
        name: `Elite Gear Tier ${i}`,
        type: 'Equipment',
        rarity: rarity === 'Godlike' ? 'Mythical' : rarity === 'Common' ? 'Common' : rarity,
        image: `https://source.unsplash.com/random/300x300?armor,weapon&sig=${i}`,
        description: `High-performance equipment unlocked at level ${i}.`
      }
    });
  }
  
  return levels;
};

// Limited Edition Card Component with ShinyCard
const LimitedEditionCard = ({ card, onClick }) => {
  const rarity = rarityColors[card.rarity];
  
  return (
    <ShinyCard
      onClick={() => onClick && onClick(card)}
      className="relative w-64 h-96 rounded-xl overflow-hidden cursor-pointer shadow-2xl flex-shrink-0"
    >
      <div
        className="w-full h-full relative"
        style={{
          background: 'rgba(255, 255, 255, 0.06)',
          backdropFilter: 'blur(50px) saturate(200%)',
          WebkitBackdropFilter: 'blur(50px) saturate(200%)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
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
      
      {/* Animated Skybox Background for Mech Wolf */}
      {card.isAnimated && (
        <>
          {/* Animated Starfield Skybox */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900">
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  opacity: Math.random() * 0.7 + 0.3,
                }}
                animate={{
                  opacity: [0.3, 1, 0.3],
                  scale: [1, 1.5, 1],
                }}
                transition={{
                  duration: Math.random() * 3 + 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>
          
          {/* Glowing Aura Layers */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(circle at center, rgba(59, 130, 246, 0.4) 0%, transparent 60%)',
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
            }}
          />
          
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(circle at center, rgba(147, 197, 253, 0.3) 0%, transparent 70%)',
            }}
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.4, 0.7, 0.4],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: 0.5,
            }}
          />
        </>
      )}
      
      {/* Card Image */}
      <motion.img 
        src={card.image} 
        alt={card.name} 
        className="relative w-full h-56 object-cover z-10"
        animate={card.isAnimated ? {
          y: [0, -10, 0],
          filter: [
            'drop-shadow(0 0 20px rgba(59, 130, 246, 0.6))',
            'drop-shadow(0 0 40px rgba(147, 197, 253, 0.8))',
            'drop-shadow(0 0 20px rgba(59, 130, 246, 0.6))',
          ],
        } : {}}
        transition={card.isAnimated ? {
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        } : {}}
      />
      
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
      </div>
    </ShinyCard>
  );
};

// Progression Node Component (From GenreMastery)
const LevelNode = ({ levelData, onClick, isActive }) => {
  const { level, isUnlocked, cardReward } = levelData;
  const rarity = rarityColors[cardReward.rarity];
  const isElite = ['Legendary', 'Mythical', 'Godlike'].includes(cardReward.rarity);

  return (
    <motion.div
      onClick={() => onClick(levelData)}
      className={`relative flex-shrink-0 group cursor-pointer transition-all duration-500 ${
        isActive ? 'w-44 -translate-y-4' : 'w-28'
      }`}
    >
      <div className={`flex flex-col items-center gap-3 transition-all duration-300`}>
         
         {/* Top Info */}
         <div className={`text-center transition-all duration-300 ${isActive ? 'opacity-100 scale-110' : 'opacity-40 group-hover:opacity-100'}`}>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
              Lvl {level}
            </div>
         </div>

         {/* Reward Visual Container (Liquid Glass) */}
         <div className={`
           relative rounded-2xl transition-all duration-300 flex items-center justify-center
           ${isActive 
             ? `w-32 h-32 bg-white/10 border-2 ${rarity.border} shadow-[0_0_30px_rgba(255,255,255,0.1)] z-20 backdrop-blur-md` 
             : `w-20 h-20 bg-white/5 border border-white/10 hover:bg-white/10 hover:w-24 hover:h-24 hover:border-white/30 z-10 backdrop-blur-sm`
           }
         `}
         style={{
            boxShadow: isActive ? `0 0 20px ${rarity.glow?.replace('shadow-', '') || 'rgba(255,255,255,0.2)'}` : 'none'
         }}
         >
            {/* Inner Glow for Rarity */}
            <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${rarity.bg} opacity-10`} />
            
            {/* Reward Image/Icon (Floating) */}
            <div className={`relative w-full h-full p-2 flex items-center justify-center ${isUnlocked ? '' : 'grayscale opacity-30'}`}>
               <img src={cardReward.image} alt="Reward" className="w-full h-full object-contain drop-shadow-lg" />
            </div>
            
            {/* Status Indicator (Minimalist) */}
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
               {isUnlocked ? (
                 <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                    <Check className="w-3 h-3 text-black" />
                 </div>
               ) : (
                 <div className="w-4 h-4 rounded-full bg-black/50 border border-white/10 flex items-center justify-center backdrop-blur-md">
                   <Lock className="w-2.5 h-2.5 text-white/40" />
                 </div>
               )}
            </div>

            {/* Elite Particle Effect for rare items */}
            {isElite && isActive && (
               <div className="absolute -inset-4 bg-gradient-to-t from-white/20 to-transparent blur-xl -z-10 animate-pulse" />
            )}
         </div>
      </div>

      {/* Connection Line Segment */}
      <div className={`absolute bottom-[20%] left-1/2 w-[200%] h-[2px] -z-10 
        ${isUnlocked ? 'bg-gradient-to-r from-white/50 to-white/20' : 'bg-white/5'}
      `} />
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
              : 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(50px) saturate(200%)',
            border: activeTrack === track.id 
              ? '1px solid rgba(96, 165, 250, 0.3)' 
              : '1px solid rgba(255, 255, 255, 0.12)',
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

// Reward Preview Modal (From GenreMastery)
const RewardModal = ({ level, onClose }) => {
  if (!level) return null;
  const cardRarity = rarityColors[level.cardReward.rarity];
  const equipRarity = rarityColors[level.equipmentReward.rarity];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/30 backdrop-blur-md z-[100] flex items-center justify-center p-8"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="max-w-5xl w-full relative flex flex-col md:flex-row items-start gap-8"
        style={{
          background: 'rgba(100, 120, 140, 0.12)',
          backdropFilter: 'blur(30px) saturate(150%)',
          WebkitBackdropFilter: 'blur(30px) saturate(150%)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '24px',
          padding: '48px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
        }}
      >
        <button
            onClick={onClose}
            className="absolute -top-12 right-0 z-20 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
          >
            <X className="w-6 h-6 text-white" />
        </button>

        {/* Left Side: Main Reward Card with Info Below */}
        <div className="flex-shrink-0 flex flex-col items-center gap-4">
          <LimitedEditionCard 
            card={level.cardReward} 
            onClick={null}
            className="w-64 h-80"
          />
          
          <div className="text-center">
            <Badge className={`${cardRarity.bg} ${cardRarity.text} border-white/10 mb-2 px-3 py-1 text-xs backdrop-blur-md`}>
              SEASON {level.season} • {level.cardReward.rarity.toUpperCase()}
            </Badge>
            <h2 className="text-3xl font-black text-white tracking-tight">{level.cardReward.name}</h2>
          </div>
        </div>

        {/* Right Side: Details & Bonus Equipment */}
        <div className="flex-1 flex flex-col gap-6">
          {/* Reward Details Section */}
          <div className="relative">
            <h3 className="text-xs font-bold text-white/40 mb-3 uppercase tracking-widest">Reward Details</h3>
            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
              {level.cardReward.description} Unlocks permanent access to this item for all characters in the current season.
            </p>

            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg border border-white/5">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-400" />
                  <span className="text-slate-300 text-sm">Item Type</span>
                </div>
                <span className="text-white font-bold text-sm">{level.cardReward.type}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg border border-white/5">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span className="text-slate-300 text-sm">Power Score</span>
                </div>
                <span className="text-white font-bold text-sm">850</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg border border-white/5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-300 text-sm">Card ID</span>
                </div>
                <span className="text-white font-bold text-sm font-mono">#{level.level.toString().padStart(4, '0')}</span>
              </div>
            </div>

            <Button 
              className={`w-full py-4 text-sm font-bold tracking-wide rounded-lg transition-all ${
                level.isUnlocked 
                  ? 'bg-white text-black hover:bg-slate-200' 
                  : 'bg-white/10 text-white/40 cursor-not-allowed hover:bg-white/10'
              }`}
            >
              {level.isUnlocked ? (
                <span className="flex items-center justify-center gap-2"><Check className="w-4 h-4" /> CLAIM REWARD</span>
              ) : (
                <span className="flex items-center justify-center gap-2"><Lock className="w-4 h-4" /> LOCKED (Lvl {level.level})</span>
              )}
            </Button>
          </div>
          
          {/* Bonus Equipment Section */}
          <div className="relative border-t border-white/10 pt-6">
            <h3 className="text-xs font-bold text-white/40 mb-3 uppercase tracking-widest flex items-center gap-2">
              <Shield className="w-3 h-3 text-blue-400" /> Bonus Equipment
            </h3>
            
            <div className="flex items-center gap-4">
              {/* Small Equipment Card */}
              <div className="relative w-24 h-32 rounded-lg overflow-hidden border border-white/10 flex-shrink-0">
                <img 
                  src={level.equipmentReward.image} 
                  alt={level.equipmentReward.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <Badge className={`absolute bottom-1 left-1 right-1 ${equipRarity.bg} ${equipRarity.text} text-[8px] px-1 py-0.5 justify-center`}>
                  {level.equipmentReward.rarity}
                </Badge>
              </div>
              
              {/* Equipment Info */}
              <div className="flex-1">
                <h4 className="text-sm font-bold text-white mb-1">{level.equipmentReward.name}</h4>
                <p className="text-xs text-slate-400 line-clamp-2">{level.equipmentReward.description}</p>
              </div>
            </div>
          </div>
        </div>

      </motion.div>
    </motion.div>
  );
};

export default function SeasonalPassContent() {
  const { user, updateUserData } = useAuth();
  const [activeTrack, setActiveTrack] = useState('solo');
  const [currentLevel, setCurrentLevel] = useState(1);
  const [currentXP, setCurrentXP] = useState(0);
  const [isPremiumOwned, setIsPremiumOwned] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [viewingLevel, setViewingLevel] = useState(null);
  const [seasonLevels] = useState(generateSeasonLevels());

  // Load user's season pass data from their profile
  useEffect(() => {
    if (user) {
      setCurrentLevel(user.season_level || 1);
      setCurrentXP(user.season_xp || 0);
      setIsPremiumOwned(user.premium_pass || false);
    }
  }, [user]);

  // Calculate XP needed for next level
  const xpForNextLevel = currentLevel * 1000;
  const xpProgress = (currentXP / xpForNextLevel) * 100;
  
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
    
    const nodeWidth = 144; // Width (128) + Gap (16)
    const scrollPosition = (currentLevel - 1) * nodeWidth - (progress.clientWidth / 2) + (nodeWidth / 2);
    progress.scrollLeft = scrollPosition;
  }, [currentLevel]);
  
  const filteredCards = limitedEditionCards.filter(card => card.track === activeTrack);
  
  return (
    <div 
      className="relative min-h-full overflow-x-hidden"
      style={{
        background: 'rgba(255, 255, 255, 0.01)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
    >
      {/* Ambient Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-400/8 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-slate-400/8 rounded-full blur-[120px]" />
      </div>
      
      <div className="relative z-10 p-8">
        {/* Header - Translucent */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="ml-16">
              <h1 className="text-4xl font-bold mb-2 text-white/70">
                Season 1: Awakening
              </h1>
              <p className="text-white/40">Level {currentLevel} / 100 • 45 days remaining</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div 
                className="text-right px-5 py-2.5 rounded-lg"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.10)',
                }}
              >
                <div className="text-xs text-white/40 font-medium">Season XP</div>
                <div className="text-xl font-bold text-white/80">{currentXP.toLocaleString()} / {xpForNextLevel.toLocaleString()}</div>
              </div>
              <Button 
                onClick={async () => {
                  const newPremiumStatus = !isPremiumOwned;
                  setIsPremiumOwned(newPremiumStatus);
                  await updateUserData({ premium_pass: newPremiumStatus });
                }}
                style={{
                  background: isPremiumOwned 
                    ? 'rgba(234, 179, 8, 0.10)'
                    : 'rgba(96, 165, 250, 0.10)',
                  border: isPremiumOwned 
                    ? '1px solid rgba(234, 179, 8, 0.20)' 
                    : '1px solid rgba(96, 165, 250, 0.20)',
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
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.10)',
            }}
          >
            <motion.div
              className="h-full"
              style={{
                background: 'linear-gradient(90deg, rgba(96, 165, 250, 0.4), rgba(147, 197, 253, 0.4))',
              }}
              initial={{ width: 0 }}
              animate={{ width: `${xpProgress}%` }}
              transition={{ duration: 1 }}
            />
          </div>
        </div>
        
        {/* Track Selector */}
        <TrackSelector activeTrack={activeTrack} onTrackChange={setActiveTrack} />
        
        {/* Limited Edition Cards Carousel */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
              <Sparkles className="w-6 h-6 text-blue-500" />
              Limited Edition Season Rewards
            </h2>
            <div className="text-sm text-slate-400">
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
            background: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(60px) saturate(200%)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
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
              <h2 className="text-3xl font-black mb-3 text-white">Celestial Guardian</h2>
              <p className="text-base text-slate-200 mb-5">
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
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(50px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
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
        
        {/* Season Pass Progress Track - New GenreMastery Style */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-white">
            <Trophy className="w-6 h-6 text-blue-500" />
            Season Pass Progression
          </h2>
          
          {/* Scroll Controls */}
          <div className="flex items-center gap-4 mb-4 p-4 bg-white/5 rounded-2xl border border-white/5">
            <Button 
              variant="ghost" 
              size="icon"
              className="bg-white/5 hover:bg-white/10 text-white"
              onClick={() => {
                if (progressRef.current) {
                  progressRef.current.scrollLeft -= 400;
                }
              }}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1 text-center text-sm text-slate-400 font-medium">
              Navigate through 100 Levels of Season Progression
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              className="bg-white/5 hover:bg-white/10 text-white"
              onClick={() => {
                if (progressRef.current) {
                  progressRef.current.scrollLeft += 400;
                }
              }}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
          
          {/* Progress Track - Updated to use LevelNode */}
          <div 
            ref={progressRef}
            className="relative flex gap-4 overflow-x-auto pb-12 pt-6 px-4 rounded-2xl scrollbar-hide snap-x"
            style={{ 
              scrollBehavior: 'smooth',
              background: 'rgba(0, 0, 0, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            {seasonLevels.map((level) => (
              <LevelNode
                key={level.level}
                levelData={level}
                isActive={level.level === currentLevel}
                onClick={setViewingLevel}
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
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(50px) saturate(200%)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
              }}
            >
              <div className="flex items-center gap-2.5 mb-1.5">
                <stat.icon className="w-4.5 h-4.5 text-blue-500" />
                <span className="text-sm text-slate-400 font-medium">{stat.label}</span>
              </div>
              <div className="text-xl font-bold text-white">{stat.value}</div>
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

      {/* Reward Detail Overlay */}
      <AnimatePresence>
        {viewingLevel && (
          <RewardModal level={viewingLevel} onClose={() => setViewingLevel(null)} />
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