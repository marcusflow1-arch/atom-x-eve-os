import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

const RARITY_STYLES = {
  Common:    { border: 'border-slate-500/50',  bg: 'bg-slate-800/80',   glow: '',                          icon: 'text-slate-300' },
  Uncommon:  { border: 'border-green-500/50',  bg: 'bg-green-900/30',   glow: '',                          icon: 'text-green-300' },
  Rare:      { border: 'border-blue-500/60',   bg: 'bg-blue-900/30',    glow: 'shadow-[0_0_8px_rgba(59,130,246,0.3)]',  icon: 'text-blue-300' },
  Epic:      { border: 'border-purple-500/60', bg: 'bg-purple-900/30',  glow: 'shadow-[0_0_8px_rgba(168,85,247,0.35)]', icon: 'text-purple-300' },
  Legendary: { border: 'border-yellow-500/60', bg: 'bg-yellow-900/20',  glow: 'shadow-[0_0_10px_rgba(234,179,8,0.4)]',  icon: 'text-yellow-300' },
  Mythical:  { border: 'border-pink-500/60',   bg: 'bg-pink-900/20',    glow: 'shadow-[0_0_10px_rgba(236,72,153,0.4)]', icon: 'text-pink-300' },
};

export default function StoreAchievementsStrip() {
  const [achievements, setAchievements] = useState([]);

  useEffect(() => {
    base44.entities.Achievement.list('-created_date', 12).then(res => {
      setAchievements(res?.data || res || []);
    }).catch(() => {});
  }, []);

  const items = achievements.length > 0 ? achievements : Array.from({ length: 10 }).map((_, i) => ({ id: i, _placeholder: true }));

  return (
    <div className="h-full flex flex-col overflow-hidden px-3 pt-3 pb-2 min-w-0">
      {/* Label */}
      <span className="text-[9px] font-bold uppercase tracking-widest text-white/30 mb-2 pl-1">Achievements</span>

      {/* Cards grid */}
      <div className="flex-1 overflow-hidden">
        <div className="flex flex-wrap gap-2 content-start">
          {items.map((ach, i) => {
            if (ach._placeholder) {
              return <div key={i} className="w-[58px] h-[76px] rounded-xl border border-white/10 bg-white/[0.03] animate-pulse" />;
            }
            const style = RARITY_STYLES[ach.rarity] || RARITY_STYLES.Common;
            return (
              <div
                key={ach.id}
                title={`${ach.title} — ${ach.rarity}`}
                className={`w-[58px] h-[76px] rounded-xl border flex flex-col items-center justify-center gap-1 cursor-default transition-all hover:scale-105 hover:brightness-110 ${style.border} ${style.bg} ${style.glow}`}
              >
                {/* Icon area */}
                <div className={`w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center text-xl leading-none ${style.icon}`}>
                  {ach.icon || '⚡'}
                </div>
                {/* Title */}
                <span className="text-[7px] text-white/70 text-center leading-tight px-1 font-semibold line-clamp-1 w-full text-center">{ach.title?.slice(0, 8)}</span>
                {/* Subtitle */}
                <span className="text-[6px] text-white/30 text-center leading-tight px-1">
                  {ach.rarity || 'Standard'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}