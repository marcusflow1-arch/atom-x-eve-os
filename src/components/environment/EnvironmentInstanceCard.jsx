import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Check, Star, Zap, Crown, Fingerprint } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { RARITY_CONFIG, RARITY_STYLES, xpForEnvRank, canImprint } from './envProgressionConfig';

export default function EnvironmentInstanceCard({ env, isActive, isSelected, onClick }) {
  const rarity = env.rarity || 'Common';
  const rs = RARITY_STYLES[rarity] || RARITY_STYLES.Common;
  const config = RARITY_CONFIG[rarity] || RARITY_CONFIG.Common;
  const rank = env.environment_rank || 1;
  const xp = env.environment_xp || 0;
  const xpNeeded = xpForEnvRank(rank);
  const xpPercent = Math.min(Math.round((xp / xpNeeded) * 100), 100);
  const isMaxRank = rank >= config.maxRank;
  const imprintEligible = canImprint(rarity, rank);
  const masteryCount = env.mastery_flags?.length || 0;

  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -4 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onClick?.(env)}
      className={`relative flex-shrink-0 w-56 rounded-xl overflow-hidden cursor-pointer border-2 transition-all group ${
        isSelected
          ? `${rs.border} ${rs.ring} ring-2 ring-offset-0 ${rs.glow}`
          : isActive
          ? `${rs.border} ring-1 ${rs.ring}`
          : 'border-white/10 hover:border-white/20'
      }`}
    >
      {/* Thumbnail */}
      <div className="relative h-32">
        <img
          src={env.thumbnail_url || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=80'}
          alt={env.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

        {/* Rarity Badge */}
        <div className="absolute top-2 left-2 z-10">
          <Badge className={`text-[9px] font-bold border ${rs.bg} ${rs.text} ${rs.border}`}>
            {rarity}
          </Badge>
        </div>

        {/* Active indicator */}
        {isActive && (
          <div className="absolute top-2 right-2 z-10 bg-cyan-500 text-black text-[8px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-lg shadow-cyan-500/30">
            <Check className="w-2.5 h-2.5" /> ACTIVE
          </div>
        )}

        {/* Soulbound indicator */}
        {config.soulbound && (
          <div className="absolute top-2 right-2 z-10" style={isActive ? { top: '2rem', right: '0.5rem' } : {}}>
            <div className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center" title="Soulbound">
              <Lock className="w-2.5 h-2.5 text-amber-400" />
            </div>
          </div>
        )}

        {/* Imprint eligible glow */}
        {imprintEligible && (
          <div className="absolute bottom-10 left-2 z-10">
            <Badge className="text-[8px] bg-red-500/20 text-red-300 border-red-500/30 flex items-center gap-1">
              <Fingerprint className="w-2.5 h-2.5" /> Imprint Ready
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 bg-black/40 backdrop-blur-sm">
        {/* Name + Rank */}
        <div className="flex items-center justify-between mb-1.5">
          <h4 className="text-white font-bold text-sm truncate flex-1">{env.name}</h4>
          <div className="flex items-center gap-1 flex-shrink-0 ml-2">
            <Crown className="w-3 h-3 text-amber-400" />
            <span className="text-white font-black text-xs">
              {rank}{isMaxRank ? ' MAX' : ''}
            </span>
          </div>
        </div>

        {/* Rank XP bar */}
        {!isMaxRank && (
          <div className="mb-1.5">
            <div className="flex justify-between text-[8px] mb-0.5">
              <span className="text-white/30">Rank {rank} → {rank + 1}</span>
              <span className="text-white/50 font-bold">{xpPercent}%</span>
            </div>
            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${
                  rarity === 'Mythical' ? 'from-red-500 to-pink-500' :
                  rarity === 'Legendary' ? 'from-amber-500 to-yellow-500' :
                  rarity === 'Epic' ? 'from-purple-500 to-indigo-500' :
                  rarity === 'Rare' ? 'from-blue-500 to-cyan-500' :
                  'from-slate-400 to-slate-500'
                }`}
                style={{ width: `${xpPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Bottom row: Mastery + Structures */}
        <div className="flex items-center justify-between text-[9px]">
          <div className="flex items-center gap-1 text-white/40">
            <Star className="w-3 h-3 text-yellow-400/60" />
            <span>{masteryCount} mastery</span>
          </div>
          <div className="flex items-center gap-1 text-white/40">
            <Zap className="w-3 h-3 text-cyan-400/60" />
            <span>{Object.values(env.structures || {}).filter(v => v > 0).length} structures</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}