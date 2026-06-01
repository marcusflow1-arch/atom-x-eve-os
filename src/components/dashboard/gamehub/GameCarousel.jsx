import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const STATUS_COLORS = {
  Installed: 'bg-blue-500',
  'In Progress': 'bg-amber-500',
  New: 'bg-emerald-500',
  Playing: 'bg-green-400',
};

export default function GameCarousel({ games, selectedGame, onSelectGame }) {
  const scrollRef = useRef(null);

  const scroll = (dir) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir * 280, behavior: 'smooth' });
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="text-white font-bold text-lg tracking-wider uppercase">Your Games</h2>
        <div className="flex gap-2">
          <button
            onClick={() => scroll(-1)}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all border border-white/10"
          >
            <ChevronLeft className="w-4 h-4 text-white/70" />
          </button>
          <button
            onClick={() => scroll(1)}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all border border-white/10"
          >
            <ChevronRight className="w-4 h-4 text-white/70" />
          </button>
        </div>
      </div>

      {/* Scrollable Row */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-3"
        style={{ scrollbarWidth: 'none' }}
      >
        {games.map((game, i) => {
          const isSelected = selectedGame?.id === game.id;
          return (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              onClick={() => onSelectGame(game)}
              whileHover={{ scale: 1.05, y: -4 }}
              className="relative flex-shrink-0 cursor-pointer rounded-xl overflow-hidden"
              style={{
                width: 160,
                height: 220,
                boxShadow: isSelected
                  ? '0 0 0 2px rgba(34,211,238,0.8), 0 8px 32px rgba(34,211,238,0.25)'
                  : '0 4px 16px rgba(0,0,0,0.5)',
                transition: 'box-shadow 0.25s ease',
              }}
            >
              {/* Cover Image */}
              <img
                src={game.image}
                alt={game.title}
                className="absolute inset-0 w-full h-full object-cover"
              />

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

              {/* Selected glow ring */}
              {isSelected && (
                <div className="absolute inset-0 border-2 border-cyan-400 rounded-xl pointer-events-none" />
              )}

              {/* Status Badge */}
              <div className="absolute top-2 left-2">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${STATUS_COLORS[game.status] || 'bg-gray-600'}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-white/70 inline-block" />
                  {game.status}
                </span>
              </div>

              {/* Title */}
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-white font-bold text-sm leading-tight truncate">{game.title}</p>
                <p className="text-white/50 text-[11px] mt-0.5">{game.genre}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}