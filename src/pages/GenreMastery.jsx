import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Crosshair, Shield, Zap, Brain, Activity, Globe, 
  ChevronRight, ChevronLeft, Lock, Unlock, Star, Hexagon, Swords, 
  Trophy, Flame, Sparkles, Orbit, ArrowLeft,
  Rocket, Map, Ghost, Box, Monitor, Crown, Gamepad2, X,
  Check, Play, RotateCw
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
    xpType: 'Social XP',
    level: 42, 
    maxLevel: 50,
    rank: 'Warlord',
    rankIcon: Swords,
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
    xpType: 'Tech XP',
    level: 28, 
    maxLevel: 50,
    rank: 'Pilot',
    rankIcon: Shield,
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
    xpType: 'Magic XP',
    level: 15, 
    maxLevel: 50,
    rank: 'Mage',
    rankIcon: Sparkles,
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
    xpType: 'Combat XP',
    level: 33, 
    maxLevel: 50,
    rank: 'Warrior',
    rankIcon: Swords,
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
    xpType: 'Aim XP',
    level: 50, 
    maxLevel: 50,
    rank: 'Sniper',
    rankIcon: Crosshair,
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
    xpType: 'Discovery XP',
    level: 12, 
    maxLevel: 50,
    rank: 'Explorer',
    rankIcon: Globe,
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
    xpType: 'Sanity XP',
    level: 5, 
    maxLevel: 50,
    rank: 'Survivor',
    rankIcon: Activity,
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
    xpType: 'Logic XP',
    level: 20, 
    maxLevel: 50,
    rank: 'Architect',
    rankIcon: Brain,
    xp: 55,
    skillPoints: 2,
    paths: ['Management', 'Efficiency', 'Design']
  },
];

// Rarity System (Borrowed from SeasonalPass for consistency)
const rarityColors = {
  Common: { bg: 'bg-slate-700', border: 'border-slate-500', text: 'text-slate-300', glow: 'shadow-slate-500/50' },
  Rare: { bg: 'bg-blue-900', border: 'border-blue-500', text: 'text-blue-300', glow: 'shadow-blue-500/50' },
  Epic: { bg: 'bg-purple-900', border: 'border-purple-500', text: 'text-purple-300', glow: 'shadow-purple-500/50' },
  Legendary: { bg: 'bg-yellow-900', border: 'border-yellow-500', text: 'text-yellow-300', glow: 'shadow-yellow-500/50' },
  Mythical: { bg: 'bg-red-900', border: 'border-red-500', text: 'text-red-300', glow: 'shadow-red-500/50' },
  Godlike: { bg: 'bg-gradient-to-br from-purple-600 via-pink-600 to-yellow-600', border: 'border-pink-400', text: 'text-white', glow: 'shadow-pink-500/80' }
};

