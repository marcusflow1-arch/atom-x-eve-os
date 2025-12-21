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

export default function DigitalAchievementCard({ title, icon = '🏆', rarity = 'Rare', unlocked = false, xp = 0, onClick }) {
  const style = RARITY_STYLES[rarity] || RARITY_STYLES.Rare;

  return (
    <div className={`relative ${style.glow}`}>
      {unlocked && (
        <div className="absolute -top-2 -right-2 z-10">
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-green-500/20 text-green-300 border border-green-500/30 uppercase tracking-wider">Unlocked</span>
        </div>
      )}
      <div className={`rounded-2xl ring-2 ${style.ring} ring-offset-0 ring-offset-slate-900/0`}>
        <ShinyCard onClick={onClick}>
          <div className="absolute inset-0 p-3 flex flex-col">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className={`border ${style.badge} px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold`}>{rarity}</Badge>
              <span className="text-[10px] text-white/50 font-mono">{xp} XP</span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="text-5xl drop-shadow-md select-none">
                {icon}
              </div>
            </div>

            <div className="mt-auto">
              <h4 className="text-white font-bold text-sm line-clamp-2 text-center px-2">
                {title}
              </h4>
            </div>
          </div>
        </ShinyCard>
      </div>
    </div>
  );
}