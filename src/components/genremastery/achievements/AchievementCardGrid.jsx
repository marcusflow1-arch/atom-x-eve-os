import React from 'react';
import { motion } from 'framer-motion';

const RARITY_COLOR = {
  Common: '#94a3b8',
  Uncommon: '#4ade80',
  Rare: '#60a5fa',
  Epic: '#c084fc',
  Legendary: '#fbbf24',
  Mythic: '#f472b6',
};

export default function AchievementCardGrid({ cards, onSelect }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      {cards.map((card, i) => {
        const color = RARITY_COLOR[card.rarity] || '#94a3b8';
        return (
          <motion.button
            key={card.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.02, 0.3) }}
            onClick={() => onSelect(card)}
            className="group text-left rounded-xl overflow-hidden transition-all hover:-translate-y-1"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
            }}
          >
            <div className="aspect-[3/4] w-full overflow-hidden bg-slate-900">
              {card.image ? (
                <img src={card.image} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900" />
              )}
            </div>
            <div className="p-2.5">
              <p className="text-white text-xs font-semibold truncate">{card.title}</p>
              <span
                className="mt-1.5 inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide"
                style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}
              >
                {card.rarity}
              </span>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}