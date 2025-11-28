import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Sparkles, Trophy, Crown, Star, Zap, Lock, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

// Rarity color mapping
const RARITY_STYLES = {
  Common: { color: 'text-gray-400', bg: 'bg-gray-900/50', border: 'border-gray-500', glow: 'shadow-gray-500/20' },
  Uncommon: { color: 'text-green-400', bg: 'bg-green-900/50', border: 'border-green-500', glow: 'shadow-green-500/30' },
  Rare: { color: 'text-blue-400', bg: 'bg-blue-900/50', border: 'border-blue-500', glow: 'shadow-blue-500/30' },
  Epic: { color: 'text-purple-400', bg: 'bg-purple-900/50', border: 'border-purple-500', glow: 'shadow-purple-500/40' },
  Legendary: { color: 'text-orange-400', bg: 'bg-orange-900/50', border: 'border-orange-500', glow: 'shadow-orange-500/40' },
  Mythical: { color: 'text-red-400', bg: 'bg-red-900/50', border: 'border-red-500', glow: 'shadow-red-500/50' },
  Celestial: { color: 'text-cyan-400', bg: 'bg-cyan-900/50', border: 'border-cyan-500', glow: 'shadow-cyan-500/50' },
  Demigod: { color: 'text-pink-400', bg: 'bg-pink-900/50', border: 'border-pink-500', glow: 'shadow-pink-500/60 animate-pulse' },
  Godlike: { color: 'text-yellow-300', bg: 'bg-yellow-900/50', border: 'border-yellow-500', glow: 'shadow-yellow-500/70 animate-pulse' },
  Chosen: { color: 'text-white', bg: 'bg-gradient-to-br from-purple-900 via-pink-900 to-yellow-900', border: 'border-white', glow: 'shadow-white/80 animate-pulse' }
};

