import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function DevGameGrid({ games, selectedGameId, onSelectGame }) {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-3">
      {games.map((game, idx) => {
        const isSelected = selectedGameId === game.id;
        return (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.02 }}
            whileHover={{ y: -4, scale: 1.03 }}
            onClick={() => onSelectGame(game)}
            className={`group relative aspect-[3/4] rounded-lg overflow-hidden cursor-pointer border transition-all ${
              isSelected
                ? 'border-cyan-400 ring-2 ring-cyan-400/30 shadow-lg shadow-cyan-500/20'
                : 'border-white/5 hover:border-white/20'
            }`}
          >
            <img
              src={game.cover}
              alt={game.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

            {/* Card count badge */}
            <div className="absolute top-1.5 right-1.5">
              <Badge variant="outline" className="text-[8px] h-4 px-1 border-white/20 text-white/60 bg-black/50 backdrop-blur-sm">
                {game.limitedCards.length} Cards
              </Badge>
            </div>

            {/* Bottom info */}
            <div className="absolute bottom-0 left-0 right-0 p-2">
              <h4 className="text-white font-bold text-[11px] leading-tight truncate mb-0.5">
                {game.title}
              </h4>
              <div className="flex items-center gap-1 text-[9px] text-white/50">
                <span>{game.genre}</span>
                <span className="text-white/20">•</span>
                <span>{game.year}</span>
              </div>
            </div>

            {/* Selection indicator */}
            {isSelected && (
              <motion.div
                layoutId="devGameSelection"
                className="absolute inset-0 border-2 border-cyan-400 rounded-lg pointer-events-none"
              />
            )}
          </motion.div>
        );
      })}
    </div>
  );
}