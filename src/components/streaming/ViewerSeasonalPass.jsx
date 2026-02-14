import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Zap, Star, Crown, Gift, Lock, Check, Shield, Sparkles, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import ShinyCard from '@/components/shared/ShinyCard';

// --- STYLES & CONFIG FROM GENREMASTERY ---
const rarityColors = {
  Common: { bg: 'bg-slate-700', border: 'border-slate-500', text: 'text-slate-300', glow: 'shadow-slate-500/50' },
  Rare: { bg: 'bg-blue-900', border: 'border-blue-500', text: 'text-blue-300', glow: 'shadow-blue-500/50' },
  Epic: { bg: 'bg-purple-900', border: 'border-purple-500', text: 'text-purple-300', glow: 'shadow-purple-500/50' },
  Legendary: { bg: 'bg-yellow-900', border: 'border-yellow-500', text: 'text-yellow-300', glow: 'shadow-yellow-500/50' },
  Mythical: { bg: 'bg-red-900', border: 'border-red-500', text: 'text-red-300', glow: 'shadow-red-500/50' },
  Godlike: { bg: 'bg-gradient-to-br from-purple-600 via-pink-600 to-yellow-600', border: 'border-pink-400', text: 'text-white', glow: 'shadow-pink-500/80' }
};

// Limited Edition Card Component (Migrated)
const LimitedEditionCard = ({ card, onClick, className }) => {
  const rarity = rarityColors[card.rarity] || rarityColors.Common;
  
  return (
    <ShinyCard
      onClick={() => onClick && onClick(card)}
      className={`relative rounded-xl overflow-hidden cursor-pointer shadow-2xl flex-shrink-0 ${className}`}
    >
      <div
        className="w-full h-full relative"
        style={{
          background: 'rgba(148, 163, 184, 0.06)',
          backdropFilter: 'blur(50px) saturate(200%)',
          WebkitBackdropFilter: 'blur(50px) saturate(200%)',
          border: '1px solid rgba(148, 163, 184, 0.15)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
        }}
      >
        <motion.div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
          }}
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 5, repeat: Infinity, repeatDelay: 4 }}
        />
        
        {/* Card Image */}
        {card.image ? (
            <img src={card.image} alt={card.name} className="w-full h-56 object-cover" />
        ) : (
            <div className="w-full h-56 bg-slate-800 flex items-center justify-center">
                <span className="text-4xl">{card.icon || '🎁'}</span>
            </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-center justify-between mb-1.5">
            <Badge className={`${rarity.bg} ${rarity.text} border-slate-600/40 backdrop-blur-md text-[10px] font-semibold px-2 py-0.5`}>
              {card.rarity}
            </Badge>
            <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30 backdrop-blur-md text-[10px] px-2 py-0.5">
              {card.type || 'Reward'}
            </Badge>
          </div>
          
          <h3 className="text-lg font-bold text-white mb-1 drop-shadow-lg">{card.name}</h3>
          <p className="text-xs text-white/85 line-clamp-2 drop-shadow">{card.description}</p>
          
          <div className="flex items-center gap-0.5 mt-2">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                className={`w-2.5 h-2.5 ${i < (card.rarity === 'Godlike' ? 5 : card.rarity === 'Mythical' ? 4 : card.rarity === 'Legendary' ? 3 : card.rarity === 'Epic' ? 2 : 1) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} 
              />
            ))}
          </div>
        </div>
      </div>
    </ShinyCard>
  );
};

// Reward Preview Modal
const RewardModal = ({ level, onClose }) => {
  if (!level) return null;
  const cardRarity = rarityColors[level.cardReward.rarity] || rarityColors.Common;
  const equipRarity = rarityColors[level.equipmentReward?.rarity] || rarityColors.Common;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-md z-[500] flex items-center justify-center p-8"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="max-w-5xl w-full relative flex flex-col md:flex-row items-start gap-8"
        style={{
          background: 'rgba(255, 255, 255, 0.02)',
          backdropFilter: 'blur(50px) saturate(180%)',
          WebkitBackdropFilter: 'blur(50px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '32px',
          padding: '48px',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.05)'
        }}
      >
        <button
            onClick={onClose}
            className="absolute -top-4 -right-4 md:-top-12 md:right-0 z-20 w-10 h-10 bg-white/5 hover:bg-white/20 border border-white/10 rounded-full flex items-center justify-center transition-colors"
          >
            <X className="w-6 h-6 text-white" />
        </button>

        {/* Left Side: Main Reward Card with Info Below */}
        <div className="flex-shrink-0 flex flex-col items-center gap-4 mx-auto md:mx-0">
          <LimitedEditionCard 
            card={level.cardReward} 
            onClick={null}
            className="w-64 h-80"
          />
          
          <div className="text-center">
            <Badge className={`${cardRarity.bg} ${cardRarity.text} border-white/10 mb-2 px-3 py-1 text-xs backdrop-blur-md shadow-lg`}>
              SEASON {level.season} • {level.cardReward.rarity.toUpperCase()}
            </Badge>
            <h2 className="text-3xl font-black text-white tracking-tight drop-shadow-md">{level.cardReward.name}</h2>
          </div>
        </div>

        {/* Right Side: Details & Bonus Equipment */}
        <div className="flex-1 flex flex-col gap-6 w-full">
          <div className="relative">
            <h3 className="text-xs font-bold text-white/50 mb-3 uppercase tracking-widest">Reward Details</h3>
            <p className="text-sm text-slate-200 mb-6 leading-relaxed font-medium">
              {level.cardReward.description} Unlocks permanent access to this item for all characters in the current season.
            </p>

            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-400" />
                  <span className="text-slate-300 text-sm">Item Type</span>
                </div>
                <span className="text-white font-bold text-sm">{level.cardReward.type}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span className="text-slate-300 text-sm">Power Score</span>
                </div>
                <span className="text-white font-bold text-sm">850</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-300 text-sm">Reward ID</span>
                </div>
                <span className="text-white font-bold text-sm font-mono">#{level.level.toString().padStart(4, '0')}</span>
              </div>
            </div>

            <Button 
              className={`w-full py-6 text-sm font-bold tracking-wide rounded-lg transition-all ${
                level.isUnlocked 
                  ? 'bg-white text-black hover:bg-slate-200' 
                  : 'bg-white/10 text-white/40 cursor-not-allowed hover:bg-white/10'
              }`}
            >
              {level.isUnlocked ? (
                <span className="flex items-center justify-center gap-2"><Check className="w-4 h-4" /> CLAIM REWARD</span>
              ) : (
                <span className="flex items-center justify-center gap-2"><Lock className="w-4 h-4" /> LOCKED (Lvl {level.level})</span>
              )}
            </Button>
          </div>
          
          {level.equipmentReward && (
            <div className="relative border-t border-white/10 pt-6">
                <h3 className="text-xs font-bold text-white/40 mb-3 uppercase tracking-widest flex items-center gap-2">
                <Shield className="w-3 h-3 text-blue-400" /> Bonus Equipment
                </h3>
                
                <div className="flex items-center gap-4">
                <div className="relative w-24 h-32 rounded-lg overflow-hidden border border-white/10 flex-shrink-0 bg-slate-800">
                    <img 
                    src={level.equipmentReward.image} 
                    alt={level.equipmentReward.name}
                    className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <Badge className={`absolute bottom-1 left-1 right-1 ${equipRarity.bg} ${equipRarity.text} text-[8px] px-1 py-0.5 justify-center`}>
                    {level.equipmentReward.rarity}
                    </Badge>
                </div>
                
                <div className="flex-1">
                    <h4 className="text-sm font-bold text-white mb-1">{level.equipmentReward.name}</h4>
                    <p className="text-xs text-slate-400 line-clamp-2">{level.equipmentReward.description}</p>
                </div>
                </div>
            </div>
          )}
        </div>

      </motion.div>
    </motion.div>
  );
};

// Level Node Component
const LevelNode = ({ levelData, onClick, isActive }) => {
  const { level, isUnlocked, cardReward } = levelData;
  const rarity = rarityColors[cardReward.rarity] || rarityColors.Common;
  const isElite = ['Legendary', 'Mythical', 'Godlike'].includes(cardReward.rarity);

  return (
    <motion.div
      onClick={() => onClick(levelData)}
      className={`relative flex-shrink-0 group cursor-pointer transition-all duration-500 ${
        isActive ? 'w-44 -translate-y-4' : 'w-28'
      }`}
    >
      <div className={`flex flex-col items-center gap-3 transition-all duration-300`}>
         
         <div className={`text-center transition-all duration-300 ${isActive ? 'opacity-100 scale-110' : 'opacity-40 group-hover:opacity-100'}`}>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
              Lvl {level}
            </div>
         </div>

         <div className={`
           relative rounded-2xl transition-all duration-300 flex items-center justify-center
           ${isActive 
             ? `w-32 h-32 bg-white/10 border-2 ${rarity.border} shadow-[0_0_30px_rgba(255,255,255,0.1)] z-20 backdrop-blur-md` 
             : `w-20 h-20 bg-white/5 border border-white/10 hover:bg-white/10 hover:w-24 hover:h-24 hover:border-white/30 z-10 backdrop-blur-sm`
           }
         `}
         style={{
            boxShadow: isActive ? `0 0 20px ${rarity.glow?.replace('shadow-', '') || 'rgba(255,255,255,0.2)'}` : 'none'
         }}
         >
            <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${rarity.bg} opacity-10`} />
            
            <div className={`relative w-full h-full p-2 flex items-center justify-center ${isUnlocked ? '' : 'grayscale opacity-30'}`}>
               {cardReward.image ? (
                   <img src={cardReward.image} alt="Reward" className="w-full h-full object-contain drop-shadow-lg" />
               ) : (
                   <span className="text-2xl">{cardReward.icon || '🎁'}</span>
               )}
            </div>
            
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
               {isUnlocked ? (
                 <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                    <Check className="w-3 h-3 text-black" />
                 </div>
               ) : (
                 <div className="w-4 h-4 rounded-full bg-black/50 border border-white/10 flex items-center justify-center backdrop-blur-md">
                   <Lock className="w-2.5 h-2.5 text-white/40" />
                 </div>
               )}
            </div>

            {isElite && isActive && (
               <div className="absolute -inset-4 bg-gradient-to-t from-white/20 to-transparent blur-xl -z-10 animate-pulse" />
            )}
         </div>
      </div>

    </motion.div>
  );
};