// Mock data for recently discovered achievements
const RECENTLY_DISCOVERED = [
  {
    id: 'ach1',
    name: 'Dragon Slayer Supreme',
    icon: '🐉',
    currentRarity: 'Legendary',
    description: 'Defeat the Ancient Dragon in under 5 minutes',
    totalUnlocked: 12453,
    tier1: [
      { rarity: 'Common', dropChance: '45%', color: 'gray' },
      { rarity: 'Uncommon', dropChance: '25%', color: 'green' },
      { rarity: 'Rare', dropChance: '15%', color: 'blue' },
      { rarity: 'Epic', dropChance: '10%', color: 'purple' },
      { rarity: 'Legendary', dropChance: '4%', color: 'orange' }
    ],
    tier2: [
      { rarity: 'Mythical', dropChance: '0.8%', remaining: 3, total: 100 },
      { rarity: 'Celestial', dropChance: '0.15%', remaining: 1, total: 50 },
      { rarity: 'Demigod', dropChance: '0.04%', remaining: 0, total: 10 },
      { rarity: 'Godlike', dropChance: '0.01%', remaining: 0, total: 5 }
    ],
    tier3: {
      rarity: 'Chosen',
      name: 'Dragon God Ascendant',
      description: 'Unlock the ultimate dragon transformation',
      requirement: 'Defeat Ancient Dragon 100 times with all rarities',
      unlocked: false,
      remaining: 1,
      total: 1
    }
  },
  {
    id: 'ach2',
    name: 'Shadow Master',
    icon: '👤',
    currentRarity: 'Epic',
    description: 'Complete all stealth missions undetected',
    totalUnlocked: 8921,
    tier1: [
      { rarity: 'Common', dropChance: '40%', color: 'gray' },
      { rarity: 'Uncommon', dropChance: '30%', color: 'green' },
      { rarity: 'Rare', dropChance: '18%', color: 'blue' },
      { rarity: 'Epic', dropChance: '8%', color: 'purple' },
      { rarity: 'Legendary', dropChance: '3%', color: 'orange' }
    ],
    tier2: [
      { rarity: 'Mythical', dropChance: '0.9%', remaining: 5, total: 100 },
      { rarity: 'Celestial', dropChance: '0.08%', remaining: 2, total: 50 },
      { rarity: 'Demigod', dropChance: '0.015%', remaining: 1, total: 10 },
      { rarity: 'Godlike', dropChance: '0.005%', remaining: 0, total: 5 }
    ],
    tier3: {
      rarity: 'Chosen',
      name: 'Phantom of the Void',
      description: 'Become invisible to all detection systems',
      requirement: 'Master all shadow abilities',
      unlocked: false,
      remaining: 1,
      total: 1
    }
  },
  {
    id: 'ach3',
    name: 'Cyber Warrior',
    icon: '⚔️',
    currentRarity: 'Mythical',
    description: 'Win 50 consecutive PvP matches',
    totalUnlocked: 15234,
    tier1: [
      { rarity: 'Common', dropChance: '42%', color: 'gray' },
      { rarity: 'Uncommon', dropChance: '28%', color: 'green' },
      { rarity: 'Rare', dropChance: '16%', color: 'blue' },
      { rarity: 'Epic', dropChance: '9%', color: 'purple' },
      { rarity: 'Legendary', dropChance: '4%', color: 'orange' }
    ],
    tier2: [
      { rarity: 'Mythical', dropChance: '0.7%', remaining: 7, total: 100 },
      { rarity: 'Celestial', dropChance: '0.2%', remaining: 3, total: 50 },
      { rarity: 'Demigod', dropChance: '0.08%', remaining: 1, total: 10 },
      { rarity: 'Godlike', dropChance: '0.02%', remaining: 1, total: 5 }
    ],
    tier3: {
      rarity: 'Chosen',
      name: 'Cyber Overlord',
      description: 'Control the entire digital battlefield',
      requirement: 'Win 1000 PvP matches',
      unlocked: true,
      remaining: 0,
      total: 1
    }
  },
  {
    id: 'ach4',
    name: 'Arcane Prodigy',
    icon: '🔮',
    currentRarity: 'Rare',
    description: 'Master all magical schools',
    totalUnlocked: 9876,
    tier1: [
      { rarity: 'Common', dropChance: '50%', color: 'gray' },
      { rarity: 'Uncommon', dropChance: '25%', color: 'green' },
      { rarity: 'Rare', dropChance: '12%', color: 'blue' },
      { rarity: 'Epic', dropChance: '8%', color: 'purple' },
      { rarity: 'Legendary', dropChance: '4%', color: 'orange' }
    ],
    tier2: [
      { rarity: 'Mythical', dropChance: '0.8%', remaining: 10, total: 100 },
      { rarity: 'Celestial', dropChance: '0.15%', remaining: 5, total: 50 },
      { rarity: 'Demigod', dropChance: '0.04%', remaining: 2, total: 10 },
      { rarity: 'Godlike', dropChance: '0.01%', remaining: 1, total: 5 }
    ],
    tier3: {
      rarity: 'Chosen',
      name: 'Archmage Supreme',
      description: 'Transcend all magical limitations',
      requirement: 'Cast 10,000 unique spell combinations',
      unlocked: false,
      remaining: 1,
      total: 1
    }
  },
  {
    id: 'ach5',
    name: 'Void Walker',
    icon: '🌌',
    currentRarity: 'Celestial',
    description: 'Traverse between dimensions',
    totalUnlocked: 5432,
    tier1: [
      { rarity: 'Common', dropChance: '38%', color: 'gray' },
      { rarity: 'Uncommon', dropChance: '30%', color: 'green' },
      { rarity: 'Rare', dropChance: '18%', color: 'blue' },
      { rarity: 'Epic', dropChance: '10%', color: 'purple' },
      { rarity: 'Legendary', dropChance: '3%', color: 'orange' }
    ],
    tier2: [
      { rarity: 'Mythical', dropChance: '0.7%', remaining: 4, total: 100 },
      { rarity: 'Celestial', dropChance: '0.25%', remaining: 2, total: 50 },
      { rarity: 'Demigod', dropChance: '0.04%', remaining: 1, total: 10 },
      { rarity: 'Godlike', dropChance: '0.01%', remaining: 0, total: 5 }
    ],
    tier3: {
      rarity: 'Chosen',
      name: 'Dimensional Lord',
      description: 'Command all dimensions at will',
      requirement: 'Visit every dimension 100 times',
      unlocked: false,
      remaining: 1,
      total: 1
    }
  },
  {
    id: 'ach6',
    name: 'Quantum Leap',
    icon: '⚡',
    currentRarity: 'Epic',
    description: 'Break the speed barrier',
    totalUnlocked: 11234,
    tier1: [
      { rarity: 'Common', dropChance: '44%', color: 'gray' },
      { rarity: 'Uncommon', dropChance: '26%', color: 'green' },
      { rarity: 'Rare', dropChance: '15%', color: 'blue' },
      { rarity: 'Epic', dropChance: '10%', color: 'purple' },
      { rarity: 'Legendary', dropChance: '4%', color: 'orange' }
    ],
    tier2: [
      { rarity: 'Mythical', dropChance: '0.9%', remaining: 8, total: 100 },
      { rarity: 'Celestial', dropChance: '0.09%', remaining: 3, total: 50 },
      { rarity: 'Demigod', dropChance: '0.006%', remaining: 1, total: 10 },
      { rarity: 'Godlike', dropChance: '0.004%', remaining: 0, total: 5 }
    ],
    tier3: {
      rarity: 'Chosen',
      name: 'Time Sovereign',
      description: 'Control the flow of time itself',
      requirement: 'Travel faster than light 1000 times',
      unlocked: false,
      remaining: 1,
      total: 1
    }
  }
];

