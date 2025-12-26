import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, RotateCcw, Sparkles, Star, Zap, Shield, Sword } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const ASCENSION_LEVELS = [
  { level: 1, bonus: '+10% Base Stats', perk: 'Critical Chance +5%', color: 'rgba(192, 192, 192, 0.8)', name: 'Silver' },
  { level: 2, bonus: '+20% Base Stats', perk: 'Attack Speed +10%', color: 'rgba(255, 215, 0, 0.8)', name: 'Gold' },
  { level: 3, bonus: '+30% Base Stats', perk: 'Life Steal +5%', color: 'rgba(0, 191, 255, 0.8)', name: 'Diamond' },
  { level: 4, bonus: '+40% Base Stats', perk: 'Cooldown -15%', color: 'rgba(138, 43, 226, 0.8)', name: 'Void' },
  { level: 5, bonus: '+50% Base Stats', perk: 'Unique Ability Unlocked', color: 'rgba(255, 105, 180, 0.8)', name: 'Celestial' },
];

const rarityGlowColors = {
  Common: 'rgba(148, 163, 184, 0.8)',
  Uncommon: 'rgba(34, 197, 94, 0.8)',
  Rare: 'rgba(59, 130, 246, 0.8)',
  Epic: 'rgba(168, 85, 247, 0.8)',
  Legendary: 'rgba(249, 115, 22, 0.8)',
  Mythic: 'rgba(239, 68, 68, 0.8)',
};

const StarDustParticle = ({ delay, ascensionColor }) => (
  <motion.div
    className="absolute w-1 h-1 rounded-full"
    style={{ 
      background: ascensionColor,
      boxShadow: `0 0 6px ${ascensionColor}, 0 0 12px ${ascensionColor}`
    }}
    initial={{ 
      x: Math.random() * 260 - 130,
      y: Math.random() * 350 - 175,
      opacity: 0,
      scale: 0
    }}
    animate={{ 
      x: [null, Math.random() * 40 - 20],
      y: [null, Math.random() * -60 - 20],
      opacity: [0, 1, 0.8, 0],
      scale: [0, 1.5, 1, 0]
    }}
    transition={{ 
      duration: 3,
      delay: delay,
      repeat: Infinity,
      ease: "easeInOut"
    }}
  />
);

