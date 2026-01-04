import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Crosshair, Shield, Zap, Brain, Activity, Globe, 
  ChevronRight, ChevronLeft, Lock, Unlock, Star, Hexagon, Swords, 
  Trophy, Flame, Sparkles, Orbit, ArrowLeft,
  Rocket, Map, Ghost, Box, Monitor, Crown, Gamepad2, X,
  Check, Play, RotateCw, TrendingUp, Clock, Users, Target, User
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// --- MOCK DATA ---

const GENRES = [
  { 
    id: 'mmorpg', 
    name: 'MMORPG', 
    short: 'MMO',
    icon: Globe, 
    color: 'from-purple-500 to-indigo-600', 
    accent: 'text-purple-400',
    xpType: 'Social XP',
    level: 42, 
    maxLevel: 50,
    rank: 'Warlord',
    xp: 92,
    skillPoints: 5,
    paths: ['Synergy', 'Raid', 'Trade']
  },
  { 
    id: 'scifi', 
    name: 'Sci-Fi', 
    short: 'SCI',
    icon: Rocket, 
    color: 'from-cyan-500 to-blue-600',
    accent: 'text-cyan-400', 
    xpType: 'Tech XP',
    level: 28, 
    maxLevel: 50,
    rank: 'Pilot',
    xp: 78,
    skillPoints: 3,
    paths: ['Cybernetics', 'Spaceflight', 'Hacking']
  },
  { 
    id: 'fantasy', 
    name: 'Fantasy', 
    short: 'FAN',
    icon: Crown, 
    color: 'from-amber-400 to-orange-500',
    accent: 'text-amber-400', 
    xpType: 'Magic XP',
    level: 15, 
    maxLevel: 50,
    rank: 'Mage',
    xp: 45,
    skillPoints: 1,
    paths: ['Sorcery', 'Enchanting', 'Lore']
  },
  { 
    id: 'action', 
    name: 'Action', 
    short: 'ACT',
    icon: Swords, 
    color: 'from-red-500 to-rose-600',
    accent: 'text-red-400', 
    xpType: 'Combat XP',
    level: 33, 
    maxLevel: 50,
    rank: 'Warrior',
    xp: 60,
    skillPoints: 2,
    paths: ['Combo', 'Reflex', 'Power']
  },
  { 
    id: 'shooter', 
    name: 'Shooter', 
    short: 'FPS',
    icon: Crosshair, 
    color: 'from-emerald-500 to-green-600',
    accent: 'text-emerald-400', 
    xpType: 'Aim XP',
    level: 50, 
    maxLevel: 50,
    rank: 'Sniper',
    xp: 99,
    skillPoints: 8,
    paths: ['Precision', 'Tactics', 'Loadout']
  },
  { 
    id: 'adventure', 
    name: 'Adventure', 
    short: 'ADV',
    icon: Map, 
    color: 'from-yellow-400 to-orange-400',
    accent: 'text-yellow-400', 
    xpType: 'Discovery XP',
    level: 12, 
    maxLevel: 50,
    rank: 'Explorer',
    xp: 30,
    skillPoints: 1,
    paths: ['Survival', 'Navigation', 'Crafting']
  },
  { 
    id: 'fear', 
    name: 'Fear', 
    short: 'HOR',
    icon: Ghost, 
    color: 'from-slate-800 to-gray-900',
    accent: 'text-slate-400', 
    xpType: 'Sanity XP',
    level: 5, 
    maxLevel: 50,
    rank: 'Survivor',
    xp: 15,
    skillPoints: 0,
    paths: ['Stealth', 'Willpower', 'Investigation']
  },
  { 
    id: 'simulation', 
    name: 'Simulation', 
    short: 'SIM',
    icon: Monitor, 
    color: 'from-blue-400 to-indigo-400',
    accent: 'text-blue-400', 
    xpType: 'Logic XP',
    level: 20, 
    maxLevel: 50,
    rank: 'Architect',
    xp: 55,
    skillPoints: 2,
    paths: ['Management', 'Efficiency', 'Design']
  },
];

