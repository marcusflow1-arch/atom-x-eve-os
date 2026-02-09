import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Check, ShoppingBag, Hammer, Swords, Trophy, Crown, Sparkles, Shield, Layers, Award, Bot } from 'lucide-react';
import { GLOBAL_HUB_UNLOCKS } from './envProgressionConfig';

const ICON_MAP = { ShoppingBag, Hammer, Swords, Trophy, Crown, Sparkles, Shield, Layers, Award, Bot };

export default function FeatureUnlockGrid({ globalHubLevel, onFeatureClick }) {
  const unlockedCount = GLOBAL_HUB_UNLOCKS.filter(u => globalHubLevel >= u.level).length;

  return (
    <div>
      {/* Progress indicator */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all"
            style={{ width: `${(unlockedCount / GLOBAL_HUB_UNLOCKS.length) * 100}%` }}
          />
        </div>
        <span className="text-[10px] text-white/40 font-bold">{unlockedCount}/{GLOBAL_HUB_UNLOCKS.length}</span>
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        {GLOBAL_HUB_UNLOCKS.map((feature) => {
          const isUnlocked = globalHubLevel >= feature.level;
          const Icon = ICON_MAP[feature.icon] || Shield;

          return (
            <motion.div
              key={feature.featureId}
              whileHover={isUnlocked ? { scale: 1.01 } : {}}
              onClick={() => isUnlocked && onFeatureClick?.(feature)}
              className={`flex items-center gap-2.5 p-2.5 rounded-lg border transition-all ${
                isUnlocked
                  ? 'border-white/10 bg-white/[0.04] cursor-pointer hover:border-cyan-400/30 hover:bg-cyan-500/[0.04]'
                  : 'border-white/[0.04] bg-white/[0.01] opacity-35'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                isUnlocked ? 'bg-cyan-500/15 border border-cyan-500/25' : 'bg-white/[0.04] border border-white/[0.06]'
              }`}>
                {isUnlocked 
                  ? <Icon className="w-4 h-4 text-cyan-400" />
                  : <Lock className="w-3 h-3 text-white/25" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h5 className={`font-semibold text-[11px] ${isUnlocked ? 'text-white' : 'text-white/40'}`}>{feature.name}</h5>
                  {isUnlocked && <Check className="w-3 h-3 text-cyan-400/60" />}
                </div>
                <p className={`text-[8px] leading-tight ${isUnlocked ? 'text-white/35' : 'text-white/15'}`}>
                  {isUnlocked ? feature.description : `Unlocks at Level ${feature.level}`}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}