export default function AscendPanel({ item, onAscend, userScore = 0 }) {
  const [currentAscension, setCurrentAscension] = useState(item?.evolution_stage || 0);
  const [isAscending, setIsAscending] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const baseGlowColor = rarityGlowColors[item?.rarity] || rarityGlowColors.Common;
  const ascensionData = ASCENSION_LEVELS[currentAscension] || null;
  const nextAscensionData = ASCENSION_LEVELS[currentAscension] || ASCENSION_LEVELS[0];
  const ascensionColor = ascensionData?.color || baseGlowColor;

  // Milestone requirement (example: 1000 score per tier)
  const scoreRequirement = (currentAscension + 1) * 1000;
  const canAscend = userScore >= scoreRequirement;

  const handleAscend = async () => {
    if (currentAscension >= 5 || !canAscend) return;
    
    setIsAscending(true);
    setShowConfirm(false);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setCurrentAscension(prev => prev + 1);
    
    if (onAscend) {
      onAscend(item, currentAscension + 1);
    }
    
    setIsAscending(false);
  };

  if (!item) {
    return (
      <div className="flex items-center justify-center h-full text-white/40">
        <p>Select a card to ascend</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center justify-center gap-16 w-full h-full"
    >
      {/* Card Display with Ascension Effects */}
      <div className="relative">
        {/* Outer Glow Ring for Ascended Cards */}
        {currentAscension > 0 && (
          <motion.div
            className="absolute -inset-8 rounded-3xl pointer-events-none"
            style={{
              background: `radial-gradient(circle, ${ascensionColor.replace('0.8', '0.2')} 0%, transparent 70%)`
            }}
            animate={{
              scale: [1, 1.05, 1],
              opacity: [0.5, 0.8, 0.5]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        )}

        {/* Card Container */}
        <motion.div 
          className="relative w-[280px] aspect-[2.5/3.5] rounded-2xl overflow-hidden border-2"
          style={{
            borderColor: currentAscension > 0 ? ascensionColor : 'rgba(255,255,255,0.3)'
          }}
          animate={{
            boxShadow: isAscending 
              ? [`0 0 60px ${nextAscensionData.color}`, `0 0 120px ${nextAscensionData.color}`, `0 0 60px ${nextAscensionData.color}`]
              : currentAscension > 0 
                ? `0 0 40px ${ascensionColor}, 0 0 80px ${ascensionColor.replace('0.8', '0.3')}`
                : `0 0 30px ${baseGlowColor}`
          }}
          transition={{ duration: 0.5, repeat: isAscending ? Infinity : 0 }}
        >
          {/* Card Image */}
          <img 
            src={item.preview_image_url} 
            alt={item.name} 
            className="w-full h-full object-cover"
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          {/* Starlight Dust Animation for Ascended Cards */}
          {currentAscension > 0 && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <StarDustParticle key={i} delay={i * 0.15} ascensionColor={ascensionColor} />
              ))}
            </div>
          )}
          
          {/* Ascension Glow Layer */}
          {currentAscension > 0 && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `linear-gradient(135deg, transparent 30%, ${ascensionColor.replace('0.8', '0.15')} 50%, transparent 70%)`
              }}
              animate={{
                backgroundPosition: ['0% 0%', '100% 100%', '0% 0%']
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            />
          )}
          
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
            
            {/* Center - Level and Ascension Badge */}
            <div className="flex flex-col items-center gap-2">
              <div className="bg-black/70 backdrop-blur-sm px-5 py-2 rounded-full border border-white/30">
                <span className="text-white/60 text-sm">LVL</span>
                <span className="text-white font-black text-2xl ml-2">{item.level || 1}</span>
              </div>
              
              {currentAscension > 0 && (
                <motion.div 
                  className="flex items-center gap-1 px-3 py-1 rounded-full"
                  style={{ 
                    background: `linear-gradient(135deg, ${ascensionColor.replace('0.8', '0.4')}, ${ascensionColor.replace('0.8', '0.2')})`,
                    border: `1px solid ${ascensionColor}`
                  }}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {[...Array(currentAscension)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 text-white fill-white" />
                  ))}
                  <span className="text-white text-xs font-bold ml-1">{ascensionData?.name}</span>
                </motion.div>
              )}
            </div>
            
            {/* Bottom - Name */}
            <div>
              <h3 className="text-white font-bold text-lg leading-tight">{item.name}</h3>
              <p className="text-white/50 text-xs">{item.rarity}</p>
            </div>
          </div>
          
          {/* Ascending Animation */}
          <AnimatePresence>
            {isAscending && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center bg-black/50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  animate={{ 
                    rotate: 360,
                    scale: [1, 1.5, 1]
                  }}
                  transition={{ 
                    rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                    scale: { duration: 1, repeat: Infinity }
                  }}
                >
                  <Crown className="w-16 h-16" style={{ color: nextAscensionData.color }} />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Ascension Controls */}
      <div className="flex flex-col gap-6 max-w-sm">
        <div>
          <h3 className="text-white font-bold text-2xl mb-2">Ascension</h3>
          <p className="text-white/50 text-sm">
            Reset card level to gain permanent stat bonuses and unique perks.
          </p>
        </div>

        {/* Current Ascension Status */}
        <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white/60 text-sm">Current Ascension</span>
            <div className="flex items-center gap-1">
              {currentAscension > 0 ? (
                <>
                  {[...Array(currentAscension)].map((_, i) => (
                    <Star key={i} className="w-4 h-4" style={{ color: ASCENSION_LEVELS[i].color, fill: ASCENSION_LEVELS[i].color }} />
                  ))}
                  {[...Array(5 - currentAscension)].map((_, i) => (
                    <Star key={i + currentAscension} className="w-4 h-4 text-white/20" />
                  ))}
                </>
              ) : (
                <span className="text-white/40 text-sm">Not Ascended</span>
              )}
            </div>
          </div>
          
          {currentAscension > 0 && ascensionData && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-white/80">{ascensionData.bonus}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Sparkles className="w-4 h-4" style={{ color: ascensionData.color }} />
                <span className="text-white/80">{ascensionData.perk}</span>
              </div>
            </div>
          )}
        </div>

        {/* Ascension Levels Preview */}
        <div className="space-y-2">
          <span className="text-white/60 text-sm">Ascension Tiers</span>
          <div className="space-y-1.5">
            {ASCENSION_LEVELS.map((asc, idx) => (
              <motion.div
                key={asc.level}
                className={`flex items-center gap-3 p-2 rounded-lg transition-all ${
                  idx < currentAscension 
                    ? 'bg-white/10 border border-white/20' 
                    : idx === currentAscension 
                      ? 'bg-white/5 border border-dashed border-white/30'
                      : 'bg-white/[0.02] border border-transparent'
                }`}
              >
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ 
                    background: idx <= currentAscension ? asc.color : 'rgba(255,255,255,0.1)',
                    boxShadow: idx < currentAscension ? `0 0 10px ${asc.color}` : 'none'
                  }}
                >
                  <Star className={`w-3 h-3 ${idx <= currentAscension ? 'text-white fill-white' : 'text-white/30'}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${idx < currentAscension ? 'text-white' : idx === currentAscension ? 'text-white/80' : 'text-white/40'}`}>
                      {asc.name}
                    </span>
                    {idx < currentAscension && (
                      <Badge className="text-[8px] px-1 py-0 h-4 bg-green-500/20 text-green-400 border-green-500/30">
                        UNLOCKED
                      </Badge>
                    )}
                    {idx === currentAscension && (
                      <Badge className="text-[8px] px-1 py-0 h-4 bg-amber-500/20 text-amber-400 border-amber-500/30">
                        NEXT
                      </Badge>
                    )}
                  </div>
                  <span className={`text-[10px] ${idx <= currentAscension ? 'text-white/60' : 'text-white/30'}`}>
                    {asc.bonus} • {asc.perk}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Warning */}
        {!showConfirm && currentAscension < 5 && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
            <div className="flex items-start gap-2">
              <RotateCcw className="w-4 h-4 text-amber-400 mt-0.5" />
              <div>
                <p className="text-amber-400 text-xs font-bold">Level Reset Warning</p>
                <p className="text-amber-400/70 text-xs">Ascending will reset your card to Level 1</p>
              </div>
            </div>
          </div>
        )}

        {/* Ascend Button */}
        {currentAscension >= 5 ? (
          <div className="text-center py-4">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/50"
            >
              <Crown className="w-5 h-5 text-pink-400" />
              <span className="text-pink-400 font-bold">MAX ASCENSION</span>
            </motion.div>
          </div>
        ) : showConfirm ? (
          <div className="flex gap-3">
            <Button
              onClick={() => setShowConfirm(false)}
              variant="outline"
              className="flex-1 h-12 border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAscend}
              disabled={isAscending}
              className="flex-1 h-12 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold"
            >
              {isAscending ? (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                  <Crown className="w-5 h-5" />
                </motion.div>
              ) : (
                <>Confirm Ascend</>
              )}
            </Button>
          </div>
        ) : (
          <Button
            onClick={() => setShowConfirm(true)}
            className="w-full h-14 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-lg rounded-xl"
          >
            <Crown className="w-5 h-5 mr-2" />
            Ascend to {nextAscensionData.name}
          </Button>
        )}
      </div>
    </motion.div>
  );
}