// Mock data for recent player acquisitions
const RECENT_ACQUISITIONS = [
  { player: 'Shadow_Stryker', achievement: 'Dragon Slayer Supreme', rarity: 'Godlike', timestamp: '2 min ago' },
  { player: 'GlitchWitch', achievement: 'Cyber Warrior', rarity: 'Celestial', timestamp: '5 min ago' },
  { player: 'Cortex_Prime', achievement: 'Shadow Master', rarity: 'Mythical', timestamp: '8 min ago' },
  { player: 'VoidWalker99', achievement: 'Arcane Prodigy', rarity: 'Legendary', timestamp: '12 min ago' },
  { player: 'NeonBlade', achievement: 'Void Walker', rarity: 'Epic', timestamp: '15 min ago' },
  { player: 'QuantumHacker', achievement: 'Quantum Leap', rarity: 'Rare', timestamp: '18 min ago' },
  { player: 'CyberMage', achievement: 'Dragon Slayer Supreme', rarity: 'Legendary', timestamp: '22 min ago' },
  { player: 'StarBreaker', achievement: 'Shadow Master', rarity: 'Epic', timestamp: '25 min ago' },
  { player: 'PhantomX', achievement: 'Cyber Warrior', rarity: 'Mythical', timestamp: '30 min ago' },
  { player: 'ArcaneKnight', achievement: 'Arcane Prodigy', rarity: 'Demigod', timestamp: '35 min ago' },
  { player: 'VexiaStorm', achievement: 'Void Walker', rarity: 'Celestial', timestamp: '40 min ago' },
  { player: 'CodeBreaker', achievement: 'Quantum Leap', rarity: 'Legendary', timestamp: '45 min ago' }
];

