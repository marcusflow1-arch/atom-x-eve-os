import React from 'react';
import { motion } from 'framer-motion';
import { Lock, ChevronRight, ShoppingBag, Hammer, Swords, Trophy, Crown, Sparkles, Shield, Layers, Award, Bot } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { GLOBAL_HUB_UNLOCKS } from './envProgressionConfig';

const ICON_MAP = {
  ShoppingBag, Hammer, Swords, Trophy, Crown, Sparkles, Shield, Layers, Award, Bot,
};

export default function FeatureUnlockGrid({ globalHubLevel, onFeatureClick }) {
  const unlockedCount = GLOBAL_HUB_UNLOCKS.filter(u => globalHubLevel >= u.level).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <h4 className="text-white/50 text-[10px] font-bold uppercase tracking-widest">Global Feature Unlocks</h4>
        <span className="text-[10px] text-white/30">{unlockedCount}/{GLOBAL_HUB_UNLOCKS.length}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {GLOBAL_HUB_UNLOCKS.map((feature) => {
          const isUnlocked = globalHubLevel >= feature.level;
          const Icon = ICON_MAP[feature.icon] || Shield;

          return (
            <motion.div
              key={feature.featureId}
              whileHover={isUnlocked ? { scale: 1.02, y: -1 } : {}}
              onClick={() => isUnlocked && onFeatureClick?.(feature)}
              className={`relative p-3 rounded-xl border transition-all ${
                isUnlocked
                  ? 'border-white/15 bg-white/5 cursor-pointer hover:border-cyan-400/40 hover:bg-cyan-500/5'
                  : 'border-white/5 bg-white/[0.02] cursor-not-allowed opacity-40'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isUnlocked 
                    ? 'bg-cyan-500/20 border border-cyan-500/30' 
                    : 'bg-white/5 border border-white/10'
                }`}>
                  {isUnlocked 
                    ? <Icon className="w-4 h-4 text-cyan-400" /> 
                    : <Lock className="w-3.5 h-3.5 text-white/30" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h5 className={`font-bold text-xs ${isUnlocked ? 'text-white' : 'text-white/40'}`}>{feature.name}</h5>
                    {!isUnlocked && (
                      <Badge className="text-[7px] bg-white/5 border-white/10 text-white/40">Lv {feature.level}</Badge>
                    )}
                  </div>
                  <p className={`text-[9px] leading-tight mt-0.5 ${isUnlocked ? 'text-white/50' : 'text-white/20'}`}>
                    {feature.description}
                  </p>
                </div>
                {isUnlocked && <ChevronRight className="w-3.5 h-3.5 text-white/20 flex-shrink-0" />}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}