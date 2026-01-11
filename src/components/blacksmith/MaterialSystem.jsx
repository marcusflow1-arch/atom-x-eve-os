import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

// Material definitions by genre
export const MATERIAL_DEFINITIONS = {
  // Action / Shooter Games
  action: {
    materials: ['precision_shard', 'combat_core'],
    bias: 'enhancement',
    colors: { primary: 'red', gradient: 'from-red-500 to-orange-500' }
  },
  shooter: {
    materials: ['precision_shard', 'combat_core'],
    bias: 'enhancement',
    colors: { primary: 'red', gradient: 'from-red-500 to-orange-500' }
  },
  // RPG / JRPG Games
  rpg: {
    materials: ['ascension_core', 'skill_catalyst'],
    bias: 'leveling',
    colors: { primary: 'purple', gradient: 'from-purple-500 to-violet-500' }
  },
  jrpg: {
    materials: ['ascension_core', 'skill_catalyst'],
    bias: 'leveling',
    colors: { primary: 'purple', gradient: 'from-purple-500 to-violet-500' }
  },
  // Strategy / Simulation Games
  strategy: {
    materials: ['resonance_fragment', 'efficiency_module'],
    bias: 'passive',
    colors: { primary: 'blue', gradient: 'from-blue-500 to-cyan-500' }
  },
  simulation: {
    materials: ['resonance_fragment', 'efficiency_module'],
    bias: 'passive',
    colors: { primary: 'blue', gradient: 'from-blue-500 to-cyan-500' }
  },
  // Adventure / Exploration Games
  adventure: {
    materials: ['discovery_relic', 'lore_catalyst'],
    bias: 'rarity',
    colors: { primary: 'emerald', gradient: 'from-emerald-500 to-teal-500' }
  },
  exploration: {
    materials: ['discovery_relic', 'lore_catalyst'],
    bias: 'rarity',
    colors: { primary: 'emerald', gradient: 'from-emerald-500 to-teal-500' }
  },
  // Multiplayer / Competitive Games
  multiplayer: {
    materials: ['fusion_currency', 'competitive_token'],
    bias: 'combination',
    colors: { primary: 'amber', gradient: 'from-amber-500 to-yellow-500' }
  },
  competitive: {
    materials: ['fusion_currency', 'competitive_token'],
    bias: 'combination',
    colors: { primary: 'amber', gradient: 'from-amber-500 to-yellow-500' }
  },
  // Indie / Experimental Games
  indie: {
    materials: ['wildcard', 'adaptive_shard'],
    bias: 'wildcard',
    colors: { primary: 'pink', gradient: 'from-pink-500 to-rose-500' }
  },
  experimental: {
    materials: ['wildcard', 'adaptive_shard'],
    bias: 'wildcard',
    colors: { primary: 'pink', gradient: 'from-pink-500 to-rose-500' }
  }
};

export const MATERIAL_INFO = {
  precision_shard: { name: 'Precision Shard', icon: '🎯', use: 'enhancement', desc: 'Amplifies attack stats' },
  combat_core: { name: 'Combat Core', icon: '⚔️', use: 'enhancement', desc: 'Boosts combat effectiveness' },
  ascension_core: { name: 'Ascension Core', icon: '👑', use: 'ascension', desc: 'Required for ascension' },
  skill_catalyst: { name: 'Skill Catalyst', icon: '✨', use: 'leveling', desc: 'Accelerates leveling' },
  resonance_fragment: { name: 'Resonance Fragment', icon: '💎', use: 'passive', desc: 'Account-wide bonuses' },
  efficiency_module: { name: 'Efficiency Module', icon: '⚙️', use: 'passive', desc: 'Passive stat boosts' },
  discovery_relic: { name: 'Discovery Relic', icon: '🗝️', use: 'rarity', desc: 'Unlocks rare modifiers' },
  lore_catalyst: { name: 'Lore Catalyst', icon: '📜', use: 'rarity', desc: 'Unique ability unlocks' },
  fusion_currency: { name: 'Fusion Currency', icon: '🔮', use: 'combination', desc: 'Powers card fusion' },
  competitive_token: { name: 'Competitive Token', icon: '🏆', use: 'combination', desc: 'Scales combination power' },
  wildcard: { name: 'Wildcard Material', icon: '🃏', use: 'wildcard', desc: 'Substitutes any material' },
  adaptive_shard: { name: 'Adaptive Shard', icon: '🌀', use: 'wildcard', desc: 'Flexible upgrade resource' }
};

