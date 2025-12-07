import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Crosshair, Shield, Zap, Brain, Activity, Globe, 
  ChevronRight, Lock, Unlock, Star, Hexagon, Swords, 
  Trophy, Flame, Sparkles, Orbit, ArrowLeft,
  Rocket, Map, Ghost, Box, Monitor, Crown, Gamepad2, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

export default function GenreMastery({ onClose }) {
  const navigate = useNavigate();
  const [selectedGenre, setSelectedGenre] = useState(null);

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
            className={`absolute left-0 top-0 bottom-0 w-1/3 bg-gradient-to-r ${selectedGenre.color} blur-[100px]`}
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
      <div className="h-full flex flex-col justify-center px-8 z-20 overflow-y-auto no-scrollbar py-8">
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

      {/* Main Content Area - Blank Slate for now */}
      <div className="flex-1 flex items-center justify-center z-10 p-12">
        <AnimatePresence mode="wait">
          {selectedGenre ? (
            <motion.div
              key={selectedGenre.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center"
            >
              <h2 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-500 uppercase tracking-tighter mb-4">
                {selectedGenre.name}
              </h2>
              <p className="text-slate-400 text-sm tracking-[0.5em] uppercase">Mastery Level {selectedGenre.level}</p>
            </motion.div>
          ) : (
            <div className="text-center opacity-30">
              <h1 className="text-4xl font-black uppercase tracking-widest text-white/50">Select Genre</h1>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}