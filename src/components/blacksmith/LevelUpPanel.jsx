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

export default function LevelUpPanel({ item, onLevelUp, userEnergy = 0 }) {
  const [energyInput, setEnergyInput] = useState(50);
  const [currentLevel, setCurrentLevel] = useState(item?.level || 1);
  const [currentExp, setCurrentExp] = useState(item?.xp || 0);
  const [isLeveling, setIsLeveling] = useState(false);
  
  const maxLevel = 100;
  const expPerLevel = 100 * (currentLevel); // Scaling XP requirement

  const glowColor = rarityGlowColors[item?.rarity] || rarityGlowColors.Common;

  const xpGain = energyInput * 10; // 1 Energy = 10 XP (example rate)
  const canAfford = userEnergy >= energyInput;

  const handleFinalizeLevel = async () => {
    if (currentLevel >= maxLevel || !canAfford) return;
    
    setIsLeveling(true);
    
    // Simulate backend call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    let newExp = currentExp + xpGain;
    let newLevel = currentLevel;
    
    // Level up logic
    while (newExp >= expPerLevel && newLevel < maxLevel) {
      newExp -= expPerLevel;
      newLevel++;
    }
    
    setCurrentExp(newExp);
    setCurrentLevel(newLevel);
    
    if (onLevelUp) {
      onLevelUp(item, newLevel);
    }
    
    setIsLeveling(false);
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
      <div className="flex flex-col items-center gap-6 w-full max-w-md bg-white/5 p-6 rounded-2xl border border-white/10">
        
        {/* Energy Cost Selector */}
        <div className="w-full">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-bold text-cyan-300">Spend Energy</span>
            <span className="text-xs text-white/60">Balance: {userEnergy}</span>
          </div>
          
          <input 
            type="range" 
            min="10" 
            max={Math.max(10, Math.min(userEnergy, 500))} 
            step="10"
            value={energyInput}
            onChange={(e) => setEnergyInput(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
          
          <div className="flex justify-between mt-2 text-xs">
            <span className="text-white/40">10</span>
            <span className="text-cyan-400 font-bold">{energyInput} Energy</span>
            <span className="text-white/40">{Math.max(10, Math.min(userEnergy, 500))}</span>
          </div>
        </div>

        {/* Prediction Preview */}
        <div className="w-full bg-black/40 rounded-xl p-3 border border-white/5 flex items-center justify-between">
           <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-white/80">XP Gain</span>
           </div>
           <span className="text-lg font-bold text-green-400">+{xpGain} XP</span>
        </div>

        {/* Finalize Button */}
        <Button
          onClick={handleFinalizeLevel}
          disabled={isLeveling || currentLevel >= maxLevel || !canAfford}
          className={`w-full h-14 font-bold text-lg rounded-xl disabled:opacity-50 transition-all ${
            canAfford 
              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20' 
              : 'bg-slate-700 text-slate-400'
          }`}
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
          ) : !canAfford ? (
            'NOT ENOUGH ENERGY'
          ) : (
            <>
              <Zap className="w-5 h-5 mr-2 fill-current" />
              Finalize Level
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}