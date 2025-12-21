import React from 'react';
import ShinyCard from '@/components/shared/ShinyCard';
import { Badge } from '@/components/ui/badge';

const RARITY_STYLES = {
  Mythic: {
    ring: 'ring-red-500/50',
    badge: 'bg-red-500/15 text-red-300 border-red-500/30',
    glow: 'shadow-[0_0_30px_rgba(239,68,68,0.25)]'
  },
  Legendary: {
    ring: 'ring-orange-500/50',
    badge: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
    glow: 'shadow-[0_0_30px_rgba(249,115,22,0.25)]'
  },
  Epic: {
    ring: 'ring-purple-500/50',
    badge: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    glow: 'shadow-[0_0_30px_rgba(168,85,247,0.25)]'
  },
  Rare: {
    ring: 'ring-blue-500/50',
    badge: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    glow: 'shadow-[0_0_30px_rgba(59,130,246,0.25)]'
  },
  Common: {
    ring: 'ring-slate-500/50',
    badge: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
    glow: 'shadow-[0_0_20px_rgba(148,163,184,0.2)]'
  }
};

export default function DigitalAchievementCard({ title, icon = '🏆', rarity = 'Rare', unlocked = false, xp = 0, onClick, size = 'normal' }) {
  const style = RARITY_STYLES[rarity] || RARITY_STYLES.Rare;
  
  // Small size is 30% of normal (70% reduction)
  const isSmall = size === 'small';

  return (
    <div className={`relative ${isSmall ? 'shadow-[0_0_10px_rgba(0,0,0,0.2)]' : style.glow}`}>
      {unlocked && !isSmall && (
        <div className="absolute -top-2 -right-2 z-10">
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-green-500/20 text-green-300 border border-green-500/30 uppercase tracking-wider">Unlocked</span>
        </div>
      )}
      {unlocked && isSmall && (
        <div className="absolute -top-1 -right-1 z-10">
          <span className="px-1 py-0.5 text-[6px] font-bold rounded-full bg-green-500/20 text-green-300 border border-green-500/30 uppercase tracking-wider">✓</span>
        </div>
      )}
      <div className={`${isSmall ? 'rounded-lg ring-1' : 'rounded-2xl ring-2'} ${style.ring} ring-offset-0 ring-offset-slate-900/0`}>
        <div 
          onClick={onClick}
          className={`relative ${isSmall ? 'w-16 h-20' : 'aspect-[3/4]'} rounded-${isSmall ? 'lg' : 'xl'} bg-slate-900/40 backdrop-blur-md border border-white/10 overflow-hidden cursor-pointer group shadow-lg transition-all hover:scale-105`}
        >
          <div className={`absolute inset-0 ${isSmall ? 'p-1' : 'p-3'} flex flex-col`}>
            {!isSmall && (
              <div className="flex items-center justify-between">
                <Badge variant="outline" className={`border ${style.badge} px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold`}>{rarity}</Badge>
                <span className="text-[10px] text-white/50 font-mono">{xp} XP</span>
              </div>
            )}

            <div className="flex-1 flex items-center justify-center">
              <div className={`${isSmall ? 'text-xl' : 'text-5xl'} drop-shadow-md select-none`}>
                {icon}
              </div>
            </div>

            <div className="mt-auto">
              <h4 className={`text-white font-bold ${isSmall ? 'text-[8px] line-clamp-1' : 'text-sm line-clamp-2'} text-center ${isSmall ? 'px-0.5' : 'px-2'}`}>
                {title}
              </h4>
            </div>
          </div>
          
          {/* Shine effect on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        </div>
      </div>
    </div>
  );
}