const rarityColors = {
  Common: { bg: 'bg-slate-700', border: 'border-slate-500', text: 'text-slate-300', glow: 'shadow-slate-500/50' },
  Rare: { bg: 'bg-blue-900', border: 'border-blue-500', text: 'text-blue-300', glow: 'shadow-blue-500/50' },
  Epic: { bg: 'bg-purple-900', border: 'border-purple-500', text: 'text-purple-300', glow: 'shadow-purple-500/50' },
  Legendary: { bg: 'bg-yellow-900', border: 'border-yellow-500', text: 'text-yellow-300', glow: 'shadow-yellow-500/50' },
  Mythical: { bg: 'bg-red-900', border: 'border-red-500', text: 'text-red-300', glow: 'shadow-red-500/50' },
  Godlike: { bg: 'bg-gradient-to-br from-purple-600 via-pink-600 to-yellow-600', border: 'border-pink-400', text: 'text-white', glow: 'shadow-pink-500/80' }
};

// Generate Mock Progression Levels
const generateProgressionLevels = (genreId, genreName) => {
  const levels = [];
  
  // Icons for "transition-free" look (using Lucide for now as placeholders for transparent assets)
  const getIcon = (id, level) => {
    // In a real app, these would be URLs to transparent PNGs of weapons/armor
    return `https://source.unsplash.com/random/500x500?${id},weapon,armor,transparent&sig=${level}`;
  };
  
  for (let i = 1; i <= 20; i++) {
    const rarity = i === 20 ? 'Godlike' : 
                   i === 15 ? 'Mythical' :
                   i === 10 ? 'Legendary' :
                   i === 5 ? 'Epic' : 
                   i % 2 === 0 ? 'Rare' : 'Common';
    
    levels.push({
      level: i,
      isUnlocked: i <= 12, // Mock progress relative to max level 20
      season: 0,
      cardReward: {
        name: `${genreName} Mastery Reward ${i}`,
        type: 'Ability Reward',
        rarity: rarity,
        // Using a different visual approach - intended to be a floating item
        image: getIcon(genreId, i), 
        description: `Exclusive Season 0 reward for reaching rank ${i} in ${genreName}.`
      },
      equipmentReward: {
        name: `Elite Gear Tier ${i}`,
        type: 'Equipment',
        rarity: rarity === 'Godlike' ? 'Mythical' : rarity === 'Common' ? 'Common' : rarity,
        image: `https://source.unsplash.com/random/300x300?armor,weapon,tech&sig=${i}`,
        description: `High-performance equipment unlocked at level ${i}.`
      }
    });
  }
  return levels;
};

// --- COMPONENTS ---

// Limited Edition Card Component (Migrated from SeasonalPass)
const LimitedEditionCard = ({ card, onClick }) => {
  const rarity = rarityColors[card.rarity];
  
  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -8 }}
      onClick={() => onClick(card)}
      className="relative w-64 h-96 rounded-xl overflow-hidden cursor-pointer shadow-2xl flex-shrink-0"
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
          <Badge className={`${rarity.bg} ${rarity.text} border-slate-600/40 backdrop-blur-md text-[10px] font-semibold px-2 py-0.5`}>
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