const AchievementCard = ({ achievement, isExpanded, onClick }) => {
  const rarity = RARITY_STYLES[achievement.currentRarity];
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex-shrink-0 w-48"
    >
      <Card 
        className={`${rarity.bg} border-2 ${rarity.border} ${rarity.glow} cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl`}
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="text-center">
            <motion.div 
              className="text-5xl mb-3"
              animate={{ 
                scale: isExpanded ? [1, 1.2, 1] : 1,
                rotate: isExpanded ? [0, 360] : 0
              }}
              transition={{ duration: 0.5 }}
            >
              {achievement.icon}
            </motion.div>
            <h3 className={`font-bold text-sm mb-2 ${rarity.color}`}>{achievement.name}</h3>
            <Badge className={`${rarity.bg} ${rarity.color} border ${rarity.border}`}>
              {achievement.currentRarity}
            </Badge>
            <div className="mt-2 text-xs text-slate-400">
              {achievement.totalUnlocked.toLocaleString()} unlocked
            </div>
            <div className="mt-2 text-xs text-slate-400 flex items-center justify-center gap-1">
              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              <span>{isExpanded ? 'Hide' : 'Show'} Tiers</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expanded Three-Tier System */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            transition={{ duration: 0.4, type: 'spring', damping: 20 }}
            className="mt-4 overflow-hidden"
          >
            <div className="space-y-4">
              {/* Tier 1: Common - Legendary */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-blue-500/50 rounded-xl p-4 shadow-lg shadow-blue-500/20"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-5 h-5 text-blue-400" />
                  <h4 className="text-lg font-bold text-blue-400">TIER 1: Standard Rarities</h4>
                </div>
                <p className="text-xs text-slate-400 mb-3">Unlimited availability • Percentage-based drops</p>
                <div className="space-y-2">
                  {achievement.tier1.map((tier, index) => {
                    const tierStyle = RARITY_STYLES[tier.rarity];
                    return (
                      <motion.div 
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + index * 0.05 }}
                        className={`flex items-center justify-between p-3 rounded-lg ${tierStyle.bg} border ${tierStyle.border} ${tierStyle.glow} hover:scale-[1.02] transition-all`}
                      >
                        <span className={`font-bold ${tierStyle.color}`}>{tier.rarity}</span>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-sm font-semibold text-white">{tier.dropChance}</div>
                            <div className="text-xs text-slate-400">Drop Rate</div>
                          </div>
                          <Unlock className="w-4 h-4 text-green-400" />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>

              {/* Tier 2: Mythical - Godlike */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 border-2 border-purple-500/50 rounded-xl p-4 shadow-lg shadow-purple-500/30"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Crown className="w-5 h-5 text-purple-400" />
                  <h4 className="text-lg font-bold text-purple-400">TIER 2: Limited Legendaries</h4>
                </div>
                <p className="text-xs text-slate-400 mb-3">Ultra-rare • Limited quantities</p>
                <div className="space-y-2">
                  {achievement.tier2.map((tier, index) => {
                    const tierStyle = RARITY_STYLES[tier.rarity];
                    const isGone = tier.remaining === 0;
                    const percentage = ((tier.remaining / tier.total) * 100).toFixed(0);
                    
                    return (
                      <motion.div 
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + index * 0.05 }}
                        className={`flex items-center justify-between p-3 rounded-lg ${tierStyle.bg} border-2 ${tierStyle.border} ${tierStyle.glow} ${isGone ? 'opacity-50' : 'hover:scale-[1.02]'} transition-all`}
                      >
                        <div className="flex items-center gap-3">
                          {isGone ? <Lock className="w-4 h-4 text-red-500" /> : <Unlock className="w-4 h-4 text-green-400" />}
                          <span className={`font-bold ${tierStyle.color}`}>{tier.rarity}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-xs text-slate-400">{tier.dropChance} chance</div>
                          <div className="text-right">
                            <div className={`text-sm font-bold ${isGone ? 'text-red-400' : 'text-yellow-400'}`}>
                              {tier.remaining} / {tier.total}
                            </div>
                            <div className="text-xs text-slate-400">Remaining</div>
                          </div>
                          {/* Progress bar */}
                          <div className="w-20 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ delay: 0.3 + index * 0.1, duration: 0.8 }}
                              className={`h-full ${isGone ? 'bg-red-500' : 'bg-gradient-to-r from-yellow-500 to-orange-500'}`}
                            />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>

              {/* Tier 3: Chosen */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, type: 'spring' }}
                className={`relative ${achievement.tier3.unlocked ? RARITY_STYLES.Chosen.bg : 'bg-gradient-to-br from-slate-800 to-slate-900'} border-2 ${achievement.tier3.unlocked ? 'border-white' : 'border-slate-600'} rounded-xl p-6 shadow-2xl ${achievement.tier3.unlocked ? 'shadow-white/50' : 'shadow-slate-900/50'} overflow-hidden`}
              >
                {/* Animated background stars for Chosen tier */}
                {achievement.tier3.unlocked && (
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {[...Array(20)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-white rounded-full"
                        style={{
                          left: `${Math.random() * 100}%`,
                          top: `${Math.random() * 100}%`,
                        }}
                        animate={{
                          scale: [0, 1, 0],
                          opacity: [0, 1, 0],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          delay: Math.random() * 2,
                        }}
                      />
                    ))}
                  </div>
                )}

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <motion.div
                        animate={achievement.tier3.unlocked ? {
                          rotate: [0, 360],
                          scale: [1, 1.2, 1],
                        } : {}}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "linear"
                        }}
                      >
                        <Star className={`w-8 h-8 ${achievement.tier3.unlocked ? 'text-yellow-300 drop-shadow-[0_0_10px_rgba(253,224,71,0.8)]' : 'text-slate-600'}`} />
                      </motion.div>
                      <h4 className={`text-xl font-black ${achievement.tier3.unlocked ? 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 'text-slate-500'}`}>
                        TIER 3: CHOSEN
                      </h4>
                    </div>
                    <Badge className={achievement.tier3.unlocked ? `${RARITY_STYLES.Chosen.bg} ${RARITY_STYLES.Chosen.color} border-2 ${RARITY_STYLES.Chosen.border}` : 'bg-slate-700 text-slate-400 border-slate-600'}>
                      {achievement.tier3.remaining} / {achievement.tier3.total}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h5 className={`text-lg font-bold ${achievement.tier3.unlocked ? 'text-yellow-300' : 'text-slate-400'}`}>
                        {achievement.tier3.name}
                      </h5>
                      <p className={`text-sm ${achievement.tier3.unlocked ? 'text-white/80' : 'text-slate-500'}`}>
                        {achievement.tier3.description}
                      </p>
                    </div>

                    <div className={`p-3 rounded-lg ${achievement.tier3.unlocked ? 'bg-white/10' : 'bg-slate-800/50'} border ${achievement.tier3.unlocked ? 'border-white/30' : 'border-slate-700'}`}>
                      <div className="flex items-start gap-2">
                        <Lock className={`w-4 h-4 mt-0.5 ${achievement.tier3.unlocked ? 'text-green-400' : 'text-red-400'}`} />
                        <div>
                          <div className="text-xs font-semibold text-slate-300 mb-1">Requirement:</div>
                          <div className={`text-sm ${achievement.tier3.unlocked ? 'text-green-300' : 'text-slate-400'}`}>
                            {achievement.tier3.requirement}
                          </div>
                        </div>
                      </div>
                    </div>

                    {achievement.tier3.unlocked && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/50 rounded-lg"
                      >
                        <Sparkles className="w-5 h-5 text-yellow-400" />
                        <span className="text-sm font-bold text-yellow-300">
                          CHOSEN ACHIEVEMENT UNLOCKED!
                        </span>
                        <Sparkles className="w-5 h-5 text-yellow-400" />
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default function RecentlyAchievedOverlay({ isVisible, onClose, gameTitle }) {
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [expandedAchievement, setExpandedAchievement] = useState(null);
  const ITEMS_PER_PAGE = 5;

  const handlePrev = () => {
    setCarouselIndex(Math.max(0, carouselIndex - 1));
  };

  const handleNext = () => {
    setCarouselIndex(Math.min(RECENTLY_DISCOVERED.length - ITEMS_PER_PAGE, carouselIndex + 1));
  };

  const visibleAchievements = RECENTLY_DISCOVERED.slice(carouselIndex, carouselIndex + ITEMS_PER_PAGE);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, type: 'spring', damping: 25 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-7xl max-h-[90vh] bg-slate-900 rounded-2xl border-2 border-blue-500/30 shadow-2xl shadow-blue-500/20 overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-700/50 bg-gradient-to-r from-blue-900/30 to-purple-900/30">
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8 text-blue-400" />
              <div>
                <h2 className="text-2xl font-black text-white">Recently Achieved</h2>
                <p className="text-sm text-slate-400">{gameTitle || 'All Games'}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* Section 1: Recently Discovered Achievements */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Sparkles className="w-6 h-6 text-yellow-400" />
                <h3 className="text-xl font-bold text-white">Recently Discovered Achievements</h3>
              </div>

              {/* Carousel */}
              <div className="relative">
                <div className="flex items-start gap-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handlePrev}
                    disabled={carouselIndex === 0}
                    className="flex-shrink-0 h-12 w-12 bg-slate-800/50 hover:bg-slate-700 disabled:opacity-30 mt-20"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </Button>

                  <div className="flex-1 overflow-hidden">
                    <div className="flex gap-4">
                      {visibleAchievements.map(ach => (
                        <AchievementCard
                          key={ach.id}
                          achievement={ach}
                          isExpanded={expandedAchievement === ach.id}
                          onClick={() => setExpandedAchievement(expandedAchievement === ach.id ? null : ach.id)}
                        />
                      ))}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleNext}
                    disabled={carouselIndex >= RECENTLY_DISCOVERED.length - ITEMS_PER_PAGE}
                    className="flex-shrink-0 h-12 w-12 bg-slate-800/50 hover:bg-slate-700 disabled:opacity-30 mt-20"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </Button>
                </div>

                {/* Page indicator */}
                <div className="flex justify-center gap-2 mt-6">
                  {Array.from({ length: Math.ceil(RECENTLY_DISCOVERED.length / ITEMS_PER_PAGE) }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCarouselIndex(i)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        Math.floor(carouselIndex / ITEMS_PER_PAGE) === i
                          ? 'bg-blue-500 w-8'
                          : 'bg-slate-600 hover:bg-slate-500'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Separator Line */}
            <div className="h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent" />

            {/* Section 2: Recently Acquired by Players */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Crown className="w-6 h-6 text-purple-400" />
                <h3 className="text-xl font-bold text-white">Recently Acquired by Players</h3>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                {RECENT_ACQUISITIONS.map((acquisition, index) => {
                  const rarity = RARITY_STYLES[acquisition.rarity];
                  
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex items-center justify-between p-4 rounded-lg ${rarity.bg} border ${rarity.border} ${rarity.glow} hover:scale-[1.02] transition-all duration-200`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border-2 border-slate-600">
                          <span className="text-xs font-bold text-white">
                            {acquisition.player.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-white text-sm">{acquisition.player}</p>
                          <p className="text-xs text-slate-400">{acquisition.timestamp}</p>
                        </div>
                      </div>

                      <div className="flex-1 text-center">
                        <p className="font-medium text-white text-sm">{acquisition.achievement}</p>
                      </div>

                      <div className="flex-shrink-0">
                        <Badge className={`${rarity.bg} ${rarity.color} border-2 ${rarity.border} px-3 py-1 font-bold`}>
                          {acquisition.rarity}
                        </Badge>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}