// Generate Mock Progression Levels
const generateProgressionLevels = (genreId) => {
  const levels = [];
  const rewardTypes = ['Ability', 'Equipment', 'Companion', 'Currency'];
  
  for (let i = 1; i <= 50; i++) {
    const rarity = i % 25 === 0 ? 'Godlike' : 
                   i % 10 === 0 ? 'Mythical' :
                   i % 5 === 0 ? 'Legendary' :
                   i % 3 === 0 ? 'Rare' : 'Common';
    
    levels.push({
      level: i,
      isUnlocked: i <= 35, // Mock progress
      cardReward: {
        name: `${genreId.toUpperCase()} Mastery Card ${i}`,
        type: 'Collectible Card',
        rarity: rarity,
        image: `https://source.unsplash.com/random/400x600?${genreId},scifi,cyberpunk&sig=${i}`,
        description: `A commemorative card celebrating rank ${i} in the ${genreId} discipline.`
      },
      equipmentReward: {
        name: `Tactical Gear Mk.${i}`,
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
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-8"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="max-w-5xl w-full bg-slate-900/90 border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col md:flex-row"
      >
        <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors border border-white/10"
          >
            <X className="w-6 h-6 text-white" />
        </button>

        {/* Left Side: Collectible Card */}
        <div className="flex-1 p-8 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 relative overflow-hidden">
           <div className={`absolute inset-0 bg-gradient-to-br ${cardRarity.bg} opacity-10`} />
           <h3 className="text-xl font-bold text-white mb-6 uppercase tracking-widest z-10 flex items-center gap-2">
             <Star className="w-5 h-5 text-yellow-400" /> Collectible Card
           </h3>
           
           <div className={`relative w-72 h-[420px] rounded-2xl overflow-hidden shadow-2xl border-4 ${cardRarity.border} group transition-transform duration-500 hover:scale-105`}>
             <img src={level.cardReward.image} alt={level.cardReward.name} className="w-full h-full object-cover" />
             <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
             <div className="absolute bottom-0 left-0 right-0 p-6">
                <Badge className={`${cardRarity.bg} ${cardRarity.text} mb-2`}>{level.cardReward.rarity}</Badge>
                <h4 className="text-2xl font-black text-white leading-tight mb-1">{level.cardReward.name}</h4>
                <p className="text-xs text-white/70 line-clamp-2">{level.cardReward.description}</p>
             </div>
             {/* Liquid Shine */}
             <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 transform -translate-x-full group-hover:translate-x-full" style={{ transitionDuration: '1.5s' }} />
           </div>
        </div>

        {/* Right Side: Equipment */}
        <div className="flex-1 p-8 bg-slate-950/50 flex flex-col justify-center relative border-l border-white/5">
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


// Progression Node Component
const LevelNode = ({ levelData, onClick }) => {
  const { level, isUnlocked, cardReward } = levelData;
  const rarity = rarityColors[cardReward.rarity];

  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -5 }}
      onClick={() => onClick(levelData)}
      className={`relative flex-shrink-0 w-32 h-40 cursor-pointer group`}
    >
      {/* Connector Line (visual only, simplified) */}
      <div className={`absolute top-1/2 left-full w-8 h-1 -translate-y-1/2 -z-10 ${isUnlocked ? 'bg-blue-500/50' : 'bg-slate-800'}`} />

      <div className={`w-full h-full rounded-2xl border transition-all duration-300 relative overflow-hidden flex flex-col items-center justify-center p-2 ${
        isUnlocked 
          ? 'bg-slate-800/80 border-blue-500/30 hover:border-blue-400' 
          : 'bg-slate-900/50 border-white/5 grayscale opacity-60'
      }`}>
         {/* Top Label */}
         <div className="absolute top-2 left-0 right-0 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500">
           Level {level}
         </div>

         {/* Reward Icons Preview */}
         <div className="flex flex-col items-center gap-2 mt-2">
            <div className={`w-12 h-16 rounded bg-slate-700 border ${rarity.border} shadow-lg relative overflow-hidden`}>
               {/* Tiny Card Preview */}
               <div className={`absolute inset-0 bg-gradient-to-br ${rarity.bg} opacity-50`} />
               <div className="absolute inset-0 flex items-center justify-center">
                 <Star className="w-4 h-4 text-white/80" />
               </div>
            </div>
            <div className="flex items-center gap-1 text-[9px] text-slate-400 bg-black/40 px-2 py-0.5 rounded-full">
              <Shield className="w-2.5 h-2.5" /> + Equip
            </div>
         </div>

         {/* Status Icon */}
         <div className={`absolute bottom-2 w-6 h-6 rounded-full flex items-center justify-center ${
           isUnlocked ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/40' : 'bg-slate-700 text-slate-500'
         }`}>
           {isUnlocked ? <Check className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
         </div>
      </div>
    </motion.div>
  );
};


export default function GenreMastery({ onClose }) {
  const navigate = useNavigate();
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [progressionData, setProgressionData] = useState([]);
  const [viewingLevel, setViewingLevel] = useState(null);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    if (selectedGenre) {
      setProgressionData(generateProgressionLevels(selectedGenre.id));
    }
  }, [selectedGenre]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, x: -50 },
    show: {
      opacity: 1,
      x: 0,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 }
  };

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const { current } = scrollContainerRef;
      const scrollAmount = 300;
      current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="h-full w-full bg-black text-white font-sans overflow-hidden relative flex">
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-black to-slate-900" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
        
        {/* Dynamic Glow based on selection */}
        {selectedGenre && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            className={`absolute left-0 top-0 bottom-0 w-full bg-gradient-to-r ${selectedGenre.color} blur-[120px] opacity-20`}
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

      {/* Vertical Sidebar Column */}
      <div className="h-full flex flex-col justify-center px-8 z-20 overflow-y-auto no-scrollbar py-8 border-r border-white/5 bg-black/20 backdrop-blur-xl">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="flex flex-col gap-4"
        >
          {GENRES.map((genre) => {
            const Icon = genre.icon;
            const isSelected = selectedGenre?.id === genre.id;
            
            return (
              <motion.button
                key={genre.id}
                variants={itemVariants}
                onClick={() => setSelectedGenre(genre)}
                whileHover={{ scale: 1.05, x: 5 }}
                whileTap={{ scale: 0.95 }}
                className={`group relative w-20 h-20 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 border ${
                  isSelected 
                    ? 'border-white/40 shadow-[0_0_20px_rgba(255,255,255,0.2)]' 
                    : 'border-white/10 hover:border-white/30'
                }`}
                style={{
                  background: isSelected ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
                }}
              >
                {/* Icon */}
                <div className={`transition-all duration-300 ${
                  isSelected 
                    ? `text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]` 
                    : 'text-slate-400 group-hover:text-white'
                }`}>
                  <Icon className="w-6 h-6" />
                </div>
                
                {/* Label */}
                <span className={`mt-2 text-[9px] font-bold uppercase tracking-wider transition-colors ${
                  isSelected ? 'text-white' : 'text-slate-500 group-hover:text-white'
                }`}>
                  {genre.short || genre.name}
                </span>

                {/* Left Active Indicator Bar */}
                {isSelected && (
                  <motion.div 
                    layoutId="activeBar"
                    className={`absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-gradient-to-b ${genre.color}`} 
                  />
                )}

                {/* Hover Glow */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${genre.color} opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none`} />
              </motion.button>
            );
          })}
        </motion.div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col z-10 overflow-hidden">
        <AnimatePresence mode="wait">
          {selectedGenre ? (
            <motion.div
              key={selectedGenre.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col p-12 h-full overflow-hidden"
            >
              {/* Header Section */}
              <div className="flex items-center gap-6 mb-12">
                 <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${selectedGenre.color} flex items-center justify-center shadow-2xl`}>
                    <selectedGenre.icon className="w-10 h-10 text-white" />
                 </div>
                 <div>
                   <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400 uppercase tracking-tighter">
                     {selectedGenre.name}
                   </h2>
                   <div className="flex items-center gap-4 mt-2">
                     <Badge variant="outline" className="border-white/20 text-white/60">Rank: {selectedGenre.rank}</Badge>
                     <Badge variant="outline" className="border-white/20 text-white/60">Level {selectedGenre.level} / {selectedGenre.maxLevel}</Badge>
                     <div className="h-1.5 w-32 bg-slate-800 rounded-full overflow-hidden">
                       <div className="h-full bg-white w-[75%]" />
                     </div>
                   </div>
                 </div>
              </div>

              {/* Reward Track Section */}
              <div className="flex-1 flex flex-col justify-center relative">
                 <div className="flex items-center justify-between mb-6">
                   <h3 className="text-xl font-bold text-white flex items-center gap-2">
                     <Trophy className="w-5 h-5 text-yellow-500" /> Mastery Reward Track
                   </h3>
                   <div className="flex gap-2">
                     <button onClick={() => scroll('left')} className="p-2 hover:bg-white/10 rounded-full transition-colors"><ChevronLeft /></button>
                     <button onClick={() => scroll('right')} className="p-2 hover:bg-white/10 rounded-full transition-colors"><ChevronRight /></button>
                   </div>
                 </div>

                 {/* Scrollable Track */}
                 <div 
                   ref={scrollContainerRef}
                   className="flex items-center gap-8 overflow-x-auto pb-12 pt-4 px-4 scrollbar-hide snap-x"
                   style={{ scrollBehavior: 'smooth' }}
                 >
                   {progressionData.map((level, index) => (
                     <React.Fragment key={level.level}>
                        <LevelNode 
                          levelData={level} 
                          onClick={setViewingLevel} 
                        />
                        {/* Connecting Line between nodes */}
                        {index < progressionData.length - 1 && (
                          <div className={`h-1 w-16 flex-shrink-0 rounded-full ${level.isUnlocked ? 'bg-blue-500/30' : 'bg-slate-800'}`} />
                        )}
                     </React.Fragment>
                   ))}
                 </div>
              </div>

            </motion.div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center opacity-30">
              <div>
                 <ArrowLeft className="w-12 h-12 mx-auto mb-4 animate-bounce-x" />
                 <h1 className="text-4xl font-black uppercase tracking-widest text-white/50">Select a Discipline</h1>
              </div>
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