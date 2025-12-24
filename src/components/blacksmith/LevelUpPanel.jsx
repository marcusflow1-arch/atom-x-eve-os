import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Plus, Minus, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

const EXP_OPTIONS = [25, 50, 100];

const rarityGlowColors = {
  Common: 'rgba(148, 163, 184, 0.8)',
  Uncommon: 'rgba(34, 197, 94, 0.8)',
  Rare: 'rgba(59, 130, 246, 0.8)',
  Epic: 'rgba(168, 85, 247, 0.8)',
  Legendary: 'rgba(249, 115, 22, 0.8)',
  Mythic: 'rgba(239, 68, 68, 0.8)',
};

export default function LevelUpPanel({ item, onLevelUp }) {
  const [selectedExpPercent, setSelectedExpPercent] = useState(25);
  const [expMultiplier, setExpMultiplier] = useState(1);
  const [currentLevel, setCurrentLevel] = useState(item?.level || 1);
  const [currentExp, setCurrentExp] = useState(0);
  const [isLeveling, setIsLeveling] = useState(false);
  const maxLevel = 20;
  const expPerLevel = 100;

  const glowColor = rarityGlowColors[item?.rarity] || rarityGlowColors.Common;

  const handleAddExp = async () => {
    if (currentLevel >= maxLevel) return;
    
    setIsLeveling(true);
    
    const expToAdd = (selectedExpPercent / 100) * expPerLevel * expMultiplier;
    let newExp = currentExp + expToAdd;
    let newLevel = currentLevel;
    
    // Level up logic
    while (newExp >= expPerLevel && newLevel < maxLevel) {
      newExp -= expPerLevel;
      newLevel++;
    }
    
    if (newLevel >= maxLevel) {
      newExp = expPerLevel;
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setCurrentExp(newExp);
    setCurrentLevel(newLevel);
    
    if (onLevelUp) {
      onLevelUp(item, newLevel);
    }
    
    setIsLeveling(false);
  };

  const handleAddOneLevel = () => {
    if (currentLevel >= maxLevel) return;
    setCurrentLevel(prev => Math.min(prev + 1, maxLevel));
    setCurrentExp(0);
  };

  const handleRemoveOneLevel = () => {
    if (currentLevel <= 1) return;
    setCurrentLevel(prev => Math.max(prev - 1, 1));
    setCurrentExp(0);
  };

  const handleMaxLevel = () => {
    setCurrentLevel(maxLevel);
    setCurrentExp(expPerLevel);
  };

  const handleIncrementMultiplier = () => {
    if (expMultiplier < 20) setExpMultiplier(prev => prev + 1);
  };

  const handleDecrementMultiplier = () => {
    if (expMultiplier > 1) setExpMultiplier(prev => prev - 1);
  };

  if (!item) {
    return (
      <div className="flex items-center justify-center h-full text-white/40">
        <p>Select a card to level up</p>
      </div>
    );
  }

  const expProgress = (currentExp / expPerLevel) * 100;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center gap-8 w-full h-full"
    >
      {/* Large Card Display */}
      <div className="relative">
        {/* Card Container */}
        <motion.div 
          className="relative w-[260px] aspect-[2.5/3.5] rounded-2xl overflow-hidden border-2 border-white/30"
          animate={{
            boxShadow: isLeveling 
              ? [`0 0 40px ${glowColor}`, `0 0 80px ${glowColor}`, `0 0 40px ${glowColor}`]
              : `0 0 30px ${glowColor}`
          }}
          transition={{ duration: 0.5, repeat: isLeveling ? Infinity : 0 }}
        >
          {/* Card Image */}
          <img 
            src={item.preview_image_url} 
            alt={item.name} 
            className="w-full h-full object-cover"
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          {/* Level Glow Effect */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(circle at center, ${glowColor.replace('0.8', '0.3')} 0%, transparent 70%)`
            }}
            animate={{
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          
          {/* Card Stats Overlay */}
          <div className="absolute inset-0 p-4 flex flex-col justify-between">
            {/* Top Row */}
            <div className="flex justify-between items-start">
              <div className="bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg border border-white/20">
                <span className="text-white/60 text-xs">CS</span>
                <span className="text-white font-bold text-sm ml-1">{item.combine_stage || 0}</span>
              </div>
              <div className="bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg border border-amber-500/50">
                <span className="text-amber-400 font-bold text-sm">{item.enhancement_level || 0}%</span>
              </div>
            </div>
            
            {/* Center - Level */}
            <div className="flex justify-center">
              <motion.div 
                className="bg-black/70 backdrop-blur-sm px-6 py-3 rounded-full border border-white/30"
                animate={isLeveling ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                <span className="text-white/60 text-sm">LVL</span>
                <span className="text-white font-black text-3xl ml-2">{currentLevel}</span>
              </motion.div>
            </div>
            
            {/* Bottom - Name and EXP Bar */}
            <div>
              <h3 className="text-white font-bold text-lg leading-tight mb-2">{item.name}</h3>
              <div className="w-full bg-black/50 rounded-full h-2 overflow-hidden border border-white/10">
                <motion.div 
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${glowColor}, ${glowColor.replace('0.8', '1')})` }}
                  animate={{ width: `${expProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="text-white/50 text-xs mt-1 text-center">{Math.floor(currentExp)} / {expPerLevel} EXP</p>
            </div>
          </div>
          
          {/* Level Up Particles */}
          <AnimatePresence>
            {isLeveling && (
              <>
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 rounded-full"
                    style={{ background: glowColor }}
                    initial={{ 
                      x: 130, 
                      y: 200,
                      opacity: 0,
                      scale: 0
                    }}
                    animate={{ 
                      x: Math.random() * 260,
                      y: Math.random() * -150,
                      opacity: [0, 1, 0],
                      scale: [0, 1.5, 0]
                    }}
                    transition={{ 
                      duration: 0.8,
                      delay: i * 0.05,
                    }}
                  />
                ))}
              </>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Controls Section */}
      <div className="flex flex-col items-center gap-6 w-full max-w-md">
        
        {/* EXP Percentage Options */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-white/50 text-sm">Select EXP Amount</p>
          <div className="flex gap-3">
            {EXP_OPTIONS.map((percent) => (
              <button
                key={percent}
                onClick={() => setSelectedExpPercent(percent)}
                disabled={currentLevel >= maxLevel}
                className={`w-16 h-12 rounded-xl border-2 transition-all flex items-center justify-center ${
                  selectedExpPercent === percent
                    ? 'border-cyan-500 bg-cyan-500/20 text-white'
                    : 'border-white/20 bg-white/5 text-white/60 hover:border-white/40 hover:bg-white/10'
                } ${currentLevel >= maxLevel ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span className="font-bold text-sm">{percent}%</span>
              </button>
            ))}
          </div>
        </div>

        {/* Multiplier and Level Controls */}
        <div className="flex items-center gap-8">
          {/* Multiplier */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleDecrementMultiplier}
              disabled={expMultiplier <= 1}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 flex items-center justify-center text-white transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <div className="text-center">
              <span className="text-white font-bold text-xl">x{expMultiplier}</span>
            </div>
            <button
              onClick={handleIncrementMultiplier}
              disabled={expMultiplier >= 20}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 flex items-center justify-center text-white transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Divider */}
          <div className="w-px h-10 bg-white/20" />

          {/* Level +/- */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleRemoveOneLevel}
              disabled={currentLevel <= 1}
              className="w-10 h-10 rounded-xl bg-red-500/20 hover:bg-red-500/30 disabled:opacity-30 flex items-center justify-center text-red-400 transition-colors border border-red-500/30"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-white/50 text-xs">LVL</span>
            <button
              onClick={handleAddOneLevel}
              disabled={currentLevel >= maxLevel}
              className="w-10 h-10 rounded-xl bg-green-500/20 hover:bg-green-500/30 disabled:opacity-30 flex items-center justify-center text-green-400 transition-colors border border-green-500/30"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Divider */}
          <div className="w-px h-10 bg-white/20" />

          {/* Max Level Button */}
          <button
            onClick={handleMaxLevel}
            disabled={currentLevel >= maxLevel}
            className={`px-4 py-2 rounded-xl border transition-all flex items-center gap-2 ${
              currentLevel >= maxLevel 
                ? 'border-amber-500/50 bg-amber-500/20 text-amber-400'
                : 'border-white/20 bg-white/5 text-white/60 hover:border-amber-500/50 hover:bg-amber-500/10 hover:text-amber-400'
            }`}
          >
            <Star className="w-4 h-4" />
            <span className="font-bold text-sm">{currentLevel >= maxLevel ? 'MAXED' : 'MAX'}</span>
          </button>
        </div>

        {/* Add EXP Button */}
        <Button
          onClick={handleAddExp}
          disabled={isLeveling || currentLevel >= maxLevel}
          className="w-full h-14 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-lg rounded-xl disabled:opacity-50"
        >
          {isLeveling ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Zap className="w-6 h-6" />
            </motion.div>
          ) : currentLevel >= maxLevel ? (
            'MAX LEVEL REACHED'
          ) : (
            <>
              <Zap className="w-5 h-5 mr-2" />
              Add EXP (+{selectedExpPercent * expMultiplier}%)
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}