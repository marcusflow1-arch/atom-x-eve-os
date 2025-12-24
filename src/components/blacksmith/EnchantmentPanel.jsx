import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ENHANCEMENT_OPTIONS = [9, 12, 15, 20];

const rarityGlowColors = {
  Common: 'rgba(148, 163, 184, 0.8)',
  Uncommon: 'rgba(34, 197, 94, 0.8)',
  Rare: 'rgba(59, 130, 246, 0.8)',
  Epic: 'rgba(168, 85, 247, 0.8)',
  Legendary: 'rgba(249, 115, 22, 0.8)',
  Mythic: 'rgba(239, 68, 68, 0.8)',
};

export default function EnchantmentPanel({ item, onEnhance }) {
  const [selectedPercentage, setSelectedPercentage] = useState(9);
  const [currentEnhancement, setCurrentEnhancement] = useState(item?.enhancement_level || 0);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [glowHeight, setGlowHeight] = useState((currentEnhancement / 120) * 100);

  const glowColor = rarityGlowColors[item?.rarity] || rarityGlowColors.Common;

  useEffect(() => {
    setGlowHeight((currentEnhancement / 120) * 100);
  }, [currentEnhancement]);

  const handleEnhance = async () => {
    if (currentEnhancement >= 120) return;
    
    setIsEnhancing(true);
    
    // Simulate enhancement
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newLevel = Math.min(currentEnhancement + selectedPercentage, 120);
    setCurrentEnhancement(newLevel);
    
    if (onEnhance) {
      onEnhance(item, newLevel);
    }
    
    setIsEnhancing(false);
  };

  if (!item) {
    return (
      <div className="flex items-center justify-center h-full text-white/40">
        <p>Select a card to enchant</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center justify-center gap-16 w-full h-full"
    >
      {/* Card with Protective Encasing */}
      <div className="relative">
        {/* Translucent Protective Layer */}
        <div 
          className="absolute -inset-4 rounded-3xl"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.02) 100%)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.15)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
          }}
        />
        
        {/* Card Container */}
        <div className="relative w-[220px] aspect-[2.5/3.5] rounded-xl overflow-hidden border-2 border-white/20">
          {/* Card Image */}
          <img 
            src={item.preview_image_url} 
            alt={item.name} 
            className="w-full h-full object-cover"
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          {/* Enhancement Glow Effect - Rises from bottom */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 pointer-events-none"
            animate={{ height: `${glowHeight}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            style={{
              background: `linear-gradient(to top, ${glowColor}, transparent)`,
              filter: 'blur(8px)',
              opacity: 0.7
            }}
          />
          
          {/* Animated Border Glow */}
          <motion.div
            className="absolute inset-0 rounded-xl pointer-events-none"
            animate={{
              boxShadow: isEnhancing 
                ? [`inset 0 0 30px ${glowColor}`, `inset 0 0 60px ${glowColor}`, `inset 0 0 30px ${glowColor}`]
                : `inset 0 0 ${20 + (currentEnhancement / 120) * 30}px ${glowColor}`
            }}
            transition={{ duration: 0.5, repeat: isEnhancing ? Infinity : 0 }}
          />
          
          {/* Card Stats Overlay */}
          <div className="absolute inset-0 p-3 flex flex-col justify-between">
            {/* Top Row - Enhancement % and Combine Stage */}
            <div className="flex justify-between items-start">
              <div className="bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg border border-white/20">
                <span className="text-white/60 text-[10px]">CS</span>
                <span className="text-white font-bold text-sm ml-1">{item.combine_stage || 0}</span>
              </div>
              <div className="bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg border border-amber-500/50">
                <span className="text-amber-400 font-bold text-sm">{currentEnhancement}%</span>
              </div>
            </div>
            
            {/* Center - Level */}
            <div className="flex justify-center">
              <div className="bg-black/70 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30">
                <span className="text-white/60 text-xs">LVL</span>
                <span className="text-white font-black text-xl ml-2">{item.level || 1}</span>
              </div>
            </div>
            
            {/* Bottom - Name */}
            <div>
              <h3 className="text-white font-bold text-sm leading-tight">{item.name}</h3>
              <p className="text-white/50 text-xs">{item.rarity}</p>
            </div>
          </div>
          
          {/* Sparkle Particles when enhancing */}
          <AnimatePresence>
            {isEnhancing && (
              <>
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 rounded-full"
                    style={{ background: glowColor }}
                    initial={{ 
                      x: 110, 
                      y: 280,
                      opacity: 0,
                      scale: 0
                    }}
                    animate={{ 
                      x: Math.random() * 200 + 10,
                      y: Math.random() * -200,
                      opacity: [0, 1, 0],
                      scale: [0, 1.5, 0]
                    }}
                    transition={{ 
                      duration: 1,
                      delay: i * 0.1,
                      repeat: Infinity
                    }}
                  />
                ))}
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Enhancement Controls */}
      <div className="flex flex-col items-center gap-6">
        <h3 className="text-white font-bold text-lg">Enchant Card</h3>
        <p className="text-white/50 text-sm text-center max-w-[200px]">
          Select enhancement percentage and click Enchant
        </p>
        
        {/* Current Progress */}
        <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden border border-white/10">
          <motion.div 
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${glowColor}, ${glowColor.replace('0.8', '1')})` }}
            animate={{ width: `${(currentEnhancement / 120) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <p className="text-white/60 text-xs">{currentEnhancement}% / 120%</p>
        
        {/* Percentage Options */}
        <div className="flex gap-3">
          {ENHANCEMENT_OPTIONS.map((percent) => (
            <button
              key={percent}
              onClick={() => setSelectedPercentage(percent)}
              disabled={currentEnhancement >= 120}
              className={`w-14 h-14 rounded-xl border-2 transition-all flex flex-col items-center justify-center ${
                selectedPercentage === percent
                  ? 'border-purple-500 bg-purple-500/20 text-white'
                  : 'border-white/20 bg-white/5 text-white/60 hover:border-white/40 hover:bg-white/10'
              } ${currentEnhancement >= 120 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Plus className="w-3 h-3 mb-0.5" />
              <span className="font-bold text-sm">{percent}%</span>
            </button>
          ))}
        </div>

        {/* Enhance Button */}
        <Button
          onClick={handleEnhance}
          disabled={isEnhancing || currentEnhancement >= 120}
          className="w-full h-14 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-lg rounded-xl disabled:opacity-50"
        >
          {isEnhancing ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-6 h-6" />
            </motion.div>
          ) : currentEnhancement >= 120 ? (
            'MAX LEVEL'
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Enchant +{selectedPercentage}%
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}