// Calculate drop quality based on achievement difficulty
export const calculateDropQuality = (achievementRarity, masteryLevel = 1) => {
  const rarityMultiplier = {
    'Common': 1,
    'Uncommon': 1.5,
    'Rare': 2,
    'Epic': 3,
    'Legendary': 5,
    'Mythic': 7
  };
  return Math.min(5, Math.floor((rarityMultiplier[achievementRarity] || 1) * (1 + masteryLevel * 0.2)));
};

// Soft cap calculation for anti-farming
export const calculateDropEfficiency = (genreDropCount, totalDrops) => {
  const genreRatio = genreDropCount / Math.max(1, totalDrops);
  if (genreRatio > 0.5) return 0.5; // 50% efficiency if over-farming
  if (genreRatio > 0.35) return 0.75;
  return 1.0;
};

// Material Card Component
export function MaterialCard({ material, quantity, size = 'normal', onClick }) {
  const info = MATERIAL_INFO[material.type] || MATERIAL_INFO[material];
  const genreConfig = Object.values(MATERIAL_DEFINITIONS).find(g => 
    g.materials.includes(material.type || material)
  );
  
  const isSmall = size === 'small';
  
  return (
    <motion.div
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`relative rounded-xl overflow-hidden cursor-pointer transition-all ${
        isSmall ? 'p-2' : 'p-4'
      }`}
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}
    >
      {/* Genre color accent */}
      <div 
        className={`absolute inset-0 opacity-20 bg-gradient-to-br ${genreConfig?.colors.gradient || 'from-slate-500 to-slate-600'}`}
      />
      
      <div className="relative z-10 flex items-center gap-3">
        <span className={isSmall ? 'text-2xl' : 'text-3xl'}>{info?.icon || '❓'}</span>
        <div className="flex-1 min-w-0">
          <p className={`text-white font-semibold truncate ${isSmall ? 'text-xs' : 'text-sm'}`}>
            {info?.name || material.name}
          </p>
          {!isSmall && (
            <p className="text-white/50 text-xs truncate">{info?.desc}</p>
          )}
        </div>
        {quantity !== undefined && (
          <Badge className="bg-white/10 border-white/20 text-white">
            x{quantity}
          </Badge>
        )}
      </div>
      
      {/* Quality indicator */}
      {material.quality && (
        <div className="absolute top-1 right-1 flex gap-0.5">
          {Array.from({ length: material.quality }).map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
          ))}
        </div>
      )}
    </motion.div>
  );
}

// Material Grid for inventory display
export function MaterialInventory({ materials, onSelect }) {
  const groupedByUse = materials.reduce((acc, mat) => {
    const use = MATERIAL_INFO[mat.material_type]?.use || 'other';
    if (!acc[use]) acc[use] = [];
    acc[use].push(mat);
    return acc;
  }, {});

  const useLabels = {
    enhancement: 'Enhancement Materials',
    leveling: 'Leveling Materials',
    ascension: 'Ascension Materials',
    combination: 'Fusion Materials',
    passive: 'Passive Materials',
    rarity: 'Rarity Materials',
    wildcard: 'Wildcard Materials'
  };

  return (
    <div className="space-y-6">
      {Object.entries(groupedByUse).map(([use, mats]) => (
        <div key={use}>
          <h4 className="text-white/60 text-xs uppercase tracking-wider mb-3">
            {useLabels[use] || use}
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {mats.map((mat, i) => (
              <MaterialCard
                key={mat.id || i}
                material={mat.material_type}
                quantity={mat.quantity}
                size="small"
                onClick={() => onSelect?.(mat)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}