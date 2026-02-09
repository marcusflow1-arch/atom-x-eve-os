import React from 'react';
import { motion } from 'framer-motion';
import { Globe, Zap, Shield, Star, TrendingUp } from 'lucide-react';
import { GLOBAL_HUB_UNLOCKS, xpForGlobalLevel } from './envProgressionConfig';

export default function HubProgressionHeader({ hubProgression, environmentCount }) {
  const level = hubProgression?.global_hub_level || 1;
  const xp = hubProgression?.global_hub_xp || 0;
  const xpNeeded = xpForGlobalLevel(level);
  const xpPercent = Math.min(Math.round((xp / xpNeeded) * 100), 100);
  const unlockedFeatures = hubProgression?.unlocked_features?.length || 0;
  const totalFeatures = GLOBAL_HUB_UNLOCKS.length;
  const masteryCount = hubProgression?.mastery_badges?.length || 0;
  const nextUnlock = GLOBAL_HUB_UNLOCKS.find(u => u.level > level);

  const stats = [
    { icon: Zap, value: `${xp.toLocaleString()}`, label: 'XP', color: 'text-yellow-400' },
    { icon: Shield, value: `${unlockedFeatures}/${totalFeatures}`, label: 'Features', color: 'text-blue-400' },
    { icon: Star, value: `${masteryCount}`, label: 'Mastery', color: 'text-purple-400' },
    { icon: TrendingUp, value: `${environmentCount}`, label: 'Worlds', color: 'text-emerald-400' },
  ];

  return (
    <div className="flex items-center gap-5">
      {/* Level Ring */}
      <div className="relative flex-shrink-0">
        <div className="w-14 h-14 rounded-full border-2 border-cyan-400/80 flex items-center justify-center bg-cyan-500/10">
          <span className="text-cyan-300 font-black text-xl">{level}</span>
        </div>
        <svg className="absolute inset-0 w-14 h-14 -rotate-90" viewBox="0 0 56 56">
          <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2.5" />
          <circle cx="28" cy="28" r="24" fill="none" stroke="#22d3ee" strokeWidth="2.5"
            strokeDasharray={`${(xpPercent / 100) * 151} 151`} strokeLinecap="round" />
        </svg>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4 className="text-white font-bold text-sm mb-1.5">Hub Level {level}</h4>
        
        {/* Compact stat pills */}
        <div className="flex items-center gap-2 mb-2">
          {stats.map((s, i) => (
            <div key={i} className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/[0.04] border border-white/[0.06]">
              <s.icon className={`w-3 h-3 ${s.color}`} />
              <span className="text-white font-bold text-[10px]">{s.value}</span>
              <span className="text-white/30 text-[9px]">{s.label}</span>
            </div>
          ))}
        </div>

        {/* XP Bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${xpPercent}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
            />
          </div>
          <span className="text-[9px] text-white/30 flex-shrink-0">{xpPercent}%</span>
        </div>

        {nextUnlock && (
          <p className="text-[9px] text-white/25 mt-1">
            Next: <span className="text-white/50">{nextUnlock.name}</span> at Lv {nextUnlock.level}
          </p>
        )}
      </div>
    </div>
  );
}