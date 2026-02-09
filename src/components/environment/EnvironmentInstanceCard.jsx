import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Check, Crown, Fingerprint } from 'lucide-react';
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
  const structureCount = Object.values(env.structures || {}).filter(v => v > 0).length;

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -3 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick?.(env)}
      className={`relative flex-shrink-0 w-48 rounded-xl overflow-hidden cursor-pointer border transition-all group ${
        isSelected ? `border-cyan-400 ${rs.glow}` :
        isActive ? `${rs.border}` :
        'border-white/8 hover:border-white/15'
      }`}
      style={{ background: 'rgba(255,255,255,0.03)' }}
    >
      {/* Thumbnail */}
      <div className="relative h-24">
        <img
          src={env.thumbnail_url || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=80'}
          alt={env.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Top badges row */}
        <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between z-10">
          <Badge className={`text-[8px] font-bold border px-1.5 py-0 ${rs.bg} ${rs.text} ${rs.border}`}>
            {rarity}
          </Badge>
          <div className="flex items-center gap-1">
            {config.soulbound && (
              <div className="w-4 h-4 rounded-full bg-black/50 border border-amber-500/40 flex items-center justify-center" title="Soulbound">
                <Lock className="w-2 h-2 text-amber-400" />
              </div>
            )}
            {isActive && (
              <div className="bg-cyan-500 text-black text-[7px] font-bold px-1.5 py-0 rounded-full flex items-center gap-0.5">
                <Check className="w-2 h-2" /> ON
              </div>
            )}
          </div>
        </div>

        {/* Imprint badge */}
        {imprintEligible && (
          <div className="absolute bottom-1.5 left-1.5 z-10">
            <Badge className="text-[7px] bg-red-500/20 text-red-300 border-red-500/30 px-1.5 py-0 flex items-center gap-0.5">
              <Fingerprint className="w-2 h-2" /> Imprint
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-2.5">
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-white font-semibold text-xs truncate flex-1">{env.name}</h4>
          <span className="text-[9px] text-white/50 font-mono flex-shrink-0 ml-1.5 flex items-center gap-0.5">
            <Crown className="w-2.5 h-2.5 text-amber-400/70" />
            {rank}{isMaxRank ? '★' : ''}
          </span>
        </div>

        {/* Rank progress bar */}
        <div className="h-1 bg-white/8 rounded-full overflow-hidden mb-1">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${
              rarity === 'Mythical' ? 'from-red-500 to-pink-500' :
              rarity === 'Legendary' ? 'from-amber-500 to-yellow-500' :
              rarity === 'Epic' ? 'from-purple-500 to-indigo-500' :
              rarity === 'Rare' ? 'from-blue-500 to-cyan-500' :
              'from-slate-400 to-slate-500'
            }`}
            style={{ width: isMaxRank ? '100%' : `${xpPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[8px] text-white/30">
          <span>{isMaxRank ? 'MAX' : `${xpPercent}% to Rank ${rank + 1}`}</span>
          <span>{structureCount} built</span>
        </div>
      </div>
    </motion.div>
  );
}