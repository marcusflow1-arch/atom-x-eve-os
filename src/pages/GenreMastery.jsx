import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Crosshair, Shield, Zap, Brain, Activity, Globe, 
  ChevronRight, ChevronLeft, Lock, Unlock, Star, Hexagon, Swords, 
  Trophy, Flame, Sparkles, Orbit, ArrowLeft,
  Rocket, Map, Ghost, Box, Monitor, Crown, Gamepad2, X,
  Check, Play, RotateCw, TrendingUp, Clock, Users, Target
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
        className="max-w-4xl w-full bg-transparent relative flex flex-col md:flex-row items-center gap-12"
      >
        <button
            onClick={onClose}
            className="absolute -top-12 right-0 z-20 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
          >
            <X className="w-6 h-6 text-white" />
        </button>

        {/* Left Side: Floating Item (No Box) */}
        <div className="flex-1 flex flex-col items-center justify-center relative">
           {/* Glow Effect */}
           <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-gradient-to-r ${cardRarity.bg.replace('bg-', 'from-').replace('900', '500')} to-transparent opacity-20 blur-[80px] animate-pulse`} />
           
           <motion.div 
             animate={{ y: [0, -15, 0] }}
             transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
             className="relative z-10 w-80 h-80 flex items-center justify-center"
           >
             {/* Using mask to simulate transparent object if image isn't transparent, 
                 or just displaying it cleanly. For this mock, we assume the image is the item.
                 We add a 'glitch' or 'hologram' effect filter.
             */}
             <div className="w-full h-full p-4 drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">
               <img 
                  src={level.cardReward.image} 
                  alt={level.cardReward.name} 
                  className="w-full h-full object-contain filter brightness-110 contrast-125" 
               />
             </div>
           </motion.div>
           
           <div className="text-center mt-8">
             <Badge className={`${cardRarity.bg} ${cardRarity.text} border-white/10 mb-3 px-3 py-1 text-xs backdrop-blur-md`}>
                SEASON {level.season} • {level.cardReward.rarity.toUpperCase()}
             </Badge>
             <h2 className="text-4xl font-black text-white mb-2 tracking-tight drop-shadow-xl">{level.cardReward.name}</h2>
           </div>
        </div>

        {/* Right Side: Details & Actions */}
        <div className="flex-1 w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 relative overflow-hidden">
           <div className={`absolute inset-0 bg-gradient-to-br ${cardRarity.bg} opacity-5`} />
           
           <div className="relative z-10">
             <h3 className="text-lg font-bold text-white mb-1 uppercase tracking-widest text-white/50">Reward Details</h3>
             <p className="text-lg text-slate-300 mb-8 leading-relaxed font-light">
               {level.cardReward.description} Unlocks permanent access to this item for all characters in the current season.
             </p>

             <div className="space-y-4 mb-8">
               <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
                 <div className="flex items-center gap-3">
                   <Shield className="w-5 h-5 text-blue-400" />
                   <span className="text-slate-300 font-medium">Item Type</span>
                 </div>
                 <span className="text-white font-bold">{level.cardReward.type}</span>
               </div>
               <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
                 <div className="flex items-center gap-3">
                   <Zap className="w-5 h-5 text-yellow-400" />
                   <span className="text-slate-300 font-medium">Power Score</span>
                 </div>
                 <span className="text-white font-bold">850</span>
               </div>
             </div>

             <Button 
               className={`w-full py-7 text-lg font-bold tracking-wide rounded-xl transition-all ${
                 level.isUnlocked 
                   ? 'bg-white text-black hover:bg-slate-200 shadow-[0_0_20px_rgba(255,255,255,0.3)]' 
                   : 'bg-white/10 text-white/40 cursor-not-allowed hover:bg-white/10'
               }`}
             >
               {level.isUnlocked ? (
                 <span className="flex items-center gap-2"><Check className="w-5 h-5" /> CLAIM REWARD</span>
               ) : (
                 <span className="flex items-center gap-2"><Lock className="w-4 h-4" /> LOCKED (Lvl {level.level})</span>
               )}
             </Button>
           </div>
        </div>
           <div className="mb-8">
             <h3 className="text-xl font-bold text-white mb-6 uppercase tracking-widest flex items-center gap-2">
               <Shield className="w-5 h-5 text-blue-400" /> Equipment Reward
             </h3>
             <div className="flex items-start gap-6">
                <div className={`w-24 h-24 rounded-xl border-2 ${equipRarity.border} bg-slate-800 overflow-hidden flex-shrink-0`}>
                  <img src={level.equipmentReward.image} alt="Equip" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="text-2xl font-bold text-white mb-1">{level.equipmentReward.name}</h4>
                  <Badge variant="outline" className={`${equipRarity.text} border-current mb-2`}>{level.equipmentReward.rarity}</Badge>
                  <p className="text-sm text-slate-400">{level.equipmentReward.description}</p>
                </div>
             </div>
           </div>

           <div className="space-y-4">
             <div className="bg-white/5 rounded-lg p-4 border border-white/5">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-400 text-sm">Power Level</span>
                  <span className="text-white font-bold">840</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full w-[75%]" />
                </div>
             </div>
             <Button className="w-full py-6 text-lg font-bold bg-white text-black hover:bg-slate-200">
               {level.isUnlocked ? 'Claim Rewards' : 'Locked'}
             </Button>
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
  const scrollContainerRef = useRef(null);

  // Load progression when genre changes
  useEffect(() => {
    if (selectedGenre) {
      setProgressionData(generateProgressionLevels(selectedGenre.id, selectedGenre.name));
    }
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

      {/* LEFT SIDEBAR: Genre Selection */}
      <div className="w-32 h-full flex flex-col justify-center px-4 z-20 border-r border-white/5 bg-black/40 backdrop-blur-xl relative">
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black to-transparent z-10" />
        <div className="overflow-y-auto no-scrollbar py-8 flex flex-col gap-5 items-center">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="flex flex-col gap-6 w-full items-center"
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
                  className={`group relative w-16 h-16 rounded-xl flex items-center justify-center transition-all duration-300 border ${
                    isSelected 
                      ? 'border-white/60 shadow-[0_0_25px_rgba(255,255,255,0.3)] bg-white/10' 
                      : 'border-white/10 hover:border-white/30 bg-white/5'
                  }`}
                >
                  <Icon className={`w-7 h-7 transition-all ${isSelected ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'text-slate-400 group-hover:text-white'}`} />
                  {isSelected && (
                    <motion.div layoutId="activeBar" className={`absolute -left-4 top-2 bottom-2 w-1 rounded-r-full bg-gradient-to-b ${genre.color}`} />
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black to-transparent z-10" />
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col z-10 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {selectedGenre ? (
            <motion.div
              key={selectedGenre.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col h-full"
            >
              
              {/* SCROLLABLE TOP CONTENT */}
              <div className="flex-1 overflow-y-auto no-scrollbar pb-64"> {/* Padding bottom for fixed track */}
                <div className="max-w-7xl mx-auto p-8 md:p-12 w-full">
                  
                  {/* HEADER: Title & Progress */}
                  <div className="flex flex-col md:flex-row items-end justify-between gap-8 mb-12">
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
                      <h1 className="text-6xl md:text-8xl font-black text-white uppercase tracking-tighter leading-[0.85] mb-4 drop-shadow-2xl">
                        {selectedGenre.name}
                        <span className="block text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white/60 to-white/10 tracking-[0.5em] mt-2">
                          SEASON 0 PASS
                        </span>
                      </h1>
                    </div>
                    
                    {/* Progress Stats Card */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl w-full md:w-auto min-w-[300px]">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Season Progress</span>
                        <span className="text-white font-bold">{selectedGenre.xp}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden mb-4">
                        <motion.div 
                          initial={{ width: 0 }} 
                          animate={{ width: `${selectedGenre.xp}%` }} 
                          transition={{ duration: 1.5, ease: "circOut" }}
                          className={`h-full bg-gradient-to-r ${selectedGenre.color} shadow-[0_0_15px_currentColor]`}
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                           <div className="text-white font-bold text-lg">12</div>
                           <div className="text-[10px] text-slate-500 uppercase">Unlocks</div>
                        </div>
                        <div>
                           <div className="text-white font-bold text-lg">840</div>
                           <div className="text-[10px] text-slate-500 uppercase">Power</div>
                        </div>
                        <div>
                           <div className="text-white font-bold text-lg">4d</div>
                           <div className="text-[10px] text-slate-500 uppercase">Time Left</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* FEATURED SPOTLIGHT (Celestial Guardian Style) */}
                  {nextBigUnlock && (
                    <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-black/20 backdrop-blur-3xl mb-16 group">
                      <div className={`absolute inset-0 bg-gradient-to-r ${selectedGenre.color} opacity-10 group-hover:opacity-15 transition-opacity duration-1000`} />
                      
                      <div className="grid lg:grid-cols-2 gap-0">
                         {/* Content Side */}
                         <div className="p-10 md:p-14 flex flex-col justify-center relative z-10">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 text-yellow-200 text-xs font-bold uppercase tracking-wider w-fit mb-6">
                              <Sparkles className="w-3 h-3" /> Next Major Reward • Level {nextBigUnlock.level}
                            </div>
                            
                            <h2 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
                              {nextBigUnlock.cardReward.name}
                            </h2>
                            <p className="text-lg text-slate-300 mb-8 leading-relaxed max-w-md">
                              {nextBigUnlock.cardReward.description} Unlock this exclusive reward to dominate the battlefield with enhanced capabilities and prestige.
                            </p>
                            
                            <div className="flex items-center gap-4">
                              <Button className="h-12 px-8 bg-white text-black hover:bg-slate-200 font-bold rounded-lg" onClick={() => setViewingLevel(nextBigUnlock)}>
                                Inspect Reward
                              </Button>
                              <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                                <Lock className="w-4 h-4" /> Requires Level {nextBigUnlock.level}
                              </div>
                            </div>
                         </div>

                         {/* Image Side */}
                         <div className="relative h-[400px] lg:h-auto overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-l from-transparent via-black/20 to-black/80 z-10 lg:bg-gradient-to-r" />
                            <img 
                              src={nextBigUnlock.cardReward.image} 
                              alt="Featured" 
                              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                            />
                         </div>
                      </div>
                    </div>
                  )}

                  {/* STATS GRID */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
                     <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors">
                        <TrendingUp className={`w-8 h-8 ${selectedGenre.accent} mb-4`} />
                        <div className="text-3xl font-bold text-white mb-1">Top 1%</div>
                        <div className="text-xs text-slate-400 uppercase tracking-wider">Global Ranking</div>
                     </div>
                     <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors">
                        <Target className={`w-8 h-8 ${selectedGenre.accent} mb-4`} />
                        <div className="text-3xl font-bold text-white mb-1">98%</div>
                        <div className="text-xs text-slate-400 uppercase tracking-wider">Accuracy Rating</div>
                     </div>
                     <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors">
                        <Users className={`w-8 h-8 ${selectedGenre.accent} mb-4`} />
                        <div className="text-3xl font-bold text-white mb-1">1,240</div>
                        <div className="text-xs text-slate-400 uppercase tracking-wider">Clan Contributions</div>
                     </div>
                     <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors">
                        <Clock className={`w-8 h-8 ${selectedGenre.accent} mb-4`} />
                        <div className="text-3xl font-bold text-white mb-1">342h</div>
                        <div className="text-xs text-slate-400 uppercase tracking-wider">Time Played</div>
                     </div>
                  </div>

                </div>
              </div>

              {/* FIXED BOTTOM TRACK (Cinematic) */}
              <div className="absolute bottom-0 left-0 right-0 h-48 z-40">
                 {/* Glass Background */}
                 <div className="absolute inset-0 bg-black/60 backdrop-blur-xl border-t border-white/10 shadow-[0_-10px_50px_rgba(0,0,0,0.5)]" />
                 
                 {/* Decorative Line */}
                 <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />

                 <div className="relative h-full flex flex-col justify-center">
                    {/* Track Header */}
                    <div className="absolute top-4 left-8 right-8 flex justify-between items-center z-10 pointer-events-none">
                       <div className="text-xs font-bold text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
                          <Trophy className="w-3 h-3" /> Reward Progression Track
                       </div>
                       <div className="text-xs font-bold text-white/40 uppercase tracking-[0.2em]">
                          Scroll to Navigate
                       </div>
                    </div>

                    {/* Left/Right Controls */}
                    <button 
                      onClick={() => scroll('left')}
                      className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white transition-all hover:scale-110"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => scroll('right')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white transition-all hover:scale-110"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>

                    {/* Scrollable Items */}
                    <div 
                      ref={scrollContainerRef}
                      className="flex items-center gap-0 px-12 overflow-x-auto scrollbar-hide h-full snap-x pt-6"
                      style={{ scrollBehavior: 'smooth' }}
                    >
                      <div className="flex items-end gap-1 min-w-max pb-4">
                        {progressionData.map((level, index) => (
                           <LevelNode 
                             key={level.level}
                             levelData={level} 
                             isActive={level.level === 36} // Mock active state
                             onClick={setViewingLevel} 
                           />
                        ))}
                      </div>
                    </div>
                 </div>
              </div>

            </motion.div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40 p-8">
              <Orbit className="w-24 h-24 text-white mb-6 animate-spin-slow" />
              <h1 className="text-5xl font-black uppercase tracking-widest text-white/50 mb-4">Select a Discipline</h1>
              <p className="text-white/30 max-w-md mx-auto text-lg">Choose a genre from the left sidebar to view your mastery progression, unlock rewards, and track your stats.</p>
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
    </div>
  );
}