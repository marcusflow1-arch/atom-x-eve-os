import React from 'react';
import { motion } from 'framer-motion';
import { Gamepad2 } from 'lucide-react';

// Store-style small game boxes. Clicking a game advances to its cards.
export default function TradingPostGameGrid({ games, onSelectGame }) {
  if (!games.length) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500">
        <Gamepad2 className="w-16 h-16 mb-4 opacity-20" />
        <p className="text-lg font-medium">No games match your filters</p>
        <p className="text-sm opacity-60">Try adjusting the genre or rarity</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto custom-scrollbar pr-2 pb-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {games.map((game, idx) => (
          <motion.button
            key={game.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(idx * 0.02, 0.4) }}
            whileHover={{ y: -6 }}
            onClick={() => onSelectGame(game)}
            className="group text-left rounded-xl overflow-hidden border border-white/10 bg-slate-900/40 hover:border-cyan-400/50 transition-all"
          >
            <div className="aspect-[3/4] relative overflow-hidden bg-black">
              <img
                src={game.cover_image || game.image}
                alt={game.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
              <div className="absolute bottom-0 left-0 right-0 p-2.5">
                <h4 className="text-white text-xs font-bold truncate">{game.title}</h4>
                <p className="text-[10px] text-cyan-300/70 truncate">{game.genre}</p>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}