export default function ViewerSeasonalPass({ currentTier = 12, maxTier = 20 }) {
  const [viewingLevel, setViewingLevel] = useState(null);
  const scrollContainerRef = useRef(null);

  // Generate Levels Data
  const levels = Array.from({ length: maxTier }).map((_, i) => {
    const level = i + 1;
    const rarity = level % 10 === 0 ? 'Legendary' : level % 5 === 0 ? 'Epic' : level % 2 === 0 ? 'Rare' : 'Common';
    const isUnlocked = level <= currentTier;
    
    return {
      level,
      isUnlocked,
      season: 0,
      cardReward: {
        name: `Streamer Reward ${level}`,
        type: 'Viewer Reward',
        rarity,
        description: `Exclusive reward for reaching tier ${level} by watching the stream.`,
        image: `https://source.unsplash.com/random/500x500?fantasy,item&sig=${level}`,
        icon: '🎁'
      },
      equipmentReward: {
        name: `Bonus Gear ${level}`,
        type: 'Equipment',
        rarity: rarity,
        description: 'Bonus equipment drop.',
        image: `https://source.unsplash.com/random/300x300?armor&sig=${level}`
      }
    };
  });

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
    <React.Fragment>
    <div className="w-full bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl p-8 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
            <h3 className="text-2xl font-bold flex items-center gap-3 text-white">
                <Trophy className="w-6 h-6 text-blue-500" />
                Progression Track
            </h3>
            <p className="text-white/40 text-sm mt-1">Unlock rewards by watching and engaging with the stream</p>
        </div>

        <div className="flex items-center gap-4">
             <div className="px-4 py-2 bg-white/5 rounded-lg border border-white/10 text-center">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Current Tier</div>
                <div className="text-xl font-black text-white">{currentTier} / {maxTier}</div>
             </div>
             
             <div className="flex gap-2">
                <Button variant="ghost" size="icon" className="bg-white/5 hover:bg-white/10" onClick={() => scroll('left')}>
                    <ChevronLeft className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="bg-white/5 hover:bg-white/10" onClick={() => scroll('right')}>
                    <ChevronRight className="w-5 h-5" />
                </Button>
             </div>
        </div>
      </div>

      {/* Horizontal Scroll Track */}
      <div 
        ref={scrollContainerRef}
        className="relative flex items-center gap-4 overflow-x-auto pb-8 pt-4 px-4 rounded-xl scrollbar-hide snap-x"
        style={{ 
            scrollBehavior: 'smooth',
            background: 'rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        {/* Centered connecting line */}
        <div className="absolute left-0 right-0 h-[2px] bg-white/10 pointer-events-none" style={{ top: '50%' }} />
        {levels.map((level) => (
            <LevelNode 
                key={level.level}
                levelData={level} 
                isActive={level.level === currentTier}
                onClick={() => setViewingLevel(level)} 
            />
        ))}
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>

    {/* Reward Modal — rendered OUTSIDE the progression box for full-screen space */}
    <AnimatePresence>
      {viewingLevel && (
          <RewardModal level={viewingLevel} onClose={() => setViewingLevel(null)} />
      )}
    </AnimatePresence>
    </React.Fragment>
  );
}