import React from 'react';
import { motion } from 'framer-motion';
import { X, Crown, Star, Zap, Lock, Fingerprint, Shield, Globe, TrendingUp, ShoppingBag, Hammer, Swords, Trophy, Sparkles, Layers } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { RARITY_CONFIG, RARITY_STYLES, GLOBAL_HUB_UNLOCKS, xpForEnvRank, canImprint, isFeatureUnlocked, MASTERY_FLAGS } from './envProgressionConfig';

const STRUCTURE_ICONS = { shop: ShoppingBag, blacksmith: Hammer, arena: Swords, trophy_room: Trophy, guild_hall: Crown, enchanting: Sparkles, vault: Shield, portal: Layers };

export default function EnvironmentDetailPanel({ env, globalHubLevel, onClose }) {
  if (!env) return null;

  const rarity = env.rarity || 'Common';
  const rs = RARITY_STYLES[rarity] || RARITY_STYLES.Common;
  const config = RARITY_CONFIG[rarity] || RARITY_CONFIG.Common;
  const rank = env.environment_rank || 1;
  const xp = env.environment_xp || 0;
  const xpNeeded = xpForEnvRank(rank);
  const xpPercent = Math.min(Math.round((xp / xpNeeded) * 100), 100);
  const isMaxRank = rank >= config.maxRank;
  const imprintEligible = canImprint(rarity, rank);
  const structures = env.structures || {};
  const masteryFlags = env.mastery_flags || [];

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className={`p-5 rounded-xl border ${rs.border} bg-white/[0.03]`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
              <img src={env.thumbnail_url || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=300&q=80'} alt="" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-white font-bold text-lg">{env.name}</h3>
                <Badge className={`text-[9px] font-bold border ${rs.bg} ${rs.text} ${rs.border}`}>{rarity}</Badge>
                {config.soulbound && (
                  <Badge className="text-[8px] bg-amber-500/20 text-amber-300 border-amber-500/30">
                    <Lock className="w-2 h-2 mr-0.5" /> Soulbound
                  </Badge>
                )}
              </div>
              <p className="text-white/40 text-xs">{env.description || 'Environment instance'}</p>
              <div className="flex items-center gap-3 mt-1.5 text-[10px] text-white/40">
                <span className="flex items-center gap-1"><Crown className="w-3 h-3 text-amber-400" />Rank {rank}/{config.maxRank}</span>
                <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-400" />{masteryFlags.length} Mastery</span>
                {imprintEligible && (
                  <span className="flex items-center gap-1 text-red-300"><Fingerprint className="w-3 h-3" />Imprint Ready</span>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center flex-shrink-0">
            <X className="w-3.5 h-3.5 text-white/60" />
          </button>
        </div>

        {/* Rank Progress */}
        <div className="mb-4 p-3 rounded-lg bg-white/[0.03] border border-white/5">
          <div className="flex items-center justify-between text-[10px] mb-1">
            <span className="text-white/40 font-medium">Environment Rank Progress</span>
            <span className="text-white/60 font-bold">{isMaxRank ? 'MAX RANK' : `${xp.toLocaleString()} / ${xpNeeded.toLocaleString()} XP`}</span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all bg-gradient-to-r ${
                rarity === 'Mythical' ? 'from-red-500 to-pink-500' :
                rarity === 'Legendary' ? 'from-amber-500 to-yellow-500' :
                rarity === 'Epic' ? 'from-purple-500 to-indigo-500' :
                rarity === 'Rare' ? 'from-blue-500 to-cyan-500' :
                'from-slate-400 to-slate-500'
              }`}
              style={{ width: isMaxRank ? '100%' : `${xpPercent}%` }}
            />
          </div>
          {!isMaxRank && (
            <p className="text-[9px] text-white/20 mt-1">
              XP Multiplier: <span className="text-white/40">{config.xpMultiplier}x</span> ({rarity})
            </p>
          )}
        </div>

        {/* Structures Grid */}
        <div className="mb-4">
          <h4 className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-2">Structures</h4>
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(STRUCTURE_ICONS).map(([key, Icon]) => {
              const level = structures[key] || 0;
              const globallyUnlocked = isFeatureUnlocked(key, globalHubLevel);
              const isBuilt = level > 0;

              return (
                <div
                  key={key}
                  className={`p-2 rounded-lg border text-center transition-all ${
                    !globallyUnlocked ? 'border-white/5 bg-white/[0.01] opacity-30' :
                    isBuilt ? 'border-cyan-500/30 bg-cyan-500/5' :
                    'border-white/10 bg-white/[0.03] hover:border-white/20'
                  }`}
                  title={!globallyUnlocked ? `Requires Hub Level ${GLOBAL_HUB_UNLOCKS.find(u => u.featureId === key)?.level}` : ''}
                >
                  {globallyUnlocked ? (
                    <Icon className={`w-4 h-4 mx-auto mb-1 ${isBuilt ? 'text-cyan-400' : 'text-white/30'}`} />
                  ) : (
                    <Lock className="w-3.5 h-3.5 mx-auto mb-1 text-white/20" />
                  )}
                  <p className="text-[8px] text-white/50 capitalize truncate">{key.replace('_', ' ')}</p>
                  {globallyUnlocked && <p className="text-[8px] text-white/30 font-bold">Lv {level}</p>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Mastery Flags */}
        {masteryFlags.length > 0 && (
          <div>
            <h4 className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-2">Mastery (Soulbound)</h4>
            <div className="flex flex-wrap gap-1.5">
              {masteryFlags.map(flag => {
                const m = MASTERY_FLAGS[flag];
                return (
                  <Badge key={flag} className="text-[8px] bg-purple-500/15 text-purple-300 border-purple-500/25">
                    {m?.label || flag} — {m?.description || ''}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        {/* Imprint Status */}
        {config.imprintable && (
          <div className={`mt-4 p-3 rounded-lg border ${imprintEligible ? 'border-red-500/30 bg-red-500/5' : 'border-white/5 bg-white/[0.02]'}`}>
            <div className="flex items-center gap-2 mb-1">
              <Fingerprint className={`w-4 h-4 ${imprintEligible ? 'text-red-400' : 'text-white/20'}`} />
              <span className={`text-xs font-bold ${imprintEligible ? 'text-red-300' : 'text-white/30'}`}>
                {imprintEligible ? 'Imprint Available' : `Imprint at Rank ${config.maxRank}`}
              </span>
            </div>
            <p className="text-[10px] text-white/30">
              {imprintEligible
                ? 'This environment can be forked and listed on the market. You keep the original.'
                : `Reach max rank (${config.maxRank}) to create a sellable imprint of this environment.`
              }
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}