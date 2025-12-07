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

// Skill Tree Structure for FPS (Mock - retained for future use)
const FPS_TREE = {
  reflex: [
    { id: 'r1', name: 'Quick Aim', tier: 1, type: 'standard', unlocked: true, description: '+10% ADS Speed' },
    { id: 'r2', name: 'Slide Kill', tier: 2, type: 'advanced', unlocked: true, description: 'Shoot while sliding with no penalty' },
    { id: 'r3', name: 'Blink Dodge', tier: 3, type: 'ultimate', unlocked: false, description: 'Short range teleport dash' },
  ],
  weaponry: [
    { id: 'w1', name: 'Armor Pen', tier: 1, type: 'standard', unlocked: true, description: '+15% Bullet Penetration' },
    { id: 'w2', name: 'Dual Reload', tier: 2, type: 'advanced', unlocked: false, description: 'Reload secondary while firing primary' },
    { id: 'w3', name: 'Overcharge', tier: 3, type: 'ultimate', unlocked: false, description: 'Next magazine deals +50% damage' },
  ],
  tactics: [
    { id: 't1', name: 'Flank Boost', tier: 1, type: 'standard', unlocked: true, description: '+10% Speed when out of combat' },
    { id: 't2', name: 'Radar Hack', tier: 2, type: 'advanced', unlocked: false, description: 'Reveal enemies within 20m on kill' },
    { id: 't3', name: 'Ghost Step', tier: 3, type: 'ultimate', unlocked: false, description: 'Silent footsteps while crouching' },
  ]
};

export default function GenreMastery({ onClose }) {
  const navigate = useNavigate();
  const [selectedGenre, setSelectedGenre] = useState(null);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 20 },
    show: { opacity: 1, scale: 1, y: 0 }
  };

  return (
    <div className="h-full w-full bg-black text-white font-sans overflow-hidden relative flex flex-col">
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-black to-slate-900" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-500/10 rounded-full blur-[100px] opacity-30 animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[80px] opacity-30" />
      </div>

      {/* Close Button */}
      <button 
        onClick={() => onClose ? onClose() : navigate(-1)}
        className="absolute top-6 right-6 z-50 w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all border border-white/10 hover:border-white/20"
      >
        <X className="w-5 h-5 text-white/60" />
      </button>

      {/* Main Content Container */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-8">
        
        {/* Title */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase mb-2">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400">
              Genre Mastery
            </span>
          </h1>
          <p className="text-slate-400 text-sm tracking-[0.3em] uppercase">Select a discipline</p>
        </motion.div>

        {/* Genre Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto"
        >
          {GENRES.map((genre) => {
            const Icon = genre.icon;
            const isSelected = selectedGenre?.id === genre.id;
            
            return (
              <motion.button
                key={genre.id}
                variants={itemVariants}
                onClick={() => setSelectedGenre(genre)}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                className={`group relative w-32 h-32 md:w-40 md:h-40 rounded-3xl flex flex-col items-center justify-center transition-all duration-300 border ${
                  isSelected 
                    ? 'border-white/40 shadow-[0_0_30px_rgba(255,255,255,0.2)]' 
                    : 'border-white/10 hover:border-white/30'
                }`}
                style={{
                  background: isSelected ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
                }}
              >
                {/* Icon Container */}
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 ${
                  isSelected 
                    ? `bg-gradient-to-br ${genre.color} text-white shadow-lg` 
                    : 'bg-white/5 text-slate-400 group-hover:bg-white/10 group-hover:text-white'
                }`}>
                  <Icon className="w-7 h-7" />
                </div>
                
                {/* Text */}
                <span className={`text-xs font-bold uppercase tracking-wider transition-colors ${
                  isSelected ? 'text-white' : 'text-slate-500 group-hover:text-white'
                }`}>
                  {genre.name}
                </span>

                {/* Level Badge (Optional detail) */}
                <div className="absolute top-3 right-3 text-[10px] font-mono text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  LVL {genre.level}
                </div>

                {/* Hover Glow */}
                <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${genre.color} opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none`} />
              </motion.button>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}