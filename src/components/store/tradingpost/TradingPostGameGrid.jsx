import React from 'react';
import { motion } from 'framer-motion';
import { Gamepad2, Package, TrendingUp, ChevronRight } from 'lucide-react';
import { generateGameCards } from './tradingPostMock';

const rarityColors = {
  Mythic: 'text-red-400',
  Legendary: 'text-orange-400',
  Epic: 'text-purple-400',
  Rare: 'text-blue-400',
  Uncommon: 'text-green-400',
  Common: 'text-slate-400',
};

// Level 1: redesigned full-width game landing page.
export default function TradingPostGameGrid({ games, onSelectGame }) {
  if (!games.length) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500">
        <Gamepad2 className="w-16 h-16 mb-4 opacity-20" />
        <p className="text-lg font-medium">No games match your filters</p>
        <p className="text-sm opacity-60">Try adjusting the genre or search term</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto custom-scrollbar pr-1 pb-6">
      {/* Stats strip */}
      <div className="flex items-center gap-6 mb-5 px-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/15 flex items-center justify-center">
            <Gamepad2 className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-white/40 font-bold">Games</p>
            <p className="text-sm font-bold text-white">{games.length}</p>
          </div>
        </div>
        <div className="h-8 w-px bg-white/10" />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange-500/15 flex items-center justify-center">
            <Package className="w-4 h-4 text-orange-400" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-white/40 font-bold">Tradeable Items</p>
            <p className="text-sm font-bold text-white">
              {games.reduce((sum, g) => sum + generateGameCards(g).length, 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Game grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {games.map((game, idx) => {
          const cards = generateGameCards(game);
          const minPrice = Math.min(...cards.map((c) => c.marketPrice));
          const maxPrice = Math.max(...cards.map((c) => c.marketPrice));
          const topRarity = cards.reduce(
            (top, c) => (['Mythic', 'Legendary', 'Epic', 'Rare', 'Uncommon', 'Common'].indexOf(c.rarity) <
              ['Mythic', 'Legendary', 'Epic', 'Rare', 'Uncommon', 'Common'].indexOf(top)
                ? c.rarity : top),
            'Common'
          );

          return (
            <motion.button
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(idx * 0.025, 0.5) }}
              whileHover={{ y: -6 }}
              onClick={() => onSelectGame(game)}
              className="group relative text-left rounded-2xl overflow-hidden border border-white/10 bg-slate-900/50 hover:border-cyan-400/50 transition-all"
            >
              {/* Cover image */}
              <div className="aspect-[3/4] relative overflow-hidden bg-black">
                <img
                  src={game.cover_image || game.image}
                  alt={game.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />

                {/* Genre badge */}
                <span className="absolute top-2 left-2 text-[9px] font-bold uppercase tracking-wider bg-black/60 backdrop-blur-sm text-cyan-300 px-2 py-0.5 rounded-md border border-cyan-500/20">
                  {game.genre}
                </span>

                {/* Item count */}
                <span className="absolute top-2 right-2 text-[9px] font-bold bg-black/60 backdrop-blur-sm text-white/80 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Package className="w-2.5 h-2.5" />
                  {cards.length}
                </span>

                {/* Title + price */}
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <h4 className="text-white text-xs font-bold truncate mb-1">{game.title}</h4>
                  <div className="flex items-center justify-between">
                    <span className={`text-[9px] font-bold uppercase ${rarityColors[topRarity] || rarityColors.Common}`}>
                      {topRarity}
                    </span>
                    <span className="text-[9px] font-mono text-cyan-300/80">
                      {minPrice.toLocaleString()}–{maxPrice.toLocaleString()} AGP
                    </span>
                  </div>
                </div>
              </div>

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-cyan-500/0 group-hover:bg-cyan-500/5 transition-colors pointer-events-none" />
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-blue-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />

              {/* Quick-enter arrow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-cyan-500/90 flex items-center justify-center opacity-0 group-hover:opacity-100 scale-50 group-hover:scale-100 transition-all duration-300 shadow-lg shadow-cyan-500/40">
                <ChevronRight className="w-5 h-5 text-white" />
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}