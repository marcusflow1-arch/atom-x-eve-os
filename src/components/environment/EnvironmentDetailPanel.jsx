import React from 'react';
import { motion } from 'framer-motion';
import { X, Crown, Star, Lock, Fingerprint, Shield, ShoppingBag, Hammer, Swords, Trophy, Sparkles, Layers } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { RARITY_CONFIG, RARITY_STYLES, GLOBAL_HUB_UNLOCKS, xpForEnvRank, canImprint, isFeatureUnlocked, MASTERY_FLAGS } from './envProgressionConfig';

const STRUCTURE_ICONS = { shop: ShoppingBag, blacksmith: Hammer, arena: Swords, trophy_room: Trophy, guild_hall: Crown, enchanting: Sparkles, vault: Shield, portal: Layers };
const STRUCTURE_NAMES = { shop: 'Shop', blacksmith: 'Forge', arena: 'Arena', trophy_room: 'Trophies', guild_hall: 'Guild', enchanting: 'Enchant', vault: 'Vault', portal: 'Portal' };

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

  const gradientClass = rarity === 'Mythical' ? 'from-red-500 to-pink-500' :
    rarity === 'Legendary' ? 'from-amber-500 to-yellow-500' :
    rarity === 'Epic' ? 'from-purple-500 to-indigo-500' :
    rarity === 'Rare' ? 'from-blue-500 to-cyan-500' :
    'from-slate-400 to-slate-500';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
    >
      <div className="rounded-xl border border-white/10 overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)' }}>
        {/* Top: Banner + Info */}
        <div className="relative h-28">
          <img src={env.thumbnail_url || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80'} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20" />
          
          <button onClick={onClose} className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center backdrop-blur-sm border border-white/10 z-10">
            <X className="w-3.5 h-3.5 text-white/70" />
          </button>

          <div className="absolute bottom-3 left-4 right-4 z-10">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-white font-bold text-base">{env.name}</h3>
              <Badge className={`text-[8px] font-bold border px-1.5 py-0 ${rs.bg} ${rs.text} ${rs.border}`}>{rarity}</Badge>
              {config.soulbound && (
                <Badge className="text-[7px] bg-amber-500/20 text-amber-300 border-amber-500/30 px-1.5 py-0">
                  <Lock className="w-2 h-2 mr-0.5" />Soulbound
                </Badge>
              )}
            </div>
            <p className="text-white/40 text-[10px] line-clamp-1">{env.description || 'Environment instance'}</p>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Rank + XP */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${rs.border} bg-white/[0.03]`}>
                <Crown className={`w-4 h-4 ${rs.text}`} />
              </div>
              <div>
                <p className="text-white font-bold text-sm">Rank {rank}<span className="text-white/30 font-normal">/{config.maxRank}</span></p>
                <p className="text-[9px] text-white/30">{isMaxRank ? 'MAX RANK' : `${xp.toLocaleString()} / ${xpNeeded.toLocaleString()} XP`}</p>
              </div>
            </div>
            <div className="flex-1">
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div className={`h-full rounded-full bg-gradient-to-r ${gradientClass}`} style={{ width: isMaxRank ? '100%' : `${xpPercent}%` }} />
              </div>
            </div>
            {imprintEligible && (
              <Badge className="text-[8px] bg-red-500/15 text-red-300 border-red-500/25 px-2 py-0.5 flex items-center gap-1 flex-shrink-0">
                <Fingerprint className="w-3 h-3" /> Imprint Ready
              </Badge>
            )}
          </div>

          {/* Structures */}
          <div>
            <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest mb-2">Structures</p>
            <div className="grid grid-cols-4 gap-1.5">
              {Object.entries(STRUCTURE_ICONS).map(([key, Icon]) => {
                const level = structures[key] || 0;
                const globallyUnlocked = isFeatureUnlocked(key, globalHubLevel);
                const isBuilt = level > 0;
                const reqLevel = GLOBAL_HUB_UNLOCKS.find(u => u.featureId === key)?.level;

                return (
                  <div
                    key={key}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
                      !globallyUnlocked ? 'border-white/[0.04] bg-white/[0.01] opacity-30' :
                      isBuilt ? 'border-cyan-500/25 bg-cyan-500/[0.04]' :
                      'border-white/[0.06] bg-white/[0.02]'
                    }`}
                    title={!globallyUnlocked ? `Hub Level ${reqLevel} required` : `${STRUCTURE_NAMES[key]} Lv ${level}`}
                  >
                    {globallyUnlocked 
                      ? <Icon className={`w-3.5 h-3.5 ${isBuilt ? 'text-cyan-400' : 'text-white/25'}`} />
                      : <Lock className="w-3 h-3 text-white/15" />
                    }
                    <span className="text-[7px] text-white/40 font-medium">{STRUCTURE_NAMES[key]}</span>
                    {globallyUnlocked && <span className="text-[7px] text-white/20 font-bold">{level}</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mastery */}
          {masteryFlags.length > 0 && (
            <div>
              <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest mb-1.5">Mastery</p>
              <div className="flex flex-wrap gap-1">
                {masteryFlags.map(flag => {
                  const m = MASTERY_FLAGS[flag];
                  return (
                    <span key={flag} className="text-[8px] px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20">
                      {m?.label || flag}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Imprint section for Mythical */}
          {config.imprintable && !imprintEligible && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02]">
              <Fingerprint className="w-4 h-4 text-white/15 flex-shrink-0" />
              <p className="text-[9px] text-white/25">Reach max rank ({config.maxRank}) to create a sellable imprint.</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}