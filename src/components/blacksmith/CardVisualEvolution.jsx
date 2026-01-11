import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Zap, Crown, Star, Flame } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Visual Evolution Tier Definitions
export const EVOLUTION_TIERS = {
  0: { name: 'Base', minLevel: 1, minAscension: 0, minStars: 1 },
  1: { name: 'Enhanced', minLevel: 5, minAscension: 0, minStars: 2 },
  2: { name: 'Awakened', minLevel: 10, minAscension: 1, minStars: 3 },
  3: { name: 'Ascended', minLevel: 15, minAscension: 2, minStars: 4 },
  4: { name: 'Transcendent', minLevel: 25, minAscension: 3, minStars: 5 },
  5: { name: 'Mythic', minLevel: 40, minAscension: 5, minStars: 5 },
};

// Calculate current evolution tier based on card stats
export function calculateEvolutionTier(card) {
  const level = card?.level || 1;
  const ascension = card?.ascension || 0;
  const stars = card?.stars || 1;
  
  let tier = 0;
  for (let t = 5; t >= 0; t--) {
    const req = EVOLUTION_TIERS[t];
    if (level >= req.minLevel && ascension >= req.minAscension && stars >= req.minStars) {
      tier = t;
      break;
    }
  }
  return tier;
}

// Get next tier requirements
export function getNextTierRequirements(currentTier) {
  const nextTier = Math.min(currentTier + 1, 5);
  return EVOLUTION_TIERS[nextTier];
}

// Tier-specific visual configurations
const TIER_VISUALS = {
  0: {
    borderGlow: 'none',
    frameGradient: 'from-slate-700 to-slate-800',
    particles: false,
    animation: 'none',
    frameStyle: 'basic'
  },
  1: {
    borderGlow: '0 0 15px rgba(59, 130, 246, 0.3)',
    frameGradient: 'from-blue-600/30 to-cyan-600/30',
    particles: false,
    animation: 'subtle-pulse',
    frameStyle: 'metallic'
  },
  2: {
    borderGlow: '0 0 25px rgba(168, 85, 247, 0.4)',
    frameGradient: 'from-purple-600/40 to-violet-600/40',
    particles: true,
    particleCount: 3,
    animation: 'glow-pulse',
    frameStyle: 'energy'
  },
  3: {
    borderGlow: '0 0 35px rgba(249, 115, 22, 0.5)',
    frameGradient: 'from-orange-500/50 to-amber-500/50',
    particles: true,
    particleCount: 5,
    animation: 'ascended-glow',
    frameStyle: 'golden'
  },
  4: {
    borderGlow: '0 0 50px rgba(236, 72, 153, 0.6)',
    frameGradient: 'from-pink-500/60 to-rose-500/60',
    particles: true,
    particleCount: 8,
    animation: 'transcendent-aura',
    frameStyle: 'crystalline'
  },
  5: {
    borderGlow: '0 0 60px rgba(255, 215, 0, 0.7), 0 0 100px rgba(255, 215, 0, 0.3)',
    frameGradient: 'from-yellow-400/70 via-amber-500/70 to-orange-500/70',
    particles: true,
    particleCount: 12,
    animation: 'mythic-aurora',
    frameStyle: 'divine'
  }
};

// Rarity visual modifiers
const RARITY_MODIFIERS = {
  Common: { intensityMod: 0.5, animationSpeed: 1, accentColor: 'slate' },
  Uncommon: { intensityMod: 0.7, animationSpeed: 1, accentColor: 'green' },
  Rare: { intensityMod: 0.85, animationSpeed: 1.2, accentColor: 'blue' },
  Epic: { intensityMod: 1, animationSpeed: 1.4, accentColor: 'purple' },
  Legendary: { intensityMod: 1.2, animationSpeed: 1.6, accentColor: 'orange' },
  Mythic: { intensityMod: 1.5, animationSpeed: 2, accentColor: 'rose' }
};

// Floating Particle Component
function FloatingParticle({ delay, tier, rarity }) {
  const colors = {
    0: 'bg-slate-400',
    1: 'bg-blue-400',
    2: 'bg-purple-400',
    3: 'bg-orange-400',
    4: 'bg-pink-400',
    5: 'bg-yellow-400'
  };

  return (
    <motion.div
      className={`absolute w-1.5 h-1.5 rounded-full ${colors[tier]} blur-[1px]`}
      initial={{ 
        x: Math.random() * 100 - 50, 
        y: 100,
        opacity: 0,
        scale: 0
      }}
      animate={{
        y: [-20, -80],
        x: [Math.random() * 40 - 20, Math.random() * 60 - 30],
        opacity: [0, 1, 0],
        scale: [0, 1, 0.5]
      }}
      transition={{
        duration: 2 + Math.random(),
        delay: delay,
        repeat: Infinity,
        repeatDelay: Math.random() * 2
      }}
      style={{ left: `${Math.random() * 100}%` }}
    />
  );
}

