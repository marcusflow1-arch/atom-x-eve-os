import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

const RARITY_COLORS = {
  Common: 'border-slate-500/40 bg-slate-800/60',
  Uncommon: 'border-green-500/40 bg-green-900/20',
  Rare: 'border-blue-500/40 bg-blue-900/20',
  Epic: 'border-purple-500/40 bg-purple-900/20',
  Legendary: 'border-yellow-500/40 bg-yellow-900/20',
  Mythical: 'border-pink-500/40 bg-pink-900/20',
};

export default function StoreAchievementsStrip() {
  const [achievements, setAchievements] = useState([]);

  useEffect(() => {
    base44.entities.Achievement.list('-created_date', 12).then(res => {
      setAchievements(res?.data || res || []);
    }).catch(() => {});
  }, []);

  return (
    <div className="relative flex-1 h-full flex flex-col overflow-hidden px-3 pt-3 pb-2 min-w-0">
      {/* Label */}
      <span className="text-[9px] font-bold uppercase tracking-widest text-white/30 mb-2 pl-1">Achievements</span>

      {/* Cards grid */}
      <div className="flex-1 overflow-hidden">
        {achievements.length === 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="w-[44px] h-[52px] rounded-lg border border-white/10 bg-white/[0.03] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5 content-start">
            {achievements.map((ach) => {
              const colorClass = RARITY_COLORS[ach.rarity] || RARITY_COLORS.Common;
              return (
                <div
                  key={ach.id}
                  title={`${ach.title} — ${ach.rarity}`}
                  className={`w-[44px] h-[52px] rounded-lg border flex flex-col items-center justify-center gap-0.5 cursor-default transition-all hover:scale-105 ${colorClass}`}
                >
                  <span className="text-lg leading-none">{ach.icon || '🏆'}</span>
                  <span className="text-[7px] text-white/50 text-center leading-tight px-0.5 truncate w-full text-center">{ach.title?.slice(0, 6)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}