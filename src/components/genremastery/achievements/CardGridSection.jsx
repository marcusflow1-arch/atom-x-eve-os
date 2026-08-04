import React from 'react';
import { motion } from 'framer-motion';

const RARITY = {
  Common: '#94a3b8', Rare: '#60a5fa', Epic: '#c084fc', Legendary: '#fbbf24', Mythic: '#f87171',
};

export default function CardGridSection({ title, subtitle, icon: Icon, accent, items, onSelect }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-3">
        {Icon && <Icon className="w-4 h-4" style={{ color: accent }} />}
        <div>
          <h3 className="text-white font-bold text-sm uppercase tracking-wider">{title}</h3>
          {subtitle && <p className="text-white/30 text-[11px]">{subtitle}</p>}
        </div>
        <span className="ml-auto text-white/30 text-xs">{items.length}</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {items.map((card, i) => {
          const rarityColor = RARITY[card.rarity] || RARITY.Common;
          return (
            <motion.button
              key={card.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.4) }}
              onClick={() => onSelect?.(card)}
              className="group relative rounded-xl overflow-hidden text-left transition-all hover:scale-[1.03]"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${rarityColor}44`,
                boxShadow: `0 4px 18px rgba(0,0,0,0.35)`,
              }}
            >
              <div className="relative aspect-[3/4] overflow-hidden">
                {card.image ? (
                  <img src={card.image} alt={card.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                <span
                  className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider"
                  style={{ background: `${rarityColor}22`, color: rarityColor, border: `1px solid ${rarityColor}55` }}
                >
                  {card.rarity}
                </span>
                <div className="absolute bottom-0 left-0 right-0 p-2">
                  <p className="text-white text-[11px] font-bold leading-tight line-clamp-2">{card.title}</p>
                  <p className="text-white/40 text-[9px] truncate mt-0.5">{card.series}</p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}