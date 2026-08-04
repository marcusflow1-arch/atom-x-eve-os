import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Check, ChevronRight } from 'lucide-react';

const RARITY = {
  Common: '#94a3b8',
  Uncommon: '#4ade80',
  Rare: '#60a5fa',
  Epic: '#c084fc',
  Legendary: '#fb923c',
  Mythic: '#f87171',
  Mythical: '#f87171',
};

export default function AchievementRow({ item, index = 0, onClick }) {
  const accent = RARITY[item.rarity] || RARITY.Common;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3) }}
      onClick={() => onClick?.(item)}
      whileHover={{ x: 4 }}
      className="group flex items-center gap-4 rounded-2xl px-3 py-3 cursor-pointer transition-all"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <div
        className="w-11 h-14 rounded-xl overflow-hidden flex-shrink-0"
        style={{ border: `1px solid ${accent}55`, boxShadow: `0 0 14px ${accent}22` }}
      >
        {item.image
          ? <img src={item.image} alt="" className={`w-full h-full object-cover ${item.isUnlocked === false ? 'grayscale opacity-50' : ''}`} />
          : <div className="w-full h-full bg-white/5" />}
      </div>

      <div className="min-w-0 flex-1">
        <h4 className="text-white text-sm font-semibold truncate">{item.title}</h4>
        <p className="text-white/40 text-xs line-clamp-1 mt-0.5">{item.description}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <span
            className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-md"
            style={{ color: accent, background: `${accent}1f`, border: `1px solid ${accent}44` }}
          >
            {item.rarity}
          </span>
          {item.isPurchased && (
            <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-300/80">Bought</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {item.isUnlocked === false
          ? <Lock className="w-4 h-4 text-white/25" />
          : <Check className="w-4 h-4 text-emerald-400/80" />}
        <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors" />
      </div>
    </motion.div>
  );
}