// Evolution Badge Component
export function EvolutionBadge({ tier, size = 'normal' }) {
  const tierInfo = EVOLUTION_TIERS[tier];
  const colors = {
    0: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    1: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    2: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    3: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    4: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
    5: 'bg-gradient-to-r from-yellow-500/30 to-amber-500/30 text-yellow-300 border-yellow-500/50'
  };

  const icons = {
    0: null,
    1: <Sparkles className="w-3 h-3" />,
    2: <Zap className="w-3 h-3" />,
    3: <Crown className="w-3 h-3" />,
    4: <Flame className="w-3 h-3" />,
    5: <Star className="w-3 h-3 fill-current" />
  };

  return (
    <Badge className={`${colors[tier]} border ${size === 'small' ? 'text-[9px] px-1.5 py-0' : 'text-xs px-2 py-0.5'} flex items-center gap-1`}>
      {icons[tier]}
      {tierInfo.name}
    </Badge>
  );
}

// Main Evolved Card Visual Component
export default function EvolvedCardVisual({ 
  card, 
  children, 
  size = 'normal',
  showTierBadge = true,
  interactive = true 
}) {
  const tier = calculateEvolutionTier(card);
  const visuals = TIER_VISUALS[tier];
  const rarityMod = RARITY_MODIFIERS[card?.rarity] || RARITY_MODIFIERS.Common;
  
  const isSmall = size === 'small';

  // Animation variants based on tier
  const getAnimation = () => {
    switch (visuals.animation) {
      case 'subtle-pulse':
        return {
          boxShadow: [visuals.borderGlow, visuals.borderGlow.replace('0.3', '0.5'), visuals.borderGlow]
        };
      case 'glow-pulse':
        return {
          boxShadow: [visuals.borderGlow, visuals.borderGlow.replace('0.4', '0.7'), visuals.borderGlow]
        };
      case 'ascended-glow':
        return {
          boxShadow: [
            visuals.borderGlow,
            visuals.borderGlow.replace('0.5', '0.8'),
            visuals.borderGlow
          ],
          filter: ['brightness(1)', 'brightness(1.1)', 'brightness(1)']
        };
      case 'transcendent-aura':
        return {
          boxShadow: [
            visuals.borderGlow,
            `0 0 60px rgba(236, 72, 153, 0.8), 0 0 30px rgba(168, 85, 247, 0.4)`,
            visuals.borderGlow
          ]
        };
      case 'mythic-aurora':
        return {
          boxShadow: [
            visuals.borderGlow,
            `0 0 80px rgba(255, 215, 0, 0.9), 0 0 120px rgba(255, 165, 0, 0.5)`,
            `0 0 60px rgba(255, 215, 0, 0.7), 0 0 100px rgba(255, 140, 0, 0.4)`,
            visuals.borderGlow
          ]
        };
      default:
        return {};
    }
  };

  return (
    <motion.div
      className={`relative ${isSmall ? 'rounded-lg' : 'rounded-2xl'} overflow-visible`}
      whileHover={interactive ? { scale: 1.02 } : {}}
    >
      {/* Tier-based outer glow layer */}
      {tier > 0 && (
        <motion.div
          className={`absolute -inset-1 ${isSmall ? 'rounded-lg' : 'rounded-2xl'} bg-gradient-to-br ${visuals.frameGradient} opacity-60`}
          animate={getAnimation()}
          transition={{ duration: 2 / rarityMod.animationSpeed, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* Animated border for higher tiers */}
      {tier >= 3 && (
        <motion.div
          className={`absolute -inset-0.5 ${isSmall ? 'rounded-lg' : 'rounded-2xl'}`}
          style={{
            background: tier === 5 
              ? 'linear-gradient(90deg, #ffd700, #ff8c00, #ff6347, #ff8c00, #ffd700)'
              : tier === 4
                ? 'linear-gradient(90deg, #ec4899, #8b5cf6, #ec4899)'
                : 'linear-gradient(90deg, #f97316, #eab308, #f97316)',
            backgroundSize: '200% 100%'
          }}
          animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
          transition={{ duration: 3 / rarityMod.animationSpeed, repeat: Infinity, ease: 'linear' }}
        />
      )}

      {/* Main card container */}
      <div className={`relative ${isSmall ? 'rounded-lg' : 'rounded-xl'} overflow-hidden bg-slate-900`}>
        {/* Particle effects for tier 2+ */}
        {visuals.particles && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
            {Array.from({ length: visuals.particleCount }).map((_, i) => (
              <FloatingParticle key={i} delay={i * 0.3} tier={tier} rarity={card?.rarity} />
            ))}
          </div>
        )}

        {/* Frame overlay based on tier */}
        {tier >= 2 && (
          <div className={`absolute inset-0 pointer-events-none z-10 ${
            tier === 5 ? 'bg-gradient-to-t from-yellow-500/20 via-transparent to-yellow-500/10' :
            tier === 4 ? 'bg-gradient-to-t from-pink-500/15 via-transparent to-purple-500/10' :
            tier === 3 ? 'bg-gradient-to-t from-orange-500/15 via-transparent to-amber-500/10' :
            'bg-gradient-to-t from-purple-500/10 via-transparent to-transparent'
          }`} />
        )}

        {/* Card content */}
        {children}

        {/* Tier badge overlay */}
        {showTierBadge && tier > 0 && (
          <div className={`absolute ${isSmall ? 'top-1 left-1' : 'top-2 left-2'} z-30`}>
            <EvolutionBadge tier={tier} size={isSmall ? 'small' : 'normal'} />
          </div>
        )}

        {/* Mythic unique shimmer effect */}
        {tier === 5 && (
          <motion.div
            className="absolute inset-0 pointer-events-none z-15"
            style={{
              background: 'linear-gradient(45deg, transparent 30%, rgba(255,215,0,0.15) 50%, transparent 70%)',
              backgroundSize: '200% 200%'
            }}
            animate={{ backgroundPosition: ['200% 200%', '-100% -100%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          />
        )}
      </div>
    </motion.div>
  );
}

// Evolution Preview Component for Blacksmith
export function EvolutionPreview({ card, nextTier }) {
  const currentTier = calculateEvolutionTier(card);
  const currentVisuals = TIER_VISUALS[currentTier];
  const nextVisuals = TIER_VISUALS[nextTier] || TIER_VISUALS[Math.min(currentTier + 1, 5)];
  const nextTierInfo = EVOLUTION_TIERS[nextTier] || EVOLUTION_TIERS[Math.min(currentTier + 1, 5)];

  return (
    <div className="p-4 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10">
      <h4 className="text-white/60 text-xs uppercase tracking-wider mb-3">Next Evolution Preview</h4>
      
      <div className="flex items-center gap-4">
        {/* Current */}
        <div className="flex-1 text-center">
          <EvolutionBadge tier={currentTier} />
          <p className="text-white/40 text-xs mt-2">Current</p>
        </div>

        {/* Arrow */}
        <div className="text-white/30">→</div>

        {/* Next */}
        <div className="flex-1 text-center">
          <EvolutionBadge tier={Math.min(currentTier + 1, 5)} />
          <p className="text-white/40 text-xs mt-2">Next</p>
        </div>
      </div>

      {/* Requirements */}
      <div className="mt-4 pt-3 border-t border-white/10 space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-white/50">Required Level</span>
          <span className={card.level >= nextTierInfo.minLevel ? 'text-green-400' : 'text-white/70'}>
            {nextTierInfo.minLevel}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/50">Required Ascension</span>
          <span className={(card.ascension || 0) >= nextTierInfo.minAscension ? 'text-green-400' : 'text-white/70'}>
            A{nextTierInfo.minAscension}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/50">Required Stars</span>
          <span className={(card.stars || 1) >= nextTierInfo.minStars ? 'text-green-400' : 'text-white/70'}>
            {nextTierInfo.minStars}★
          </span>
        </div>
      </div>

      {/* Visual upgrades preview */}
      <div className="mt-3 pt-3 border-t border-white/10">
        <p className="text-white/40 text-xs mb-2">Unlocks:</p>
        <div className="flex flex-wrap gap-1">
          {nextVisuals.particles && !currentVisuals.particles && (
            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-[10px]">
              Particles
            </Badge>
          )}
          {nextVisuals.frameStyle !== currentVisuals.frameStyle && (
            <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-[10px]">
              {nextVisuals.frameStyle} Frame
            </Badge>
          )}
          {nextVisuals.animation !== currentVisuals.animation && (
            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px]">
              New Animation
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}