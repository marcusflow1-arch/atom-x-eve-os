import React from 'react';
import { motion } from 'framer-motion';
import { Globe, ArrowUp, Zap, Shield, Star, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { GLOBAL_HUB_UNLOCKS, xpForGlobalLevel, RARITY_STYLES } from './envProgressionConfig';

export default function HubProgressionHeader({ hubProgression, environmentCount }) {
  const level = hubProgression?.global_hub_level || 1;
  const xp = hubProgression?.global_hub_xp || 0;
  const xpNeeded = xpForGlobalLevel(level);
  const xpPercent = Math.min(Math.round((xp / xpNeeded) * 100), 100);
  const unlockedFeatures = hubProgression?.unlocked_features?.length || 0;
  const totalFeatures = GLOBAL_HUB_UNLOCKS.length;
  const masteryCount = hubProgression?.mastery_badges?.length || 0;

  // Next feature unlock
  const nextUnlock = GLOBAL_HUB_UNLOCKS.find(u => u.level > level);

  return (
    <div className="space-y-4">
      {/* Top Row: Level ring + Stats */}
      <div className="flex items-center gap-5">
        {/* Level Ring */}
        <div className="relative flex-shrink-0">
          <div className="w-16 h-16 rounded-full border-2 border-cyan-400 flex items-center justify-center bg-cyan-500/10">
            <span className="text-cyan-300 font-black text-2xl">{level}</span>
          </div>
          <svg className="absolute inset-0 w-16 h-16 -rotate-90" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
            <circle cx="32" cy="32" r="28" fill="none" stroke="#22d3ee" strokeWidth="3"
              strokeDasharray={`${(xpPercent / 100) * 176} 176`} strokeLinecap="round" />
          </svg>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-900 border border-cyan-400/50 flex items-center justify-center">
            <Globe className="w-3 h-3 text-cyan-400" />
          </div>
        </div>

        {/* Stats */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-white font-bold text-base">Global Hub Level {level}</h4>
            <Badge className="text-[8px] bg-cyan-500/20 text-cyan-300 border-cyan-500/30">Account-Wide</Badge>
          </div>
          <div className="flex items-center gap-4 text-[10px] text-white/50 mb-2">
            <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-yellow-400" />{xp.toLocaleString()} / {xpNeeded.toLocaleString()} XP</span>
            <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-blue-400" />{unlockedFeatures}/{totalFeatures} Features</span>
            <span className="flex items-center gap-1"><Star className="w-3 h-3 text-purple-400" />{masteryCount} Mastery</span>
            <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3 text-emerald-400" />{environmentCount} Environments</span>
          </div>

          {/* XP Bar */}
          <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${xpPercent}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-full"
            />
          </div>

          {/* Next unlock */}
          {nextUnlock && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <ArrowUp className="w-3 h-3 text-emerald-400" />
              <span className="text-[10px] text-white/30">
                Next at Lv {nextUnlock.level}: <span className="text-white/60 font-medium">{nextUnlock.name}</span>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}