// Reward Preview Modal
const RewardModal = ({ level, onClose }) => {
  if (!level) return null;
  const cardRarity = rarityColors[level.cardReward.rarity];
  const equipRarity = rarityColors[level.equipmentReward.rarity];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-8"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="max-w-5xl w-full relative flex flex-col md:flex-row items-start gap-8"
        style={{
          background: 'rgba(20, 25, 35, 0.95)',
          backdropFilter: 'blur(40px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '24px',
          padding: '48px'
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


// Progression Node Component (Refined: Liquid Glass, No Black Box)
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
      {/* Node Content */}
      <div className={`flex flex-col items-center gap-3 transition-all duration-300`}>
         
         {/* Top Info */}
         <div className={`text-center transition-all duration-300 ${isActive ? 'opacity-100 scale-110' : 'opacity-40 group-hover:opacity-100'}`}>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
              Lvl {level}
            </div>
         </div>

         {/* Reward Visual Container (Liquid Glass, No Solid Box) */}
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


export default function GenreMastery({ onClose }) {
  const navigate = useNavigate();
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [progressionData, setProgressionData] = useState([]);
  const [viewingLevel, setViewingLevel] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const scrollContainerRef = useRef(null);
  const carouselRef = useRef(null);

  // Load progression when genre changes
  useEffect(() => {
    if (selectedGenre) {
      setProgressionData(generateProgressionLevels(selectedGenre.id, selectedGenre.name));
    }
  }, [selectedGenre]);

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
  }, [selectedGenre]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, x: -50 },
    show: { opacity: 1, x: 0, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 }
  };

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const { current } = scrollContainerRef;
      const scrollAmount = 400;
      current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Featured Reward (The next big unlock)
  const nextBigUnlock = progressionData.find(p => !p.isUnlocked && (p.cardReward.rarity === 'Legendary' || p.cardReward.rarity === 'Mythical')) || progressionData[progressionData.length - 1];

  // Carousel Items (Filter specific items for carousel display)
  const carouselItems = progressionData.filter(p => ['Legendary', 'Mythical', 'Godlike'].includes(p.cardReward.rarity)).map(p => ({
    ...p.cardReward,
    id: p.level,
    season: `Season ${p.season}`
  }));

  return (
    <div className="h-full w-full bg-black text-white font-sans overflow-hidden relative flex">
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-black to-slate-900" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
        {selectedGenre && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            className={`absolute inset-0 bg-gradient-to-r ${selectedGenre.color} blur-[150px]`}
          />
        )}
      </div>

      {/* Close Button */}
      <button 
        onClick={() => onClose ? onClose() : navigate(-1)}
        className="absolute top-6 right-6 z-50 w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all border border-white/10 hover:border-white/20"
      >
        <X className="w-5 h-5 text-white/60" />
      </button>

      {/* LEFT SIDEBAR: Genre Selection (Updated UI) */}
      <div className="w-32 h-full flex flex-col justify-center px-4 z-20 border-r border-white/10 bg-white/[0.02] backdrop-blur-3xl shadow-[0_0_40px_rgba(0,0,0,0.2)] relative">
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/50 to-transparent z-10" />
        <div className="overflow-y-auto no-scrollbar py-8 flex flex-col gap-5 items-center">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="flex flex-col gap-4 w-full items-center"
          >
            {GENRES.map((genre) => {
              const Icon = genre.icon;
              const isSelected = selectedGenre?.id === genre.id;
              
              return (
                <motion.button
                  key={genre.id}
                  variants={itemVariants}
                  onClick={() => setSelectedGenre(genre)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="group relative flex flex-col items-center justify-center gap-2 py-4 w-full rounded-xl overflow-hidden"
                >
                  {/* 5% Opacity Background Box */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${genre.color} opacity-5 group-hover:opacity-10 transition-opacity duration-300`} />
                  
                  <Icon className={`w-8 h-8 relative z-10 transition-all ${isSelected ? 'text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]' : 'text-slate-400 group-hover:text-white'}`} />
                  
                  <div className="relative z-10 flex flex-col items-center">
                    <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${isSelected ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`}>
                      {genre.name}
                    </span>
                  </div>

                  {isSelected && (
                    <motion.div layoutId="activeBar" className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-full bg-gradient-to-b ${genre.color}`} />
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/50 to-transparent z-10" />
      </div>

      {/* MAIN CONTENT AREA (MIGRATED UI LAYOUT FROM SEASONAL PASS) */}
      <div className="flex-1 flex flex-col z-10 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {selectedGenre ? (
            <motion.div
              key={selectedGenre.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col h-full overflow-y-auto no-scrollbar"
            >
               <div className="p-8 md:p-12 pb-32">
                 {/* HEADER: Similar to Seasonal Pass */}
                 <div className="mb-12">
                   <div className="flex flex-col md:flex-row items-end justify-between gap-8 mb-6">
                     <div>
                       <div className="flex items-center gap-3 mb-2">
                         <Badge variant="outline" className={`bg-black/40 border-white/10 backdrop-blur-md ${selectedGenre.accent} px-3 py-1`}>
                           <selectedGenre.icon className="w-3 h-3 mr-2" />
                           {selectedGenre.rank}
                         </Badge>
                         <Badge variant="outline" className="bg-black/40 border-white/10 text-white/60 px-3 py-1">
                           Level {selectedGenre.level} / 20
                         </Badge>
                         <Badge variant="outline" className="bg-blue-500/20 border-blue-500/30 text-blue-300 px-3 py-1 ml-2">
                           SEASON 0
                         </Badge>
                       </div>
                       
                       <h1 className="text-5xl md:text-7xl font-black mb-2 bg-gradient-to-r from-white via-slate-300 to-slate-500 bg-clip-text text-transparent uppercase tracking-tighter">
                         {selectedGenre.name} Mastery
                       </h1>
                       <p className="text-slate-400 text-lg">Level {selectedGenre.level} / 20 • Season 0 Pass</p>
                     </div>
                     
                     <div className="flex items-center gap-4">
                       <div 
                         className="text-right px-5 py-3 rounded-xl"
                         style={{
                           background: 'rgba(148, 163, 184, 0.08)',
                           backdropFilter: 'blur(50px) saturate(200%)',
                           border: '1px solid rgba(148, 163, 184, 0.15)',
                         }}
                       >
                         <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">{selectedGenre.xpType}</div>
                         <div className="text-2xl font-black text-white">{selectedGenre.xp} / 100</div>
                       </div>
                     </div>
                   </div>
                   
                   {/* XP Progress Bar */}
                   <div 
                     className="w-full h-3 rounded-full overflow-hidden"
                     style={{
                       background: 'rgba(255, 255, 255, 0.05)',
                       backdropFilter: 'blur(20px)',
                       border: '1px solid rgba(255, 255, 255, 0.1)',
                     }}
                   >
                     <motion.div
                       className="h-full"
                       style={{
                         background: `linear-gradient(90deg, ${selectedGenre.color.split(' ')[1].replace('to-', '')} 0%, white 100%)`,
                       }}
                       initial={{ width: 0 }}
                       animate={{ width: `${selectedGenre.xp}%` }}
                       transition={{ duration: 1.5, ease: "circOut" }}
                     />
                   </div>
                 </div>

                 {/* CAROUSEL: Limited Edition Rewards (Migrated UI) */}
                 <div className="mb-12">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold flex items-center gap-3 text-white">
                        <Sparkles className="w-6 h-6 text-yellow-400" />
                        Exclusive Season Rewards
                      </h2>
                      <div className="text-sm text-slate-500 font-medium">
                        Scroll to explore • Click to preview
                      </div>
                    </div>
                    
                    <div 
                      ref={carouselRef}
                      className="flex gap-6 overflow-x-auto pb-8 scrollbar-hide mask-fade-sides"
                      style={{ scrollBehavior: 'smooth' }}
                    >
                      {carouselItems.map((card) => (
                        <LimitedEditionCard 
                           key={card.id} 
                           card={{...card, rarity: card.rarity}} // Ensure rarity prop is passed correctly
                           onClick={() => setViewingLevel(progressionData.find(p => p.level === card.id))} 
                        />
                      ))}
                    </div>
                 </div>

                 {/* FEATURED SPOTLIGHT (Migrated UI) */}
                 {nextBigUnlock && (
                   <div 
                     className="mb-12 p-8 md:p-10 rounded-3xl relative overflow-hidden group cursor-pointer"
                     onClick={() => setViewingLevel(nextBigUnlock)}
                     style={{
                       background: 'rgba(255, 255, 255, 0.03)',
                       backdropFilter: 'blur(60px) saturate(200%)',
                       border: '1px solid rgba(255, 255, 255, 0.1)',
                       boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                     }}
                   >
                     <div className={`absolute inset-0 bg-gradient-to-r ${selectedGenre.color} opacity-5 group-hover:opacity-10 transition-opacity duration-1000`} />
                     <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
                       <div>
                         <Badge 
                           className="mb-4 text-white text-xs px-3 py-1"
                           style={{
                             background: 'rgba(255, 255, 255, 0.1)',
                             backdropFilter: 'blur(20px)',
                             border: '1px solid rgba(255, 255, 255, 0.2)',
                           }}
                         >
                           NEXT MAJOR UNLOCK • LEVEL {nextBigUnlock.level}
                         </Badge>
                         <h2 className="text-4xl md:text-5xl font-black mb-4 text-white leading-tight">{nextBigUnlock.cardReward.name}</h2>
                         <p className="text-lg text-slate-300 mb-8 leading-relaxed max-w-lg">
                           {nextBigUnlock.cardReward.description} Reach level {nextBigUnlock.level} to claim this exclusive reward.
                         </p>
                         <div className="flex gap-4">
                           <Button 
                             style={{
                               background: 'white',
                               color: 'black',
                               fontSize: '14px',
                               fontWeight: 'bold',
                             }}
                             className="hover:bg-slate-200 h-12 px-8 rounded-xl"
                           >
                             <Play className="w-4 h-4 mr-2" />
                             Inspect Reward
                           </Button>
                         </div>
                       </div>
                       <div className="relative h-80 flex items-center justify-center">
                         <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent rounded-2xl" />
                         <motion.img 
                           animate={{ y: [0, -10, 0] }}
                           transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                           src={nextBigUnlock.cardReward.image} 
                           alt="Reward" 
                           className="w-full h-full object-contain drop-shadow-[0_0_50px_rgba(255,255,255,0.2)]"
                         />
                       </div>
                     </div>
                   </div>
                 )}

                 {/* PROGRESS TRACK HEADER */}
                 <div className="mb-6">
                   <h2 className="text-2xl font-bold flex items-center gap-3 text-white">
                     <Trophy className="w-6 h-6 text-blue-500" />
                     Progression Track
                   </h2>
                   
                   {/* Scroll Controls */}
                   <div className="flex items-center gap-4 mt-6 p-4 bg-white/5 rounded-2xl border border-white/5">
                     <Button 
                       variant="ghost" 
                       size="icon"
                       className="bg-white/5 hover:bg-white/10 text-white"
                       onClick={() => scroll('left')}
                     >
                       <ChevronLeft className="w-5 h-5" />
                     </Button>
                     <div className="flex-1 text-center text-sm text-slate-400 font-medium">
                       Navigate through 20 Levels of {selectedGenre.name} Mastery
                     </div>
                     <Button 
                       variant="ghost" 
                       size="icon"
                       className="bg-white/5 hover:bg-white/10 text-white"
                       onClick={() => scroll('right')}
                     >
                       <ChevronRight className="w-5 h-5" />
                     </Button>
                   </div>
                 </div>

                 {/* HORIZONTAL SCROLL TRACK (Using existing LevelNode but in new layout) */}
                 <div 
                    ref={scrollContainerRef}
                    className="relative flex gap-4 overflow-x-auto pb-12 pt-6 px-4 rounded-2xl scrollbar-hide snap-x mb-12"
                    style={{ 
                      scrollBehavior: 'smooth',
                      background: 'rgba(0, 0, 0, 0.2)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    {progressionData.map((level) => (
                      <LevelNode 
                        key={level.level}
                        levelData={level} 
                        isActive={level.level === 36} // Mock active state
                        onClick={setViewingLevel} 
                      />
                    ))}
                 </div>

                 {/* STATS GRID (Migrated UI) */}
                 <div className="grid md:grid-cols-4 gap-4">
                   {[
                     { icon: TrendingUp, label: 'Genre Rank', value: selectedGenre.rank, color: 'text-blue-400' },
                     { icon: Clock, label: 'Time Played', value: '127h', color: 'text-green-400' },
                     { icon: Trophy, label: 'Unlocks', value: '12/20', color: 'text-yellow-400' },
                     { icon: Users, label: 'Skill Points', value: selectedGenre.skillPoints, color: 'text-purple-400' }
                   ].map((stat, i) => (
                     <div 
                       key={i} 
                       className="p-6 rounded-2xl transition-all hover:bg-white/5"
                       style={{
                         background: 'rgba(255, 255, 255, 0.03)',
                         backdropFilter: 'blur(50px) saturate(200%)',
                         border: '1px solid rgba(255, 255, 255, 0.05)',
                       }}
                     >
                       <div className="flex items-center gap-3 mb-2">
                         <stat.icon className={`w-5 h-5 ${stat.color}`} />
                         <span className="text-sm text-slate-500 font-bold uppercase tracking-wider">{stat.label}</span>
                       </div>
                       <div className="text-2xl font-black text-white">{stat.value}</div>
                     </div>
                   ))}
                 </div>
               </div>
            </motion.div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40 p-8">
              <Orbit className="w-32 h-32 text-white mb-8 animate-spin-slow opacity-50" />
              <h1 className="text-6xl font-black uppercase tracking-tighter text-white/50 mb-6">Select a Discipline</h1>
              <p className="text-white/30 max-w-lg mx-auto text-xl font-light">
                Choose a genre from the left sidebar to view your mastery progression, unlock rewards, and track your stats.
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>

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
        .mask-fade-sides {
          mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
        }
      `}</style>
    </div>
  );
}