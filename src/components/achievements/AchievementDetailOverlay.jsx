import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Star, Trophy, Package, Zap, Crown, Users, Target, Sparkles, ArrowRight, Clapperboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import AIAssistantPanel from './AIAssistantPanel';
import { Share2, Swords } from 'lucide-react';

const rarityStyles = {
  Common: { color: "text-slate-300", bg: "bg-slate-800/80", border: "border-slate-600", glow: "shadow-slate-500/20" },
  Uncommon: { color: "text-green-400", bg: "bg-green-900/80", border: "border-green-500/80", glow: "shadow-green-500/30" },
  Rare: { color: "text-blue-400", bg: "bg-blue-900/80", border: "border-blue-500/80", glow: "shadow-blue-500/30" },
  Epic: { color: "text-purple-400", bg: "bg-purple-900/80", border: "border-purple-500/80", glow: "shadow-purple-500/30" },
  Legendary: { color: "text-orange-400", bg: "bg-orange-900/80", border: "border-orange-500/80", glow: "shadow-orange-500/40" },
  Mythical: { color: "text-red-400", bg: "bg-red-900/80", border: "border-red-500/80", glow: "shadow-red-500/40" },
  Godlike: { color: "text-fuchsia-400", bg: "bg-fuchsia-900/80", border: "border-fuchsia-500/80", glow: "shadow-fuchsia-500/50" }
};

const categoryIcons = {
  standard: Trophy,
  ability: Zap,
  equipment: Package,
  companion: Users,
  emoji: Star,
  dance: Target,
  hidden: Crown
};

// Mock reward data (in real app, this comes from the achievement entity)
const getRewardData = (achievement) => {
  // Parse rewards based on achievement category and rarity
  const rewards = [];
  
  if (achievement.category === 'ability') {
    rewards.push({
      type: 'Ability',
      name: achievement.reward?.name || `${achievement.title} Power`,
      rarity: achievement.rarity,
      description: achievement.reward?.description || 'A powerful ability for your arsenal',
      icon: '⚡',
      stats: achievement.reward?.abilities || ['Damage: High', 'Cooldown: 10s']
    });
  }
  
  if (achievement.category === 'equipment') {
    rewards.push({
      type: 'Equipment',
      name: achievement.reward?.name || `${achievement.title} Gear`,
      rarity: achievement.rarity,
      description: achievement.reward?.description || 'Equipment to enhance your avatar',
      icon: '🛡️',
      stats: achievement.reward?.stats || { Attack: 50, Defense: 30, Speed: 10 }
    });
  }
  
  if (achievement.category === 'companion') {
    rewards.push({
      type: 'Companion',
      name: achievement.reward?.name || `${achievement.title} Companion`,
      rarity: achievement.rarity,
      description: achievement.reward?.description || 'A loyal companion to aid you',
      icon: '🐺',
      stats: ['Loyalty: 100%', 'Power Bonus: +15%']
    });
  }
  
  // Always include XP
  rewards.push({
    type: 'Experience',
    name: `${achievement.points} XP`,
    icon: '⭐',
    description: 'Experience points to level up your avatar'
  });
  
  return rewards;
};

