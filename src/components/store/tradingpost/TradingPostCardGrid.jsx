import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { generateGameCards } from './tradingPostMock';

const rarityRing = {
  Mythic: 'border-red-500/50',
  Legendary: 'border-orange-500/50',
  Epic: 'border-purple-500/50',
  Rare: 'border-blue-500/50',
  Uncommon: 'border-green-500/50',
  Common: 'border-slate-500/50',
};
const rarityText = {
  Mythic: 'text-red-400',
  Legendary: 'text-orange-400',
  Epic: 'text-purple-400',
  Rare: 'text-blue-400',
  Uncommon: 'text-green-400',
  Common: 'text-slate-400',
};

// Level 2: the cards (tradeable items) the selected game has. Click → listing board.
export default function TradingPostCardGrid({ game, filters, onSelectCard }) {
  const cards = useMemo(() => {
    const all = generateGameCards(game);
    return all.filter((c) => {
      if (filters.rarity.length > 0 && !filters.rarity.includes(c.rarity)) return false;
      if (c.marketPrice < filters.priceRange[0] || c.marketPrice > filters.priceRange[1]) return false;
      return true;
    });
  }, [game, filters]);

  return (
    <div className="h-full overflow-y-auto custom-scrollbar pr-2 pb-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {cards.map((card, idx) => (
          <motion.button
            key={card.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: Math.min(idx * 0.02, 0.3) }}
            whileHover={{ y: -6 }}
            onClick={() => onSelectCard(card)}
            className={`group text-left rounded-xl overflow-hidden border-2 ${rarityRing[card.rarity] || rarityRing.Common} bg-slate-900/60 hover:bg-slate-900 transition-all`}
          >
            <div className="aspect-square relative overflow-hidden bg-black">
              <img
                src={card.image}
                alt={card.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent opacity-70" />
              <span className="absolute top-2 left-2 text-[9px] font-bold uppercase tracking-wider bg-black/60 text-white/80 px-1.5 py-0.5 rounded">
                {card.type}
              </span>
            </div>
            <div className="p-2.5">
              <div className="flex items-center justify-between gap-1 mb-1">
                <h4 className="text-white text-xs font-bold truncate">{card.name}</h4>
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold uppercase ${rarityText[card.rarity] || rarityText.Common}`}>
                  {card.rarity}
                </span>
                <Badge className="bg-white/5 text-cyan-300 border-0 text-[10px] font-mono">
                  {card.marketPrice.toLocaleString()} AGP
                </Badge>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}