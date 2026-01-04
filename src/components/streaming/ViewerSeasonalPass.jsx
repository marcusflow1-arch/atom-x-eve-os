import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Zap, Star, Crown, Gift, Lock } from 'lucide-react';

const TIER_REWARDS = [
  { tier: 5, reward: 'Streamer Badge', icon: '🎖️', unlocked: true },
  { tier: 10, reward: '+10% XP Boost', icon: '⚡', unlocked: true, type: 'boost' },
  { tier: 15, reward: '+20% XP Boost', icon: '⚡⚡', unlocked: false, type: 'boost' },
  { tier: 20, reward: 'Legendary Card Drop', icon: '🎴', unlocked: false, type: 'card' },
  { tier: 25, reward: 'Exclusive Emote', icon: '😎', unlocked: false },
  { tier: 30, reward: '+30% XP Boost', icon: '⚡⚡⚡', unlocked: false, type: 'boost' },
];

export default function ViewerSeasonalPass({ currentTier = 12, maxTier = 30, streamerId }) {
  const progress = (currentTier / maxTier) * 100;

  return (
    <div className="bg-black/20 backdrop-blur-md border-t border-white/10 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
            <Crown className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">Viewer Seasonal Pass</h3>
            <p className="text-white/40 text-xs">Watch, engage, and earn exclusive rewards</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-black text-white">
            {currentTier}<span className="text-white/40 text-xl">/{maxTier}</span>
          </div>
          <p className="text-[10px] uppercase tracking-wider text-amber-400 font-bold">Current Tier</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-white/60">
          <span>Season Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/10">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          </motion.div>
        </div>
        <p className="text-white/40 text-xs">
          {maxTier - currentTier} tiers remaining • Watch time & engagement unlocks tiers
        </p>
      </div>

      {/* Rewards Showcase */}
      <div>
        <h4 className="text-white/60 text-xs font-bold uppercase tracking-wider mb-3">Upcoming Rewards</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {TIER_REWARDS.map((reward) => {
            const isUnlocked = reward.tier <= currentTier;
            const isNext = reward.tier > currentTier && reward.tier <= currentTier + 5;
            
            return (
              <motion.div
                key={reward.tier}
                whileHover={isNext ? { scale: 1.05 } : {}}
                className={`relative p-4 rounded-xl border transition-all ${
                  isUnlocked 
                    ? 'bg-amber-500/20 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]' 
                    : isNext
                    ? 'bg-white/5 border-cyan-400/40 shadow-[0_0_15px_rgba(34,211,238,0.2)]'
                    : 'bg-white/5 border-white/10 opacity-60'
                }`}
              >
                {!isUnlocked && (
                  <div className="absolute top-2 right-2">
                    <Lock className="w-3 h-3 text-white/30" />
                  </div>
                )}
                
                <div className="text-center space-y-2">
                  <div className="text-3xl">{reward.icon}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                    Tier {reward.tier}
                  </div>
                  <p className={`text-xs font-medium leading-tight ${
                    isUnlocked ? 'text-amber-300' : isNext ? 'text-cyan-300' : 'text-white/60'
                  }`}>
                    {reward.reward}
                  </p>
                  
                  {reward.type === 'boost' && isUnlocked && (
                    <div className="pt-2 border-t border-white/10">
                      <div className="flex items-center justify-center gap-1 text-[10px] text-green-400">
                        <Zap className="w-3 h-3" />
                        <span>ACTIVE</span>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Active Boosts Display */}
      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl">
        <Zap className="w-5 h-5 text-green-400" />
        <div className="flex-1">
          <p className="text-white font-bold text-sm">Active Viewer Boost</p>
          <p className="text-white/60 text-xs">+10% XP while watching this stream</p>
        </div>
        <div className="text-2xl font-black text-green-400">+10%</div>
      </div>
    </div>
  );
}