export default function AchievementDetailOverlay({ achievement, onClose, onTrack, isTracked, onShare, onChallenge }) {
  const [showCelebration, setShowCelebration] = useState(false);
  const [showMoment, setShowMoment] = useState(false);
  
  if (!achievement) return null;
  
  const rarity = rarityStyles[achievement.rarity] || rarityStyles.Common;
  const CategoryIcon = categoryIcons[achievement.category] || Trophy;
  const rewards = getRewardData(achievement);
  const isUnlocked = false; // This should come from user data

  const handleUnlock = () => {
    // Trigger unlock celebration
    setShowCelebration(true);
    setTimeout(() => {
      setShowCelebration(false);
      onClose();
    }, 3000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-4xl rounded-2xl border-2 ${rarity.border} ${rarity.bg} ${rarity.glow} shadow-2xl overflow-hidden`}
      >
        {/* Celebration Overlay */}
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1], rotate: [0, 360] }}
              transition={{ duration: 0.8 }}
              className="text-9xl mb-6"
            >
              {achievement.icon}
            </motion.div>
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className={`text-4xl font-black mb-4 ${rarity.color}`}
            >
              🎉 ACHIEVEMENT UNLOCKED! 🎉
            </motion.h2>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-2xl text-white mb-8"
            >
              {achievement.title}
            </motion.p>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-yellow-400 text-xl font-bold"
            >
              ✨ YOU RECEIVED ✨
            </motion.div>
          </motion.div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header Section */}
        <div className={`relative p-8 border-b-2 ${rarity.border}`}>
          {/* In-card Tutorial Icon Button */}
          <button
            onClick={() => setShowMoment(true)}
            className="absolute top-4 left-4 z-10 w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md flex items-center justify-center transition-all"
            title="View Unlock Moment"
          >
            <Clapperboard className="w-5 h-5 text-white" />
          </button>>
          <div className="flex items-start gap-6 relative">
            <div className={`text-7xl ${rarity.color}`}>{achievement.icon}</div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Badge className={`${rarity.bg} ${rarity.color} ${rarity.border} border text-sm px-3 py-1`}>
                  {achievement.rarity}
                </Badge>
                <Badge variant="outline" className="text-sm">
                  <CategoryIcon className="w-3 h-3 mr-1" />
                  {achievement.category}
                </Badge>
                <Badge variant="outline" className="text-sm">
                  From: {achievement.game}
                </Badge>
              </div>
              <h2 className={`text-3xl font-black mb-2 ${rarity.color}`}>{achievement.title}</h2>
              <p className="text-slate-300 text-lg">{achievement.description}</p>
            </div>
          </div>
        </div>

        {/* Unlock Moment Overlay */}
        {showMoment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex"
            style={{ background: 'rgba(0,0,0,0.8)' }}
          >
            {/* Left: Video */}
            <div className="w-full md:w-1/2 p-4 md:p-6 flex items-center justify-center" onClick={() => setShowMoment(false)}>
              <div className="w-full max-w-xl aspect-video rounded-xl overflow-hidden border border-white/10 bg-black">
                <video
                  src={achievement.unlock_video_url || 'https://www.w3schools.com/html/mov_bbb.mp4'}
                  controls
                  autoPlay
                  muted
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            {/* Right: Action Description */}
            <div className="hidden md:flex w-1/2 p-6 flex-col border-l border-white/10 bg-slate-950/60 backdrop-blur-md">
              <h3 className="text-white text-xl font-bold mb-2">How you unlocked it</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                {achievement.unlock_description || 'This achievement was unlocked during a clutch moment: you parried a boss strike, chained a 5-hit combo, and finished under 30% HP within 90 seconds.'}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-400">
                <div>
                  <div className="text-slate-500">Game</div>
                  <div className="text-white/90">{achievement.game}</div>
                </div>
                <div>
                  <div className="text-slate-500">Timestamp</div>
                  <div className="text-white/90">{achievement.unlocked_at || '—'}</div>
                </div>
                <div>
                  <div className="text-slate-500">Mode</div>
                  <div className="text-white/90">{achievement.mode || 'Story'}</div>
                </div>
                <div>
                  <div className="text-slate-500">Difficulty</div>
                  <div className="text-white/90">{achievement.difficulty || 'Normal'}</div>
                </div>
              </div>
              <button
                onClick={() => setShowMoment(false)}
                className="mt-auto self-end px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm"
              >Close</button>
            </div>
          </motion.div>
        )}

        {/* Rewards Section - THE STAR OF THE SHOW */}
        <div className="p-8 bg-slate-900/50">
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="w-6 h-6 text-yellow-400" />
            <h3 className="text-2xl font-bold text-white">Unlock Rewards</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {rewards.map((reward, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`${rarityStyles[reward.rarity]?.bg || 'bg-slate-800'} border-2 ${rarityStyles[reward.rarity]?.border || 'border-slate-700'} ${rarityStyles[reward.rarity]?.glow || ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="text-4xl">{reward.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`font-bold text-lg ${rarityStyles[reward.rarity]?.color || 'text-white'}`}>
                            {reward.name}
                          </span>
                          {reward.rarity && (
                            <Badge className={`text-xs ${rarityStyles[reward.rarity]?.bg} ${rarityStyles[reward.rarity]?.color}`}>
                              {reward.rarity}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-400 mb-3">{reward.description}</p>
                        
                        {/* Stats */}
                        {reward.stats && (
                          <div className="space-y-1">
                            {Array.isArray(reward.stats) ? (
                              reward.stats.map((stat, i) => (
                                <div key={i} className="text-xs text-slate-300 flex items-center gap-1">
                                  <ArrowRight className="w-3 h-3 text-green-400" />
                                  {stat}
                                </div>
                              ))
                            ) : (
                              Object.entries(reward.stats).map(([key, value]) => (
                                <div key={key} className="text-xs text-slate-300 flex items-center gap-1">
                                  <ArrowRight className="w-3 h-3 text-green-400" />
                                  {key}: +{value}
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Impact Summary */}
          <Card className="bg-blue-900/30 border-2 border-blue-500/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="text-3xl">💪</div>
                <div className="flex-1">
                  <h4 className="text-white font-bold mb-1">Your Avatar Will Gain:</h4>
                  <div className="flex gap-4 text-sm">
                    <span className="text-green-400">+{achievement.points} XP</span>
                    <span className="text-yellow-400">+{Math.floor(achievement.points / 10)} Power</span>
                    {rewards.length - 1 > 0 && (
                      <span className="text-purple-400">{rewards.length - 1} New {rewards.length - 1 === 1 ? 'Item' : 'Items'}</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* AI Assistant Integration */}
          <div className="mt-6">
            <AIAssistantPanel achievement={achievement} game={achievement.game} />
          </div>
        </div>

        {/* Progress Section (if not unlocked) */}
        {!isUnlocked && (
          <div className="p-6 bg-slate-900/70 border-t-2 border-slate-700">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-semibold">Progress to Unlock</span>
                <span className="text-slate-400 text-sm">65% Complete</span>
              </div>
              <Progress value={65} className="h-3" />
            </div>
            <p className="text-slate-400 text-sm mb-4">
              Keep playing {achievement.game} to unlock this achievement and claim your rewards!
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="p-6 bg-slate-900 border-t-2 border-slate-700 flex justify-between items-center">
          <div className="text-slate-400 text-sm">
            <span className="font-semibold text-white">💡 Tip:</span> Unlocked items appear in your Arsenal and can be equipped or traded
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onShare(achievement)} className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10">
                <Share2 className="w-4 h-4 mr-2" /> Share
            </Button>
            <Button variant="outline" onClick={() => onChallenge(achievement)} className="border-orange-500/50 text-orange-400 hover:bg-orange-500/10">
                <Swords className="w-4 h-4 mr-2" /> Challenge
            </Button>
            {!isUnlocked && (
              <Button
                onClick={() => onTrack(achievement)}
                variant={isTracked ? "outline" : "default"}
                className={isTracked ? "border-blue-500 text-blue-400" : "bg-blue-600 hover:bg-blue-700"}
              >
                {isTracked ? '✓ Tracking' : 'Track Progress'}
              </Button>
            )}
            {isUnlocked && (
              <Button
                onClick={handleUnlock}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold px-8"
              >
                🎁 Claim Rewards
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}